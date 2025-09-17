import React, { memo, useCallback } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text } from '../atomic';
import { StockCard, ForexCard, CryptoCard } from '../trading';
import { AssetItem, MarketType } from './types';

export interface AssetListProps {
  data: AssetItem[];
  marketType: MarketType;
  onAssetPress: (asset: AssetItem) => void;
  onTradePress: (asset: AssetItem, action: 'buy' | 'sell') => void;
  onRemovePress: (symbol: string) => void;
  theme: any;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const AssetList = memo<AssetListProps>(({
  data,
  marketType,
  onAssetPress,
  onTradePress,
  onRemovePress,
  theme,
  refreshing = false,
  onRefresh,
}) => {
  const renderAssetCard = useCallback((item: AssetItem) => {
    const commonProps = {
      key: item.symbol,
      onPress: () => onAssetPress(item),
      onBuyPress: () => onTradePress(item, 'buy'),
      onSellPress: () => onTradePress(item, 'sell'),
      onRemovePress: () => onRemovePress(item.symbol),
    };

    switch (marketType) {
      case 'stocks':
        return <StockCard stock={item} {...commonProps} />;
      case 'forex':
        return <ForexCard pair={item} {...commonProps} />;
      case 'crypto':
        // Convert AssetItem to CryptoData format
        const cryptoData = {
          id: item.symbol.toLowerCase(),
          symbol: item.symbol,
          name: item.name,
          price: item.price,
          change24h: item.change,
          changePercent24h: item.changePercent,
          volume24h: item.volume || 0,
          marketCap: item.marketCap || 0,
          rank: 1, // Default rank
        };
        return <CryptoCard crypto={cryptoData} {...commonProps} />;
      default:
        return null;
    }
  }, [marketType, onAssetPress, onTradePress, onRemovePress]);

  const keyExtractor = useCallback((item: AssetItem) => `${item.symbol}-${item.exchange}`, []);

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
        <Text variant="body" color="textSecondary" style={styles.emptyText}>
          No {marketType} in your watchlist
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
          Use the search to add {marketType} to your watchlist
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => renderAssetCard(item)}
      keyExtractor={keyExtractor}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshing={refreshing}
      onRefresh={onRefresh}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={10}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => ({
        length: 80,
        offset: 80 * index,
        index,
      })}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
  },
});

AssetList.displayName = 'AssetList';

export default AssetList;
