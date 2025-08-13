import { NotificationService } from '../../../../src/services/infrastructure/NotificationService';
import { DatabaseService } from '../../../../src/services/infrastructure/DatabaseService';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('../../../../src/services/infrastructure/DatabaseService');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockAlert: jest.MockedFunction<typeof Alert.alert>;

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
    (NotificationService as any).instance = null;
    
    // Mock DatabaseService
    mockDatabaseService = {
      executeQuery: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    
    (DatabaseService.getInstance as jest.Mock).mockReturnValue(mockDatabaseService);
    
    // Mock Alert
    mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
    
    notificationService = NotificationService.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
    notificationService.shutdown();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult());
      
      await notificationService.initialize();
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_queue'),
        expect.any(Array)
      );
    });

    it('should handle initialization errors gracefully', async () => {
      mockDatabaseService.executeQuery.mockRejectedValue(new Error('DB Error'));
      
      // Should not throw because checkPendingNotifications catches errors internally
      await expect(notificationService.initialize()).resolves.not.toThrow();
    });
  });

  describe('scheduleNotification', () => {
    it('should insert notification into queue', async () => {
      const notificationData = {
        sessionId: 'test-session',
        type: 'cleanup_warning' as const,
        title: 'Test Notification',
        message: 'This is a test',
        scheduledFor: new Date('2025-01-01T12:00:00Z'),
        priority: 1
      };
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([], 1));
      
      await notificationService.scheduleNotification(notificationData);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_queue'),
        expect.arrayContaining([
          expect.any(String), // id
          'test-session',
          'cleanup_warning',
          'Test Notification',
          'This is a test',
          '2025-01-01T12:00:00.000Z',
          1
        ])
      );
    });

    it('should trigger immediate check for past scheduled time', async () => {
      const pastTime = new Date(Date.now() - 1000); // 1 second ago
      
      const notificationData = {
        type: 'cleanup_warning' as const,
        title: 'Immediate Test',
        message: 'Should deliver immediately',
        scheduledFor: pastTime
      };
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([], 1));
      
      await notificationService.scheduleNotification(notificationData);
      
      // Should call checkPendingNotifications due to past scheduled time
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle optional fields correctly', async () => {
      const minimalData = {
        type: 'session_complete' as const,
        title: 'Minimal Test',
        message: 'Minimal notification',
        scheduledFor: new Date('2025-01-01T12:00:00Z')
      };
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([], 1));
      
      await notificationService.scheduleNotification(minimalData);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_queue'),
        expect.arrayContaining([
          expect.any(String),
          null, // sessionId should be null
          'session_complete',
          'Minimal Test',
          'Minimal notification',
          '2025-01-01T12:00:00.000Z',
          0 // default priority
        ])
      );
    });
  });

  describe('checkPendingNotifications', () => {
    it('should deliver pending notifications', async () => {
      const pendingNotification = {
        id: 'notif-1',
        title: 'Test Alert',
        message: 'This is a test alert',
        type: 'cleanup_warning',
        session_id: 'test-session'
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([pendingNotification])) // Pending notifications
        .mockResolvedValue(createQueryResult([], 1)); // Mark as delivered
      
      // Mock Alert.alert to automatically call the first button (Dismiss)
      mockAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      await notificationService.checkPendingNotifications();
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Test Alert',
        'This is a test alert',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Dismiss' }),
          expect.objectContaining({ text: 'View Session' })
        ]),
        { cancelable: false }
      );
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE notification_queue SET delivered_at = ? WHERE id = ?',
        [expect.any(String), 'notif-1']
      );
    });

    it('should handle multiple notifications in priority order', async () => {
      const notifications = [
        {
          id: 'notif-1',
          title: 'Low Priority',
          message: 'Low priority message',
          type: 'export_reminder',
          priority: 0
        },
        {
          id: 'notif-2',
          title: 'High Priority',
          message: 'High priority message',
          type: 'cleanup_warning',
          priority: 1
        }
      ];
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult(notifications))
        .mockResolvedValue(createQueryResult([], 1));
      
      mockAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      await notificationService.checkPendingNotifications();
      
      // Should be called twice, once for each notification
      expect(mockAlert).toHaveBeenCalledTimes(2);
      
      // Verify both notifications were marked as delivered
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE notification_queue SET delivered_at = ? WHERE id = ?',
        [expect.any(String), 'notif-1']
      );
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE notification_queue SET delivered_at = ? WHERE id = ?',
        [expect.any(String), 'notif-2']
      );
    });

    it('should handle errors gracefully', async () => {
      mockDatabaseService.executeQuery.mockRejectedValue(new Error('Database error'));
      
      // Should not throw
      await expect(notificationService.checkPendingNotifications()).resolves.not.toThrow();
    });
  });

  describe('showImmediateAlert', () => {
    it('should show alert with default OK button', async () => {
      mockAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      await notificationService.showImmediateAlert('Test Title', 'Test Message');
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Test Title',
        'Test Message',
        [expect.objectContaining({ text: 'OK' })],
        { cancelable: false }
      );
    });

    it('should show alert with custom actions', async () => {
      const customActions = [
        { text: 'Custom Action', onPress: jest.fn() }
      ];
      
      mockAlert.mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      await notificationService.showImmediateAlert(
        'Custom Title',
        'Custom Message',
        customActions
      );
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Custom Title',
        'Custom Message',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Custom Action' })
        ]),
        { cancelable: false }
      );
    });
  });

  describe('confirmAction', () => {
    it('should return true when user confirms', async () => {
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user clicking "Confirm" button
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });
      
      const result = await notificationService.confirmAction(
        'Confirm Title',
        'Are you sure?'
      );
      
      expect(result).toBe(true);
      expect(mockAlert).toHaveBeenCalledWith(
        'Confirm Title',
        'Are you sure?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
          expect.objectContaining({ text: 'Confirm', style: 'destructive' })
        ]),
        { cancelable: false }
      );
    });

    it('should return false when user cancels', async () => {
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user clicking "Cancel" button
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      const result = await notificationService.confirmAction(
        'Confirm Title',
        'Are you sure?'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('cancelSessionNotifications', () => {
    it('should cancel all undelivered notifications for session', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([], 1));
      
      await notificationService.cancelSessionNotifications(sessionId);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM notification_queue WHERE session_id = ? AND delivered_at IS NULL',
        [sessionId]
      );
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history with limit', async () => {
      const mockHistory = [
        { id: 'notif-1', title: 'Test 1', delivered_at: '2025-01-01T12:00:00Z' },
        { id: 'notif-2', title: 'Test 2', delivered_at: '2025-01-01T11:00:00Z' }
      ];
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult(mockHistory));
      
      const result = await notificationService.getNotificationHistory();
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_queue'),
        [50] // default limit
      );
      expect(result).toEqual(mockHistory);
    });

    it('should filter by session ID when provided', async () => {
      const sessionId = 'test-session';
      
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await notificationService.getNotificationHistory(sessionId, 25);
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND session_id = ?'),
        [sessionId, 25]
      );
    });
  });

  describe('timer management', () => {
    it('should start notification checker on initialization', async () => {
      mockDatabaseService.executeQuery.mockResolvedValue(createQueryResult([]));
      
      await notificationService.initialize();
      
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should clean up timers on shutdown', () => {
      notificationService.shutdown();
      
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('notification handling', () => {
    it('should mark notification as dismissed when dismiss button is pressed', async () => {
      const notification = {
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
        type: 'cleanup_warning'
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([notification]))
        .mockResolvedValue(createQueryResult([], 1));
      
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user clicking "Dismiss" button
        if (buttons && buttons[0] && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      await notificationService.checkPendingNotifications();
      
      expect(mockDatabaseService.executeQuery).toHaveBeenCalledWith(
        'UPDATE notification_queue SET dismissed_at = ? WHERE id = ?',
        [expect.any(String), 'notif-1']
      );
    });

    it('should handle notification action button correctly', async () => {
      const notification = {
        id: 'notif-1',
        title: 'Test',
        message: 'Test message',
        type: 'cleanup_warning',
        session_id: 'test-session'
      };
      
      mockDatabaseService.executeQuery
        .mockResolvedValueOnce(createQueryResult([notification]))
        .mockResolvedValue(createQueryResult([], 1));
      
      // Mock console.log to verify navigation call
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockAlert.mockImplementation((title, message, buttons) => {
        // Simulate user clicking "View Session" button
        if (buttons && buttons[1] && buttons[1].onPress) {
          buttons[1].onPress();
        }
      });
      
      await notificationService.checkPendingNotifications();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Navigate to export for session:',
        'test-session'
      );
      
      consoleSpy.mockRestore();
    });
  });
});