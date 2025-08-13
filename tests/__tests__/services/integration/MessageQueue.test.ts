/**
 * MessageQueue Unit Tests
 * Tests offline message queuing, retry logic, and network connectivity handling
 */
import { MessageQueue } from '../../../../src/services/integration/MessageQueue';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { WhatsAppService } from '../../../../src/services/integration/WhatsAppService';
import { ServiceError } from '../../../../src/services/core/ServiceError';
import { MAX_RETRY_ATTEMPTS } from '../../../../src/types/whatsapp';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));
jest.mock('../../../../src/services/integration/WhatsAppService', () => ({
  WhatsAppService: {
    getInstance: jest.fn(),
  },
}));

describe('MessageQueue', () => {
  let messageQueue: MessageQueue;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockWhatsAppService: jest.Mocked<WhatsAppService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock DatabaseService
    mockDbService = {
      executeQuery: jest.fn(),
      getInstance: jest.fn(),
    } as any;

    // Mock WhatsAppService
    mockWhatsAppService = {
      shareToWhatsApp: jest.fn(),
      isWhatsAppAvailable: jest.fn(),
    } as any;

    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDbService);
    (WhatsAppService.getInstance as jest.Mock).mockReturnValue(mockWhatsAppService);

    // Mock successful database initialization with proper QueryResult structure
    mockDbService.executeQuery.mockImplementation((query: string) => {
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
    
    // Get fresh instance
    messageQueue = MessageQueue.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    messageQueue.stopQueueProcessor();
    // Reset singleton
    (MessageQueue as any).instance = null;
  });

  describe('initialization', () => {
    it('should initialize message queue table on creation', async () => {
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS message_queue'),
        []
      );
    });

    it('should handle initialization errors', async () => {
      mockDbService.executeQuery.mockRejectedValueOnce(new Error('DB Error'));
      
      // Reset singleton to test initialization error
      (MessageQueue as any).instance = null;
      
      await expect(() => MessageQueue.getInstance()).rejects.toThrow(ServiceError);
    });
  });

  describe('queueMessage', () => {
    it('should successfully queue a message', async () => {
      const testMessage = 'Test WhatsApp message';
      mockDbService.executeQuery.mockResolvedValueOnce([]);

      const messageId = await messageQueue.queueMessage(testMessage);

      expect(messageId).toBeDefined();
      expect(typeof messageId).toBe('string');
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'INSERT INTO message_queue (id, message, retry_count, created_at) VALUES (?, ?, ?, ?)',
        expect.arrayContaining([messageId, testMessage, 0, expect.any(String)])
      );
    });

    it('should handle queue insertion errors', async () => {
      mockDbService.executeQuery.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(messageQueue.queueMessage('Test message')).rejects.toThrow(ServiceError);
    });

    it('should generate unique message IDs', async () => {
      mockDbService.executeQuery.mockResolvedValue([]);

      const id1 = await messageQueue.queueMessage('Message 1');
      const id2 = await messageQueue.queueMessage('Message 2');

      expect(id1).not.toBe(id2);
    });
  });

  describe('processQueue', () => {
    const mockPendingMessages = [
      {
        id: 'msg-1',
        message: 'Test message 1',
        retry_count: 0,
        created_at: new Date().toISOString(),
        last_attempt: null
      },
      {
        id: 'msg-2',
        message: 'Test message 2', 
        retry_count: 1,
        created_at: new Date().toISOString(),
        last_attempt: new Date().toISOString()
      }
    ];

    beforeEach(() => {
      // Mock pending messages query with proper QueryResult structure
      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('SELECT * FROM message_queue')) {
          return Promise.resolve({
            rows: {
              length: mockPendingMessages.length,
              item: (index: number) => mockPendingMessages[index]
            },
            rowsAffected: mockPendingMessages.length
          });
        }
        return Promise.resolve({
          rows: { length: 0, item: () => null },
          rowsAffected: 0
        });
      });
    });

    it('should skip processing when offline', async () => {
      // Mock offline state
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(false);

      await messageQueue.processQueue();

      expect(mockWhatsAppService.shareToWhatsApp).not.toHaveBeenCalled();
    });

    it('should process pending messages when online', async () => {
      // Mock online state
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: true,
        method: 'whatsapp'
      });

      await messageQueue.processQueue();

      expect(mockWhatsAppService.shareToWhatsApp).toHaveBeenCalledTimes(2);
      // Should remove successful messages from queue
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM message_queue WHERE id = ?',
        ['msg-1']
      );
    });

    it('should increment retry count for failed messages', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: false,
        method: 'clipboard',
        error: 'Failed to share'
      });

      await messageQueue.processQueue();

      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'UPDATE message_queue SET retry_count = retry_count + 1, last_attempt = ? WHERE id = ?',
        [expect.any(String), 'msg-1']
      );
    });

    it('should handle processing errors gracefully', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockWhatsAppService.shareToWhatsApp.mockRejectedValue(new Error('Share error'));

      await messageQueue.processQueue();

      // Should increment retry count on error
      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE message_queue SET retry_count = retry_count + 1'),
        expect.any(Array)
      );
    });

    it('should prevent concurrent processing', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockWhatsAppService.shareToWhatsApp.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, method: 'whatsapp' }), 100))
      );

      // Start two concurrent processes
      const process1 = messageQueue.processQueue();
      const process2 = messageQueue.processQueue();

      await Promise.all([process1, process2]);

      // Should only process once due to concurrency protection
      expect(mockWhatsAppService.shareToWhatsApp).toHaveBeenCalledTimes(2); // Only one processing session
    });
  });

  describe('queue status and management', () => {
    it('should return correct queue status', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([{
        total_count: 5,
        pending_count: 3,
        failed_count: 2
      }]);

      const status = await messageQueue.getQueueStatus();

      expect(status).toEqual({
        totalCount: 5,
        pendingCount: 3,
        failedCount: 2
      });
    });

    it('should handle empty queue status', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([]);

      const status = await messageQueue.getQueueStatus();

      expect(status).toEqual({
        totalCount: 0,
        pendingCount: 0,
        failedCount: 0
      });
    });

    it('should clear failed messages', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([]);

      const result = await messageQueue.clearFailedMessages();

      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM message_queue WHERE retry_count >= ?',
        [MAX_RETRY_ATTEMPTS]
      );
      expect(result).toBe(0); // Simplified implementation returns 0
    });

    it('should retry failed messages', async () => {
      mockDbService.executeQuery.mockResolvedValueOnce([]);

      await messageQueue.retryFailedMessages();

      expect(mockDbService.executeQuery).toHaveBeenCalledWith(
        'UPDATE message_queue SET retry_count = 0, last_attempt = NULL WHERE retry_count >= ?',
        [MAX_RETRY_ATTEMPTS]
      );
    });
  });

  describe('automatic queue processing', () => {
    it('should start queue processor on initialization', () => {
      // Verify timer was set
      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        30000 // 30 seconds
      );
    });

    it('should process queue automatically at intervals', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(false);

      // Fast-forward timer
      jest.advanceTimersByTime(30000);

      // Wait for async operations
      await new Promise(resolve => setImmediate(resolve));

      expect((mockWhatsAppService as any).isWhatsAppAvailable).toHaveBeenCalled();
    });

    it('should stop queue processor when requested', () => {
      messageQueue.stopQueueProcessor();

      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('connectivity handling', () => {
    it('should check connectivity via WhatsApp availability', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);

      // Call private method through processQueue
      await messageQueue.processQueue();

      expect((mockWhatsAppService as any).isWhatsAppAvailable).toHaveBeenCalled();
    });

    it('should handle connectivity check errors', async () => {
      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockRejectedValue(new Error('Check failed'));

      // Should not throw error
      await expect(messageQueue.processQueue()).resolves.toBeUndefined();
    });
  });

  describe('message limits and constraints', () => {
    it('should respect retry attempt limits', async () => {
      const maxRetryMessages = [{
        id: 'msg-max',
        message: 'Max retries message',
        retry_count: MAX_RETRY_ATTEMPTS,
        created_at: new Date().toISOString(),
        last_attempt: new Date().toISOString()
      }];

      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('WHERE retry_count <')) {
          return Promise.resolve([]); // No messages under retry limit
        }
        return Promise.resolve(maxRetryMessages);
      });

      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);

      await messageQueue.processQueue();

      expect(mockWhatsAppService.shareToWhatsApp).not.toHaveBeenCalled();
    });

    it('should limit batch processing to 10 messages', async () => {
      const manyMessages = Array.from({ length: 15 }, (_, i) => ({
        id: `msg-${i}`,
        message: `Message ${i}`,
        retry_count: 0,
        created_at: new Date().toISOString(),
        last_attempt: null
      }));

      mockDbService.executeQuery.mockImplementation((query: string) => {
        if (query.includes('LIMIT 10')) {
          return Promise.resolve(manyMessages.slice(0, 10));
        }
        return Promise.resolve([]);
      });

      (mockWhatsAppService as any).isWhatsAppAvailable = jest.fn().mockResolvedValue(true);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: true,
        method: 'whatsapp'
      });

      await messageQueue.processQueue();

      expect(mockWhatsAppService.shareToWhatsApp).toHaveBeenCalledTimes(10);
    });
  });
});