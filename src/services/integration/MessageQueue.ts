/**
 * MessageQueue - Service for handling offline message queuing and retry logic
 * Implements Story 1.6 requirements for offline message storage and network connectivity handling
 */
import { DatabaseService } from '../infrastructure/DatabaseService';
import { ServiceError } from '../core/ServiceError';
import {
  MessageQueueItem,
  MAX_RETRY_ATTEMPTS
} from '../../types/whatsapp';
import { WhatsAppService } from './WhatsAppService';
import { generateUUID } from '../../utils/generateId';

export class MessageQueue {
  private static instance: MessageQueue | null = null;
  private dbService: DatabaseService;
  private whatsAppService: WhatsAppService;
  private retryInterval: any = null;
  private isProcessing: boolean = false;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.whatsAppService = WhatsAppService.getInstance();
    this.initializeMessageQueue();
  }

  /**
   * Get singleton instance of MessageQueue
   */
  public static getInstance(): MessageQueue {
    if (!MessageQueue.instance) {
      MessageQueue.instance = new MessageQueue();
    }
    return MessageQueue.instance;
  }

  /**
   * Initialize message queue table in database
   * AC: 5
   */
  private async initializeMessageQueue(): Promise<void> {
    try {
      await this.dbService.executeQuery(`
        CREATE TABLE IF NOT EXISTS message_queue (
          id TEXT PRIMARY KEY,
          message TEXT NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_attempt DATETIME,
          
          INDEX idx_message_queue_retry ON message_queue(retry_count, created_at)
        )
      `, []);

      // Start processing queue
      this.startQueueProcessor();
    } catch (error) {
      throw new ServiceError(
        'MESSAGE_QUEUE_INIT_FAILED',
        'Failed to initialize message queue',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Queue message for later delivery when network is available
   * AC: 5
   */
  public async queueMessage(message: string): Promise<string> {
    try {
      const queueItem: MessageQueueItem = {
        id: generateUUID(),
        message,
        retryCount: 0,
        createdAt: new Date()
      };

      await this.dbService.executeQuery(
        'INSERT INTO message_queue (id, message, retry_count, created_at) VALUES (?, ?, ?, ?)',
        [queueItem.id, queueItem.message, queueItem.retryCount, queueItem.createdAt.toISOString()]
      );

      return queueItem.id;
    } catch (error) {
      throw new ServiceError(
        'MESSAGE_QUEUE_ADD_FAILED',
        'Failed to add message to queue',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Process queued messages (attempt to send)
   * AC: 5
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return; // Avoid concurrent processing
    }

    this.isProcessing = true;

    try {
      // Check network connectivity (simplified check via WhatsApp availability)
      const isOnline = await this.checkConnectivity();
      
      if (!isOnline) {
        this.isProcessing = false;
        return;
      }

      // Get pending messages
      const pendingMessages = await this.getPendingMessages();
      
      for (const queueItem of pendingMessages) {
        try {
          // Generate WhatsApp message format
          const whatsAppMessage = {
            content: queueItem.message,
            format: 'summary' as const,
            sessionId: 'queued', // Placeholder for queued messages
            characterCount: queueItem.message.length,
            timestamp: queueItem.createdAt
          };

          // Attempt to share
          const result = await this.whatsAppService.shareWhatsAppMessage(whatsAppMessage);
          
          if (result.success && result.method === 'whatsapp') {
            // Successfully sent, remove from queue
            await this.removeFromQueue(queueItem.id);
          } else {
            // Failed to send via WhatsApp, increment retry count
            await this.incrementRetryCount(queueItem.id);
          }
        } catch (error) {
          // Error processing message, increment retry count
          await this.incrementRetryCount(queueItem.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Start automatic queue processing with retry intervals
   * AC: 5
   */
  private startQueueProcessor(): void {
    // Process every 30 seconds when there might be pending messages
    this.retryInterval = setInterval(async () => {
      await this.processQueue();
    }, 30000); // 30 seconds
  }

  /**
   * Stop automatic queue processing
   */
  public stopQueueProcessor(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Get pending messages from queue
   */
  private async getPendingMessages(): Promise<MessageQueueItem[]> {
    const results = await this.dbService.executeQuery(
      `SELECT * FROM message_queue 
       WHERE retry_count < ? 
       ORDER BY created_at ASC 
       LIMIT 10`,
      [MAX_RETRY_ATTEMPTS]
    );

    const messages: MessageQueueItem[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      messages.push({
        id: row.id,
        message: row.message,
        retryCount: row.retry_count,
        createdAt: new Date(row.created_at),
        lastAttempt: row.last_attempt ? new Date(row.last_attempt) : undefined
      });
    }
    
    return messages;
  }

  /**
   * Remove successfully sent message from queue
   */
  private async removeFromQueue(messageId: string): Promise<void> {
    await this.dbService.executeQuery(
      'DELETE FROM message_queue WHERE id = ?',
      [messageId]
    );
  }

  /**
   * Increment retry count for failed message
   */
  private async incrementRetryCount(messageId: string): Promise<void> {
    await this.dbService.executeQuery(
      'UPDATE message_queue SET retry_count = retry_count + 1, last_attempt = ? WHERE id = ?',
      [new Date().toISOString(), messageId]
    );
  }

  /**
   * Simple connectivity check (via WhatsApp availability)
   */
  private async checkConnectivity(): Promise<boolean> {
    // For offline message queue, we check if WhatsApp is available
    // This is a simplified check - in a real app you might use @react-native-community/netinfo
    try {
      // Access private method via type assertion for connectivity check
      return await (this.whatsAppService as any).isWhatsAppAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Get queue status for debugging/monitoring
   */
  public async getQueueStatus(): Promise<{
    pendingCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    const results = await this.dbService.executeQuery(
      `SELECT 
         COUNT(*) as total_count,
         COUNT(CASE WHEN retry_count < ? THEN 1 END) as pending_count,
         COUNT(CASE WHEN retry_count >= ? THEN 1 END) as failed_count
       FROM message_queue`,
      [MAX_RETRY_ATTEMPTS, MAX_RETRY_ATTEMPTS]
    );

    const result = results.rows.length > 0 ? results.rows.item(0) : { total_count: 0, pending_count: 0, failed_count: 0 };
    
    return {
      totalCount: result.total_count,
      pendingCount: result.pending_count,
      failedCount: result.failed_count
    };
  }

  /**
   * Clear failed messages from queue (manual cleanup)
   */
  public async clearFailedMessages(): Promise<number> {
    const result = await this.dbService.executeQuery(
      'DELETE FROM message_queue WHERE retry_count >= ?',
      [MAX_RETRY_ATTEMPTS]
    );
    
    return result.rowsAffected;
  }

  /**
   * Manual retry of failed messages (reset retry count)
   */
  public async retryFailedMessages(): Promise<void> {
    await this.dbService.executeQuery(
      'UPDATE message_queue SET retry_count = 0, last_attempt = NULL WHERE retry_count >= ?',
      [MAX_RETRY_ATTEMPTS]
    );
  }
}