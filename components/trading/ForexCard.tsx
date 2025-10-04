import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { PriceDisplay } from './PriceDisplay';

interface ForexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  spread?: number;
  pipValue?: number;
}

export type { ForexData };

interface ForexCardProps {
  pair: ForexData;
  onPress?: () => void;
  showDetails?: boolean;
  theme?: any; // Optional theme prop
}

export const ForexCard: React.FC<ForexCardProps> = React.memo(({
  pair,
  onPress,
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

  const formatVolume = React.useCallback((volume?: number): string => {
    if (!volume) return 'N/A';
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }, []);

  const formatSpread = React.useCallback((spread?: number): string => {
    if (!spread) return 'N/A';
    return spread.toFixed(4);
  }, []);

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
            <View style={[styles.forexInfo, { flex: 1 }]}>
              <Text 
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: theme.colors.text || '#000000',
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {pair.symbol}
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
                {pair.name}
              </Text>
            </View>
          </View>
          
          <View style={[styles.priceSection, { flex: 0.45, maxWidth: '45%' }]}>
            <PriceDisplay
              price={pair.price}
              change={pair.change}
              changePercent={pair.changePercent}
              size="medium"
              showSymbol={false}
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
          <View style={styles.statItem}>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary || '#666666' }}>Volume</Text>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: theme.colors.text || '#000000',
              marginTop: 2,
            }}>
              {formatVolume(pair.volume)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary || '#666666' }}>Spread</Text>
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: theme.colors.text || '#000000',
              marginTop: 2,
            }}>
              {formatSpread(pair.spread)}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  forexInfo: {
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
