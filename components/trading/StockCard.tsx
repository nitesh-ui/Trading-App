import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { formatMarketCap, formatVolume } from '../../utils/indianFormatting';
import { PriceDisplay } from './PriceDisplay';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

export type { StockData };

interface StockCardProps {
  stock: StockData;
  onPress?: () => void;
  showDetails?: boolean;
}

export const StockCard: React.FC<StockCardProps> = React.memo(({
  stock,
  onPress,
  showDetails = false,
}) => {
  const { theme } = useTheme();
  const animatedHeight = React.useRef(new Animated.Value(showDetails ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showDetails, animatedHeight]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1}>
      <View style={{
        ...styles.container,
        backgroundColor: theme.colors.card || '#FFFFFF',
        borderColor: theme.colors.border || '#E0E0E0',
        shadowColor: theme.colors.text || '#000000',
      }}>
        <View style={styles.header}>
          <View style={{...styles.leftSection, flex: 0.65, maxWidth: '65%'}}>
            <View style={{...styles.stockInfo, flex: 1}}>
              <Text 
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors.text || '#000000',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {stock.symbol}
              </Text>
              <Text 
                style={{
                  fontSize: 14,
                  color: theme.colors.textSecondary || '#666666',
                  marginTop: 2,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {stock.name}
              </Text>
            </View>
          </View>
          
          <View style={{...styles.priceSection, flex: 0.35, maxWidth: '35%'}}>
            <PriceDisplay
              price={stock.price}
              change={stock.change}
              changePercent={stock.changePercent}
              size="medium"
              showSymbol={true}
              showChange={true}
            />
          </View>
        </View>

        <Animated.View style={{
          ...styles.footer,
          borderTopColor: theme.colors.border,
          opacity: animatedHeight,
          maxHeight: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 100],
          }),
          marginTop: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 12],
          }),
          paddingTop: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 12],
          }),
          overflow: 'hidden',
        }}>
          {stock.volume && (            <View style={styles.statItem}>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary || '#666666' }}>
              Volume
            </Text>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: theme.colors.text || '#000000',
              marginTop: 2,
            }}>
              {formatVolume(stock.volume)}
            </Text>
          </View>
          )}
          
          {stock.marketCap && (
            <View style={styles.statItem}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary || '#666666' }}>
                Market Cap
              </Text>
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '600', 
                color: theme.colors.text || '#000000',
                marginTop: 2,
              }}>
                {formatMarketCap(stock.marketCap)}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginHorizontal: 0,
    marginVertical: 2,
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 50,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  stockInfo: {
    flex: 1,
    minWidth: 0,
  },
  priceSection: {
    alignItems: 'flex-end',
    minWidth: 120,
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
});
