/**
 * Touch Interface Styles - Poker-themed styling for touch components
 * Story 2.3: Enhanced Touch Interface for Buy-ins
 */
import { StyleSheet } from 'react-native';

// Poker Theme Color Palette (as per story requirements)
export const PokerColors = {
  // Background colors
  tableGreen: '#0F5132', // Dark green poker table color
  cardWhite: '#FFFFFF',
  cardShadow: '#00000020',
  
  // Accent colors
  gold: '#FFD700', // Gold for primary buttons
  silver: '#C0C0C0',
  
  // Chip colors
  redChip: '#DC3545', // $5 chips
  greenChip: '#198754', // $25 chips
  blackChip: '#000000', // $100 chips
  whiteChipText: '#FFFFFF',
  
  // Text colors
  primaryText: '#FFFFFF',
  darkText: '#212529',
  secondaryText: '#6C757D',
  
  // Status colors
  active: '#28A745',
  selected: '#FFD700',
  disabled: '#6C757D',
  
  // Feedback colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
} as const;

// Touch Target Dimensions (88x88pt minimum for iOS compliance)
export const TouchTargets = {
  minimum: 88, // iOS minimum touch target
  large: 100,
  extraLarge: 120,
  chipSize: 88, // Updated to meet minimum accessibility requirements
  playerCard: 100,
} as const;

// Responsive Breakpoints
export const Breakpoints = {
  phone: 480,
  tablet: 768,
  largeTablet: 1024,
} as const;

// Quick Buy-In Panel Styles
export const quickBuyInStyles = StyleSheet.create({
  container: {
    backgroundColor: PokerColors.tableGreen,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PokerColors.primaryText,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  
  quickButton: {
    backgroundColor: PokerColors.gold,
    minWidth: TouchTargets.minimum,
    minHeight: TouchTargets.minimum,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
  },
  
  quickButtonPressed: {
    backgroundColor: PokerColors.silver,
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.1,
    elevation: 2,
  },
  
  quickButtonDisabled: {
    backgroundColor: PokerColors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PokerColors.darkText,
  },
  
  buttonAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: PokerColors.darkText,
    marginTop: 2,
  },
  
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  helperContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  
  helperText: {
    fontSize: 14,
    color: PokerColors.secondaryText,
    textAlign: 'center',
  },
});

// Player Selection Grid Styles
export const playerGridStyles = StyleSheet.create({
  container: {
    backgroundColor: PokerColors.cardWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  
  containerRelative: {
    position: 'relative',
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PokerColors.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  
  playerCard: {
    width: TouchTargets.playerCard,
    height: TouchTargets.playerCard,
    borderRadius: 12,
    backgroundColor: PokerColors.cardWhite,
    borderWidth: 2,
    borderColor: PokerColors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    padding: 8,
  },
  
  playerCardSelected: {
    borderColor: PokerColors.selected,
    backgroundColor: PokerColors.selected + '15',
    shadowOpacity: 0.2,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  
  playerCardActive: {
    borderColor: PokerColors.active,
  },
  
  playerCardCashedOut: {
    borderColor: PokerColors.disabled,
    backgroundColor: PokerColors.disabled + '10',
    opacity: 0.6,
  },
  
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PokerColors.tableGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  playerInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PokerColors.primaryText,
  },
  
  playerName: {
    fontSize: 12,
    fontWeight: '600',
    color: PokerColors.darkText,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  playerBalance: {
    fontSize: 10,
    color: PokerColors.secondaryText,
    textAlign: 'center',
    marginTop: 2,
  },
  
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: 16,
    color: PokerColors.secondaryText,
    textAlign: 'center',
  },
  
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
  },
  
  statusIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: PokerColors.error,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  
  statusText: {
    fontSize: 8,
    color: PokerColors.primaryText,
    fontWeight: 'bold',
  },
  
  selectionStatus: {
    marginTop: 12,
    padding: 8,
    backgroundColor: PokerColors.selected + '15',
    borderRadius: 8,
    alignItems: 'center',
  },
  
  selectionStatusText: {
    fontSize: 14,
    color: PokerColors.darkText,
    fontWeight: '600',
  },
  
  gestureHint: {
    fontSize: 12,
    color: PokerColors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
  },
});

// Poker Chip Calculator Styles
export const chipCalculatorStyles = StyleSheet.create({
  container: {
    backgroundColor: PokerColors.cardWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PokerColors.darkText,
    marginBottom: 12,
    textAlign: 'center',
  },
  
  totalDisplay: {
    backgroundColor: PokerColors.tableGreen,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  
  totalLabel: {
    fontSize: 14,
    color: PokerColors.primaryText,
    marginBottom: 4,
  },
  
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PokerColors.gold,
  },
  
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  
  chipStack: {
    alignItems: 'center',
    minWidth: 80,
  },
  
  chipButton: {
    width: TouchTargets.chipSize,
    height: TouchTargets.chipSize,
    borderRadius: TouchTargets.chipSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PokerColors.primaryText,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: 8,
  },
  
  redChip: {
    backgroundColor: PokerColors.redChip,
  },
  
  greenChip: {
    backgroundColor: PokerColors.greenChip,
  },
  
  blackChip: {
    backgroundColor: PokerColors.blackChip,
  },
  
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PokerColors.whiteChipText,
  },
  
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PokerColors.darkText,
    marginBottom: 4,
  },
  
  chipCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PokerColors.darkText,
    minHeight: 20,
  },
  
  chipCountContainer: {
    backgroundColor: PokerColors.cardWhite,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: PokerColors.disabled,
    minWidth: 32,
    alignItems: 'center',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  
  clearButton: {
    backgroundColor: PokerColors.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: TouchTargets.minimum / 2,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  
  confirmButton: {
    backgroundColor: PokerColors.success,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: TouchTargets.minimum / 2,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  
  buttonDisabled: {
    backgroundColor: PokerColors.disabled,
  },
  
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PokerColors.primaryText,
  },
  
  instructionContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  
  instructionText: {
    fontSize: 12,
    color: PokerColors.secondaryText,
    textAlign: 'center',
  },
  
  errorText: {
    fontSize: 12,
    color: PokerColors.error,
    textAlign: 'center',
    marginTop: 4,
  },
});

// Gesture and Animation Styles
export const gestureStyles = StyleSheet.create({
  swipeIndicator: {
    position: 'absolute',
    top: '50%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: PokerColors.gold + '80',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  swipeIndicatorLeft: {
    left: 10,
  },
  
  swipeIndicatorRight: {
    right: 10,
  },
  
  swipeArrow: {
    fontSize: 16,
    color: PokerColors.primaryText,
    fontWeight: 'bold',
  },
  
  animatedContainer: {
    flex: 1,
  },
  
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0,
  },
});

// Responsive Utilities
export const getResponsiveStyles = (screenWidth: number) => {
  const isTablet = screenWidth >= Breakpoints.tablet;
  const isLargeTablet = screenWidth >= Breakpoints.largeTablet;
  
  return {
    isTablet,
    isLargeTablet,
    
    // Grid columns based on screen size
    gridColumns: isLargeTablet ? 4 : isTablet ? 3 : 2,
    
    // Touch target adjustments for tablets
    touchTarget: isTablet ? TouchTargets.large : TouchTargets.minimum,
    
    // Font size adjustments
    fontSize: {
      small: isTablet ? 16 : 14,
      medium: isTablet ? 18 : 16,
      large: isTablet ? 22 : 18,
      title: isTablet ? 28 : 24,
    },
    
    // Spacing adjustments
    spacing: {
      xs: isTablet ? 6 : 4,
      sm: isTablet ? 12 : 8,
      md: isTablet ? 20 : 16,
      lg: isTablet ? 32 : 24,
      xl: isTablet ? 40 : 32,
    },
  };
};

// Landscape Mode Styles
export const landscapeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  
  leftPanel: {
    flex: 1,
    paddingRight: 8,
  },
  
  rightPanel: {
    flex: 1,
    paddingLeft: 8,
  },
  
  centerPanel: {
    flex: 2,
    paddingHorizontal: 16,
  },
  
  playerGridLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  
  quickButtonsLandscape: {
    flexDirection: 'column',
    gap: 16,
  },
  
  chipCalculatorLandscape: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
});

// Touch Interface Layout Styles
export const touchInterfaceStyles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },
  
  gestureRoot: {
    flex: 1,
  },
});

export default {
  PokerColors,
  TouchTargets,
  Breakpoints,
  quickBuyInStyles,
  playerGridStyles,
  chipCalculatorStyles,
  gestureStyles,
  getResponsiveStyles,
  landscapeStyles,
  touchInterfaceStyles,
};