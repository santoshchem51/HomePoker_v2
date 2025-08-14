/**
 * Warning System Manual Adjustment Scenarios Tests - Story 3.3, Task 10
 * Tests for warning system with comprehensive manual adjustment scenarios (AC 3)
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  SettlementWarningExtended,
  WarningClassification,
  ManualAdjustmentType,
  RealTimeMonitoringState,
  WarningSystemConfig,
  SettlementCorrection,
  Player,
  Transaction
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

describe('Warning System Manual Adjustment Scenarios - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'warning-system-session';

  beforeEach(() => {
    // Clear singleton instance
    (SettlementService as any).instance = undefined;
    
    // Create mock instances
    mockDatabaseService = {
      getInstance: jest.fn().mockReturnThis(),
      initialize: jest.fn().mockResolvedValue(undefined),
      getSession: jest.fn(),
      getPlayers: jest.fn(),
    } as any;
    
    mockTransactionService = {
      getInstance: jest.fn().mockReturnThis(),
      getSessionTransactions: jest.fn(),
      getTransactionHistory: jest.fn(),
    } as any;
    
    // Setup getInstance mocks
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);
    
    settlementService = SettlementService.getInstance();
    
    // Setup basic session mock
    mockDatabaseService.getSession.mockResolvedValue({
      id: mockSessionId,
      name: 'Warning System Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Stop any monitoring that might be running
    settlementService.stopRealTimeMonitoring(mockSessionId);
  });

  describe('Real-time Balance Monitoring', () => {
    it('should start and stop real-time monitoring correctly', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      
      // Start monitoring
      const monitoringResult = await settlementService.startRealTimeMonitoring(mockSessionId);
      expect(monitoringResult.success).toBe(true);
      expect(monitoringResult.monitoringId).toBeDefined();
      
      // Verify monitoring is active
      const monitoringState = await settlementService.getRealTimeMonitoringState(mockSessionId);
      expect(monitoringState.isActive).toBe(true);
      expect(monitoringState.sessionId).toBe(mockSessionId);
      expect(monitoringState.lastCheck).toBeDefined();
      expect(monitoringState.balanceSnapshots.length).toBeGreaterThan(0);
      
      // Stop monitoring
      const stopResult = await settlementService.stopRealTimeMonitoring(mockSessionId);
      expect(stopResult.success).toBe(true);
      
      // Verify monitoring is stopped
      const stoppedState = await settlementService.getRealTimeMonitoringState(mockSessionId);
      expect(stoppedState.isActive).toBe(false);
    });

    it('should take balance snapshots during monitoring', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 50.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Wait for initial snapshot
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const monitoringState = await settlementService.getRealTimeMonitoringState(mockSessionId);
      expect(monitoringState.balanceSnapshots.length).toBeGreaterThan(0);
      
      const snapshot = monitoringState.balanceSnapshots[0];
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.totalBalance).toBe(200.00);
      expect(snapshot.playerBalances['p1']).toBe(150.00);
      expect(snapshot.playerBalances['p2']).toBe(50.00);
      expect(snapshot.bankBalance).toBeDefined();
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });
  });

  describe('Manual Adjustment Detection and Warning Generation', () => {
    it('should detect small balance discrepancy and generate minor warning', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.15, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.85, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Record manual adjustment that creates small discrepancy
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.15,
        'Correcting small chip count discrepancy'
      );
      
      expect(adjustment.adjustmentId).toBeDefined();
      expect(adjustment.balanceImpact).toBeDefined();
      expect(adjustment.warningsGenerated.length).toBeGreaterThan(0);
      
      // Should generate minor warning
      const warning = adjustment.warningsGenerated[0];
      expect(warning.severity).toBe(WarningClassification.MINOR);
      expect(warning.code).toBe('BALANCE_DISCREPANCY');
      expect(warning.balanceDiscrepancy).toBe(0.15);
      expect(warning.canProceed).toBe(true);
      expect(warning.requiresApproval).toBe(false);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should detect major balance discrepancy and generate major warning', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 102.50, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 97.50, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Record manual adjustment that creates major discrepancy
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.PLAYER_POSITION_OVERRIDE,
        2.50,
        'Manual override of player position'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.severity).toBe(WarningClassification.MAJOR);
      expect(warning.code).toBe('BALANCE_DISCREPANCY');
      expect(warning.balanceDiscrepancy).toBe(2.50);
      expect(warning.canProceed).toBe(true);
      expect(warning.requiresApproval).toBe(true);
      expect(warning.suggestedCorrection).toBeDefined();
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should detect critical balance discrepancy and generate critical warning', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 110.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 90.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Record manual adjustment that creates critical discrepancy
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.SETTLEMENT_OVERRIDE,
        10.00,
        'Major settlement adjustment'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.severity).toBe(WarningClassification.CRITICAL);
      expect(warning.code).toBe('BALANCE_DISCREPANCY');
      expect(warning.balanceDiscrepancy).toBe(10.00);
      expect(warning.canProceed).toBe(false); // Critical warnings block settlement
      expect(warning.requiresApproval).toBe(true);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should detect large adjustment amount warnings', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 250.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 250.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Record large adjustment (>$100)
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.REBUY_ADJUSTMENT,
        150.00,
        'Large rebuy adjustment'
      );
      
      const largeAdjustmentWarning = adjustment.warningsGenerated.find(w => 
        w.code === 'LARGE_ADJUSTMENT'
      );
      expect(largeAdjustmentWarning).toBeDefined();
      expect(largeAdjustmentWarning!.severity).toBe(WarningClassification.MAJOR);
      expect(largeAdjustmentWarning!.requiresApproval).toBe(true);
      expect(largeAdjustmentWarning!.message).toContain('$150.00');
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should detect frequent adjustment pattern warnings', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Record multiple adjustments in short time
      for (let i = 0; i < 6; i++) {
        await settlementService.recordManualAdjustment(
          mockSessionId,
          'p1',
          ManualAdjustmentType.BALANCE_CORRECTION,
          1.00,
          `Adjustment ${i + 1}`
        );
        await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      }
      
      const activeWarnings = await settlementService.getActiveWarnings(mockSessionId);
      const frequentWarning = activeWarnings.find(w => w.code === 'FREQUENT_ADJUSTMENTS');
      
      expect(frequentWarning).toBeDefined();
      expect(frequentWarning!.severity).toBe(WarningClassification.MAJOR);
      expect(frequentWarning!.message).toContain('6 adjustments');
      expect(frequentWarning!.message).toContain('30 minutes');
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should detect player position warnings', async () => {
      const players: Player[] = [
        { id: 'big_winner', name: 'BigWinner', currentBalance: 2500.00, status: 'active' },
        { id: 'big_loser', name: 'BigLoser', currentBalance: 0.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'big_winner', type: 'buy_in', amount: 500.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'big_loser', type: 'buy_in', amount: 500.00, timestamp: new Date(), isVoided: false },
        { id: 'tx3', sessionId: mockSessionId, playerId: 'big_loser', type: 'buy_in', amount: 1000.00, timestamp: new Date(), isVoided: false }, // Large loss
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // This should trigger position warnings automatically
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const activeWarnings = await settlementService.getActiveWarnings(mockSessionId);
      
      const largePositiveWarning = activeWarnings.find(w => 
        w.code === 'LARGE_POSITIVE_POSITION' && w.affectedPlayers.includes('big_winner')
      );
      expect(largePositiveWarning).toBeDefined();
      expect(largePositiveWarning!.severity).toBe(WarningClassification.MINOR);
      
      const largeNegativeWarning = activeWarnings.find(w => 
        w.code === 'LARGE_NEGATIVE_POSITION' && w.affectedPlayers.includes('big_loser')
      );
      expect(largeNegativeWarning).toBeDefined();
      expect(largeNegativeWarning!.severity).toBe(WarningClassification.MAJOR);
      expect(largeNegativeWarning!.requiresApproval).toBe(true);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });
  });

  describe('Automatic Correction System', () => {
    it('should generate automatic correction for small discrepancies', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.50, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.50, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.50,
        'Small correction'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.autoCorrection).toBeDefined();
      
      const correction = warning.autoCorrection!;
      expect(correction.correctionType).toBe('PROPORTIONAL_DISTRIBUTION');
      expect(correction.amount).toBe(0.50);
      expect(correction.affectedPlayers.length).toBe(2);
      expect(correction.isReversible).toBe(true);
      expect(correction.description).toContain('distribute');
      expect(correction.description).toContain('$0.50');
      
      // Correction should be proportional
      const p1Correction = correction.playerAdjustments['p1'];
      const p2Correction = correction.playerAdjustments['p2'];
      expect(p1Correction + p2Correction).toBeCloseTo(0.50, 2);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should not auto-correct large discrepancies', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 50.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.SETTLEMENT_OVERRIDE,
        50.00,
        'Large override'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.autoCorrection).toBeUndefined(); // No auto-correction for large amounts
      expect(warning.requiresApproval).toBe(true);
      expect(warning.canProceed).toBe(false); // Should block settlement
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should generate reversible corrections with rollback capability', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.25, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.75, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.25,
        'Reversible correction test'
      );
      
      const warning = adjustment.warningsGenerated[0];
      const correction = warning.autoCorrection!;
      
      expect(correction.isReversible).toBe(true);
      expect(correction.rollbackInstructions).toBeDefined();
      expect(correction.rollbackInstructions).toContain('reverse');
      expect(correction.rollbackInstructions).toContain('adjustment');
      
      // Verify rollback calculation
      const rollbackTotal = Object.values(correction.playerAdjustments)
        .reduce((sum, adj) => sum + adj, 0);
      expect(Math.abs(rollbackTotal - 0.25)).toBeLessThan(0.01);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });
  });

  describe('Warning Resolution and Audit Trail', () => {
    it('should resolve warnings with proper audit trail', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 101.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Generate warning
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        1.00,
        'Test warning for resolution'
      );
      
      const warningId = adjustment.warningsGenerated[0].warningId;
      
      // Resolve warning
      const resolution = await settlementService.resolveWarning(
        mockSessionId,
        warningId,
        'accepted',
        'Manual approval by session organizer'
      );
      
      expect(resolution.success).toBe(true);
      expect(resolution.auditTrail).toBeDefined();
      expect(resolution.auditTrail.resolution).toBe('accepted');
      expect(resolution.auditTrail.resolvedAt).toBeDefined();
      expect(resolution.auditTrail.resolvedBy).toBe('system');
      expect(resolution.auditTrail.resolutionReason).toBe('Manual approval by session organizer');
      
      // Warning should no longer be active
      const activeWarnings = await settlementService.getActiveWarnings(mockSessionId);
      expect(activeWarnings.find(w => w.warningId === warningId)).toBeUndefined();
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should maintain warning history with full audit trail', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Generate and resolve multiple warnings
      for (let i = 0; i < 3; i++) {
        const adjustment = await settlementService.recordManualAdjustment(
          mockSessionId,
          'p1',
          ManualAdjustmentType.BALANCE_CORRECTION,
          0.50,
          `Test warning ${i + 1}`
        );
        
        const warningId = adjustment.warningsGenerated[0].warningId;
        await settlementService.resolveWarning(
          mockSessionId,
          warningId,
          'accepted',
          `Resolution ${i + 1}`
        );
      }
      
      // Check warning history
      const history = await settlementService.getWarningHistory(mockSessionId);
      expect(history.length).toBe(3);
      
      history.forEach((historyEntry, index) => {
        expect(historyEntry.warning).toBeDefined();
        expect(historyEntry.auditTrail).toBeDefined();
        expect(historyEntry.auditTrail.resolution).toBe('accepted');
        expect(historyEntry.auditTrail.resolutionReason).toBe(`Resolution ${index + 1}`);
      });
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should track warning metrics and resolution rates', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Generate warnings of different severities
      const warnings = [];
      
      // Minor warning
      let adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.15,
        'Minor test'
      );
      warnings.push(adjustment.warningsGenerated[0].warningId);
      
      // Major warning
      adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.PLAYER_POSITION_OVERRIDE,
        1.50,
        'Major test'
      );
      warnings.push(adjustment.warningsGenerated[0].warningId);
      
      // Critical warning
      adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.SETTLEMENT_OVERRIDE,
        5.00,
        'Critical test'
      );
      warnings.push(adjustment.warningsGenerated[0].warningId);
      
      // Resolve first two warnings
      await settlementService.resolveWarning(mockSessionId, warnings[0], 'accepted', 'OK');
      await settlementService.resolveWarning(mockSessionId, warnings[1], 'rejected', 'Not OK');
      
      // Check metrics
      const metrics = await settlementService.getWarningMetrics(mockSessionId);
      expect(metrics.totalWarnings).toBe(3);
      expect(metrics.activeWarnings).toBe(1);
      expect(metrics.resolvedWarnings).toBe(2);
      expect(metrics.resolutionRate).toBeCloseTo(66.67, 2);
      expect(metrics.warningsBySeverity.minor).toBe(1);
      expect(metrics.warningsBySeverity.major).toBe(1);
      expect(metrics.warningsBySeverity.critical).toBe(1);
      expect(metrics.averageResolutionTime).toBeGreaterThan(0);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });
  });

  describe('Warning System Configuration', () => {
    it('should support custom warning thresholds', async () => {
      const customConfig: WarningSystemConfig = {
        criticalThreshold: 2.00,      // Lower critical threshold
        majorThreshold: 0.50,         // Lower major threshold  
        minorThreshold: 0.05,         // Lower minor threshold
        autoCorrectionThreshold: 0.25, // Lower auto-correction threshold
        approvalThreshold: 5.00,      // Lower approval threshold
        largeAdjustmentThreshold: 50.00, // Lower large adjustment threshold
        frequentAdjustmentCount: 3,   // Fewer adjustments to trigger warning
        frequentAdjustmentWindow: 15, // Shorter time window (15 minutes)
        monitoringInterval: 10,       // More frequent monitoring (10 seconds)
        warningHistoryLimit: 50,      // Fewer warnings in history
        warningRetentionDays: 15      // Shorter retention period
      };

      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.75, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.25, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      
      // Update configuration
      await settlementService.updateWarningSystemConfiguration(mockSessionId, customConfig);
      
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // This should now trigger a major warning instead of minor (due to lower threshold)
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.75,
        'Custom threshold test'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.severity).toBe(WarningClassification.MAJOR); // Would be minor with default thresholds
      expect(warning.requiresApproval).toBe(true);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should respect configuration for auto-correction eligibility', async () => {
      const restrictiveConfig: WarningSystemConfig = {
        criticalThreshold: 5.00,
        majorThreshold: 1.00,
        minorThreshold: 0.10,
        autoCorrectionThreshold: 0.10, // Very low auto-correction threshold
        approvalThreshold: 10.00,
        largeAdjustmentThreshold: 100.00,
        frequentAdjustmentCount: 5,
        frequentAdjustmentWindow: 30,
        monitoringInterval: 30,
        warningHistoryLimit: 100,
        warningRetentionDays: 30
      };

      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.50, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 99.50, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.updateWarningSystemConfiguration(mockSessionId, restrictiveConfig);
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // This should not auto-correct due to restrictive threshold
      const adjustment = await settlementService.recordManualAdjustment(
        mockSessionId,
        'p1',
        ManualAdjustmentType.BALANCE_CORRECTION,
        0.50,
        'Above auto-correction threshold'
      );
      
      const warning = adjustment.warningsGenerated[0];
      expect(warning.autoCorrection).toBeUndefined(); // No auto-correction
      expect(warning.requiresApproval).toBe(true);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle monitoring when no players exist', async () => {
      mockDatabaseService.getPlayers.mockResolvedValue([]);

      await settlementService.initialize();
      
      const monitoringResult = await settlementService.startRealTimeMonitoring(mockSessionId);
      expect(monitoringResult.success).toBe(true);
      
      const monitoringState = await settlementService.getRealTimeMonitoringState(mockSessionId);
      expect(monitoringState.isActive).toBe(true);
      expect(monitoringState.balanceSnapshots[0].totalBalance).toBe(0);
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should handle concurrent manual adjustments gracefully', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 100.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
      ];

      mockDatabaseService.getPlayers.mockResolvedValue(players);

      await settlementService.initialize();
      await settlementService.startRealTimeMonitoring(mockSessionId);
      
      // Make concurrent adjustments
      const adjustmentPromises = Array.from({ length: 5 }, (_, i) =>
        settlementService.recordManualAdjustment(
          mockSessionId,
          'p1',
          ManualAdjustmentType.BALANCE_CORRECTION,
          0.10,
          `Concurrent adjustment ${i + 1}`
        )
      );
      
      const adjustments = await Promise.all(adjustmentPromises);
      
      // All adjustments should succeed
      adjustments.forEach(adjustment => {
        expect(adjustment.adjustmentId).toBeDefined();
        expect(adjustment.warningsGenerated.length).toBeGreaterThan(0);
      });
      
      // Should eventually trigger frequent adjustment warning
      const activeWarnings = await settlementService.getActiveWarnings(mockSessionId);
      const frequentWarning = activeWarnings.find(w => w.code === 'FREQUENT_ADJUSTMENTS');
      expect(frequentWarning).toBeDefined();
      
      await settlementService.stopRealTimeMonitoring(mockSessionId);
    });

    it('should handle warning resolution for non-existent warnings gracefully', async () => {
      await settlementService.initialize();
      
      const resolution = await settlementService.resolveWarning(
        mockSessionId,
        'non-existent-warning-id',
        'accepted',
        'Test non-existent'
      );
      
      expect(resolution.success).toBe(false);
      expect(resolution.error).toContain('Warning not found');
    });
  });
});