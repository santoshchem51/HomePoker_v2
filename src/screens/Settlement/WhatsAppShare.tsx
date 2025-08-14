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
  Alert,
  Share,
  Linking,
  StyleSheet,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { WhatsAppService } from '../../services/integration/WhatsAppService';
import { SettlementService } from '../../services/settlement/SettlementService';
import { OptimizedSettlement } from '../../types/settlement';
import { ShareResult } from '../../types/whatsapp';

// Constants to avoid recreation on every render
const SHARE_BUTTON_TEXT = '📱 Share to WhatsApp';
const PREVIEW_BUTTON_TEXT = '👀 Preview Message';
const ALTERNATIVE_BUTTONS = [
  { key: 'copy', text: '📋 Copy' },
  { key: 'share', text: '📤 Share' },
  { key: 'sms', text: '💬 SMS' },
  { key: 'email', text: '📧 Email' },
] as const;

interface WhatsAppShareProps {
  settlement: OptimizedSettlement;
  sessionName: string;
  onShareComplete?: (result: ShareResult) => void;
}

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  settlement,
  sessionName,
  onShareComplete,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const whatsappService = WhatsAppService.getInstance();
  const settlementService = SettlementService.getInstance();

  // Generate and show message preview (AC: 6)
  const handleShowPreview = useCallback(async () => {
    try {
      const message = await settlementService.formatSettlementForWhatsApp(settlement);
      setPreviewMessage(message);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
      Alert.alert('Error', 'Failed to generate message preview');
    }
  }, [settlement, settlementService]);

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
          Alert.alert('Success', 'WhatsApp opened with your message!');
        } else if (result.method === 'clipboard') {
          Alert.alert('Copied', 'WhatsApp not available. Message copied to clipboard!');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to share message');
      }
      
      onShareComplete?.(result);
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      Alert.alert('Error', 'Failed to share to WhatsApp');
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
      Alert.alert('Copied!', 'Settlement message copied to clipboard');
      
      onShareComplete?.({
        success: true,
        method: 'clipboard'
      });
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      Alert.alert('Error', 'Failed to copy to clipboard');
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
        Alert.alert('Shared!', 'Message shared successfully');
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      }
    } catch (error) {
      console.error('Native share failed:', error);
      Alert.alert('Error', 'Failed to share message');
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
        Alert.alert('SMS', 'SMS app opened with your message');
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      } else {
        Alert.alert('Error', 'SMS not available on this device');
      }
    } catch (error) {
      console.error('SMS share failed:', error);
      Alert.alert('Error', 'Failed to open SMS');
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
        Alert.alert('Email', 'Email app opened with your message');
        onShareComplete?.({
          success: true,
          method: 'other'
        });
      } else {
        Alert.alert('Error', 'Email not available on this device');
      }
    } catch (error) {
      console.error('Email share failed:', error);
      Alert.alert('Error', 'Failed to open email');
    }
  }, [previewMessage, sessionName, onShareComplete, handleShowPreview]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Results</Text>
      
      {/* Primary WhatsApp Share Button (AC: 1) */}
      <TouchableOpacity
        style={[styles.primaryButton, isSharing && styles.disabled]}
        onPress={handleWhatsAppShare}
        disabled={isSharing}
      >
        <Text style={styles.primaryButtonText}>
          {SHARE_BUTTON_TEXT}
        </Text>
      </TouchableOpacity>

      {/* Preview Button */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleShowPreview}
      >
        <Text style={styles.secondaryButtonText}>
          👀 Preview Message
        </Text>
      </TouchableOpacity>

      {/* Message Preview (AC: 6) */}
      {showPreview && previewMessage && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Message Preview:</Text>
          <ScrollView style={styles.previewScroll}>
            <Text style={styles.previewText}>{previewMessage}</Text>
          </ScrollView>
        </View>
      )}

      {/* Alternative Sharing Options (AC: 7) */}
      <View style={styles.alternativeContainer}>
        <Text style={styles.alternativeTitle}>Alternative Sharing:</Text>
        
        <View style={styles.alternativeButtons}>
          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleCopyToClipboard}
          >
            <Text style={styles.alternativeButtonText}>📋 Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleNativeShare}
          >
            <Text style={styles.alternativeButtonText}>📤 Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleSMSShare}
          >
            <Text style={styles.alternativeButtonText}>💬 SMS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={handleEmailShare}
          >
            <Text style={styles.alternativeButtonText}>📧 Email</Text>
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewScroll: {
    maxHeight: 200,
  },
  previewText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'monospace',
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