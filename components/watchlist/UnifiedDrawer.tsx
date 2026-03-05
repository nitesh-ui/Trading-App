import React, { memo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Text, Card } from '../atomic';
import { CandlestickChart, PriceDisplay } from '../trading';
import { AssetItem, MarketType, TradeState } from './types';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { formatPrice } from '../../utils/priceFormatting';
import TradingDrawer from './TradingDrawer';

interface UnifiedDrawerProps {
  // Common props
  visible: boolean;
  onClose: () => void;
  theme: any;
  
  // Asset details drawer props
  asset?: AssetItem | null;
  marketType?: MarketType;
  onBuyPress?: () => void;
  onSellPress?: () => void;
  onRemoveFromWatchlist?: () => void;
  onAddToWatchlist?: () => void;
  onViewChart?: () => void; // Add this new prop
  
  // Trading drawer props
  tradeState?: TradeState;
  availableBalance?: number;
  onTradeExecute?: (tradeData: any) => void;
  onTradeStateChange?: (updates: Partial<TradeState>) => void;
  
  // Drawer type
  drawerType: 'asset-details' | 'trading';
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.85;

const UnifiedDrawer = memo<UnifiedDrawerProps>(({
  visible,
  onClose,
  theme,
  asset,
  marketType,
  onBuyPress,
  onSellPress,
  onRemoveFromWatchlist,
  onAddToWatchlist,
  onViewChart,
  tradeState,
  availableBalance,
  onTradeExecute,
  onTradeStateChange,
  drawerType,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Generate TradingView symbol based on market type - must be called before any returns
  const getTradingViewSymbol = useCallback(() => {
    if (!asset || !marketType) return '';
    
    const symbol = asset.symbol;
    
    switch (marketType) {
      case 'stocks':
        // Indian stocks: NSE or BSE exchange
        if (asset.exchange === 'NSE' || asset.exchange === 'BSE') {
          return `${asset.exchange}:${symbol}`;
        }
        // US stocks: use NASDAQ or NYSE
        return `NASDAQ:${symbol}`;
      
      case 'crypto':
        // Crypto: use Binance as default exchange
        // Remove common suffixes like USDT, USD
        const cleanSymbol = symbol.replace(/USDT|USD$/i, '');
        return `BINANCE:${cleanSymbol}USDT`;
      
      case 'forex':
        // Forex: use FX prefix
        return `FX_IDC:${symbol}`;
      
      default:
        return symbol;
    }
  }, [asset, marketType]);

  // Open TradingView chart in browser - must be called before any returns
  const openTradingViewChart = useCallback(async () => {
    const tvSymbol = getTradingViewSymbol();
    if (!tvSymbol) return;
    
    const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
    
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: theme.colors.primary,
      });
    } catch (error) {
      console.error('Error opening TradingView:', error);
      // Fallback to Linking
      Linking.openURL(url);
    }
  }, [getTradingViewSymbol, theme]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  // Render trading drawer if type is trading
  if (drawerType === 'trading' && tradeState && asset && marketType) {
    return (
      <TradingDrawer
        visible={visible}
        asset={asset}
        marketType={marketType}
        tradeState={tradeState}
        availableBalance={availableBalance || 0}
        onClose={onClose}
        onTradeExecute={onTradeExecute || (() => {})}
        onTradeStateChange={onTradeStateChange || (() => {})}
        theme={theme}
      />
    );
  }

  // Asset details drawer
  if (!asset || !marketType) return null;

  const formatPriceLocal = (price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    } else if (marketType === 'crypto') {
      // For crypto, show up to 5 decimal places, no currency symbol
      return price.toFixed(5);
    } else if (marketType === 'forex') {
      // For forex, show up to 5 decimal places, no currency symbol
      return price.toFixed(5);
    }
    // Default: 2 decimal places, no currency symbol
    return price.toFixed(2);
  };

  const changeColor = asset.change >= 0 ? theme.colors.success : theme.colors.error;
  const changeIcon = asset.change >= 0 ? 'trending-up' : 'trending-down';

  // Format detailed stats based on asset type - only show fields returned by API
  const getDetailStats = () => {
    const stats: { label: string; value: string }[] = [];
    
    if (marketType === 'stocks') {
      // Calculate derived values only if we have the necessary data
      // Use previousClose if available from real-time data, otherwise calculate
      const prevClose = asset.previousClose || (asset.price - (asset.change || 0));
      
      // Open - from real-time data or calculate estimate
      const openPrice = asset.open || (asset.high && asset.low ? (asset.high + asset.low) / 2 : null);
      if (openPrice !== undefined && openPrice !== null) {
        stats.push({ label: 'Open', value: formatPriceLocal(openPrice) });
      }
      
      // High - only show if available from API or real-time
      if (asset.high !== undefined && asset.high !== null) {
        stats.push({ label: 'High', value: formatPriceLocal(asset.high) });
      }
      
      // Low - only show if available from API or real-time
      if (asset.low !== undefined && asset.low !== null) {
        stats.push({ label: 'Low', value: formatPriceLocal(asset.low) });
      }
      
      // Previous Close - always show
      stats.push({ label: 'Prev Close', value: formatPriceLocal(prevClose) });
      
      // Volume - only show if provided by API or real-time
      if (asset.volume !== undefined && asset.volume !== null && asset.volume > 0) {
        stats.push({ label: 'Volume', value: `${(asset.volume / 100000).toFixed(1)}L` });
      }
      
      // Market Cap - only show if provided by API
      if (asset.marketCap !== undefined && asset.marketCap !== null && asset.marketCap > 0) {
        stats.push({ label: 'Market Cap', value: `${(asset.marketCap / 1e7).toFixed(1)}L Cr` });
      }
      
      // Real-time specific data (if available from WebSocket)
      if (asset.bid !== undefined && asset.bid !== null && asset.bid > 0) {
        stats.push({ label: 'Bid', value: formatPriceLocal(asset.bid) });
      }
      if (asset.ask !== undefined && asset.ask !== null && asset.ask > 0) {
        stats.push({ label: 'Ask', value: formatPriceLocal(asset.ask) });
      }
      
      // Last updated timestamp (for real-time data)
      if (asset.lastUpdated) {
        const lastUpdateTime = new Date(asset.lastUpdated).toLocaleTimeString();
        stats.push({ label: 'Last Updated', value: lastUpdateTime });
      }
      
    } else if (marketType === 'forex') {
      // Forex specific fields
      stats.push({ label: 'Bid', value: formatPriceLocal(asset.price - 0.0002) });
      stats.push({ label: 'Ask', value: formatPriceLocal(asset.price + 0.0002) });
      stats.push({ label: 'Spread', value: '0.00040' });
      
      // High - only show if available from API
      if (asset.high !== undefined && asset.high !== null) {
        stats.push({ label: 'High', value: formatPriceLocal(asset.high) });
      }
      
      // Low - only show if available from API
      if (asset.low !== undefined && asset.low !== null) {
        stats.push({ label: 'Low', value: formatPriceLocal(asset.low) });
      }
      
      // Volume - only show if provided by API
      if (asset.volume !== undefined && asset.volume !== null) {
        stats.push({ label: 'Volume', value: asset.volume.toLocaleString() });
      }
      
    } else if (marketType === 'crypto') {
      // 24h Volume - only show if provided by API
      if (asset.volume !== undefined && asset.volume !== null) {
        stats.push({ label: '24h Volume', value: `${(asset.volume / 1e9).toFixed(2)}B` });
      }
      
      // Market Cap - only show if provided by API
      if (asset.marketCap !== undefined && asset.marketCap !== null) {
        stats.push({ label: 'Market Cap', value: `${(asset.marketCap / 1e9).toFixed(1)}B` });
      }
      
      // High - only show if available from API
      if (asset.high !== undefined && asset.high !== null) {
        stats.push({ label: 'High', value: formatPriceLocal(asset.high) });
      }
      
      // Low - only show if available from API
      if (asset.low !== undefined && asset.low !== null) {
        stats.push({ label: 'Low', value: formatPriceLocal(asset.low) });
      }
      
      // Last Updated - always show for crypto
      stats.push({ label: 'Last Updated', value: new Date().toLocaleTimeString() });
    }
    
    return stats;
  };

  const detailStats = getDetailStats();

  // Debug log to see what fields are available and being shown
  console.log('📊 UnifiedDrawer asset details:', {
    symbol: asset.symbol,
    marketType,
    availableFields: {
      high: asset.high,
      low: asset.low,
      volume: asset.volume,
      marketCap: asset.marketCap,
      exchange: asset.exchange
    },
    statsToShow: detailStats.length,
    statLabels: detailStats.map(s => s.label)
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background + 'CC', opacity: opacityAnim },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.colors.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.drawerContainer}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  style={styles.scrollContent}
                  contentContainerStyle={styles.scrollContentContainer}
                >
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.symbolContainer}>
                      <Text variant="headline" weight="bold" color="text">
                        {asset.symbol}
                      </Text>
                      {asset.exchange && (
                        <Text variant="caption" color="textSecondary">
                          {asset.exchange}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text variant="body" color="textSecondary" style={styles.companyName}>
                    {asset.name}
                  </Text>

                  {/* Price Section - Using PriceDisplay for real-time updates */}
                  <Card padding="medium" style={styles.priceCard}>
                    <View style={styles.priceSection}>
                      <PriceDisplay
                        price={asset.price}
                        change={asset.change}
                        changePercent={asset.changePercent}
                        size="large"
                        showCurrency={marketType === 'stocks'}
                        currencySymbol=""
                        showSymbol={true}
                        showChange={true}
                        align="left"
                        theme={theme}
                      />
                    </View>
                  </Card>

                  {/* Chart Section - Opens internal MarketChart */}
                  <Card padding="medium" style={styles.chartCard}>
                    <View style={styles.viewChartContainer}>
                      <View style={styles.chartInfo}>
                        <Text variant="subtitle" weight="medium" color="text">
                          Live Market Chart
                        </Text>
                        <Text variant="caption" color="textSecondary">
                          View live chart with real-time updates
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          if (onViewChart) {
                            onViewChart();
                            onClose();
                          }
                        }}
                        style={[styles.viewChartButton, { backgroundColor: theme.colors.primary }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="stats-chart" size={18} color={theme.colors.surface} />
                        <Text variant="body" weight="medium" style={{ color: theme.colors.surface, marginLeft: 6 }}>
                          Open Chart
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>

                  {/* Detailed Stats - Only show if we have stats to display */}
                  {detailStats.length > 0 && (
                    <Card padding="medium" style={styles.statsCard}>
                      <Text variant="subtitle" weight="medium" color="text" style={styles.statsTitle}>
                        Market Details
                      </Text>
                      <View style={styles.detailsContainer}>
                        {detailStats.map((stat, index) => (
                          <View key={index} style={styles.detailRow}>
                            <Text variant="caption" color="textSecondary">{stat.label}</Text>
                            <Text variant="caption" color="text">{stat.value}</Text>
                          </View>
                        ))}
                      </View>
                    </Card>
                  )}
                </ScrollView>

                {/* Action Buttons - Fixed at bottom */}
                <SafeAreaView edges={['bottom']} style={styles.actionButtonsContainer}>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={onBuyPress}
                      style={[styles.buyButton, { backgroundColor: theme.colors.success }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trending-up" size={16} color={theme.colors.surface} />
                      <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                        Buy
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={onSellPress}
                      style={[styles.sellButton, { backgroundColor: theme.colors.error }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trending-down" size={16} color={theme.colors.surface} />
                      <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                        Sell
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onAddToWatchlist}
                      style={[styles.addToWatchlistButton, { backgroundColor: theme.colors.primary }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="bookmark" size={16} color={theme.colors.surface} />
                      <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                        Add
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        console.log('🗑️ Delete button pressed in UnifiedDrawer');
                        if (onRemoveFromWatchlist) {
                          onRemoveFromWatchlist();
                        } else {
                          console.warn('⚠️ onRemoveFromWatchlist function not provided');
                        }
                      }}
                      style={[
                        styles.deleteButton, 
                        { 
                          backgroundColor: theme.colors.textSecondary + '20', 
                          borderColor: theme.colors.textSecondary + '40' 
                        }
                      ]}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessible={true}
                      accessibilityLabel="Remove from watchlist"
                      accessibilityRole="button"
                      pressRetentionOffset={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </SafeAreaView>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  drawerContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symbolContainer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    marginBottom: 16,
    opacity: 0.8,
  },
  priceCard: {
    marginBottom: 16,
  },
  priceSection: {
    alignItems: 'flex-start',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 12,
  },
  chartContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartInfo: {
    flex: 1,
    marginRight: 16,
  },
  viewChartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    marginBottom: 12,
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  sellButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addToWatchlistButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButton: {
    minWidth: 52,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ':hover': {
          transform: 'scale(1.03)',
          opacity: 0.85,
        },
        ':active': {
          transform: 'scale(0.98)',
        },
      },
    }),
  },
  bottomSpacing: {
    height: 20,
  },
});

UnifiedDrawer.displayName = 'UnifiedDrawer';
export default UnifiedDrawer;
