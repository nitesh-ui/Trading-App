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
import NotificationsPage from '../../components/ui/NotificationsPage';
import { NotificationIcon } from '../../components/ui/NotificationIcon';
import WalletPage from '../../components/ui/WalletPage';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDebounce, useRenderPerformance } from '../../hooks/usePerformance';
import { queryKeys } from '../../services/queryClient';
import { sessionExpiryHandler } from '../../services/sessionExpiryHandler';
import { tradingApiService, ActiveTradeItem } from '../../services/tradingApiService';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  pnl?: number;
  productType?: string;
  priceType?: string;
  exchange?: string;
}

/**
 * Transform API trade data to UI format
 */
const transformApiTradeToUi = (apiTrade: ActiveTradeItem): Trade => {
  // Map API status to UI status
  let uiStatus: 'COMPLETED' | 'PENDING' | 'CANCELLED' = 'PENDING';
  const apiStatus = apiTrade.status.toUpperCase();
  
  if (apiStatus === 'COMPLETE') {
    uiStatus = 'COMPLETED';
  } else if (apiStatus === 'OPEN') {
    uiStatus = 'PENDING'; // Open status means trade is pending
  } else if (apiStatus === 'CANCELLED') {
    uiStatus = 'CANCELLED';
  } else {
    uiStatus = 'PENDING'; // Default to pending for any other status
  }

  return {
    id: apiTrade.activeTradeID.toString(),
    symbol: apiTrade.tradeSymbol,
    type: apiTrade.currentPosition.toUpperCase() as 'BUY' | 'SELL',
    quantity: apiTrade.qty,
    price: apiTrade.orderPrice,
    timestamp: `${apiTrade.orderDate} ${apiTrade.orderTime}`,
    status: uiStatus,
    pnl: apiTrade.profitorloss !== 0 ? apiTrade.profitorloss : undefined,
    productType: apiTrade.productType,
    priceType: apiTrade.priceType,
    exchange: apiTrade.objScriptDTO?.scriptExchange
  };
};

/**
 * Trades service using real API with session expiry handling
 */
const tradesService = {
  getTrades: async (): Promise<Trade[]> => {
    return await sessionExpiryHandler.withSessionHandling(async () => {
      const response = await tradingApiService.getActiveTrades();
      return response.data.map(transformApiTradeToUi);
    });
  },
};

/**
 * Memoized Trade Card Component for better performance
 */
const MemoizedTradeCard = memo<{
  trade: Trade;
  onPress?: (trade: Trade) => void;
  onSquareOff?: (trade: Trade) => void;
}>(({ trade, onPress, onSquareOff }) => {
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

  const handleSquareOff = useCallback(() => {
    onSquareOff?.(trade);
  }, [onSquareOff, trade]);

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
          <View style={styles.tradeDetailCenter}>
            <Text variant="caption" color="textSecondary">Price</Text>
            <Text variant="body" color="text" weight="medium">₹{trade.price.toFixed(2)}</Text>
          </View>
          {trade.pnl !== undefined && (
            <View style={styles.tradeDetailRight}>
              <Text variant="caption" color="textSecondary">P&L</Text>
              <Text 
                variant="body" 
                weight="medium"
                style={{ color: getPnLColor(trade.pnl) }}
              >
                {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.tradeFooter}>
          <Text variant="caption" color="textSecondary" style={styles.timestamp}>
            {trade.timestamp}
          </Text>
          
          {/* Square Off Button for Completed Trades */}
          {trade.status === 'COMPLETED' && (
            <TouchableOpacity 
              style={[styles.squareOffButton, { 
                backgroundColor: theme.colors.error + '15',
                borderColor: theme.colors.error 
              }]}
              onPress={handleSquareOff}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle-outline" 
                size={14} 
                color={theme.colors.error} 
                style={{ marginRight: 4 }}
              />
              <Text 
                variant="caption" 
                weight="semibold"
                style={{ color: theme.colors.error }}
              >
                Square Off
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  const { showNotification } = useNotification();
  
  // Performance monitoring
  useRenderPerformance('TradesScreen');
  
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Modal states
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);

  // React Query for optimized data fetching
  const { 
    data: trades = [], 
    isLoading, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: queryKeys.userTrades(),
    queryFn: tradesService.getTrades,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Memoized filtered data
  const filteredTrades = useMemo(() => {
    let filtered: Trade[] = trades;
    
    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter((trade: Trade) => trade.status === selectedFilter);
    }
    
    // Filter by search query
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((trade: Trade) => 
        trade.symbol.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [trades, selectedFilter, debouncedSearchQuery]);

  // Get completed trades for square off all functionality
  const completedTrades = useMemo(() => {
    return trades.filter((trade: Trade) => trade.status === 'COMPLETED');
  }, [trades]);

  // Check if we should show "Square Off All" button
  const showSquareOffAll = selectedFilter === 'ALL' && completedTrades.length > 0;

  // Callbacks
  const handleTradePress = useCallback((trade: Trade) => {
    // Handle trade details navigation
    console.log('Trade selected:', trade);
  }, []);

  const handleSquareOff = useCallback(async (trade: Trade) => {
    // Handle square off action with confirmation
    console.log('Square off trade:', trade);
    
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to square off ${trade.quantity} ${trade.symbol}?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // For mobile, we'll proceed directly for now
      // In a real app, you might want to implement a custom modal
      confirmed = true;
    }
    
    if (confirmed) {
      try {
        // Show processing notification
        showNotification({
          type: 'info',
          title: 'Processing Square Off',
          message: `Placing square off order for ${trade.symbol}...`
        });
        
        // Call square off API
        const result = await tradingApiService.squareOffTrade(trade.id);
        
        if (result.success) {
          showNotification({
            type: 'success',
            title: 'Square Off Successful',
            message: result.message
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Square Off Failed',
            message: result.message
          });
        }
        
        // Refresh the trades list after square off attempt
        refetch();
      } catch (error) {
        console.error('❌ Error in square off:', error);
        showNotification({
          type: 'error',
          title: 'Square Off Failed',
          message: 'An error occurred while placing square off order'
        });
      }
    }
  }, [showNotification, refetch]);

  const handleSquareOffAll = useCallback(async () => {
    // Handle square off all completed trades
    const completedCount = completedTrades.length;
    
    if (completedCount === 0) {
      showNotification({
        type: 'warning',
        title: 'No Completed Trades',
        message: 'There are no completed trades to square off'
      });
      return;
    }
    
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to square off all ${completedCount} completed position${completedCount > 1 ? 's' : ''}?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // For mobile, we'll proceed directly for now
      // In a real app, you might want to implement a custom modal
      confirmed = true;
    }
    
    if (confirmed) {
      try {
        // Show processing notification
        showNotification({
          type: 'info',
          title: 'Processing Square Off All',
          message: `Placing square off orders for ${completedCount} position${completedCount > 1 ? 's' : ''}...`
        });
        
        // Square off all completed trades
        const results = await Promise.allSettled(
          completedTrades.map(trade => tradingApiService.squareOffTrade(trade.id))
        );
        
        // Count successful and failed operations
        const successful = results.filter(result => 
          result.status === 'fulfilled' && result.value.success
        ).length;
        const failed = completedCount - successful;
        
        // Show appropriate notification
        if (failed === 0) {
          showNotification({
            type: 'success',
            title: 'All Positions Squared Off',
            message: `Successfully squared off all ${successful} position${successful > 1 ? 's' : ''}`
          });
        } else if (successful === 0) {
          showNotification({
            type: 'error',
            title: 'Square Off Failed',
            message: `Failed to square off all ${failed} position${failed > 1 ? 's' : ''}`
          });
        } else {
          showNotification({
            type: 'warning',
            title: 'Partial Success',
            message: `Squared off ${successful} position${successful > 1 ? 's' : ''}, ${failed} failed`
          });
        }
        
        // Refresh the trades list after square off attempt
        refetch();
      } catch (error) {
        console.error('❌ Error in square off all:', error);
        showNotification({
          type: 'error',
          title: 'Square Off All Failed',
          message: 'An error occurred while placing square off orders'
        });
      }
    }
  }, [completedTrades, showNotification, refetch]);

  const handleWalletPress = useCallback(() => {
    setIsWalletPageVisible(true);
  }, []);

  const handleNotificationPress = useCallback(() => {
    setIsNotificationsPageVisible(true);
  }, []);

  const handleCloseNotificationsPage = useCallback(() => {
    setIsNotificationsPageVisible(false);
  }, []);

  const handleCloseWalletPage = useCallback(() => {
    setIsWalletPageVisible(false);
  }, []);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderTradeItem = useCallback(({ item }: { item: Trade }) => (
    <MemoizedTradeCard
      trade={item}
      onPress={handleTradePress}
      onSquareOff={handleSquareOff}
    />
  ), [handleTradePress, handleSquareOff]);

  const keyExtractor = useCallback((item: Trade) => item.id, []);

  // Header component for the trades list
  const renderListHeader = useCallback(() => {
    if (!showSquareOffAll) return null;
    
    return (
      <View style={styles.listHeader}>
        <TouchableOpacity 
          style={[styles.squareOffAllButton, { 
            backgroundColor: theme.colors.error + '15',
            borderColor: theme.colors.error 
          }]}
          onPress={handleSquareOffAll}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="close-circle" 
            size={16} 
            color={theme.colors.error} 
            style={{ marginRight: 6 }}
          />
          <Text 
            variant="body" 
            weight="semibold"
            style={{ color: theme.colors.error }}
          >
            Square Off All ({completedTrades.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [showSquareOffAll, theme.colors.error, handleSquareOffAll, completedTrades.length]);

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
              
              <NotificationIcon
                onPress={handleNotificationPress}
                color={theme.colors.primary}
                backgroundColor={theme.colors.surface}
                borderColor={theme.colors.border}
              />
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
            ListHeaderComponent={renderListHeader}
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

        {/* Notifications Page */}
        <NotificationsPage
          visible={isNotificationsPageVisible}
          onClose={handleCloseNotificationsPage}
        />

        {/* Wallet Page */}
        <WalletPage
          visible={isWalletPageVisible}
          onClose={handleCloseWalletPage}
        />
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
    paddingHorizontal: 0, // Remove horizontal padding since header has its own
    paddingBottom: 20,
  },
  tradeCard: {
    marginBottom: 8,
    marginHorizontal: 16, // Add horizontal margin for individual cards
    padding: 12
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
  tradeDetailCenter: {
    alignItems: 'center',
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
    flex: 1,
  },
  tradeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  squareOffButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  squareOffAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  detailItem: {
    alignItems: 'center',
  },
});
