import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { memo, Suspense, useCallback, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from '../../components/atomic';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { StockCardSkeleton } from '../../components/LoadingComponents';
import NotificationsPage from '../../components/ui/NotificationsPage';
import WalletPage from '../../components/ui/WalletPage';
import { useNotification } from '../../contexts/NotificationContext';
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
  walletBalance: number;
  marginUsed: number;
  availableMargin: number;
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
 */
const transformApiTradeToHolding = (apiTrade: ActiveTradeItem): Holding => {
  const investedValue = apiTrade.orderPrice * apiTrade.qty;
  
  // Calculate current price based on P&L from API if available
  // Otherwise simulate a small price movement for demo
  let currentPrice: number;
  let pnl: number;
  
  if (apiTrade.profitorloss !== 0) {
    // Use actual P&L from API
    pnl = apiTrade.profitorloss;
    currentPrice = apiTrade.orderPrice + (pnl / apiTrade.qty);
  } else {
    // For demo purposes, simulate small price movement
    const priceMovement = (Math.random() - 0.5) * apiTrade.orderPrice * 0.05; // ±2.5% movement
    currentPrice = apiTrade.orderPrice + priceMovement;
    pnl = priceMovement * apiTrade.qty;
  }
  
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
  
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    try {
      const holdings = await portfolioService.getHoldings();
      const totalInvested = holdings.reduce((sum, holding) => sum + holding.investedValue, 0);
      const totalCurrent = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
      const totalPnL = holdings.reduce((sum, holding) => sum + holding.pnl, 0);
      const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
      
      return {
        totalInvested,
        totalCurrent,
        totalPnL,
        totalPnLPercent,
        todaysPnL: totalPnL * 0.1, // Mock today's P&L as 10% of total
        todaysPnLPercent: totalPnLPercent * 0.1,
        walletBalance: 50000, // Mock wallet balance - would come from another API
        marginUsed: 25000, // Mock margin used - would come from another API
        availableMargin: 75000, // Mock available margin - would come from another API
      };
    } catch (error) {
      console.error('❌ Error fetching portfolio summary:', error);
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
              <View style={[styles.typeIndicator, { 
                backgroundColor: holding.type === 'BUY' ? theme.colors.success : theme.colors.error 
              }]}>
                <Text variant="caption" style={{ color: theme.colors.surface }}>
                  {holding.type}
                </Text>
              </View>
            </View>
            <Text variant="caption" color="textSecondary" style={styles.stockName}>
              {holding.exchange} • {holding.priceType}
            </Text>
          </View>
          <View style={styles.pnlInfo}>
            <Text 
              variant="body" 
              weight="semibold"
              style={{ color: getPnLColor(holding.pnl) }}
            >
              {holding.pnl >= 0 ? '+' : ''}{formatIndianCurrency(holding.pnl)}
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
            <Text variant="caption" color="textSecondary">Avg: ₹{holding.avgPrice.toFixed(2)}</Text>
            <Text variant="caption" color="textSecondary">LTP: ₹{holding.currentPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.valueRow}>
            <Text variant="caption" color="textSecondary">
              Invested: {formatIndianCurrency(holding.investedValue)}
            </Text>
            <Text variant="caption" color="text">
              Current: {formatIndianCurrency(holding.currentValue)}
            </Text>
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
  const { showNotification, notificationCount } = useNotification();
  
  // Performance monitoring
  useRenderPerformance('PortfolioScreen');

  // Modal states
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);

  // React Query for optimized data fetching
  const { 
    data: holdings = [], 
    isLoading: holdingsLoading, 
    refetch: refetchHoldings,
    isRefetching: holdingsRefetching 
  } = useQuery({
    queryKey: queryKeys.userPortfolio(),
    queryFn: portfolioService.getHoldings,
    staleTime: 30 * 1000, // 30 seconds
  });

  const { 
    data: portfolioSummary, 
    isLoading: summaryLoading,
    refetch: refetchSummary,
    isRefetching: summaryRefetching 
  } = useQuery({
    queryKey: [...queryKeys.userPortfolio(), 'summary'],
    queryFn: portfolioService.getPortfolioSummary,
    staleTime: 30 * 1000,
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
    refetchSummary();
  }, [refetchHoldings, refetchSummary]);

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
              <Text variant="body" color="textSecondary">
                Track your investments
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
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={holdingsRefetching || summaryRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >

          {/* Portfolio Summary */}
          <Suspense fallback={<StockCardSkeleton />}>
            {summaryLoading ? (
              <StockCardSkeleton />
            ) : portfolioSummary ? (
              <Card padding="medium" style={styles.summaryCard}>
                <Text variant="subtitle" weight="semibold" color="text" style={styles.summaryTitle}>
                  Portfolio Overview
                </Text>
                
                <View style={styles.summaryDetails}>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Wallet Balance</Text>
                      <Text variant="body" weight="semibold" color="text">
                        {formatIndianCurrency(portfolioSummary.walletBalance)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Margin Used</Text>
                      <Text variant="body" weight="semibold" color="text">
                        {formatIndianCurrency(portfolioSummary.marginUsed)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text variant="caption" color="textSecondary">Available Margin</Text>
                      <Text variant="body" weight="semibold" color="text">
                        {formatIndianCurrency(portfolioSummary.availableMargin)}
                      </Text>
                    </View>
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
                  </View>

                  <View style={styles.summaryRow}>
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
                    <View style={styles.summaryItem}>
                      {/* Empty for alignment */}
                    </View>
                  </View>
                </View>
              </Card>
            ) : null}
          </Suspense>

          {/* Holdings List */}
          <View style={{ marginTop: 16 }}>
            <Text variant="subtitle" weight="semibold" color="text" style={{ marginHorizontal: 20, marginBottom: 12 }}>
              Your Holdings ({(holdings as Holding[]).length})
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
    paddingBottom: 20,
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
