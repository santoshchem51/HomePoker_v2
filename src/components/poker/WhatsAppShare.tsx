/**
 * WhatsAppShare - Component for exporting and sharing session results via WhatsApp
 * Implements Story 1.6 AC: 4 - Export button on session completion screen
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { WhatsAppService } from '../../services/integration/WhatsAppService';
import { MessageQueue } from '../../services/integration/MessageQueue';
import { MessageFormat, ShareResult } from '../../types/whatsapp';

export interface WhatsAppShareProps {
  sessionId: string;
  sessionName: string;
  disabled?: boolean;
  onShareComplete?: (result: ShareResult) => void;
}

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  sessionId,
  sessionName,
  disabled = false,
  onShareComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFormatSelector, setShowFormatSelector] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<MessageFormat>('summary');
  
  const whatsAppService = WhatsAppService.getInstance();
  const messageQueue = MessageQueue.getInstance();

  /**
   * Handle export button press - show format selection
   * AC: 4
   */
  const handleExportPress = useCallback(() => {
    if (disabled || isLoading) return;
    setShowFormatSelector(true);
  }, [disabled, isLoading]);

  /**
   * Generate message preview for selected format
   * AC: 4, 7
   */
  const generatePreview = useCallback(async (format: MessageFormat) => {
    try {
      setIsLoading(true);
      const message = await whatsAppService.generateSessionMessage(sessionId, format);
      setPreviewMessage(message.content);
      setSelectedFormat(format);
    } catch (error) {
      Alert.alert(
        'Preview Error',
        'Could not generate message preview. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Preview generation error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, whatsAppService]);

  /**
   * Handle sharing with selected format
   * AC: 1, 3, 5, 6
   */
  const handleShare = useCallback(async (format: MessageFormat) => {
    try {
      setIsLoading(true);
      
      // Generate formatted message
      const message = await whatsAppService.generateSessionMessage(sessionId, format);
      
      // Attempt to share via WhatsApp
      const result = await whatsAppService.shareToWhatsApp(message);
      
      // Handle result
      if (result.success) {
        if (result.method === 'whatsapp') {
          Alert.alert(
            '🎯 Shared Successfully!',
            'Session results have been shared via WhatsApp.',
            [{ text: 'OK' }]
          );
        } else if (result.method === 'clipboard') {
          Alert.alert(
            '📋 Copied to Clipboard',
            'WhatsApp not available. Session results have been copied to clipboard.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Queue message for later if sharing failed
        if (result.method === 'clipboard' && result.error) {
          await messageQueue.queueMessage(message.content);
          Alert.alert(
            '📤 Queued for Later',
            'Message has been queued and will be sent when WhatsApp is available.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Share Failed',
            result.error || 'Could not share message. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
      setShowFormatSelector(false);
      onShareComplete?.(result);
      
    } catch (error) {
      Alert.alert(
        'Export Error',
        'Failed to export session results. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Share error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, whatsAppService, messageQueue, onShareComplete]);

  /**
   * Format selector modal content
   */
  const renderFormatSelector = () => (
    <Modal
      visible={showFormatSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFormatSelector(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Share {sessionName}</Text>
          <TouchableOpacity
            onPress={() => setShowFormatSelector(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.sectionTitle}>Choose Format:</Text>
          
          {/* Summary Format Option */}
          <TouchableOpacity
            style={[
              styles.formatOption,
              selectedFormat === 'summary' && styles.selectedFormat
            ]}
            onPress={() => generatePreview('summary')}
            disabled={isLoading}
          >
            <View style={styles.formatHeader}>
              <Text style={styles.formatTitle}>📋 Summary Format</Text>
              <Text style={styles.formatDescription}>
                Compact view with final settlements only
              </Text>
            </View>
          </TouchableOpacity>

          {/* Detailed Format Option */}
          <TouchableOpacity
            style={[
              styles.formatOption,
              selectedFormat === 'detailed' && styles.selectedFormat
            ]}
            onPress={() => generatePreview('detailed')}
            disabled={isLoading}
          >
            <View style={styles.formatHeader}>
              <Text style={styles.formatTitle}>📊 Detailed Format</Text>
              <Text style={styles.formatDescription}>
                Full breakdown with buy-ins, cash-outs, and settlements
              </Text>
            </View>
          </TouchableOpacity>

          {/* Preview Section */}
          {previewMessage && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview:</Text>
              <View style={styles.previewContainer}>
                <ScrollView style={styles.previewScroll}>
                  <Text style={styles.previewText}>{previewMessage}</Text>
                </ScrollView>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.modalActions}>
          {previewMessage && (
            <TouchableOpacity
              style={[styles.shareButton, isLoading && styles.disabledButton]}
              onPress={() => handleShare(selectedFormat)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.shareButtonText}>
                  💬 Share via WhatsApp
                </Text>
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowFormatSelector(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.exportButton,
          (disabled || isLoading) && styles.disabledButton
        ]}
        onPress={handleExportPress}
        disabled={disabled || isLoading}
        accessibilityLabel="Export session results to WhatsApp"
        accessibilityHint="Opens format selection for sharing session results"
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text style={styles.exportButtonText}>💬 Share Results</Text>
            <Text style={styles.exportButtonSubtext}>Export to WhatsApp</Text>
          </>
        )}
      </TouchableOpacity>

      {renderFormatSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  exportButton: {
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88, // Accessibility touch target
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportButtonSubtext: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  formatOption: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  selectedFormat: {
    borderColor: '#25D366',
    backgroundColor: '#f8fff8',
  },
  formatHeader: {
    alignItems: 'flex-start',
  },
  formatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewSection: {
    marginTop: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  previewContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 200,
  },
  previewScroll: {
    maxHeight: 200,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    padding: 16,
    fontFamily: 'monospace', // Better for formatted text
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#25D366',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});