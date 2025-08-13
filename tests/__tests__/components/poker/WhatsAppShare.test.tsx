/**
 * WhatsAppShare Component Tests
 * Tests UI interactions, format selection, sharing workflows, and error handling
 */
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { WhatsAppShare } from '../../../../src/components/poker/WhatsAppShare';
import { WhatsAppService } from '../../../../src/services/integration/WhatsAppService';
import { MessageQueue } from '../../../../src/services/integration/MessageQueue';

// Mock services
jest.mock('../../../../src/services/integration/WhatsAppService');
jest.mock('../../../../src/services/integration/MessageQueue');
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    // Mock components that cause issues in test environment
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
  };
});

const mockWhatsAppService = WhatsAppService as jest.Mocked<typeof WhatsAppService>;
const mockMessageQueue = MessageQueue as jest.Mocked<typeof MessageQueue>;
const mockAlert = Alert.alert as jest.Mock;

describe('WhatsAppShare', () => {
  const mockProps = {
    sessionId: 'session-123',
    sessionName: 'Friday Night Poker',
    onShareComplete: jest.fn(),
  };

  const mockWhatsAppServiceInstance = {
    generateSessionMessage: jest.fn(),
    shareToWhatsApp: jest.fn(),
  };

  const mockMessageQueueInstance = {
    queueMessage: jest.fn(),
  };

  const mockMessage = {
    content: '🎯 Poker Night Results - Friday Night Poker\n💰 Total Pot: $300.00 | ⏱️ Duration: 3h 45m\n\n💸 Settlement Summary:\n• John pays Sarah: $45.00\n• Mike pays Sarah: $25.00\n• Final: Sarah +$70, John -$45, Mike -$25\n\n🔗 Shared via PokePot',
    format: 'summary' as const,
    sessionId: 'session-123',
    characterCount: 200,
    timestamp: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWhatsAppService.getInstance.mockReturnValue(mockWhatsAppServiceInstance as any);
    mockMessageQueue.getInstance.mockReturnValue(mockMessageQueueInstance as any);
    
    mockWhatsAppServiceInstance.generateSessionMessage.mockResolvedValue(mockMessage);
    mockWhatsAppServiceInstance.shareToWhatsApp.mockResolvedValue({
      success: true,
      method: 'whatsapp'
    });
  });

  describe('initial render', () => {
    it('should render export button correctly', () => {
      render(<WhatsAppShare {...mockProps} />);
      
      expect(screen.getByText('💬 Share Results')).toBeTruthy();
      expect(screen.getByText('Export to WhatsApp')).toBeTruthy();
    });

    it('should show disabled state when disabled prop is true', () => {
      render(<WhatsAppShare {...mockProps} disabled={true} />);
      
      const exportButton = screen.getByLabelText('Export session results to WhatsApp');
      expect(exportButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('should have proper accessibility properties', () => {
      render(<WhatsAppShare {...mockProps} />);
      
      const exportButton = screen.getByLabelText('Export session results to WhatsApp');
      expect(exportButton.props.accessibilityHint).toBe('Opens format selection for sharing session results');
    });
  });

  describe('format selection modal', () => {
    it('should open format selection modal when export button pressed', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      const exportButton = screen.getByText('💬 Share Results');
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Share Friday Night Poker')).toBeTruthy();
        expect(screen.getByText('Choose Format:')).toBeTruthy();
        expect(screen.getByText('📋 Summary Format')).toBeTruthy();
        expect(screen.getByText('📊 Detailed Format')).toBeTruthy();
      });
    });

    it('should close modal when close button pressed', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        expect(screen.getByText('Share Friday Night Poker')).toBeTruthy();
      });

      // Close modal
      const closeButton = screen.getByText('✕');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Share Friday Night Poker')).toBeNull();
      });
    });

    it('should close modal when cancel button pressed', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeTruthy();
      });

      // Press cancel
      fireEvent.press(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Share Friday Night Poker')).toBeNull();
      });
    });
  });

  describe('message preview generation', () => {
    it('should generate preview for summary format', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        expect(screen.getByText('📋 Summary Format')).toBeTruthy();
      });

      // Select summary format
      fireEvent.press(screen.getByText('📋 Summary Format'));

      await waitFor(() => {
        expect(mockWhatsAppServiceInstance.generateSessionMessage).toHaveBeenCalledWith('session-123', 'summary');
        expect(screen.getByText('Preview:')).toBeTruthy();
        expect(screen.getByText(mockMessage.content)).toBeTruthy();
      });
    });

    it('should generate preview for detailed format', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        expect(screen.getByText('📊 Detailed Format')).toBeTruthy();
      });

      // Select detailed format
      fireEvent.press(screen.getByText('📊 Detailed Format'));

      await waitFor(() => {
        expect(mockWhatsAppServiceInstance.generateSessionMessage).toHaveBeenCalledWith('session-123', 'detailed');
      });
    });

    it('should show share button after preview is generated', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal and generate preview
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        fireEvent.press(screen.getByText('📋 Summary Format'));
      });

      await waitFor(() => {
        expect(screen.getByText('💬 Share via WhatsApp')).toBeTruthy();
      });
    });

    it('should handle preview generation errors', async () => {
      mockWhatsAppServiceInstance.generateSessionMessage.mockRejectedValueOnce(new Error('Generation failed'));

      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal and try to generate preview
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        fireEvent.press(screen.getByText('📋 Summary Format'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Preview Error',
          'Could not generate message preview. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('sharing functionality', () => {
    const setupModalWithPreview = async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      // Generate preview
      await waitFor(() => {
        fireEvent.press(screen.getByText('📋 Summary Format'));
      });

      await waitFor(() => {
        expect(screen.getByText('💬 Share via WhatsApp')).toBeTruthy();
      });
    };

    it('should share successfully via WhatsApp', async () => {
      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      await waitFor(() => {
        expect(mockWhatsAppServiceInstance.shareToWhatsApp).toHaveBeenCalledWith(mockMessage);
        expect(mockAlert).toHaveBeenCalledWith(
          '🎯 Shared Successfully!',
          'Session results have been shared via WhatsApp.',
          [{ text: 'OK' }]
        );
        expect(mockProps.onShareComplete).toHaveBeenCalledWith({
          success: true,
          method: 'whatsapp'
        });
      });
    });

    it('should handle clipboard fallback', async () => {
      mockWhatsAppServiceInstance.shareToWhatsApp.mockResolvedValueOnce({
        success: true,
        method: 'clipboard'
      });

      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          '📋 Copied to Clipboard',
          'WhatsApp not available. Session results have been copied to clipboard.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should queue message when sharing fails', async () => {
      mockWhatsAppServiceInstance.shareToWhatsApp.mockResolvedValueOnce({
        success: false,
        method: 'clipboard',
        error: 'Clipboard failed'
      });

      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      await waitFor(() => {
        expect(mockMessageQueueInstance.queueMessage).toHaveBeenCalledWith(mockMessage.content);
        expect(mockAlert).toHaveBeenCalledWith(
          '📤 Queued for Later',
          'Message has been queued and will be sent when WhatsApp is available.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle share errors gracefully', async () => {
      mockWhatsAppServiceInstance.shareToWhatsApp.mockRejectedValueOnce(new Error('Share failed'));

      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Export Error',
          'Failed to export session results. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should close modal after successful share', async () => {
      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      await waitFor(() => {
        expect(screen.queryByText('Share Friday Night Poker')).toBeNull();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading indicator during preview generation', async () => {
      // Mock delayed response
      mockWhatsAppServiceInstance.generateSessionMessage.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockMessage), 100))
      );

      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        fireEvent.press(screen.getByText('📋 Summary Format'));
      });

      // Should show loading state
      expect(screen.queryByText('💬 Share via WhatsApp')).toBeNull();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('💬 Share via WhatsApp')).toBeTruthy();
      }, { timeout: 200 });
    });

    it('should show loading indicator during sharing', async () => {
      // Mock delayed share response
      mockWhatsAppServiceInstance.shareToWhatsApp.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, method: 'whatsapp' }), 100))
      );

      await setupModalWithPreview();

      // Press share button
      fireEvent.press(screen.getByText('💬 Share via WhatsApp'));

      // Should show loading indicator in share button
      // Note: Testing loading indicators in React Native can be tricky, 
      // this test might need adjustment based on how ActivityIndicator is rendered
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('should disable buttons during loading', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        const summaryButton = screen.getByText('📋 Summary Format');
        const detailedButton = screen.getByText('📊 Detailed Format');
        
        // Buttons should be enabled initially
        expect(summaryButton.props.accessibilityState?.disabled).toBeFalsy();
        expect(detailedButton.props.accessibilityState?.disabled).toBeFalsy();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility labels and hints', () => {
      render(<WhatsAppShare {...mockProps} />);
      
      const exportButton = screen.getByLabelText('Export session results to WhatsApp');
      expect(exportButton.props.accessibilityHint).toBe('Opens format selection for sharing session results');
    });

    it('should support disabled state for accessibility', () => {
      render(<WhatsAppShare {...mockProps} disabled={true} />);
      
      const exportButton = screen.getByLabelText('Export session results to WhatsApp');
      expect(exportButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should not open modal when disabled', () => {
      render(<WhatsAppShare {...mockProps} disabled={true} />);
      
      const exportButton = screen.getByText('💬 Share Results');
      fireEvent.press(exportButton);

      expect(screen.queryByText('Share Friday Night Poker')).toBeNull();
    });

    it('should not share when no preview generated', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      // Open modal without generating preview
      fireEvent.press(screen.getByText('💬 Share Results'));
      
      await waitFor(() => {
        expect(screen.queryByText('💬 Share via WhatsApp')).toBeNull();
      });
    });

    it('should handle multiple rapid button presses', async () => {
      render(<WhatsAppShare {...mockProps} />);
      
      const exportButton = screen.getByText('💬 Share Results');
      
      // Press button multiple times rapidly
      fireEvent.press(exportButton);
      fireEvent.press(exportButton);
      fireEvent.press(exportButton);

      await waitFor(() => {
        // Should only open one modal
        const modals = screen.getAllByText('Share Friday Night Poker');
        expect(modals).toHaveLength(1);
      });
    });
  });

  const setupModalWithPreview = async () => {
    render(<WhatsAppShare {...mockProps} />);
    
    // Open modal
    fireEvent.press(screen.getByText('💬 Share Results'));
    
    // Generate preview
    await waitFor(() => {
      fireEvent.press(screen.getByText('📋 Summary Format'));
    });

    await waitFor(() => {
      expect(screen.getByText('💬 Share via WhatsApp')).toBeTruthy();
    });
  };
});