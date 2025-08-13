# Requirements

## Functional

**FR1:** The system shall allow voice-enabled buy-in logging with commands like "Add John $50" without requiring manual text input during active gameplay

**FR2:** The system shall calculate instant early cash-out amounts by determining player balance versus remaining bank when a player leaves mid-game

**FR3:** The system shall generate optimized final settlement plans that minimize the total number of transactions between players (e.g., reducing 6 separate payments to 2-3 transfers)

**FR4:** The system shall enable session creation via QR code generation that other players can scan to join without requiring app installation or account creation

**FR5:** The system shall enable easy sharing of key poker events (buy-ins, cash-outs, final settlements) to WhatsApp groups through pre-formatted messages and URL scheme integration

**FR6:** The system shall maintain player profiles for regular poker crew members to enable quick session setup without repetitive name entry

**FR7:** The system shall track all buy-in and cash-out transactions with timestamps for complete session audit trail

**FR8:** The system shall support 4-8 player sessions with real-time balance calculations for all participants

**FR9:** The system shall operate completely offline with no network dependencies required for core operations

**FR10:** The system shall validate all financial calculations to ensure buy-ins equal cash-outs plus remaining chips at session end

## Non Functional

**NFR1:** Voice recognition processing shall complete within 500ms for basic buy-in commands in normal poker game environments

**NFR2:** Settlement optimization calculations shall complete within 2 seconds for up to 8 players with multiple transactions

**NFR3:** The application memory footprint shall not exceed 150MB during active session use

**NFR4:** QR code session joining shall achieve 95% success rate across iOS and Android devices

**NFR5:** WhatsApp sharing shall achieve 95% success rate for URL scheme integration across iOS and Android devices

**NFR6:** The application shall maintain 60fps UI performance during all user interactions

**NFR7:** Session data shall be automatically deleted after 10 hours to ensure privacy compliance

**NFR8:** All financial data shall be encrypted using AES-256 encryption in local SQLite storage

**NFR9:** The system shall support concurrent voice commands from multiple users without audio interference

**NFR10:** Mobile app shall be compatible with iOS 15.0+ and Android 11+ with 4GB RAM minimum

**NFR11:** SQLite database operations shall complete within 100ms for typical queries

**NFR12:** App startup time shall be under 3 seconds on average devices
