import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Text } from '../atomic';
import { PriceDisplay } from './PriceDisplay';

interface PortfolioData {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  dayChange: number;
  dayChangePercent: number;
  investedAmount: number;
  availableCash: number;
}

interface PortfolioSummaryProps {
  portfolio: PortfolioData;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  portfolio,
}) => {
  const { theme } = useTheme();

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card padding="large">
      <View style={styles.container}>
        {/* Main Portfolio Value */}
        <View style={styles.mainValue}>
          <PriceDisplay
            price={portfolio.totalValue}
            change={portfolio.totalChange}
            changePercent={portfolio.totalChangePercent}
            size="large"
            showSymbol={true}
            showChange={true}
          />
          <Text variant="caption" color="textSecondary" style={styles.label}>
            Total Portfolio Value
          </Text>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {formatCurrency(portfolio.dayChange)}
            </Text>
            <Text 
              variant="caption" 
              color={portfolio.dayChangePercent >= 0 ? 'profit' : 'loss'}
              weight="medium"
            >
              {portfolio.dayChangePercent >= 0 ? '+' : ''}{portfolio.dayChangePercent.toFixed(2)}%
            </Text>
            <Text variant="caption" color="textSecondary">
              Today's Change
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {formatCurrency(portfolio.investedAmount)}
            </Text>
            <Text variant="caption" color="textSecondary">
              Invested
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {formatCurrency(portfolio.availableCash)}
            </Text>
            <Text variant="caption" color="textSecondary">
              Available Cash
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainValue: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
});
