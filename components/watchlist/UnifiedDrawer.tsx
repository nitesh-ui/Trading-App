import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, Card } from '../atomic';
import { CandlestickChart } from '../trading';
import { AssetItem, MarketType, TradeState } from './types';
import { formatIndianCurrency } from '../../utils/indianFormatting';
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
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.8;

const UnifiedDrawer = memo<UnifiedDrawerProps>(({
  visible,
  onClose,
  theme,
  asset,
  marketType,
  onBuyPress,
  onSellPress,
  onRemoveFromWatchlist,
  onViewChart,
  tradeState,
  availableBalance,
  onTradeExecute,
  onTradeStateChange,
  drawerType,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  const formatPrice = (price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    if (marketType === 'crypto' && price > 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const changeColor = asset.change >= 0 ? theme.colors.success : theme.colors.error;
  const changeIcon = asset.change >= 0 ? 'trending-up' : 'trending-down';

  // Format detailed stats based on asset type - matching the screenshot layout
  const getDetailStats = () => {
    if (marketType === 'stocks') {
      // Calculate derived values
      const prevClose = asset.price - (asset.change || 0);
      const open = asset.high ? asset.high - Math.abs(asset.change || 0) * 0.5 : prevClose + (asset.change || 0) * 0.3;
      
      return [
        { label: 'Open', value: formatPrice(open) },
        { label: 'High', value: asset.high ? formatPrice(asset.high) : formatPrice(asset.price + Math.abs(asset.change || 0) * 0.8) },
        { label: 'Low', value: asset.low ? formatPrice(asset.low) : formatPrice(asset.price - Math.abs(asset.change || 0) * 0.6) },
        { label: 'Prev Close', value: formatPrice(prevClose) },
        { label: 'Volume', value: asset.volume ? `${(asset.volume / 100000).toFixed(1)}L` : '45.7L' },
        { label: 'Market Cap', value: asset.marketCap ? `₹${(asset.marketCap / 1e7).toFixed(1)}L Cr` : '₹1.7L Cr' },
      ];
    } else if (marketType === 'forex') {
      return [
        { label: 'Bid', value: formatPrice(asset.price - 0.0002) },
        { label: 'Ask', value: formatPrice(asset.price + 0.0002) },
        { label: 'Spread', value: '0.0004' },
        { label: 'High', value: asset.high ? formatPrice(asset.high) : 'N/A' },
        { label: 'Low', value: asset.low ? formatPrice(asset.low) : 'N/A' },
        { label: 'Volume', value: asset.volume ? asset.volume.toLocaleString() : 'N/A' },
      ];
    } else if (marketType === 'crypto') {
      return [
        { label: '24h Volume', value: asset.volume ? `$${(asset.volume / 1e9).toFixed(2)}B` : 'N/A' },
        { label: 'Market Cap', value: asset.marketCap ? `$${(asset.marketCap / 1e9).toFixed(1)}B` : 'N/A' },
        { label: 'High', value: asset.high ? formatPrice(asset.high) : 'N/A' },
        { label: 'Low', value: asset.low ? formatPrice(asset.low) : 'N/A' },
        { label: 'Circulating Supply', value: 'N/A' },
        { label: 'Last Updated', value: new Date().toLocaleTimeString() },
      ];
    }
    return [];
  };

  const detailStats = getDetailStats();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background + 'CC', opacity: opacityAnim },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.colors.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <SafeAreaView style={styles.safeArea}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
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

                  {/* Price Section */}
                  <Card padding="medium" style={styles.priceCard}>
                    <View style={styles.priceSection}>
                      <Text variant="display" weight="bold" color="text">
                        {formatPrice(asset.price)}
                      </Text>
                      <View style={[styles.changeContainer, { backgroundColor: changeColor + '20' }]}>
                        <Ionicons name={changeIcon} size={16} color={changeColor} />
                        <Text variant="body" weight="medium" style={{ color: changeColor, marginLeft: 6 }}>
                          {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change)} ({asset.changePercent.toFixed(2)}%)
                        </Text>
                      </View>
                    </View>
                  </Card>

                  {/* Chart Section - Replace with View Chart button */}
                  <Card padding="medium" style={styles.chartCard}>
                    <View style={styles.viewChartContainer}>
                      <View style={styles.chartInfo}>
                        <Text variant="subtitle" weight="medium" color="text">
                          Price Chart
                        </Text>
                        <Text variant="caption" color="textSecondary">
                          View detailed chart analysis
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={onViewChart}
                        style={[styles.viewChartButton, { backgroundColor: theme.colors.primary }]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trending-up" size={18} color={theme.colors.surface} />
                        <Text variant="body" weight="medium" style={{ color: theme.colors.surface, marginLeft: 6 }}>
                          View Chart
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>

                  {/* Detailed Stats - Exact same layout as original */}
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

                  {/* Action Buttons - Same styling as original */}
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
                      onPress={onRemoveFromWatchlist}
                      style={[styles.deleteButton, { backgroundColor: theme.colors.textSecondary + '20', borderColor: theme.colors.textSecondary + '40' }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Bottom spacing */}
                  <View style={styles.bottomSpacing} />
                </ScrollView>
              </SafeAreaView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});

UnifiedDrawer.displayName = 'UnifiedDrawer';
export default UnifiedDrawer;
