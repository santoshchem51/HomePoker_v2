import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

interface VoiceErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ onRetry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface VoiceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const DefaultFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <View style={styles.fallbackContainer}>
    <Text style={styles.fallbackTitle}>Voice Feature Unavailable</Text>
    <Text style={styles.fallbackMessage}>
      There was an error with the voice recognition system.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryButtonText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

export class VoiceErrorBoundary extends React.Component<
  VoiceErrorBoundaryProps,
  VoiceErrorBoundaryState
> {
  constructor(props: VoiceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): VoiceErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('VoiceErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show alert for critical voice errors
    Alert.alert(
      'Voice Feature Error',
      'The voice recognition feature encountered an error. You can continue using the app with manual input.',
      [{ text: 'OK' }]
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallbackComponent || DefaultFallback;
      return <FallbackComponent onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallbackContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    margin: 16,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});