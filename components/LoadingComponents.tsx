/**
 * Loading Components with Shimmer Effects
 * Production-ready skeleton screens and loading states
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Base Shimmer Component
 * Creates animated shimmer effect for loading states
 */
const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const shimmerColors = [
    theme.colors.card,
    theme.colors.border,
    theme.colors.card,
  ];

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.card,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Stock Card Skeleton
 * Loading state for stock/crypto/forex cards
 */
export const StockCardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.cardHeader}>
        <View>
          <Shimmer width={80} height={16} style={{ marginBottom: 4 }} />
          <Shimmer width={120} height={12} />
        </View>
        <Shimmer width={60} height={20} borderRadius={10} />
      </View>
      
      <View style={styles.cardPrice}>
        <Shimmer width={100} height={24} style={{ marginBottom: 4 }} />
        <Shimmer width={80} height={14} />
      </View>
      
      <View style={styles.cardChart}>
        <Shimmer width="100%" height={80} borderRadius={8} />
      </View>
    </View>
  );
};

/**
 * Portfolio Summary Skeleton
 * Loading state for portfolio overview
 */
export const PortfolioSummarySkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.summaryHeader}>
        <Shimmer width={120} height={16} style={{ marginBottom: 8 }} />
        <Shimmer width={150} height={32} style={{ marginBottom: 4 }} />
        <Shimmer width={100} height={16} />
      </View>
      
      <View style={styles.summaryStats}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statItem}>
            <Shimmer width={60} height={12} style={{ marginBottom: 4 }} />
            <Shimmer width={80} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Trade Item Skeleton
 * Loading state for trade history items
 */
export const TradeItemSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.tradeHeader}>
        <View style={styles.tradeLeft}>
          <Shimmer width={80} height={16} style={{ marginBottom: 4 }} />
          <Shimmer width={120} height={12} />
        </View>
        <View style={styles.tradeRight}>
          <Shimmer width={40} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
          <Shimmer width={60} height={18} borderRadius={9} />
        </View>
      </View>
      
      <View style={styles.tradeDetails}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.detailItem}>
            <Shimmer width={50} height={12} style={{ marginBottom: 2 }} />
            <Shimmer width={70} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Market Movers Skeleton
 * Loading state for top gainers/losers
 */
export const MarketMoversSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Shimmer width={120} height={18} style={{ marginBottom: 16 }} />
      
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.moverItem}>
          <View style={styles.moverLeft}>
            <Shimmer width={60} height={14} style={{ marginBottom: 2 }} />
            <Shimmer width={80} height={12} />
          </View>
          <View style={styles.moverRight}>
            <Shimmer width={70} height={14} style={{ marginBottom: 2 }} />
            <Shimmer width={50} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Chart Skeleton
 * Loading state for charts and graphs
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
      <View style={styles.chartHeader}>
        <Shimmer width={100} height={16} style={{ marginBottom: 4 }} />
        <Shimmer width={80} height={12} />
      </View>
      
      <View style={styles.chartContent}>
        <Shimmer width="100%" height={height} borderRadius={8} />
      </View>
      
      <View style={styles.chartLegend}>
        {[1, 2, 3, 4].map((i) => (
          <Shimmer key={i} width={40} height={12} />
        ))}
      </View>
    </View>
  );
};

/**
 * List Skeleton
 * Generic skeleton for lists with custom item count
 */
export const ListSkeleton: React.FC<{ 
  itemCount?: number;
  renderItem?: () => React.ReactNode;
}> = ({ 
  itemCount = 5,
  renderItem = () => <StockCardSkeleton />
}) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: itemCount }, (_, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          {renderItem()}
        </View>
      ))}
    </View>
  );
};

/**
 * Screen Skeleton
 * Full-screen loading skeleton with header
 */
export const ScreenSkeleton: React.FC<{ 
  title?: string;
  showHeader?: boolean;
}> = ({ 
  title = "Loading...",
  showHeader = true 
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      {showHeader && (
        <View style={styles.skeletonHeader}>
          <Shimmer width={120} height={28} style={{ marginBottom: 16 }} />
        </View>
      )}
      
      <View style={styles.skeletonContent}>
        <ListSkeleton itemCount={6} />
      </View>
    </View>
  );
};

/**
 * Inline Loading Component
 * Small spinner for buttons or inline actions
 */
export const InlineLoader: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20,
  color 
}) => {
  const { theme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();
    return () => spinAnimation.stop();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.inlineLoader,
        {
          width: size,
          height: size,
          borderColor: color || theme.colors.primary,
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardPrice: {
    marginBottom: 16,
  },
  cardChart: {
    marginTop: 8,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tradeLeft: {
    flex: 1,
  },
  tradeRight: {
    alignItems: 'flex-end',
  },
  tradeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  moverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  moverLeft: {
    flex: 1,
  },
  moverRight: {
    alignItems: 'flex-end',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  chartHeader: {
    marginBottom: 12,
  },
  chartContent: {
    marginVertical: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  listContainer: {
    paddingVertical: 8,
  },
  screenContainer: {
    flex: 1,
  },
  skeletonHeader: {
    padding: 16,
    paddingTop: 60, // Account for status bar
  },
  skeletonContent: {
    flex: 1,
  },
  inlineLoader: {
    borderWidth: 2,
    borderRadius: 10,
    borderTopColor: 'transparent',
  },
});

export default Shimmer;
