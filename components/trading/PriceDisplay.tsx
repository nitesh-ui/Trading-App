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
  showCurrency = false,
  currencySymbol = '',
  showSymbol = false, // For compatibility
  showChange = true, // For compatibility
  align = 'right', // Default to right alignment
  style,
  theme: providedTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = providedTheme || contextTheme;
  
  // Calculate change from changePercent if change is 0 or very small
  let displayChange = change;
  if (Math.abs(change) < 0.01 && Math.abs(changePercent) > 0.01) {
    // Calculate change value from percentage: change = (price * changePercent) / 100
    displayChange = (price * changePercent) / 100;
    console.log('🔄 Calculated change from percent:', {
      price,
      changePercent,
      calculatedChange: displayChange,
      originalChange: change
    });
  }
  
  // Use changePercent to determine color (more reliable than change value)
  const isPositive = changePercent >= 0;
  const changeColor = isPositive ? theme.colors.success : theme.colors.error;
  
  // Format price with consistent decimal places to prevent layout shifts
  const formatPrice = (value: number): string => {
    return value.toFixed(2);
  };
  
  // Format change with consistent formatting - preserves sign
  const formatChange = (value: number): string => {
    const absValue = Math.abs(value);
    const formatted = absValue.toFixed(2);
    
    // If both change and percent are essentially 0, show 0.00
    if (absValue < 0.01 && Math.abs(changePercent) < 0.01) {
      return '0.00';
    }
    
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };
  
  // Format percentage with consistent formatting - preserves sign
  const formatPercent = (value: number): string => {
    const absValue = Math.abs(value);
    const formatted = absValue.toFixed(2);
    
    // If value is 0, just return 0.00% without sign
    if (absValue < 0.01) {
      return '0.00%';
    }
    
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
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
          {formatPrice(price)}
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
            {formatChange(displayChange)}
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
