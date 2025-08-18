import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { BrightnessControl } from '../common/BrightnessControl';
import { ThemeToggle } from '../common/ThemeToggle';
import { AnimationToggle } from '../common/AnimationToggle';
import { DarkPokerColors, DarkThemeStyles, DarkThemeTypography } from '../../styles/darkTheme.styles';
import { ChipShapeIndicator, PatternIndicator, TransactionTypeIndicator } from '../common/AccessibleIndicators';
import { DistanceOptimizedText, CriticalBalanceDisplay, PlayerInfoDisplay } from '../common/DistanceOptimizedText';

export const SettingsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();

  const backgroundColor = isDarkMode ? DarkPokerColors.background : '#f5f5f5';
  const textColor = isDarkMode ? DarkPokerColors.primaryText : '#212529';
  const secondaryTextColor = isDarkMode ? DarkPokerColors.secondaryText : '#6C757D';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <DistanceOptimizedText type="criticalBalance" emphasized>
          ⚙️ Settings & Preferences
        </DistanceOptimizedText>
        <DistanceOptimizedText type="secondaryInfo" style={{ marginTop: 8 }}>
          Customize your poker room experience
        </DistanceOptimizedText>
      </View>

      {/* Theme Settings Section */}
      <View style={[styles.section, { 
        backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' 
      }]}>
        <DistanceOptimizedText type="playerName" emphasized style={{ marginBottom: 16 }}>
          🎨 Appearance & Theme
        </DistanceOptimizedText>
        
        <ThemeToggle showLabels={true} compact={false} />
        <BrightnessControl showPresets={true} showTitle={true} compact={false} />
        <AnimationToggle showMetrics={true} compact={false} />
      </View>

      {/* Accessibility Features Demo */}
      <View style={[styles.section, { 
        backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' 
      }]}>
        <DistanceOptimizedText type="playerName" emphasized style={{ marginBottom: 16 }}>
          ♿ Accessibility Features
        </DistanceOptimizedText>
        
        <DistanceOptimizedText type="secondaryInfo" style={{ marginBottom: 12 }}>
          Color-blind friendly chip indicators:
        </DistanceOptimizedText>
        
        <View style={styles.chipRow}>
          <ChipShapeIndicator value={5} size={50} showValue={true} />
          <ChipShapeIndicator value={25} size={50} showValue={true} />
          <ChipShapeIndicator value={100} size={50} showValue={true} />
          <ChipShapeIndicator value={500} size={50} showValue={true} />
        </View>

        <DistanceOptimizedText type="secondaryInfo" style={{ marginBottom: 12, marginTop: 16 }}>
          Pattern-based player status indicators:
        </DistanceOptimizedText>
        
        <View style={styles.patternRow}>
          <View style={styles.patternItem}>
            <PatternIndicator status="active" pattern="solid" size={32} />
            <Text style={[styles.patternLabel, { color: secondaryTextColor }]}>Active</Text>
          </View>
          <View style={styles.patternItem}>
            <PatternIndicator status="waiting" pattern="striped" size={32} />
            <Text style={[styles.patternLabel, { color: secondaryTextColor }]}>Waiting</Text>
          </View>
          <View style={styles.patternItem}>
            <PatternIndicator status="selected" pattern="dotted" size={32} />
            <Text style={[styles.patternLabel, { color: secondaryTextColor }]}>Selected</Text>
          </View>
          <View style={styles.patternItem}>
            <PatternIndicator status="cashedOut" pattern="diagonal" size={32} />
            <Text style={[styles.patternLabel, { color: secondaryTextColor }]}>Cashed Out</Text>
          </View>
        </View>

        <DistanceOptimizedText type="secondaryInfo" style={{ marginBottom: 12, marginTop: 16 }}>
          Transaction type indicators:
        </DistanceOptimizedText>
        
        <View style={styles.transactionRow}>
          <TransactionTypeIndicator type="buyIn" size={36} showLabel={true} />
          <TransactionTypeIndicator type="cashOut" size={36} showLabel={true} />
          <TransactionTypeIndicator type="adjustment" size={36} showLabel={true} />
          <TransactionTypeIndicator type="void" size={36} showLabel={true} />
        </View>
      </View>

      {/* Distance Visibility Demo */}
      <View style={[styles.section, { 
        backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' 
      }]}>
        <DistanceOptimizedText type="playerName" emphasized style={{ marginBottom: 16 }}>
          👁️ Distance Visibility (2-3 feet optimized)
        </DistanceOptimizedText>
        
        <CriticalBalanceDisplay
          amount={1250.75}
          label="Current Balance"
          positive={true}
          withBackground={true}
        />
        
        <View style={styles.spacer} />
        
        <PlayerInfoDisplay
          name="Alex Thompson"
          balance={750.50}
          status="active"
          compact={false}
        />
        
        <View style={styles.spacer} />
        
        <PlayerInfoDisplay
          name="Sam Wilson"
          balance={-125.25}
          status="cashedOut"
          compact={false}
        />
      </View>

      {/* Poker Room Environment Info */}
      <View style={[styles.section, { 
        backgroundColor: isDarkMode ? DarkPokerColors.surfaceBackground : '#F8F9FA' 
      }]}>
        <DistanceOptimizedText type="playerName" emphasized style={{ marginBottom: 16 }}>
          🃏 Poker Room Optimization
        </DistanceOptimizedText>
        
        <View style={[styles.infoCard, {
          backgroundColor: isDarkMode ? DarkPokerColors.tableGreen : '#E8F5E8',
          borderColor: isDarkMode ? DarkPokerColors.success : '#C3E6CB',
        }]}>
          <DistanceOptimizedText type="secondaryInfo" style={{ marginBottom: 8 }}>
            ✅ Features Active:
          </DistanceOptimizedText>
          <DistanceOptimizedText type="detailText" style={{ lineHeight: 20 }}>
            • Warm color temperature (2700K-3000K) reduces blue light{'\n'}
            • High contrast ratios (7:1) for WCAG AAA compliance{'\n'}
            • Enhanced typography for 2-3 feet viewing distance{'\n'}
            • Shape/pattern indicators for color-blind accessibility{'\n'}
            • Minimal animations for extended battery life{'\n'}
            • Independent brightness control for dim poker rooms
          </DistanceOptimizedText>
        </View>

        <View style={[styles.infoCard, {
          backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : '#FFF3E0',
          borderColor: isDarkMode ? DarkPokerColors.warning : '#FFB74D',
          marginTop: 12,
        }]}>
          <DistanceOptimizedText type="secondaryInfo" style={{ marginBottom: 8 }}>
            💡 Pro Tips for Poker Rooms:
          </DistanceOptimizedText>
          <DistanceOptimizedText type="detailText" style={{ lineHeight: 20 }}>
            • Set brightness to "Dim" (30%) for minimal screen glare{'\n'}
            • Enable battery optimization for long poker sessions{'\n'}
            • Dark mode prevents revealing hand information{'\n'}
            • Large touch targets work well from sitting distance{'\n'}
            • Color-blind players can distinguish all indicators
          </DistanceOptimizedText>
        </View>
      </View>

      {/* Footer Spacing */}
      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },

  section: {
    margin: 12,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },

  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },

  patternItem: {
    alignItems: 'center',
  },

  patternLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },

  spacer: {
    height: 16,
  },

  infoCard: {
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },

  footer: {
    height: 40,
  },
});