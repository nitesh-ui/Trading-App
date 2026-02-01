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
    WatchlistManager,
    AddToWatchlistModal,
} from '../../components/watchlist';
import SearchPage from '../../components/watchlist/SearchPage';
import NotificationsPage from '../../components/ui/NotificationsPage';
import WalletPage from '../../components/ui/WalletPage';
import ChartPage from '../../components/ui/ChartPage';
import TradePage from '../../components/ui/TradePage';
import { NotificationIcon } from '../../components/ui/NotificationIcon';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSegment } from '../../contexts/SegmentContext';
import { useSignalR } from '../../hooks/useSignalR';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Market indices components removed - indices now appear as regular stocks in watchlist

// Optimized Sliding Tab Container - Tab switches instantly, content slides smoothly
const SlidingTabContainer = memo(({ 
  currentTab, 
  visibleSegments,
  children 
}: { 
  currentTab: MarketType; 
  visibleSegments: MarketType[];
  children: React.ReactNode;
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    const currentIndex = visibleSegments.indexOf(currentTab);
    const targetX = currentIndex >= 0 ? -currentIndex * SCREEN_WIDTH : 0;
    
    // Smooth slide animation that doesn't block tab switching
    Animated.timing(slideAnim, {
      toValue: targetX,
      duration: 300, // Smooth animation
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Material Design easing
    }).start();
  }, [currentTab, visibleSegments, slideAnim]);

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
  assets,
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress,
  onFilterPress,
  onSearchPress
}: {
  assets: AssetItem[];
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string, scriptCode?: number, wid?: number) => void;
  onFilterPress: () => void;
  onSearchPress: () => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, refreshData } = useWatchlist();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Render header with assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitleStocks}>
            Your Stocks
            {watchlistState.exchangeFilter !== 'All' && ` - ${watchlistState.exchangeFilter}`}
          </Text>
          <Text variant="caption" color="textSecondary">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
          </Text>
        </View>
        <View style={styles.headerIconsContainer}>
          <TouchableOpacity
            style={[styles.filterIconButton, { backgroundColor: theme.colors.surface }]}
            onPress={onSearchPress}
          >
            <Ionicons name="search" size={16} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterIconButton, { backgroundColor: theme.colors.surface }]}
            onPress={onFilterPress}
          >
            <Ionicons name="filter" size={16} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, watchlistState.exchangeFilter, assets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol, item.scriptCode, item.wid),
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

  if (watchlistState.isLoadingAssets && assets.length === 0) {
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
        data={assets}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
});

const ForexTabContent = memo(({ 
  assets,
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress 
}: {
  assets: AssetItem[];
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string, scriptCode?: number, wid?: number) => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, refreshData } = useWatchlist();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Render header with assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
            Your Forex
          </Text>
          <Text variant="caption" color="textSecondary">
            {assets.length} {assets.length === 1 ? 'pair' : 'pairs'}
          </Text>
        </View>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, assets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol, item.scriptCode, item.wid),
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

  if (watchlistState.isLoadingAssets && assets.length === 0) {
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
        data={assets}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
});

const CryptoTabContent = memo(({ 
  assets,
  onAssetPress, 
  onBuyPress, 
  onSellPress, 
  onRemovePress 
}: {
  assets: AssetItem[];
  onAssetPress: (asset: AssetItem) => void;
  onBuyPress: (asset: AssetItem) => void;
  onSellPress: (asset: AssetItem) => void;
  onRemovePress: (symbol: string, scriptCode?: number, wid?: number) => void;
}) => {
  const { theme } = useTheme();
  const { watchlistState, refreshData } = useWatchlist();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData]);

  // Render header with assets info
  const renderListHeader = useCallback(() => (
    <View>
      {/* Assets Header */}
      <View style={styles.assetsHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
            Your Crypto
          </Text>
          <Text variant="caption" color="textSecondary">
            {assets.length} {assets.length === 1 ? 'coin' : 'coins'}
          </Text>
        </View>
      </View>
    </View>
  ), [theme, watchlistState.isLoadingIndices, assets.length]);

  // Render asset item
  const renderAssetItem = useCallback(({ item }: { item: AssetItem }) => {
    const commonProps = {
      theme: theme,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onBuyPress(item),
      onSellPress: () => onSellPress(item),
      onRemovePress: () => onRemovePress(item.symbol, item.scriptCode, item.wid),
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

  if (watchlistState.isLoadingAssets && assets.length === 0) {
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
        data={assets}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
});

// Set display names
SlidingTabContainer.displayName = 'SlidingTabContainer';
StocksTabContent.displayName = 'StocksTabContent';
ForexTabContent.displayName = 'ForexTabContent';
CryptoTabContent.displayName = 'CryptoTabContent';

// Main content component that uses the context
const WatchlistContent = memo(() => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const { selectedSegments } = useSegment();
  const [isSearchPageVisible, setIsSearchPageVisible] = useState(false);
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);
  const [isChartPageVisible, setIsChartPageVisible] = useState(false);
  const [chartAsset, setChartAsset] = useState<AssetItem | null>(null);
  const [isTradePageVisible, setIsTradePageVisible] = useState(false);
  const [tradeAsset, setTradeAsset] = useState<AssetItem | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [isWatchlistManagerVisible, setIsWatchlistManagerVisible] = useState(false);
  const [currentWatchlist, setCurrentWatchlist] = useState<any>(null);
  const [isAddToWatchlistModalVisible, setIsAddToWatchlistModalVisible] = useState(false);
  const [assetToAddToWatchlist, setAssetToAddToWatchlist] = useState<AssetItem | null>(null);
  
  // SignalR integration for real-time data
  const { 
    isConnected: wsConnected, 
    connectionStatus, 
    lastMessage,
    subscribe: wsSubscribe,
    unsubscribe: wsUnsubscribe,
    subscribeToInstruments,
    unsubscribeFromInstruments
  } = useSignalR({
    autoConnect: true
  });
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
    // REMOVED: stocks, forexPairs, cryptoPairs (no longer available - using API data only)
  } = useWatchlist();

  // Sync market type with selected segments
  React.useEffect(() => {
    // If current market type is not in selected segments, switch to first selected segment
    if (!selectedSegments.includes(watchlistState.marketType)) {
      const firstSegment = selectedSegments[0] as MarketType;
      if (firstSegment) {
        setMarketType(firstSegment);
      }
    }
  }, [selectedSegments, watchlistState.marketType, setMarketType]);

  // Real-time price updates state
  const [realtimePrices, setRealtimePrices] = React.useState<Map<string, any>>(new Map());

  
  // Constants for memory management
  const MAX_PRICE_ENTRIES = 1000; // Limit Map size to prevent memory leaks
  const PRICE_ENTRY_TTL = 5 * 60 * 1000; // 5 minutes time-to-live for price entries

  // SignalR data processing with performance optimization
  React.useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const { data } = lastMessage;
      
      
      // Process the SignalR data structure: { Table: [...], Table1: [...] }
      if (data.Table && Array.isArray(data.Table)) {
        
        // Batch update prices to avoid too many re-renders
        const newPrices = new Map(realtimePrices);
        let updateCount = 0;
        const now = Date.now();

        // Clean up old entries to prevent unbounded growth
        if (newPrices.size > MAX_PRICE_ENTRIES) {
          const entriesToRemove: string[] = [];
          
          for (const [key, value] of newPrices) {
            // Remove entries older than TTL
            if (now - value.timestamp > PRICE_ENTRY_TTL) {
              entriesToRemove.push(key);
            }
          }
          
          entriesToRemove.forEach(key => newPrices.delete(key));
          
          // If still too large, remove oldest entries
          if (newPrices.size > MAX_PRICE_ENTRIES) {
            const sortedEntries = Array.from(newPrices.entries())
              .sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = sortedEntries.slice(0, newPrices.size - MAX_PRICE_ENTRIES);
            toRemove.forEach(([key]) => newPrices.delete(key));
          }
        }

        data.Table.forEach((item: any) => {
          if (item.InstrumentToken && item.Lastprice !== undefined) {
            // CRITICAL: InstrumentToken from SignalR corresponds to scriptCode in assets
            // Store with scriptCode as the key for direct matching
            const scriptCode = String(item.InstrumentToken);
            
            const priceData: any = {
              scriptCode: scriptCode, // Store scriptCode for reference
              lastPrice: parseFloat(item.Lastprice),
              open: parseFloat(item.Open),
              close: parseFloat(item.Close),
              high: parseFloat(item.High || item.high || 0),
              low: parseFloat(item.Low || item.low || 0),
              change: parseFloat(item.Change || 0),
              bid: parseFloat(item.Bid || 0),
              ask: parseFloat(item.Ask || 0),
              bidQty: parseInt(item.BidQty || 0),
              askQty: parseInt(item.AskQty || 0),
              timestamp: now // Use consistent timestamp
            };

            // Calculate change percentage
            if (item.Close && item.Close !== 0) {
              priceData.changePercent = ((priceData.lastPrice - parseFloat(item.Close)) / parseFloat(item.Close)) * 100;
            } else {
              priceData.changePercent = 0;
            }

            // Store with scriptCode as STRING key for direct matching
            newPrices.set(scriptCode, priceData);
            updateCount++;
            
            // Debug log for first few items
            if (updateCount <= 3) {
              console.log(`💹 Price update #${updateCount}:`, {
                scriptCode: scriptCode,
                price: priceData.lastPrice,
                change: priceData.changePercent.toFixed(2) + '%'
              });
            }
          }
        });

        // Process Table1 if exists (different market segment)
        if (data.Table1 && Array.isArray(data.Table1)) {
          
          data.Table1.forEach((item: any) => {
            if (item.ScriptCode && item.Status) {
              // Table1 contains trade data (ActiveTradeID, Status, etc.)
              // We don't need to process this for price updates
              // This is trade execution data, not market data
              console.log('📋 Trade data in Table1:', {
                tradeId: item.ActiveTradeID,
                scriptCode: item.ScriptCode,
                status: item.Status
              });
            } else if (item.InstrumentToken && item.Lastprice !== undefined) {
              // If Table1 has market data (rare), process it
              const instrumentTokenStr = String(item.InstrumentToken);
              
              const priceData: any = {
                instrumentToken: instrumentTokenStr,
                lastPrice: parseFloat(item.Lastprice),
                open: parseFloat(item.Open),
                close: parseFloat(item.Close),
                high: parseFloat(item.High || item.high || 0),
                low: parseFloat(item.Low || item.low || 0),
                change: parseFloat(item.Change || 0),
                bid: parseFloat(item.Bid || 0),
                ask: parseFloat(item.Ask || 0),
                bidQty: parseInt(item.BidQty || 0),
                askQty: parseInt(item.AskQty || 0),
                timestamp: now
              };

              if (item.Close && item.Close !== 0) {
                priceData.changePercent = ((priceData.lastPrice - parseFloat(item.Close)) / parseFloat(item.Close)) * 100;
              } else {
                priceData.changePercent = 0;
              }

              newPrices.set(instrumentTokenStr, priceData);
              updateCount++;
            }
          });
        }

        // Update prices immediately - React will batch updates automatically
        if (updateCount > 0) {
          console.log(`💹 Applying ${updateCount} price updates to watchlist, Map size: ${newPrices.size}`);
          setRealtimePrices(newPrices);
        } else {
          console.log('⚠️ No price updates to apply');
        }
      } else {
        console.log('⚠️ SignalR message does not have Table array');
      }
    } else {
      console.log('⚠️ SignalR lastMessage is empty or has no data');
    }
  }, [lastMessage]);


  
  // Periodic cleanup of old price entries every 2 minutes
  React.useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setRealtimePrices(prevPrices => {
        const now = Date.now();
        const newPrices = new Map(prevPrices);
        let removedCount = 0;
        
        for (const [key, value] of newPrices) {
          if (now - value.timestamp > PRICE_ENTRY_TTL) {
            newPrices.delete(key);
            removedCount++;
          }
        }
        
        if (removedCount > 0) {
          console.log('🧹 Periodic cleanup removed', removedCount, 'expired entries, Map size:', newPrices.size);
        }
        
        return newPrices;
      });
    }, 2 * 60 * 1000); // Run every 2 minutes
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [PRICE_ENTRY_TTL]);

  // Merge real-time prices with watchlist assets for performance
  const enhancedAssets = React.useMemo(() => {
    // Safety check: ensure filteredAssets is an array
    if (!filteredAssets || !Array.isArray(filteredAssets) || filteredAssets.length === 0) {
      return [];
    }

    if (realtimePrices.size === 0) {
      return filteredAssets;
    }

    // Log all assets for debugging matching logic
    console.log('🔍 MATCHING DEBUG: Assets to match:', filteredAssets.map(a => ({
      symbol: a.symbol,
      exchange: a.exchange,
      scriptCode: a.scriptCode,
      intWID: a.intWID,
      wid: a.wid,
      instrumentToken: a.instrumentToken
    })));
    console.log('🔍 MATCHING DEBUG: Available price tokens:', Array.from(realtimePrices.keys()));

    return filteredAssets.map(asset => {
      // Try to find real-time data by matching with InstrumentToken for ALL asset types (stocks, forex, crypto)
      let realtimeData = null;
      
      // Convert asset identifiers to strings for consistent matching
      const assetScriptCode = asset.scriptCode?.toString();
      const assetIntWID = asset.intWID?.toString();
      const assetWID = asset.wid?.toString();
      const assetInstrumentToken = asset.instrumentToken?.toString();
      
      console.log(`🔎 Trying to match ${asset.symbol}:`, {
        scriptCode: assetScriptCode,
        intWID: assetIntWID,
        wid: assetWID,
        instrumentToken: assetInstrumentToken
      });
      
      // Try to match by scriptCode, intWID, wid, or instrumentToken
      // CRITICAL: All tokens in the Map are strings now
      if (assetScriptCode && realtimePrices.has(assetScriptCode)) {
        realtimeData = realtimePrices.get(assetScriptCode);
        console.log(`✅ Matched asset ${asset.symbol} by scriptCode:`, assetScriptCode);
      } else if (assetIntWID && realtimePrices.has(assetIntWID)) {
        realtimeData = realtimePrices.get(assetIntWID);
        console.log(`✅ Matched asset ${asset.symbol} by intWID:`, assetIntWID);
      } else if (assetWID && realtimePrices.has(assetWID)) {
        realtimeData = realtimePrices.get(assetWID);
        console.log(`✅ Matched asset ${asset.symbol} by wid:`, assetWID);
      } else if (assetInstrumentToken && realtimePrices.has(assetInstrumentToken)) {
        realtimeData = realtimePrices.get(assetInstrumentToken);
        console.log(`✅ Matched asset ${asset.symbol} by instrumentToken:`, assetInstrumentToken);
      } else {
        // No match found - log for debugging
        console.log(`❌ No match for ${asset.symbol} (${asset.exchange})`, {
          assetIds: {
            scriptCode: assetScriptCode,
            intWID: assetIntWID,
            wid: assetWID,
            instrumentToken: assetInstrumentToken
          },
          availableTokens: Array.from(realtimePrices.keys())
        });
      }

      if (realtimeData) {
        // Merge real-time data with asset (stocks only)
        // IMPORTANT: Explicitly preserve scriptCode, wid, intWID, lotSize
        const merged = {
          ...asset,
          price: realtimeData.lastPrice,
          change: realtimeData.change,
          changePercent: realtimeData.changePercent,
          high: realtimeData.high,
          low: realtimeData.low,
          open: realtimeData.open,
          previousClose: realtimeData.close,
          lastUpdated: new Date(realtimeData.timestamp).toISOString(),
          // Add real-time specific data
          bid: realtimeData.bid,
          ask: realtimeData.ask,
          bidQty: realtimeData.bidQty,
          askQty: realtimeData.askQty,
          // Explicitly preserve critical fields for trading
          scriptCode: asset.scriptCode,
          wid: asset.wid,
          intWID: asset.intWID,
          lotSize: asset.lotSize,
        };
        
        // Debug log to verify fields are preserved
        if (!merged.scriptCode || (!merged.wid && !merged.intWID)) {
          console.warn('⚠️ Critical fields missing after merge for:', asset.symbol, {
            scriptCode: merged.scriptCode,
            wid: merged.wid,
            intWID: merged.intWID,
            original: { scriptCode: asset.scriptCode, wid: asset.wid, intWID: asset.intWID }
          });
        }
        
        return merged;
      }

      // Return original asset if no real-time data found
      return asset;
    });
  }, [filteredAssets, realtimePrices]);

  // Filter enhanced assets by current market type
  const currentMarketAssets = React.useMemo(() => {
    // enhancedAssets is already filtered by watchlistState.marketType
    // through the filteredAssets computation in useWatchlist
    return enhancedAssets;
  }, [enhancedAssets]);

  // SignalR connection status logging
  React.useEffect(() => {
    console.log('🔌 SignalR connection status:', {
      connected: wsConnected,
      status: connectionStatus
    });

    if (wsConnected) {
      console.log('✅ SignalR connected in index.tsx');
      // showNotification({
      //   type: 'success',
      //   title: 'Real-time data connected'
      // });
    } else if (connectionStatus === 'disconnected') {
      // Only show notification if we were previously connected
      console.log('⚠️ SignalR disconnected, showing notification');
    }
  }, [wsConnected, connectionStatus, showNotification]);

  // Subscribe to instruments when connected and assets are available
  React.useEffect(() => {
    if (!wsConnected || !subscribeToInstruments) {
      console.log('⏸️ Skipping instrument subscription:', {
        wsConnected,
        hasSubscribeFn: !!subscribeToInstruments,
        assetsCount: filteredAssets?.length || 0
      });
      return;
    }

    if (!filteredAssets || filteredAssets.length === 0) {
      console.log('⏸️ No assets to subscribe to yet');
      return;
    }

    // Extract instrument tokens from assets
    // For stocks: use scriptCode (matches what web does)
    // For forex/crypto: may need different approach
    const instrumentTokens: string[] = [];
    
    filteredAssets.forEach(asset => {
      // Priority order for instrument token selection:
      // 1. instrumentToken if explicitly provided
      // 2. scriptCode (this is what web uses and what SignalR sends)
      // 3. intWID as fallback
      const token = asset.instrumentToken || asset.scriptCode || asset.intWID;
      
      if (token) {
        instrumentTokens.push(String(token));
      } else {
        console.warn('⚠️ Asset has no identifiable token:', asset.symbol);
      }
    });

    if (instrumentTokens.length === 0) {
      console.log('⏸️ No valid instrument tokens found in assets');
      return;
    }

    console.log('📤 Subscribing to instruments:', {
      totalAssets: filteredAssets.length,
      tokensToSubscribe: instrumentTokens.length,
      sampleTokens: instrumentTokens.slice(0, 5),
      marketType: watchlistState.marketType
    });

    // Subscribe to instruments
    subscribeToInstruments(instrumentTokens)
      .then(() => {
        console.log('✅ Successfully subscribed to', instrumentTokens.length, 'instruments');
      })
      .catch((error) => {
        console.error('❌ Failed to subscribe to instruments:', error);
      });

    // Cleanup: unsubscribe when component unmounts or assets change
    return () => {
      if (unsubscribeFromInstruments && instrumentTokens.length > 0) {
        console.log('🗑️ Unsubscribing from instruments on cleanup');
        unsubscribeFromInstruments(instrumentTokens).catch((error) => {
          console.error('❌ Failed to unsubscribe:', error);
        });
      }
    };
  }, [wsConnected, filteredAssets, subscribeToInstruments, unsubscribeFromInstruments, watchlistState.marketType]);

  // Available balance - this could come from a financial context
  const availableBalance = 1269884.76;

  // Exchange filter options for stocks - get from filtered assets
  const availableExchanges: StockExchangeFilter[] = useMemo(() => {
    if (watchlistState.marketType !== 'stocks') return ['All'];
    
    const exchanges = new Set<string>(['All']);
    filteredAssets.forEach(asset => {
      if (asset.exchange) exchanges.add(asset.exchange);
    });
    return Array.from(exchanges) as StockExchangeFilter[];
  }, [watchlistState.marketType, filteredAssets]);

  // Keep the selected asset updated with real-time data
  const selectedAssetWithRealTimeData = useMemo(() => {
    if (!selectedAssetForDetails) return null;
    
    // Find the updated asset in enhancedAssets
    const updatedAsset = enhancedAssets.find(
      asset => asset.symbol === selectedAssetForDetails.symbol && 
               asset.exchange === selectedAssetForDetails.exchange
    );
    
    // Return updated asset if found, otherwise return the original
    return updatedAsset || selectedAssetForDetails;
  }, [selectedAssetForDetails, enhancedAssets]);

  // Get real-time updated trade asset
  const updatedTradeAsset = React.useMemo(() => {
    if (!tradeAsset) return null;
    
    // Find the updated asset from enhancedAssets (which includes real-time data)
    const updatedAsset = enhancedAssets.find(
      (a) => a.symbol === tradeAsset.symbol && a.exchange === tradeAsset.exchange
    );
    
    if (updatedAsset) {
      console.log('✅ Found updated asset in enhancedAssets:', {
        symbol: updatedAsset.symbol,
        scriptCode: updatedAsset.scriptCode,
        wid: updatedAsset.wid,
        intWID: updatedAsset.intWID
      });
    } else {
      console.log('⚠️ Updated asset NOT found in enhancedAssets, using original');
    }
    
    const finalAsset = updatedAsset || tradeAsset;
    
    // Log warning if scriptCode or wid is missing
    if (!finalAsset.scriptCode) {
      console.warn('⚠️ scriptCode missing for trade asset:', finalAsset.symbol, 'Final asset:', finalAsset);
    }
    if (!finalAsset.wid && !finalAsset.intWID) {
      console.warn('⚠️ wid/intWID missing for trade asset:', finalAsset.symbol, 'Final asset:', finalAsset);
    }
    
    console.log('🎯 Final trade asset to be used:', {
      symbol: finalAsset.symbol,
      scriptCode: finalAsset.scriptCode,
      wid: finalAsset.wid,
      intWID: finalAsset.intWID,
      lotSize: finalAsset.lotSize
    });
    
    // Return updated asset if found, otherwise return the original
    return finalAsset;
  }, [tradeAsset, enhancedAssets]);

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

  const handleRemoveFromWatchlist = useCallback(async (symbol: string, scriptCode?: number, wid?: number) => {
    // Web-compatible confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to remove ${symbol} from your watchlist?`);
      if (confirmed) {
        const result = await removeFromWatchlist(symbol, scriptCode, wid);
        setSelectedAssetForDetails(null);
        if (result.success) {
          showNotification({ 
            type: 'success', 
            title: `${symbol} removed from watchlist` 
          });
        } else {
          showNotification({ 
            type: 'error', 
            title: `Failed to remove ${symbol}`,
            message: result.message || 'Please try again'
          });
        }
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
            onPress: async () => {
              const result = await removeFromWatchlist(symbol, scriptCode, wid);
              setSelectedAssetForDetails(null);
              if (result.success) {
                showNotification({ 
                  type: 'success', 
                  title: `${symbol} removed from watchlist` 
                });
              } else {
                showNotification({ 
                  type: 'error', 
                  title: `Failed to remove ${symbol}`,
                  message: result.message || 'Please try again'
                });
              }
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

  const handleOpenWatchlistManager = useCallback(() => {
    setIsWatchlistManagerVisible(true);
  }, []);

  const handleCloseWatchlistManager = useCallback(() => {
    setIsWatchlistManagerVisible(false);
  }, []);

  const handleOpenAddToWatchlistModal = useCallback((asset: AssetItem) => {
    setAssetToAddToWatchlist(asset);
    setIsAddToWatchlistModalVisible(true);
  }, []);

  const handleCloseAddToWatchlistModal = useCallback(() => {
    setIsAddToWatchlistModalVisible(false);
    setAssetToAddToWatchlist(null);
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
            <View style={styles.headerSubtitle}>
              <Text variant="body" color="textSecondary">
                Favorite {watchlistState.marketType === 'stocks' ? 'stocks' : watchlistState.marketType === 'forex' ? 'currency pairs' : 'cryptocurrencies'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
              onPress={handleOpenWatchlistManager}
            >
              <Ionicons name="bookmark" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

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
          </View>
        </View>

        {/* Market Type Toggle - Also in fixed header */}
        <View style={styles.toggleContainer}>
          <MarketTabs
            marketType={watchlistState.marketType}
            onMarketTypeChange={setMarketType}
            theme={theme}
            visibleSegments={selectedSegments as any}
          />
        </View>
      </View>

      {/* Tab Container - Only render current tab */}
      <View style={styles.tabsContainer}>
        {watchlistState.marketType === 'stocks' && selectedSegments.includes('stocks') && (
          <StocksTabContent 
            assets={currentMarketAssets}
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
            onFilterPress={() => setFilterVisible(true)}
            onSearchPress={handleOpenSearchPage}
          />
        )}
        {watchlistState.marketType === 'forex' && selectedSegments.includes('forex') && (
          <ForexTabContent 
            assets={currentMarketAssets}
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
          />
        )}
        {watchlistState.marketType === 'crypto' && selectedSegments.includes('crypto') && (
          <CryptoTabContent 
            assets={currentMarketAssets}
            onAssetPress={handleAssetPress}
            onBuyPress={handleBuyPress}
            onSellPress={handleSellPress}
            onRemovePress={handleRemoveFromWatchlist}
          />
        )}
      </View>

      {/* Unified Drawer - handles asset details only, trading moved to TradePage */}
      <UnifiedDrawer
        visible={!!selectedAssetForDetails}
        asset={selectedAssetWithRealTimeData}
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
            handleRemoveFromWatchlist(selectedAssetForDetails.symbol, selectedAssetForDetails.scriptCode, selectedAssetForDetails.wid);
          }
        }}
        onAddToWatchlist={() => {
          if (selectedAssetForDetails) {
            handleOpenAddToWatchlistModal(selectedAssetForDetails);
            setSelectedAssetForDetails(null);
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

      {/* Watchlist Manager */}
      <WatchlistManager
        visible={isWatchlistManagerVisible}
        onClose={handleCloseWatchlistManager}
        onSelectWatchlist={(watchlist: any) => {
          setCurrentWatchlist(watchlist);
        }}
        currentWatchlist={currentWatchlist}
      />

      {/* Add to Watchlist Modal */}
      {assetToAddToWatchlist && (
        <AddToWatchlistModal
          visible={isAddToWatchlistModalVisible}
          onClose={handleCloseAddToWatchlistModal}
          assetSymbol={assetToAddToWatchlist.symbol}
          assetName={assetToAddToWatchlist.name}
        />
      )}

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
          onBuyPress={() => {
            if (chartAsset) {
              setTradeAsset(chartAsset);
              setTradeAction('buy');
              setIsChartPageVisible(false);
              setChartAsset(null);
              setIsTradePageVisible(true);
            }
          }}
          onSellPress={() => {
            if (chartAsset) {
              setTradeAsset(chartAsset);
              setTradeAction('sell');
              setIsChartPageVisible(false);
              setChartAsset(null);
              setIsTradePageVisible(true);
            }
          }}
        />
      )}

      {/* Trade Page */}
      {updatedTradeAsset && (() => {
        return (
          <TradePage
            visible={isTradePageVisible}
            onClose={handleCloseTradePage}
            asset={updatedTradeAsset}
            marketType={watchlistState.marketType}
            action={tradeAction}
            availableBalance={50000} // Mock balance
            onTradeExecute={handleTradePageExecute}
          />
        );
      })()}

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
  headerSubtitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  wsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  wsIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wsStatusText: {
    fontSize: 10,
    fontWeight: '500',
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
  headerIconsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
    width: SCREEN_WIDTH, // Width for all 3 tabs
    height: '100%',
  },
  tabContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 200 : 220, // Space for fixed header
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
