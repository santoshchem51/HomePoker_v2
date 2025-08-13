# Developer Onboarding Checklist - PokePot

Welcome to the PokePot development team! This checklist will guide you through setting up your development environment and understanding the project.

## 🚀 Environment Setup

### Prerequisites
- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **Git** configured with your credentials
- [ ] **React Native development environment** set up
  - [ ] Android Studio (for Android development)
  - [ ] Xcode (for iOS development, macOS only)
- [ ] **VS Code** or preferred IDE installed

### Project Setup
- [ ] Clone the repository: `git clone <repo-url>`
- [ ] Install dependencies: `npm install`
- [ ] **iOS only**: Install CocoaPods: `cd ios && pod install && cd ..`
- [ ] Verify installation: `npm run typecheck && npm run lint`

### Development Environment Test
- [ ] Start Metro bundler: `npm start`
- [ ] Run Android app: `npm run android` (in new terminal)
- [ ] Run iOS app: `npm run ios` (in new terminal)
- [ ] Verify health check screen appears on app launch
- [ ] Check database connectivity in health screen

### IDE Configuration
- [ ] Install React Native Tools extension
- [ ] Install TypeScript extension
- [ ] Install ESLint extension
- [ ] Configure auto-format on save
- [ ] Set up Jest test runner extension

## 📚 Project Understanding

### Architecture Review
- [ ] Read `README.md` for project overview
- [ ] Review `DEVELOPMENT.md` for development workflow
- [ ] Study `docs/architecture/coding-standards.md`
- [ ] Understand `docs/architecture/tech-stack.md`
- [ ] Review database schema in `database/schema.sql`

### Code Exploration
- [ ] Explore `src/` directory structure
- [ ] Review `DatabaseService.ts` implementation
- [ ] Study `HealthCheckService.ts` and health check flow
- [ ] Examine `App.tsx` initialization logic
- [ ] Look at `HealthStatus.tsx` component

### Testing Familiarity
- [ ] Run test suite: `npm test`
- [ ] Review test examples in `__tests__/`
- [ ] Understand testing strategy from `DEVELOPMENT.md`
- [ ] Run coverage report: `npm test -- --coverage`

## 🛠 Development Skills

### Required Technologies
- [ ] **React Native** fundamentals
- [ ] **TypeScript** strict mode usage
- [ ] **SQLite** database operations
- [ ] **Jest** testing framework
- [ ] **ESLint** code quality tools

### Financial Application Context
- [ ] Understand floating-point precision issues
- [ ] Learn `CalculationUtils` usage for currency math
- [ ] Review transaction atomicity requirements
- [ ] Study settlement calculation validation

### PokePot-Specific Patterns
- [ ] **Service Layer**: All business logic in services
- [ ] **Type Safety**: Shared types in `src/types/`
- [ ] **Error Handling**: Consistent `ServiceError` usage
- [ ] **Database**: Transaction-based operations
- [ ] **Validation**: Input validation through services

## 🧪 First Development Task

### Practice Assignment
Create a simple service to demonstrate understanding:

- [ ] Create `src/services/ExampleService.ts`
- [ ] Implement singleton pattern
- [ ] Add database query method
- [ ] Include proper error handling
- [ ] Write unit tests in `__tests__/`
- [ ] Ensure TypeScript compliance
- [ ] Pass ESLint validation

### Code Review Process
- [ ] Create feature branch: `git checkout -b onboarding/example-service`
- [ ] Implement the service
- [ ] Run full test suite: `npm test`
- [ ] Check code quality: `npm run lint && npm run typecheck`
- [ ] Submit PR for review
- [ ] Address feedback and learn from comments

## 📋 Project Standards Verification

### Code Quality Checklist
- [ ] TypeScript strict mode: No `any` types
- [ ] ESLint: Zero warnings/errors
- [ ] Tests: ≥90% coverage for critical paths
- [ ] Documentation: JSDoc for complex functions
- [ ] Imports: Use path mapping (`src/`)

### Financial Safety Checklist
- [ ] Currency calculations use `CalculationUtils`
- [ ] Database operations use transactions
- [ ] Input validation through `ValidationService`
- [ ] Error handling with proper codes
- [ ] No direct state mutation

### Performance Checklist
- [ ] Bundle size under 50MB
- [ ] App startup under 3 seconds
- [ ] Database init under 100ms
- [ ] Memory usage monitoring
- [ ] No memory leaks in components

## 🚦 CI/CD Understanding

### Pipeline Knowledge
- [ ] Review `.github/workflows/ci.yml`
- [ ] Understand testing requirements
- [ ] Know build process for Android/iOS
- [ ] Learn security scanning steps
- [ ] Understand release automation

### Local Pipeline Testing
- [ ] Run CI commands locally:
  - [ ] `npm ci`
  - [ ] `npm run typecheck`
  - [ ] `npm run lint`
  - [ ] `npm test -- --coverage`
- [ ] Build Android APK: `npm run build:android:debug`
- [ ] Verify health checks pass

## 🤝 Team Integration

### Communication Setup
- [ ] Join project Slack/Discord channels
- [ ] Set up meeting calendar access
- [ ] Understand sprint planning process
- [ ] Know who to ask for help

### Development Workflow
- [ ] Understand Git branching strategy
- [ ] Learn code review process
- [ ] Know deployment procedures
- [ ] Understand issue tracking system

### Documentation Contribution
- [ ] Know how to update documentation
- [ ] Understand when documentation updates are needed
- [ ] Learn architecture decision recording process

## 🎯 Knowledge Verification

### Technical Quiz
Answer these questions to verify understanding:

1. **Database**: What SQLite optimizations are enabled in `DatabaseService`?
2. **Financial**: Why can't we use regular JavaScript math for currency?
3. **Testing**: What are the coverage requirements for different code types?
4. **Architecture**: What is the purpose of the service layer pattern?
5. **Performance**: What are the app startup time requirements?

### Practical Tasks
- [ ] Fix a TypeScript error intentionally introduced
- [ ] Add a new field to the health check display
- [ ] Write a test for an existing service method
- [ ] Create a simple database migration
- [ ] Optimize a component for better performance

## ✅ Onboarding Complete

### Sign-off Checklist
- [ ] **Mentor Approval**: Code review from senior developer
- [ ] **Technical Lead Approval**: Architecture understanding verified
- [ ] **First PR Merged**: Successfully completed practice assignment
- [ ] **CI/CD Success**: All pipeline checks passing
- [ ] **Documentation Updated**: Added name to team list

### Next Steps
- [ ] Assigned to first real story/task
- [ ] Added to appropriate development channels
- [ ] Scheduled for next sprint planning
- [ ] Access to production monitoring tools (if applicable)

---

**Welcome to the team!** 🎉

If you have questions during onboarding:
- Check `DEVELOPMENT.md` for technical issues
- Review `docs/architecture/` for design questions  
- Ask your mentor or tech lead for guidance
- Use team chat for quick questions

Remember: The goal is to understand the codebase and contribute safely to financial software. Take your time and ask questions!