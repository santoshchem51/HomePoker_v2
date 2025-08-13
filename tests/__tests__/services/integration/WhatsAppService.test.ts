/**
 * WhatsAppService Unit Tests
 * Tests message formatting, sharing functionality, and error handling
 */
import { WhatsAppService } from '../../../../src/services/integration/WhatsAppService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { WHATSAPP_MESSAGE_LIMIT } from '../../../../src/types/whatsapp';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));
jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));
jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    setString: jest.fn(),
  },
}));

const mockLinking = Linking as jest.Mocked<typeof Linking>;
const mockClipboard = Clipboard as any;

describe('WhatsAppService', () => {
  let whatsAppService: WhatsAppService;
  let mockDbService: jest.Mocked<DatabaseService>;

  const mockSessionData = {
    id: 'session-1',
    name: 'Friday Night Poker',
    organizerId: 'organizer-1',
    status: 'completed' as const,
    createdAt: new Date('2025-08-12T18:00:00Z'),
    startedAt: new Date('2025-08-12T18:00:00Z'),
    completedAt: new Date('2025-08-12T21:45:00Z'),
    totalPot: 300.00,
    playerCount: 3
  };

  const mockPlayersData = [
    {
      id: 'player-1',
      sessionId: 'session-1',
      name: 'Sarah',
      isGuest: true,
      currentBalance: 70.00,
      totalBuyIns: 50.00,
      totalCashOuts: 120.00,
      status: 'active' as const,
      joinedAt: new Date('2025-08-12T18:00:00Z')
    },
    {
      id: 'player-2',
      sessionId: 'session-1',
      name: 'John',
      isGuest: true,
      currentBalance: -45.00,
      totalBuyIns: 100.00,
      totalCashOuts: 55.00,
      status: 'active' as const,
      joinedAt: new Date('2025-08-12T18:00:00Z')
    },
    {
      id: 'player-3',
      sessionId: 'session-1',
      name: 'Mike',
      isGuest: true,
      currentBalance: -25.00,
      totalBuyIns: 150.00,
      totalCashOuts: 125.00,
      status: 'active' as const,
      joinedAt: new Date('2025-08-12T18:00:00Z')
    }
  ];

  const mockTransactionsData = [
    {
      id: 'tx-1',
      sessionId: 'session-1',
      playerId: 'player-1',
      type: 'buy_in' as const,
      amount: 50.00,
      timestamp: new Date('2025-08-12T18:05:00Z'),
      method: 'manual' as const,
      isVoided: false
    },
    {
      id: 'tx-2',
      sessionId: 'session-1',
      playerId: 'player-2',
      type: 'buy_in' as const,
      amount: 100.00,
      timestamp: new Date('2025-08-12T18:10:00Z'),
      method: 'manual' as const,
      isVoided: false
    },
    {
      id: 'tx-3',
      sessionId: 'session-1',
      playerId: 'player-3',
      type: 'buy_in' as const,
      amount: 150.00,
      timestamp: new Date('2025-08-12T18:15:00Z'),
      method: 'manual' as const,
      isVoided: false
    },
    {
      id: 'tx-4',
      sessionId: 'session-1',
      playerId: 'player-1',
      type: 'cash_out' as const,
      amount: 120.00,
      timestamp: new Date('2025-08-12T21:40:00Z'),
      method: 'manual' as const,
      isVoided: false
    },
    {
      id: 'tx-5',
      sessionId: 'session-1',
      playerId: 'player-2',
      type: 'cash_out' as const,
      amount: 55.00,
      timestamp: new Date('2025-08-12T21:42:00Z'),
      method: 'manual' as const,
      isVoided: false
    },
    {
      id: 'tx-6',
      sessionId: 'session-1',
      playerId: 'player-3',
      type: 'cash_out' as const,
      amount: 125.00,
      timestamp: new Date('2025-08-12T21:44:00Z'),
      method: 'manual' as const,
      isVoided: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset clipboard mock
    mockClipboard.setString = jest.fn();
    
    // Mock DatabaseService
    mockDbService = {
      executeQuery: jest.fn(),
      getInstance: jest.fn(),
    } as any;

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDbService);
    
    // Setup default database mocks to return proper QueryResult structure
    mockDbService.executeQuery.mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
        return Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockSessionData
          },
          rowsAffected: 1
        });
      }
      if (query.includes('SELECT * FROM players WHERE session_id = ?')) {
        return Promise.resolve({
          rows: {
            length: mockPlayersData.length,
            item: (_index: number) => mockPlayersData[index]
          },
          rowsAffected: mockPlayersData.length
        });
      }
      if (query.includes('SELECT * FROM transactions')) {
        return Promise.resolve({
          rows: {
            length: mockTransactionsData.length,
            item: (_index: number) => mockTransactionsData[index]
          },
          rowsAffected: mockTransactionsData.length
        });
      }
      return Promise.resolve({
        rows: { length: 0, item: () => null },
        rowsAffected: 0
      });
    });
    
    // Get fresh instance
    whatsAppService = WhatsAppService.getInstance();
  });

  afterEach(() => {
    // Reset singleton
    (WhatsAppService as any).instance = null;
  });

  describe('generateSessionMessage', () => {
    it('should generate summary message format correctly', async () => {
      const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
      
      expect(result.format).toBe('summary');
      expect(result.sessionId).toBe('session-1');
      expect(result.characterCount).toBeGreaterThan(0);
      expect(result.content).toContain('Friday Night Poker');
      expect(result.content).toContain('Total Pot: $300.00');
      expect(result.content).toContain('3h 45m');
      expect(result.content).toContain('John pays Sarah: $45.00');
      expect(result.content).toContain('Mike pays Sarah: $25.00');
      expect(result.content).toContain('Sarah +$70');
      expect(result.content).toContain('Mike $-25');
      expect(result.content).toContain('John $-45');
      expect(result.content).toContain('Shared via PokePot');
    });

    it('should generate detailed message format correctly', async () => {
      const result = await whatsAppService.generateSessionMessage('session-1', 'detailed');
      
      expect(result.format).toBe('detailed');
      expect(result.content).toContain('Player Summary:');
      expect(result.content).toContain('Sarah: $50 in → $120 out = +$70');
      expect(result.content).toContain('John: $100 in → $55 out = $-45');
      expect(result.content).toContain('Mike: $150 in → $125 out = $-25');
      expect(result.content).toContain('Settlement Optimization:');
    });

    it('should handle sessions with no settlements needed', async () => {
      // Mock balanced transactions
      const balancedTransactions = [
        {
          id: 'tx-1',
          sessionId: 'session-1',
          playerId: 'player-1',
          type: 'buy_in' as const,
          amount: 100.00,
          timestamp: new Date(),
          method: 'manual' as const,
          isVoided: false
        },
        {
          id: 'tx-2',
          sessionId: 'session-1',
          playerId: 'player-1',
          type: 'cash_out' as const,
          amount: 100.00,
          timestamp: new Date(),
          method: 'manual' as const,
          isVoided: false
        }
      ];

      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockSessionData
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockPlayersData[0]
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: balancedTransactions.length,
            item: (_index: number) => balancedTransactions[index]
          },
          rowsAffected: balancedTransactions.length
        }));

      const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
      
      expect(result.content).toContain('No settlements needed - everyone broke even!');
    });

    it('should throw error for non-existent session', async () => {
      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        })); // Empty session result

      await expect(
        whatsAppService.generateSessionMessage('non-existent', 'summary')
      ).rejects.toThrow(ServiceError);
    });

    it('should throw error when message exceeds character limit', async () => {
      // Create a very long session name to exceed the limit
      const longSessionData = {
        ...mockSessionData,
        name: 'A'.repeat(WHATSAPP_MESSAGE_LIMIT)
      };

      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => longSessionData
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: mockPlayersData.length,
            item: (_index: number) => mockPlayersData[index]
          },
          rowsAffected: mockPlayersData.length
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: mockTransactionsData.length,
            item: (_index: number) => mockTransactionsData[index]
          },
          rowsAffected: mockTransactionsData.length
        }));

      await expect(
        whatsAppService.generateSessionMessage('session-1', 'summary')
      ).rejects.toThrow(ServiceError);
    });

    it('should handle database errors gracefully', async () => {
      mockDbService.executeQuery.mockRejectedValue(new Error('Database error'));

      await expect(
        whatsAppService.generateSessionMessage('session-1', 'summary')
      ).rejects.toThrow(ServiceError);
    });
  });

  describe('shareToWhatsApp', () => {
    const mockMessage = {
      content: '🎯 Test message',
      format: 'summary' as const,
      sessionId: 'session-1',
      characterCount: 15,
      timestamp: new Date()
    };

    it('should share successfully via WhatsApp when available', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(true);

      const result = await whatsAppService.shareToWhatsApp(mockMessage);

      expect(result.success).toBe(true);
      expect(result.method).toBe('whatsapp');
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith(expect.stringContaining('whatsapp://send?text='));
      expect(mockLinking.openURL).toHaveBeenCalled();
    });

    it('should fallback to clipboard when WhatsApp unavailable', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      mockClipboard.setString.mockResolvedValue();

      const result = await whatsAppService.shareToWhatsApp(mockMessage);

      expect(result.success).toBe(true);
      expect(result.method).toBe('clipboard');
      expect(mockClipboard.setString).toHaveBeenCalledWith(mockMessage.content);
    });

    it('should fallback to clipboard when WhatsApp fails to open', async () => {
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockRejectedValue(new Error('Failed to open'));
      mockClipboard.setString.mockResolvedValue();

      const result = await whatsAppService.shareToWhatsApp(mockMessage);

      expect(result.success).toBe(true);
      expect(result.method).toBe('clipboard');
      expect(result.error).toContain('Failed to open');
    });

    it('should handle clipboard failure gracefully', async () => {
      mockLinking.canOpenURL.mockResolvedValue(false);
      mockClipboard.setString.mockRejectedValue(new Error('Clipboard failed'));

      const result = await whatsAppService.shareToWhatsApp(mockMessage);

      expect(result.success).toBe(false);
      expect(result.method).toBe('clipboard');
      expect(result.error).toContain('Clipboard failed');
    });

    it('should URL encode message content properly', async () => {
      const messageWithSpecialChars = {
        ...mockMessage,
        content: 'Test message with spaces & symbols! 💰 50% win rate'
      };

      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(true);

      await whatsAppService.shareToWhatsApp(messageWithSpecialChars);

      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(messageWithSpecialChars.content))
      );
    });
  });

  describe('message formatting', () => {
    it('should format duration correctly for various time spans', async () => {
      const testCases = [
        { minutes: 30, expected: '30m' },
        { minutes: 60, expected: '1h' },
        { minutes: 90, expected: '1h 30m' },
        { minutes: 225, expected: '3h 45m' },
        { minutes: 0, expected: '0m' }
      ];

      for (const testCase of testCases) {
        const sessionData = {
          ...mockSessionData,
          startedAt: new Date('2025-08-12T18:00:00Z'),
          completedAt: new Date(new Date('2025-08-12T18:00:00Z').getTime() + testCase.minutes * 60 * 1000)
        };

        mockDbService.executeQuery
          .mockReset()
          .mockImplementationOnce(() => Promise.resolve({
            rows: {
              length: 1,
              item: (_index: number) => sessionData
            },
            rowsAffected: 1
          }))
          .mockImplementationOnce(() => Promise.resolve({
            rows: {
              length: mockPlayersData.length,
              item: (_index: number) => mockPlayersData[index]
            },
            rowsAffected: mockPlayersData.length
          }))
          .mockImplementationOnce(() => Promise.resolve({
            rows: {
              length: mockTransactionsData.length,
              item: (_index: number) => mockTransactionsData[index]
            },
            rowsAffected: mockTransactionsData.length
          }));

        const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
        expect(result.content).toContain(testCase.expected);
      }
    });

    it('should calculate settlements correctly for complex scenarios', async () => {
      // Test complex settlement scenario with multiple creditors and debtors
      const complexPlayersData = [
        { ...mockPlayersData[0], id: 'player-1', name: 'Winner1' },
        { ...mockPlayersData[1], id: 'player-2', name: 'Winner2' },  
        { ...mockPlayersData[2], id: 'player-3', name: 'Loser1' },
        { ...mockPlayersData[0], id: 'player-4', name: 'Loser2' }
      ];

      // Create transactions that result in the desired settlement scenario
      const complexTransactions = [
        // Buy-ins
        { id: 'tx-1', sessionId: 'session-1', playerId: 'player-1', type: 'buy_in' as const, amount: 100, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-2', sessionId: 'session-1', playerId: 'player-2', type: 'buy_in' as const, amount: 50, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-3', sessionId: 'session-1', playerId: 'player-3', type: 'buy_in' as const, amount: 200, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-4', sessionId: 'session-1', playerId: 'player-4', type: 'buy_in' as const, amount: 150, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        // Cash-outs
        { id: 'tx-5', sessionId: 'session-1', playerId: 'player-1', type: 'cash_out' as const, amount: 180, timestamp: new Date(), method: 'manual' as const, isVoided: false }, // +80
        { id: 'tx-6', sessionId: 'session-1', playerId: 'player-2', type: 'cash_out' as const, amount: 100, timestamp: new Date(), method: 'manual' as const, isVoided: false }, // +50
        { id: 'tx-7', sessionId: 'session-1', playerId: 'player-3', type: 'cash_out' as const, amount: 120, timestamp: new Date(), method: 'manual' as const, isVoided: false }, // -80
        { id: 'tx-8', sessionId: 'session-1', playerId: 'player-4', type: 'cash_out' as const, amount: 100, timestamp: new Date(), method: 'manual' as const, isVoided: false }  // -50
      ];

      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockSessionData
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: complexPlayersData.length,
            item: (_index: number) => complexPlayersData[index]
          },
          rowsAffected: complexPlayersData.length
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: complexTransactions.length,
            item: (_index: number) => complexTransactions[index]
          },
          rowsAffected: complexTransactions.length
        }));

      const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
      
      // Verify settlement optimization (should minimize number of transactions)
      expect(result.content).toContain('Settlement Summary:');
      // The algorithm should optimize settlements efficiently
      const settlementLines = result.content.split('\n').filter(line => line.includes('pays'));
      expect(settlementLines.length).toBeLessThanOrEqual(3); // Should be optimized
    });
  });

  describe('error handling', () => {
    it('should handle missing session data gracefully', async () => {
      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        }));

      await expect(
        whatsAppService.generateSessionMessage('missing-session', 'summary')
      ).rejects.toThrow(ServiceError);
    });

    it('should handle empty player list', async () => {
      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockSessionData
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        }));

      const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
      expect(result.content).toContain('No settlements needed');
    });

    it('should handle invalid session dates', async () => {
      const invalidSessionData = {
        ...mockSessionData,
        startedAt: undefined,
        completedAt: undefined
      };

      mockDbService.executeQuery
        .mockReset()
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => invalidSessionData
          },
          rowsAffected: 1
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: mockPlayersData.length,
            item: (_index: number) => mockPlayersData[index]
          },
          rowsAffected: mockPlayersData.length
        }))
        .mockImplementationOnce(() => Promise.resolve({
          rows: {
            length: mockTransactionsData.length,
            item: (_index: number) => mockTransactionsData[index]
          },
          rowsAffected: mockTransactionsData.length
        }));

      const result = await whatsAppService.generateSessionMessage('session-1', 'summary');
      expect(result.content).toBeTruthy(); // Should still generate message
    });
  });
});