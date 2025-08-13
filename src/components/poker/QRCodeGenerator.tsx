/**
 * QRCodeGenerator - Component for displaying QR codes for session joining
 * Implements Story 2.4 requirements for QR code generation and display
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  StyleSheet,
  ScrollView
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SessionUrlService } from '../../services/integration/SessionUrlService';
import { Session } from '../../types/session';
import { Player } from '../../types/player';
import { ServiceError } from '../../services/core/ServiceError';
import { ErrorBoundary } from '../common/ErrorBoundary';

export interface QRCodeGeneratorProps {
  session: Session;
  players: Player[];
  visible: boolean;
  onClose: () => void;
  onError?: (error: string) => void;
}

export interface QRCodeData {
  playerId: string;
  playerName: string;
  qrValue: string;
  webUrl: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = React.memo(({
  session,
  players,
  visible,
  onClose,
  onError
}) => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const sessionUrlService = useMemo(() => SessionUrlService.getInstance(), []);
  const screenWidth = Dimensions.get('window').width;
  const qrSize = useMemo(() => Math.min(screenWidth * 0.7, 200), [screenWidth]); // 200x200pt for optimal scanning

  /**
   * Generate QR codes for all players in the session
   * AC: 1 - QR code displays prominently on session screen with session URL
   */
  const generateQRCodes = useCallback(async () => {
    try {
      setLoading(true);
      const codes: QRCodeData[] = [];

      for (const player of players) {
        try {
          await sessionUrlService.generateSessionUrl(session.id, player.id);
          const webUrl = sessionUrlService.generateWebUrl(session.id, player.id);
          
          codes.push({
            playerId: player.id,
            playerName: player.name,
            qrValue: webUrl, // Use web URL for QR code scanning
            webUrl: webUrl
          });
        } catch (error) {
          console.warn(`Failed to generate QR code for player ${player.name}:`, error);
        }
      }

      setQrCodes(codes);
      const count = sessionUrlService.getSessionViewerCount(session.id);
      setViewerCount(count);
    } catch (error) {
      const errorMessage = error instanceof ServiceError 
        ? error.message 
        : 'Failed to generate QR codes';
      onError?.(errorMessage);
      Alert.alert('QR Code Generation Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session.id, players, sessionUrlService, onError]);

  /**
   * Refresh QR codes and viewer count
   * AC: 1 - Add refresh functionality for new URLs
   */
  const refreshQRCodes = async () => {
    try {
      setRefreshing(true);
      await generateQRCodes();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Update current viewer count
   * AC: 6 - Maximum 10 concurrent viewers supported
   */
  const updateViewerCount = useCallback(() => {
    const count = sessionUrlService.getSessionViewerCount(session.id);
    setViewerCount(count);
  }, [sessionUrlService, session.id]);

  /**
   * Handle session end cleanup
   * AC: 5 - Session URL expires when organizer ends session
   */
  const handleSessionEnd = useCallback(async () => {
    try {
      await sessionUrlService.cleanupSessionViewers(session.id);
      setQrCodes([]);
      setViewerCount(0);
      onClose();
    } catch (error) {
      console.warn('Failed to cleanup session viewers:', error);
    }
  }, [sessionUrlService, session.id, onClose]);

  /**
   * Copy web URL to clipboard for manual sharing
   */
  const handleCopyUrl = useCallback((webUrl: string, playerName: string) => {
    // Note: In a real implementation, we'd use @react-native-clipboard/clipboard
    Alert.alert(
      'Share URL', 
      `URL for ${playerName}:\n${webUrl}\n\nThis can be shared manually as a fallback.`,
      [
        { text: 'OK' }
      ]
    );
  }, []);

  // Generate QR codes when component becomes visible
  useEffect(() => {
    if (visible && session.status === 'active') {
      generateQRCodes();
    }
  }, [visible, session.status, generateQRCodes]);

  // Update viewer count periodically
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      updateViewerCount();
      // Cleanup stale viewers
      sessionUrlService.cleanupStaleViewers();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [visible, updateViewerCount, sessionUrlService]);

  // Handle session status changes
  useEffect(() => {
    if (session.status === 'completed') {
      handleSessionEnd();
    }
  }, [session.status, handleSessionEnd]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ErrorBoundary
        onError={(error) => {
          console.error('QR Code Generator Error:', error);
          onError?.(`QR code generation failed: ${error.message}`);
        }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>QR Codes for Session</Text>
            <Text style={styles.sessionName}>{session.name}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                Active Viewers: {viewerCount}/10
              </Text>
              <TouchableOpacity 
                onPress={refreshQRCodes} 
                disabled={refreshing}
                style={styles.refreshButton}
              >
                <Text style={styles.refreshButtonText}>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating QR Codes...</Text>
            </View>
          ) : qrCodes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No QR codes available</Text>
              <Text style={styles.emptySubtext}>
                Make sure the session is active and has players
              </Text>
            </View>
          ) : (
            qrCodes.map((qrData) => (
              <View key={qrData.playerId} style={styles.qrCodeContainer}>
                <Text style={styles.playerName}>{qrData.playerName}</Text>
                
                <View style={styles.qrCodeWrapper}>
                  <QRCode
                    value={qrData.qrValue}
                    size={qrSize}
                    backgroundColor="white"
                    color="#0f3460"
                    logoBackgroundColor="transparent"
                    enableLinearGradient={false}
                    ecl="H" // High error correction for reliable scanning
                  />
                </View>

                <Text style={styles.instructionText}>
                  Player can scan this code to view their balance
                </Text>

                <TouchableOpacity
                  onPress={() => handleCopyUrl(qrData.webUrl, qrData.playerName)}
                  style={styles.copyButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy share link for ${qrData.playerName}`}
                >
                  <Text style={styles.copyButtonText}>Copy Share Link</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              QR codes expire when session ends
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ErrorBoundary>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0f3460',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  sessionName: {
    fontSize: 16,
    color: '#a8c8e6',
    textAlign: 'center',
    marginTop: 5,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  statusText: {
    fontSize: 14,
    color: '#a8c8e6',
  },
  refreshButton: {
    backgroundColor: '#1e5f8b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 15,
  },
  qrCodeWrapper: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  copyButtonText: {
    color: '#0f3460',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});