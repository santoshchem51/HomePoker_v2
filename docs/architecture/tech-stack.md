# Tech Stack

This is the **DEFINITIVE technology selection** for the entire PokePot project. All development must use these exact versions as the single source of truth.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type safety and developer experience | Prevents runtime errors in financial calculations, excellent React Native support |
| Frontend Framework | React Native | 0.73+ | Cross-platform mobile development | Mature ecosystem, excellent performance, shared codebase for iOS/Android |
| UI Component Library | shadcn/ui + Custom | Latest | Accessible foundation + poker-specific components | WCAG AA compliance built-in, customizable for gaming aesthetics |
| State Management | Zustand | 4.4+ | Lightweight state management | Simple API, excellent TypeScript support, perfect for local-only state |
| Backend Language | TypeScript | 5.3+ | Service layer within React Native | Shared types between UI and business logic, single language stack |
| Backend Framework | React Native Services | N/A | Business logic abstraction layer | No separate backend - services run within mobile app |
| API Style | Internal Function Calls | N/A | Direct service invocation | No external API - all communication via TypeScript function calls |
| Database | SQLite | 3.45+ | Local data persistence | Reliable, fast, zero-config, works completely offline |
| Cache | React Query | 5.0+ | In-memory caching and state sync | Optimistic updates, background sync, excellent DevEx |
| File Storage | React Native FS | 2.20+ | Local file operations and exports | Session export, QR code generation, image handling |
| Authentication | Local Device Storage | N/A | Device-based session management | No user accounts needed, sessions tied to device |
| Frontend Testing | Jest + React Native Testing Library | Latest | Component and integration testing | Standard React Native testing stack, excellent TypeScript support |
| Backend Testing | Jest | 29+ | Business logic and service testing | Same testing framework for consistency, mock SQLite operations |
| E2E Testing | Maestro | 1.30+ | Cross-platform E2E automation | Better than Detox for React Native, supports voice simulation |
| Visual Mobile Testing | mobile-mcp | Latest | React Native UI visual regression | Specialized for gaming interfaces, handles animations and celebrations |
| Visual Web Testing | Playwright | 1.40+ | QR code web view testing | Tests player web interface accessed via QR scanning |
| Screenshot Testing | React Native Screenshot Tests | Latest | Component visual regression | Catches UI regressions in poker layouts and celebrations |
| Build Tool | Metro | 0.80+ | React Native bundler | Standard React Native build system, optimized for mobile |
| Bundler | Metro + React Native | Latest | JavaScript bundling and optimization | Built-in React Native tooling, handles TypeScript compilation |
| IaC Tool | None Required | N/A | No infrastructure to manage | Mobile-only app eliminates infrastructure complexity |
| CI/CD | GitHub Actions | Latest | Automated testing and app store deployment | Excellent React Native support, free for open source |
| Monitoring | Flipper + React Native Performance | Latest | Development debugging and performance | Built-in React Native tooling, SQLite query monitoring |
| Logging | React Native Logs | 5.0+ | Local logging and debugging | File-based logging for offline debugging, export capability |
| CSS Framework | React Native StyleSheet + Tailwind RN | Latest | Styling system with utility classes | Performance optimized, consistent with web patterns |
| Background Tasks | JavaScript Timers + AppState | Built-in | Scheduled task execution | setInterval with AppState monitoring for app lifecycle handling |
| User Notifications | React Native Alert | Built-in | User alerts and confirmations | Built-in Alert.alert() for immediate notifications, SQLite queue for deferred |
