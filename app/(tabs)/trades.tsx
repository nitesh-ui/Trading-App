/**
 * Trades Screen - Production Optimized
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 1. React Query for efficient data fetching and caching
 * 2. Memoized components to prevent unnecessary re-renders
 * 3. OptimizedFlatList with ListHeaderComponent to avoid VirtualizedList nesting
 * 4. Debounced sear          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text 
                  variant="caption" 
                  weight="medium"
                  style={{ color: selectedFilter === filter ? 'white' : theme.colors.text }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>ng operations
 * 5. Callback memoization for stable references
 * 6. Custom comparison in memo() for selective re-renders
 * 7. Suspense boundary for loading states
 * 8. Error boundary for crash protection
 * 9. Performance monitoring hooks
 * 10. Efficient key extraction and item rendering
 * 
 * STRUCTURE:
 * - Fixed header with filter tabs (positioned absolutely)
 * - Single FlatList with header component (no nesting)
 * - Memoized trade cards with optimized shouldUpdate
 * - Refresh control for pull-to-refresh
 */

import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { memo, Suspense, useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from '../../components/atomic';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { StockCardSkeleton } from '../../components/LoadingComponents';
import { OptimizedFlatList } from '../../components/OptimizedList';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDebounce, useRenderPerformance } from '../../hooks/usePerformance';
import { queryKeys } from '../../services/queryClient';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  pnl?: number;
}

const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'RELIANCE',
    type: 'BUY',
    quantity: 10,
    price: 2850.50,
    timestamp: '2024-01-15 14:30:25',
    status: 'COMPLETED',
    pnl: 150.25,
  },
  {
    id: '2',
    symbol: 'TCS',
    type: 'SELL',
    quantity: 5,
    price: 3875.20,
    timestamp: '2024-01-15 13:45:12',
    status: 'COMPLETED',
    pnl: -75.50,
  },
  {
    id: '3',
    symbol: 'HDFCBANK',
    type: 'BUY',
    quantity: 15,
    price: 1680.75,
    timestamp: '2024-01-15 12:20:45',
    status: 'PENDING',
  },
  {
    id: '4',
    symbol: 'INFY',
    type: 'SELL',
    quantity: 8,
    price: 1795.30,
    timestamp: '2024-01-15 11:15:30',
    status: 'COMPLETED',
    pnl: 85.40,
  },
];

/**
 * Mock trades service - replace with real API calls
 */
const mockTradesService = {
  getTrades: async (): Promise<Trade[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockTrades;
  },
};

/**
 * Memoized Trade Card Component for better performance
 */
const MemoizedTradeCard = memo<{
  trade: Trade;
  onPress?: (trade: Trade) => void;
}>(({ trade, onPress }) => {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return theme.colors.success;
      case 'PENDING':
        return theme.colors.warning;
      case 'CANCELLED':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPnLColor = (pnl?: number) => {
    if (!pnl) return theme.colors.textSecondary;
    return pnl >= 0 ? theme.colors.success : theme.colors.error;
  };

  const handlePress = useCallback(() => {
    onPress?.(trade);
  }, [onPress, trade]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.tradeCard}>
        <View style={styles.tradeHeader}>
          <View style={styles.tradeSymbol}>
            <Text variant="body" weight="semibold" color="text">
              {trade.symbol}
            </Text>
            <View style={[styles.typeIndicator, { 
              backgroundColor: trade.type === 'BUY' ? theme.colors.success : theme.colors.error 
            }]}>
              <Text variant="caption" style={{ color: theme.colors.surface }}>
                {trade.type}
              </Text>
            </View>
          </View>
          <View style={styles.tradeStatus}>
            <Text 
              variant="caption" 
              weight="medium"
              style={{ color: getStatusColor(trade.status) }}
            >
              {trade.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.tradeDetails}>
          <View style={styles.tradeDetailLeft}>
            <Text variant="caption" color="textSecondary">Quantity</Text>
            <Text variant="body" color="text" weight="medium">{trade.quantity}</Text>
          </View>
          <View style={styles.tradeDetailRight}>
            <Text variant="caption" color="textSecondary">Price</Text>
            <Text variant="body" color="text" weight="medium">₹{trade.price.toFixed(2)}</Text>
          </View>
        </View>
        
        <Text variant="caption" color="textSecondary" style={styles.timestamp}>
          {trade.timestamp}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.trade.id === nextProps.trade.id &&
    prevProps.trade.status === nextProps.trade.status &&
    prevProps.trade.pnl === nextProps.trade.pnl
  );
});

MemoizedTradeCard.displayName = 'MemoizedTradeCard';

export default function TradesScreen() {
  const { theme } = useTheme();
  const { showNotification, notificationCount } = useNotification();
  
  // Performance monitoring
  useRenderPerformance('TradesScreen');
  
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // React Query for optimized data fetching
  const { 
    data: trades = [], 
    isLoading, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: queryKeys.userTrades(),
    queryFn: mockTradesService.getTrades,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Memoized filtered data
  const filteredTrades = useMemo(() => {
    let filtered = trades;
    
    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(trade => trade.status === selectedFilter);
    }
    
    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [trades, selectedFilter, debouncedSearchQuery]);

  // Callbacks
  const handleTradePress = useCallback((trade: Trade) => {
    // Handle trade details navigation
    console.log('Trade selected:', trade);
  }, []);

  const handleWalletPress = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Wallet feature is under development',
      duration: 3000,
    });
  }, [showNotification]);

  const handleNotificationPress = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Notifications feature is under development',
      duration: 3000,
    });
  }, [showNotification]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderTradeItem = useCallback(({ item }: { item: Trade }) => (
    <MemoizedTradeCard
      trade={item}
      onPress={handleTradePress}
    />
  ), [handleTradePress]);

  const keyExtractor = useCallback((item: Trade) => item.id, []);

  return (
    <ScreenErrorBoundary screenName="Trades">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Fixed Header */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
          <View style={styles.statusBarSpacer} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="headline" weight="bold" color="text">
                Trades
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]} 
                onPress={handleWalletPress}
              >
                <Ionicons name="wallet" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, position: 'relative' }]} 
                onPress={handleNotificationPress}
              >
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                {notificationCount > 0 && (
                  <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                    <Text style={styles.notificationText}>
                      {notificationCount > 99 ? '99+' : notificationCount.toString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterContainer, { backgroundColor: 'transparent' }]}
            contentContainerStyle={styles.filterContainer}
          >
            {['ALL', 'COMPLETED', 'PENDING', 'CANCELLED'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text 
                  variant="caption" 
                  weight="medium"
                  style={{ color: selectedFilter === filter ? 'white' : theme.colors.text, textAlign: 'center' }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Single Optimized FlatList with Header - No Nesting */}
        <Suspense fallback={<StockCardSkeleton />}>
          <OptimizedFlatList
            data={filteredTrades}
            renderItem={renderTradeItem}
            keyExtractor={keyExtractor}
            isLoading={isLoading}
            loadingComponent={StockCardSkeleton}
            estimatedItemSize={140}
            windowSize={10}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tradesListContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
          />
        </Suspense>
      </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backdropFilter: 'blur(10px)', // Web only
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 200 : 220, // Space for fixed header with filter tabs
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80, // Ensure minimum width for better touch targets
  },
  tradesList: {
    flex: 1,
  },
  tradesListContent: {
    paddingTop: Platform.OS === 'ios' ? 180 : 200, // Reduced space for fixed header with filter tabs
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tradeCard: {
    marginBottom: 8,
    marginHorizontal: 0, // Remove horizontal margin to match other cards
    padding: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android shadow
    elevation: 3,
    borderRadius: 12, // Adding border radius for better shadow appearance
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tradeLeft: {
    flex: 1,
  },
  tradeRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 0,
  },
  tradeDetailLeft: {
    alignItems: 'flex-start',
  },
  tradeDetailRight: {
    alignItems: 'flex-end',
  },
  tradeSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tradeStatus: {
    alignItems: 'flex-end',
  },
  timestamp: {
    marginTop: 4,
  },
  detailItem: {
    alignItems: 'center',
  },
});
