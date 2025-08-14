/**
 * WhatsAppService Test Suite - Story 4.1: WhatsApp URL Scheme Integration
 * Tests URL scheme generation, validation, and fallback mechanisms
 */

import { WhatsAppService } from '../../../src/services/integration/WhatsAppService';
import { Linking } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

// Mock React Native modules
jest.mock('react-native', () => ({
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

// Mock database service
jest.mock('../../../src/services/infrastructure/DatabaseService', () => ({
  DatabaseService: {
    getInstance: jest.fn(() => ({
      executeQuery: jest.fn(),
    })),
  },
}));

describe('WhatsAppService', () => {
  let whatsappService: WhatsAppService;
  let mockLinking: jest.Mocked<typeof Linking>;
  let mockClipboard: jest.Mocked<typeof Clipboard>;

  beforeEach(() => {
    whatsappService = WhatsAppService.getInstance();
    mockLinking = Linking as jest.Mocked<typeof Linking>;
    mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('shareToWhatsApp', () => {
    const testMessage = 'Test settlement message';

    it('should share to WhatsApp when available', async () => {
      // Arrange
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue();

      // Act
      const result = await whatsappService.shareToWhatsApp(testMessage);

      // Assert
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text=')
      );
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('whatsapp://send?text=')
      );
      expect(result).toEqual({
        success: true,
        method: 'whatsapp',
      });
    });

    it('should fallback to clipboard when WhatsApp unavailable', async () => {
      // Arrange
      mockLinking.canOpenURL.mockResolvedValue(false);
      mockClipboard.setString.mockResolvedValue();

      // Act
      const result = await whatsappService.shareToWhatsApp(testMessage);

      // Assert
      expect(mockClipboard.setString).toHaveBeenCalledWith(testMessage);
      expect(result).toEqual({
        success: true,
        method: 'clipboard',
      });
    });

    it('should handle clipboard failure gracefully', async () => {
      // Arrange
      mockLinking.canOpenURL.mockResolvedValue(false);
      mockClipboard.setString.mockRejectedValue(new Error('Clipboard error'));

      // Act
      const result = await whatsappService.shareToWhatsApp(testMessage);

      // Assert
      expect(result).toEqual({
        success: false,
        method: 'clipboard',
        error: 'Failed to copy to clipboard',
      });
    });

    it('should validate message length', async () => {
      // Arrange
      const longMessage = 'a'.repeat(70000); // Exceeds WhatsApp limit

      // Act
      const result = await whatsappService.shareToWhatsApp(longMessage);

      // Assert - Should fallback to clipboard due to validation failure
      expect(mockClipboard.setString).toHaveBeenCalled();
      expect(result.method).toBe('clipboard');
    });

    it('should properly encode message for URL scheme', async () => {
      // Arrange
      const messageWithSpecialChars = 'Test & Share 100% 🎯';
      mockLinking.canOpenURL.mockResolvedValue(true);
      mockLinking.openURL.mockResolvedValue();

      // Act
      await whatsappService.shareToWhatsApp(messageWithSpecialChars);

      // Assert
      expect(mockLinking.openURL).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(messageWithSpecialChars))
      );
    });
  });

  describe('isWhatsAppAvailable', () => {
    it('should return true when WhatsApp is available', async () => {
      // Arrange
      mockLinking.canOpenURL.mockResolvedValue(true);

      // Act
      const result = await whatsappService.isWhatsAppAvailable();

      // Assert
      expect(result).toBe(true);
      expect(mockLinking.canOpenURL).toHaveBeenCalledWith('whatsapp://send?text=');
    });

    it('should return false when WhatsApp is not available', async () => {
      // Arrange
      mockLinking.canOpenURL.mockResolvedValue(false);

      // Act
      const result = await whatsappService.isWhatsAppAvailable();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      mockLinking.canOpenURL.mockRejectedValue(new Error('Linking error'));

      // Act
      const result = await whatsappService.isWhatsAppAvailable();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getSupportedSchemes', () => {
    it('should return WhatsApp URL scheme', () => {
      // Act
      const schemes = whatsappService.getSupportedSchemes();

      // Assert
      expect(schemes).toContain('whatsapp://send?text=');
    });
  });
});