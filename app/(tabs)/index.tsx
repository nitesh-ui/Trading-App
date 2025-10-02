import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Easing,
    FlatList,
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
import { PriceDisplay, StockCard, ForexCard, CryptoCard } from '../../components/trading';
import {
    AssetItem,
    FilterDrawer,
    MarketTabs,
    MarketType,
    OptimizedSearch,
    SkeletonLoader,
    StockExchangeFilter,
    UnifiedDrawer,
    WatchlistProvider,
    useWatchlist,
} from '../../components/watchlist';
import SearchPage from '../../components/watchlist/SearchPage';
import NotificationsPage from '../../components/ui/NotificationsPage';
import WalletPage from '../../components/ui/WalletPage';
import ChartPage from '../../components/ui/ChartPage';
import TradePage from '../../components/ui/TradePage';
import { NotificationIcon } from '../../components/ui/NotificationIcon';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Memoized Market Indices Components
const StockIndices = memo(() => {
  const { theme } = useTheme();
  
  return (
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
  );
});

const ForexIndices = memo(() => {
  return (
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
  );
});

const CryptoIndices = memo(() => {
  return (
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
            <Text variant="body" weight="semibold" color="success" style={styles.indexValue}>
              72
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
});

// Optimized Sliding Tab Container - Tab switches instantly, content slides smoothly
const SlidingTabContainer = memo(({ 
  currentTab, 
  children 
}: { 
  currentTab: MarketType; 
  children: React.ReactNode;
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const tabOrder: MarketType[] = ['stocks', 'forex', 'crypto'];
  
  React.useEffect(() => {
    const currentIndex = tabOrder.indexOf(currentTab);
    const targetX = -currentIndex * SCREEN_WIDTH;
    
    // Smooth slide animation that doesn't block tab switching
    Animated.timing(slideAnim, {
      toValue: targetX,
      duration: 300, // Smooth animation
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Material Design easing
    }).start();
  }, [currentTab, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.slidingContainer,
        {
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
});

// Individual Tab Content Components - Using FlatList with ListHeaderComponent to avoid nesting
const StocksTabContent = memo(({ 
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress,
  onFilterPress
}: {
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string) => void;
  onFilterPress: () => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, filteredAssets } = useWatchlist();

  // Render header with indices and assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Stock Indices */}
      <View style={styles.indicesSection}>
        {watchlistState.isLoadingIndices ? (
          <SkeletonLoader type="indices" count={3} theme={theme} fast />
        ) : (
          <StockIndices />
        )}
      </View>
      
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitleStocks}>
            Your Stocks
            {watchlistState.exchangeFilter !== 'All' && ` - ${watchlistState.exchangeFilter}`}
          </Text>
          <Text variant="caption" color="textSecondary">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterIconButton, { backgroundColor: theme.colors.surface }]}
          onPress={onFilterPress}
        >
          <Ionicons name="filter" size={16} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, watchlistState.exchangeFilter, filteredAssets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol),
    };

    return (
      <View style={styles.assetItemContainer}>
        <StockCard stock={item} {...commonProps} />
      </View>
    );
  }, [theme, onAssetPress, onBuyPress, onSellPress, onRemovePress]);

  // Key extractor
  const keyExtractor = useCallback((item: AssetItem) => `${item.symbol}-${item.exchange}`, []);

  // Empty component
  const renderEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
      <Text variant="body" color="textSecondary" style={styles.emptyText}>
        No stocks in your watchlist
      </Text>
      <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
        Use the search to add stocks to your watchlist
      </Text>
    </View>
  ), [theme]);

  if (watchlistState.isLoadingAssets && filteredAssets.length === 0) {
    // Only show loading if we have no assets at all
    return (
      <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
        {renderListHeader()}
        <SkeletonLoader type="assetList" count={6} theme={theme} fast />
      </View>
    );
  }

  return (
    <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const ForexTabContent = memo(({ 
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress 
}: {
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string) => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, filteredAssets } = useWatchlist();

  // Render header with indices and assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Forex Indices */}
      <View style={styles.indicesSection}>
        {watchlistState.isLoadingIndices ? (
          <SkeletonLoader type="indices" count={3} theme={theme} fast />
        ) : (
          <ForexIndices />
        )}
      </View>
      
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
            Your Forex
          </Text>
          <Text variant="caption" color="textSecondary">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'pair' : 'pairs'}
          </Text>
        </View>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, filteredAssets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol),
    };

    return (
      <View style={styles.assetItemContainer}>
        <ForexCard pair={item} {...commonProps} />
      </View>
    );
  }, [theme, onAssetPress, onBuyPress, onSellPress, onRemovePress]);

  // Key extractor
  const keyExtractor = useCallback((item: AssetItem) => `${item.symbol}-${item.exchange}`, []);

  // Empty component
  const renderEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
      <Text variant="body" color="textSecondary" style={styles.emptyText}>
        No forex pairs in your watchlist
      </Text>
      <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
        Use the search to add forex pairs to your watchlist
      </Text>
    </View>
  ), [theme]);

  if (watchlistState.isLoadingAssets && filteredAssets.length === 0) {
    // Only show loading if we have no assets at all
    return (
      <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
        {renderListHeader()}
        <SkeletonLoader type="assetList" count={6} theme={theme} fast />
      </View>
    );
  }

  return (
    <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
});

const CryptoTabContent = memo(({ 
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress 
}: {
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string) => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, filteredAssets } = useWatchlist();

  // Render header with indices and assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Crypto Indices */}
      <View style={styles.indicesSection}>
        {watchlistState.isLoadingIndices ? (
          <SkeletonLoader type="indices" count={3} theme={theme} fast />
        ) : (
          <CryptoIndices />
        )}
      </View>
      
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
            Your Crypto
          </Text>
          <Text variant="caption" color="textSecondary">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'coin' : 'coins'}
          </Text>
        </View>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, filteredAssets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol),
    };

    // Convert AssetItem to CryptoData format for CryptoCard
    const cryptoData = {
      id: item.symbol.toLowerCase(),
      symbol: item.symbol,
      name: item.name,
      price: item.price,
      change24h: item.change,
      changePercent24h: item.changePercent,
      volume24h: item.volume || 0,
      marketCap: item.marketCap || 0,
      rank: 1, // Default rank
    };

    return (
      <View style={styles.assetItemContainer}>
        <CryptoCard crypto={cryptoData} {...commonProps} />
      </View>
    );
  }, [theme, onAssetPress, onBuyPress, onSellPress, onRemovePress]);

  // Key extractor
  const keyExtractor = useCallback((item: AssetItem) => `${item.symbol}-${item.exchange}`, []);

  // Empty component
  const renderEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
      <Text variant="body" color="textSecondary" style={styles.emptyText}>
        No crypto coins in your watchlist
      </Text>
      <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
        Use the search to add crypto coins to your watchlist
      </Text>
    </View>
  ), [theme]);

  if (watchlistState.isLoadingAssets && filteredAssets.length === 0) {
    // Only show loading if we have no assets at all
    return (
      <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
        {renderListHeader()}
        <SkeletonLoader type="assetList" count={6} theme={theme} fast />
      </View>
    );
  }

  return (
    <View style={[styles.tabContent, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredAssets}
        renderItem={renderAssetItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
});

// Set display names
StockIndices.displayName = 'StockIndices';
ForexIndices.displayName = 'ForexIndices';
CryptoIndices.displayName = 'CryptoIndices';
SlidingTabContainer.displayName = 'SlidingTabContainer';
StocksTabContent.displayName = 'StocksTabContent';
ForexTabContent.displayName = 'ForexTabContent';
CryptoTabContent.displayName = 'CryptoTabContent';

// Main content component that uses the context
const WatchlistContent = memo(() => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [isSearchPageVisible, setIsSearchPageVisible] = useState(false);
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);
  const [isChartPageVisible, setIsChartPageVisible] = useState(false);
  const [chartAsset, setChartAsset] = useState<AssetItem | null>(null);
  const [isTradePageVisible, setIsTradePageVisible] = useState(false);
  const [tradeAsset, setTradeAsset] = useState<AssetItem | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
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
    setTradeAsset(asset);
    setTradeAction('buy');
    setIsTradePageVisible(true);
  }, []);

  const handleSellPress = useCallback((asset: AssetItem) => {
    setTradeAsset(asset);
    setTradeAction('sell');
    setIsTradePageVisible(true);
  }, []);

  const handleRemoveFromWatchlist = useCallback((symbol: string) => {
    // Web-compatible confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to remove ${symbol} from your watchlist?`);
      if (confirmed) {
        removeFromWatchlist(symbol);
        setSelectedAssetForDetails(null);
        showNotification({ 
          type: 'success', 
          title: `${symbol} removed from watchlist` 
        });
      }
    } else {
      // Native mobile alert
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
    }
  }, [removeFromWatchlist, setSelectedAssetForDetails, showNotification]);

  const handleTradeExecute = useCallback((tradeData: any) => {
    // Legacy trade execution callback - now handled by TradePage with real API
    // Just reset the trade state as the TradePage already shows proper notifications
    resetTradeState();
    // Note: TradePage now handles the actual API call and success notifications
  }, [resetTradeState]);

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

  const handleOpenSearchPage = useCallback(() => {
    setIsSearchPageVisible(true);
  }, []);

  const handleCloseSearchPage = useCallback(() => {
    setIsSearchPageVisible(false);
  }, []);

  const handleOpenNotificationsPage = useCallback(() => {
    setIsNotificationsPageVisible(true);
  }, []);

  const handleCloseNotificationsPage = useCallback(() => {
    setIsNotificationsPageVisible(false);
  }, []);

  const handleOpenWalletPage = useCallback(() => {
    setIsWalletPageVisible(true);
  }, []);

  const handleCloseWalletPage = useCallback(() => {
    setIsWalletPageVisible(false);
  }, []);

  const handleOpenChartPage = useCallback((asset: AssetItem) => {
    setChartAsset(asset);
    setIsChartPageVisible(true);
  }, []);

  const handleCloseChartPage = useCallback(() => {
    setIsChartPageVisible(false);
    setChartAsset(null);
  }, []);

  const handleCloseTradePage = useCallback(() => {
    setIsTradePageVisible(false);
    setTradeAsset(null);
  }, []);

  const handleTradePageExecute = useCallback((tradeData: any) => {
    // Simulate trade execution
    Alert.alert(
      'Trade Executed',
      `${tradeData.action.toUpperCase()} ${tradeData.quantity} ${tradeData.asset.symbol}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIsTradePageVisible(false);
            setTradeAsset(null);
            showNotification({ 
              type: 'success', 
              title: 'Trade executed successfully' 
            });
          },
        },
      ]
    );
  }, [showNotification]);

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
              onPress={handleOpenWalletPage}
            >
              <Ionicons name="wallet" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <NotificationIcon
              onPress={handleOpenNotificationsPage}
              color={theme.colors.primary}
              backgroundColor={theme.colors.surface}
              borderColor={theme.colors.border}
            />

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={handleOpenSearchPage}
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

      {/* Sliding Tab Container - Like Kite App */}
      <View style={styles.tabsContainer}>
        <SlidingTabContainer currentTab={watchlistState.marketType}>
          <StocksTabContent 
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
            onFilterPress={() => setFilterVisible(true)}
          />
          <ForexTabContent 
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
          />
          <CryptoTabContent 
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
          />
        </SlidingTabContainer>
      </View>

      {/* Unified Drawer - handles asset details only, trading moved to TradePage */}
      <UnifiedDrawer
        visible={!!selectedAssetForDetails}
        asset={selectedAssetForDetails}
        marketType={watchlistState.marketType}
        drawerType="asset-details"
        availableBalance={availableBalance}
        onClose={() => {
          setSelectedAssetForDetails(null);
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
        onViewChart={() => {
          if (selectedAssetForDetails) {
            handleOpenChartPage(selectedAssetForDetails);
            setSelectedAssetForDetails(null);
          }
        }}
        theme={theme}
      />

      {/* Search Page */}
      <SearchPage
        visible={isSearchPageVisible}
        onClose={handleCloseSearchPage}
      />

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

      {/* Chart Page */}
      {chartAsset && (
        <ChartPage
          visible={isChartPageVisible}
          onClose={handleCloseChartPage}
          asset={chartAsset}
          marketType={watchlistState.marketType}
        />
      )}

      {/* Trade Page */}
      {tradeAsset && (
        <TradePage
          visible={isTradePageVisible}
          onClose={handleCloseTradePage}
          asset={tradeAsset}
          marketType={watchlistState.marketType}
          action={tradeAction}
          availableBalance={50000} // Mock balance
          onTradeExecute={handleTradePageExecute}
        />
      )}

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
  // Section styles
  sectionTitleStocks: {
    marginBottom: 0,
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
  
  // Sliding Tab Animation styles - Like Kite App
  tabsContainer: {
    flex: 1,
    overflow: 'hidden', // Important for smooth sliding
  },
  slidingContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3, // Width for all 3 tabs
    height: '100%',
  },
  tabContent: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 200 : 220, // Space for fixed header
  },
  indicesSection: {
    // No flex - fixed height based on content
  },
  // Asset item container
  assetItemContainer: {
    marginBottom: 12,
    marginRight: 20,
    marginLeft: 20,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  // FlatList content styles
  flatListContent: {
   // paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

WatchlistContent.displayName = 'WatchlistContent';
