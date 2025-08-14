/**
 * Responsive Suspense Boundary
 * Provides React.Suspense boundaries for database-dependent components with loading states
 */

import React, { Suspense, ReactNode } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { sessionSelectors } from '../../stores/sessionStore';

interface ResponsiveSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  operationName?: string;
  showOptimisticIndicator?: boolean;
}

/**
 * Loading fallback component with responsive indicators
 */
const ResponsiveLoadingFallback: React.FC<{
  operationName?: string;
  showOptimistic?: boolean;
}> = ({ operationName = 'operation', showOptimistic = false }) => {
  const hasOptimisticUpdates = sessionSelectors.useHasOptimisticUpdates();
  
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.loadingText}>
        Loading {operationName}...
      </Text>
      {showOptimistic && hasOptimisticUpdates && (
        <Text style={styles.optimisticText}>
          ⚡ Updates applied optimistically
        </Text>
      )}
    </View>
  );
};

/**
 * Responsive Suspense Boundary Component
 */
export const ResponsiveSuspense: React.FC<ResponsiveSuspenseProps> = ({
  children,
  fallback,
  operationName,
  showOptimisticIndicator = false,
}) => {
  const defaultFallback = (
    <ResponsiveLoadingFallback 
      operationName={operationName} 
      showOptimistic={showOptimisticIndicator}
    />
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

/**
 * Operation-specific loading indicator
 */
export const OperationLoadingIndicator: React.FC<{
  operationId: string;
  message?: string;
}> = ({ operationId, message }) => {
  const isLoading = sessionSelectors.useOperationLoading(operationId);
  
  if (!isLoading) return null;
  
  return (
    <View style={styles.operationIndicator}>
      <ActivityIndicator size="small" color="#1976D2" />
      <Text style={styles.operationText}>
        {message || 'Processing...'}
      </Text>
    </View>
  );
};

/**
 * Global loading overlay for multiple operations
 */
export const GlobalLoadingOverlay: React.FC = () => {
  const isAnyLoading = sessionSelectors.useIsAnyOperationLoading();
  const hasOptimistic = sessionSelectors.useHasOptimisticUpdates();
  
  if (!isAnyLoading && !hasOptimistic) return null;
  
  return (
    <View style={styles.overlay}>
      <View style={styles.overlayContent}>
        {isAnyLoading && (
          <>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={styles.overlayText}>Processing...</Text>
          </>
        )}
        {hasOptimistic && !isAnyLoading && (
          <Text style={styles.optimisticOverlayText}>
            ⚡ Updates syncing...
          </Text>
        )}
      </View>
    </View>
  );
};

/**
 * Responsive transaction list with optimistic update indicators
 */
export const ResponsiveTransactionIndicator: React.FC<{
  transactionId: string;
}> = ({ transactionId }) => {
  const optimisticUpdates = sessionSelectors.useOptimisticUpdates();
  const isOptimistic = optimisticUpdates[transactionId];
  
  if (!isOptimistic) return null;
  
  return (
    <View style={styles.optimisticBadge}>
      <Text style={styles.optimisticBadgeText}>Syncing</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  
  optimisticText: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  operationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    marginVertical: 4,
  },
  
  operationText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  overlayContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  
  overlayText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  
  optimisticOverlayText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  optimisticBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  
  optimisticBadgeText: {
    fontSize: 10,
    color: '#F57C00',
    fontWeight: '600',
  },
});