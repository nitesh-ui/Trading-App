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
import { useFocusEffect } from '@react-navigation/native';
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
import EditTradeTargetPage from '../../components/ui/EditTradeTargetPage';
import EditPendingTradePage from '../../components/ui/EditPendingTradePage';
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
  // Original API fields needed for square-off and editing
  activeTradeID: number;
  apiStatus: string;
  target?: string;
  stopLoss?: string;
  // Additional fields for proceedBuySell API
  intWID?: number;
  scriptCode?: number;
  triggerPrice?: string;
  tradinG_UNIT?: number;
}

/**
 * Transform API trade data to UI format
 * Note: intWID and scriptCode will be fetched in edit modals when needed
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
    exchange: apiTrade.objScriptDTO?.scriptExchange,
    // Original API fields needed for square-off and editing
    activeTradeID: apiTrade.activeTradeID,
    apiStatus: apiTrade.status,
    target: apiTrade.tgT2 ? apiTrade.tgT2.toString() : undefined,
    stopLoss: apiTrade.sl ? apiTrade.sl.toString() : undefined,
    // Additional fields for proceedBuySell API
    // Note: intWID and scriptCode will be fetched from watchlist in edit modals
    intWID: 0, // Will be populated in edit modal
    scriptCode: 0, // Will be populated in edit modal
    triggerPrice: apiTrade.triggerPrice,
    tradinG_UNIT: parseFloat(apiTrade.tradinG_UNIT) || 0,
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
  onEdit?: (trade: Trade) => void;
  onEditPending?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
}>(({ trade, onPress, onSquareOff, onEdit, onEditPending, onDelete }) => {
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

  const handleEdit = useCallback((e: any) => {
    e?.stopPropagation?.();
    onEdit?.(trade);
  }, [onEdit, trade]);

  const handleEditPending = useCallback((e: any) => {
    e?.stopPropagation?.();
    onEditPending?.(trade);
  }, [onEditPending, trade]);

  const handleDelete = useCallback((e: any) => {
    e?.stopPropagation?.();
    onDelete?.(trade);
  }, [onDelete, trade]);

  // Debug: Log trade status to help identify why icons might not show
  if (trade.status === 'PENDING') {
    console.log('🔍 Pending trade:', {
      symbol: trade.symbol,
      status: trade.status,
      apiStatus: trade.apiStatus,
      shouldShowIcons: trade.status === 'PENDING' && trade.apiStatus === 'OPEN'
    });
  }

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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text 
                variant="caption" 
                weight="medium"
                style={{ color: getStatusColor(trade.status) }}
              >
                {trade.status === 'COMPLETED' ? 'ACTIVE' : trade.status}
              </Text>
              {/* Edit icon for completed/active trades */}
              {trade.status === 'COMPLETED' && trade.apiStatus.toUpperCase() === 'COMPLETE' && (
                <TouchableOpacity 
                  onPress={handleEdit}
                  style={{ padding: 4 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons 
                    name="create-outline" 
                    size={18} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
              {/* Edit and Delete icons for pending trades */}
              {trade.status === 'PENDING' && trade.apiStatus.toUpperCase() === 'OPEN' && (
                <>
                  <TouchableOpacity 
                    onPress={handleEditPending}
                    style={{ padding: 4 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name="create-outline" 
                      size={18} 
                      color={theme.colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleDelete}
                    style={{ padding: 4 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name="trash-outline" 
                      size={18} 
                      color={theme.colors.error} 
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>
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

        {/* Target and Stop Loss Row */}
        <View style={styles.targetStopLossRow}>
          <View style={styles.targetStopLossLeft}>
            <Text variant="caption" color="textSecondary">Target</Text>
            <Text variant="caption" color="text" weight="medium">
              {trade.target && parseFloat(trade.target) > 0 
                ? `₹${parseFloat(trade.target).toFixed(2)}` 
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.targetStopLossRight}>
            <Text variant="caption" color="textSecondary">Stop Loss</Text>
            <Text variant="caption" color="text" weight="medium">
              {trade.stopLoss && parseFloat(trade.stopLoss) > 0 
                ? `₹${parseFloat(trade.stopLoss).toFixed(2)}` 
                : 'N/A'}
            </Text>
          </View>
        </View>
        
        <View style={styles.tradeFooter}>
          <Text variant="caption" color="textSecondary" style={styles.timestamp}>
            {trade.timestamp}
          </Text>
          
          {/* Square Off Button for Completed (Active) Trades */}
          {trade.status === 'COMPLETED' && trade.apiStatus.toUpperCase() === 'COMPLETE' && (
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
          
          {/* Square Off Button for Pending Trades */}
          {trade.status === 'PENDING' && trade.apiStatus.toUpperCase() === 'OPEN' && (
            <TouchableOpacity 
              style={[styles.squareOffButton, { 
                backgroundColor: theme.colors.warning + '15',
                borderColor: theme.colors.warning 
              }]}
              onPress={handleSquareOff}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="close-circle-outline" 
                size={14} 
                color={theme.colors.warning} 
                style={{ marginRight: 4 }}
              />
              <Text 
                variant="caption" 
                weight="semibold"
                style={{ color: theme.colors.warning }}
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
  const [isEditTradePageVisible, setIsEditTradePageVisible] = useState(false);
  const [selectedTradeForEdit, setSelectedTradeForEdit] = useState<Trade | null>(null);
  const [isEditPendingTradePageVisible, setIsEditPendingTradePageVisible] = useState(false);
  const [selectedPendingTradeForEdit, setSelectedPendingTradeForEdit] = useState<Trade | null>(null);
  
  // Real-time polling state
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // React Query for optimized data fetching with real-time polling
  // Only poll when screen is focused AND polling is enabled
  const { 
    data: trades = [], 
    isLoading, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: queryKeys.userTrades(),
    queryFn: tradesService.getTrades,
    staleTime: 0, // Always consider data stale for real-time updates
    refetchInterval: (isPollingEnabled && isScreenFocused) ? 2000 : false, // Only poll when screen is focused and enabled
    refetchIntervalInBackground: false, // Don't poll when app is in background
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });



  // Track screen focus state and refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Trades screen focused, enabling polling and refreshing data');
      setIsScreenFocused(true);
      refetch();
      
      return () => {
        console.log('⏸️ Trades screen unfocused, disabling polling');
        setIsScreenFocused(false);
      };
    }, [refetch])
  );

  // Log polling status changes
  React.useEffect(() => {
    const isActive = isPollingEnabled && isScreenFocused;
    console.log(`📊 Trades polling ${isActive ? 'ACTIVE' : 'INACTIVE'} - User toggle: ${isPollingEnabled ? 'ON' : 'OFF'}, Screen: ${isScreenFocused ? 'FOCUSED' : 'UNFOCUSED'}`);
  }, [isPollingEnabled, isScreenFocused]);

  // Log data updates
  React.useEffect(() => {
    if (trades.length > 0) {
      console.log(`✅ Trades data updated: ${trades.length} trades loaded`);
    }
  }, [trades]);

  // Memoized filtered data
  const filteredTrades = useMemo(() => {
    let filtered: Trade[] = trades;
    
    // Filter by status - map ACTIVE to COMPLETED
    if (selectedFilter !== 'ALL') {
      const statusFilter = selectedFilter === 'ACTIVE' ? 'COMPLETED' : selectedFilter;
      filtered = filtered.filter((trade: Trade) => trade.status === statusFilter);
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

  // Get completed and pending trades for square off all functionality
  const squareOffableTrades = useMemo(() => {
    return trades.filter((trade: Trade) => 
      (trade.status === 'COMPLETED' && trade.apiStatus.toUpperCase() === 'COMPLETE') ||
      (trade.status === 'PENDING' && trade.apiStatus.toUpperCase() === 'OPEN')
    );
  }, [trades]);

  // Check if we should show "Square Off All" button
  const showSquareOffAll = selectedFilter === 'ALL' && squareOffableTrades.length > 0;

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
        // showNotification({
        //   type: 'info',
        //   title: 'Processing Square Off',
        //   message: `Placing square off order for ${trade.symbol}...`
        // });
        
        // Call square off API
        const result = await tradingApiService.squareOffTrade(
          trade.activeTradeID,
          trade.apiStatus,
          trade.quantity
        );
        
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
    // Handle square off all active and pending trades
    const totalCount = squareOffableTrades.length;
    const activeCount = squareOffableTrades.filter(t => t.status === 'COMPLETED').length;
    const pendingCount = squareOffableTrades.filter(t => t.status === 'PENDING').length;
    
    if (totalCount === 0) {
      showNotification({
        type: 'warning',
        title: 'No Trades to Square Off',
        message: 'There are no active or pending trades to square off'
      });
      return;
    }
    
    // Show confirmation dialog with breakdown
    let confirmMessage = `Are you sure you want to square off all ${totalCount} position${totalCount > 1 ? 's' : ''}?`;
    if (activeCount > 0 && pendingCount > 0) {
      confirmMessage = `Are you sure you want to square off ${activeCount} active and ${pendingCount} pending position${totalCount > 1 ? 's' : ''}?`;
    }
    
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
        // Square off all active and pending trades
        const results = await Promise.allSettled(
          squareOffableTrades.map((trade: Trade) => tradingApiService.squareOffTrade(
            trade.activeTradeID,
            trade.apiStatus,
            trade.quantity
          ))
        );
        
        // Count successful and failed operations
        const successful = results.filter((result: any) => 
          result.status === 'fulfilled' && result.value.success
        ).length;
        const failed = totalCount - successful;
        
        // Show appropriate notification
        if (failed === 0) {
          showNotification({
            type: 'success',
            title: 'All Positions Squared Off',
            message: `Successfully squared off all ${successful} position${successful > 1 ? 's' : ''} (${activeCount} active, ${pendingCount} pending)`
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
  }, [squareOffableTrades, showNotification, refetch]);

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

  const handleEditTrade = useCallback((trade: Trade) => {
    setSelectedTradeForEdit(trade);
    setIsEditTradePageVisible(true);
  }, []);

  const handleCloseEditTradePage = useCallback(() => {
    setIsEditTradePageVisible(false);
    setSelectedTradeForEdit(null);
  }, []);

  const handleSaveTradeEdit = useCallback(() => {
    // Refresh trades list after saving
    refetch();
  }, [refetch]);

  const handleEditPendingTrade = useCallback((trade: Trade) => {
    setSelectedPendingTradeForEdit(trade);
    setIsEditPendingTradePageVisible(true);
  }, []);

  const handleClosePendingTradeEditPage = useCallback(() => {
    setIsEditPendingTradePageVisible(false);
    setSelectedPendingTradeForEdit(null);
  }, []);

  const handleSavePendingTradeEdit = useCallback(() => {
    // Refresh trades list after saving
    refetch();
  }, [refetch]);

  const handleDeleteTrade = useCallback(async (trade: Trade) => {
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to delete this pending order for ${trade.quantity} ${trade.symbol}?`;
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
        // Call delete API
        const result = await tradingApiService.deleteActiveTrade(trade.activeTradeID);
        
        if (result.success) {
          showNotification({
            type: 'success',
            title: 'Trade Deleted',
            message: result.message
          });
        } else {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: result.message
          });
        }
        
        // Refresh the trades list after delete attempt
        refetch();
      } catch (error) {
        console.error('❌ Error deleting trade:', error);
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'An error occurred while deleting the trade'
        });
      }
    }
  }, [showNotification, refetch]);

  const togglePolling = useCallback(() => {
    setIsPollingEnabled(prev => !prev);
  }, [isPollingEnabled, showNotification]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderTradeItem = useCallback(({ item }: { item: Trade }) => (
    <MemoizedTradeCard
      trade={item}
      onPress={handleTradePress}
      onSquareOff={handleSquareOff}
      onEdit={handleEditTrade}
      onEditPending={handleEditPendingTrade}
      onDelete={handleDeleteTrade}
    />
  ), [handleTradePress, handleSquareOff, handleEditTrade, handleEditPendingTrade, handleDeleteTrade]);

  const keyExtractor = useCallback((item: Trade) => item.id, []);

  // Header component for the trades list
  const renderListHeader = useCallback(() => {
    if (!showSquareOffAll) return null;
    
    const activeCount = squareOffableTrades.filter(t => t.status === 'COMPLETED').length;
    const pendingCount = squareOffableTrades.filter(t => t.status === 'PENDING').length;
    
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
            Square Off All ({squareOffableTrades.length})
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [showSquareOffAll, theme.colors.error, handleSquareOffAll, squareOffableTrades]);

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
              {/* Real-time indicator */}
              <View style={styles.realtimeIndicator}>
                <View style={[
                  styles.realtimeDot, 
                  { backgroundColor: isPollingEnabled ? theme.colors.success : theme.colors.textSecondary }
                ]} />
                <Text variant="caption" color="textSecondary">
                  {isPollingEnabled ? 'Live' : 'Paused'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {/* Polling toggle button */}
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: isPollingEnabled ? theme.colors.success + '20' : theme.colors.surface,
                    borderColor: isPollingEnabled ? theme.colors.success : theme.colors.border,
                    borderWidth: 1 
                  }
                ]} 
                onPress={togglePolling}
              >
                <Ionicons 
                  name={isPollingEnabled ? "pulse" : "pause"} 
                  size={20} 
                  color={isPollingEnabled ? theme.colors.success : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              
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
            {['ALL', 'ACTIVE', 'PENDING', 'CANCELLED'].map((filter) => (
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

        {/* Edit Trade Target/Stop Loss Page */}
        {selectedTradeForEdit && (
          <EditTradeTargetPage
            visible={isEditTradePageVisible}
            onClose={handleCloseEditTradePage}
            trade={{
              id: selectedTradeForEdit.id,
              symbol: selectedTradeForEdit.symbol,
              type: selectedTradeForEdit.type,
              quantity: selectedTradeForEdit.quantity,
              price: selectedTradeForEdit.price,
              activeTradeID: selectedTradeForEdit.activeTradeID,
              currentTarget: selectedTradeForEdit.target,
              currentStopLoss: selectedTradeForEdit.stopLoss,
              productType: selectedTradeForEdit.productType,
              priceType: selectedTradeForEdit.priceType,
              triggerPrice: selectedTradeForEdit.triggerPrice,
              tradinG_UNIT: selectedTradeForEdit.tradinG_UNIT,
              apiStatus: selectedTradeForEdit.apiStatus,
              intWID: selectedTradeForEdit.intWID,
              scriptCode: selectedTradeForEdit.scriptCode
            }}
            onSave={handleSaveTradeEdit}
          />
        )}

        {/* Edit Pending Trade Page */}
        {selectedPendingTradeForEdit && (
          <EditPendingTradePage
            visible={isEditPendingTradePageVisible}
            onClose={handleClosePendingTradeEditPage}
            trade={{
              id: selectedPendingTradeForEdit.id,
              symbol: selectedPendingTradeForEdit.symbol,
              type: selectedPendingTradeForEdit.type,
              quantity: selectedPendingTradeForEdit.quantity,
              price: selectedPendingTradeForEdit.price,
              activeTradeID: selectedPendingTradeForEdit.activeTradeID,
              currentOrderPrice: selectedPendingTradeForEdit.price.toString(),
              currentTarget: selectedPendingTradeForEdit.target,
              currentStopLoss: selectedPendingTradeForEdit.stopLoss,
              productType: selectedPendingTradeForEdit.productType,
              priceType: selectedPendingTradeForEdit.priceType,
              triggerPrice: selectedPendingTradeForEdit.triggerPrice,
              tradinG_UNIT: selectedPendingTradeForEdit.tradinG_UNIT,
              apiStatus: selectedPendingTradeForEdit.apiStatus,
              intWID: selectedPendingTradeForEdit.intWID,
              scriptCode: selectedPendingTradeForEdit.scriptCode
            }}
            onSave={handleSavePendingTradeEdit}
          />
        )}
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
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    paddingHorizontal: 16, // Add horizontal padding for cards
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
  tradeDetailCenter: {
    alignItems: 'center',
  },
  tradeDetailRight: {
    alignItems: 'flex-end',
  },
  targetStopLossRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  targetStopLossLeft: {
    alignItems: 'flex-start',
  },
  targetStopLossRight: {
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
