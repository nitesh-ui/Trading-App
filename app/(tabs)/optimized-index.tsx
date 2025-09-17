import React, { memo, useCallback, useMemo } from 'react';
import {
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { Text } from '../../components/atomic';
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
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <Text variant="headline" weight="bold" color="text">
              Watchlist
            </Text>
            <Text variant="caption" color="textSecondary">
              {filteredAssets.length} assets
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setFilterVisible(true)}
              style={[styles.filterButton, { backgroundColor: theme.colors.surface }]}
            >
              <Text variant="caption" color="textSecondary">⚙️</Text>
            </TouchableOpacity>
            <OptimizedSearch
              isExpanded={watchlistState.isSearchExpanded}
              searchQuery={watchlistState.searchQuery}
              searchResults={searchResults}
              marketType={watchlistState.marketType}
              selectedExchange={watchlistState.exchangeFilter}
              availableExchanges={availableExchanges}
              onSearchToggle={() => setSearchExpanded(!watchlistState.isSearchExpanded)}
              onSearchQueryChange={setSearchQuery}
              onExchangeChange={setExchangeFilter}
              onAssetSelect={handleSearchAssetSelect}
              onAddToWatchlist={handleAddToWatchlistFromSearch}
              theme={theme}
            />
          </View>
        </View>

        {/* Market Tabs */}
        <MarketTabs
          marketType={watchlistState.marketType}
          onMarketTypeChange={setMarketType}
          theme={theme}
        />

        {/* Market Index Display */}
        <View style={styles.indexDisplay}>
          <Text variant="caption" color="textSecondary" style={styles.indexLabel}>
            {marketIndices.name}
          </Text>
          <PriceDisplay
            price={marketIndices.value}
            change={marketIndices.change}
            changePercent={marketIndices.changePercent}
            size="large"
            align="left"
          />
        </View>

        {/* Assets List */}
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
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  indexDisplay: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  indexLabel: {
    marginBottom: 4,
  },
});

WatchlistContent.displayName = 'WatchlistContent';
