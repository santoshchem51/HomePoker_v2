import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { SessionService } from '../../services/core/SessionService';
import { ExportService } from '../../services/infrastructure/ExportService';
import { NotificationService } from '../../services/infrastructure/NotificationService';
import { TransactionService } from '../../services/core/TransactionService';
import { DatabaseService } from '../../services/infrastructure/DatabaseService';
import { Session } from '../../types/session';
import { useTheme } from '../../contexts/ThemeContext';
import { DarkPokerColors } from '../../styles/darkTheme.styles';

interface SessionHistoryProps {
  onSessionSelect?: (sessionId: string) => void;
  onExportComplete?: (sessionId: string, format: string) => void;
  onViewSettlement?: (sessionId: string, sessionName?: string) => void;
}

interface HistorySession extends Session {
  has_export?: boolean;
  cleanupAt?: string;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelect,
  onExportComplete,
  onViewSettlement
}) => {
  const { isDarkMode } = useTheme();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const sessionService = SessionService.getInstance();
  const exportService = ExportService.getInstance();
  const notificationService = NotificationService.getInstance();
  const transactionService = TransactionService.getInstance();
  const dbService = DatabaseService.getInstance();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const historyData = await sessionService.getSessionHistory(30);
      
      // Calculate actual total pot for each session from transactions
      const sessionsWithCalculatedPot = await Promise.all(
        historyData.map(async (session) => {
          try {
            // Get all buy-in transactions for this session
            const transactions = await dbService.getTransactions(session.id);
            const buyInTransactions = transactions.filter((t: any) => t.type === 'buy_in' && !t.isVoided);
            const totalPot = buyInTransactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);
            
            console.log(`Session ${session.name}: calculated totalPot = ${totalPot} from ${buyInTransactions.length} buy-ins`);
            return {
              ...session,
              totalPot: totalPot
            };
          } catch (error) {
            console.warn(`Failed to calculate total pot for session ${session.id}:`, error);
            return session; // Return original session if calculation fails
          }
        })
      );
      
      setSessions(sessionsWithCalculatedPot);
    } catch (error) {
      console.error('Failed to load session history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session history';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionService, transactionService]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  const handleSessionPress = (sessionId: string) => {
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };

  const handleDeleteSession = async (session: HistorySession) => {
    const confirmed = await notificationService.confirmAction(
      'Delete Session',
      `Are you sure you want to permanently delete "${session.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await sessionService.deleteSession(session.id);
        await loadSessions();
        await notificationService.showImmediateAlert(
          'Session Deleted',
          'Session has been permanently removed.'
        );
      } catch (error) {
        console.error('Failed to delete session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete session';
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleViewSettlement = (session: HistorySession) => {
    if (onViewSettlement) {
      onViewSettlement(session.id, session.name);
    } else {
      // Fallback - show basic settlement info
      Alert.alert(
        'Settlement Statement',
        `Session: ${session.name}\nTotal Pot: ${formatCurrency(session.totalPot)}\nPlayers: ${session.playerCount}\nCompleted: ${session.completedAt ? formatDate(session.completedAt.toString()) : 'In Progress'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const exportSession = async (sessionId: string, format: 'json' | 'csv' | 'whatsapp') => {
    try {
      setExporting(sessionId);
      const result = await exportService.exportSession(sessionId, format);
      
      await notificationService.showImmediateAlert(
        'Export Complete',
        `Session exported successfully as ${format.toUpperCase()}\nFile: ${result.filePath}`
      );
      
      if (onExportComplete) {
        onExportComplete(sessionId, format);
      }
      
      await loadSessions();
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export session data';
      Alert.alert('Export Failed', errorMessage);
    } finally {
      setExporting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount: number | undefined | null) => {
    // Handle all falsy values and non-numbers
    if (amount === undefined || amount === null || isNaN(amount) || typeof amount !== 'number') {
      console.log('formatCurrency: Invalid amount:', amount);
      return '$0.00';
    }
    // Ensure the number is valid before calling toFixed
    try {
      const formatted = `$${Number(amount).toFixed(2)}`;
      console.log('formatCurrency: Formatting', amount, 'as', formatted);
      return formatted;
    } catch (error) {
      console.warn('Error formatting currency:', amount, error);
      return '$0.00';
    }
  };

  const getTimeUntilCleanup = (cleanupAt: string | null | undefined) => {
    if (!cleanupAt) return null;
    
    const now = new Date();
    const cleanup = new Date(cleanupAt);
    const diff = cleanup.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const renderSession = ({ item }: { item: HistorySession }) => {
    const isExporting = exporting === item.id;
    const cleanupTime = getTimeUntilCleanup(item.cleanupAt);
    
    const cardStyle = [
      styles.sessionCard,
      { backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : 'white' }
    ];
    
    return (
      <View style={cardStyle}>
        <TouchableOpacity 
          style={styles.sessionHeader}
          onPress={() => handleSessionPress(item.id)}
        >
          <View style={styles.sessionInfo}>
            <Text style={[
              styles.sessionName,
              { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
            ]}>{item.name}</Text>
            <Text style={[
              styles.sessionDate,
              { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
            ]}>
              {item.completedAt ? formatDate(item.completedAt.toString()) : 'In Progress'}
            </Text>
            {cleanupTime && (
              <Text style={[
                styles.cleanupTime,
                cleanupTime === 'Expired' ? styles.expired : styles.warning
              ]}>
                {cleanupTime}
              </Text>
            )}
          </View>
          
          <View style={styles.sessionStats}>
            <Text style={[
              styles.potAmount,
              { color: isDarkMode ? DarkPokerColors.success : '#34c759' }
            ]}>{formatCurrency(item.totalPot)}</Text>
            <Text style={[
              styles.playerCount,
              { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
            ]}>{item.playerCount} players</Text>
            {item.has_export && (
              <Text style={styles.exportStatus}>✓ Exported</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={[
          styles.actionBar,
          { 
            borderTopColor: isDarkMode ? DarkPokerColors.border : '#f0f0f0',
            backgroundColor: isDarkMode ? DarkPokerColors.cardBackground : 'white'
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.exportButton,
              { borderRightColor: isDarkMode ? DarkPokerColors.border : '#f0f0f0' }
            ]}
            onPress={() => handleViewSettlement(item)}
            disabled={isExporting}
          >
            <Text style={[
              styles.exportButtonText,
              { color: isDarkMode ? DarkPokerColors.selected : '#007aff' }
            ]}>View Settlement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteSession(item)}
            disabled={isExporting}
          >
            <Text style={[
              styles.deleteButtonText,
              { color: isDarkMode ? DarkPokerColors.error : '#ff3b30' }
            ]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[
        styles.centerContainer,
        { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }
      ]}>
        <Text style={[
          styles.loadingText,
          { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
        ]}>Loading session history...</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={[
        styles.centerContainer,
        { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }
      ]}>
        <Text style={[
          styles.emptyText,
          { color: isDarkMode ? DarkPokerColors.primaryText : '#333' }
        ]}>No completed sessions found</Text>
        <Text style={[
          styles.emptySubtext,
          { color: isDarkMode ? DarkPokerColors.secondaryText : '#666' }
        ]}>
          Completed sessions will appear here for 30 days
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? DarkPokerColors.background : '#f5f5f5' }
    ]}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed - will be set dynamically
  },
  listContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cleanupTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  warning: {
    color: '#ff9500',
  },
  expired: {
    color: '#ff3b30',
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  potAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34c759',
    marginBottom: 4,
  },
  playerCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  exportStatus: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  exportButtonText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {},
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '500',
  },
});