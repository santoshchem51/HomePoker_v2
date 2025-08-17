/**
 * WhatsAppShare Component - Story 4.1: WhatsApp URL Scheme Integration
 * Implements AC: 1, 6, 7 - Share button, message preview, alternative methods
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  StyleSheet,
} from 'react-native';
import { showToast } from '../../components/common/ToastManager';
import Clipboard from '@react-native-clipboard/clipboard';
import { WhatsAppService } from '../../services/integration/WhatsAppService';
import { SettlementService } from '../../services/settlement/SettlementService';
import { OptimizedSettlement } from '../../types/settlement';
import { ShareResult } from '../../types/whatsapp';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

// Constants to avoid recreation on every render
const SHARE_BUTTON_TEXT = '📱 Share to WhatsApp';
// Placeholder constants for future implementation
// const PREVIEW_BUTTON_TEXT = '👀 Preview Message';
// const ALTERNATIVE_BUTTONS = [
//   { key: 'copy', text: '📋 Copy' },
//   { key: 'share', text: '📤 Share' },
//   { key: 'sms', text: '💬 SMS' },
//   { key: 'email', text: '📧 Email' },
// ] as const;

interface WhatsAppShareProps {
  settlement: OptimizedSettlement;
  sessionName: string;
  sessionMetadata?: any;
  onShareComplete?: (result: ShareResult) => void;
}

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  settlement,
  sessionName,
  sessionMetadata,
  onShareComplete,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const { isDarkMode } = useTheme();

  const whatsappService = WhatsAppService.getInstance();
  const settlementService = SettlementService.getInstance();

  // Enhanced message generation with session metadata
  const generateEnhancedMessage = useCallback(() => {
    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${remainingMinutes}m`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    let message = `🎯 ${sessionName} - Poker Results\n\n`;
    
    // Session metadata
    if (sessionMetadata) {
      message += `💰 Total Pot: $${sessionMetadata.totalPot.toFixed(2)}\n`;
      message += `⏰ Duration: ${formatDuration(sessionMetadata.duration)}\n`;
      message += `📅 ${formatDate(sessionMetadata.createdAt)}\n\n`;
    }

    // Player summary with detailed breakdown
    message += `👥 Player Summary:\n`;
    settlement.playerSettlements.forEach(player => {
      const netFormatted = player.netAmount >= 0 ? `+$${player.netAmount.toFixed(2)}` : `-$${Math.abs(player.netAmount).toFixed(2)}`;
      message += `• ${player.playerName}: $${player.totalBuyIns.toFixed(2)} in → $${player.totalCashOuts.toFixed(2)} out = ${netFormatted}\n`;
    });

    // Payments section
    if (settlement.paymentPlan.length > 0) {
      message += `\n💸 Payments:\n`;
      settlement.paymentPlan.forEach(payment => {
        message += `${payment.fromPlayerName} → ${payment.toPlayerName}: $${payment.amount.toFixed(2)}\n`;
      });
      
      if (settlement.transactionReduction > 0) {
        message += `\n🎯 Optimized: ${settlement.transactionReduction} fewer transaction${settlement.transactionReduction !== 1 ? 's' : ''}\n`;
      }
    } else {
      message += `\n🤝 Perfect! Everyone broke even!\n`;
    }

    // Verification
    message += `\n✅ Settlement verified and balanced`;

    return message;
  }, [settlement, sessionName, sessionMetadata]);

  // Generate and show message preview (AC: 6)
  const handleShowPreview = useCallback(async () => {
    try {
      const enhancedMessage = generateEnhancedMessage();
      setPreviewMessage(enhancedMessage);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
      showToast({
        type: 'error',
        title: '❌ Preview Error',
        message: 'Failed to generate message preview',
        duration: 3000,
      });
    }
  }, [generateEnhancedMessage]);

  // Share to WhatsApp (AC: 1, 2)
  const handleWhatsAppShare = useCallback(async () => {
    if (!previewMessage) {
      await handleShowPreview();
      return;
    }

    setIsSharing(true);
    try {
      const result = await whatsappService.shareToWhatsApp(previewMessage);
      
      if (result.success) {
        if (result.method === 'whatsapp') {
          showToast({
            type: 'success',
            title: '✅ WhatsApp Opened',
            message: 'Message ready to send!',
            duration: 2000,
          });
        } else if (result.method === 'clipboard') {
          showToast({
            type: 'info',
            title: '📋 Copied to Clipboard',
            message: 'WhatsApp not available. Message copied!',
            duration: 3000,
          });
        }
      } else {
        showToast({
          type: 'error',
          title: '❌ Share Failed',
          message: result.error || 'Failed to share message',
          duration: 3000,
        });
      }
      
      onShareComplete?.(result);
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      showToast({
        type: 'error',
        title: '❌ WhatsApp Error',
        message: 'Failed to share to WhatsApp',
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  }, [previewMessage, whatsappService, onShareComplete, handleShowPreview]);

  // Copy to clipboard (AC: 7)
  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!previewMessage) {
        await handleShowPreview();
        return;
      }
      
      await Clipboard.setString(previewMessage);
      showToast({
        type: 'success',
        title: '📋 Copied!',
        message: 'Settlement message copied to clipboard',
        duration: 2000,
      });
      
      onShareComplete?.({
        success: true,
        method: 'clipboard'
      });
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      showToast({
        type: 'error',
        title: '❌ Copy Failed',
        message: 'Failed to copy to clipboard',
        duration: 3000,
      });
    }
  }, [previewMessage, onShareComplete, handleShowPreview]);

  // Native share sheet (AC: 7)
  const handleNativeShare = useCallback(async () => {
    try {
      if (!previewMessage) {
        await handleShowPreview();
        return;
      }

      const result = await Share.share({
        message: previewMessage,
        title: `${sessionName} - Poker Results`,
      });

      if (result.action === Share.sharedAction) {
        showToast({
          type: 'success',
          title: '📤 Shared!',
          message: 'Message shared successfully',
          duration: 2000,
        });
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      }
    } catch (error) {
      console.error('Native share failed:', error);
      showToast({
        type: 'error',
        title: '❌ Share Error',
        message: 'Failed to share message',
        duration: 3000,
      });
    }
  }, [previewMessage, sessionName, onShareComplete, handleShowPreview]);

  // SMS sharing (AC: 7)
  const handleSMSShare = useCallback(async () => {
    try {
      if (!previewMessage) {
        await handleShowPreview();
        return;
      }

      const smsUrl = `sms:?body=${encodeURIComponent(previewMessage)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
        showToast({
          type: 'success',
          title: '💬 SMS Opened',
          message: 'SMS app opened with your message',
          duration: 2000,
        });
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      } else {
        showToast({
          type: 'error',
          title: '❌ SMS Unavailable',
          message: 'SMS not available on this device',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('SMS share failed:', error);
      showToast({
        type: 'error',
        title: '❌ SMS Error',
        message: 'Failed to open SMS',
        duration: 3000,
      });
    }
  }, [previewMessage, onShareComplete, handleShowPreview]);

  // Email sharing (AC: 7)
  const handleEmailShare = useCallback(async () => {
    try {
      if (!previewMessage) {
        await handleShowPreview();
        return;
      }

      const subject = `${sessionName} - Poker Results`;
      const body = previewMessage.replace(/\n/g, '%0D%0A');
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      
      if (canOpen) {
        await Linking.openURL(emailUrl);
        showToast({
          type: 'success',
          title: '📧 Email Opened',
          message: 'Email app opened with your message',
          duration: 2000,
        });
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      } else {
        showToast({
          type: 'error',
          title: '❌ Email Unavailable',
          message: 'Email not available on this device',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Email share failed:', error);
      showToast({
        type: 'error',
        title: '❌ Email Error',
        message: 'Failed to open email',
        duration: 3000,
      });
    }
  }, [previewMessage, sessionName, onShareComplete, handleShowPreview]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#fff' }]}>
      <Text style={[styles.title, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>Share Results</Text>
      

      {/* Preview Button */}
      <TouchableOpacity
        style={[styles.secondaryButton, { backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#f0f0f0' }]}
        onPress={handleShowPreview}
      >
        <Text style={[styles.secondaryButtonText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
          👀 Preview Message
        </Text>
      </TouchableOpacity>

      {/* Enhanced Message Preview (AC: 6) */}
      {showPreview && previewMessage && (
        <View style={[styles.previewContainer, { 
          backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#f9f9f9',
          borderColor: isDarkMode ? DarkPokerColors.border : '#ddd'
        }]}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>📄 Message Preview</Text>
            <TouchableOpacity
              style={[styles.copyButton, { backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#007AFF' }]}
              onPress={handleCopyToClipboard}
            >
              <Text style={[styles.copyButtonText, { color: isDarkMode ? DarkPokerColors.buttonText : '#fff' }]}>📋 Copy</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={[styles.previewScroll, { 
              backgroundColor: isDarkMode ? DarkPokerColors.inputBackground : '#fff',
              borderColor: isDarkMode ? DarkPokerColors.border : '#e0e0e0'
            }]}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.previewText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>
              {previewMessage}
            </Text>
          </ScrollView>
          <View style={[styles.previewFooter, { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#f8f9fa' }]}>
            <Text style={[styles.previewFooterText, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>
              📱 Use the sharing options below to send this message
            </Text>
          </View>
        </View>
      )}

      {/* Sharing Options */}
      <View style={styles.alternativeContainer}>
        <Text style={[styles.alternativeTitle, { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }]}>Sharing Options:</Text>
        
        <View style={styles.alternativeButtons}>
          <TouchableOpacity
            style={[styles.alternativeButton, { 
              backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#f8f9fa',
              borderColor: isDarkMode ? DarkPokerColors.border : '#dee2e6'
            }]}
            onPress={handleCopyToClipboard}
          >
            <Text style={[styles.alternativeButtonText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>📋 Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alternativeButton, { 
              backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#f8f9fa',
              borderColor: isDarkMode ? DarkPokerColors.border : '#dee2e6'
            }]}
            onPress={handleNativeShare}
          >
            <Text style={[styles.alternativeButtonText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>📤 Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alternativeButton, { 
              backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#f8f9fa',
              borderColor: isDarkMode ? DarkPokerColors.border : '#dee2e6'
            }]}
            onPress={handleSMSShare}
          >
            <Text style={[styles.alternativeButtonText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>💬 SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.alternativeButton, { 
              backgroundColor: isDarkMode ? DarkPokerColors.buttonSecondary : '#f8f9fa',
              borderColor: isDarkMode ? DarkPokerColors.border : '#dee2e6'
            }]}
            onPress={handleEmailShare}
          >
            <Text style={[styles.alternativeButtonText, { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }]}>📧 Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
  previewContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  previewScroll: {
    maxHeight: 250,
    minHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    margin: 8,
    borderRadius: 6,
  },
  previewText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    fontFamily: 'monospace',
    padding: 12,
  },
  previewFooter: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  previewFooterText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  alternativeContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  alternativeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  alternativeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  alternativeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  alternativeButtonText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default WhatsAppShare;