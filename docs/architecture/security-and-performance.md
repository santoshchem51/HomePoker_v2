# Security and Performance

Define security and performance considerations for PokePot's mobile-first financial tracking application:

## Security Requirements

**Frontend Security:**
- **CSP Headers:** Not applicable (mobile app, not web) - Native app security model used
- **XSS Prevention:** React Native's built-in sanitization + TypeScript type safety for all user inputs
- **Secure Storage:** iOS Keychain and Android Keystore for sensitive data, encrypted SQLite database with AES-256

**Backend Security:**
- **Input Validation:** Comprehensive validation at service layer for all financial inputs (amounts, player names, session data)
- **Rate Limiting:** Voice command throttling (max 1 command per 2 seconds) + transaction rate limiting (max 10 per minute per session)
- **CORS Policy:** Not applicable (no web API endpoints) - Mobile app uses direct service calls

**Authentication Security:**
- **Token Storage:** Device-based authentication using secure local storage (iOS Keychain/Android Keystore)
- **Session Management:** Session organizer privileges tied to device ID with automatic expiration
- **Password Policy:** No user passwords - device-based authorization only

## Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** Under 50MB total app size for both iOS and Android
- **Loading Strategy:** Lazy loading for settlement calculations, instant loading for core transaction recording
- **Caching Strategy:** React Query for in-memory caching, SQLite for persistent data with WAL mode

**Backend Performance:**
- **Response Time Target:** 95% of database operations complete within 100ms, settlement calculations within 2 seconds
- **Database Optimization:** Indexed queries, connection pooling, WAL journaling mode, query optimization
- **Caching Strategy:** Calculated balances cached in memory with SQLite triggers for updates
