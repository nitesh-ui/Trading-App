import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { PriceDisplay } from './PriceDisplay';

interface RealTimePriceIndicatorProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'small' | 'medium' | 'large';
  showSymbol?: boolean;
  showChange?: boolean;
  align?: 'left' | 'center' | 'right';
  isRealTimeUpdate?: boolean;
  lastUpdated?: string;
}

export const RealTimePriceIndicator: React.FC<RealTimePriceIndicatorProps> = ({
  price,
  change,
  changePercent,
  size = 'medium',
  showSymbol = false,
  showChange = true,
  align = 'left',
  isRealTimeUpdate = false,
  lastUpdated,
}) => {
  const flashAnimation = useRef(new Animated.Value(1)).current;
  const previousPrice = useRef(price);

  useEffect(() => {
    if (isRealTimeUpdate && price !== previousPrice.current) {
      // Flash animation when price updates
      Animated.sequence([
        Animated.timing(flashAnimation, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      previousPrice.current = price;
    }
  }, [price, isRealTimeUpdate, flashAnimation]);

  const flashColor = change >= 0 ? '#4CAF50' : '#F44336';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnimation,
            backgroundColor: isRealTimeUpdate ? flashColor : 'transparent',
          },
        ]}
      />
      <PriceDisplay
        price={price}
        change={change}
        changePercent={changePercent}
        size={size}
        showSymbol={showSymbol}
        showChange={showChange}
        align={align}
      />
      {isRealTimeUpdate && lastUpdated && (
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: '#4CAF50' }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  flashOverlay: {
    position: 'absolute',
    top: -2,
    left: -4,
    right: -4,
    bottom: -2,
    borderRadius: 4,
    zIndex: -1,
  },
  liveIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  liveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
