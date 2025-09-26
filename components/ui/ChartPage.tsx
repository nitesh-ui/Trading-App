import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Dimensions
} from 'react-native';
import { Card, Text, Button } from '../atomic';
import SlidingPage from './SlidingPage';
import { CandlestickChart } from '../trading';
import { useTheme } from '../../contexts/ThemeContext';
import { AssetItem, MarketType } from '../watchlist/types';
import { formatIndianCurrency } from '../../utils/indianFormatting';

interface ChartPageProps {
  visible: boolean;
  onClose: () => void;
  asset: AssetItem;
  marketType: MarketType;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChartPage: React.FC<ChartPageProps> = ({ visible, onClose, asset, marketType }) => {
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState('5D');

  const timeframes = ['5D', '1M', '1Y', '5Y', 'YTD'];

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

  // Mock chart data for current, high, low based on screenshot
  const chartStats = {
    current: asset.price,
    high: asset.high || asset.price + Math.abs(asset.change || 0) * 0.8,
    low: asset.low || asset.price - Math.abs(asset.change || 0) * 0.6,
  };

  const handleTimeframePress = useCallback((timeframe: string) => {
    setSelectedTimeframe(timeframe);
  }, []);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title={`${asset.symbol} Chart`}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
              {asset.marketCap ? `₹${(asset.marketCap / 1e7).toFixed(1)}L Cr` : '₹1.7L Cr'}
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

        {/* Timeframe Selector */}
        

        {/* Chart */}
        <Card padding="large" style={styles.chartCard}>
          <View style={styles.chartContainer}>
            <CandlestickChart symbol={asset.symbol} />
          </View>
        </Card>

        {/* Chart Legend */}
        <Card padding="medium" style={styles.legendCard}>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
              <Text variant="caption" color="text">Close Price</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
              <Text variant="caption" color="text">High</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
              <Text variant="caption" color="text">Low</Text>
            </View>
          </View>
        </Card>

        {/* Current Stats */}
        <Card padding="large" style={styles.currentStatsCard}>
          <View style={styles.currentStatsContainer}>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary">Current</Text>
              <Text variant="title" weight="bold" color="text">
                {formatPrice(chartStats.current)}
              </Text>
            </View>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary">High</Text>
              <Text variant="title" weight="bold" color="success">
                {formatPrice(chartStats.high)}
              </Text>
            </View>
            <View style={styles.currentStatItem}>
              <Text variant="caption" color="textSecondary">Low</Text>
              <Text variant="title" weight="bold" color="error">
                {formatPrice(chartStats.low)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Buy"
            onPress={() => {
              // Handle buy action
              onClose();
            }}
            variant="primary"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: theme.colors.success }])}
          />
          <Button
            title="Sell"
            onPress={() => {
              // Handle sell action
              onClose();
            }}
            variant="primary"
            style={StyleSheet.flatten([styles.actionButton, { backgroundColor: theme.colors.error }])}
          />
        </View>
      </ScrollView>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
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
  
  // Timeframe
  timeframeCard: {
    marginBottom: 8,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 50,
    alignItems: 'center',
  },
  
  // Chart
  chartCard: {
    marginBottom: 8,
  },
  chartContainer: {
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  // Legend
  legendCard: {
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  // Current Stats
  currentStatsCard: {
    marginBottom: 8,
  },
  currentStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});

export default ChartPage;
