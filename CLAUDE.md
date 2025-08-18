# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokePot is a React Native poker session management app that tracks buy-ins, cash-outs, and settlements with voice commands and WhatsApp sharing. Built with TypeScript, Zustand state management, and SQLite database with WAL mode.

## Essential Development Commands

### Basic Development
- `npm start` - Start Metro bundler (required for development)
- `npm run android` - Run on Android (requires Android SDK and emulator/device)
- `npm run ios` - Run on iOS (requires Xcode and simulator/device)
- `npm run typecheck` - Run TypeScript type checking (critical for development)
- `npm run lint` - Run ESLint code analysis
- `npm run dev-check` - Run full development validation (typecheck + lint + tests)

### Testing Strategy
The project uses a sophisticated testing architecture with optimized configurations:

- `npm test` or `npm run test` - Full Jest test suite
- `npm run test:core` - Core functionality tests (UndoManager, TransactionService, App) - **use during active development**
- `npm run test:fast` - Performance-optimized full suite with 75% CPU utilization - **use for regression testing**
- `npm run test:stores` - Zustand store tests using native patterns (no React hooks dependency)
- `npm run test:services` - Service-specific targeted tests
- `npm run test:integration` - Cross-service integration tests
- `npm run test:ci` - CI/CD test configuration with coverage
- `npm run test:sequential` - Run tests sequentially to avoid conflicts

**Testing Best Practice**: Use `npm run test:core` during development for fast feedback, then `npm run test:fast` before commits.

### Build Commands
- `npm run build:android:debug` - Build Android debug APK (requires JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64)
- `npm run build:android` - Build Android release APK
- `npm run build:android:bundle` - Build Android AAB for Play Store
- `npm run build:ios` - Build iOS archive for App Store
- `npm run clean:android` - Clean Android build artifacts
- `npm run clean:ios` - Clean iOS build artifacts

### Utility Commands
- `npm run metro:reset` - Kill Metro port and start with cache reset
- `npm run reset-cache` - Reset Metro bundler cache

### Required Environment
- **Node.js**: 18+ (specified in package.json engines)
- **Java**: OpenJDK 17 for Android builds (JAVA_HOME must be set on Windows)
- **Android SDK**: Level 31+ (compileSdkVersion 35, targetSdkVersion 35)
- **React Native**: 0.80.2 with React 19.1.0
- **Platform Support**: Android 7.0+ (API 24), iOS 13.0+

## Architecture Overview

### Core Service Architecture
The app follows a service-oriented architecture with clear separation of concerns:

**Infrastructure Layer**:
- `DatabaseService` - SQLite database with WAL mode, migrations, and health monitoring
- `ExportService` - PDF/CSV/JSON export functionality
- `NotificationService` - System notifications and alerts

**Core Business Logic**:
- `SessionService` - Session creation, player management, status transitions
- `TransactionService` - Buy-in/cash-out recording with undo functionality (30-second window)
- `ProfileService` - Player profile management
- `SessionCleanupService` - Automatic cleanup of completed sessions

**Integration Services**:
- `VoiceService` - Voice command processing and recognition
- `WhatsAppService` - WhatsApp sharing integration
- `MessageQueue` - Async operation management

### State Management (Zustand)
- `sessionStore.ts` - Session and player state with optimistic updates
- `settlementStore.ts` - Settlement calculations and validation
- `voiceStore.ts` - Voice command state and processing

All stores use Zustand with devtools middleware and include selectors for performance optimization.

### Database Schema
SQLite database with:
- **sessions** - Session metadata and status tracking
- **players** - Player information and balance tracking  
- **transactions** - Buy-in/cash-out records with void capability
- **player_profiles** - Saved player profiles for quick access

Uses WAL mode for performance, foreign key constraints, and proper indexing.

### Key Business Rules
- **Sessions**: 4-8 players, created → active → completed status flow
- **Transactions**: 30-second undo window, optimistic UI updates
- **Settlement**: Mathematical proof generation and validation
- **Voice Commands**: Fallback to manual input when voice unavailable

## Testing Architecture

The project implements a modern React 19-compatible testing strategy:

### Test Configuration Files
- `jest.config.js` - Main configuration with path aliases and 30s timeout
- `jest.performance.config.js` - Optimized for speed (75% CPU, 15s timeout)
- `tests/setup.js` - Comprehensive mocking and test utilities

### Mock Architecture
Uses centralized mock factories in `tests/mock-factories.js`:
- **ServiceMocks** - Database, voice, and external service mocks
- **DataFactories** - Consistent test data generation  
- **ScenarioFactories** - Complex test scenarios

### Store Testing Patterns
Uses native Zustand testing without React hooks dependency:
- `tests/zustand-testing.js` - Store testing utilities
- `createTestStore()` - Clean store instances for testing
- `testStoreAction()` - Action testing helper

### Path Aliases (TypeScript & Jest)
```
@/* → src/*
@components/* → src/components/*
@services/* → src/services/*  
@stores/* → src/stores/*
@hooks/* → src/hooks/*
@utils/* → src/utils/*
@types/* → src/types/*
@styles/* → src/styles/*
```

## Development Workflow

### Code Quality Requirements
1. **TypeScript**: Strict mode enabled with comprehensive type checking
2. **Linting**: ESLint with React Native configuration
3. **Testing**: All new features require tests, existing tests must pass
4. **Architecture**: Follow established service patterns and error handling

### Error Handling Patterns
- Use `ServiceError` class for business logic errors
- Implement proper error boundaries in React components
- Database operations use transactions for consistency
- All async operations include proper error handling

### Voice Integration
- Voice commands supported but never required
- Graceful fallback to manual input
- Error recovery for voice recognition failures
- Comprehensive mock for voice service in tests

### Database Development
- All schema changes via migrations in `DatabaseService`
- Use transactions for multi-step operations
- Health check endpoint available for monitoring
- Automatic cleanup of old sessions (10 hours after completion)

## BMad Development Method Integration

This project uses the BMad Development Method with:
- **Epic-driven development** with story-based task breakdown
- **Automated development lifecycle** via BMad orchestrator agent
- **Test-first approach** with architectural compliance validation
- **Safety mechanisms** for development automation

### Key BMad Files
- `.bmad-core/agents/bmad-dev-orchestrator.md` - Main development orchestrator
- Epic and story files in `docs/` directory structure
- Automated workflow with SM → Dev → QA → Commit cycles

When working on stories, follow the established task breakdown patterns and ensure all regression tests pass before commits.

## Troubleshooting

### ⚠️ CRITICAL: React Native Deployment Issues
**See [docs/DEPLOYMENT-GUIDE.md](docs/DEPLOYMENT-GUIDE.md) for comprehensive deployment troubleshooting.**

**Most Common Issue**: Code changes not appearing in app
- **Root Cause**: Metro bundler cache serving stale JavaScript
- **Quick Fix**: `npm start -- --reset-cache`
- **Verification**: Add deployment markers and check logs

### Common Issues
1. **Code changes not appearing**: Metro cache issue - always use `npm start -- --reset-cache`
2. **Database initialization timeout**: Check app logs, may need device restart
3. **Test timeouts**: Use `npm run test:core` for faster feedback during development
4. **Android build failures**: Ensure JAVA_HOME is set to OpenJDK 17
5. **Voice service errors**: Voice is optional, app should work without it
6. **"Session Error" instead of validation messages**: Check ValidationResult implementation

### Quick Deployment Commands
```bash
# Reset Metro and reload (fixes 90% of issues)
npx kill-port 8082 && npm start -- --reset-cache

# Verify deployment
adb logcat -s ReactNativeJS | grep "DEPLOYMENT"

# Force reload on device
adb shell input keyevent KEYCODE_R KEYCODE_R
```

### WSL Environment Limitations

**KNOWN ISSUE**: Jest tests and some build processes experience significant performance degradation in WSL (Windows Subsystem for Linux) due to subprocess spawning overhead.

**Symptoms:**
- Jest test suite hangs after 2+ minutes
- ESLint may timeout with ETIMEDOUT errors
- Android builds are significantly slower
- Full `npm run dev-check` command times out

**Validated Workarounds:**
- Use `node validation-script.js` for immediate development feedback
- TypeScript (`npm run typecheck`) works reliably and catches most issues
- Individual lint files work better than full project linting
- Core tests (`npm run test:core`) may work with `--forceExit --maxWorkers=1`

**Recommended Solutions:**
- Run full test suite in native Linux environment or Docker
- Use VS Code dev containers for consistent testing environment
- Focus on TypeScript validation for immediate feedback during development
- CI/CD pipeline should run in Linux environment for reliable testing

### Test Debugging
- Tests use comprehensive mocking to avoid external dependencies  
- Database tests use isolated instances to prevent conflicts
- Voice and external service mocks prevent network-related test failures
- Use `npm run test:services` for targeted service testing
- **WSL users**: Use `validation-script.js` for alternative validation

### Performance Optimization
- Use `npm run test:fast` for optimized test execution (may still timeout in WSL)
- Database uses WAL mode and proper indexing
- Zustand stores optimized with selectors
- React Native performance follows best practices
- **WSL optimization**: Jest config uses `maxWorkers: 1`, `cache: false`, `forceExit: true`

### Windows-Specific Development
**Important for Windows users**: This project includes Windows-specific build scripts and environment setup:
- Use `.bat` scripts for Windows commands (e.g., `build-android.bat`, `run-android.bat`)
- JAVA_HOME environment variable must be set (typically `"C:\Users\{username}\AppData\Local\Programs\Eclipse Adoptium\jdk-17.0.16.8-hotspot"`)
- ADB path should be added to system PATH or use full paths in commands
- PowerShell scripts available for advanced build automation