/**
 * WhatsAppShare Component Test Suite - Story 4.1: WhatsApp URL Scheme Integration
 * Tests component rendering, user interactions, and sharing workflows
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { WhatsAppShare } from '../../../src/screens/Settlement/WhatsAppShare';
import { WhatsAppService } from '../../../src/services/integration/WhatsAppService';
import { SettlementService } from '../../../src/services/settlement/SettlementService';
import { OptimizedSettlement } from '../../../src/types/settlement';

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
  },
  Linking: {
    canOpenURL: jest.fn(),
    openURL: jest.fn(),
  },
}));

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}));

// Mock services
jest.mock('../../../src/services/integration/WhatsAppService');
jest.mock('../../../src/services/settlement/SettlementService');

describe('WhatsAppShare Component', () => {
  let mockWhatsAppService: jest.Mocked<WhatsAppService>;
  let mockSettlementService: jest.Mocked<SettlementService>;
  let mockSettlement: OptimizedSettlement;
  let mockOnShareComplete: jest.Mock;

  beforeEach(() => {
    mockWhatsAppService = {
      shareToWhatsApp: jest.fn(),
      isWhatsAppAvailable: jest.fn(),
      getSupportedSchemes: jest.fn(),
    } as any;

    mockSettlementService = {
      formatSettlementForWhatsApp: jest.fn(),
    } as any;

    mockSettlement = {
      sessionId: 'test-session',
      playerSettlements: [
        {
          playerId: '1',
          playerName: 'Alice',
          totalBuyIns: 100,
          totalCashOuts: 150,
          netAmount: 50,
        },
        {
          playerId: '2',
          playerName: 'Bob',
          totalBuyIns: 100,
          totalCashOuts: 50,
          netAmount: -50,
        },
      ],
      paymentPlan: [
        {
          fromPlayerId: '2',
          fromPlayerName: 'Bob',
          toPlayerId: '1',
          toPlayerName: 'Alice',
          amount: 50,
        },
      ],
      isOptimized: true,
      totalTransactions: 2,
    };

    mockOnShareComplete = jest.fn();

    (WhatsAppService.getInstance as jest.Mock).mockReturnValue(mockWhatsAppService);
    (SettlementService.getInstance as jest.Mock).mockReturnValue(mockSettlementService);

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render share buttons correctly', () => {
      // Act
      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Assert
      expect(getByText('Share Results')).toBeTruthy();
      expect(getByText('📱 Share to WhatsApp')).toBeTruthy();
      expect(getByText('👀 Preview Message')).toBeTruthy();
      expect(getByText('📋 Copy')).toBeTruthy();
      expect(getByText('📤 Share')).toBeTruthy();
      expect(getByText('💬 SMS')).toBeTruthy();
      expect(getByText('📧 Email')).toBeTruthy();
    });
  });

  describe('Message Preview', () => {
    it('should show message preview when preview button is pressed', async () => {
      // Arrange
      const mockMessage = '🎯 Test Session - Results\n💰 Total Pot: $200.00\n\n👥 Player Summary:\n• Alice: $100 in → $150 out = +$50\n• Bob: $100 in → $50 out = -$50\n\n💸 Settlements:\n• Bob → Alice: $50.00\n\n📱 Shared via PokePot';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);

      const { getByText, queryByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Act
      await act(async () => {
        fireEvent.press(getByText('👀 Preview Message'));
      });

      // Assert
      await waitFor(() => {
        expect(queryByText('Message Preview:')).toBeTruthy();
        expect(queryByText(mockMessage)).toBeTruthy();
      });
      expect(mockSettlementService.formatSettlementForWhatsApp).toHaveBeenCalledWith(mockSettlement);
    });

    it('should handle preview generation error', async () => {
      // Arrange
      mockSettlementService.formatSettlementForWhatsApp.mockRejectedValue(new Error('Preview error'));
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Act
      await act(async () => {
        fireEvent.press(getByText('👀 Preview Message'));
      });

      // Assert
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to generate message preview');
      });
    });
  });

  describe('WhatsApp Sharing', () => {
    it('should share to WhatsApp successfully', async () => {
      // Arrange
      const mockMessage = 'Test settlement message';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: true,
        method: 'whatsapp',
      });
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Act
      await act(async () => {
        fireEvent.press(getByText('📱 Share to WhatsApp'));
      });

      // Assert
      await waitFor(() => {
        expect(mockWhatsAppService.shareToWhatsApp).toHaveBeenCalledWith(mockMessage);
        expect(mockAlert).toHaveBeenCalledWith('Success', 'WhatsApp opened with your message!');
        expect(mockOnShareComplete).toHaveBeenCalledWith({
          success: true,
          method: 'whatsapp',
        });
      });
    });

    it('should handle WhatsApp sharing with clipboard fallback', async () => {
      // Arrange
      const mockMessage = 'Test settlement message';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: true,
        method: 'clipboard',
      });
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Act
      await act(async () => {
        fireEvent.press(getByText('📱 Share to WhatsApp'));
      });

      // Assert
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Copied',
          'WhatsApp not available. Message copied to clipboard!'
        );
      });
    });

    it('should handle sharing failure', async () => {
      // Arrange
      const mockMessage = 'Test settlement message';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);
      mockWhatsAppService.shareToWhatsApp.mockResolvedValue({
        success: false,
        method: 'whatsapp',
        error: 'Sharing failed',
      });
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Act
      await act(async () => {
        fireEvent.press(getByText('📱 Share to WhatsApp'));
      });

      // Assert
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Sharing failed');
      });
    });
  });

  describe('Alternative Sharing Methods', () => {
    it('should copy to clipboard when copy button is pressed', async () => {
      // Arrange
      const mockMessage = 'Test settlement message';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);
      
      const mockClipboard = require('@react-native-clipboard/clipboard');
      mockClipboard.setString.mockResolvedValue();
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Generate message first
      await act(async () => {
        fireEvent.press(getByText('👀 Preview Message'));
      });

      // Act
      await act(async () => {
        fireEvent.press(getByText('📋 Copy'));
      });

      // Assert
      await waitFor(() => {
        expect(mockClipboard.setString).toHaveBeenCalledWith(mockMessage);
        expect(mockAlert).toHaveBeenCalledWith('Copied!', 'Settlement message copied to clipboard');
        expect(mockOnShareComplete).toHaveBeenCalledWith({
          success: true,
          method: 'clipboard',
        });
      });
    });

    it('should open native share sheet', async () => {
      // Arrange
      const mockMessage = 'Test settlement message';
      mockSettlementService.formatSettlementForWhatsApp.mockResolvedValue(mockMessage);
      
      const { Share } = require('react-native');
      Share.share.mockResolvedValue({ action: Share.sharedAction });
      const mockAlert = Alert.alert as jest.Mock;

      const { getByText } = render(
        <WhatsAppShare
          settlement={mockSettlement}
          sessionName="Test Session"
          onShareComplete={mockOnShareComplete}
        />
      );

      // Generate message first
      await act(async () => {
        fireEvent.press(getByText('👀 Preview Message'));
      });

      // Act
      await act(async () => {
        fireEvent.press(getByText('📤 Share'));
      });

      // Assert
      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith({
          message: mockMessage,
          title: 'Test Session - Poker Results',
        });
        expect(mockAlert).toHaveBeenCalledWith('Shared!', 'Message shared successfully');
      });
    });
  });
});