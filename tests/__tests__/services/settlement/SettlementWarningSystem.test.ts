/**
 * Settlement Warning System Tests - Story 3.3, Task 3
 * Tests for manual adjustment detection, warning classification,
 * real-time monitoring, and automatic correction suggestions
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import {
  ManualAdjustmentType,
  WarningClassification,
  SettlementWarningExtended
} from '../../../../src/types/settlement';

// Mock the dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('SettlementWarningSystem', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'test-session-123';
  const mockPlayers = [
    { id: 'player1', name: 'Alice', currentBalance: 1000, status: 'active' },
    { id: 'player2', name: 'Bob', currentBalance: 800, status: 'active' },
    { id: 'player3', name: 'Charlie', currentBalance: 1200, status: 'active' }
  ];

  const mockTransactions = [
    { id: 'tx1', playerId: 'player1', type: 'buy_in', amount: 500, timestamp: new Date(), isVoided: false },
    { id: 'tx2', playerId: 'player2', type: 'buy_in', amount: 500, timestamp: new Date(), isVoided: false },
    { id: 'tx3', playerId: 'player3', type: 'buy_in', amount: 500, timestamp: new Date(), isVoided: false }
  ];

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockDatabaseService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn().mockResolvedValue({ id: mockSessionId, status: 'active' }),
      getPlayers: jest.fn().mockResolvedValue(mockPlayers)
    } as any;

    mockTransactionService = {
      getInstance: jest.fn().mockReturnThis(),
      getTransactionHistory: jest.fn().mockResolvedValue(mockTransactions)
    } as any;

    // Mock static getInstance methods
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);

    // Get service instance and initialize
    settlementService = SettlementService.getInstance();
    await settlementService.initialize();
  });

  describe('Real-time Monitoring', () => {
    it('should start real-time monitoring successfully', async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      const monitoringState = settlementService.getMonitoringState(mockSessionId);
      expect(monitoringState).toBeDefined();
      expect(monitoringState?.isMonitoring).toBe(true);
      expect(monitoringState?.sessionId).toBe(mockSessionId);
      expect(monitoringState?.balanceHistory).toHaveLength(1);
      expect(monitoringState?.activeWarnings).toHaveLength(0);
      expect(monitoringState?.adjustmentHistory).toHaveLength(0);
    });

    it('should stop real-time monitoring', async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
      settlementService.stopRealTimeMonitoring(mockSessionId);
      
      const monitoringState = settlementService.getMonitoringState(mockSessionId);
      expect(monitoringState?.isMonitoring).toBe(false);
    });

    it('should track balance history during monitoring', async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      const monitoringState = settlementService.getMonitoringState(mockSessionId);
      expect(monitoringState?.balanceHistory).toHaveLength(1);
      
      const balanceSnapshot = monitoringState?.balanceHistory[0];
      expect(balanceSnapshot?.totalBuyIns).toBeGreaterThan(0);
      expect(balanceSnapshot?.totalChipsInPlay).toBeGreaterThan(0);
      expect(balanceSnapshot?.playerCount).toBe(3);
    });
  });

  describe('Manual Adjustment Detection', () => {
    beforeEach(async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
    });

    it('should record manual adjustment without warnings for small changes', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1010, // Small $10 adjustment
        'test-user',
        'Minor chip count correction'
      );

      expect(warnings).toHaveLength(0);
      
      const monitoringState = settlementService.getMonitoringState(mockSessionId);
      expect(monitoringState?.adjustmentHistory).toHaveLength(1);
      
      const adjustment = monitoringState?.adjustmentHistory[0];
      expect(adjustment?.adjustmentType).toBe(ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT);
      expect(adjustment?.balanceImpact).toBe(10);
      expect(adjustment?.adjustedBy).toBe('test-user');
    });

    it('should generate warning for large manual adjustments', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1200, // Large $200 adjustment
        'test-user',
        'Major chip count correction'
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('LARGE_ADJUSTMENT');
      expect(warnings[0].severity).toBe(WarningClassification.MAJOR);
      expect(warnings[0].affectedPlayers).toContain('player1');
      expect(warnings[0].balanceImpact).toBe(200);
      expect(warnings[0].requiresApproval).toBe(true);
    });

    it('should generate critical warning for very large adjustments', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1600, // Very large $600 adjustment
        'test-user',
        'Major buy-in correction'
      );

      expect(warnings).toHaveLength(1);
      expect(warnings[0].code).toBe('LARGE_ADJUSTMENT');
      expect(warnings[0].severity).toBe(WarningClassification.CRITICAL);
      expect(warnings[0].canProceed).toBe(true);
      expect(warnings[0].requiresApproval).toBe(true);
    });

    it('should detect frequent adjustments pattern', async () => {
      // Make multiple adjustments within 30 minutes
      for (let i = 0; i < 5; i++) {
        await settlementService.recordManualAdjustment(
          mockSessionId,
          'player1',
          ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
          'currentBalance',
          1000 + (i * 10),
          1000 + ((i + 1) * 10),
          'test-user',
          `Adjustment ${i + 1}`
        );
      }

      const activeWarnings = settlementService.getActiveWarnings(mockSessionId);
      const frequentAdjustmentWarning = activeWarnings.find(w => w.code === 'FREQUENT_ADJUSTMENTS');
      
      expect(frequentAdjustmentWarning).toBeDefined();
      expect(frequentAdjustmentWarning?.severity).toBe(WarningClassification.MAJOR);
      expect(frequentAdjustmentWarning?.message).toContain('5 in last 30 minutes');
    });
  });

  describe('Warning Classification System', () => {
    beforeEach(async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
    });

    it('should classify balance discrepancy warnings correctly', async () => {
      // Mock unbalanced transaction data to create discrepancy
      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player1', type: 'buy_in', amount: 5.50, timestamp: new Date(), isVoided: false } // Creates $5.50 discrepancy
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.BUY_IN_ADJUSTMENT,
        'buyIn',
        500,
        505.50,
        'test-user'
      );

      // Should generate critical warning for $5.50 discrepancy (above $5.00 threshold)
      const balanceWarning = warnings.find(w => w.code === 'BALANCE_DISCREPANCY');
      expect(balanceWarning).toBeDefined();
      expect(balanceWarning?.severity).toBe(WarningClassification.CRITICAL);
      expect(balanceWarning?.canProceed).toBe(false);
      expect(balanceWarning?.requiresApproval).toBe(true);
    });

    it('should generate major warnings for moderate discrepancies', async () => {
      // Mock transaction data to create moderate discrepancy
      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player1', type: 'buy_in', amount: 2.00, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.BUY_IN_ADJUSTMENT,
        'buyIn',
        500,
        502.00,
        'test-user'
      );

      const balanceWarning = warnings.find(w => w.code === 'BALANCE_DISCREPANCY');
      expect(balanceWarning?.severity).toBe(WarningClassification.MAJOR);
      expect(balanceWarning?.canProceed).toBe(true);
      expect(balanceWarning?.requiresApproval).toBe(false);
    });

    it('should generate minor warnings for small discrepancies', async () => {
      // Mock transaction data to create small discrepancy
      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player1', type: 'buy_in', amount: 0.25, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.BUY_IN_ADJUSTMENT,
        'buyIn',
        500,
        500.25,
        'test-user'
      );

      const balanceWarning = warnings.find(w => w.code === 'BALANCE_DISCREPANCY');
      expect(balanceWarning?.severity).toBe(WarningClassification.MINOR);
      expect(balanceWarning?.canProceed).toBe(true);
      expect(balanceWarning?.requiresApproval).toBe(false);
    });
  });

  describe('Automatic Correction Suggestions', () => {
    beforeEach(async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
    });

    it('should generate automatic correction for small discrepancies', async () => {
      // Mock small discrepancy that qualifies for auto-correction
      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player1', type: 'buy_in', amount: 0.75, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.BUY_IN_ADJUSTMENT,
        'buyIn',
        500,
        500.75,
        'test-user'
      );

      const balanceWarning = warnings.find(w => w.code === 'BALANCE_DISCREPANCY');
      expect(balanceWarning?.autoCorrection).toBeDefined();
      expect(balanceWarning?.autoCorrection?.type).toBe('automatic');
      expect(balanceWarning?.autoCorrection?.corrections).toHaveLength(3); // 3 active players
      expect(balanceWarning?.autoCorrection?.isReversible).toBe(true);
    });

    it('should not generate automatic correction for large discrepancies', async () => {
      // Mock large discrepancy that exceeds auto-correction threshold
      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player1', type: 'buy_in', amount: 5.00, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.BUY_IN_ADJUSTMENT,
        'buyIn',
        500,
        505.00,
        'test-user'
      );

      const balanceWarning = warnings.find(w => w.code === 'BALANCE_DISCREPANCY');
      expect(balanceWarning?.autoCorrection).toBeUndefined();
    });

    it('should provide suggested actions for all warning severities', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1200,
        'test-user'
      );

      const warning = warnings[0];
      expect(warning.suggestedActions).toBeDefined();
      expect(warning.suggestedActions.length).toBeGreaterThan(0);
      expect(warning.suggestedActions).toContain('Verify the adjustment with game participants');
    });
  });

  describe('Warning Persistence and Tracking', () => {
    beforeEach(async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
    });

    it('should persist warnings for audit purposes', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1200,
        'test-user'
      );

      expect(warnings).toHaveLength(1);
      
      const activeWarnings = settlementService.getActiveWarnings(mockSessionId);
      expect(activeWarnings).toHaveLength(1);
      
      const warningHistory = settlementService.getWarningHistory(mockSessionId);
      expect(warningHistory).toHaveLength(1);
      expect(warningHistory[0].warningData.warningId).toBe(warnings[0].warningId);
    });

    it('should resolve warnings and update audit trail', async () => {
      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player1',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        1000,
        1200,
        'test-user'
      );

      const warningId = warnings[0].warningId;
      
      await settlementService.resolveWarning(
        warningId,
        'admin-user',
        'Verified adjustment with game participants'
      );

      const activeWarnings = settlementService.getActiveWarnings(mockSessionId);
      expect(activeWarnings).toHaveLength(0);

      const warningHistory = settlementService.getWarningHistory(mockSessionId);
      expect(warningHistory[0].warningData.isResolved).toBe(true);
      expect(warningHistory[0].warningData.resolvedBy).toBe('admin-user');
      expect(warningHistory[0].auditTrail).toHaveLength(2); // Created + Resolved
    });

    it('should handle warning resolution for non-existent warnings', async () => {
      await expect(
        settlementService.resolveWarning('non-existent-warning', 'admin-user', 'Test resolution')
      ).rejects.toThrow('Warning non-existent-warning not found');
    });
  });

  describe('Player Position Warnings', () => {
    beforeEach(async () => {
      await settlementService.startRealTimeMonitoring(mockSessionId);
    });

    it('should detect large negative player positions', async () => {
      // Mock player with large negative position
      mockDatabaseService.getPlayers.mockResolvedValue([
        ...mockPlayers,
        { id: 'player4', name: 'David', currentBalance: 0, status: 'active' } // Large loser
      ]);

      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player4', type: 'buy_in', amount: 1200, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player4',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        50,
        0,
        'test-user'
      );

      const positionWarning = warnings.find(w => w.code === 'LARGE_NEGATIVE_POSITION');
      expect(positionWarning).toBeDefined();
      expect(positionWarning?.severity).toBe(WarningClassification.MAJOR);
      expect(positionWarning?.affectedPlayers).toContain('player4');
      expect(positionWarning?.requiresApproval).toBe(true);
    });

    it('should detect large positive player positions', async () => {
      // Mock player with large positive position
      mockDatabaseService.getPlayers.mockResolvedValue([
        ...mockPlayers,
        { id: 'player4', name: 'David', currentBalance: 2500, status: 'active' } // Big winner
      ]);

      mockTransactionService.getTransactionHistory.mockResolvedValue([
        ...mockTransactions,
        { id: 'tx4', playerId: 'player4', type: 'buy_in', amount: 500, timestamp: new Date(), isVoided: false }
      ]);

      const warnings = await settlementService.recordManualAdjustment(
        mockSessionId,
        'player4',
        ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
        'currentBalance',
        2400,
        2500,
        'test-user'
      );

      const positionWarning = warnings.find(w => w.code === 'LARGE_POSITIVE_POSITION');
      expect(positionWarning).toBeDefined();
      expect(positionWarning?.severity).toBe(WarningClassification.MINOR);
      expect(positionWarning?.affectedPlayers).toContain('player4');
      expect(positionWarning?.requiresApproval).toBe(false);
    });
  });

  describe('Warning System Configuration', () => {
    it('should allow updating warning system configuration', () => {
      const newConfig = {
        criticalBalanceThreshold: 10.00,
        majorBalanceThreshold: 2.00,
        enableAutoCorrection: false
      };

      settlementService.updateWarningSystemConfig(newConfig);
      
      const currentConfig = settlementService.getWarningSystemConfig();
      expect(currentConfig.criticalBalanceThreshold).toBe(10.00);
      expect(currentConfig.majorBalanceThreshold).toBe(2.00);
      expect(currentConfig.enableAutoCorrection).toBe(false);
    });

    it('should have sensible default configuration', () => {
      const config = settlementService.getWarningSystemConfig();
      
      expect(config.enableRealTimeMonitoring).toBe(true);
      expect(config.criticalBalanceThreshold).toBe(5.00);
      expect(config.majorBalanceThreshold).toBe(1.00);
      expect(config.minorBalanceThreshold).toBe(0.10);
      expect(config.enableAutoCorrection).toBe(true);
      expect(config.autoCorrectThreshold).toBe(1.00);
      expect(config.requireApprovalThreshold).toBe(10.00);
      expect(config.persistWarnings).toBe(true);
      expect(config.maxWarningHistory).toBe(100);
      expect(config.auditTrailRetentionDays).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should handle monitoring start failures gracefully', async () => {
      mockDatabaseService.getPlayers.mockRejectedValue(new Error('Database connection failed'));
      
      await expect(
        settlementService.startRealTimeMonitoring(mockSessionId)
      ).rejects.toThrow('Failed to start real-time monitoring');
    });

    it('should handle adjustment recording failures gracefully', async () => {
      mockDatabaseService.getPlayers.mockRejectedValue(new Error('Database error'));
      
      await expect(
        settlementService.recordManualAdjustment(
          mockSessionId,
          'player1',
          ManualAdjustmentType.CHIP_COUNT_ADJUSTMENT,
          'currentBalance',
          1000,
          1100,
          'test-user'
        )
      ).rejects.toThrow('Failed to record manual adjustment');
    });
  });
});