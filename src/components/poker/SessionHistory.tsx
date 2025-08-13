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
import { Session } from '../../types/session';

interface SessionHistoryProps {
  onSessionSelect?: (sessionId: string) => void;
  onExportComplete?: (sessionId: string, format: string) => void;
}

interface HistorySession extends Session {
  has_export?: boolean;
  cleanupAt?: string;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelect,
  onExportComplete
}) => {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const sessionService = SessionService.getInstance();
  const exportService = ExportService.getInstance();
  const notificationService = NotificationService.getInstance();

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const historyData = await sessionService.getSessionHistory(30);
      setSessions(historyData);
    } catch (error) {
      console.error('Failed to load session history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session history';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionService]);

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

  const handleExportSession = (session: HistorySession) => {
    Alert.alert(
      'Export Session',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'JSON', onPress: () => exportSession(session.id, 'json') },
        { text: 'CSV', onPress: () => exportSession(session.id, 'csv') },
        { text: 'WhatsApp', onPress: () => exportSession(session.id, 'whatsapp') }
      ]
    );
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

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
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
    
    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity 
          style={styles.sessionHeader}
          onPress={() => handleSessionPress(item.id)}
        >
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{item.name}</Text>
            <Text style={styles.sessionDate}>
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
            <Text style={styles.potAmount}>{formatCurrency(item.totalPot)}</Text>
            <Text style={styles.playerCount}>{item.playerCount} players</Text>
            {item.has_export && (
              <Text style={styles.exportStatus}>✓ Exported</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={() => handleExportSession(item)}
            disabled={isExporting}
          >
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Exporting...' : 'Export'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteSession(item)}
            disabled={isExporting}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading session history...</Text>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No completed sessions found</Text>
        <Text style={styles.emptySubtext}>
          Completed sessions will appear here for 30 days
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    backgroundColor: '#f5f5f5',
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