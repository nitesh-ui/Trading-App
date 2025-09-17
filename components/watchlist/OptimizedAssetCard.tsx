import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { Card, Text } from '../atomic';
import { AssetItem, MarketType } from './types';

interface OptimizedAssetCardProps {
  asset: AssetItem;
  marketType: MarketType;
  onPress: () => void;
  onBuyPress: () => void;
  onSellPress: () => void;
  onRemovePress: () => void;
  theme: any;
}

const OptimizedAssetCard = memo<OptimizedAssetCardProps>(({
  asset,
  marketType,
  onPress,
  onBuyPress,
  onSellPress,
  onRemovePress,
  theme,
}) => {
  const formatPrice = (price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    if (marketType === 'crypto' && price > 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const changeColor = asset.change >= 0 ? theme.colors.success : theme.colors.error;
  const changeIcon = asset.change >= 0 ? 'trending-up' : 'trending-down';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card padding="medium" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.symbolContainer}>
            <Text variant="subtitle" weight="bold" color="text">
              {asset.symbol}
            </Text>
            {asset.exchange && (
              <Text variant="caption" color="textSecondary" style={styles.exchange}>
                {asset.exchange}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onRemovePress}
            style={[styles.removeButton, { backgroundColor: theme.colors.surface }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.priceContainer}>
            <Text variant="headline" weight="bold" color="text">
              {formatPrice(asset.price)}
            </Text>
            <View style={[styles.changeContainer, { backgroundColor: changeColor + '20' }]}>
              <Ionicons name={changeIcon} size={14} color={changeColor} />
              <Text variant="caption" color="textSecondary" style={[styles.changeText, { color: changeColor }] as any}>
                {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change)} ({asset.changePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onBuyPress}
              style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
              activeOpacity={0.8}
            >
              <Text variant="caption" weight="bold" style={styles.buttonText}>
                BUY
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSellPress}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              activeOpacity={0.8}
            >
              <Text variant="caption" weight="bold" style={styles.buttonText}>
                SELL
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text variant="caption" color="textSecondary" style={styles.nameText}>
          {asset.name}
        </Text>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symbolContainer: {
    flex: 1,
  },
  exchange: {
    marginTop: 2,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceContainer: {
    flex: 1,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  changeText: {
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
  },
  nameText: {
    marginTop: 8,
    opacity: 0.8,
  },
});

OptimizedAssetCard.displayName = 'OptimizedAssetCard';
export default OptimizedAssetCard;
