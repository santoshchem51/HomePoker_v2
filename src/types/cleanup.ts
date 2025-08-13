export interface CleanupSchedule {
  sessionId: string;
  scheduledFor: Date;
  warningShown: boolean;
  exported: boolean;
}

export interface NotificationData {
  id: string;
  sessionId?: string;
  type: 'cleanup_warning' | 'export_reminder' | 'session_complete';
  title: string;
  message: string;
  scheduledFor: Date;
  deliveredAt?: Date;
  dismissedAt?: Date;
  priority: number;
}

export interface ScheduledTask {
  id: string;
  taskType: 'cleanup_check' | 'notification_check' | 'export_reminder';
  sessionId?: string;
  scheduledFor: Date;
  executedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  retryCount: number;
}

export interface ExportRecord {
  id: string;
  sessionId: string;
  exportFormat: 'json' | 'csv' | 'whatsapp';
  filePath?: string;
  exportedAt: Date;
  fileSize?: number;
  checksum?: string;
}

export interface CleanupSettings {
  cleanupHours: number;
  warningHours: number;
  checkIntervalMs: number;
  maxRetries: number;
}

export const DEFAULT_CLEANUP_SETTINGS: CleanupSettings = {
  cleanupHours: 10,
  warningHours: 9,
  checkIntervalMs: 60 * 60 * 1000, // 1 hour
  maxRetries: 3
};