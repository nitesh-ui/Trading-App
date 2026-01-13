import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Card, Text, Button } from '../atomic';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SlidingPage from './SlidingPage';
import MarketChart from '../trading/MarketChart';
import { useTheme } from '../../contexts/ThemeContext';
import { AssetItem, MarketType } from '../watchlist/types';
import { formatIndianCurrency } from '../../utils/indianFormatting';

interface ChartPageProps {
  visible: boolean;
  onClose: () => void;
  asset: AssetItem;
  marketType: MarketType;
  onBuyPress?: () => void;
  onSellPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChartPage: React.FC<ChartPageProps> = ({ visible, onClose, asset, marketType, onBuyPress, onSellPress }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

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

  // Calculate chart stats based on current price and change
  const chartStats = {
    current: asset.price,
    high: asset.high || asset.price + Math.abs(asset.change || 0) * 0.8,
    low: asset.low || asset.price - Math.abs(asset.change || 0) * 0.6,
  };

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title={`${asset.symbol} Chart`}
    >
      <View style={styles.pageWrapper}>
        <ScrollView 
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={StyleSheet.flatten([styles.scrollContent, { paddingBottom: insets.bottom + 20 }])}
        >
        {/* Asset Header */}
        <Card padding="large" style={styles.headerCard}>
          <View style={styles.assetHeader}>
            <View style={styles.assetInfo}>
              <Text variant="headline" weight="bold" color="text">
                {asset.symbol}
              </Text>
              {asset.exchange && (
                <Text variant="caption" color="textSecondary">
                  {asset.exchange}
                </Text>
              )}
            </View>
            <View style={styles.priceInfo}>
              <Text variant="title" weight="bold" color="text">
                {formatPrice(asset.price)}
              </Text>
              <View style={[styles.changeContainer, { backgroundColor: changeColor + '20' }]}>
                <Ionicons name={changeIcon} size={14} color={changeColor} />
                <Text variant="caption" weight="medium" style={StyleSheet.flatten([styles.changeText, { color: changeColor }])}>
                  {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change)} ({asset.changePercent.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
          <Text variant="body" color="textSecondary" style={styles.companyName}>
            {asset.name}
          </Text>
        </Card>

        {/* Market Stats Cards */}
        <View style={styles.statsGrid}>
          <Card padding="medium" style={styles.statCard}>
            <Text variant="caption" color="textSecondary" style={styles.statLabel}>
              Volume
            </Text>
            <Text variant="body" weight="semibold" color="text">
              {asset.volume ? `${(asset.volume / 100000).toFixed(1)}L` : '45.7L'}
            </Text>
          </Card>
          <Card padding="medium" style={styles.statCard}>
            <Text variant="caption" color="textSecondary" style={styles.statLabel}>
              Market Cap
            </Text>
            <Text variant="body" weight="semibold" color="text">
              {asset.marketCap ? `${(asset.marketCap / 1e7).toFixed(1)}L Cr` : '1.7L Cr'}
            </Text>
          </Card>
        </View>

        {/* Price Details */}
        <Card padding="large" style={styles.priceDetailsCard}>
          <View style={styles.priceDetailsGrid}>
            <View style={styles.priceDetailItem}>
              <Text variant="caption" color="textSecondary">Open</Text>
              <Text variant="body" weight="medium" color="text">
                {formatPrice(asset.price - (asset.change || 0) + (asset.change || 0) * 0.3)}
              </Text>
            </View>
            <View style={styles.priceDetailItem}>
              <Text variant="caption" color="textSecondary">High</Text>
              <Text variant="body" weight="medium" color="text">
                {formatPrice(chartStats.high)}
              </Text>
            </View>
            <View style={styles.priceDetailItem}>
              <Text variant="caption" color="textSecondary">Low</Text>
              <Text variant="body" weight="medium" color="text">
                {formatPrice(chartStats.low)}
              </Text>
            </View>
            <View style={styles.priceDetailItem}>
              <Text variant="caption" color="textSecondary">Prev Close</Text>
              <Text variant="body" weight="medium" color="text">
                {formatPrice(asset.price - (asset.change || 0))}
              </Text>
            </View>
          </View>
        </Card>

        {/* Live Market Chart */}
        <Card padding="none" style={styles.chartCard}>
          <MarketChart 
            scriptCode={asset.scriptCode?.toString() || asset.symbol} 
            height={400}
            interval="minute"
            daysBack={7}
          />
        </Card>

        {/* Current Price Stats - Optimized Layout */}
        <Card padding="medium" style={styles.currentStatsCard}>
          <View style={styles.currentStatsContainer}>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary" style={styles.statLabel}>Open</Text>
              <Text variant="body" weight="bold" color="text" numberOfLines={1}>
                {formatPrice(asset.price - (asset.change || 0) + (asset.change || 0) * 0.3)}
              </Text>
            </View>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary" style={styles.statLabel}>High</Text>
              <Text variant="body" weight="bold" color="success" numberOfLines={1}>
                {formatPrice(chartStats.high)}
              </Text>
            </View>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary" style={styles.statLabel}>Low</Text>
              <Text variant="body" weight="bold" color="error" numberOfLines={1}>
                {formatPrice(chartStats.low)}
              </Text>
            </View>
          </View>
        </Card>

        </ScrollView>

        {/* 
          Sticky Footer Action Buttons - COMMENTED OUT (not functional yet)
          TODO: Integrate with trading system before enabling
        */}
        {/* 
        <View style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            bottom: (insets.bottom || 0) + 64,
          }
        ]}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.buyButton, { backgroundColor: theme.colors.success }]}
              onPress={() => {
                if (onBuyPress) {
                  onBuyPress();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>BUY</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.sellButton, { backgroundColor: theme.colors.error }]}
              onPress={() => {
                if (onSellPress) {
                  onSellPress();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>SELL</Text>
            </TouchableOpacity>
          </View>
        </View>
        */}
      </View>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageWrapper: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  
  // Header Card
  headerCard: {
    marginBottom: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assetInfo: {
    flex: 1,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    marginLeft: 4,
  },
  companyName: {
    marginTop: 4,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    marginBottom: 4,
  },
  
  // Price Details
  priceDetailsCard: {
    marginBottom: 8,
  },
  priceDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priceDetailItem: {
    width: '48%',
    marginBottom: 12,
  },
  
  // Chart
  chartCard: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  
  // Current Stats
  currentStatsCard: {
    marginBottom: 8,
  },
  currentStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  currentStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  
  // Action Buttons
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000020',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buyButton: {
    // Additional buy button styles if needed
  },
  sellButton: {
    // Additional sell button styles if needed
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default ChartPage;
