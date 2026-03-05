/**
 * TradingViewChartButton Component
 * 
 * Example component demonstrating the usage of the TradingView symbol
 * validation system. Only shows the "Open Chart" button if the symbol
 * is supported on TradingView.
 * 
 * @module components/trading/TradingViewChartButton
 */

import React from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Linking,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTradingViewAvailability } from '../../hooks/useTradingViewAvailability';

interface TradingViewChartButtonProps {
  /** The ticker symbol to display chart for */
  ticker: string;
  /** Optional callback when chart is opened */
  onOpenChart?: (symbol: string) => void;
  /** Whether to open in external browser or use callback */
  openExternal?: boolean;
  /** Custom button style */
  style?: object;
  /** Custom text style */
  textStyle?: object;
  /** Show reason when not supported */
  showReason?: boolean;
}

/**
 * Button component that only renders if the ticker is supported on TradingView
 */
export const TradingViewChartButton: React.FC<TradingViewChartButtonProps> = ({
  ticker,
  onOpenChart,
  openExternal = false,
  style,
  textStyle,
  showReason = false,
}) => {
  const { supported, symbol, category, reason } = useTradingViewAvailability(ticker);

  const handlePress = () => {
    if (!symbol) return;

    if (openExternal) {
      // Open in TradingView web
      const url = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open TradingView');
      });
    } else if (onOpenChart) {
      // Use callback to open in-app chart
      onOpenChart(symbol);
    }
  };

  // Don't render if not supported
  if (!supported || !symbol) {
    if (showReason && reason) {
      return (
        <View style={styles.unsupportedContainer}>
          <Ionicons name="alert-circle-outline" size={16} color="#888" />
          <Text style={styles.unsupportedText}>{reason}</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="stats-chart" size={18} color="#fff" />
      <Text style={[styles.buttonText, textStyle]}>Open Chart</Text>
      <Text style={styles.categoryBadge}>{category.replace('_', ' ')}</Text>
    </TouchableOpacity>
  );
};

/**
 * Example Asset Card with TradingView integration
 */
interface AssetCardProps {
  ticker: string;
  name: string;
  price: number;
  change: number;
  onOpenChart?: (symbol: string) => void;
}

export const AssetCardWithChart: React.FC<AssetCardProps> = ({
  ticker,
  name,
  price,
  change,
  onOpenChart,
}) => {
  const { supported, symbol, category } = useTradingViewAvailability(ticker);
  const changeColor = change >= 0 ? '#00C853' : '#FF1744';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.ticker}>{ticker}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{price.toLocaleString()}</Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* TradingView Chart Section */}
      <View style={styles.chartSection}>
        {supported && symbol ? (
          <TouchableOpacity
            style={styles.chartButton}
            onPress={() => onOpenChart?.(symbol)}
            activeOpacity={0.7}
          >
            <Ionicons name="trending-up" size={20} color="#007AFF" />
            <Text style={styles.chartButtonText}>View Chart</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {category === 'NSE_EQUITY' ? 'NSE' : 
                 category === 'MCX_COMMODITY' ? 'MCX' :
                 category === 'CRYPTO' ? 'Crypto' :
                 category === 'FOREX' ? 'Forex' : 'US'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noChartContainer}>
            <Ionicons name="analytics-outline" size={20} color="#888" />
            <Text style={styles.noChartText}>Chart not available</Text>
          </View>
        )}
      </View>
    </View>
  );
};

/**
 * Example usage demonstration
 */
export const TradingViewDemo: React.FC = () => {
  const testTickers = [
    // Valid symbols
    { ticker: 'RELIANCE', expectedSupported: true },
    { ticker: 'BANKNIFTY', expectedSupported: true },
    { ticker: 'GOLD', expectedSupported: true },
    { ticker: 'BTCUSDT', expectedSupported: true },
    { ticker: 'EURUSD', expectedSupported: true },
    { ticker: 'AAPL', expectedSupported: true },
    // Invalid symbols
    { ticker: 'NIFTY2610526100CE', expectedSupported: false },
    { ticker: 'GOLD25FEBFUT', expectedSupported: false },
    { ticker: 'CRUDEOILM28JANFUT', expectedSupported: false },
    { ticker: 'INFY26JANFUT', expectedSupported: false },
  ];

  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>TradingView Symbol Validation Demo</Text>
      
      {testTickers.map(({ ticker, expectedSupported }) => (
        <TradingViewChartButton
          key={ticker}
          ticker={ticker}
          showReason={true}
          onOpenChart={(symbol) => {
            Alert.alert('Open Chart', `Symbol: ${symbol}`);
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryBadge: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  unsupportedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    gap: 6,
  },
  unsupportedText: {
    fontSize: 12,
    color: '#888',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticker: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  name: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  change: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  chartSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  chartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  chartButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  noChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 8,
  },
  noChartText: {
    color: '#888',
    fontSize: 14,
  },
  demoContainer: {
    padding: 16,
    gap: 12,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
});

export default TradingViewChartButton;
