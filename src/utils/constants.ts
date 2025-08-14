/**
 * Application Constants - Global constants for PokePot
 * Story 4.1: WhatsApp URL Scheme Integration
 */

// WhatsApp URL Scheme Constants
export const WHATSAPP_URL_SCHEME = 'whatsapp://send?text=';
export const WHATSAPP_MESSAGE_LIMIT = 65536; // WhatsApp message character limit
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 5000; // 5 seconds

// Session Management Constants
export const MAX_PLAYERS_PER_SESSION = 8;
export const MIN_PLAYERS_PER_SESSION = 2;
export const MIN_TRANSACTION_AMOUNT = 0.01;

// Undo Manager Constants
export const UNDO_TIMEOUT_MS = 30000; // 30 seconds

// Database Constants
export const SESSION_CLEANUP_THRESHOLD_HOURS = 10;
export const DB_VERSION = 1;