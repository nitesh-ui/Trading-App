import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PriceDisplay } from './PriceDisplay';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
}

interface CryptoCardProps {
  crypto: CryptoData;
  onPress?: () => void;
  style?: any;
  showDetails?: boolean;
  theme?: any; // Optional theme prop
}

export const CryptoCard: React.FC<CryptoCardProps> = React.memo(({
  crypto,
  onPress,
  style,
  showDetails = false,
  theme: providedTheme,
}) => {
  const { theme: contextTheme } = useTheme();
  const theme = providedTheme || contextTheme;
  const animatedHeight = React.useRef(new Animated.Value(showDetails ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showDetails ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showDetails, animatedHeight]);

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    } else {
      return `${volume.toFixed(0)}`;
    }
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(1)}B`;
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(1)}M`;
    } else {
      return `${marketCap.toFixed(0)}`;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={1}>
      <View style={{
        ...styles.container,
        backgroundColor: theme.colors.card || '#FFFFFF',
        borderColor: theme.colors.border || '#E0E0E0',
        shadowColor: theme.colors.text || '#000000',
      }}>
        <View style={styles.header}>
          <View style={[styles.leftSection, { flex: 0.55, maxWidth: '55%' }]}>
            <View style={styles.rankBadge}>
              <Text
                style={{
                  ...styles.rankText,
                  color: theme.colors.primary || '#007AFF',
                }}
              >
                #{crypto.rank}
              </Text>
            </View>
            <View style={{...styles.cryptoInfo, flex: 1}}>
              <Text 
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors.text || '#000000',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {crypto.name}
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
                {crypto.symbol}
              </Text>
            </View>
          </View>
          
          <View style={[styles.priceSection, { flex: 0.45, maxWidth: '45%' }]}>
            <PriceDisplay
              price={crypto.price}
              change={crypto.change24h}
              changePercent={crypto.changePercent24h}
              size="medium"
              showCurrency={false}
              showSymbol={false}
              showChange={true}
            />
          </View>
        </View>

        <Animated.View style={{
          ...styles.footer,
          borderTopColor: theme.colors.border || 'rgba(0, 0, 0, 0.05)',
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
          <View style={styles.statItem}>
            <Text 
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary || '#666666',
              }}
            >
              Volume 24h
            </Text>
            <Text 
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: theme.colors.text || '#000000',
              }}
            >
              {formatVolume(crypto.volume24h)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text 
              style={{
                fontSize: 12,
                color: theme.colors.textSecondary || '#666666',
              }}
            >
              Market Cap
            </Text>
            <Text 
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: theme.colors.text || '#000000',
              }}
            >
              {formatMarketCap(crypto.marketCap)}
            </Text>
          </View>
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  rankBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
    minWidth: 32,
    alignItems: 'center',
    flexShrink: 0,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cryptoInfo: {
    flex: 1,
    minWidth: 0,
  },
  priceSection: {
    alignItems: 'flex-end',
    minWidth: 100,
    maxWidth: '45%',
    flexShrink: 1,
    paddingLeft: 8,
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
