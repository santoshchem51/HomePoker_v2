import { AppState, AppStateStatus } from 'react-native';
import { DatabaseService } from '../infrastructure/DatabaseService';
import { ServiceError, ErrorCode } from '../../types/errors';

export class SessionCleanupService {
  private static instance: SessionCleanupService | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: any = null;
  private readonly CLEANUP_HOURS = 10;
  private readonly WARNING_HOURS = 9;
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
  private isRunning = false;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  static getInstance(): SessionCleanupService {
    if (!SessionCleanupService.instance) {
      SessionCleanupService.instance = new SessionCleanupService();
    }
    return SessionCleanupService.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadPendingTasks();
      this.startCleanupScheduler();
      this.setupAppStateListener();
    } catch (error) {
      throw new ServiceError(
        ErrorCode.CLEANUP_INIT_FAILED,
        'Failed to initialize cleanup service',
        error as Record<string, any>
      );
    }
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      this.checkPendingCleanups();
    }
  }

  private startCleanupScheduler(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.checkPendingCleanups();
    }, this.CHECK_INTERVAL_MS);

    this.checkPendingCleanups();
  }

  private async loadPendingTasks(): Promise<void> {
    const query = `
      SELECT * FROM scheduled_tasks 
      WHERE status = 'pending' 
      AND task_type = 'cleanup_check'
      ORDER BY scheduled_for ASC
    `;
    
    await this.db.executeQuery(query);
  }

  async checkPendingCleanups(): Promise<void> {
    if (this.isRunning) {
      console.debug('Cleanup check already running, skipping');
      return;
    }
    
    this.isRunning = true;
    try {
      const now = new Date();
      
      const sessionsQuery = `
        SELECT s.*, 
               CASE WHEN se.id IS NOT NULL THEN 1 ELSE 0 END as has_export
        FROM sessions s
        LEFT JOIN session_exports se ON s.id = se.session_id
        WHERE s.status = 'completed' 
        AND s.cleanup_at IS NOT NULL
        AND s.cleanup_at <= ?
      `;
      
      const sessionResult = await this.db.executeQuery(sessionsQuery, [now.toISOString()]);
      const sessions = sessionResult.rows.raw();
      
      for (const session of sessions) {
        await this.cleanupSession(session.id);
      }
      
      await this.checkWarnings(now);
      
    } catch (error) {
      console.error('Cleanup check failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async checkWarnings(now: Date): Promise<void> {
    const warningTime = new Date(now.getTime() + (this.CLEANUP_HOURS - this.WARNING_HOURS) * 60 * 60 * 1000);
    
    const warningQuery = `
      SELECT s.* 
      FROM sessions s
      LEFT JOIN session_exports se ON s.id = se.session_id
      WHERE s.status = 'completed'
      AND s.cleanup_at IS NOT NULL
      AND s.cleanup_at <= ?
      AND s.cleanup_at > ?
      AND s.warning_sent = 0
      AND se.id IS NULL
    `;
    
    const warningResult = await this.db.executeQuery(
      warningQuery,
      [warningTime.toISOString(), now.toISOString()]
    );
    const sessionsNeedingWarning = warningResult.rows.raw();
    
    for (const session of sessionsNeedingWarning) {
      await this.scheduleWarningNotification(session);
    }
  }

  private async scheduleWarningNotification(session: any): Promise<void> {
    const NotificationService = require('../infrastructure/NotificationService').NotificationService;
    const notificationService = NotificationService.getInstance();
    
    const hoursRemaining = Math.ceil(
      (new Date(session.cleanup_at).getTime() - Date.now()) / (60 * 60 * 1000)
    );
    
    await notificationService.scheduleNotification({
      sessionId: session.id,
      type: 'cleanup_warning',
      title: 'Session Data Expiring Soon',
      message: `Session "${session.name}" will be deleted in ${hoursRemaining} hour(s). Export now to keep your data.`,
      scheduledFor: new Date(),
      priority: 1
    });
    
    await this.db.executeQuery(
      'UPDATE sessions SET warning_sent = 1 WHERE id = ?',
      [session.id]
    );
  }

  async cleanupSession(sessionId: string): Promise<void> {
    await this.db.executeTransaction(async () => {
      await this.createCleanupAuditLog(sessionId);
      
      await this.db.executeQuery(
        'DELETE FROM transactions WHERE session_id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM players WHERE session_id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM session_exports WHERE session_id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM scheduled_tasks WHERE session_id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM notification_queue WHERE session_id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM sessions WHERE id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery('VACUUM');
    });
  }

  private async createCleanupAuditLog(sessionId: string): Promise<void> {
    const auditQuery = `
      INSERT INTO scheduled_tasks (
        id, task_type, session_id, scheduled_for, 
        executed_at, status
      ) VALUES (?, 'cleanup_check', ?, ?, ?, 'completed')
    `;
    
    const taskId = `cleanup_${sessionId}_${Date.now()}`;
    await this.db.executeQuery(auditQuery, [
      taskId,
      sessionId,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
  }

  async scheduleSessionCleanup(sessionId: string, completedAt: Date): Promise<void> {
    const cleanupTime = new Date(completedAt.getTime() + this.CLEANUP_HOURS * 60 * 60 * 1000);
    
    await this.db.executeQuery(
      'UPDATE sessions SET cleanup_at = ? WHERE id = ?',
      [cleanupTime.toISOString(), sessionId]
    );
    
    const taskId = `task_${sessionId}_${Date.now()}`;
    const insertTaskQuery = `
      INSERT INTO scheduled_tasks (
        id, task_type, session_id, scheduled_for, status
      ) VALUES (?, 'cleanup_check', ?, ?, 'pending')
    `;
    
    await this.db.executeQuery(insertTaskQuery, [
      taskId,
      sessionId,
      cleanupTime.toISOString()
    ]);
  }

  async cancelSessionCleanup(sessionId: string): Promise<void> {
    await this.db.executeTransaction(async () => {
      await this.db.executeQuery(
        'UPDATE sessions SET cleanup_at = NULL, warning_sent = 0 WHERE id = ?',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM scheduled_tasks WHERE session_id = ? AND status = "pending"',
        [sessionId]
      );
      
      await this.db.executeQuery(
        'DELETE FROM notification_queue WHERE session_id = ? AND delivered_at IS NULL',
        [sessionId]
      );
    });
  }

  async deleteSessionManually(sessionId: string): Promise<void> {
    const sessionResult = await this.db.executeQuery(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );
    
    if (!sessionResult || sessionResult.rows.length === 0) {
      throw new ServiceError(
        ErrorCode.SESSION_NOT_FOUND,
        'Session not found for deletion'
      );
    }
    
    await this.cleanupSession(sessionId);
  }

  async getSessionsScheduledForCleanup(): Promise<any[]> {
    const query = `
      SELECT s.*, 
             CASE WHEN se.id IS NOT NULL THEN 1 ELSE 0 END as has_export
      FROM sessions s
      LEFT JOIN session_exports se ON s.id = se.session_id
      WHERE s.status = 'completed' 
      AND s.cleanup_at IS NOT NULL
      ORDER BY s.cleanup_at ASC
    `;
    
    const result = await this.db.executeQuery(query);
    return result.rows.raw();
  }

  async getCleanupHistory(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT * FROM scheduled_tasks
      WHERE task_type = 'cleanup_check'
      AND status = 'completed'
      ORDER BY executed_at DESC
      LIMIT ?
    `;
    
    const result = await this.db.executeQuery(query, [limit]);
    return result.rows.raw();
  }

  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.isRunning = false;
  }
}