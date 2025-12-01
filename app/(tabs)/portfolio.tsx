import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { memo, Suspense, useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from '../../components/atomic';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { StockCardSkeleton } from '../../components/LoadingComponents';
import NotificationsPage from '../../components/ui/NotificationsPage';
import { NotificationIcon } from '../../components/ui/NotificationIcon';
import WalletPage from '../../components/ui/WalletPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useRenderPerformance } from '../../hooks/usePerformance';
import { queryKeys } from '../../services/queryClient';
import { tradingApiService, ActiveTradeItem } from '../../services/tradingApiService';
import { formatIndianCurrency } from '../../utils/indianFormatting';

interface PortfolioSummary {
  totalInvested: number;
  totalCurrent: number;
  totalPnL: number;
  totalPnLPercent: number;
  todaysPnL: number;
  todaysPnLPercent: number;
  walletBalance: string;
  usedMargin: number;
  availableMargin: number;
  totalMargin: number;
}

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  type: 'BUY' | 'SELL';
  productType?: string;
  priceType?: string;
  exchange?: string;
  tradeId: string;
  orderDate: string;
  orderTime: string;
}

/**
 * Transform API completed trade data to UI holdings format
 * Uses only real API data - no simulation
 */
const transformApiTradeToHolding = (apiTrade: ActiveTradeItem): Holding => {
  const investedValue = apiTrade.orderPrice * apiTrade.qty;
  
  // Use actual P&L from API
  const pnl = apiTrade.profitorloss || 0;
  
  // Calculate current price from entry price and P&L
  // currentPrice = entryPrice + (pnl / quantity)
  const currentPrice = apiTrade.orderPrice + (pnl / apiTrade.qty);
  
  const currentValue = currentPrice * apiTrade.qty;
  const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

  return {
    symbol: apiTrade.tradeSymbol,
    name: apiTrade.tradeSymbol, // API doesn't provide full name, using symbol
    quantity: apiTrade.qty,
    avgPrice: apiTrade.orderPrice,
    currentPrice: Math.max(0, currentPrice), // Ensure non-negative price
    investedValue: investedValue,
    currentValue: Math.max(0, currentValue), // Ensure non-negative value
    pnl: pnl,
    pnlPercent: pnlPercent,
    type: apiTrade.currentPosition.toUpperCase() as 'BUY' | 'SELL',
    productType: apiTrade.productType,
    priceType: apiTrade.priceType,
    exchange: apiTrade.objScriptDTO?.scriptExchange || 'N/A',
    tradeId: apiTrade.activeTradeID.toString(),
    orderDate: apiTrade.orderDate,
    orderTime: apiTrade.orderTime
  };
};

/**
 * Portfolio service using real API - only completed trades as holdings
 */
const portfolioService = {
  getHoldings: async (): Promise<Holding[]> => {
    try {
      const response = await tradingApiService.getActiveTrades();
      
      // Filter only completed trades to show as holdings
      const completedTrades = response.data.filter(
        (trade: ActiveTradeItem) => trade.status.toUpperCase() === 'COMPLETE'
      );
      
      // Transform to holdings format
      return completedTrades.map(transformApiTradeToHolding);
    } catch (error) {
      console.error('❌ Error fetching holdings:', error);
      throw error;
    }
  },
};

/**
 * Memoized Holding Card Component
 */
const MemoizedHoldingCard = memo<{
  holding: Holding;
  onPress?: (holding: Holding) => void;
}>(({ holding, onPress }) => {
  const { theme } = useTheme();
  
  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return theme.colors.success;
    if (pnl < 0) return theme.colors.error;
    return theme.colors.textSecondary;
  };

  const handlePress = useCallback(() => {
    onPress?.(holding);
  }, [onPress, holding]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={{ ...styles.holdingCard, padding: 12 }}>
        <View style={styles.holdingHeader}>
          <View style={styles.stockInfo}>
            <View style={styles.symbolRow}>
              <Text variant="body" weight="semibold" color="text">
                {holding.symbol}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Text variant="caption" color="textSecondary">
                {holding.exchange} • {holding.priceType}
              </Text>
              <View style={[styles.typeIndicator, { 
                backgroundColor: holding.type === 'BUY' ? theme.colors.success : theme.colors.error 
              }]}>
                <Text variant="caption" style={{ color: theme.colors.surface }}>
                  {holding.type}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.pnlInfo}>
            <Text 
              variant="body" 
              weight="semibold"
              style={{ color: getPnLColor(holding.pnl) }}
            >
              {holding.pnl >= 0 ? '+' : ''}{holding.pnl.toFixed(4)}
            </Text>
            <Text 
              variant="caption"
              style={{ color: getPnLColor(holding.pnl) }}
            >
              ({holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
            </Text>
          </View>
        </View>
        
        <View style={styles.holdingDetails}>
          <View style={styles.detailRow}>
            <Text variant="caption" color="textSecondary">Qty: {holding.quantity}</Text>
            <Text variant="caption" color="textSecondary">Avg: {holding.avgPrice.toFixed(2)}</Text>
            <Text variant="caption" color="textSecondary">LTP: {holding.currentPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.tradeInfo}>
            <Text variant="caption" color="textSecondary">
              Trade Date: {holding.orderDate} {holding.orderTime}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.holding.symbol === nextProps.holding.symbol &&
    prevProps.holding.currentPrice === nextProps.holding.currentPrice &&
    prevProps.holding.pnl === nextProps.holding.pnl
  );
});

MemoizedHoldingCard.displayName = 'MemoizedHoldingCard';

export default function PortfolioScreen() {
  const { theme } = useTheme();
  
  // Performance monitoring
  useRenderPerformance('PortfolioScreen');

  // Modal states
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);
  
  // Real-time polling state
  const [isPollingEnabled, setIsPollingEnabled] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(false);

  // Track screen focus to control polling
  useFocusEffect(
    useCallback(() => {
      console.log('📈 [Portfolio] Screen focused - enabling polling');
      setIsScreenFocused(true);
      
      return () => {
        console.log('📉 [Portfolio] Screen unfocused - disabling polling');
        setIsScreenFocused(false);
      };
    }, [])
  );

  // React Query for optimized data fetching with real-time polling
  const { 
    data: holdings = [], 
    isLoading: holdingsLoading, 
    refetch: refetchHoldings,
    isRefetching: holdingsRefetching 
  } = useQuery({
    queryKey: queryKeys.userPortfolio(),
    queryFn: async () => {
      if (isPollingEnabled && isScreenFocused) {
        console.log('🔄 [Portfolio] Polling holdings data...');
      }
      return portfolioService.getHoldings();
    },
    staleTime: 0, // Always fetch fresh data
    refetchInterval: (isPollingEnabled && isScreenFocused) ? 2000 : false, // Poll only when enabled AND screen is focused
    refetchIntervalInBackground: false, // Don't poll in background
  });

  // Separate wallet balance query for immediate refresh with polling
  const {
    data: walletData,
    isLoading: walletLoading,
    refetch: refetchWallet,
    isRefetching: walletRefetching
  } = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: async () => {
      const response = await tradingApiService.getWalletBalance();
      return response.data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchInterval: (isPollingEnabled && isScreenFocused) ? 2000 : false, // Poll only when enabled AND screen is focused
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { 
    data: portfolioSummary, 
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isRefetching: summaryRefetching 
  } = useQuery({
    queryKey: [...queryKeys.userPortfolio(), 'summary'],
    queryFn: async () => {
      const holdings = await portfolioService.getHoldings();
      const totalInvested = holdings.reduce((sum, holding) => sum + holding.investedValue, 0);
      const totalCurrent = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
      const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
      const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
      
      // Note: API doesn't provide today's P&L separately
      // For now, showing total P&L until API is enhanced
      return {
        totalInvested,
        totalCurrent,
        totalPnL,
        totalPnLPercent,
        todaysPnL: totalPnL, // Use total P&L as today's P&L (API limitation)
        todaysPnLPercent: totalPnLPercent, // Use total P&L% as today's P&L% (API limitation)
        walletBalance: walletData?.amount || '0',
        usedMargin: walletData?.usedMargin || 0,
        availableMargin: walletData?.availableMargin || 0,
        totalMargin: walletData?.totalmargin || 0,
      };
    },
    staleTime: 0,
    refetchInterval: (isPollingEnabled && isScreenFocused) ? 2000 : false, // Poll only when enabled AND screen is focused
    refetchIntervalInBackground: false,
    enabled: !!walletData, // Only run when wallet data is available
  });

  // Callbacks
  const handleHoldingPress = useCallback((holding: Holding) => {
    // Handle holding details navigation
    console.log('Holding selected:', holding);
  }, []);

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
    refetchHoldings();
    refetchWallet();
    refetchSummary();
  }, [refetchHoldings, refetchWallet, refetchSummary]);

  const renderHoldingItem = useCallback(({ item }: { item: Holding }) => (
    <MemoizedHoldingCard
      holding={item}
      onPress={handleHoldingPress}
    />
  ), [handleHoldingPress]);

  const keyExtractor = useCallback((item: Holding) => item.symbol, []);

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return theme.colors.success;
    if (pnl < 0) return theme.colors.error;
    return theme.colors.textSecondary;
  };

  return (
    <ScreenErrorBoundary screenName="Portfolio">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Fixed Header */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
          <View style={styles.statusBarSpacer} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="headline" weight="bold" color="text">
                Portfolio
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
                onPress={() => setIsPollingEnabled(!isPollingEnabled)}
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
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={holdingsRefetching || summaryRefetching || walletRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >

          {/* Portfolio Summary */}
          <Suspense fallback={<StockCardSkeleton />}>
            {(summaryLoading || walletLoading) ? (
              <StockCardSkeleton />
            ) : portfolioSummary ? (
              <Card padding="medium" style={styles.summaryCard}>
                <Text variant="subtitle" weight="semibold" color="text" style={styles.summaryTitle}>
                  Portfolio Overview
                </Text>
                
                <View style={styles.summaryDetails}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Total P&L</Text>
                      <Text 
                        variant="body" 
                        weight="semibold"
                        style={{ color: getPnLColor(portfolioSummary.totalPnL) }}
                      >
                        {portfolioSummary.totalPnL >= 0 ? '+' : ''}{formatIndianCurrency(portfolioSummary.totalPnL)}
                      </Text>
                      <Text 
                        variant="caption"
                        style={{ color: getPnLColor(portfolioSummary.totalPnL) }}
                      >
                        ({portfolioSummary.totalPnLPercent >= 0 ? '+' : ''}{portfolioSummary.totalPnLPercent.toFixed(2)}%)
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Today's P&L</Text>
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Text 
                          variant="body" 
                          weight="semibold"
                          style={{ color: getPnLColor(portfolioSummary.todaysPnL), display: 'contents' }}
                        >
                          {portfolioSummary.todaysPnL >= 0 ? '+' : ''}{formatIndianCurrency(portfolioSummary.todaysPnL)}
                        </Text>
                        <Text 
                          variant="caption"
                          style={{ color: getPnLColor(portfolioSummary.todaysPnL), marginLeft: 8 }}
                        >
                          ({portfolioSummary.todaysPnLPercent >= 0 ? '+' : ''}{portfolioSummary.todaysPnLPercent.toFixed(2)}%)
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Used Margin</Text>
                      <Text variant="body" weight="semibold" color="text">
                        {formatIndianCurrency(portfolioSummary.usedMargin)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Available Margin</Text>
                      <Text variant="body" weight="semibold" color="text">
                        {formatIndianCurrency(portfolioSummary.availableMargin)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ) : null}
          </Suspense>

          {/* Holdings List */}
          <View style={{ marginTop: 16 }}>
            <Text variant="subtitle" weight="semibold" color="text" style={{ marginHorizontal: 20, marginBottom: 12 }}>
              Positions ({(holdings as Holding[]).length})
            </Text>
            
            {holdingsLoading ? (
              <View style={styles.holdingsListContent}>
                {[...Array(3)].map((_, index) => (
                  <StockCardSkeleton key={index} />
                ))}
              </View>
            ) : (
              <View style={styles.holdingsListContent}>
                {(holdings as Holding[]).map((holding) => (
                  <MemoizedHoldingCard
                    key={holding.tradeId}
                    holding={holding}
                    onPress={handleHoldingPress}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

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
    paddingTop: Platform.OS === 'ios' ? 140 : 160, // Space for fixed header
    paddingBottom: Platform.OS === 'ios' ? 140 : 160, // Space for bottom tab bar and extra padding
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
  summaryCard: {
    margin: 16,
    marginTop: 8,
  },
  summaryMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryDetails: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: 8,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  holdingsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 6, // Reduced since we're handling bottom padding in scrollContent
  },
  holdingCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  holdingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stockInfo: {
    flex: 1,
    paddingRight: 12,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockName: {
    marginTop: 2,
  },
  pnlInfo: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  holdingDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tradeInfo: {
    marginTop: 4,
  },
});
