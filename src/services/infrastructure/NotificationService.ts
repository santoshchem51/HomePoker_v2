import { Alert } from 'react-native';
import { DatabaseService } from './DatabaseService';
import { ServiceError, ErrorCode } from '../../types/errors';

interface NotificationData {
  sessionId?: string;
  type: 'cleanup_warning' | 'export_reminder' | 'session_complete';
  title: string;
  message: string;
  scheduledFor: Date;
  priority?: number;
}


export class NotificationService {
  private static instance: NotificationService | null = null;
  private db: DatabaseService;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private readonly CHECK_INTERVAL_MS = 60 * 1000; // 1 minute

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.checkPendingNotifications();
      this.startNotificationChecker();
    } catch (error) {
      throw new ServiceError(
        ErrorCode.NOTIFICATION_INIT_FAILED,
        'Failed to initialize notification service',
        error as Record<string, any>
      );
    }
  }

  private startNotificationChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkPendingNotifications();
    }, this.CHECK_INTERVAL_MS);
  }

  async checkPendingNotifications(): Promise<void> {
    try {
      const now = new Date();
      const query = `
        SELECT * FROM notification_queue
        WHERE scheduled_for <= ?
        AND delivered_at IS NULL
        ORDER BY priority DESC, scheduled_for ASC
      `;
      
      const notificationResult = await this.db.executeQuery(query, [now.toISOString()]);
      const notifications = notificationResult.rows.raw();
      
      for (const notification of notifications) {
        await this.deliverNotification(notification);
      }
    } catch (error) {
      console.error('Failed to check pending notifications:', error);
    }
  }

  private async deliverNotification(notification: any): Promise<void> {
    try {
      await new Promise<void>((resolve) => {
        Alert.alert(
          notification.title,
          notification.message,
          [
            {
              text: 'Dismiss',
              style: 'cancel',
              onPress: () => {
                this.markNotificationDismissed(notification.id);
                resolve();
              }
            },
            {
              text: 'View Session',
              onPress: () => {
                this.handleNotificationAction(notification);
                resolve();
              }
            }
          ],
          { cancelable: false }
        );
      });
      
      await this.markNotificationDelivered(notification.id);
    } catch (error) {
      console.error('Failed to deliver notification:', error);
    }
  }

  private async markNotificationDelivered(notificationId: string): Promise<void> {
    await this.db.executeQuery(
      'UPDATE notification_queue SET delivered_at = ? WHERE id = ?',
      [new Date().toISOString(), notificationId]
    );
  }

  private async markNotificationDismissed(notificationId: string): Promise<void> {
    await this.db.executeQuery(
      'UPDATE notification_queue SET dismissed_at = ? WHERE id = ?',
      [new Date().toISOString(), notificationId]
    );
  }

  private handleNotificationAction(notification: any): void {
    switch (notification.type) {
      case 'cleanup_warning':
        this.navigateToExport(notification.session_id);
        break;
      case 'export_reminder':
        this.navigateToExport(notification.session_id);
        break;
      case 'session_complete':
        this.navigateToSession(notification.session_id);
        break;
    }
  }

  private navigateToExport(sessionId: string): void {
    // This will be handled by the app navigation
    // Emit an event or call a navigation handler
    console.log('Navigate to export for session:', sessionId);
  }

  private navigateToSession(sessionId: string): void {
    // This will be handled by the app navigation
    console.log('Navigate to session:', sessionId);
  }

  async scheduleNotification(data: NotificationData): Promise<void> {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO notification_queue (
        id, session_id, type, title, message, 
        scheduled_for, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await this.db.executeQuery(query, [
      id,
      data.sessionId || null,
      data.type,
      data.title,
      data.message,
      data.scheduledFor.toISOString(),
      data.priority || 0
    ]);
    
    if (data.scheduledFor <= new Date()) {
      await this.checkPendingNotifications();
    }
  }

  async cancelSessionNotifications(sessionId: string): Promise<void> {
    await this.db.executeQuery(
      'DELETE FROM notification_queue WHERE session_id = ? AND delivered_at IS NULL',
      [sessionId]
    );
  }

  async getNotificationHistory(sessionId?: string, limit: number = 50): Promise<any[]> {
    let query = `
      SELECT * FROM notification_queue
      WHERE delivered_at IS NOT NULL
    `;
    
    const params: any[] = [];
    
    if (sessionId) {
      query += ' AND session_id = ?';
      params.push(sessionId);
    }
    
    query += ' ORDER BY delivered_at DESC LIMIT ?';
    params.push(limit);
    
    const result = await this.db.executeQuery(query, params);
    return result.rows.raw();
  }

  async showImmediateAlert(title: string, message: string, actions?: any[]): Promise<void> {
    const defaultActions = actions || [
      { text: 'OK', style: 'default' }
    ];
    
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        defaultActions.map(action => ({
          ...action,
          onPress: () => {
            if (action.onPress) action.onPress();
            resolve();
          }
        })),
        { cancelable: false }
      );
    });
  }

  async confirmAction(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Confirm',
            style: 'destructive',
            onPress: () => resolve(true)
          }
        ],
        { cancelable: false }
      );
    });
  }

  shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}