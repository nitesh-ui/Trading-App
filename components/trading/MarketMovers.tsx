import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Text } from '../atomic';
import { PriceDisplay } from './PriceDisplay';
import type { StockData } from './StockCard';

interface MarketMoversProps {
  gainers: StockData[];
  losers: StockData[];
}

export const MarketMovers: React.FC<MarketMoversProps> = ({
  gainers,
  losers,
}) => {
  const { theme } = useTheme();

  const renderStockRow = (stock: StockData) => (
    <View key={stock.symbol} style={styles.stockRow}>
      <View style={styles.stockInfo}>
        <Text variant="body" weight="semibold" color="text">
          {stock.symbol}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {stock.name}
        </Text>
      </View>
      <View style={styles.priceInfo}>
        <PriceDisplay
          price={stock.price}
          change={stock.change}
          changePercent={stock.changePercent}
          size="small"
          showSymbol={false}
          showChange={true}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text variant="title" weight="bold" color="text" style={styles.sectionTitle}>
        Market Movers
      </Text>
      
      <View style={styles.moversContainer}>
        {/* Top Gainers */}
        <View style={styles.moversSection}>
          <Card padding="medium">
            <Text 
              variant="subtitle" 
              weight="semibold" 
              color="profit" 
              style={styles.categoryTitle}
            >
              Top Gainers
            </Text>
            <ScrollView 
              style={styles.stocksList}
              showsVerticalScrollIndicator={false}
            >
              {gainers.map(renderStockRow)}
            </ScrollView>
          </Card>
        </View>

        {/* Top Losers */}
        <View style={styles.moversSection}>
          <Card padding="medium">
            <Text 
              variant="subtitle" 
              weight="semibold" 
              color="loss" 
              style={styles.categoryTitle}
            >
              Top Losers
            </Text>
            <ScrollView 
              style={styles.stocksList}
              showsVerticalScrollIndicator={false}
            >
              {losers.map(renderStockRow)}
            </ScrollView>
          </Card>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  moversContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  moversSection: {
    flex: 1,
  },
  categoryTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  stocksList: {
    maxHeight: 200,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
});
