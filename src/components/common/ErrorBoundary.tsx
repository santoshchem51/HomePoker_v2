/**
 * ErrorBoundary - React error boundary for graceful error handling
 * Implements QA requirement for error boundary implementation
 */
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ConfirmationDialog } from './ConfirmationDialog';
import { ServiceError, ErrorCode } from '../../types/errors';
import { ValidationCode } from '../../types/validation';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
  useModal?: boolean; // Use modal display instead of full-screen
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error to the console and call onError callback if provided
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleDismiss = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private getUserFriendlyErrorInfo = (error: Error): { title: string; message: string; showRetry: boolean } => {
    // NOTE: With the new ValidationResult architecture, most validation errors should 
    // no longer reach this error boundary. This primarily handles system errors now.
    
    // Handle ServiceError with specific error codes
    if (error instanceof ServiceError) {
      switch (error.code) {
        case ErrorCode.DATABASE_CONNECTION_FAILED:
        case ErrorCode.DATABASE_QUERY_FAILED:
        case ErrorCode.DATABASE_TRANSACTION_FAILED:
          return {
            title: '💾 Database Error',
            message: 'Error accessing app data. Please restart the app and try again.',
            showRetry: true
          };
          
        case ErrorCode.SESSION_NOT_FOUND:
          return {
            title: '🎮 Session Not Found',
            message: 'The poker session could not be found. It may have been deleted or completed.',
            showRetry: false
          };
          
        case ErrorCode.PLAYER_NOT_FOUND:
          return {
            title: '👤 Player Not Found',
            message: 'The player could not be found in this session.',
            showRetry: false
          };
          
        case ErrorCode.VALIDATION_ERROR:
          return {
            title: '⚠️ Validation Error',
            message: error.message,
            showRetry: false
          };
          
        case ErrorCode.INSUFFICIENT_SESSION_POT:
        case ErrorCode.LAST_PLAYER_EXACT_AMOUNT_REQUIRED:
          return {
            title: '💰 Transaction Error',
            message: error.message,
            showRetry: false
          };
          
        default:
          return {
            title: '⚠️ Service Error',
            message: error.message,
            showRetry: true
          };
      }
    }
    
    // Handle common JavaScript errors
    const errorMessage = error.message || 'An unexpected error occurred';
    
    if (errorMessage.includes('Cannot read property') || errorMessage.includes('Cannot read properties')) {
      return {
        title: '⚠️ App Error',
        message: 'Something went wrong while loading the app. Please try again.',
        showRetry: true
      };
    }
    
    if (errorMessage.includes('Network request failed')) {
      return {
        title: '🌐 Network Error',
        message: 'Network connection error. Please check your internet connection and try again.',
        showRetry: true
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return {
        title: '⏱️ Timeout Error',
        message: 'The operation took too long. Please try again.',
        showRetry: true
      };
    }
    
    if (errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('sqlite')) {
      return {
        title: '💾 Database Error',
        message: 'Error accessing app data. Please restart the app.',
        showRetry: true
      };
    }
    
    return {
      title: '⚠️ Unexpected Error',
      message: errorMessage,
      showRetry: true
    };
  };

  render() {
    if (this.state.hasError) {
      // Use modal display by default for better UX
      if (this.props.useModal !== false) {
        const errorInfo = this.getUserFriendlyErrorInfo(this.state.error!);

        return (
          <>
            {this.props.children}
            <ConfirmationDialog
              visible={true}
              title={errorInfo.title}
              message={errorInfo.message}
              confirmText={errorInfo.showRetry ? "Try Again" : "OK"}
              cancelText={errorInfo.showRetry ? "Close" : undefined}
              confirmStyle="default"
              onConfirm={this.handleRetry}
              onCancel={this.handleDismiss}
            />
          </>
        );
      }

      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI (full-screen replacement)
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity 
              onPress={this.handleRetry} 
              style={styles.retryButton}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 320,
    width: '100%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});