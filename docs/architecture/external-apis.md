# External APIs

PokePot is specifically designed to **minimize external dependencies** per ADR-001 (Complete Backend Elimination).

**External API Usage: MINIMAL BY DESIGN**

The application uses only **platform-native APIs** that are built into iOS and Android devices:

## Device Speech Recognition APIs

- **Purpose:** On-device voice command processing for hands-free transaction recording
- **Documentation:** iOS Speech Framework, Android SpeechRecognizer API
- **Base URL(s):** Native device APIs (no network endpoints)
- **Authentication:** Device permissions (microphone access)
- **Rate Limits:** No network rate limits - device processing only

**Key Endpoints Used:**
- iOS: `SFSpeechRecognizer.requestAuthorization()` - Permission management
- Android: `SpeechRecognizer.createSpeechRecognizer()` - Voice recognition service

## WhatsApp URL Scheme Integration

- **Purpose:** Social sharing of settlement results without requiring WhatsApp API integration
- **Documentation:** WhatsApp URL Scheme Documentation
- **Base URL(s):** `whatsapp://send?text=` (URL scheme, not API)
- **Authentication:** None required - uses device WhatsApp installation
- **Rate Limits:** No API limits - simple URL scheme activation

**Key Endpoints Used:**
- `whatsapp://send?text={encoded_message}` - Open WhatsApp with pre-filled message

## Device Platform APIs (No Network Calls)

**Camera API:** QR code generation and scanning for session joining
**File System API:** Local export and import functionality  
**Device Storage API:** SQLite database operations and file management
**Notifications API:** Local notifications for session reminders (if implemented)

## Network Dependencies: NONE

**Deliberate Architectural Choice:**
- No REST APIs, GraphQL endpoints, or cloud services
- No authentication servers or user management systems  
- No real-time sync or collaboration features
- No analytics or crash reporting services (initially)
