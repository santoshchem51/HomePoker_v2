/**
 * Validation utilities for secure input handling
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Security enhancements
 */

import { TRANSACTION_LIMITS } from '../types/transaction';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate player ID format and prevent injection attacks
 */
export const validatePlayerId = (playerId: string | null): ValidationResult => {
  if (!playerId) {
    return { isValid: false, error: 'Player ID is required' };
  }

  // Basic format validation - alphanumeric with hyphens/underscores
  const playerIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!playerIdRegex.test(playerId)) {
    return { isValid: false, error: 'Invalid player ID format' };
  }

  // Length validation
  if (playerId.length < 1 || playerId.length > 50) {
    return { isValid: false, error: 'Player ID must be 1-50 characters' };
  }

  return { isValid: true };
};

/**
 * Validate session ID format and prevent injection attacks
 */
export const validateSessionId = (sessionId: string): ValidationResult => {
  if (!sessionId) {
    return { isValid: false, error: 'Session ID is required' };
  }

  // Basic format validation - alphanumeric with hyphens/underscores
  const sessionIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!sessionIdRegex.test(sessionId)) {
    return { isValid: false, error: 'Invalid session ID format' };
  }

  // Length validation
  if (sessionId.length < 1 || sessionId.length > 50) {
    return { isValid: false, error: 'Session ID must be 1-50 characters' };
  }

  return { isValid: true };
};

/**
 * Validate buy-in amount and enforce business rules
 */
export const validateBuyInAmount = (amount: number): ValidationResult => {
  // Type check
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  // Range validation
  if (amount < TRANSACTION_LIMITS.MIN_BUY_IN) {
    return { 
      isValid: false, 
      error: `Minimum buy-in amount is $${TRANSACTION_LIMITS.MIN_BUY_IN}` 
    };
  }

  if (amount > TRANSACTION_LIMITS.MAX_BUY_IN) {
    return { 
      isValid: false, 
      error: `Maximum buy-in amount is $${TRANSACTION_LIMITS.MAX_BUY_IN}` 
    };
  }

  // Precision validation (no more than 2 decimal places)
  if (Number.isInteger(amount * 100) === false) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }

  // Negative number protection
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be positive' };
  }

  return { isValid: true };
};

/**
 * Sanitize text input to prevent XSS and other injection attacks
 */
export const sanitizeTextInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length to prevent memory issues
};

/**
 * Validate player name input
 */
export const validatePlayerName = (name: string): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Player name is required' };
  }

  const sanitizedName = sanitizeTextInput(name);
  
  // Length validation
  if (sanitizedName.length < 1) {
    return { isValid: false, error: 'Player name cannot be empty' };
  }

  if (sanitizedName.length > 50) {
    return { isValid: false, error: 'Player name cannot exceed 50 characters' };
  }

  // Basic character validation
  const nameRegex = /^[a-zA-Z0-9\s._-]+$/;
  if (!nameRegex.test(sanitizedName)) {
    return { isValid: false, error: 'Player name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Validate chip counts for poker chip calculator
 */
export const validateChipCounts = (chipCounts: { red: number; green: number; black: number }): ValidationResult => {
  const { red, green, black } = chipCounts;

  // Type validation
  if (typeof red !== 'number' || typeof green !== 'number' || typeof black !== 'number') {
    return { isValid: false, error: 'Invalid chip count format' };
  }

  // Non-negative validation
  if (red < 0 || green < 0 || black < 0) {
    return { isValid: false, error: 'Chip counts cannot be negative' };
  }

  // Integer validation
  if (!Number.isInteger(red) || !Number.isInteger(green) || !Number.isInteger(black)) {
    return { isValid: false, error: 'Chip counts must be whole numbers' };
  }

  // Reasonable upper limit to prevent overflow
  const maxChips = 1000;
  if (red > maxChips || green > maxChips || black > maxChips) {
    return { isValid: false, error: `Maximum ${maxChips} chips allowed per denomination` };
  }

  return { isValid: true };
};

/**
 * Rate limiting helper for preventing abuse
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < this.windowMs);
    
    // Check if under limit
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export default {
  validatePlayerId,
  validateSessionId,
  validateBuyInAmount,
  validatePlayerName,
  validateChipCounts,
  sanitizeTextInput,
  RateLimiter,
};