/**
 * Validation Utilities Test Suite
 * Story 5.3: Comprehensive Testing Suite - Task 1
 * Security and input validation require comprehensive testing
 */

import {
  validatePlayerId,
  validateSessionId,
  validateBuyInAmount,
  validatePlayerName,
  validateChipCounts,
  sanitizeTextInput,
  RateLimiter,
} from '@/utils/validation';
import { TRANSACTION_LIMITS } from '@/types/transaction';

describe('Validation Utilities - Security and Input Validation', () => {
  describe('validatePlayerId - Player ID Validation', () => {
    it('should accept valid player IDs', () => {
      expect(validatePlayerId('player1')).toEqual({ isValid: true });
      expect(validatePlayerId('PLAYER_2')).toEqual({ isValid: true });
      expect(validatePlayerId('user-123')).toEqual({ isValid: true });
      expect(validatePlayerId('ABC123xyz')).toEqual({ isValid: true });
      expect(validatePlayerId('a')).toEqual({ isValid: true }); // Single character
      expect(validatePlayerId('1234567890')).toEqual({ isValid: true }); // Numbers only
    });

    it('should reject null or empty player IDs', () => {
      expect(validatePlayerId(null)).toEqual({ 
        isValid: false, 
        error: 'Player ID is required' 
      });
      expect(validatePlayerId('')).toEqual({ 
        isValid: false, 
        error: 'Player ID is required' 
      });
    });

    it('should reject player IDs with invalid characters', () => {
      expect(validatePlayerId('player@123')).toEqual({ 
        isValid: false, 
        error: 'Invalid player ID format' 
      });
      expect(validatePlayerId('player#1')).toEqual({ 
        isValid: false, 
        error: 'Invalid player ID format' 
      });
      expect(validatePlayerId('player$')).toEqual({ 
        isValid: false, 
        error: 'Invalid player ID format' 
      });
      expect(validatePlayerId('player 1')).toEqual({ // Space
        isValid: false, 
        error: 'Invalid player ID format' 
      });
      expect(validatePlayerId('player;drop table')).toEqual({ // SQL injection attempt
        isValid: false, 
        error: 'Invalid player ID format' 
      });
    });

    it('should reject player IDs exceeding length limits', () => {
      const tooLong = 'a'.repeat(51);
      expect(validatePlayerId(tooLong)).toEqual({ 
        isValid: false, 
        error: 'Player ID must be 1-50 characters' 
      });
    });

    it('should handle edge cases at length boundaries', () => {
      const exactly50 = 'a'.repeat(50);
      expect(validatePlayerId(exactly50)).toEqual({ isValid: true });
      
      const exactly51 = 'a'.repeat(51);
      expect(validatePlayerId(exactly51)).toEqual({ 
        isValid: false, 
        error: 'Player ID must be 1-50 characters' 
      });
    });

    it('should prevent common injection attack patterns', () => {
      const injectionAttempts = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        'player\'; DROP TABLE players; --',
        'player\x00null',
        'player\nline',
        'player\rcarriage',
        'player\ttab',
      ];

      injectionAttempts.forEach(attempt => {
        const result = validatePlayerId(attempt);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('validateSessionId - Session ID Validation', () => {
    it('should accept valid session IDs', () => {
      expect(validateSessionId('session1')).toEqual({ isValid: true });
      expect(validateSessionId('SESSION_2')).toEqual({ isValid: true });
      expect(validateSessionId('game-123')).toEqual({ isValid: true });
      expect(validateSessionId('ABC123xyz')).toEqual({ isValid: true });
      expect(validateSessionId('s')).toEqual({ isValid: true }); // Single character
    });

    it('should reject empty session IDs', () => {
      expect(validateSessionId('')).toEqual({ 
        isValid: false, 
        error: 'Session ID is required' 
      });
    });

    it('should reject session IDs with invalid characters', () => {
      expect(validateSessionId('session@123')).toEqual({ 
        isValid: false, 
        error: 'Invalid session ID format' 
      });
      expect(validateSessionId('session space')).toEqual({ 
        isValid: false, 
        error: 'Invalid session ID format' 
      });
      expect(validateSessionId('session/path')).toEqual({ 
        isValid: false, 
        error: 'Invalid session ID format' 
      });
    });

    it('should reject session IDs exceeding length limits', () => {
      const tooLong = 'a'.repeat(51);
      expect(validateSessionId(tooLong)).toEqual({ 
        isValid: false, 
        error: 'Session ID must be 1-50 characters' 
      });
    });

    it('should handle UUID-like session IDs', () => {
      // UUID without hyphens is valid
      const uuidNoHyphens = '550e8400e29b41d4a716446655440000';
      expect(validateSessionId(uuidNoHyphens)).toEqual({ isValid: true });
      
      // UUID with hyphens is valid
      const uuidWithHyphens = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateSessionId(uuidWithHyphens)).toEqual({ isValid: true });
    });
  });

  describe('validateBuyInAmount - Buy-in Amount Validation', () => {
    it('should accept valid buy-in amounts', () => {
      expect(validateBuyInAmount(50)).toEqual({ isValid: true });
      expect(validateBuyInAmount(100)).toEqual({ isValid: true });
      expect(validateBuyInAmount(100.50)).toEqual({ isValid: true });
      expect(validateBuyInAmount(999.99)).toEqual({ isValid: true });
      expect(validateBuyInAmount(TRANSACTION_LIMITS.MIN_BUY_IN)).toEqual({ isValid: true });
      expect(validateBuyInAmount(TRANSACTION_LIMITS.MAX_BUY_IN)).toEqual({ isValid: true });
    });

    it('should reject non-numeric values', () => {
      expect(validateBuyInAmount(NaN)).toEqual({ 
        isValid: false, 
        error: 'Amount must be a valid number' 
      });
      expect(validateBuyInAmount(Infinity)).toEqual({ 
        isValid: false, 
        error: 'Amount must be a valid number' 
      });
      expect(validateBuyInAmount(-Infinity)).toEqual({ 
        isValid: false, 
        error: 'Amount must be a valid number' 
      });
    });

    it('should reject amounts below minimum', () => {
      const belowMin = TRANSACTION_LIMITS.MIN_BUY_IN - 0.01;
      expect(validateBuyInAmount(belowMin)).toEqual({ 
        isValid: false, 
        error: `Minimum buy-in amount is $${TRANSACTION_LIMITS.MIN_BUY_IN}` 
      });
      expect(validateBuyInAmount(0)).toEqual({ 
        isValid: false, 
        error: 'Amount must be positive' 
      });
    });

    it('should reject amounts above maximum', () => {
      const aboveMax = TRANSACTION_LIMITS.MAX_BUY_IN + 0.01;
      expect(validateBuyInAmount(aboveMax)).toEqual({ 
        isValid: false, 
        error: `Maximum buy-in amount is $${TRANSACTION_LIMITS.MAX_BUY_IN}` 
      });
    });

    it('should reject negative amounts', () => {
      expect(validateBuyInAmount(-50)).toEqual({ 
        isValid: false, 
        error: 'Amount must be positive' 
      });
      expect(validateBuyInAmount(-0.01)).toEqual({ 
        isValid: false, 
        error: 'Amount must be positive' 
      });
    });

    it('should reject amounts with more than 2 decimal places', () => {
      expect(validateBuyInAmount(100.001)).toEqual({ 
        isValid: false, 
        error: 'Amount cannot have more than 2 decimal places' 
      });
      expect(validateBuyInAmount(50.999)).toEqual({ 
        isValid: false, 
        error: 'Amount cannot have more than 2 decimal places' 
      });
      expect(validateBuyInAmount(25.12345)).toEqual({ 
        isValid: false, 
        error: 'Amount cannot have more than 2 decimal places' 
      });
    });

    it('should handle floating-point precision correctly', () => {
      // These should be valid despite potential floating-point issues
      expect(validateBuyInAmount(100.10)).toEqual({ isValid: true });
      expect(validateBuyInAmount(100.20)).toEqual({ isValid: true });
      expect(validateBuyInAmount(100.30)).toEqual({ isValid: true });
      expect(validateBuyInAmount(100.99)).toEqual({ isValid: true });
    });

    it('should validate common poker buy-in amounts', () => {
      const commonAmounts = [20, 25, 50, 100, 200, 300, 500, 1000];
      commonAmounts.forEach(amount => {
        if (amount >= TRANSACTION_LIMITS.MIN_BUY_IN && amount <= TRANSACTION_LIMITS.MAX_BUY_IN) {
          expect(validateBuyInAmount(amount)).toEqual({ isValid: true });
        }
      });
    });
  });

  describe('validatePlayerName - Player Name Validation', () => {
    it('should accept valid player names', () => {
      expect(validatePlayerName('John')).toEqual({ isValid: true });
      expect(validatePlayerName('John Doe')).toEqual({ isValid: true });
      expect(validatePlayerName('Player_1')).toEqual({ isValid: true });
      expect(validatePlayerName('User-123')).toEqual({ isValid: true });
      expect(validatePlayerName('Bob.Smith')).toEqual({ isValid: true });
      expect(validatePlayerName('123Player')).toEqual({ isValid: true });
    });

    it('should reject empty or invalid names', () => {
      expect(validatePlayerName('')).toEqual({ 
        isValid: false, 
        error: 'Player name is required' 
      });
      expect(validatePlayerName(null as any)).toEqual({ 
        isValid: false, 
        error: 'Player name is required' 
      });
      expect(validatePlayerName(undefined as any)).toEqual({ 
        isValid: false, 
        error: 'Player name is required' 
      });
    });

    it('should sanitize and validate dangerous characters', () => {
      // Names with dangerous characters should be sanitized
      expect(validatePlayerName('<script>alert("xss")</script>')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
      expect(validatePlayerName('John<>&"\'')).toEqual({ 
        isValid: false, 
        error: 'Player name cannot be empty' 
      });
    });

    it('should reject names exceeding length limits', () => {
      const tooLong = 'a'.repeat(51);
      expect(validatePlayerName(tooLong)).toEqual({ 
        isValid: false, 
        error: 'Player name cannot exceed 50 characters' 
      });
    });

    it('should handle names at length boundaries', () => {
      const exactly50 = 'a'.repeat(50);
      expect(validatePlayerName(exactly50)).toEqual({ isValid: true });
      
      const exactly51 = 'a'.repeat(51);
      expect(validatePlayerName(exactly51)).toEqual({ 
        isValid: false, 
        error: 'Player name cannot exceed 50 characters' 
      });
    });

    it('should reject names with invalid characters after sanitization', () => {
      expect(validatePlayerName('John@Doe')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
      expect(validatePlayerName('Player#1')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
      expect(validatePlayerName('User$$$')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
    });

    it('should handle international characters conservatively', () => {
      // Non-ASCII characters are currently not allowed
      expect(validatePlayerName('José')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
      expect(validatePlayerName('Björn')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
      expect(validatePlayerName('李明')).toEqual({ 
        isValid: false, 
        error: 'Player name contains invalid characters' 
      });
    });
  });

  describe('validateChipCounts - Chip Count Validation', () => {
    it('should accept valid chip counts', () => {
      expect(validateChipCounts({ red: 0, green: 0, black: 0 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 10, green: 5, black: 2 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 100, green: 50, black: 25 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 1000, green: 1000, black: 1000 })).toEqual({ isValid: true });
    });

    it('should reject non-numeric chip counts', () => {
      expect(validateChipCounts({ red: NaN, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Invalid chip count format' 
      });
      expect(validateChipCounts({ red: 'ten' as any, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Invalid chip count format' 
      });
      expect(validateChipCounts({ red: null as any, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Invalid chip count format' 
      });
    });

    it('should reject negative chip counts', () => {
      expect(validateChipCounts({ red: -1, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts cannot be negative' 
      });
      expect(validateChipCounts({ red: 0, green: -10, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts cannot be negative' 
      });
      expect(validateChipCounts({ red: 0, green: 0, black: -5 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts cannot be negative' 
      });
    });

    it('should reject non-integer chip counts', () => {
      expect(validateChipCounts({ red: 10.5, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts must be whole numbers' 
      });
      expect(validateChipCounts({ red: 0, green: 5.25, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts must be whole numbers' 
      });
      expect(validateChipCounts({ red: 0, green: 0, black: 2.99 })).toEqual({ 
        isValid: false, 
        error: 'Chip counts must be whole numbers' 
      });
    });

    it('should reject excessive chip counts', () => {
      expect(validateChipCounts({ red: 1001, green: 0, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Maximum 1000 chips allowed per denomination' 
      });
      expect(validateChipCounts({ red: 0, green: 2000, black: 0 })).toEqual({ 
        isValid: false, 
        error: 'Maximum 1000 chips allowed per denomination' 
      });
      expect(validateChipCounts({ red: 0, green: 0, black: 10000 })).toEqual({ 
        isValid: false, 
        error: 'Maximum 1000 chips allowed per denomination' 
      });
    });

    it('should handle boundary values', () => {
      expect(validateChipCounts({ red: 1000, green: 1000, black: 1000 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 1001, green: 1000, black: 1000 })).toEqual({ 
        isValid: false, 
        error: 'Maximum 1000 chips allowed per denomination' 
      });
    });

    it('should validate common poker chip distributions', () => {
      // Typical home game distributions
      expect(validateChipCounts({ red: 20, green: 20, black: 10 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 40, green: 30, black: 20 })).toEqual({ isValid: true });
      expect(validateChipCounts({ red: 100, green: 75, black: 50 })).toEqual({ isValid: true });
    });
  });

  describe('sanitizeTextInput - Text Sanitization', () => {
    it('should sanitize dangerous HTML characters', () => {
      expect(sanitizeTextInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
      expect(sanitizeTextInput('<img src="x" onerror="alert(1)">')).toBe('img src=x onerror=alert(1)');
      expect(sanitizeTextInput('normal text')).toBe('normal text');
    });

    it('should remove quotes and ampersands', () => {
      expect(sanitizeTextInput('John\'s "text" & more')).toBe('Johns text  more');
      expect(sanitizeTextInput('O\'Brien')).toBe('OBrien');
      expect(sanitizeTextInput('"quoted"')).toBe('quoted');
    });

    it('should trim whitespace', () => {
      expect(sanitizeTextInput('  text  ')).toBe('text');
      expect(sanitizeTextInput('\n\ttext\n\t')).toBe('text');
      expect(sanitizeTextInput('   ')).toBe('');
    });

    it('should limit text length', () => {
      const longText = 'a'.repeat(2000);
      const sanitized = sanitizeTextInput(longText);
      expect(sanitized.length).toBe(1000);
      expect(sanitized).toBe('a'.repeat(1000));
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeTextInput(null as any)).toBe('');
      expect(sanitizeTextInput(undefined as any)).toBe('');
      expect(sanitizeTextInput(123 as any)).toBe('');
      expect(sanitizeTextInput({} as any)).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeTextInput('')).toBe('');
      expect(sanitizeTextInput('   ')).toBe('');
    });

    it('should preserve safe special characters', () => {
      expect(sanitizeTextInput('user@example.com')).toBe('user@example.com');
      expect(sanitizeTextInput('file-name_123.txt')).toBe('file-name_123.txt');
      expect(sanitizeTextInput('50% discount!')).toBe('50% discount!');
    });

    it('should handle SQL injection attempts', () => {
      expect(sanitizeTextInput('\'; DROP TABLE users; --')).toBe('; DROP TABLE users; --');
      expect(sanitizeTextInput('1 OR 1=1')).toBe('1 OR 1=1');
      // Note: Additional SQL injection prevention should be done at the database layer
    });
  });

  describe('RateLimiter - Rate Limiting', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000); // 3 attempts per second
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow requests within the limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should block requests exceeding the limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false); // 4th attempt blocked
      expect(rateLimiter.isAllowed('user1')).toBe(false); // Still blocked
    });

    it('should track different keys independently', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      
      // Different user should still be allowed
      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(true);
      expect(rateLimiter.isAllowed('user2')).toBe(false);
    });

    it('should reset after the time window', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      
      // Advance time past the window
      jest.advanceTimersByTime(1001);
      
      // Should be allowed again
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should handle partial window expiry', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      
      jest.advanceTimersByTime(500);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      
      // Advance time so first attempt expires
      jest.advanceTimersByTime(501);
      expect(rateLimiter.isAllowed('user1')).toBe(true); // Can make one more
      expect(rateLimiter.isAllowed('user1')).toBe(false);
    });

    it('should reset limits when explicitly called', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(false);
      
      rateLimiter.reset('user1');
      
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
      expect(rateLimiter.isAllowed('user1')).toBe(true);
    });

    it('should handle high-frequency requests', () => {
      const limiter = new RateLimiter(100, 1000); // 100 requests per second
      
      for (let i = 0; i < 100; i++) {
        expect(limiter.isAllowed('highfreq')).toBe(true);
      }
      expect(limiter.isAllowed('highfreq')).toBe(false);
      
      jest.advanceTimersByTime(1001);
      expect(limiter.isAllowed('highfreq')).toBe(true);
    });

    it('should handle long time windows', () => {
      const limiter = new RateLimiter(5, 60000); // 5 requests per minute
      
      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed('slow')).toBe(true);
      }
      expect(limiter.isAllowed('slow')).toBe(false);
      
      jest.advanceTimersByTime(30000); // 30 seconds
      expect(limiter.isAllowed('slow')).toBe(false); // Still within window
      
      jest.advanceTimersByTime(30001); // Just past 60 seconds
      expect(limiter.isAllowed('slow')).toBe(true);
    });

    it('should handle default parameters', () => {
      const defaultLimiter = new RateLimiter(); // 10 attempts per 60 seconds
      
      for (let i = 0; i < 10; i++) {
        expect(defaultLimiter.isAllowed('default')).toBe(true);
      }
      expect(defaultLimiter.isAllowed('default')).toBe(false);
    });
  });

  describe('Integration Tests - Security Scenarios', () => {
    it('should prevent XSS attacks through player names', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        '<img src=x onerror="alert(1)">',
        'javascript:alert(1)',
        '<svg onload="alert(1)">',
      ];

      xssAttempts.forEach(attempt => {
        const sanitized = sanitizeTextInput(attempt);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('"');
        expect(sanitized).not.toContain('\'');
      });
    });

    it('should prevent SQL injection through IDs', () => {
      const sqlInjectionAttempts = [
        'player\'; DROP TABLE players; --',
        'player" OR 1=1 --',
        'player`; DELETE FROM sessions;',
      ];

      sqlInjectionAttempts.forEach(attempt => {
        expect(validatePlayerId(attempt).isValid).toBe(false);
        expect(validateSessionId(attempt).isValid).toBe(false);
      });
    });

    it('should enforce rate limiting for buy-in attempts', () => {
      const limiter = new RateLimiter(5, 10000); // 5 attempts per 10 seconds
      const playerId = 'player1';
      
      // Simulate rapid buy-in attempts
      for (let i = 0; i < 5; i++) {
        const amount = 100 + i;
        const validation = validateBuyInAmount(amount);
        if (validation.isValid) {
          expect(limiter.isAllowed(playerId)).toBe(true);
        }
      }
      
      // 6th attempt should be rate-limited
      expect(limiter.isAllowed(playerId)).toBe(false);
    });

    it('should validate complete transaction flow', () => {
      // 1. Validate session
      const sessionValidation = validateSessionId('game123');
      expect(sessionValidation.isValid).toBe(true);
      
      // 2. Validate player
      const playerValidation = validatePlayerId('player_abc');
      expect(playerValidation.isValid).toBe(true);
      
      // 3. Validate and sanitize player name
      const nameValidation = validatePlayerName('John Doe');
      expect(nameValidation.isValid).toBe(true);
      
      // 4. Validate buy-in amount
      const amountValidation = validateBuyInAmount(100.50);
      expect(amountValidation.isValid).toBe(true);
      
      // 5. Check rate limiting
      const limiter = new RateLimiter(10, 60000);
      expect(limiter.isAllowed('player_abc')).toBe(true);
    });
  });
});