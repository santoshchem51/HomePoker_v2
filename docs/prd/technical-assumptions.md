# Technical Assumptions

## Architecture: Monolithic Mobile Application
**Rationale:** Following ADR-001 (Complete Backend Elimination), PokePot uses a monolithic mobile architecture with local SQLite storage. This eliminates network dependencies, reduces complexity, and ensures 100% offline functionality for MVP delivery.

## Repository Structure: Single Repository  
**Rationale:** Simplified single-repository structure for mobile-only application reduces deployment complexity and enables faster MVP iteration without backend coordination overhead.

## Testing Requirements: Unit + Local Integration + **MANDATORY Visual Validation**
**Rationale:** Focus testing on financial calculation accuracy, SQLite operations, and core user flows. Local database integration testing ensures data integrity without network complexity.

**CRITICAL:** As of Story 1.8, ALL stories MUST include comprehensive visual validation using the actual PokePotExpo React Native application. HTML mockups or non-native demonstrations are strictly prohibited. See `/docs/STORY_DEFINITION_OF_DONE.md` for complete requirements.

## Additional Technical Assumptions and Requests

**Mobile Framework:** React Native with TypeScript for cross-platform MVP delivery. SQLite integration via react-native-sqlite-storage for local data persistence.

**Data Storage:** **Local SQLite database only** - eliminates backend dependencies, provides instant response times, and works completely offline. Session data automatically cleaned up after 10 hours per privacy requirements.

**Voice Recognition:** **On-device iOS/Android speech APIs first**, with fallback to manual input. Reduces external dependencies, improves response times, eliminates per-use API costs, and works completely offline.

**WhatsApp Integration (MVP):** **URL scheme approach with manual sharing** - users tap "Share to WhatsApp" button, WhatsApp opens with pre-filled message, user selects group and sends. No API setup required, works immediately, completely reliable.

**WhatsApp Integration (Post-MVP):** **WhatsApp Business API for automation** - planned for v2.0 to enable fully automated message posting to groups. Requires backend server reintroduction and business verification process.

**Infrastructure (MVP):** **None required** - mobile-only application with local storage eliminates all server infrastructure costs and complexity.

**Security Architecture:** Local SQLite encryption for session data, no network transmission of sensitive information, automatic data cleanup ensures privacy compliance.

**Risk Mitigation Strategies:**
- **WhatsApp Backup Plan:** Manual share buttons and formatted text generation if WhatsApp unavailable
- **Voice Recognition Backup:** Touch interface remains fully functional when speech fails
- **Offline-First Architecture:** Core functionality works without internet, no sync needed
- **Progressive Enhancement:** Start with basic features, add complexity based on user feedback
