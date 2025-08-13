# Monitoring and Observability

Define monitoring strategy for PokePot's React Native mobile application with embedded services:

## Monitoring Stack

- **Frontend Monitoring:** React Native Performance Monitor + Flipper (development) + React Native built-in metrics
- **Backend Monitoring:** Custom service performance tracking + SQLite query monitoring + JavaScript error tracking
- **Error Tracking:** Local error logging with optional crash reporting (disabled for MVP privacy)
- **Performance Monitoring:** Custom performance metrics collection + database operation timing + settlement calculation monitoring

## Key Metrics

**Frontend Metrics:**
- App startup time (target: < 3 seconds)
- Screen transition time (target: < 500ms)
- Memory usage during active sessions (target: < 150MB)
- Voice command recognition accuracy (target: > 90%)
- Voice command processing time (target: < 500ms)
- Frame rate during animations (target: 60fps)

**Backend Metrics:**
- Query execution time (target: 95% < 100ms)
- Settlement calculation time (target: < 2 seconds for 8 players)
- Service method success rate
- Error rate by service type
- Data validation failure rate

## Performance Monitoring Implementation

```typescript
export class PerformanceMonitor {
  // Settlement calculation monitoring (critical for NFR2)
  async measureSettlementCalculation<T>(
    sessionId: string,
    playerCount: number,
    transactionCount: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      // Critical: Must complete within 2 seconds (NFR2)
      if (duration > 2000) {
        console.error(`Settlement calculation exceeded 2-second limit: ${duration}ms`);
        this.recordCriticalPerformanceFailure('settlement_timeout', {
          duration,
          playerCount,
          transactionCount
        });
      }

      return result;
    } catch (error) {
      this.recordCriticalPerformanceFailure('settlement_error', {
        error: error.message,
        playerCount,
        transactionCount
      });

      throw error;
    }
  }
}
```
