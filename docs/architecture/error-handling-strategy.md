# Error Handling Strategy

Define unified error handling across PokePot's React Native frontend and embedded service layer:

## Error Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Service as Service Layer
    participant DB as Database
    participant User as User
    
    UI->>Service: Call business operation
    Service->>DB: Execute database operation
    DB-->>Service: Database error
    Service->>Service: Wrap in ServiceError
    Service-->>UI: ServiceError with context
    UI->>UI: Map to user message
    UI-->>User: Display appropriate error
    
    alt Critical Financial Error
        UI->>UI: Log error details
        UI->>UI: Disable financial operations
        UI-->>User: Show recovery options
    else Recoverable Error
        UI->>UI: Show retry option
        UI-->>User: Allow user to retry
    end
```

## Error Response Format

```typescript
interface ServiceError extends Error {
  code: 'VALIDATION_ERROR' | 'CALCULATION_ERROR' | 'DATABASE_ERROR' | 'VOICE_ERROR' | 'SETTLEMENT_ERROR' | 'AUTHORIZATION_ERROR';
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  playerId?: string;
  recoverable: boolean;
  retryable: boolean;
}
```

## Frontend Error Handling

Critical financial operations use error boundaries to prevent app crashes:

```typescript
export class FinancialErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: ServiceError }
> {
  static getDerivedStateFromError(error: Error): { hasError: boolean; error: ServiceError } {
    const serviceError = error instanceof ServiceError 
      ? error 
      : new ServiceError('CALCULATION_ERROR', error.message);
      
    return { hasError: true, error: serviceError };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <FinancialErrorFallback 
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }

    return this.props.children;
  }
}
```
