/**
 * WhatsApp Integration Tests
 * Tests complete end-to-end workflows for WhatsApp sharing functionality
 */
import { WhatsAppService } from '../../../src/services/integration/WhatsAppService';
import { MessageQueue } from '../../../src/services/integration/MessageQueue';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

// Mock external dependencies
jest.mock('../../../src/services/infrastructure/DatabaseService', () => ({
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
const mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

describe('WhatsApp Integration', () => {
  let whatsAppService: WhatsAppService;
  let messageQueue: MessageQueue;
  let mockDbService: jest.Mocked<DatabaseService>;

  const mockCompleteSession = {
    session: {
      id: 'session-integration-test',
      name: 'Integration Test Session',
      organizerId: 'organizer-1',
      status: 'completed' as const,
      createdAt: new Date('2025-08-12T19:00:00Z'),
      startedAt: new Date('2025-08-12T19:00:00Z'),
      completedAt: new Date('2025-08-12T22:30:00Z'),
      totalPot: 500.00,
      playerCount: 4
    },
    players: [
      {
        id: 'player-1',
        sessionId: 'session-integration-test',
        name: 'Alice',
        isGuest: true,
        currentBalance: 100.00,
        totalBuyIns: 100.00,
        totalCashOuts: 200.00,
        status: 'active' as const,
        joinedAt: new Date('2025-08-12T19:00:00Z')
      },
      {
        id: 'player-2',
        sessionId: 'session-integration-test',
        name: 'Bob',
        isGuest: true,
        currentBalance: -50.00,
        totalBuyIns: 150.00,
        totalCashOuts: 100.00,
        status: 'active' as const,
        joinedAt: new Date('2025-08-12T19:00:00Z')
      },
      {
        id: 'player-3',
        sessionId: 'session-integration-test',
        name: 'Charlie',
        isGuest: true,
        currentBalance: -30.00,
        totalBuyIns: 120.00,
        totalCashOuts: 90.00,
        status: 'active' as const,
        joinedAt: new Date('2025-08-12T19:00:00Z')
      },
      {
        id: 'player-4',
        sessionId: 'session-integration-test',
        name: 'Diana',
        isGuest: true,
        currentBalance: -20.00,
        totalBuyIns: 130.00,
        totalCashOuts: 110.00,
        status: 'active' as const,
        joinedAt: new Date('2025-08-12T19:00:00Z')
      }
    ],
    transactions: [
      // Buy-ins
      { id: 'tx-1', sessionId: 'session-integration-test', playerId: 'player-1', type: 'buy_in' as const, amount: 100.00, timestamp: new Date('2025-08-12T19:05:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-2', sessionId: 'session-integration-test', playerId: 'player-2', type: 'buy_in' as const, amount: 150.00, timestamp: new Date('2025-08-12T19:10:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-3', sessionId: 'session-integration-test', playerId: 'player-3', type: 'buy_in' as const, amount: 120.00, timestamp: new Date('2025-08-12T19:15:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-4', sessionId: 'session-integration-test', playerId: 'player-4', type: 'buy_in' as const, amount: 130.00, timestamp: new Date('2025-08-12T19:20:00Z'), method: 'manual' as const, isVoided: false },
      // Cash-outs
      { id: 'tx-5', sessionId: 'session-integration-test', playerId: 'player-1', type: 'cash_out' as const, amount: 200.00, timestamp: new Date('2025-08-12T22:25:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-6', sessionId: 'session-integration-test', playerId: 'player-2', type: 'cash_out' as const, amount: 100.00, timestamp: new Date('2025-08-12T22:26:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-7', sessionId: 'session-integration-test', playerId: 'player-3', type: 'cash_out' as const, amount: 90.00, timestamp: new Date('2025-08-12T22:27:00Z'), method: 'manual' as const, isVoided: false },
      { id: 'tx-8', sessionId: 'session-integration-test', playerId: 'player-4', type: 'cash_out' as const, amount: 110.00, timestamp: new Date('2025-08-12T22:28:00Z'), method: 'manual' as const, isVoided: false }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DatabaseService
    mockDbService = {
      executeQuery: jest.fn(),
      getInstance: jest.fn(),
    } as any;

    // Setup database responses with proper QueryResult structure
    mockDbService.executeQuery.mockImplementation((query: string) => {
      if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
        return Promise.resolve({
          rows: {
            length: 1,
            item: (_index: number) => mockCompleteSession.session
          },
          rowsAffected: 1
        });
      }
      if (query.includes('SELECT * FROM players WHERE session_id = ?')) {
        return Promise.resolve({
          rows: {
            length: mockCompleteSession.players.length,
            item: (_index: number) => mockCompleteSession.players[index]
          },
          rowsAffected: mockCompleteSession.players.length
        });
      }
      if (query.includes('SELECT * FROM transactions')) {
        return Promise.resolve({
          rows: {
            length: mockCompleteSession.transactions.length,
            item: (_index: number) => mockCompleteSession.transactions[index]
          },
          rowsAffected: mockCompleteSession.transactions.length
        });
      }
      if (query.includes('CREATE TABLE IF NOT EXISTS message_queue')) {
        return Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        });
      }
      if (query.includes('INSERT INTO message_queue')) {
        return Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 1
        });
      }
      if (query.includes('SELECT * FROM message_queue')) {
        return Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        });
      }
      return Promise.resolve({
        rows: { length: 0, item: () => null },
        rowsAffected: 0
      });
    });

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDbService);

    // Get fresh instances
    whatsAppService = WhatsAppService.getInstance();
    messageQueue = MessageQueue.getInstance();
  });

  afterEach(() => {
    // Reset singletons
    (WhatsAppService as any).instance = null;
    (MessageQueue as any).instance = null;
  });

  describe('complete sharing workflow', () => {
    it('should generate and share complete session results successfully', async () => {
      // Setup successful WhatsApp sharing
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(true);

      // Generate message
      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'detailed');

      // Verify message content
      expect(message.content).toContain('Integration Test Session');
      expect(message.content).toContain('Total Pot: $500.00');
      expect(message.content).toContain('3h 30m'); // Duration
      expect(message.content).toContain('Player Summary:');
      expect(message.content).toContain('Alice: $100 in → $200 out = +$100');
      expect(message.content).toContain('Bob: $150 in → $100 out = $-50');
      expect(message.content).toContain('Charlie: $120 in → $90 out = $-30');
      expect(message.content).toContain('Diana: $130 in → $110 out = $-20');
      expect(message.content).toContain('Settlement Optimization:');

      // Share message
      const shareResult = await whatsAppService.shareToWhatsApp(message);

      expect(shareResult.success).toBe(true);
      expect(shareResult.method).toBe('whatsapp');
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(message.content))
      );
    });

    it('should handle offline scenario with message queuing', async () => {
      // Setup offline scenario
      mockLinking.canOpenURL.mockResolvedValue(false);
      mockClipboard.setString.mockResolvedValue();

      // Generate message
      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'summary');

      // Try to share (should fallback to clipboard)
      const shareResult = await whatsAppService.shareToWhatsApp(message);

      expect(shareResult.success).toBe(true);
      expect(shareResult.method).toBe('clipboard');
      expect(mockClipboard.setString).toHaveBeenCalledWith(message.content);

      // Queue message for later
      const queueId = await messageQueue.queueMessage(message.content);
      expect(queueId).toBeDefined();
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'INSERT INTO message_queue (id, message, retry_count, created_at) VALUES (?, ?, ?, ?)',
        expect.arrayContaining([queueId, message.content, 0, expect.any(String)])
      );
    });

    it('should process queued messages when connectivity restored', async () => {
      // Setup initial offline state
      mockLinking.canOpenURL.mockResolvedValueOnce(false);
      mockClipboard.setString.mockResolvedValue();

      // Queue a message
      const queueId = await messageQueue.queueMessage('Test queued message');

      // Mock pending messages in queue
      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM message_queue')) {
          return Promise.resolve({
            rows: {
              length: 1,
              item: (_index: number) => ({
                id: queueId,
                message: 'Test queued message',
                retry_count: 0,
                created_at: new Date().toISOString(),
                last_attempt: null
              })
            },
            rowsAffected: 1
          });
        }
        return Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        });
      });

      // Setup online state for processing
      (whatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(true);

      // Process queue
      await messageQueue.processQueue();

      // Verify message was processed
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('Test queued message')
      );
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM message_queue WHERE id = ?',
        [queueId]
      );
    });
  });

  describe('settlement calculations', () => {
    it('should calculate optimal settlements correctly', async () => {
      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'detailed');

      // Alice won $100, needs to receive money
      // Bob lost $50, Charlie lost $30, Diana lost $20 (total $100)
      // Optimal settlements should minimize transactions
      expect(message.content).toContain('Settlement Optimization:');
      
      // Should contain settlement instructions
      const settlementLines = message.content.split('\n').filter(line => line.includes(' pays '));
      expect(settlementLines.length).toBeGreaterThan(0);
      
      // Verify mathematical balance
      let totalPayments = 0;
      settlementLines.forEach(line => {
        const match = line.match(/\$(\d+\.?\d*)/);
        if (match) {
          totalPayments += parseFloat(match[1]);
        }
      });
      expect(totalPayments).toBe(100.00); // Should equal Alice's winnings
    });

    it('should handle edge case with no settlements needed', async () => {
      // Mock balanced session
      const balancedSession = {
        ...mockCompleteSession.session,
        totalPot: 200.00
      };
      const balancedTransactions = [
        { id: 'tx-1', sessionId: 'session-integration-test', playerId: 'player-1', type: 'buy_in' as const, amount: 100.00, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-2', sessionId: 'session-integration-test', playerId: 'player-2', type: 'buy_in' as const, amount: 100.00, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-3', sessionId: 'session-integration-test', playerId: 'player-1', type: 'cash_out' as const, amount: 100.00, timestamp: new Date(), method: 'manual' as const, isVoided: false },
        { id: 'tx-4', sessionId: 'session-integration-test', playerId: 'player-2', type: 'cash_out' as const, amount: 100.00, timestamp: new Date(), method: 'manual' as const, isVoided: false }
      ];

      mockDbService.executeQuery
        .mockReset()
        .mockImplementation((query: string) => {
          if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
            return Promise.resolve([balancedSession]);
          }
          if (query.includes('SELECT * FROM players WHERE session_id = ?')) {
            return Promise.resolve(mockCompleteSession.players.slice(0, 2));
          }
          if (query.includes('SELECT * FROM transactions')) {
            return Promise.resolve(balancedTransactions);
          }
          return Promise.resolve([]);
        });

      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'summary');
      
      expect(message.content).toContain('No settlements needed - everyone broke even!');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle database errors gracefully', async () => {
      mockDbService.executeQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        whatsAppService.generateSessionMessage('session-integration-test', 'summary')
      ).rejects.toThrow('Failed to generate WhatsApp message');
    });

    it('should handle network errors during sharing', async () => {
      mockLinking.canOpenURL.mockRejectedValue(new Error('Network error'));
      mockClipboard.setString.mockResolvedValue();

      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'summary');
      const result = await whatsAppService.shareToWhatsApp(message);

      expect(result.success).toBe(true);
      expect(result.method).toBe('clipboard');
      expect(result.error).toContain('Network error');
    });

    it('should retry failed messages correctly', async () => {
      const queueId = await messageQueue.queueMessage('Test retry message');

      // Mock failed message in queue
      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM message_queue')) {
          return Promise.resolve([{
            id: queueId,
            message: 'Test retry message',
            retry_count: 1,
            created_at: new Date().toISOString(),
            last_attempt: new Date().toISOString()
          }]);
        }
        return Promise.resolve([]);
      });

      // Setup sharing failure
      (whatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockRejectedValue(new Error('Share failed'));

      await messageQueue.processQueue();

      // Should increment retry count
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'UPDATE message_queue SET retry_count = retry_count + 1, last_attempt = ? WHERE id = ?',
        [expect.any(String), queueId]
      );
    });

    it('should stop retrying after max attempts', async () => {
      const maxRetryMessage = {
        id: 'max-retry-msg',
        message: 'Max retry message',
        retry_count: 3, // Assuming MAX_RETRY_ATTEMPTS is 3
        created_at: new Date().toISOString(),
        last_attempt: new Date().toISOString()
      };

      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('WHERE retry_count <')) {
          return Promise.resolve([]); // No messages under retry limit
        }
        return Promise.resolve([maxRetryMessage]);
      });

      (whatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);

      await messageQueue.processQueue();

      // Should not attempt to share
      expect(mockLinking.openURL).not.toHaveBeenCalled();
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large sessions efficiently', async () => {
      // Create session with many players and transactions
      const manyPlayers = Array.from({ length: 8 }, (_, i) => ({
        ...mockCompleteSession.players[0],
        id: `player-${i + 1}`,
        name: `Player${i + 1}`,
        totalBuyIns: 50 + i * 10,
        totalCashOuts: 45 + i * 10,
      }));

      const manyTransactions = Array.from({ length: 16 }, (_, i) => ({
        ...mockCompleteSession.transactions[0],
        id: `tx-${i + 1}`,
        playerId: `player-${(i % 8) + 1}`,
        type: i < 8 ? 'buy_in' as const : 'cash_out' as const,
        amount: 50 + (i % 8) * 10,
      }));

      mockDbService.executeQuery
        .mockReset()
        .mockImplementation((query: string) => {
          if (query.includes('SELECT * FROM sessions WHERE id = ?')) {
            return Promise.resolve([mockCompleteSession.session]);
          }
          if (query.includes('SELECT * FROM players WHERE session_id = ?')) {
            return Promise.resolve(manyPlayers);
          }
          if (query.includes('SELECT * FROM transactions')) {
            return Promise.resolve(manyTransactions);
          }
          return Promise.resolve([]);
        });

      const startTime = Date.now();
      const message = await whatsAppService.generateSessionMessage('session-integration-test', 'detailed');
      const endTime = Date.now();

      expect(message.content).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(message.characterCount).toBeGreaterThan(0);
    });

    it('should handle concurrent processing safely', async () => {
      const queueId = await messageQueue.queueMessage('Concurrent test message');

      // Mock message in queue
      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM message_queue')) {
          return Promise.resolve([{
            id: queueId,
            message: 'Concurrent test message',
            retry_count: 0,
            created_at: new Date().toISOString(),
            last_attempt: null
          }]);
        }
        return Promise.resolve([]);
      });

      (whatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue(true);

      // Process queue concurrently
      const processing1 = messageQueue.processQueue();
      const processing2 = messageQueue.processQueue();
      const processing3 = messageQueue.processQueue();

      await Promise.all([processing1, processing2, processing3]);

      // Should only process once due to concurrency protection
      expect(mockLinking.openURL).toHaveBeenCalledTimes(1);
    });
  });
});