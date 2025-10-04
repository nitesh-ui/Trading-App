import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../atomic';

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'small' | 'medium' | 'large';
  showCurrency?: boolean;
  currencySymbol?: string;
  showSymbol?: boolean; // For compatibility
  showChange?: boolean; // For compatibility
  align?: 'left' | 'center' | 'right'; // New prop for alignment
  style?: any;
  theme?: any; // Optional theme prop
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  change,
  changePercent,
  size = 'medium',
  showCurrency = true,
  currencySymbol = '₹',
  showSymbol = true, // For compatibility
  showChange = true, // For compatibility
  align = 'right', // Default to right alignment
  style,
  theme: providedTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = providedTheme || contextTheme;
  
  const isPositive = change >= 0;
  const changeColor = isPositive ? theme.colors.success : theme.colors.error;
  
  // Format price with consistent decimal places to prevent layout shifts
  const formatPrice = (value: number): string => {
    return value.toFixed(2);
  };
  
  // Format change with consistent formatting
  const formatChange = (value: number): string => {
    const formatted = Math.abs(value).toFixed(2);
    return isPositive ? `+${formatted}` : `-${formatted}`;
  };
  
  // Format percentage with consistent formatting
  const formatPercent = (value: number): string => {
    const formatted = Math.abs(value).toFixed(2);
    return isPositive ? `+${formatted}%` : `-${formatted}%`;
  };

  const sizeStyles = {
    small: {
      price: { fontSize: 14 },
      change: { fontSize: 12 },
    },
    medium: {
      price: { fontSize: 16 },
      change: { fontSize: 14 },
    },
    large: {
      price: { fontSize: 20 },
      change: { fontSize: 16 },
    },
  };

  const getAlignment = () => {
    switch (align) {
      case 'left': return 'flex-start';
      case 'center': return 'center';
      case 'right': return 'flex-end';
      default: return 'flex-end';
    }
  };

  const getTextAlign = (): 'left' | 'center' | 'right' => {
    return align;
  };

  return (
    <View style={[styles.container, { alignItems: getAlignment() }, style]}>
      <View style={styles.priceContainer}>
        <Text 
          style={{
            ...styles.price, 
            color: theme.colors.text,
            fontSize: sizeStyles[size].price.fontSize,
            textAlign: getTextAlign(),
          }}
          weight="bold"
        >
          {(showCurrency && showSymbol) && currencySymbol}{formatPrice(price)}
        </Text>
      </View>
      
      {showChange && (
        <View style={[styles.changeContainer, { justifyContent: getAlignment() }]}>
          <Text 
            style={{
              ...styles.change,
              color: changeColor,
              fontSize: sizeStyles[size].change.fontSize,
              textAlign: getTextAlign(),
            }}
            weight="medium"
          >
            {formatChange(change)}
          </Text>
          <Text 
            style={{
              ...styles.percent,
              color: changeColor,
              fontSize: sizeStyles[size].change.fontSize,
              textAlign: getTextAlign(),
            }}
            weight="medium"
          >
            {formatPercent(changePercent)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%', // Take full width of parent
    minWidth: 100, // Prevent layout shifts
    maxWidth: '100%', // Prevent overflow
    overflow: 'hidden', // Hide overflow
  },
  priceContainer: {
    minHeight: 20, // Stable height
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%', // Prevent overflow
    overflow: 'hidden', // Hide overflow
  },
  price: {
    // textAlign will be set dynamically
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 18, // Stable height
    width: '100%',
  },
  change: {
    // textAlign will be set dynamically
  },
  percent: {
    // textAlign will be set dynamically
  },
});
