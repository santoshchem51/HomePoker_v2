/**
 * VoiceCommandParser Service Tests
 * Tests for Story 2.2 voice-enabled buy-in commands
 */

import VoiceCommandParser from '../../../../src/services/integration/VoiceCommandParser';
import { SessionContext } from '../../../../src/types/voice';

// Mock SessionService since we'll test it in isolation
jest.mock('../../../../src/services/core/SessionService', () => ({
  SessionService: {
    getInstance: jest.fn(() => ({})),
  },
}));

describe('VoiceCommandParser', () => {
  let voiceParser: typeof VoiceCommandParser;
  let mockSessionContext: SessionContext;

  beforeEach(() => {
    voiceParser = VoiceCommandParser;
    mockSessionContext = {
      sessionId: 'test-session-123',
      players: [
        { id: 'player-1', name: 'John Smith' },
        { id: 'player-2', name: 'Sarah Johnson' },
        { id: 'player-3', name: 'Mike Williams' },
        { id: 'player-4', name: 'Alex Thompson' },
        { id: 'player-5', name: 'Jennifer Davis' },
      ]
    };
  });

  describe('parsePlayerName', () => {
    it('should match exact player names with high confidence', async () => {
      const result = await voiceParser.parsePlayerName('add john fifty', mockSessionContext.players);
      
      expect(result.playerId).toBe('player-1');
      expect(result.playerName).toBe('John Smith');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should match partial names with good confidence', async () => {
      const result = await voiceParser.parsePlayerName('add sarah 100', mockSessionContext.players);
      
      expect(result.playerId).toBe('player-2');
      expect(result.playerName).toBe('Sarah Johnson');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should handle case insensitive matching', async () => {
      const result = await voiceParser.parsePlayerName('add MIKE twenty', mockSessionContext.players);
      
      expect(result.playerId).toBe('player-3');
      expect(result.playerName).toBe('Mike Williams');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should provide similar matches for unclear names', async () => {
      const result = await voiceParser.parsePlayerName('add jon fifty', mockSessionContext.players);
      
      expect(result.similarMatches.length).toBeGreaterThan(0);
      expect(result.similarMatches[0].playerName).toBe('John Smith');
    });

    it('should return null for completely unmatched names', async () => {
      const result = await voiceParser.parsePlayerName('add xavier 100', mockSessionContext.players);
      
      expect(result.playerId).toBeNull();
      expect(result.playerName).toBeNull();
      expect(result.confidence).toBeLessThan(0.6); // Low confidence, not necessarily 0
    });

    it('should handle empty or invalid input', async () => {
      const result = await voiceParser.parsePlayerName('add 50', mockSessionContext.players);
      
      expect(result.playerId).toBeNull();
      expect(result.playerName).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('parseAmount', () => {
    it('should parse direct numbers correctly', async () => {
      const testCases = [
        { input: 'add john 50', expected: 50 },
        { input: 'give sarah 100', expected: 100 },
        { input: 'add mike 25', expected: 25 },
        { input: 'add alex 200', expected: 200 },
      ];

      for (const testCase of testCases) {
        const result = await voiceParser.parseAmount(testCase.input);
        expect(result.amount).toBe(testCase.expected);
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should parse written numbers correctly', async () => {
      const testCases = [
        { input: 'add john fifty', expected: 50 },
        { input: 'give sarah one hundred', expected: 100 },
        { input: 'add mike twenty', expected: 20 },
        { input: 'add alex two hundred', expected: 200 },
        { input: 'give jennifer twenty five', expected: 25 },
      ];

      for (const testCase of testCases) {
        const result = await voiceParser.parseAmount(testCase.input);
        expect(result.amount).toBe(testCase.expected);
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('should parse combination numbers correctly', async () => {
      const testCases = [
        { input: 'add john five zero', expected: 50 },
        { input: 'give sarah one zero zero', expected: 100 },
        { input: 'add mike two five', expected: 25 },
      ];

      for (const testCase of testCases) {
        const result = await voiceParser.parseAmount(testCase.input);
        expect(result.amount).toBe(testCase.expected);
        expect(result.confidence).toBeGreaterThan(0.6);
      }
    });

    it('should handle common poker amounts', async () => {
      const commonAmounts = [5, 10, 20, 25, 50, 100, 200, 500];
      
      for (const amount of commonAmounts) {
        const result = await voiceParser.parseAmount(`add john ${amount}`);
        expect(result.amount).toBe(amount);
      }
    });

    it('should reduce confidence for unusual amounts', async () => {
      const result = await voiceParser.parseAmount('add john 999');
      
      expect(result.amount).toBe(999);
      expect(result.confidence).toBeLessThan(0.9); // Reduced confidence for unusual amount
    });

    it('should return null for unparseable amounts', async () => {
      const result = await voiceParser.parseAmount('add john hello');
      
      expect(result.amount).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('parseCommand', () => {
    it('should identify buy-in commands correctly', async () => {
      const buyInCommands = [
        'add john fifty',
        'give sarah 100',
        'buyin mike twenty',
        'buy in alex 200',
      ];

      for (const command of buyInCommands) {
        const result = await voiceParser.parseCommand(command, mockSessionContext);
        expect(result.command).toBe('buy-in');
      }
    });

    it('should identify unknown commands', async () => {
      const unknownCommands = [
        'hello there',
        'how are you',
        'start session',
        'end game',
      ];

      for (const command of unknownCommands) {
        const result = await voiceParser.parseCommand(command, mockSessionContext);
        expect(result.command).toBe('unknown');
      }
    });

    it('should calculate overall confidence correctly', async () => {
      const result = await voiceParser.parseCommand('add john fifty', mockSessionContext);
      
      expect(result.overallConfidence).toBeGreaterThan(0);
      expect(result.overallConfidence).toBeLessThanOrEqual(1);
      
      // High confidence command should not require confirmation
      if (result.overallConfidence >= 0.7) {
        expect(result.requiresConfirmation).toBe(false);
      } else {
        expect(result.requiresConfirmation).toBe(true);
      }
    });

    it('should require confirmation for low confidence commands', async () => {
      const result = await voiceParser.parseCommand('add jon fiftee', mockSessionContext);
      
      expect(result.requiresConfirmation).toBe(true);
      expect(result.overallConfidence).toBeLessThan(0.7);
    });

    it('should parse complete buy-in commands with player and amount', async () => {
      const result = await voiceParser.parseCommand('add sarah one hundred', mockSessionContext);
      
      expect(result.command).toBe('buy-in');
      expect(result.playerMatch.playerName).toBe('Sarah Johnson');
      expect(result.amountParse.amount).toBe(100);
      expect(result.overallConfidence).toBeGreaterThan(0.6);
    });
  });

  describe('fuzzy matching algorithm', () => {
    it('should handle common speech recognition errors', async () => {
      const testCases = [
        { spoken: 'jon', expected: 'John Smith' },
        { spoken: 'sara', expected: 'Sarah Johnson' },
        { spoken: 'mik', expected: 'Mike Williams' },
        { spoken: 'jenifer', expected: 'Jennifer Davis' },
      ];

      for (const testCase of testCases) {
        const result = await voiceParser.parsePlayerName(`add ${testCase.spoken} 50`, mockSessionContext.players);
        expect(result.similarMatches[0]?.playerName).toBe(testCase.expected);
      }
    });

    it('should rank similar matches by similarity score', async () => {
      // Add a player with similar name to test ranking
      const extendedPlayers = [
        ...mockSessionContext.players,
        { id: 'player-6', name: 'John Jones' },
        { id: 'player-7', name: 'Johnny Wilson' },
      ];

      const result = await voiceParser.parsePlayerName('add john 50', extendedPlayers);
      
      expect(result.similarMatches.length).toBeGreaterThan(1);
      // First match should have highest similarity
      expect(result.similarMatches[0].similarity).toBeGreaterThanOrEqual(result.similarMatches[1].similarity);
    });
  });

  describe('voice command patterns', () => {
    it('should handle various command patterns', async () => {
      const patterns = [
        'add john fifty dollars',
        'give sarah 100 bucks',
        'buyin mike twenty',
        'buy in alex two hundred',
      ];

      for (const pattern of patterns) {
        const result = await voiceParser.parseCommand(pattern, mockSessionContext);
        expect(result.command).toBe('buy-in');
        expect(result.playerMatch.playerId).toBeTruthy();
        expect(result.amountParse.amount).toBeGreaterThan(0);
      }
    });

    it('should handle normalized input (remove punctuation)', async () => {
      const messyInput = 'add, john! fifty? dollars.';
      const result = await voiceParser.parseCommand(messyInput, mockSessionContext);
      
      expect(result.command).toBe('buy-in');
      expect(result.playerMatch.playerName).toBe('John Smith');
      expect(result.amountParse.amount).toBe(50);
    });
  });

  describe('confidence threshold validation', () => {
    it('should set requiresConfirmation based on 0.7 threshold', async () => {
      // Test with clear, high confidence command
      const highConfidenceResult = await voiceParser.parseCommand('add john fifty', mockSessionContext);
      if (highConfidenceResult.overallConfidence >= 0.7) {
        expect(highConfidenceResult.requiresConfirmation).toBe(false);
      }

      // Test with ambiguous, low confidence command
      const lowConfidenceResult = await voiceParser.parseCommand('add xyz abc', mockSessionContext);
      expect(lowConfidenceResult.requiresConfirmation).toBe(true);
      expect(lowConfidenceResult.overallConfidence).toBeLessThan(0.7);
    });
  });

  describe('error handling', () => {
    it('should handle empty session players gracefully', async () => {
      const emptyContext: SessionContext = {
        sessionId: 'empty-session',
        players: []
      };

      const result = await voiceParser.parseCommand('add john fifty', emptyContext);
      
      expect(result.playerMatch.playerId).toBeNull();
      expect(result.playerMatch.confidence).toBe(0);
    });

    it('should handle null/undefined input gracefully', async () => {
      const result = await voiceParser.parsePlayerName('', mockSessionContext.players);
      
      expect(result.playerId).toBeNull();
      expect(result.confidence).toBe(0);
    });
  });

  describe('performance requirements', () => {
    it('should parse commands within reasonable time', async () => {
      const startTime = Date.now();
      
      await voiceParser.parseCommand('add john fifty', mockSessionContext);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });
  });
});