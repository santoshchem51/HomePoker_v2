import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SessionHistory } from '../../../../src/components/poker/SessionHistory';
import { SessionService } from '../../../../src/services/core/SessionService';
import { ExportService } from '../../../../src/services/infrastructure/ExportService';
import { NotificationService } from '../../../../src/services/infrastructure/NotificationService';

// Mock dependencies
jest.mock('../../../../src/services/core/SessionService');
jest.mock('../../../../src/services/infrastructure/ExportService');
jest.mock('../../../../src/services/infrastructure/NotificationService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('SessionHistory', () => {
  let mockSessionService: jest.Mocked<SessionService>;
  let mockExportService: jest.Mocked<ExportService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockAlert: jest.MockedFunction<typeof Alert.alert>;

  const mockSessions = [
    {
      id: 'session-1',
      name: 'Friday Night Poker',
      status: 'completed',
      total_pot: 500.00,
      player_count: 6,
      completed_at: '2025-01-01T22:00:00Z',
      cleanup_at: '2025-01-02T08:00:00Z',
      has_export: 1
    },
    {
      id: 'session-2',
      name: 'Weekend Tournament',
      status: 'completed',
      total_pot: 800.00,
      player_count: 8,
      completed_at: '2025-01-01T20:00:00Z',
      cleanup_at: '2025-01-02T06:00:00Z',
      has_export: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock SessionService
    mockSessionService = {
      getSessionHistory: jest.fn(),
      deleteSession: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    (SessionService.getInstance as jest.Mock).mockReturnValue(mockSessionService);
    
    // Mock ExportService
    mockExportService = {
      exportSession: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    (ExportService.getInstance as jest.Mock).mockReturnValue(mockExportService);
    
    // Mock NotificationService
    mockNotificationService = {
      confirmAction: jest.fn(),
      showImmediateAlert: jest.fn(),
      getInstance: jest.fn(),
    } as any;
    (NotificationService.getInstance as jest.Mock).mockReturnValue(mockNotificationService);
    
    // Mock Alert
    mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      mockSessionService.getSessionHistory.mockReturnValue(new Promise(() => {})); // Never resolves
      
      const { getByText } = render(<SessionHistory />);
      
      expect(getByText('Loading session history...')).toBeTruthy();
    });

    it('should render empty state when no sessions', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue([]);
      
      const { getByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        expect(getByText('No completed sessions found')).toBeTruthy();
        expect(getByText('Completed sessions will appear here for 30 days')).toBeTruthy();
      });
    });

    it('should render session list when sessions exist', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        expect(getByText('Friday Night Poker')).toBeTruthy();
        expect(getByText('Weekend Tournament')).toBeTruthy();
        expect(getByText('$500.00')).toBeTruthy();
        expect(getByText('$800.00')).toBeTruthy();
        expect(getByText('6 players')).toBeTruthy();
        expect(getByText('8 players')).toBeTruthy();
      });
    });

    it('should show export status for exported sessions', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const exportedTexts = getAllByText('✓ Exported');
        expect(exportedTexts).toHaveLength(1); // Only session-1 has export
      });
    });

    it('should display cleanup time correctly', async () => {
      // Mock current time to be 7 hours before cleanup
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-02T01:00:00Z'));
      
      mockSessionService.getSessionHistory.mockResolvedValue([mockSessions[1]]);
      
      const { getByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        expect(getByText('5h 0m remaining')).toBeTruthy();
      });
      
      jest.useRealTimers();
    });
  });

  describe('session interaction', () => {
    it('should call onSessionSelect when session is pressed', async () => {
      const mockOnSessionSelect = jest.fn();
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getByText } = render(
        <SessionHistory onSessionSelect={mockOnSessionSelect} />
      );
      
      await waitFor(() => {
        fireEvent.press(getByText('Friday Night Poker'));
      });
      
      expect(mockOnSessionSelect).toHaveBeenCalledWith('session-1');
    });

    it('should refresh sessions on pull to refresh', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getByTestId } = render(<SessionHistory />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockSessionService.getSessionHistory).toHaveBeenCalledTimes(1);
      });
      
      // Simulate pull to refresh
      const flatList = getByTestId('session-flatlist') || { props: { refreshControl: { props: { onRefresh: jest.fn() } } } };
      if (flatList.props?.refreshControl?.props?.onRefresh) {
        flatList.props.refreshControl.props.onRefresh();
      }
      
      await waitFor(() => {
        expect(mockSessionService.getSessionHistory).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('session deletion', () => {
    it('should show confirmation dialog before deletion', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockNotificationService.confirmAction.mockResolvedValue(false); // User cancels
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[0]);
      });
      
      expect(mockNotificationService.confirmAction).toHaveBeenCalledWith(
        'Delete Session',
        'Are you sure you want to permanently delete "Friday Night Poker"? This action cannot be undone.'
      );
      expect(mockSessionService.deleteSession).not.toHaveBeenCalled();
    });

    it('should delete session when confirmed', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockNotificationService.confirmAction.mockResolvedValue(true); // User confirms
      mockSessionService.deleteSession.mockResolvedValue();
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockSessionService.deleteSession).toHaveBeenCalledWith('session-1');
        expect(mockNotificationService.showImmediateAlert).toHaveBeenCalledWith(
          'Session Deleted',
          'Session has been permanently removed.'
        );
      });
    });

    it('should handle deletion errors', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockNotificationService.confirmAction.mockResolvedValue(true);
      mockSessionService.deleteSession.mockRejectedValue(new Error('Delete failed'));
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to delete session');
      });
    });
  });

  describe('session export', () => {
    it('should show export format selection dialog', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const exportButtons = getAllByText('Export');
        fireEvent.press(exportButtons[0]);
      });
      
      expect(mockAlert).toHaveBeenCalledWith(
        'Export Session',
        'Choose export format:',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'JSON' }),
          expect.objectContaining({ text: 'CSV' }),
          expect.objectContaining({ text: 'WhatsApp' })
        ])
      );
    });

    it('should export session in selected format', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockExportService.exportSession.mockResolvedValue({
        filePath: '/path/to/export.json',
        format: 'json',
        fileSize: 1024,
        checksum: 'abc123'
      });
      
      // Mock Alert to automatically select JSON format
      mockAlert.mockImplementation((title, message, buttons) => {
        if (title === 'Export Session' && buttons) {
          const jsonButton = buttons.find(b => b.text === 'JSON');
          if (jsonButton && jsonButton.onPress) {
            jsonButton.onPress();
          }
        }
      });
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const exportButtons = getAllByText('Export');
        fireEvent.press(exportButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockExportService.exportSession).toHaveBeenCalledWith('session-1', 'json');
        expect(mockNotificationService.showImmediateAlert).toHaveBeenCalledWith(
          'Export Complete',
          expect.stringContaining('Session exported successfully as JSON')
        );
      });
    });

    it('should show export progress during export', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockExportService.exportSession.mockReturnValue(
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      mockAlert.mockImplementation((title, message, buttons) => {
        if (title === 'Export Session' && buttons) {
          const jsonButton = buttons.find(b => b.text === 'JSON');
          if (jsonButton && jsonButton.onPress) {
            jsonButton.onPress();
          }
        }
      });
      
      const { getAllByText, getByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const exportButtons = getAllByText('Export');
        fireEvent.press(exportButtons[0]);
      });
      
      // Should show "Exporting..." text
      expect(getByText('Exporting...')).toBeTruthy();
    });

    it('should handle export errors', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockExportService.exportSession.mockRejectedValue(new Error('Export failed'));
      
      mockAlert.mockImplementation((title, message, buttons) => {
        if (title === 'Export Session' && buttons) {
          const jsonButton = buttons.find(b => b.text === 'JSON');
          if (jsonButton && jsonButton.onPress) {
            jsonButton.onPress();
          }
        }
      });
      
      const { getAllByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        const exportButtons = getAllByText('Export');
        fireEvent.press(exportButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Export Failed', 'Failed to export session data');
      });
    });

    it('should call onExportComplete when export succeeds', async () => {
      const mockOnExportComplete = jest.fn();
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      mockExportService.exportSession.mockResolvedValue({
        filePath: '/path/to/export.json',
        format: 'json',
        fileSize: 1024,
        checksum: 'abc123'
      });
      
      mockAlert.mockImplementation((title, message, buttons) => {
        if (title === 'Export Session' && buttons) {
          const jsonButton = buttons.find(b => b.text === 'JSON');
          if (jsonButton && jsonButton.onPress) {
            jsonButton.onPress();
          }
        }
      });
      
      const { getAllByText } = render(
        <SessionHistory onExportComplete={mockOnExportComplete} />
      );
      
      await waitFor(() => {
        const exportButtons = getAllByText('Export');
        fireEvent.press(exportButtons[0]);
      });
      
      await waitFor(() => {
        expect(mockOnExportComplete).toHaveBeenCalledWith('session-1', 'json');
      });
    });
  });

  describe('error handling', () => {
    it('should handle session history loading errors', async () => {
      mockSessionService.getSessionHistory.mockRejectedValue(new Error('Load failed'));
      
      render(<SessionHistory />);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to load session history');
      });
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly', async () => {
      const sessionWithDate = {
        ...mockSessions[0],
        completed_at: '2025-01-15T14:30:00Z'
      };
      
      mockSessionService.getSessionHistory.mockResolvedValue([sessionWithDate]);
      
      const { getByText } = render(<SessionHistory />);
      
      await waitFor(() => {
        // Should show formatted date and time
        expect(getByText(/1\/15\/2025.*2:30 PM/)).toBeTruthy();
      });
    });
  });

  describe('accessibility', () => {
    it('should be accessible', async () => {
      mockSessionService.getSessionHistory.mockResolvedValue(mockSessions);
      
      const { getByRole } = render(<SessionHistory />);
      
      await waitFor(() => {
        // Should have accessible buttons
        expect(getByRole('button', { name: /Export/i })).toBeTruthy();
        expect(getByRole('button', { name: /Delete/i })).toBeTruthy();
      });
    });
  });
});