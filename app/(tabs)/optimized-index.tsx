import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from '../../components/atomic';
import { PriceDisplay } from '../../components/trading';
import {
    AssetItem,
    AssetList,
    FilterDrawer,
    MarketTabs,
    OptimizedSearch,
    StockExchangeFilter,
    UnifiedDrawer,
    WatchlistProvider,
    useWatchlist,
} from '../../components/watchlist';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

// Main content component that uses the context
const WatchlistContent = memo(() => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const {
    watchlistState,
    tradeState,
    filteredAssets,
    searchResults,
    selectedAssetForDetails,
    setSelectedAssetForDetails,
    setMarketType,
    setExchangeFilter,
    setSearchQuery,
    setSearchExpanded,
    setFilterVisible,
    addToWatchlist,
    removeFromWatchlist,
    updateTradeState,
    resetTradeState,
    refreshData,
    stocks,
    forexPairs,
    cryptoPairs,
  } = useWatchlist();

  // Available balance - this could come from a financial context
  const availableBalance = 1269884.76;

  // Exchange filter options for stocks
  const availableExchanges: StockExchangeFilter[] = useMemo(() => {
    if (watchlistState.marketType !== 'stocks') return ['All'];
    
    const exchanges = new Set<string>(['All']);
    stocks.forEach(stock => {
      if (stock.exchange) exchanges.add(stock.exchange);
    });
    return Array.from(exchanges) as StockExchangeFilter[];
  }, [watchlistState.marketType, stocks]);

  // Get market indices for display
  const marketIndices = useMemo(() => {
    switch (watchlistState.marketType) {
      case 'stocks':
        return {
          name: 'NIFTY 50',
          value: 19234.56,
          change: 145.23,
          changePercent: 0.76,
        };
      case 'forex':
        return {
          name: 'USD Index',
          value: 103.45,
          change: -0.12,
          changePercent: -0.12,
        };
      case 'crypto':
        return {
          name: 'Total Market Cap',
          value: 1.2e12,
          change: 25.4e9,
          changePercent: 2.15,
        };
    }
  }, [watchlistState.marketType]);

  // Asset action handlers
  const handleAssetPress = useCallback((asset: AssetItem) => {
    setSelectedAssetForDetails(asset);
  }, [setSelectedAssetForDetails]);

  const handleBuyPress = useCallback((asset: AssetItem) => {
    updateTradeState({
      isVisible: true,
      selectedAsset: asset,
      assetType: watchlistState.marketType,
      action: 'buy',
      quantity: 1,
    });
  }, [updateTradeState, watchlistState.marketType]);

  const handleSellPress = useCallback((asset: AssetItem) => {
    updateTradeState({
      isVisible: true,
      selectedAsset: asset,
      assetType: watchlistState.marketType,
      action: 'sell',
      quantity: 1,
    });
  }, [updateTradeState, watchlistState.marketType]);

  const handleRemoveFromWatchlist = useCallback((symbol: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${symbol} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFromWatchlist(symbol);
            setSelectedAssetForDetails(null);
            showNotification({ 
              type: 'success', 
              title: `${symbol} removed from watchlist` 
            });
          },
        },
      ]
    );
  }, [removeFromWatchlist, setSelectedAssetForDetails, showNotification]);

  const handleTradeExecute = useCallback((tradeData: any) => {
    // Simulate trade execution
    Alert.alert(
      'Trade Executed',
      `${tradeData.action.toUpperCase()} ${tradeData.quantity} ${tradeData.asset.symbol} at ${tradeData.asset.price}`,
      [
        {
          text: 'OK',
          onPress: () => {
            resetTradeState();
            showNotification({ 
              type: 'success', 
              title: 'Trade executed successfully' 
            });
          },
        },
      ]
    );
  }, [resetTradeState, showNotification]);

  const handleSearchAssetSelect = useCallback((asset: AssetItem) => {
    setSelectedAssetForDetails(asset);
    setSearchExpanded(false);
  }, [setSelectedAssetForDetails, setSearchExpanded]);

  const handleAddToWatchlistFromSearch = useCallback((symbol: string) => {
    addToWatchlist(symbol);
    showNotification({ 
      type: 'success', 
      title: `${symbol} added to watchlist` 
    });
  }, [addToWatchlist, showNotification]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="default"
        backgroundColor={theme.colors.background}
      />
      
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="headline" weight="bold" color="text">
              Watchlist
            </Text>
            <Text variant="body" color="textSecondary">
              Favorite {watchlistState.marketType === 'stocks' ? 'stocks' : watchlistState.marketType === 'forex' ? 'currency pairs' : 'cryptocurrencies'}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => {
                showNotification({ 
                  type: 'info', 
                  title: 'Coming Soon',
                  message: 'Wallet features will be available soon'
                });
              }}
            >
              <Ionicons name="wallet" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, position: 'relative' }]}
              onPress={() => {
                showNotification({ 
                  type: 'info', 
                  title: 'Coming Soon',
                  message: 'Advanced notification features will be available soon'
                });
              }}
            >
              <Ionicons name="notifications" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={() => {
                showNotification({ 
                  type: 'info', 
                  title: 'Coming Soon',
                  message: 'Search functionality will be available soon'
                });
              }}
            >
              <Ionicons name="search" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Type Toggle - Also in fixed header */}
        <View style={styles.toggleContainer}>
          <MarketTabs
            marketType={watchlistState.marketType}
            onMarketTypeChange={setMarketType}
            theme={theme}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={watchlistState.refreshing}
            onRefresh={refreshData}
            tintColor={theme.colors.primary}
          />
        }
      >

        {/* Market Indices */}
        {watchlistState.marketType === 'stocks' && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Market Indices
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>NIFTY 50</Text>
                  <PriceDisplay
                    price={19674.25}
                    change={123.45}
                    changePercent={0.63}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>SENSEX</Text>
                  <PriceDisplay
                    price={65953.48}
                    change={245.67}
                    changePercent={0.37}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>BANK NIFTY</Text>
                  <PriceDisplay
                    price={45234.80}
                    change={-89.25}
                    changePercent={-0.20}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Forex Indices */}
        {watchlistState.marketType === 'forex' && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Forex Indices
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>DXY</Text>
                  <PriceDisplay
                    price={103.45}
                    change={-0.12}
                    changePercent={-0.12}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>EUR/USD</Text>
                  <PriceDisplay
                    price={1.0845}
                    change={0.0023}
                    changePercent={0.21}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>GBP/USD</Text>
                  <PriceDisplay
                    price={1.2634}
                    change={-0.0045}
                    changePercent={-0.35}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Crypto Indices */}
        {watchlistState.marketType === 'crypto' && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Crypto Market
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>Market Cap</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    $1.20T
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>24h Volume</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    $25.4B
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>BTC Dominance</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    54.2%
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>Fear & Greed</Text>
                  <Text
                    variant="body"
                    weight="semibold"
                    color="success"
                    style={styles.indexValue}
                  >
                    72
                  </Text>
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Assets Section Header */}
        <View style={styles.assetsHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Your {watchlistState.marketType === 'stocks' ? 'Stocks' : 
                   watchlistState.marketType === 'forex' ? 'Forex' : 'Crypto'}
              {watchlistState.exchangeFilter !== 'All' && ` - ${watchlistState.exchangeFilter}`}
            </Text>
            <Text variant="caption" color="textSecondary">
              {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.filterIconButton, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border,
              borderWidth: 1,
            }]}
            onPress={() => setFilterVisible(true)}
          >
            <Text variant="caption" color="primary">⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Assets List */}
        <View style={styles.assetsListContainer}>
          <AssetList
            data={filteredAssets}
            marketType={watchlistState.marketType}
            onAssetPress={handleAssetPress}
            onTradePress={(asset: AssetItem, action: 'buy' | 'sell') => {
              if (action === 'buy') handleBuyPress(asset);
              else handleSellPress(asset);
            }}
            onRemovePress={(symbol: string) => handleRemoveFromWatchlist(symbol)}
            refreshing={watchlistState.refreshing}
            onRefresh={refreshData}
            theme={theme}
          />
        </View>
      </ScrollView>

      {/* Unified Drawer - handles both asset details and trading */}
      <UnifiedDrawer
        visible={!!selectedAssetForDetails || tradeState.isVisible}
        asset={selectedAssetForDetails || tradeState.selectedAsset}
        marketType={watchlistState.marketType}
        drawerType={selectedAssetForDetails ? 'asset-details' : 'trading'}
        tradeState={tradeState}
        availableBalance={availableBalance}
        onClose={() => {
          setSelectedAssetForDetails(null);
          resetTradeState();
        }}
        onBuyPress={() => {
          if (selectedAssetForDetails) {
            handleBuyPress(selectedAssetForDetails);
            setSelectedAssetForDetails(null);
          }
        }}
        onSellPress={() => {
          if (selectedAssetForDetails) {
            handleSellPress(selectedAssetForDetails);
            setSelectedAssetForDetails(null);
          }
        }}
        onRemoveFromWatchlist={() => {
          if (selectedAssetForDetails) {
            handleRemoveFromWatchlist(selectedAssetForDetails.symbol);
          }
        }}
        onTradeExecute={handleTradeExecute}
        onTradeStateChange={updateTradeState}
        theme={theme}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        visible={watchlistState.isFilterVisible}
        marketType={watchlistState.marketType}
        selectedExchange={watchlistState.exchangeFilter}
        availableExchanges={availableExchanges}
        onClose={() => setFilterVisible(false)}
        onExchangeChange={setExchangeFilter}
        theme={theme}
      />
    </View>
  );
});

// Main exported component with provider
export default function WatchlistScreen() {
  return (
    <WatchlistProvider>
      <WatchlistContent />
    </WatchlistProvider>
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
    paddingTop: Platform.OS === 'ios' ? 200 : 220, // Space for fixed header + toggle + margins
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 16,
    textAlign: 'center',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  // Market indices styles
  indicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  indicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  indexCard: {
    width: 140, // Fixed width instead of minWidth
    minHeight: 80, // Ensure consistent height
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: {
    textAlign: 'center',
    marginBottom: 8,
  },
  indexValue: {
    textAlign: 'center',
    fontSize: 16,
  },
  // Section styles
  sectionTitle: {
    marginBottom: 12,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Assets list container
  assetsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

WatchlistContent.displayName = 'WatchlistContent';
