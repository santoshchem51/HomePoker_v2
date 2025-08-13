/**
 * QRCodeGenerator tests - Testing QR code display and generation functionality
 * Tests all acceptance criteria from Story 2.4
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { QRCodeGenerator } from '../../../../src/components/poker/QRCodeGenerator';
import { SessionUrlService } from '../../../../src/services/integration/SessionUrlService';
import { Session } from '../../../../src/types/session';
import { Player } from '../../../../src/types/player';

// Mock dependencies
jest.mock('../../../../src/services/integration/SessionUrlService');
jest.mock('react-native-qrcode-svg', () => ({
  __esModule: true,
  default: ({ value, size }: { value: string; size: number }) => {
    const MockQRCode = require('react-native').View;
    return <MockQRCode testID={`qr-code-${value.split('/').pop()}`} style={{ width: size, height: size }} />;
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('QRCodeGenerator', () => {
  let mockSessionUrlService: jest.Mocked<SessionUrlService>;

  const mockSession: Session = {
    id: 'session-123',
    name: 'Test Session',
    organizerId: 'organizer-123',
    status: 'active',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    startedAt: new Date('2025-01-01T10:05:00Z'),
    totalPot: 500,
    playerCount: 2
  };

  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      sessionId: 'session-123',
      name: 'Alice',
      isGuest: true,
      currentBalance: 50,
      totalBuyIns: 100,
      totalCashOuts: 50,
      status: 'active',
      joinedAt: new Date('2025-01-01T10:00:00Z')
    },
    {
      id: 'player-2',
      sessionId: 'session-123',
      name: 'Bob',
      isGuest: true,
      currentBalance: -25,
      totalBuyIns: 75,
      totalCashOuts: 0,
      status: 'active',
      joinedAt: new Date('2025-01-01T10:01:00Z')
    }
  ];

  const defaultProps = {
    session: mockSession,
    players: mockPlayers,
    visible: true,
    onClose: jest.fn(),
    onError: jest.fn()
  };

  beforeEach(() => {
    mockSessionUrlService = {
      generateSessionUrl: jest.fn(),
      generateWebUrl: jest.fn(),
      getSessionViewerCount: jest.fn(),
      cleanupSessionViewers: jest.fn(),
      cleanupStaleViewers: jest.fn(),
      getInstance: jest.fn()
    } as any;

    (SessionUrlService.getInstance as jest.Mock).mockReturnValue(mockSessionUrlService);
    jest.clearAllMocks();
  });

  // AC: 1 - QR code displays prominently on session screen with session URL
  describe('QR Code Display', () => {
    it('should display QR codes for all players when visible', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(2);

      const { getByText, getByTestId } = render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByTestId('qr-code-player-1')).toBeTruthy();
      });

      expect(mockSessionUrlService.generateSessionUrl).toHaveBeenCalledTimes(2);
      expect(getByText('Active Viewers: 2/10')).toBeTruthy();
    });

    it('should show loading state while generating QR codes', () => {
      mockSessionUrlService.generateSessionUrl.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      expect(getByText('Generating QR Codes...')).toBeTruthy();
    });

    it('should display session name in header', () => {
      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      expect(getByText('Test Session')).toBeTruthy();
    });
  });

  // AC: 1 - Add refresh functionality for new URLs
  describe('Refresh Functionality', () => {
    it('should refresh QR codes when refresh button is pressed', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(0);

      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('Refresh')).toBeTruthy();
      });

      fireEvent.press(getByText('Refresh'));

      await waitFor(() => {
        expect(getByText('Refreshing...')).toBeTruthy();
      });

      // Should call generate again
      expect(mockSessionUrlService.generateSessionUrl).toHaveBeenCalled();
    });
  });

  // AC: 6 - Maximum 10 concurrent viewers supported
  describe('Viewer Count Display', () => {
    it('should display current viewer count', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(7);

      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('Active Viewers: 7/10')).toBeTruthy();
      });
    });
  });

  // AC: 5 - Session URL expires when organizer ends session
  describe('Session Expiration', () => {
    it('should cleanup viewers when session ends', async () => {
      const completedSession = { ...mockSession, status: 'completed' as const };
      
      const { rerender } = render(<QRCodeGenerator {...defaultProps} />);

      // Update to completed session
      rerender(<QRCodeGenerator {...defaultProps} session={completedSession} />);

      await waitFor(() => {
        expect(mockSessionUrlService.cleanupSessionViewers).toHaveBeenCalledWith('session-123');
      });
    });

    it('should show expiration message in footer', () => {
      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      expect(getByText('QR codes expire when session ends')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should display error when QR generation fails', async () => {
      const mockError = new Error('QR generation failed');
      mockSessionUrlService.generateSessionUrl.mockRejectedValue(mockError);

      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('No QR codes available')).toBeTruthy();
      });

      expect(defaultProps.onError).toHaveBeenCalledWith('QR generation failed');
    });

    it('should show Alert when QR generation fails', async () => {
      const mockError = new Error('Network error');
      mockSessionUrlService.generateSessionUrl.mockRejectedValue(mockError);

      render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'QR Code Generation Error',
          'Network error'
        );
      });
    });
  });

  describe('URL Copying', () => {
    it('should show URL copy dialog when copy button is pressed', async () => {
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(0);

      const { getByText, getAllByText } = render(<QRCodeGenerator {...defaultProps} />);

      await waitFor(() => {
        expect(getByText('Alice')).toBeTruthy();
      });

      const copyButtons = getAllByText('Copy Share Link');
      fireEvent.press(copyButtons[0]);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Share URL',
        expect.stringContaining('URL for Alice:'),
        [{ text: 'OK' }]
      );
    });
  });

  describe('Modal Behavior', () => {
    it('should not render when not visible', () => {
      const { queryByText } = render(<QRCodeGenerator {...defaultProps} visible={false} />);

      expect(queryByText('QR Codes for Session')).toBeNull();
    });

    it('should call onClose when close button is pressed', () => {
      const { getByText } = render(<QRCodeGenerator {...defaultProps} />);

      fireEvent.press(getByText('Close'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no players', async () => {
      const { getByText } = render(<QRCodeGenerator {...defaultProps} players={[]} />);

      await waitFor(() => {
        expect(getByText('No QR codes available')).toBeTruthy();
        expect(getByText('Make sure the session is active and has players')).toBeTruthy();
      });
    });
  });

  describe('Periodic Updates', () => {
    it('should update viewer count periodically', async () => {
      jest.useFakeTimers();
      
      mockSessionUrlService.generateSessionUrl.mockResolvedValue({
        url: 'pokepot://session/session-123/player/player-1',
        sessionId: 'session-123',
        playerId: 'player-1',
        createdAt: new Date(),
        expiresWhenSessionEnds: true
      });
      mockSessionUrlService.generateWebUrl.mockReturnValue('https://pokepot.local/session/session-123/player/player-1');
      mockSessionUrlService.getSessionViewerCount.mockReturnValue(0);

      render(<QRCodeGenerator {...defaultProps} />);

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockSessionUrlService.cleanupStaleViewers).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });
});