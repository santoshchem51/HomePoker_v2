/**
 * PlayerSelectionGrid Component
 * Story 2.3: Enhanced Touch Interface for Buy-ins - AC 2 & 4
 * 
 * Large touch-friendly player cards (88x88pt minimum) with photos/avatars,
 * active player highlighting, and gesture support for swipe navigation
 */
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { usePlayerSelection } from '../../hooks/usePlayerSelection';
import { HapticService } from '../../services/integration/HapticService';
import { Player } from '../../types/player';
import { 
  playerGridStyles, 
  landscapeStyles,
  gestureStyles,
} from '../../styles/touchInterface.styles';

interface PlayerSelectionGridProps {
  sessionId: string;
  selectedPlayerId: string | null;
  onPlayerSelect: (playerId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isLandscape?: boolean;
  enableGestures?: boolean;
}

const PlayerSelectionGridComponent: React.FC<PlayerSelectionGridProps> = ({
  sessionId,
  selectedPlayerId: externalSelectedPlayerId,
  onPlayerSelect,
  onError,
  disabled = false,
  isLandscape = false,
  enableGestures = true,
}) => {
  // Memoize service instance to prevent unnecessary re-renders
  const hapticService = useMemo(() => HapticService.getInstance(), []);
  
  // Gesture animation refs - memoize to prevent recreation
  const translateX = useMemo(() => new Animated.Value(0), []);
  const leftIndicatorOpacity = useMemo(() => new Animated.Value(0), []);
  const rightIndicatorOpacity = useMemo(() => new Animated.Value(0), []);

  // Use custom hook for player selection with gesture support
  const {
    players,
    selectedPlayerId: hookSelectedPlayerId,
    loading,
    selectPlayer,
    navigateToNext,
    navigateToPrevious,
    canNavigateNext,
    canNavigatePrevious,
  } = usePlayerSelection({
    sessionId,
    onError,
  });

  // Use external selection if provided, otherwise use hook's selection
  const selectedPlayerId = externalSelectedPlayerId || hookSelectedPlayerId;

  /**
   * Handle player selection with haptic feedback
   */
  const handlePlayerSelect = useCallback((playerId: string) => {
    if (disabled) {
      return;
    }

    // Check if the player is cashed out
    const player = players.find(p => p.id === playerId);
    if (player && player.status === 'cashed_out') {
      return; // Don't allow selection of cashed out players
    }

    // If using external selection, call the external handler
    if (externalSelectedPlayerId !== undefined) {
      onPlayerSelect(playerId);
    } else {
      // Otherwise use the hook's selection
      selectPlayer(playerId);
    }
    
    // Light haptic feedback for selection
    hapticService.light();
  }, [disabled, players, externalSelectedPlayerId, onPlayerSelect, selectPlayer, hapticService]);

  /**
   * Handle swipe gesture
   */
  const handleSwipeGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
    if (!enableGestures || disabled || players.length <= 1) {
      return;
    }

    const { translationX, velocityX, state } = event.nativeEvent;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    // Update animation during gesture
    if (state === State.ACTIVE) {
      translateX.setValue(translationX * 0.5); // Damped movement
      
      // Show appropriate indicator
      if (Math.abs(translationX) > 20) {
        const opacity = Math.min(Math.abs(translationX) / 100, 1);
        
        if (translationX > 0 && canNavigatePrevious) {
          leftIndicatorOpacity.setValue(opacity);
          rightIndicatorOpacity.setValue(0);
        } else if (translationX < 0 && canNavigateNext) {
          rightIndicatorOpacity.setValue(opacity);
          leftIndicatorOpacity.setValue(0);
        }
      }
    }

    // Handle gesture end
    if (state === State.END) {
      const shouldTriggerSwipe = 
        Math.abs(translationX) > swipeThreshold || 
        Math.abs(velocityX) > velocityThreshold;

      if (shouldTriggerSwipe) {
        if (translationX > 0 && canNavigatePrevious) {
          // Swipe right - go to previous player
          navigateToPrevious();
          if (externalSelectedPlayerId !== undefined) {
            const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
            const previousIndex = currentIndex <= 0 ? players.length - 1 : currentIndex - 1;
            if (players[previousIndex]) {
              onPlayerSelect(players[previousIndex].id);
            }
          }
        } else if (translationX < 0 && canNavigateNext) {
          // Swipe left - go to next player
          navigateToNext();
          if (externalSelectedPlayerId !== undefined) {
            const currentIndex = players.findIndex(p => p.id === selectedPlayerId);
            const nextIndex = currentIndex >= players.length - 1 ? 0 : currentIndex + 1;
            if (players[nextIndex]) {
              onPlayerSelect(players[nextIndex].id);
            }
          }
        }
      }

      // Reset animations
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(leftIndicatorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rightIndicatorOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    enableGestures,
    disabled,
    players,
    selectedPlayerId,
    canNavigateNext,
    canNavigatePrevious,
    navigateToNext,
    navigateToPrevious,
    externalSelectedPlayerId,
    onPlayerSelect,
    translateX,
    leftIndicatorOpacity,
    rightIndicatorOpacity,
  ]);

  /**
   * Generate player initials from name
   */
  const getPlayerInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }, []);

  /**
   * Get player card style based on state
   */
  const getPlayerCardStyle = useCallback((player: Player) => {
    const isSelected = player.id === selectedPlayerId;
    const isActive = player.status === 'active';
    const isCashedOut = player.status === 'cashed_out';
    
    return [
      playerGridStyles.playerCard,
      isSelected && playerGridStyles.playerCardSelected,
      isActive && !isCashedOut && playerGridStyles.playerCardActive,
      isCashedOut && playerGridStyles.playerCardCashedOut,
    ];
  }, [selectedPlayerId]);

  /**
   * Format balance display
   */
  const formatBalance = useCallback((balance: number): string => {
    return `$${balance.toFixed(0)}`;
  }, []);

  /**
   * Render individual player card
   */
  const renderPlayerCard = useCallback((player: Player) => {
    const initials = getPlayerInitials(player.name);
    const isSelected = player.id === selectedPlayerId;
    const isCashedOut = player.status === 'cashed_out';
    
    return (
      <TouchableOpacity
        key={player.id}
        style={getPlayerCardStyle(player)}
        onPress={() => handlePlayerSelect(player.id)}
        disabled={disabled || isCashedOut}
        activeOpacity={0.8}
        accessibilityLabel={`Player ${player.name}`}
        accessibilityHint={`Tap to select ${player.name} for buy-in. Current balance: ${formatBalance(player.currentBalance)}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: isCashedOut }}
      >
        {/* Player Avatar */}
        <View style={playerGridStyles.playerAvatar}>
          <Text style={playerGridStyles.playerInitials}>
            {initials}
          </Text>
        </View>
        
        {/* Player Name */}
        <Text 
          style={playerGridStyles.playerName}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {player.name}
        </Text>
        
        {/* Player Balance */}
        <Text style={playerGridStyles.playerBalance}>
          {formatBalance(player.currentBalance)}
        </Text>
        
        {/* Status Indicator */}
        {isCashedOut && (
          <View style={playerGridStyles.statusIndicator}>
            <Text style={playerGridStyles.statusText}>
              OUT
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedPlayerId, disabled, getPlayerInitials, getPlayerCardStyle, formatBalance, handlePlayerSelect]);

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={playerGridStyles.emptyState}>
      <Text style={playerGridStyles.emptyText}>
        No players in this session
      </Text>
      <Text style={[playerGridStyles.emptyText, playerGridStyles.emptySubtext]}>
        Add players to start recording buy-ins
      </Text>
    </View>
  );

  /**
   * Get grid container style based on layout
   */
  const getGridContainerStyle = useMemo(() => {
    if (isLandscape) {
      return [
        playerGridStyles.gridContainer,
        landscapeStyles.playerGridLandscape,
      ];
    }
    return playerGridStyles.gridContainer;
  }, [isLandscape]);

  if (loading) {
    return (
      <View style={playerGridStyles.container}>
        <Text style={playerGridStyles.title}>Select Player</Text>
        <View style={playerGridStyles.emptyState}>
          <Text style={playerGridStyles.emptyText}>Loading players...</Text>
        </View>
      </View>
    );
  }

  const gridContent = (
    <View style={[playerGridStyles.container, playerGridStyles.containerRelative]}>
      <Text style={playerGridStyles.title}>Select Player</Text>
      
      {players.length === 0 ? (
        renderEmptyState()
      ) : (
        <Animated.View 
          style={[
            getGridContainerStyle,
            { transform: [{ translateX }] }
          ]}
        >
          {players.map(renderPlayerCard)}
        </Animated.View>
      )}
      
      {/* Swipe Indicators */}
      {enableGestures && players.length > 1 && (
        <>
          <Animated.View 
            style={[
              gestureStyles.swipeIndicator,
              gestureStyles.swipeIndicatorLeft,
              { opacity: leftIndicatorOpacity }
            ]}
            pointerEvents="none"
          >
            <Text style={gestureStyles.swipeArrow}>‹</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              gestureStyles.swipeIndicator,
              gestureStyles.swipeIndicatorRight,
              { opacity: rightIndicatorOpacity }
            ]}
            pointerEvents="none"
          >
            <Text style={gestureStyles.swipeArrow}>›</Text>
          </Animated.View>
        </>
      )}
      
      {/* Selection Status */}
      {selectedPlayerId && (
        <View style={playerGridStyles.selectionStatus}>
          <Text style={playerGridStyles.selectionStatusText}>
            {players.find(p => p.id === selectedPlayerId)?.name || 'Unknown Player'} selected
          </Text>
          {enableGestures && players.length > 1 && (
            <Text style={playerGridStyles.gestureHint}>
              Swipe left/right to navigate between players
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Wrap with gesture handler if gestures are enabled
  if (enableGestures && players.length > 1) {
    return (
      <GestureHandlerRootView style={gestureStyles.animatedContainer}>
        <PanGestureHandler onGestureEvent={handleSwipeGesture}>
          {gridContent}
        </PanGestureHandler>
      </GestureHandlerRootView>
    );
  }

  return gridContent;
};

// Memoize the component to prevent unnecessary re-renders
export const PlayerSelectionGrid = React.memo(PlayerSelectionGridComponent);

// Set display name for debugging
PlayerSelectionGrid.displayName = 'PlayerSelectionGrid';

export default PlayerSelectionGrid;