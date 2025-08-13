/**
 * TouchBuyInInterface Component
 * Story 2.3: Enhanced Touch Interface for Buy-ins - Master Component
 * 
 * Combines all touch interface components with landscape mode support
 * and responsive design for tablet optimization
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import QuickBuyInPanel from './QuickBuyInPanel';
import PlayerSelectionGrid from './PlayerSelectionGrid';
import PokerChipCalculator from './PokerChipCalculator';
import { ErrorBoundary } from '../common/ErrorBoundary';
import {
  getResponsiveStyles,
  landscapeStyles,
  PokerColors,
  touchInterfaceStyles,
} from '../../styles/touchInterface.styles';

interface TouchBuyInInterfaceProps {
  sessionId: string;
  onBuyInComplete?: (transactionId: string, amount: number, playerId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface Orientation {
  isLandscape: boolean;
  width: number;
  height: number;
}

const TouchBuyInInterfaceComponent: React.FC<TouchBuyInInterfaceProps> = ({
  sessionId,
  onBuyInComplete,
  onError,
  disabled = false,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      isLandscape: width > height,
      width,
      height,
    };
  });

  // Memoize responsive styles to prevent unnecessary recalculations
  const responsiveStyles = useMemo(() => 
    getResponsiveStyles(orientation.width), 
    [orientation.width]
  );

  /**
   * Handle orientation changes
   */
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation({
        isLandscape: width > height,
        width,
        height,
      });
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    
    return () => subscription?.remove();
  }, []);

  /**
   * Handle player selection
   */
  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  /**
   * Handle successful buy-in from any component
   */
  const handleBuyInComplete = (transactionId: string, amount: number) => {
    // Clear selection after successful transaction
    setSelectedPlayerId(null);
    
    // Notify parent component
    onBuyInComplete?.(transactionId, amount, selectedPlayerId || '');
  };

  /**
   * Handle errors from any component
   */
  const handleError = (error: string) => {
    onError?.(error);
  };

  /**
   * Get container style based on orientation and device
   */
  const getContainerStyle = () => {
    const baseStyle = {
      flex: 1,
      backgroundColor: PokerColors.tableGreen,
      padding: responsiveStyles.spacing.md,
    };

    if (orientation.isLandscape && responsiveStyles.isTablet) {
      return [baseStyle, landscapeStyles.container];
    }

    return baseStyle;
  };

  /**
   * Render portrait layout
   */
  const renderPortraitLayout = () => (
    <ScrollView
      style={touchInterfaceStyles.scrollContainer}
      contentContainerStyle={touchInterfaceStyles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Player Selection - Top Priority */}
      <PlayerSelectionGrid
        sessionId={sessionId}
        selectedPlayerId={selectedPlayerId}
        onPlayerSelect={handlePlayerSelect}
        onError={handleError}
        disabled={disabled}
        isLandscape={false}
        enableGestures={true}
      />

      {/* Quick Buy-in Panel */}
      <QuickBuyInPanel
        sessionId={sessionId}
        selectedPlayerId={selectedPlayerId}
        onBuyInComplete={handleBuyInComplete}
        onError={handleError}
        disabled={disabled}
      />

      {/* Poker Chip Calculator */}
      <PokerChipCalculator
        sessionId={sessionId}
        selectedPlayerId={selectedPlayerId}
        onBuyInComplete={handleBuyInComplete}
        onError={handleError}
        disabled={disabled}
        isLandscape={false}
      />
    </ScrollView>
  );

  /**
   * Render landscape layout for tablets
   */
  const renderLandscapeLayout = () => (
    <View style={landscapeStyles.container}>
      {/* Left Panel - Player Selection */}
      <View style={landscapeStyles.leftPanel}>
        <PlayerSelectionGrid
          sessionId={sessionId}
          selectedPlayerId={selectedPlayerId}
          onPlayerSelect={handlePlayerSelect}
          onError={handleError}
          disabled={disabled}
          isLandscape={true}
          enableGestures={true}
        />
      </View>

      {/* Right Panel - Buy-in Options */}
      <View style={landscapeStyles.rightPanel}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={touchInterfaceStyles.scrollContent}
        >
          {/* Quick Buy-in Panel */}
          <QuickBuyInPanel
            sessionId={sessionId}
            selectedPlayerId={selectedPlayerId}
            onBuyInComplete={handleBuyInComplete}
            onError={handleError}
            disabled={disabled}
          />

          {/* Poker Chip Calculator */}
          <PokerChipCalculator
            sessionId={sessionId}
            selectedPlayerId={selectedPlayerId}
            onBuyInComplete={handleBuyInComplete}
            onError={handleError}
            disabled={disabled}
            isLandscape={true}
          />
        </ScrollView>
      </View>
    </View>
  );

  /**
   * Render phone landscape layout (simplified)
   */
  const renderPhoneLandscapeLayout = () => (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={touchInterfaceStyles.scrollContainer}
    >
      {/* Page 1: Player Selection */}
      <View style={{ width: orientation.width, padding: responsiveStyles.spacing.sm }}>
        <PlayerSelectionGrid
          sessionId={sessionId}
          selectedPlayerId={selectedPlayerId}
          onPlayerSelect={handlePlayerSelect}
          onError={handleError}
          disabled={disabled}
          isLandscape={true}
          enableGestures={true}
        />
      </View>

      {/* Page 2: Buy-in Options */}
      <View style={{ width: orientation.width, padding: responsiveStyles.spacing.sm }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <QuickBuyInPanel
            sessionId={sessionId}
            selectedPlayerId={selectedPlayerId}
            onBuyInComplete={handleBuyInComplete}
            onError={handleError}
            disabled={disabled}
          />

          <PokerChipCalculator
            sessionId={sessionId}
            selectedPlayerId={selectedPlayerId}
            onBuyInComplete={handleBuyInComplete}
            onError={handleError}
            disabled={disabled}
            isLandscape={true}
          />
        </ScrollView>
      </View>
    </ScrollView>
  );

  return (
    <ErrorBoundary
      onError={(error: Error, errorInfo: any) => {
        console.error('TouchBuyInInterface error:', error, errorInfo);
        onError?.(`Touch interface error: ${error.message}`);
      }}
    >
      <View style={getContainerStyle()}>
        {orientation.isLandscape ? (
          responsiveStyles.isTablet ? 
            renderLandscapeLayout() : 
            renderPhoneLandscapeLayout()
        ) : (
          renderPortraitLayout()
        )}
      </View>
    </ErrorBoundary>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const TouchBuyInInterface = React.memo(TouchBuyInInterfaceComponent);

// Set display name for debugging
TouchBuyInInterface.displayName = 'TouchBuyInInterface';

export default TouchBuyInInterface;