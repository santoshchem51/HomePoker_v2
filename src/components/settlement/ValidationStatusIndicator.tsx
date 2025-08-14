/**
 * Validation Status Indicator Component - Epic 3: Settlement Optimization
 * Story 3.3: Settlement Validation and Verification - Task 5
 * 
 * React Native component for displaying validation status indicators throughout settlement UI
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { 
  SettlementValidation, 
  ValidationErrorCode,
  WarningClassification 
} from '../../types/settlement';

interface ValidationStatusIndicatorProps {
  validationResults?: SettlementValidation | null;
  isValidating?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const ValidationStatusIndicator: React.FC<ValidationStatusIndicatorProps> = ({
  validationResults,
  isValidating = false,
  showDetails = false,
  size = 'medium',
  onPress,
  accessibilityLabel,
}) => {
  // Get validation status
  const validationStatus = useMemo(() => {
    if (isValidating) return 'validating';
    if (!validationResults) return 'pending';
    if (validationResults.isValid) return 'valid';
    
    const hasCriticalErrors = validationResults.errors.some(
      error => error.severity === 'critical'
    );
    if (hasCriticalErrors) return 'critical';
    
    const hasErrors = validationResults.errors.length > 0;
    if (hasErrors) return 'error';
    
    const hasWarnings = validationResults.warnings.length > 0;
    if (hasWarnings) return 'warning';
    
    return 'valid';
  }, [validationResults, isValidating]);

  // Get status color
  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F57C00';
      case 'critical': return '#F44336';
      case 'validating': return '#1976D2';
      case 'pending': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return '✓';
      case 'warning': return '⚠';
      case 'error': return '!';
      case 'critical': return '✗';
      case 'validating': return '⏳';
      case 'pending': return '○';
      default: return '?';
    }
  }, []);

  // Get status text
  const getStatusText = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'warning': return 'Warnings';
      case 'error': return 'Errors';
      case 'critical': return 'Critical';
      case 'validating': return 'Validating';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  }, []);

  // Get size styles
  const getSizeStyles = useCallback((size: string) => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: styles.smallIcon,
          text: styles.smallText,
          details: styles.smallDetails,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: styles.largeIcon,
          text: styles.largeText,
          details: styles.largeDetails,
        };
      case 'medium':
      default:
        return {
          container: styles.mediumContainer,
          icon: styles.mediumIcon,
          text: styles.mediumText,
          details: styles.mediumDetails,
        };
    }
  }, []);

  // Handle press
  const handlePress = useCallback(() => {
    if (onPress) {
      const statusText = getStatusText(validationStatus);
      AccessibilityInfo.announceForAccessibility(`Validation status: ${statusText}`);
      onPress();
    }
  }, [onPress, validationStatus, getStatusText]);

  // Get accessibility label
  const getAccessibilityLabel = useCallback((): string => {
    if (accessibilityLabel) return accessibilityLabel;
    
    const statusText = getStatusText(validationStatus);
    let label = `Validation status: ${statusText}`;
    
    if (validationResults) {
      const errorCount = validationResults.errors.length;
      const warningCount = validationResults.warnings.length;
      
      if (errorCount > 0) {
        label += `, ${errorCount} error${errorCount === 1 ? '' : 's'}`;
      }
      if (warningCount > 0) {
        label += `, ${warningCount} warning${warningCount === 1 ? '' : 's'}`;
      }
    }
    
    if (onPress) {
      label += '. Tap for details.';
    }
    
    return label;
  }, [accessibilityLabel, validationStatus, validationResults, onPress, getStatusText]);

  // Render validation details
  const renderValidationDetails = useCallback(() => {
    if (!showDetails || !validationResults) return null;

    const errorCount = validationResults.errors.length;
    const warningCount = validationResults.warnings.length;
    const sizeStyles = getSizeStyles(size);

    return (
      <View style={sizeStyles.details}>
        {errorCount > 0 && (
          <Text style={[styles.detailText, { color: '#F44336' }]}>
            {errorCount} error{errorCount === 1 ? '' : 's'}
          </Text>
        )}
        {warningCount > 0 && (
          <Text style={[styles.detailText, { color: '#FF9800' }]}>
            {warningCount} warning{warningCount === 1 ? '' : 's'}
          </Text>
        )}
        {errorCount === 0 && warningCount === 0 && validationResults.isValid && (
          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
            All checks passed
          </Text>
        )}
      </View>
    );
  }, [showDetails, validationResults, size, getSizeStyles]);

  const statusColor = getStatusColor(validationStatus);
  const statusIcon = getStatusIcon(validationStatus);
  const statusText = getStatusText(validationStatus);
  const sizeStyles = getSizeStyles(size);
  const accessibilityLabelText = getAccessibilityLabel();

  // Container component - either TouchableOpacity or View
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress 
    ? {
        onPress: handlePress,
        accessibilityRole: 'button' as const,
        accessibilityLabel: accessibilityLabelText,
        accessibilityHint: 'Tap for validation details',
      }
    : {
        accessibilityLabel: accessibilityLabelText,
      };

  return (
    <Container 
      style={[
        styles.container,
        sizeStyles.container,
        { borderColor: statusColor },
        onPress && styles.pressable,
      ]}
      {...containerProps}
    >
      <View style={styles.statusContent}>
        {isValidating ? (
          <ActivityIndicator 
            size={size === 'small' ? 'small' : 'small'} 
            color={statusColor} 
            style={styles.activityIndicator}
          />
        ) : (
          <Text style={[
            styles.statusIcon,
            sizeStyles.icon,
            { color: statusColor },
          ]}>
            {statusIcon}
          </Text>
        )}
        
        <Text style={[
          styles.statusText,
          sizeStyles.text,
          { color: statusColor },
        ]}>
          {statusText}
        </Text>
      </View>
      
      {renderValidationDetails()}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressable: {
    // Add subtle press feedback for touchable indicators
  },

  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    fontWeight: 'bold',
    marginRight: 4,
  },

  statusText: {
    fontWeight: '600',
  },

  activityIndicator: {
    marginRight: 4,
  },

  detailText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Small size styles
  smallContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 60,
  },

  smallIcon: {
    fontSize: 12,
  },

  smallText: {
    fontSize: 10,
  },

  smallDetails: {
    marginTop: 2,
  },

  // Medium size styles
  mediumContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 80,
  },

  mediumIcon: {
    fontSize: 14,
  },

  mediumText: {
    fontSize: 12,
  },

  mediumDetails: {
    marginTop: 3,
  },

  // Large size styles
  largeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
  },

  largeIcon: {
    fontSize: 16,
  },

  largeText: {
    fontSize: 14,
  },

  largeDetails: {
    marginTop: 4,
  },
});