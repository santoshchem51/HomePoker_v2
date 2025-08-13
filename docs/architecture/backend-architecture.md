# Backend Architecture

Define backend-specific architecture details for the service layer within the React Native application:

## Service Architecture

Since PokePot uses a monolithic mobile architecture, the "backend" consists of TypeScript services running within the React Native application.

### Service Organization
```
src/services/
├── core/                    # Core business logic services
│   ├── SessionService.ts    # Session lifecycle management
│   ├── TransactionService.ts # Buy-in/cash-out processing
│   ├── SettlementService.ts  # Settlement calculations
│   └── ValidationService.ts  # Business rule validation
├── infrastructure/          # Infrastructure services
│   ├── DatabaseService.ts   # SQLite operations
│   ├── StorageService.ts    # Local file operations
│   └── DeviceService.ts     # Device API integrations
├── integration/            # External integration services
│   ├── VoiceService.ts     # Speech recognition
│   ├── WhatsAppService.ts  # Social sharing
│   └── QRService.ts        # QR code generation/scanning
└── utils/                  # Service utilities
    ├── CalculationUtils.ts # Financial calculations
    ├── ValidationUtils.ts  # Input validation
    └── ErrorUtils.ts       # Error handling
```

## Authentication and Authorization

Since this is a device-based application, authentication uses local device storage with session organizer privileges tied to device ID.

```typescript
// Authorization service for device-based session management
export class AuthorizationService {
  private deviceId: string;
  
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  async checkSessionAccess(
    sessionId: string, 
    operation: 'read' | 'write' | 'organize'
  ): Promise<AuthorizationResult> {
    const session = await DatabaseService.getSession(sessionId);
    
    if (!session) {
      return { authorized: false, reason: 'Session not found' };
    }
    
    switch (operation) {
      case 'read':
        // Anyone can read session data via QR code
        return { authorized: true };
        
      case 'write':
        // Only organizer can modify session
        if (session.organizerId === this.deviceId) {
          return { authorized: true };
        }
        return { authorized: false, reason: 'Only organizer can modify session' };
        
      case 'organize':
        // Only organizer can manage session lifecycle
        if (session.organizerId === this.deviceId) {
          return { authorized: true };
        }
        return { authorized: false, reason: 'Organizer access required' };
        
      default:
        return { authorized: false, reason: 'Invalid operation' };
    }
  }
}
```

## Background Task and Scheduling Patterns

Since PokePot is a mobile application without a traditional backend server, background tasks and scheduling must be handled within the React Native application lifecycle.

### Approved Background Processing Approach

```typescript
// Pattern: Timer-based background processing
export class ScheduledTaskService {
  private taskInterval: NodeJS.Timeout | null = null;
  private readonly TASK_INTERVAL_MS = 3600000; // 1 hour
  
  constructor() {
    this.initializeScheduler();
    this.handleAppStateChanges();
  }
  
  private initializeScheduler(): void {
    // Start periodic task execution
    this.taskInterval = setInterval(async () => {
      await this.executePendingTasks();
    }, this.TASK_INTERVAL_MS);
  }
  
  private handleAppStateChanges(): void {
    // Resume tasks when app becomes active
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Check for overdue tasks when app resumes
        this.executePendingTasks();
      }
    });
  }
  
  private async executePendingTasks(): Promise<void> {
    // Query database for tasks that need execution
    const pendingTasks = await DatabaseService.executeQuery(
      'SELECT * FROM scheduled_tasks WHERE execute_at <= datetime("now")'
    );
    
    for (const task of pendingTasks) {
      await this.executeTask(task);
    }
  }
}
```

### Task Persistence Pattern

All scheduled tasks should be persisted in SQLite to survive app restarts:

```sql
CREATE TABLE scheduled_tasks (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  payload TEXT, -- JSON serialized data
  execute_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_at DATETIME,
  status TEXT CHECK(status IN ('pending', 'executed', 'failed'))
);

CREATE INDEX idx_scheduled_tasks_execute ON scheduled_tasks(execute_at, status);
```

### Notification System Architecture

For user notifications, use React Native's built-in Alert system combined with persistent notification queue:

```typescript
export class NotificationService {
  private notificationQueue: Notification[] = [];
  
  async showNotification(
    title: string, 
    message: string, 
    actions?: NotificationAction[]
  ): Promise<void> {
    const isAppActive = AppState.currentState === 'active';
    
    if (isAppActive) {
      // Show immediate alert if app is active
      Alert.alert(
        title,
        message,
        actions?.map(action => ({
          text: action.label,
          onPress: action.handler,
          style: action.style
        }))
      );
    } else {
      // Queue notification for next app launch
      await this.queueNotification({
        id: generateId(),
        title,
        message,
        actions,
        created_at: new Date()
      });
    }
  }
  
  private async queueNotification(notification: Notification): Promise<void> {
    // Store in SQLite for persistence
    await DatabaseService.executeQuery(
      `INSERT INTO notification_queue (id, title, message, actions, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [notification.id, notification.title, notification.message, 
       JSON.stringify(notification.actions), notification.created_at]
    );
  }
  
  async checkPendingNotifications(): Promise<void> {
    // Called on app launch to show queued notifications
    const pending = await DatabaseService.executeQuery(
      'SELECT * FROM notification_queue WHERE shown_at IS NULL ORDER BY created_at'
    );
    
    for (const notification of pending) {
      await this.showNotification(
        notification.title,
        notification.message,
        JSON.parse(notification.actions)
      );
      
      // Mark as shown
      await DatabaseService.executeQuery(
        'UPDATE notification_queue SET shown_at = datetime("now") WHERE id = ?',
        [notification.id]
      );
    }
  }
}
```

### Cleanup Service Pattern

For session cleanup specifically:

```typescript
export class SessionCleanupService {
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_CHECK_INTERVAL = 3600000; // 1 hour
  private readonly SESSION_RETENTION_HOURS = 10;
  private readonly WARNING_THRESHOLD_HOURS = 9;
  
  constructor() {
    this.startCleanupScheduler();
    this.checkPendingCleanups(); // Check on service initialization
  }
  
  private startCleanupScheduler(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.processCleanups();
    }, this.CLEANUP_CHECK_INTERVAL);
  }
  
  private async processCleanups(): Promise<void> {
    await DatabaseService.executeTransaction(async (tx) => {
      // Find sessions ready for cleanup
      const expiredSessions = await tx.executeQuery(
        `SELECT * FROM sessions 
         WHERE status = 'completed' 
         AND cleanup_at <= datetime("now")
         AND exported_at IS NULL`
      );
      
      // Find sessions needing warning
      const warningSessions = await tx.executeQuery(
        `SELECT * FROM sessions 
         WHERE status = 'completed'
         AND datetime(cleanup_at, '-1 hour') <= datetime("now")
         AND datetime(cleanup_at) > datetime("now")
         AND exported_at IS NULL
         AND warning_sent = 0`
      );
      
      // Process cleanups and warnings
      for (const session of expiredSessions) {
        await this.cleanupSession(tx, session.id);
      }
      
      for (const session of warningSessions) {
        await this.sendCleanupWarning(session);
      }
    });
  }
}
```

### Key Architecture Decisions

1. **No External Background Task Libraries**: Use native JavaScript timers (`setInterval`) combined with AppState monitoring
2. **Persistence First**: All scheduled tasks stored in SQLite to survive app restarts
3. **React Native Alerts for Notifications**: Use built-in Alert.alert() instead of push notification libraries
4. **Transaction Safety**: All cleanup operations wrapped in database transactions
5. **Graceful Degradation**: Tasks resume when app becomes active if missed during suspension
