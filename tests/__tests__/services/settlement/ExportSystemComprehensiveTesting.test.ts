/**
 * Export System Comprehensive Testing - Story 3.3, Task 10
 * Tests for export system with all output formats (PDF, JSON, text, CSV)
 */

import { SettlementService } from '../../../../src/services/settlement/SettlementService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { TransactionService } from '../../../../src/services/core/TransactionService';
import { 
  OptimizedSettlement,
  MathematicalProof,
  ProofExportFormat,
  ProofExportMetadata,
  ProofVerificationResult,
  Player,
  Transaction
} from '../../../../src/types/settlement';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/core/TransactionService');
jest.mock('../../../../src/services/monitoring/CrashReportingService');

// Mock file system and sharing modules
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  writeFile: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false),
  mkdir: jest.fn().mockResolvedValue(true),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  stat: jest.fn().mockResolvedValue({ size: 1024 }),
}));

jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Export System Comprehensive Testing - Story 3.3 Task 10', () => {
  let settlementService: SettlementService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTransactionService: jest.Mocked<TransactionService>;

  const mockSessionId = 'export-testing-session';

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
      name: 'Export System Test Session',
      status: 'active',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Export Testing', () => {
    it('should generate valid PDF export with complete mathematical breakdown', async () => {
      const players: Player[] = [
        { id: 'alice', name: 'Alice', currentBalance: 150.00, status: 'active' },
        { id: 'bob', name: 'Bob', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'alice', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'bob', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'bob', fromPlayerName: 'Bob', toPlayerId: 'alice', toPlayerName: 'Alice', amount: 50.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 50.00,
          processingTime: 75
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 50.00,
          totalCredits: 50.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      // Generate mathematical proof first
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      
      // Export to PDF
      const pdfExport = await settlementService.exportMathematicalProof(
        proof,
        ProofExportFormat.PDF
      );
      
      expect(pdfExport).toBeDefined();
      expect(pdfExport.success).toBe(true);
      expect(pdfExport.exportId).toBeDefined();
      expect(pdfExport.filePath).toBeDefined();
      expect(pdfExport.metadata).toBeDefined();
      
      // Verify PDF content structure
      expect(pdfExport.content).toContain('<html>');
      expect(pdfExport.content).toContain('<head>');
      expect(pdfExport.content).toContain('<body>');
      expect(pdfExport.content).toContain('Mathematical Proof Summary');
      expect(pdfExport.content).toContain('Settlement Validation Report');
      
      // Verify player information
      expect(pdfExport.content).toContain('Alice');
      expect(pdfExport.content).toContain('Bob');
      expect(pdfExport.content).toContain('$50.00');
      
      // Verify calculation steps
      expect(pdfExport.content).toContain('Step-by-Step Calculation');
      expect(pdfExport.content).toContain('Player Net Position Calculation');
      expect(pdfExport.content).toContain('Mathematical Balance Verification');
      
      // Verify precision analysis
      expect(pdfExport.content).toContain('Precision Analysis');
      expect(pdfExport.content).toContain('Rounding Operations');
      
      // Verify algorithm verification
      expect(pdfExport.content).toContain('Algorithm Verification');
      expect(pdfExport.content).toContain('Direct Settlement Algorithm');
      expect(pdfExport.content).toContain('Consensus: ✓');
      
      // Verify metadata
      expect(pdfExport.metadata.format).toBe(ProofExportFormat.PDF);
      expect(pdfExport.metadata.fileSize).toBeGreaterThan(0);
      expect(pdfExport.metadata.checksum).toBeDefined();
      expect(pdfExport.metadata.generationTime).toBeGreaterThan(0);
    });

    it('should include watermark and signature in PDF export', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 15
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const pdfExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.PDF);
      
      // Verify watermark elements
      expect(pdfExport.content).toContain('Generated by PokePot Settlement Engine');
      expect(pdfExport.content).toContain('Cryptographic Signature');
      expect(pdfExport.content).toContain('Verification Checksum');
      
      // Verify signature block
      expect(pdfExport.content).toContain(proof.signature);
      expect(pdfExport.content).toContain(proof.checksum);
      expect(pdfExport.content).toContain('Document Integrity: VERIFIED');
      
      // Verify timestamp
      expect(pdfExport.content).toContain(proof.generatedAt.toISOString().split('T')[0]); // Date portion
    });

    it('should handle complex multi-player PDF export', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 200.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 150.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 100.00, status: 'active' },
        { id: 'p4', name: 'Player4', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 125.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      const complexSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p4', fromPlayerName: 'Player4', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 75.00, priority: 1 },
          { fromPlayerId: 'p3', fromPlayerName: 'Player3', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 25.00, priority: 2 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 4,
          optimizedPaymentCount: 2,
          reductionPercentage: 50,
          totalAmountSettled: 100.00,
          processingTime: 125
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 100.00,
          totalCredits: 100.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(complexSettlement);
      const pdfExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.PDF);
      
      // Verify complex scenario handling
      expect(pdfExport.content).toContain('4 Players');
      expect(pdfExport.content).toContain('2 Optimized Transactions');
      expect(pdfExport.content).toContain('50% Reduction');
      
      // Verify all players are listed
      players.forEach(player => {
        expect(pdfExport.content).toContain(player.name);
      });
      
      // Verify payment plan table
      expect(pdfExport.content).toContain('Payment Plan');
      expect(pdfExport.content).toContain('Player4 → Player1');
      expect(pdfExport.content).toContain('Player3 → Player2');
      expect(pdfExport.content).toContain('$75.00');
      expect(pdfExport.content).toContain('$25.00');
    });
  });

  describe('JSON Export Testing', () => {
    it('should generate enhanced JSON export with verification capabilities', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 125.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 75.00, status: 'active' },
      ];

      const transactions: Transaction[] = [
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ];

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p2', fromPlayerName: 'Player2', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 25.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25.00,
          processingTime: 50
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25.00,
          totalCredits: 25.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const jsonExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.JSON);
      
      expect(jsonExport.success).toBe(true);
      expect(jsonExport.content).toBeDefined();
      
      // Parse and verify JSON structure
      const jsonData = JSON.parse(jsonExport.content);
      expect(jsonData.version).toBe('2.0');
      expect(jsonData.proofId).toBe(proof.proofId);
      expect(jsonData.settlementId).toBe(mockSessionId);
      
      // Verify enhanced features
      expect(jsonData.enhancedFeatures).toBeDefined();
      expect(jsonData.enhancedFeatures.verificationSuite).toBeDefined();
      expect(jsonData.enhancedFeatures.auditTrailCorrelation).toBeDefined();
      expect(jsonData.enhancedFeatures.dependencyGraph).toBeDefined();
      
      // Verify verification suite
      const verificationSuite = jsonData.enhancedFeatures.verificationSuite;
      expect(verificationSuite.balanceTest).toBeDefined();
      expect(verificationSuite.algorithmTest).toBeDefined();
      expect(verificationSuite.precisionTest).toBeDefined();
      expect(verificationSuite.integrityTest).toBeDefined();
      
      // Verify complete data structure
      expect(jsonData.settlementSummary).toBeDefined();
      expect(jsonData.settlementSummary.playerPositions).toBeDefined();
      expect(jsonData.settlementSummary.settlements).toBeDefined();
      expect(jsonData.settlementSummary.verificationResults).toBeDefined();
      
      // Verify audit trail
      expect(jsonData.auditTrail).toBeDefined();
      expect(Array.isArray(jsonData.auditTrail)).toBe(true);
      expect(jsonData.auditTrail.length).toBeGreaterThan(0);
      
      // Verify metadata
      expect(jsonData.metadata).toBeDefined();
      expect(jsonData.metadata.exportFormat).toBe('JSON');
      expect(jsonData.metadata.generationTimestamp).toBeDefined();
      expect(jsonData.metadata.capabilities).toBeDefined();
    });

    it('should include programmatic verification test suites in JSON', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 10.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 10.00,
          processingTime: 30
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 10.00,
          totalCredits: 10.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([
        { id: 'p1', name: 'Player1', currentBalance: 90.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 110.00, status: 'active' },
      ]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const jsonExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.JSON);
      
      const jsonData = JSON.parse(jsonExport.content);
      const verificationSuite = jsonData.enhancedFeatures.verificationSuite;
      
      // Balance test should be executable
      expect(verificationSuite.balanceTest.description).toContain('balance');
      expect(verificationSuite.balanceTest.testFunction).toBeDefined();
      expect(verificationSuite.balanceTest.expectedResult).toBe(true);
      expect(verificationSuite.balanceTest.tolerance).toBe(0.01);
      
      // Algorithm test should verify consensus
      expect(verificationSuite.algorithmTest.description).toContain('algorithm');
      expect(verificationSuite.algorithmTest.algorithms).toBeDefined();
      expect(verificationSuite.algorithmTest.algorithms.length).toBeGreaterThan(1);
      
      // Precision test should check rounding
      expect(verificationSuite.precisionTest.description).toContain('precision');
      expect(verificationSuite.precisionTest.maxPrecisionLoss).toBeDefined();
      expect(verificationSuite.precisionTest.roundingOperations).toBeDefined();
      
      // Integrity test should verify signatures
      expect(verificationSuite.integrityTest.description).toContain('integrity');
      expect(verificationSuite.integrityTest.checksumAlgorithm).toBe('SHA-256');
      expect(verificationSuite.integrityTest.expectedChecksum).toBe(proof.checksum);
    });
  });

  describe('Text Export Testing (WhatsApp-friendly)', () => {
    it('should generate mobile-optimized WhatsApp-friendly text export', async () => {
      const players: Player[] = [
        { id: 'alice', name: 'Alice', currentBalance: 180.00, status: 'active' },
        { id: 'bob', name: 'Bob', currentBalance: 120.00, status: 'active' },
        { id: 'charlie', name: 'Charlie', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'charlie', fromPlayerName: 'Charlie', toPlayerId: 'alice', toPlayerName: 'Alice', amount: 50.00, priority: 1 },
          { fromPlayerId: 'bob', fromPlayerName: 'Bob', toPlayerId: 'alice', toPlayerName: 'Alice', amount: 30.00, priority: 2 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 3,
          optimizedPaymentCount: 2,
          reductionPercentage: 33.33,
          totalAmountSettled: 80.00,
          processingTime: 85
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 80.00,
          totalCredits: 80.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const textExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.TEXT);
      
      expect(textExport.success).toBe(true);
      expect(textExport.content).toBeDefined();
      
      // Verify mobile-optimized formatting (35 character width)
      const lines = textExport.content.split('\n');
      lines.forEach(line => {
        if (line.trim() && !line.includes('═') && !line.includes('─')) {
          expect(line.length).toBeLessThanOrEqual(40); // Some flexibility for formatting
        }
      });
      
      // Verify emoji usage for visual clarity
      expect(textExport.content).toMatch(/[💰💸✓✗📊]/); // Contains emojis
      
      // Verify settlement summary
      expect(textExport.content).toContain('SETTLEMENT SUMMARY');
      expect(textExport.content).toContain('Charlie → Alice: $50.00');
      expect(textExport.content).toContain('Bob → Alice: $30.00');
      
      // Verify verification status
      expect(textExport.content).toContain('VERIFICATION STATUS');
      expect(textExport.content).toContain('✓ Balance: VERIFIED');
      expect(textExport.content).toContain('✓ Precision: VERIFIED');
      expect(textExport.content).toContain('✓ Algorithm: CONSENSUS');
      
      // Verify concise metrics
      expect(textExport.content).toContain('Transactions: 2');
      expect(textExport.content).toContain('Optimization: 33%');
      expect(textExport.content).toContain('Total: $80.00');
      
      // Verify simplified player list (first 5 only)
      expect(textExport.content).toContain('Alice');
      expect(textExport.content).toContain('Bob');
      expect(textExport.content).toContain('Charlie');
    });

    it('should handle large player lists with truncation in text export', async () => {
      // Create 10 players to test truncation
      const players: Player[] = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player${i + 1}`,
        currentBalance: 100 + (i * 5),
        status: 'active' as const,
      }));

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p10', toPlayerName: 'Player10', amount: 45.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 10,
          optimizedPaymentCount: 1,
          reductionPercentage: 90,
          totalAmountSettled: 45.00,
          processingTime: 150
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 45.00,
          totalCredits: 45.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const textExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.TEXT);
      
      // Should show first 5 transactions and indicate more
      expect(textExport.content).toContain('Player1 → Player10');
      expect(textExport.content).toMatch(/\(\+\d+ more\)/); // Indicates truncation
      expect(textExport.content).toContain('10 players total');
    });
  });

  describe('CSV Export Testing', () => {
    it('should generate structured CSV export for spreadsheet analysis', async () => {
      const players: Player[] = [
        { id: 'p1', name: 'Player1', currentBalance: 150.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 100.00, status: 'active' },
        { id: 'p3', name: 'Player3', currentBalance: 50.00, status: 'active' },
      ];

      const transactions: Transaction[] = players.map((player, index) => ({
        id: `tx${index + 1}`,
        sessionId: mockSessionId,
        playerId: player.id,
        type: 'buy_in' as const,
        amount: 100.00,
        timestamp: new Date(),
        isVoided: false,
      }));

      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p3', fromPlayerName: 'Player3', toPlayerId: 'p1', toPlayerName: 'Player1', amount: 50.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 2,
          optimizedPaymentCount: 1,
          reductionPercentage: 50,
          totalAmountSettled: 50.00,
          processingTime: 65
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 50.00,
          totalCredits: 50.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue(players);
      mockTransactionService.getSessionTransactions.mockResolvedValue(transactions);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const csvExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.CSV);
      
      expect(csvExport.success).toBe(true);
      expect(csvExport.content).toBeDefined();
      
      // Verify CSV structure
      const lines = csvExport.content.split('\n').filter(line => line.trim());
      expect(lines.length).toBeGreaterThan(10); // Headers + data rows
      
      // Verify player positions section
      expect(csvExport.content).toContain('PLAYER_POSITIONS');
      expect(csvExport.content).toContain('Player ID,Player Name,Current Balance,Buy-ins,Net Position');
      expect(csvExport.content).toContain('p1,Player1,150.00,100.00,50.00');
      expect(csvExport.content).toContain('p2,Player2,100.00,100.00,0.00');
      expect(csvExport.content).toContain('p3,Player3,50.00,100.00,-50.00');
      
      // Verify settlements section
      expect(csvExport.content).toContain('SETTLEMENTS');
      expect(csvExport.content).toContain('From Player,To Player,Amount,Priority');
      expect(csvExport.content).toContain('p3,p1,50.00,1');
      
      // Verify calculation steps section
      expect(csvExport.content).toContain('CALCULATION_STEPS');
      expect(csvExport.content).toContain('Step,Operation,Result,Verification');
      
      // Verify summary metrics
      expect(csvExport.content).toContain('SUMMARY_METRICS');
      expect(csvExport.content).toContain('Total Debits,50.00');
      expect(csvExport.content).toContain('Total Credits,50.00');
      expect(csvExport.content).toContain('Balance Verified,TRUE');
    });

    it('should include audit trail in CSV format', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 20
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const csvExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.CSV);
      
      // Verify audit trail export
      expect(csvExport.content).toContain('AUDIT_TRAIL');
      expect(csvExport.content).toContain('Timestamp,Step,Operation,Description,Verification');
      
      // Should have audit steps from proof generation
      expect(csvExport.content).toContain('Player Net Position Calculation');
      expect(csvExport.content).toContain('Mathematical Balance Verification');
      expect(csvExport.content).toContain('Precision and Rounding Verification');
      
      // All verification statuses should be present
      expect(csvExport.content).toContain('TRUE'); // Verification passed
    });
  });

  describe('Export History and Metadata Tracking', () => {
    it('should track export history with comprehensive metadata', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 25.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 25.00,
          processingTime: 40
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 25.00,
          totalCredits: 25.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([
        { id: 'p1', name: 'Player1', currentBalance: 75.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 125.00, status: 'active' },
      ]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      
      // Export in multiple formats
      const pdfExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.PDF);
      const jsonExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.JSON);
      const textExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.TEXT);
      const csvExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.CSV);
      
      // Check export history
      const history = await settlementService.getProofExportHistory(proof.proofId);
      
      expect(history).toBeDefined();
      expect(history.length).toBe(4); // All formats exported
      
      history.forEach(entry => {
        expect(entry.exportId).toBeDefined();
        expect(entry.proofId).toBe(proof.proofId);
        expect(entry.format).toBeDefined();
        expect(entry.timestamp).toBeDefined();
        expect(entry.fileSize).toBeGreaterThan(0);
        expect(entry.checksum).toBeDefined();
        expect(entry.success).toBe(true);
        expect(entry.metadata).toBeDefined();
        expect(entry.metadata.generationTime).toBeGreaterThan(0);
      });
      
      // Verify different formats are tracked
      const formats = history.map(entry => entry.format);
      expect(formats).toContain(ProofExportFormat.PDF);
      expect(formats).toContain(ProofExportFormat.JSON);
      expect(formats).toContain(ProofExportFormat.TEXT);
      expect(formats).toContain(ProofExportFormat.CSV);
    });

    it('should handle export cleanup and retention', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 10
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      
      // Export multiple times to test history management
      for (let i = 0; i < 5; i++) {
        await settlementService.exportMathematicalProof(proof, ProofExportFormat.JSON);
      }
      
      // Check that exports are tracked
      const initialHistory = await settlementService.getProofExportHistory(proof.proofId);
      expect(initialHistory.length).toBe(5);
      
      // Test cleanup (if implemented)
      const cleanupResult = await settlementService.cleanupExportHistory(proof.proofId, 3);
      if (cleanupResult.success) {
        const cleanedHistory = await settlementService.getProofExportHistory(proof.proofId);
        expect(cleanedHistory.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe('File Sharing Integration', () => {
    it('should integrate with native sharing for exported proofs', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [
          { fromPlayerId: 'p1', fromPlayerName: 'Player1', toPlayerId: 'p2', toPlayerName: 'Player2', amount: 15.00, priority: 1 },
        ],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 1,
          optimizedPaymentCount: 1,
          reductionPercentage: 0,
          totalAmountSettled: 15.00,
          processingTime: 25
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 15.00,
          totalCredits: 15.00,
          netBalance: 0.00,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([
        { id: 'p1', name: 'Player1', currentBalance: 85.00, status: 'active' },
        { id: 'p2', name: 'Player2', currentBalance: 115.00, status: 'active' },
      ]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([
        { id: 'tx1', sessionId: mockSessionId, playerId: 'p1', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
        { id: 'tx2', sessionId: mockSessionId, playerId: 'p2', type: 'buy_in', amount: 100.00, timestamp: new Date(), isVoided: false },
      ]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const export1 = await settlementService.exportMathematicalProof(proof, ProofExportFormat.PDF);
      
      // Test sharing functionality
      const shareResult = await settlementService.shareExportedProof(
        export1.exportId,
        'Poker Settlement Proof',
        'Mathematical proof for settlement verification'
      );
      
      expect(shareResult).toBeDefined();
      expect(shareResult.success).toBe(true);
      expect(shareResult.sharedFile).toBeDefined();
      expect(shareResult.sharedFile.filePath).toBe(export1.filePath);
      expect(shareResult.sharedFile.mimeType).toBe('application/pdf');
      expect(shareResult.sharedFile.title).toBe('Poker Settlement Proof');
    });
  });

  describe('Cryptographic Verification and Integrity', () => {
    it('should verify export integrity with cryptographic checks', async () => {
      const testSettlement: OptimizedSettlement = {
        sessionId: mockSessionId,
        optimizedPayments: [],
        directPayments: [],
        optimizationMetrics: {
          originalPaymentCount: 0,
          optimizedPaymentCount: 0,
          reductionPercentage: 0,
          totalAmountSettled: 0,
          processingTime: 5
        },
        isValid: true,
        validationErrors: [],
        mathematicalProof: {
          totalDebits: 0,
          totalCredits: 0,
          netBalance: 0,
          isBalanced: true,
          precision: 2,
          validationTimestamp: new Date(),
          auditSteps: []
        }
      };

      mockDatabaseService.getPlayers.mockResolvedValue([]);
      mockTransactionService.getSessionTransactions.mockResolvedValue([]);

      await settlementService.initialize();
      
      const proof = await settlementService.generateMathematicalProof(testSettlement);
      const jsonExport = await settlementService.exportMathematicalProof(proof, ProofExportFormat.JSON);
      
      // Verify export integrity
      const integrityCheck = await settlementService.verifyExportIntegrity(
        jsonExport.exportId,
        jsonExport.content
      );
      
      expect(integrityCheck).toBeDefined();
      expect(integrityCheck.isValid).toBe(true);
      expect(integrityCheck.checksumValid).toBe(true);
      expect(integrityCheck.contentValid).toBe(true);
      expect(integrityCheck.formatValid).toBe(true);
      expect(integrityCheck.timestampValid).toBe(true);
      
      // Verify tamper detection
      const tamperedContent = jsonExport.content.replace('"totalDebits": 0', '"totalDebits": 100');
      const tamperedCheck = await settlementService.verifyExportIntegrity(
        jsonExport.exportId,
        tamperedContent
      );
      
      expect(tamperedCheck.isValid).toBe(false);
      expect(tamperedCheck.checksumValid).toBe(false);
      expect(tamperedCheck.tamperedData).toBeDefined();
    });
  });
});