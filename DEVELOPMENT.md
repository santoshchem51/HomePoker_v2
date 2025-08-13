# Development Guide - PokePot

## 🏗 Project Structure

```
src/
├── components/     # Reusable UI components (HealthStatus, etc.)
├── screens/       # Screen components (SessionScreen, etc.)
├── services/      # Business logic (DatabaseService, HealthCheckService)
├── stores/        # Zustand state management stores
├── navigation/    # React Navigation configuration
├── hooks/         # Custom React hooks
├── utils/         # Utility functions (CalculationUtils for financial precision)
├── types/         # Shared TypeScript type definitions
└── styles/        # Shared styling and theme

database/          # Database schema (schema.sql) and migrations
tests/            # Test files and test fixtures
scripts/          # Build and deployment scripts
docs/             # Project documentation
android/          # Android native code and configuration
ios/              # iOS native code and configuration
```

## 🔧 Development Workflow

### Prerequisites
- Node.js 18+ (see `engines` in package.json)
- React Native development environment set up
- Android Studio or Xcode for native builds

### Daily Development Commands

```bash
# Start development
npm start                    # Start Metro bundler
npm run android             # Run on Android
npm run ios                 # Run on iOS

# Code quality checks
npm run typecheck           # TypeScript validation
npm run lint               # ESLint analysis
npm test                   # Run Jest tests

# Build commands
npm run build:android       # Android release build
npm run build:ios          # iOS release build
npm run clean              # Clean all caches
```

### Development Standards

**Critical Rules** (from `docs/architecture/coding-standards.md`):
- **Type Sharing**: Define types in `src/types/` and import consistently
- **Service Layer**: All database operations through `DatabaseService`
- **Financial Precision**: Use `CalculationUtils` for currency math
- **Transaction Atomicity**: Multi-step operations use `executeTransaction()`
- **Input Validation**: All inputs through `ValidationService`
- **Error Handling**: Consistent `ServiceError` class usage

### Code Quality Gates

**TypeScript**: Strict mode enabled
- No implicit any
- Path mapping for clean imports
- Interface definitions required

**Testing Requirements**:
- Critical financial paths: ≥90% coverage
- Service layer: ≥95% coverage  
- UI components: ≥85% coverage

## 🧪 Testing Strategy

### Test Types

**Unit Tests**: Service and utility testing
```bash
npm test -- src/services/DatabaseService.test.ts
npm test -- src/utils/CalculationUtils.test.ts
```

**Component Tests**: React Native Testing Library
```bash
npm test -- src/components/HealthStatus.test.tsx
```

**Integration Tests**: Database and service interactions
```bash
npm test -- src/services/__integration__/
```

### Test Configuration

Located in `jest.config.js`:
- React Native preset
- Coverage reporting with lcov
- SQLite mocking for CI/CD
- Test timeout: 30s for database operations

### Running Tests

```bash
# All tests with coverage
npm test -- --coverage

# Watch mode during development  
npm test -- --watch

# Specific test pattern
npm test -- --testNamePattern="health check"

# Update snapshots
npm test -- --updateSnapshot
```

## 🐛 Debugging & Troubleshooting

### Common Development Issues

**Metro Bundler Issues**:
```bash
# Clear Metro cache
npm start -- --reset-cache

# Full project clean
npm run clean

# Clean and rebuild
rm -rf node_modules && npm install
```

**Android Issues**:
```bash
# Clean Android build
npm run clean:android

# Gradle issues
cd android && ./gradlew clean && cd ..

# Emulator not found
# Ensure Android emulator is running via Android Studio
```

**iOS Issues**:
```bash
# Clean iOS build  
npm run clean:ios

# CocoaPods issues
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

# Simulator issues
# Reset iOS Simulator via Device > Erase All Content and Settings
```

**Database Issues**:
- Use health check screen to verify connectivity
- Check SQLite permissions in device settings
- Verify schema with `database/schema.sql`

### Performance Monitoring

**Targets** (from story requirements):
- App startup time: <3 seconds
- Database initialization: <100ms
- Memory footprint: <150MB during active use  
- Bundle size: <50MB for app store

**Monitoring Tools**:
- Health check screen shows real-time status
- Flipper for React Native debugging
- Bundle analyzer for size optimization

### Development Tips

1. **Fast Refresh**: Preserves component state during development
2. **Full Reload**: Shake device or press `R` twice
3. **Dev Menu**: `Cmd+D` (iOS) / `Ctrl+M` (Android)
4. **Debugging**: Use Flipper or Chrome DevTools
5. **Hot Reload**: Enabled by default for rapid iteration

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

**Triggered on**: Push to main/develop, Pull Requests

**Pipeline Steps**:
1. **Test & Lint**: TypeScript, ESLint, Jest tests
2. **Build Android**: Debug APK generation
3. **Build iOS**: Archive for App Store
4. **Security**: npm audit, Snyk scanning
5. **Performance**: Bundle size validation
6. **Release**: Automated releases on main branch

### Local CI/CD Testing

```bash
# Simulate CI/CD pipeline locally
npm ci                      # Clean install
npm run typecheck          # Type checking
npm run lint              # Code analysis  
npm test -- --coverage   # Tests with coverage
```

### Deployment Checklist

Before deploying:
- [ ] All tests passing locally
- [ ] TypeScript compilation clean
- [ ] ESLint warnings resolved
- [ ] Test coverage meets targets
- [ ] Bundle size under 50MB limit
- [ ] Health check functional
- [ ] Database migrations tested

## 🤝 Contributing Guidelines

### Code Standards
1. Follow `docs/architecture/coding-standards.md`
2. Use TypeScript strict mode
3. Implement proper error handling
4. Add comprehensive tests
5. Document complex business logic

### Commit Guidelines
```bash
# Good commit messages
feat: Add settlement calculation service
fix: Resolve SQLite connection timeout
docs: Update development setup guide
test: Add health check service tests
```

### Pull Request Process
1. Create feature branch from `develop`
2. Implement changes with tests
3. Run full test suite locally
4. Update documentation if needed
5. Submit PR with clear description
6. Address review feedback

### Development Environment Setup

**Essential Tools**:
- VS Code with React Native extensions
- Android Studio or Xcode
- Git with proper configuration
- Node.js 18+ with npm

**Recommended Extensions**:
- React Native Tools
- TypeScript and JavaScript Language Features
- ESLint
- Jest Runner
- SQLite Viewer

## 📚 Architecture References

- **Tech Stack**: `docs/architecture/tech-stack.md`
- **Database Schema**: `docs/architecture/database-schema.md`
- **Component Architecture**: `docs/architecture/components.md`
- **Security Guidelines**: `docs/architecture/security-and-performance.md`

For detailed architectural decisions and patterns, refer to the complete documentation in the `docs/architecture/` directory.