import { SessionCleanupService } from '../../../../src/services/core/SessionCleanupService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { NotificationService } from '../../../../src/services/infrastructure/NotificationService';
import { AppState } from 'react-native';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('../../../../src/services/infrastructure/NotificationService');
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
  },
}));

describe('SessionCleanupService', () => {
  let cleanupService: SessionCleanupService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockNotificationService: jest.Mocked<NotificationService>;

  // Helper to create proper QueryResult mock
  const createQueryResult = (data: any[] = [], rowsAffected: number = 0) => ({
    rows: { 
      raw: () => data,
      length: data.length,
      item: (index: number) => data[index]
    },
    rowsAffected
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset singleton
    (SessionCleanupService as any).instance = null;
    
    // Mock DatabaseService
    mockDatabaseService = {
      executeQuery: jest.fn(),
      executeTransaction: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    
    // Mock NotificationService
    mockNotificationService = {
      scheduleNotification: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    
    (NotificationService.getInstance as jest.Mock).mockReturnValue(mockNotificationService);
    
    cleanupService = SessionCleanupService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanupService.shutdown();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SessionCleanupService.getInstance();
      const instance2 = SessionCleanupService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await cleanupService.initialize();
      
      // Should call loadPendingTasks first
      expect(mockDatabaseService.executeQuery).toHaveBeenNthCalledWith(1,
        expect.stringContaining('SELECT * FROM scheduled_tasks')
      );
      expect(AppState.addEventListener).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockDatabaseService.executeQuery.mockRejectedValue(new Error('DB Error'));
      
      await expect(cleanupService.initialize()).rejects.toThrow('Failed to initialize cleanup service');
    });
  });

  describe('scheduleSessionCleanup', () => {
    it('should schedule cleanup for 10 hours after completion', async () => {
      const sessionId = 'test-session-1';
      const completedAt = new Date('2025-01-01T12:00:00Z');
      const expectedCleanupTime = new Date('2025-01-01T22:00:00Z');
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([], 1));
      
      await cleanupService.scheduleSessionCleanup(sessionId, completedAt);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET cleanup_at = ? WHERE id = ?',
        [expectedCleanupTime.toISOString(), sessionId]
      );
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO scheduled_tasks'),
        expect.arrayContaining([
          expect.any(String),
          sessionId,
          expectedCleanupTime.toISOString()
        ])
      );
    });
  });

  describe('checkPendingCleanups', () => {
    it('should clean up expired sessions', async () => {
      const expiredSession = {
        id: 'expired-session',
        name: 'Test Session',
        cleanup_at: '2025-01-01T10:00:00Z',
        has_export: 0
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([expiredSession])) // Sessions query
        .mockResolvedValueOnce(createQueryResult([])) // Warning query
        .mockImplementation(async (query) => {
          if (query.includes('DELETE')) {
            return createQueryResult([], 1);
          }
          return createQueryResult([]);
        });
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      // Mock current time to be after cleanup time
      jest.setSystemTime(new Date('2025-01-01T11:00:00Z'));
      
      await cleanupService.checkPendingCleanups();
      
      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled();
    });

    it('should schedule warning notifications', async () => {
      const sessionNeedingWarning = {
        id: 'warning-session',
        name: 'Warning Session',
        cleanup_at: '2025-01-01T11:00:00Z',
        warning_sent: 0
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([])) // Sessions query (no expired)
        .mockResolvedValueOnce(createQueryResult([sessionNeedingWarning])) // Warning query
        .mockResolvedValue(createQueryResult([], 1));
      
      // Mock current time to be 1 hour before cleanup
      jest.setSystemTime(new Date('2025-01-01T10:00:00Z'));
      
      await cleanupService.checkPendingCleanups();
      
      expect(mockNotificationService.scheduleNotification).toHaveBeenCalledWith({
        sessionId: 'warning-session',
        type: 'cleanup_warning',
        title: 'Session Data Expiring Soon',
        message: expect.stringContaining('Warning Session'),
        scheduledFor: expect.any(Date),
        priority: 1
      });
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET warning_sent = 1 WHERE id = ?',
        ['warning-session']
      );
    });

    it('should handle concurrent execution', async () => {
      // Create a slow-resolving promise to simulate real database delay
      let resolveDb: (value: any) => void;
      const dbPromise = new Promise(resolve => {
        resolveDb = resolve;
      });
      
      mockDatabaseService.executeQuery.mockReturnValue(dbPromise);
      
      // Start two concurrent checks
      const promise1 = cleanupService.checkPendingCleanups();
      const promise2 = cleanupService.checkPendingCleanups();
      
      // Resolve the database promise
      resolveDb!(createQueryResult([]));
      
      await Promise.all([promise1, promise2]);
      
      // Should only execute database queries from the first call
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledTimes(2); // sessions + warnings query
    });
  });

  describe('cleanupSession', () => {
    it('should delete all session-related data', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await cleanupService.cleanupSession(sessionId);
      
      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled();
      
      // Verify all expected DELETE queries
      const deleteCalls = mockDatabaseService.executeQuery.mock.calls.filter(
        call => call[0].includes('DELETE')
      );
      
      expect(deleteCalls).toEqual(
        expect.arrayContaining([
          ['DELETE FROM transactions WHERE session_id = ?', [sessionId]],
          ['DELETE FROM players WHERE session_id = ?', [sessionId]],
          ['DELETE FROM session_exports WHERE session_id = ?', [sessionId]],
          ['DELETE FROM scheduled_tasks WHERE session_id = ?', [sessionId]],
          ['DELETE FROM notification_queue WHERE session_id = ?', [sessionId]],
          ['DELETE FROM sessions WHERE id = ?', [sessionId]]
        ])
      );
      
      // Verify VACUUM is called
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith('VACUUM');
    });

    it('should create audit log before deletion', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await cleanupService.cleanupSession(sessionId);
      
      const auditCalls = mockDatabaseService.executeQuery.mock.calls.filter(
        call => call[0].includes('INSERT INTO scheduled_tasks')
      );
      
      expect(auditCalls.length).toBeGreaterThan(0);
      expect(auditCalls[0][1]).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/cleanup_test-session_\d+/),
          sessionId,
          expect.any(String),
          expect.any(String)
        ])
      );
    });
  });

  describe('cancelSessionCleanup', () => {
    it('should cancel scheduled cleanup and notifications', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await cleanupService.cancelSessionCleanup(sessionId);
      
      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled();
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET cleanup_at = NULL, warning_sent = 0 WHERE id = ?',
        [sessionId]
      );
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM scheduled_tasks WHERE session_id = ? AND status = "pending"',
        [sessionId]
      );
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM notification_queue WHERE session_id = ? AND delivered_at IS NULL',
        [sessionId]
      );
    });
  });

  describe('deleteSessionManually', () => {
    it('should delete session after validation', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([{ id: sessionId, name: 'Test' }])) // Session exists
        .mockResolvedValue(createQueryResult([], 1)); // Other queries
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await cleanupService.deleteSessionManually(sessionId);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE id = ?',
        [sessionId]
      );
    });

    it('should throw error if session not found', async () => {
      const sessionId = 'nonexistent-session';
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await expect(cleanupService.deleteSessionManually(sessionId))
        .rejects.toThrow('Session not found for deletion');
    });
  });

  describe('timer management', () => {
    it('should start cleanup timer on initialization', async () => {
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await cleanupService.initialize();
      
      // Verify timer is set up (can't directly test setInterval, but we can test the effect)
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should clean up timers on shutdown', () => {
      cleanupService.shutdown();
      
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should handle app state changes', async () => {
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await cleanupService.initialize();
      
      // Verify AppState listener was added
      expect(AppState.addEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDatabaseService.executeQuery.mockRejectedValue(new Error('Database error'));
      
      // Should not throw, but log error
      await expect(cleanupService.checkPendingCleanups()).resolves.not.toThrow();
    });

    it('should handle notification errors gracefully', async () => {
      const sessionNeedingWarning = {
        id: 'warning-session',
        name: 'Warning Session',
        cleanup_at: '2025-01-01T11:00:00Z',
        warning_sent: 0
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([]))
        .mockResolvedValueOnce(createQueryResult([sessionNeedingWarning]));
      
      mockNotificationService.scheduleNotification.mockRejectedValue(
        new Error('Notification error')
      );
      
      jest.setSystemTime(new Date('2025-01-01T10:00:00Z'));
      
      // Should continue execution despite notification error
      await expect(cleanupService.checkPendingCleanups()).resolves.not.toThrow();
    });
  });

  describe('data integrity', () => {
    it('should use transactions for all multi-step operations', async () => {
      const sessionId = 'test-session';
      
      await cleanupService.cleanupSession(sessionId);
      
      expect(mockDatabaseService.executeTransaction).toHaveBeenCalled();
    });

    it('should maintain referential integrity during cleanup', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await cleanupService.cleanupSession(sessionId);
      
      // Verify deletion order: children first, then parent
      const deleteCalls = mockDatabaseService.executeQuery.mock.calls
        .filter(call => call[0].includes('DELETE'))
        .map(call => call[0]);
      
      const sessionDeleteIndex = deleteCalls.findIndex(query => 
        query.includes('DELETE FROM sessions')
      );
      const transactionDeleteIndex = deleteCalls.findIndex(query => 
        query.includes('DELETE FROM transactions')
      );
      
      expect(transactionDeleteIndex).toBeLessThan(sessionDeleteIndex);
    });
  });
});