import { SessionService } from '../../../src/services/core/SessionService';
import { SessionCleanupService } from '../../../src/services/core/SessionCleanupService';
import { NotificationService } from '../../../src/services/infrastructure/NotificationService';
import { ExportService } from '../../../src/services/infrastructure/ExportService';
import { DatabaseService } from '../../../src/services/infrastructure/DatabaseService';

// Mock dependencies
jest.mock('../../../src/services/infrastructure/DatabaseService');
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
  },
  Alert: {
    alert: jest.fn(),
  },
}));
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
}));

describe('Session Lifecycle Integration', () => {
  let sessionService: SessionService;
  let cleanupService: SessionCleanupService;
  let notificationService: NotificationService;
  let exportService: ExportService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset singletons
    (SessionService as any).instance = null;
    (SessionCleanupService as any).instance = null;
    (NotificationService as any).instance = null;
    (ExportService as any).instance = null;
    
    // Mock DatabaseService
    mockDb = {
      executeQuery: jest.fn(),
      executeTransaction: jest.fn(),
      getInstance: jest.fn(),
      createSession: jest.fn(),
      getSession: jest.fn(),
      updateSession: jest.fn(),
      getPlayers: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
    } as any;
    
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDb);
    
    // Initialize services
    sessionService = SessionService.getInstance();
    cleanupService = SessionCleanupService.getInstance();
    notificationService = NotificationService.getInstance();
    exportService = ExportService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanupService.shutdown();
    notificationService.shutdown();
  });

  describe('Complete Session Lifecycle', () => {
    it('should handle complete session lifecycle from creation to cleanup', async () => {
      const sessionId = 'test-session-123';
      const completedAt = new Date('2025-01-01T12:00:00Z');
      const cleanupAt = new Date('2025-01-01T22:00:00Z'); // 10 hours later
      
      // Mock session creation
      const mockSession = {
        id: sessionId,
        name: 'Test Session',
        status: 'completed',
        completedAt,
        cleanup_at: cleanupAt.toISOString(),
        total_pot: 500,
        player_count: 4
      };
      
      mockDb.getSession.mockResolvedValue(mockSession);
      mockDb.executeQuery.mockResolvedValue([]);
      mockDb.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      // Step 1: Complete session and schedule cleanup
      await sessionService.completeSession(sessionId);
      
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET cleanup_at = ? WHERE id = ?',
        [cleanupAt.toISOString(), sessionId]
      );
      
      // Step 2: Fast-forward to warning time (9 hours after completion)
      jest.setSystemTime(new Date('2025-01-01T21:00:00Z'));
      
      const sessionNeedingWarning = {
        id: sessionId,
        name: 'Test Session',
        cleanup_at: cleanupAt.toISOString(),
        warning_sent: 0
      };
      
      mockDb.executeQuery
        .mockResolvedValueOnce([]) // No expired sessions
        .mockResolvedValueOnce([sessionNeedingWarning]); // Session needs warning
      
      await cleanupService.checkPendingCleanups();
      
      // Should schedule warning notification
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_queue'),
        expect.arrayContaining([
          expect.any(String),
          sessionId,
          'cleanup_warning',
          'Session Data Expiring Soon',
          expect.stringContaining('Test Session'),
          expect.any(String),
          1
        ])
      );
      
      // Should mark warning as sent
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET warning_sent = 1 WHERE id = ?',
        [sessionId]
      );
      
      // Step 3: Fast-forward to cleanup time
      jest.setSystemTime(new Date('2025-01-01T22:30:00Z'));
      
      const expiredSession = {
        id: sessionId,
        name: 'Test Session',
        cleanup_at: cleanupAt.toISOString(),
        has_export: 0
      };
      
      mockDb.executeQuery
        .mockResolvedValueOnce([expiredSession]) // Expired session
        .mockResolvedValueOnce([]); // No warnings needed
      
      await cleanupService.checkPendingCleanups();
      
      // Should perform cleanup with all deletions
      expect(mockDb.executeTransaction).toHaveBeenCalled();
      
      const deleteCalls = mockDb.executeQuery.mock.calls.filter(
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
      
      // Should call VACUUM
      expect(mockDb.executeQuery).toHaveBeenCalledWith('VACUUM');
    });
    
    it('should cancel cleanup when session is exported', async () => {
      const sessionId = 'exported-session';
      
      mockDb.executeQuery.mockResolvedValue([]);
      mockDb.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      // Export session
      await sessionService.markSessionExported(sessionId, 'json', '/path/to/export.json');
      
      // Should update session with export info
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET exported_at = ?, export_format = ? WHERE id = ?',
        [expect.any(String), 'json', sessionId]
      );
      
      // Should cancel cleanup
      expect(mockDb.executeTransaction).toHaveBeenCalled();
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'UPDATE sessions SET cleanup_at = NULL, warning_sent = 0 WHERE id = ?',
        [sessionId]
      );
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM scheduled_tasks WHERE session_id = ? AND status = "pending"',
        [sessionId]
      );
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM notification_queue WHERE session_id = ? AND delivered_at IS NULL',
        [sessionId]
      );
    });
  });

  describe('Export Integration', () => {
    it('should handle export with cleanup integration', async () => {
      const sessionId = 'export-session';
      const sessionData = {
        session: {
          id: sessionId,
          name: 'Export Test',
          status: 'completed',
          total_pot: 300,
          started_at: '2025-01-01T19:00:00Z',
          completed_at: '2025-01-01T23:00:00Z'
        },
        players: [
          {
            id: 'player-1',
            name: 'Alice',
            total_buy_ins: 100,
            total_cash_outs: 150,
            current_balance: 50
          },
          {
            id: 'player-2',
            name: 'Bob',
            total_buy_ins: 200,
            total_cash_outs: 150,
            current_balance: -50
          }
        ],
        transactions: [
          {
            id: 'tx-1',
            player_id: 'player-1',
            type: 'buy_in',
            amount: 100,
            timestamp: '2025-01-01T19:30:00Z'
          },
          {
            id: 'tx-2',
            player_id: 'player-2',
            type: 'buy_in',
            amount: 200,
            timestamp: '2025-01-01T19:35:00Z'
          }
        ]
      };
      
      // Mock file system operations
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);
      RNFS.writeFile.mockResolvedValue();
      RNFS.stat.mockResolvedValue({ size: 1024 });
      
      // Mock database queries for export
      mockDb.executeQuery
        .mockResolvedValueOnce([sessionData.session]) // Session query
        .mockResolvedValueOnce(sessionData.players) // Players query
        .mockResolvedValueOnce(sessionData.transactions) // Transactions query
        .mockResolvedValue([]); // Other queries
      
      mockDb.executeTransaction.mockImplementation(async (callback) => {
        await callback();
      });
      
      await exportService.initialize();
      const result = await exportService.exportSession(sessionId, 'json');
      
      expect(result).toEqual({
        filePath: expect.stringContaining('session_export-session'),
        format: 'json',
        fileSize: 1024,
        checksum: expect.any(String)
      });
      
      // Should record export in database
      expect(mockDb.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO session_exports'),
        expect.arrayContaining([
          expect.any(String),
          sessionId,
          'json',
          expect.any(String),
          1024,
          expect.any(String)
        ])
      );
      
      // Should write proper JSON content
      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('"name":"Export Test"'),
        'utf8'
      );
    });
    
    it('should generate correct WhatsApp format', async () => {
      const sessionId = 'whatsapp-session';
      const sessionData = {
        session: {
          id: sessionId,
          name: 'Friday Game',
          total_pot: 400
        },
        players: [
          { name: 'Winner', current_balance: 150 },
          { name: 'Loser', current_balance: -150 }
        ],
        transactions: []
      };
      
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);
      RNFS.writeFile.mockResolvedValue();
      RNFS.stat.mockResolvedValue({ size: 512 });
      
      mockDb.executeQuery
        .mockResolvedValueOnce([sessionData.session])
        .mockResolvedValueOnce(sessionData.players)
        .mockResolvedValueOnce(sessionData.transactions)
        .mockResolvedValue([]);
      
      await exportService.initialize();
      await exportService.exportSession(sessionId, 'whatsapp');
      
      const writeCall = RNFS.writeFile.mock.calls.find(
        call => call[1].includes('🎰')
      );
      expect(writeCall).toBeTruthy();
      
      const content = writeCall[1];
      expect(content).toContain('🎰 *PokePot Session Summary*');
      expect(content).toContain('📅 Friday Game');
      expect(content).toContain('💰 Winner: $150.00');
      expect(content).toContain('💸 Loser: $150.00');
      expect(content).toContain('💵 *Total Pot:* $400');
      expect(content).toContain('Loser pays Winner $150.00');
      expect(content).toContain('_Generated by PokePot_');
    });
  });

  describe('Error Recovery', () => {
    it('should handle database failures gracefully', async () => {
      mockDb.executeQuery.mockRejectedValue(new Error('Database error'));
      
      // Should not throw, but handle gracefully
      await expect(cleanupService.checkPendingCleanups()).resolves.not.toThrow();
      await expect(notificationService.checkPendingNotifications()).resolves.not.toThrow();
    });
    
    it('should retry failed cleanup operations', async () => {
      const sessionId = 'retry-session';
      
      mockDb.executeTransaction
        .mockRejectedValueOnce(new Error('Transaction failed'))
        .mockImplementation(async (callback) => {
          await callback();
        });
      
      // First attempt should fail
      await expect(cleanupService.cleanupSession(sessionId)).rejects.toThrow();
      
      // Second attempt should succeed
      await expect(cleanupService.cleanupSession(sessionId)).resolves.not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent cleanup checks', async () => {
      mockDb.executeQuery.mockResolvedValue([]);
      
      // Start multiple concurrent cleanup checks
      const promises = [
        cleanupService.checkPendingCleanups(),
        cleanupService.checkPendingCleanups(),
        cleanupService.checkPendingCleanups()
      ];
      
      await Promise.all(promises);
      
      // Should only execute once due to isRunning flag
      expect(mockDb.executeQuery).toHaveBeenCalledTimes(1);
    });
    
    it('should handle concurrent exports of same session', async () => {
      const sessionId = 'concurrent-session';
      
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);
      RNFS.writeFile.mockResolvedValue();
      RNFS.stat.mockResolvedValue({ size: 1024 });
      
      mockDb.executeQuery
        .mockResolvedValue([{ id: sessionId, name: 'Test' }])
        .mockResolvedValue([])
        .mockResolvedValue([]);
      
      await exportService.initialize();
      
      // Start multiple concurrent exports
      const promises = [
        exportService.exportSession(sessionId, 'json'),
        exportService.exportSession(sessionId, 'csv')
      ];
      
      await Promise.all(promises);
      
      // Both should succeed with different formats
      expect(RNFS.writeFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Memory', () => {
    it('should clean up resources properly', () => {
      const initialTimerCount = jest.getTimerCount();
      
      cleanupService.shutdown();
      notificationService.shutdown();
      
      // Should clean up all timers
      expect(jest.getTimerCount()).toBeLessThanOrEqual(initialTimerCount);
    });
    
    it('should handle large session datasets efficiently', async () => {
      const sessionId = 'large-session';
      
      // Generate large dataset
      const players = Array.from({ length: 100 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        current_balance: Math.random() * 1000 - 500
      }));
      
      const transactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx-${i}`,
        player_id: `player-${i % 100}`,
        type: i % 2 === 0 ? 'buy_in' : 'cash_out',
        amount: 50,
        timestamp: new Date().toISOString()
      }));
      
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);
      RNFS.writeFile.mockResolvedValue();
      RNFS.stat.mockResolvedValue({ size: 50000 });
      
      mockDb.executeQuery
        .mockResolvedValueOnce([{ id: sessionId, name: 'Large Session', total_pot: 50000 }])
        .mockResolvedValueOnce(players)
        .mockResolvedValueOnce(transactions)
        .mockResolvedValue([]);
      
      await exportService.initialize();
      
      const startTime = Date.now();
      await exportService.exportSession(sessionId, 'json');
      const endTime = Date.now();
      
      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Should handle large JSON serialization
      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'utf8'
      );
    });
  });
});