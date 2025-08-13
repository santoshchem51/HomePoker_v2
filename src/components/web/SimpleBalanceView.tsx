/**
 * SimpleBalanceView - Web wrapper component for mobile web view
 * Implements Story 2.4 requirements for mobile web balance display
 * 
 * Note: This component requires react-native-webview to be installed.
 * Uncomment the WebView implementation below for production use.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface SimpleBalanceViewProps {
  sessionId: string;
  playerId: string;
  onError?: (error: string) => void;
  onSessionExpired?: () => void;
}

export const SimpleBalanceView: React.FC<SimpleBalanceViewProps> = ({
  sessionId,
  playerId,
  onError: _onError,
  onSessionExpired: _onSessionExpired
}) => {
  // Generate web URL for the session and player
  const webUrl = `file://${require('../../../assets/web/player-balance.html')}?sessionId=${sessionId}&playerId=${playerId}`;

  // For development/demo purposes, show placeholder
  // In production, uncomment the WebView implementation below
  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderTitle}>Web View Component</Text>
        <Text style={styles.placeholderText}>
          This component would render the mobile web view at:
        </Text>
        <Text style={styles.placeholderUrl}>{webUrl}</Text>
        <Text style={styles.placeholderNote}>
          To use this component in production:
          1. Install: npm install react-native-webview
          2. Uncomment the WebView implementation below
          3. Set up a local web server or use bundled assets
        </Text>
      </View>
    </View>
  );

  // Production implementation (uncomment when react-native-webview is installed):
  /*
  import { WebView } from 'react-native-webview';
  
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'error':
          onError?.(message.error);
          break;
        case 'sessionExpired':
          onSessionExpired?.();
          break;
        case 'balanceUpdated':
          // Handle balance update notifications
          console.log('Balance updated:', message.balance);
          break;
        default:
          console.log('Unknown web view message:', message);
      }
    } catch (error) {
      console.warn('Failed to parse web view message:', error);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
    onError?.(`WebView failed to load: ${nativeEvent.description}`);
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webUrl }}
        style={styles.webView}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text>Loading balance view...</Text>
          </View>
        )}
        // Security settings
        allowsInlineMediaPlayback={false}
        mediaPlaybackRequiresUserAction={true}
        allowsFullscreenVideo={false}
        // iOS specific
        allowsLinkPreview={false}
        // Android specific
        mixedContentMode="never"
      />
    </View>
  );
  */
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderUrl: {
    fontSize: 12,
    color: '#0f3460',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#e8f4f8',
    borderRadius: 5,
  },
  placeholderNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
});