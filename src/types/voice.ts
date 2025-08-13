export interface VoiceRecognitionResult {
  value: string[];
  partial?: boolean;
  confidence?: number;
}

export interface VoiceRecognitionError {
  code?: string;
  message?: string;
}

export type VoiceRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceCommandResult {
  recognized: boolean;
  text: string;
  confidence: number;
  timestamp: Date;
  processingTime: number;
}

export interface VoiceServiceCapabilities {
  available: boolean;
  permissionGranted: boolean;
  supportsSpeechRecognition: boolean;
  platform: 'ios' | 'android' | 'unknown';
}

export const VOICE_ERROR_CODES = {
  VOICE_RECOGNITION_UNAVAILABLE: 'VOICE_RECOGNITION_UNAVAILABLE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  VOICE_TIMEOUT: 'VOICE_TIMEOUT',
  INITIALIZATION_FAILED: 'INITIALIZATION_FAILED',
  RECOGNITION_FAILED: 'RECOGNITION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUDIO_ERROR: 'AUDIO_ERROR',
  VOICE_COMMAND_AMBIGUOUS: 'VOICE_COMMAND_AMBIGUOUS',
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  AMOUNT_PARSE_FAILED: 'AMOUNT_PARSE_FAILED',
  VOICE_CONFIDENCE_TOO_LOW: 'VOICE_CONFIDENCE_TOO_LOW',
} as const;

export type VoiceErrorCode = keyof typeof VOICE_ERROR_CODES;

// Voice Command Parser Types
export interface PlayerMatchResult {
  playerId: string | null;
  playerName: string | null;
  confidence: number;
  similarMatches: Array<{
    playerId: string;
    playerName: string;
    similarity: number;
  }>;
}

export interface AmountParseResult {
  amount: number | null;
  confidence: number;
  rawText: string;
  interpretedAs: string;
}

export interface CommandResult {
  command: 'buy-in' | 'unknown';
  playerMatch: PlayerMatchResult;
  amountParse: AmountParseResult;
  overallConfidence: number;
  requiresConfirmation: boolean;
}

export interface SessionContext {
  sessionId: string;
  players: Array<{
    id: string;
    name: string;
  }>;
}