/**
 * TransactionHistory - Component for displaying transaction timeline
 * Implements Story 1.3 AC: 4 - Buy-in history displays all transactions with timestamps
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { TransactionSummary, PlayerBalance } from '../../types/transaction';

export interface TransactionHistoryProps {
  transactions: TransactionSummary[];
  playerBalances?: PlayerBalance[];
  loading: boolean;
  onRefresh?: () => Promise<void>;
  onTransactionPress?: (transaction: TransactionSummary) => void;
  showUndoButton?: (transaction: TransactionSummary) => boolean;
  onUndo?: (transaction: TransactionSummary) => void;
  showRunningBalance?: boolean;
}

type FilterType = 'all' | 'buy_in' | 'cash_out';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  playerBalances = [],
  loading: _loading,
  onRefresh,
  onTransactionPress,
  showUndoButton,
  onUndo,
  showRunningBalance = false,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter transactions based on selected type
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') {
      return transactions;
    }
    return transactions.filter(transaction => transaction.type === filter);
  }, [transactions, filter]);

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Format transaction timestamp for display
   */
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  /**
   * Get transaction type display info
   */
  const getTransactionTypeInfo = (type: 'buy_in' | 'cash_out') => {
    switch (type) {
      case 'buy_in':
        return {
          label: 'Buy-in',
          color: '#27AE60',
          symbol: '+',
        };
      case 'cash_out':
        return {
          label: 'Cash-out',
          color: '#E74C3C',
          symbol: '-',
        };
    }
  };

  /**
   * Get player balance information for display
   */
  const getPlayerBalance = (playerId: string): PlayerBalance | undefined => {
    return playerBalances.find(balance => balance.playerId === playerId);
  };

  /**
   * Get net position indicator for a player
   */
  const getNetPositionInfo = (playerBalance: PlayerBalance) => {
    const netPosition = playerBalance.netPosition;
    if (netPosition > 0) {
      return { text: `+$${netPosition.toFixed(2)}`, color: '#27AE60', label: 'winning' };
    } else if (netPosition < 0) {
      return { text: `-$${Math.abs(netPosition).toFixed(2)}`, color: '#E74C3C', label: 'losing' };
    } else {
      return { text: '$0.00', color: '#6C757D', label: 'even' };
    }
  };

  /**
   * Render individual transaction item
   */
  const renderTransactionItem = ({ item }: { item: TransactionSummary }) => {
    const typeInfo = getTransactionTypeInfo(item.type);
    const canUndo = showUndoButton?.(item) ?? false;
    const playerBalance = getPlayerBalance(item.playerId);
    const netPositionInfo = playerBalance ? getNetPositionInfo(playerBalance) : null;

    return (
      <TouchableOpacity
        style={[
          styles.transactionItem,
          item.isVoided ? styles.voidedTransaction : null
        ]}
        onPress={() => onTransactionPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionMain}>
          {/* Transaction Type Icon */}
          <View style={[styles.typeIcon, { backgroundColor: typeInfo.color }]}>
            <Text style={styles.typeSymbol}>{typeInfo.symbol}</Text>
          </View>

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            <View style={styles.transactionHeader}>
              <Text style={styles.playerName}>{item.playerName}</Text>
              <Text style={[styles.amount, { color: typeInfo.color }]}>
                {typeInfo.symbol}${item.amount.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.transactionMeta}>
              <Text style={styles.transactionType}>{typeInfo.label}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(item.timestamp)}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.method}>
                {item.method === 'voice' ? '🎤' : '✋'} {item.method}
              </Text>
            </View>

            {/* Running Balance and Net Position */}
            {showRunningBalance && playerBalance && (
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Current Balance:</Text>
                <Text style={styles.balanceAmount}>
                  ${playerBalance.currentBalance.toFixed(2)}
                </Text>
                {netPositionInfo && (
                  <>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.netPositionLabel}>Net:</Text>
                    <Text style={[styles.netPosition, { color: netPositionInfo.color }]}>
                      {netPositionInfo.text}
                    </Text>
                  </>
                )}
              </View>
            )}

            {item.isVoided && (
              <Text style={styles.voidedLabel}>VOIDED</Text>
            )}
          </View>
        </View>

        {/* Undo Button */}
        {canUndo && !item.isVoided && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => onUndo?.(item)}
          >
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptyMessage}>
        {filter === 'all' 
          ? 'No transactions have been recorded yet'
          : `No ${filter.replace('_', '-')} transactions found`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' ? styles.filterButtonActive : null
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' ? styles.filterButtonTextActive : null
          ]}>
            All ({transactions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'buy_in' ? styles.filterButtonActive : null
          ]}
          onPress={() => setFilter('buy_in')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'buy_in' ? styles.filterButtonTextActive : null
          ]}>
            Buy-ins ({transactions.filter(t => t.type === 'buy_in').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'cash_out' ? styles.filterButtonActive : null
          ]}
          onPress={() => setFilter('cash_out')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'cash_out' ? styles.filterButtonTextActive : null
          ]}>
            Cash-outs ({transactions.filter(t => t.type === 'cash_out').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#3498DB"
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredTransactions.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498DB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6C757D',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
    lineHeight: 24,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  voidedTransaction: {
    opacity: 0.6,
    backgroundColor: '#F8F9FA',
  },
  transactionMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  transactionType: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#ADB5BD',
    marginHorizontal: 6,
  },
  timestamp: {
    fontSize: 14,
    color: '#6C757D',
  },
  method: {
    fontSize: 14,
    color: '#6C757D',
  },
  voidedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  undoButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FFC107',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  undoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '600',
    marginLeft: 4,
  },
  netPositionLabel: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
  },
  netPosition: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
});