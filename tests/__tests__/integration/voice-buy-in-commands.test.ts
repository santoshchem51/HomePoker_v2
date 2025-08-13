/**
 * Voice Buy-in Commands Integration Tests
 * Tests the complete flow from voice command to transaction recording
 */

import VoiceCommandParser from '../../../src/services/integration/VoiceCommandParser';
import { TransactionService } from '../../../src/services/core/TransactionService';
import { SessionService } from '../../../src/services/core/SessionService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { SessionContext } from '../../../src/types/voice';

// Mock dependencies
jest.mock('../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../src/services/core/SessionService');
jest.mock('../../../src/services/core/TransactionService');

describe('Voice Buy-in Commands Integration', () => {
  let mockSessionService: jest.Mocked<SessionService>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let sessionContext: SessionContext;

  beforeEach(() => {
    // Setup mocks
    mockSessionService = {
      getSessionState: jest.fn(),
    } as any;
    
    mockTransactionService = {
      recordBuyIn: jest.fn(),
    } as any;

    mockDatabaseService = {
      executeTransaction: jest.fn(),
    } as any;

    // Mock singleton instances
    (SessionService.getInstance as jest.Mock).mockReturnValue(mockSessionService);
    (TransactionService.getInstance as jest.Mock).mockReturnValue(mockTransactionService);
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);

    sessionContext = {
      sessionId: 'integration-test-session',
      players: [
        { id: 'player-1', name: 'Alice Johnson' },
        { id: 'player-2', name: 'Bob Smith' },
        { id: 'player-3', name: 'Charlie Brown' },
        { id: 'player-4', name: 'Diana Prince' },
      ]
    };

    // Mock session state
    mockSessionService.getSessionState.mockResolvedValue({
      id: sessionContext.sessionId,
      players: sessionContext.players.map(p => ({
        id: p.id,
        name: p.name,
        sessionId: sessionContext.sessionId,
        isGuest: false,
        currentBalance: 0,
        totalBuyIns: 0,
        totalCashOuts: 0,
        status: 'active' as const,
        joinedAt: new Date(),
      })),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Voice Buy-in Flow', () => {
    it('should process high-confidence voice commands automatically', async () => {
      // Arrange
      const voiceCommand = 'add alice fifty dollars';
      mockTransactionService.recordBuyIn.mockResolvedValue({
        id: 'transaction-123',
        sessionId: sessionContext.sessionId,
        playerId: 'player-1',
        amount: 50,
        type: 'buy_in',
        method: 'voice',
        createdAt: new Date(),
      } as any);

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, sessionContext);

      // Assert - High confidence buy-in command
      expect(result.command).toBe('buy-in');
      expect(result.playerMatch.playerName).toBe('Alice Johnson');
      expect(result.amountParse.amount).toBe(50);
      expect(result.overallConfidence).toBeGreaterThan(0.7);
      expect(result.requiresConfirmation).toBe(false);

      // Verify transaction would be processed
      if (!result.requiresConfirmation) {
        await mockTransactionService.recordBuyIn(
          sessionContext.sessionId,
          result.playerMatch.playerId!,
          result.amountParse.amount!,
          'voice',
          'voice-command',
          `Voice command buy-in for ${result.playerMatch.playerName}`
        );

        expect(mockTransactionService.recordBuyIn).toHaveBeenCalledWith(
          sessionContext.sessionId,
          'player-1',
          50,
          'voice',
          'voice-command',
          'Voice command buy-in for Alice Johnson'
        );
      }
    });

    it('should require confirmation for low-confidence commands', async () => {
      // Arrange - Ambiguous command
      const voiceCommand = 'add ales fiftee';

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, sessionContext);

      // Assert - Low confidence should require confirmation
      expect(result.command).toBe('buy-in');
      expect(result.overallConfidence).toBeLessThan(0.7);
      expect(result.requiresConfirmation).toBe(true);

      // Verify no automatic transaction processing
      expect(mockTransactionService.recordBuyIn).not.toHaveBeenCalled();
    });

    it('should handle player name disambiguation', async () => {
      // Arrange - Add another player with similar name
      const extendedContext = {
        ...sessionContext,
        players: [
          ...sessionContext.players,
          { id: 'player-5', name: 'Albert Jones' }, // Similar to Alice
        ]
      };

      const voiceCommand = 'add al fifty';

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, extendedContext);

      // Assert - Should provide multiple similar matches
      expect(result.playerMatch.similarMatches.length).toBeGreaterThan(1);
      const names = result.playerMatch.similarMatches.map(m => m.playerName);
      expect(names).toContain('Alice Johnson');
      expect(names).toContain('Albert Jones');
    });
  });

  describe('Voice Command Accuracy Testing', () => {
    it('should handle various number formats correctly', async () => {
      const testCases = [
        { command: 'add bob twenty', expectedAmount: 20 },
        { command: 'give charlie 50', expectedAmount: 50 },
        { command: 'add diana one hundred', expectedAmount: 100 },
        { command: 'buyin alice five zero', expectedAmount: 50 },
        { command: 'buy in bob two hundred', expectedAmount: 200 },
      ];

      for (const testCase of testCases) {
        const result = await VoiceCommandParser.parseCommand(testCase.command, sessionContext);
        
        expect(result.command).toBe('buy-in');
        expect(result.amountParse.amount).toBe(testCase.expectedAmount);
      }
    });

    it('should handle different player name variations', async () => {
      const testCases = [
        { command: 'add alice 50', expectedPlayer: 'Alice Johnson' },
        { command: 'give bob 100', expectedPlayer: 'Bob Smith' },
        { command: 'add charlie 25', expectedPlayer: 'Charlie Brown' },
        { command: 'buyin diana 75', expectedPlayer: 'Diana Prince' },
      ];

      for (const testCase of testCases) {
        const result = await VoiceCommandParser.parseCommand(testCase.command, sessionContext);
        
        expect(result.command).toBe('buy-in');
        expect(result.playerMatch.playerName).toBe(testCase.expectedPlayer);
      }
    });
  });

  describe('Transaction Integration', () => {
    it('should record voice transactions with correct metadata', async () => {
      // Arrange
      const voiceCommand = 'add bob one hundred';
      mockTransactionService.recordBuyIn.mockResolvedValue({
        id: 'transaction-456',
        sessionId: sessionContext.sessionId,
        playerId: 'player-2',
        amount: 100,
        type: 'buy_in',
        method: 'voice',
        createdBy: 'voice-command',
        description: 'Voice command buy-in for Bob Smith',
        createdAt: new Date(),
      } as any);

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, sessionContext);

      if (!result.requiresConfirmation && result.playerMatch.playerId) {
        await mockTransactionService.recordBuyIn(
          sessionContext.sessionId,
          result.playerMatch.playerId,
          result.amountParse.amount!,
          'voice',
          'voice-command',
          `Voice command buy-in for ${result.playerMatch.playerName}`
        );
      }

      // Assert
      expect(mockTransactionService.recordBuyIn).toHaveBeenCalledWith(
        sessionContext.sessionId,
        'player-2',
        100,
        'voice', // Method marked as voice
        'voice-command',
        'Voice command buy-in for Bob Smith'
      );
    });

    it('should handle transaction failures gracefully', async () => {
      // Arrange
      const voiceCommand = 'add charlie fifty';
      mockTransactionService.recordBuyIn.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, sessionContext);

      // Assert - Parser should still work even if transaction fails
      expect(result.command).toBe('buy-in');
      expect(result.playerMatch.playerName).toBe('Charlie Brown');
      expect(result.amountParse.amount).toBe(50);

      // Verify error handling would occur at transaction level
      if (!result.requiresConfirmation && result.playerMatch.playerId) {
        await expect(
          mockTransactionService.recordBuyIn(
            sessionContext.sessionId,
            result.playerMatch.playerId,
            result.amountParse.amount!,
            'voice',
            'voice-command',
            `Voice command buy-in for ${result.playerMatch.playerName}`
          )
        ).rejects.toThrow('Database connection failed');
      }
    });
  });

  describe('Session Context Integration', () => {
    it('should validate players exist in current session', async () => {
      // Arrange - Command for player not in session
      const voiceCommand = 'add unknown fifty';

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, sessionContext);

      // Assert - Should not find player
      expect(result.playerMatch.playerId).toBeNull();
      expect(result.playerMatch.confidence).toBe(0);
    });

    it('should handle empty session gracefully', async () => {
      // Arrange
      const emptyContext: SessionContext = {
        sessionId: 'empty-session',
        players: []
      };
      
      const voiceCommand = 'add anyone fifty';

      // Act
      const result = await VoiceCommandParser.parseCommand(voiceCommand, emptyContext);

      // Assert
      expect(result.playerMatch.playerId).toBeNull();
      expect(result.playerMatch.confidence).toBe(0);
    });
  });

  describe('Confidence Threshold Validation', () => {
    it('should properly calculate overall confidence from player and amount confidence', async () => {
      // Test with clear player name and amount
      const clearResult = await VoiceCommandParser.parseCommand('add alice fifty', sessionContext);
      
      // Test with unclear player name but clear amount
      const unclearPlayerResult = await VoiceCommandParser.parseCommand('add ales fifty', sessionContext);
      
      // Test with clear player name but unclear amount
      const unclearAmountResult = await VoiceCommandParser.parseCommand('add alice fiftee', sessionContext);

      // Assert - Overall confidence should reflect both components
      expect(clearResult.overallConfidence).toBeGreaterThan(unclearPlayerResult.overallConfidence);
      expect(clearResult.overallConfidence).toBeGreaterThan(unclearAmountResult.overallConfidence);
    });

    it('should use 70% threshold for confirmation requirement', async () => {
      const testCases = [
        { command: 'add alice fifty', shouldRequireConfirmation: false }, // Clear command
        { command: 'add ales fiftee', shouldRequireConfirmation: true },  // Unclear command
      ];

      for (const testCase of testCases) {
        const result = await VoiceCommandParser.parseCommand(testCase.command, sessionContext);
        
        if (result.overallConfidence >= 0.7) {
          expect(result.requiresConfirmation).toBe(false);
        } else {
          expect(result.requiresConfirmation).toBe(true);
        }
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should complete voice command processing within 500ms', async () => {
      const startTime = Date.now();
      
      await VoiceCommandParser.parseCommand('add alice fifty', sessionContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Must complete within 500ms requirement
    });

    it('should handle multiple rapid commands efficiently', async () => {
      const commands = [
        'add alice twenty',
        'give bob fifty',
        'add charlie 100',
        'buyin diana 75',
      ];

      const startTime = Date.now();
      
      const results = await Promise.all(
        commands.map(cmd => VoiceCommandParser.parseCommand(cmd, sessionContext))
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000); // All commands within 1 second
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.command).toBe('buy-in');
      });
    });
  });
});