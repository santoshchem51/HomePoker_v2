/**
 * VirtualizedTransactionHistory - Virtualized transaction list for large datasets
 * Implements Story 5.2 AC: 5 - Lazy loading for large transaction lists
 * Enhanced with pagination, search, and infinite scroll performance optimization
 */
import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { TransactionSummary, PlayerBalance } from '../../types/transaction';
import { useStableCallback } from '../../utils/component-optimization';

export interface VirtualizedTransactionHistoryProps {
  sessionId: string;
  onLoadTransactions: (
    sessionId: string,
    page: number,
    limit: number,
    filter?: 'all' | 'buy_in' | 'cash_out',
    searchTerm?: string
  ) => Promise<{
    transactions: TransactionSummary[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>;
  playerBalances?: PlayerBalance[];
  onTransactionPress?: (transaction: TransactionSummary) => void;
  showUndoButton?: (transaction: TransactionSummary) => boolean;
  onUndo?: (transaction: TransactionSummary) => void;
  showRunningBalance?: boolean;
  pageSize?: number;
}

type FilterType = 'all' | 'buy_in' | 'cash_out';

const ITEM_HEIGHT = 120; // Estimated item height for getItemLayout
const SEARCH_DEBOUNCE_MS = 300;

const VirtualizedTransactionHistoryComponent: React.FC<VirtualizedTransactionHistoryProps> = ({
  sessionId,
  onLoadTransactions,
  playerBalances = [],
  onTransactionPress,
  showUndoButton,
  onUndo,
  showRunningBalance = false,
  pageSize = 50,
}) => {
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Search debouncing
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  /**
   * Load transactions with pagination support
   */
  const loadTransactions = useStableCallback(async (reset: boolean = false) => {
    if (loading || loadingMore) return;

    const page = reset ? 0 : currentPage;
    
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await onLoadTransactions(
        sessionId,
        page,
        pageSize,
        filter,
        debouncedSearchTerm || undefined
      );

      if (reset) {
        setTransactions(result.transactions);
        setCurrentPage(0);
      } else {
        setTransactions(prev => [...prev, ...result.transactions]);
      }

      setHasMore(result.hasMore);
      setTotalCount(result.totalCount);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sessionId, filter, debouncedSearchTerm, onLoadTransactions, pageSize, loading, loadingMore, currentPage]);

  // Load initial data and handle filter/search changes
  useEffect(() => {
    loadTransactions(true);
  }, [loadTransactions]);

  /**
   * Handle refresh action
   */
  const handleRefresh = useStableCallback(async () => {
    setRefreshing(true);
    try {
      await loadTransactions(true);
    } finally {
      setRefreshing(false);
    }
  }, [loadTransactions]);

  /**
   * Handle load more on end reached
   */
  const handleLoadMore = useStableCallback(() => {
    if (hasMore && !loading && !loadingMore) {
      setCurrentPage(prev => prev + 1);
      loadTransactions(false);
    }
  }, [hasMore, loading, loadingMore, loadTransactions]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setCurrentPage(0);
    setTransactions([]);
  }, [filter]);

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((text: string) => {
    setSearchTerm(text);
    setCurrentPage(0);
    setTransactions([]);
  }, []);

  // Memoized transaction counts for filter buttons
  const transactionCounts = useMemo(() => ({
    all: totalCount,
    buy_in: transactions.filter(t => t.type === 'buy_in').length,
    cash_out: transactions.filter(t => t.type === 'cash_out').length,
  }), [transactions, totalCount]);

  /**
   * Format timestamp for display - memoized
   */
  const formatTimestamp = useCallback((timestamp: Date): string => {
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
  }, []);

  /**
   * Get transaction type display info - memoized
   */
  const getTransactionTypeInfo = useCallback((type: 'buy_in' | 'cash_out') => {
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
  }, []);

  /**
   * Get player balance information for display - memoized
   */
  const getPlayerBalance = useCallback((playerId: string): PlayerBalance | undefined => {
    return playerBalances.find(balance => balance.playerId === playerId);
  }, [playerBalances]);

  /**
   * Get net position indicator for a player - memoized
   */
  const getNetPositionInfo = useCallback((playerBalance: PlayerBalance) => {
    const netPosition = playerBalance.netPosition;
    if (netPosition > 0) {
      return { text: `+$${netPosition.toFixed(2)}`, color: '#27AE60', label: 'winning' };
    } else if (netPosition < 0) {
      return { text: `-$${Math.abs(netPosition).toFixed(2)}`, color: '#E74C3C', label: 'losing' };
    } else {
      return { text: '$0.00', color: '#6C757D', label: 'even' };
    }
  }, []);

  /**
   * Render individual transaction item - memoized for virtualization performance
   */
  const renderTransactionItem = useCallback(({ item }: { item: TransactionSummary }) => {
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
  }, [
    getTransactionTypeInfo,
    showUndoButton,
    getPlayerBalance,
    getNetPositionInfo,
    onTransactionPress,
    showRunningBalance,
    onUndo,
    formatTimestamp
  ]);

  /**
   * Get item layout for virtualization performance
   */
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  /**
   * Extract key for item - optimized for virtualization
   */
  const keyExtractor = useCallback((item: TransactionSummary) => item.id, []);

  /**
   * Render empty state
   */
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Transactions</Text>
      <Text style={styles.emptyMessage}>
        {filter === 'all' 
          ? 'No transactions have been recorded yet'
          : `No ${filter.replace('_', '-')} transactions found`
        }
      </Text>
    </View>
  ), [filter]);

  /**
   * Render footer with load more indicator
   */
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#3498DB" />
        <Text style={styles.loadMoreText}>Loading more transactions...</Text>
      </View>
    );
  }, [loadingMore]);

  if (loading && transactions.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchTerm}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearchChange('')}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' ? styles.filterButtonActive : null
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'all' ? styles.filterButtonTextActive : null
          ]}>
            All ({transactionCounts.all})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'buy_in' ? styles.filterButtonActive : null
          ]}
          onPress={() => handleFilterChange('buy_in')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'buy_in' ? styles.filterButtonTextActive : null
          ]}>
            Buy-ins
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'cash_out' ? styles.filterButtonActive : null
          ]}
          onPress={() => handleFilterChange('cash_out')}
        >
          <Text style={[
            styles.filterButtonText,
            filter === 'cash_out' ? styles.filterButtonTextActive : null
          ]}>
            Cash-outs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Virtualized Transaction List */}
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderTransactionItem}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3498DB"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          transactions.length === 0 ? styles.emptyContainer : styles.listContent
        }
        // Virtualization optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={10}
        getItemLayout={getItemLayout}
        // Additional performance optimizations
        disableVirtualization={false}
        legacyImplementation={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  clearButton: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ADB5BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6C757D',
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

// Memoized export for performance optimization
export const VirtualizedTransactionHistory = memo(VirtualizedTransactionHistoryComponent, (prevProps, nextProps) => {
  return (
    prevProps.sessionId === nextProps.sessionId &&
    prevProps.playerBalances === nextProps.playerBalances &&
    prevProps.onLoadTransactions === nextProps.onLoadTransactions &&
    prevProps.onTransactionPress === nextProps.onTransactionPress &&
    prevProps.showUndoButton === nextProps.showUndoButton &&
    prevProps.onUndo === nextProps.onUndo &&
    prevProps.showRunningBalance === nextProps.showRunningBalance &&
    prevProps.pageSize === nextProps.pageSize
  );
});

// Set display name for debugging
VirtualizedTransactionHistory.displayName = 'VirtualizedTransactionHistory';