import React, { memo, useMemo, useCallback, useState } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl } from 'react-native';
interface Transaction {
  id: string;
  amount: number;
  type: 'buy-in' | 'cash-out';
  timestamp: number;
  playerId: string;
}

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  pageSize?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const VirtualizedTransactionList = memo<VirtualizedTransactionListProps>(({
  transactions,
  onTransactionPress: _onTransactionPress,
  pageSize = 50,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);

  // Memoize data preparation for large lists with proper pagination
  const virtualizedData = useMemo(() => {
    return transactions.length > pageSize ? transactions.slice(0, pageSize) : transactions;
  }, [transactions, pageSize]);

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.playerName}>Player {item.playerId}</Text>
      <Text style={styles.amount}>${item.amount}</Text>
      <Text style={styles.type}>{item.type}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  ), []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh]);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  return (
    <FlatList
      data={virtualizedData}
      renderItem={renderTransaction}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={true}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        ) : undefined
      }
      style={styles.container}
      testID="virtualized-transaction-list"
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 80,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  type: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
});

VirtualizedTransactionList.displayName = 'VirtualizedTransactionList';

export default VirtualizedTransactionList;