# Comprehensive Testing Guide
**Story 5.3: Comprehensive Testing Suite - Documentation**

This guide provides comprehensive documentation for the PokePot testing infrastructure, standards, and best practices established in Story 5.3.

## Overview

The PokePot application implements a comprehensive testing strategy with 90%+ coverage for critical paths, especially financial calculations and database operations. Our testing approach prioritizes reliability, performance, and maintainability.

### Testing Philosophy

- **Financial Accuracy**: 95% test coverage for all monetary calculations and settlement algorithms
- **Performance Reliability**: Database operations must complete under 100ms with comprehensive performance regression testing
- **Memory Safety**: Automated memory leak detection throughout the application lifecycle
- **Integration Completeness**: Full user flow testing from session creation to settlement
- **CI/CD Integration**: Automated testing pipeline with deployment blocking on failures

## Testing Architecture

### Test Infrastructure
```
tests/
├── __tests__/
│   ├── components/           # UI component tests (75% coverage target)
│   ├── services/            # Business logic tests (85% coverage target)
│   │   ├── core/           # Core services (SessionService, TransactionService)
│   │   ├── infrastructure/ # Database, storage, device services
│   │   └── monitoring/     # Performance, error logging services
│   ├── utils/              # Utility function tests (90% coverage target)
│   ├── integration/        # Cross-service integration tests
│   └── performance/        # Performance and memory leak tests
├── mock-factories.js       # Centralized mock creation
├── setup.js               # Test environment configuration
└── zustand-testing.js     # Store testing utilities
```

### Test Categories

#### 1. Unit Tests
**Target Coverage**: 90% for critical paths, 80% overall

**Critical Test Areas**:
- **Financial Calculations** (`src/utils/calculations.ts`): 95% coverage required
  - Currency precision handling
  - Floating-point error prevention
  - Settlement calculation accuracy
  - Edge case validation
- **Input Validation** (`src/utils/validation.ts`): 90% coverage required
  - Security input sanitization
  - Business rule enforcement
  - Rate limiting functionality
- **Database Operations**: 85% coverage required
  - Transaction integrity
  - Connection management
  - Error handling

#### 2. Integration Tests
**Location**: `tests/__tests__/integration/`

**Coverage Areas**:
- Complete session lifecycle (creation → active → completed)
- Transaction processing flows (buy-in → cash-out → undo)
- Cross-service communication
- Database transaction integrity
- Voice command integration with fallback
- WhatsApp sharing workflow

#### 3. Performance Tests
**Location**: `tests/__tests__/performance/`

**Performance Requirements**:
- Database operations: <100ms per operation
- Memory usage: <50MB increase per major operation
- Startup time: <3 seconds
- Concurrent operation handling: 90%+ success rate under load

#### 4. Memory Leak Detection
**Location**: `tests/__tests__/performance/memory-leak-detection.test.ts`

**Monitoring Areas**:
- Component mount/unmount cycles
- Database connection lifecycle
- Service cleanup validation
- Memory pressure scenarios

## Testing Standards and Requirements

### Coverage Thresholds
```javascript
// Jest configuration coverage thresholds
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/utils/calculations.ts": {
      "branches": 95,
      "functions": 95,
      "lines": 95,
      "statements": 95
    },
    "src/services/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

### Test Execution Commands

#### Development Testing
```bash
# Fast feedback during development
npm run test:core           # Core functionality (UndoManager, TransactionService, App)
npm run test:fast          # Performance-optimized full suite (75% CPU)
npm run test:services      # Service-specific targeted tests
npm run test:stores        # Zustand store tests using native patterns

# Full regression testing
npm test                   # Complete test suite
npm run test:ci           # CI/CD configuration with coverage
```

#### Specialized Testing
```bash
# Performance and memory testing
npm run test:performance   # Performance regression tests
npm run test:memory       # Memory leak detection
npm run test:integration  # Cross-service integration tests

# Coverage analysis
npm test -- --coverage    # Generate coverage reports
npm run test:coverage     # Coverage with threshold enforcement
```

### WSL Environment Limitations
**KNOWN ISSUE**: Jest tests experience performance degradation in WSL due to subprocess spawning overhead.

**Validated Workarounds**:
- Use `npm run typecheck` for immediate feedback (reliable in WSL)
- Core tests (`npm run test:core`) may work with `--forceExit --maxWorkers=1`
- Run full test suite in native Linux environment or Docker for reliable results

## Mock Architecture

### Centralized Mock Factory
**Location**: `tests/mock-factories.js`

```javascript
// Service mocking
const databaseService = ServiceMocks.createDatabaseService();
const voiceService = ServiceMocks.createVoiceService();

// Data factory patterns
const session = DataFactories.createSessionData({
  playerCount: 4,
  buyInAmount: 100.00
});

// Scenario factories for complex test setups
const multiPlayerScenario = ScenarioFactories.createMultiPlayerSession();
```

### Store Testing Patterns
**Location**: `tests/zustand-testing.js`

```javascript
// Native Zustand testing without React hooks dependency
const testStore = createTestStore(sessionStore);
const result = testStoreAction(testStore, 'addPlayer', playerData);

// Avoids React 19 compatibility issues
// No external React dependencies in store tests
```

## Financial Calculation Testing

### Critical Test Coverage
**File**: `tests/__tests__/utils/calculations.test.ts`

**Required Test Scenarios**:
- Floating-point precision prevention
- Currency rounding accuracy
- Settlement calculation correctness
- Edge cases (very small/large amounts)
- Zero-sum validation in poker scenarios
- Integration with percentage calculations (rake/tips)

**Example Test Pattern**:
```javascript
describe('Financial Precision Testing', () => {
  it('should handle floating-point precision issues', () => {
    // Classic problem: 0.1 + 0.2 = 0.30000000000000004
    expect(CalculationUtils.addAmounts(0.1, 0.2)).toBe(0.3);
    expect(CalculationUtils.subtractAmounts(0.3, 0.2)).toBe(0.1);
  });
});
```

## Performance Testing Standards

### Database Performance Requirements
- **Query Response Time**: <100ms per operation
- **Concurrent Access**: Handle 100+ concurrent database operations
- **Memory Usage**: <25MB increase for 500 transactions
- **Connection Management**: No connection leaks after operations

### Application Performance Standards
- **Startup Time**: <3 seconds for full initialization
- **Memory Baseline**: <50MB for basic session operations
- **UI Responsiveness**: <2 seconds for heavy computations (settlement calculations)
- **Bundle Size**: Optimized utility performance (<100ms for 1000 operations)

## Memory Leak Detection

### Automated Detection Areas
- Component lifecycle memory management
- Database connection cleanup
- Service instance disposal
- Event listener cleanup
- Timer/interval clearing

### Memory Monitoring Thresholds
- **Warning**: 30MB heap usage increase
- **Critical**: 50MB heap usage increase
- **Regression**: >150% memory increase compared to baseline

## Error Logging and Monitoring

### Error Logger Integration
**Service**: `src/services/monitoring/ErrorLogger.ts`
**Tests**: `tests/__tests__/services/monitoring/ErrorLogger.test.ts`

**Error Categories**:
- Database errors
- Network connectivity issues
- Validation failures
- Business logic errors
- UI component errors
- Performance issues
- Security violations
- System crashes

**Integration Example**:
```javascript
import { errorLogger, ErrorSeverity, ErrorCategory } from '@/services/monitoring/ErrorLogger';

// Service error reporting
const errorId = errorLogger.logError(
  'Transaction processing failed',
  ErrorSeverity.HIGH,
  ErrorCategory.BUSINESS_LOGIC,
  {
    sessionId: session.id,
    playerId: player.id,
    component: 'TransactionService',
    action: 'recordBuyIn'
  },
  error
);
```

## CI/CD Pipeline Integration

### GitHub Actions Workflow
**File**: `.github/workflows/comprehensive-testing.yml`

**Pipeline Stages**:
1. **Quality Gates** (10 min): TypeScript, lint, security audit
2. **Unit Tests** (15 min): Parallel test execution by category
3. **Integration Tests** (20 min): Cross-service testing
4. **Performance Tests** (25 min): Database and app performance
5. **Memory Tests** (20 min): Memory leak detection
6. **Coverage Validation** (15 min): Threshold enforcement
7. **Security Testing** (15 min): Validation and license checks
8. **Mobile Build** (30 min): Android APK generation

### Deployment Gates
**Requirements for Deployment Approval**:
- ✅ All unit tests pass
- ✅ Integration tests pass with >90% success rate
- ✅ Coverage thresholds met (80% overall, 95% financial)
- ✅ Performance benchmarks within limits
- ✅ No critical security issues
- ✅ No critical memory leaks detected

## Best Practices

### Test Development Guidelines

#### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Include both positive and negative test cases

#### 2. Mock Usage
- Use centralized mock factories for consistency
- Mock external services (database, voice, WhatsApp)
- Avoid mocking internal business logic
- Maintain mock data integrity

#### 3. Financial Testing
- Test all currency calculations with floating-point edge cases
- Validate zero-sum constraints in poker scenarios
- Include comprehensive edge case testing
- Test with real-world poker amounts and scenarios

#### 4. Performance Testing
- Establish baseline measurements
- Test under realistic load conditions
- Monitor memory usage trends
- Include regression detection

### Maintenance Procedures

#### Monthly Test Review
- [ ] Review test coverage reports
- [ ] Update performance baselines
- [ ] Analyze error logging trends
- [ ] Update test data factories
- [ ] Review and update mock implementations

#### Quarterly Architecture Review
- [ ] Evaluate test infrastructure performance
- [ ] Review testing tool updates
- [ ] Assess coverage threshold adequacy
- [ ] Update CI/CD pipeline optimizations

#### Test Data Management
- Use factory functions for consistent test data
- Keep test data small and focused
- Clean up test artifacts after execution
- Version control test configuration files

## Troubleshooting Guide

### Common Test Failures

#### WSL Performance Issues
**Symptoms**: Tests hang after 2+ minutes, ETIMEDOUT errors
**Solutions**:
- Use `validation-script.js` for immediate feedback
- Run full tests in native Linux/Docker environment
- Use `npm run test:core` with `--forceExit --maxWorkers=1`

#### Memory-Related Failures
**Symptoms**: Out of memory errors, heap size exceeded
**Solutions**:
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Use `--forceExit` flag to prevent memory accumulation
- Run tests in smaller batches

#### Database Connection Issues
**Symptoms**: Connection timeouts, locked databases
**Solutions**:
- Ensure proper test cleanup with `afterEach` hooks
- Use isolated database instances for tests
- Check for unclosed connections in test teardown

#### Coverage Threshold Failures
**Symptoms**: Coverage below required thresholds
**Solutions**:
- Identify uncovered lines with `npm test -- --coverage`
- Focus on critical path coverage first
- Add edge case tests for complex functions

### Test Performance Optimization

#### Speed Improvements
- Use `maxWorkers=1` for memory-intensive tests
- Implement test parallelization where safe
- Cache test fixtures and mock data
- Use `--onlyChanged` for development testing

#### Memory Optimization
- Clear test data between test runs
- Use `jest.clearAllMocks()` consistently
- Implement proper async cleanup
- Monitor memory usage with performance tests

## Getting Started

### New Developer Onboarding
1. **Install Dependencies**: `npm install`
2. **Run Basic Tests**: `npm run test:core`
3. **Check Coverage**: `npm test -- --coverage`
4. **Review Test Examples**: Start with `tests/__tests__/utils/calculations.test.ts`
5. **Understand Architecture**: Read `tests/mock-factories.js` and `tests/zustand-testing.js`

### Adding New Tests
1. **Choose Test Category**: Unit, integration, or performance
2. **Use Mock Factories**: Import from `tests/mock-factories.js`
3. **Follow Naming Convention**: `ComponentName.test.ts`
4. **Include Coverage**: Ensure new code meets coverage thresholds
5. **Test Documentation**: Add inline comments for complex test scenarios

### Test Environment Setup
```bash
# Install dependencies
npm install

# Set up Git hooks (optional)
npx husky install

# Configure VS Code testing (recommended)
# Install Jest extension for integrated testing

# Run initial test validation
npm run test:core
npm run typecheck
```

This comprehensive testing infrastructure ensures PokePot maintains the highest standards of reliability, performance, and code quality while supporting ongoing development with fast feedback loops and automated validation.