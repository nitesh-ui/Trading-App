import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { Card, Text } from '../atomic';
import { AssetItem, MarketType, StockExchangeFilter } from './types';

interface OptimizedSearchProps {
  isExpanded: boolean;
  searchQuery: string;
  searchResults: AssetItem[];
  marketType: MarketType;
  selectedExchange: StockExchangeFilter;
  availableExchanges: StockExchangeFilter[];
  onSearchToggle: () => void;
  onSearchQueryChange: (query: string) => void;
  onExchangeChange: (exchange: StockExchangeFilter) => void;
  onAssetSelect: (asset: AssetItem) => void;
  onAddToWatchlist: (symbol: string) => void;
  theme: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLLAPSED_WIDTH = 44;
const EXPANDED_WIDTH = SCREEN_WIDTH - 32;

const OptimizedSearch = memo<OptimizedSearchProps>(({
  isExpanded,
  searchQuery,
  searchResults,
  marketType,
  selectedExchange,
  availableExchanges,
  onSearchToggle,
  onSearchQueryChange,
  onExchangeChange,
  onAssetSelect,
  onAddToWatchlist,
  theme,
}) => {
  const inputRef = useRef<TextInput>(null);
  const widthAnim = useRef(new Animated.Value(COLLAPSED_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShowResults(true);
      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: EXPANDED_WIDTH,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      Animated.parallel([
        Animated.timing(widthAnim, {
          toValue: COLLAPSED_WIDTH,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowResults(false);
        onSearchQueryChange('');
      });
    }
  }, [isExpanded, widthAnim, opacityAnim, onSearchQueryChange]);

  const formatPrice = useCallback((price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    if (marketType === 'crypto' && price > 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  }, [marketType]);

  const renderSearchResult = useCallback(({ item }: { item: AssetItem }) => {
    const changeColor = item.change >= 0 ? theme.colors.success : theme.colors.error;
    
    return (
      <TouchableOpacity
        onPress={() => onAssetSelect(item)}
        style={[styles.resultItem, { borderBottomColor: theme.colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.resultInfo}>
          <View style={styles.resultHeader}>
            <Text variant="subtitle" weight="medium" color="text">
              {item.symbol}
            </Text>
            {item.exchange && (
              <Text variant="caption" color="textSecondary" style={styles.resultExchange}>
                {item.exchange}
              </Text>
            )}
          </View>
          <Text variant="body" color="textSecondary" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        <View style={styles.resultPrice}>
          <Text variant="subtitle" weight="medium" color="text">
            {formatPrice(item.price)}
          </Text>
          <Text variant="caption" style={{ color: changeColor }}>
            {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => onAddToWatchlist(item.symbol)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="white" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [theme, formatPrice, onAssetSelect, onAddToWatchlist]);

  const renderExchangeFilter = () => {
    if (marketType !== 'stocks' || availableExchanges.length <= 1) return null;

    return (
      <View style={styles.exchangeFilter}>
        <Text variant="caption" color="textSecondary" style={styles.filterLabel}>
          Exchange:
        </Text>
        <View style={styles.exchangeButtons}>
          {availableExchanges.map((exchange) => (
            <TouchableOpacity
              key={exchange}
              onPress={() => onExchangeChange(exchange)}
              style={[
                styles.exchangeButton,
                {
                  backgroundColor: selectedExchange === exchange 
                    ? theme.colors.primary 
                    : 'transparent',
                  borderColor: theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                variant="caption"
                weight="medium"
                style={{
                  color: selectedExchange === exchange 
                    ? 'white' 
                    : theme.colors.text,
                }}
              >
                {exchange}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            width: widthAnim,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onSearchToggle}
          style={styles.searchIcon}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isExpanded ? "close" : "search"} 
            size={20} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View style={[styles.inputContainer, { opacity: opacityAnim }]}>
            <TextInput
              ref={inputRef}
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder={`Search ${marketType}...`}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
            />
          </Animated.View>
        )}
      </Animated.View>

      {showResults && isExpanded && (
        <Card padding="none" style={styles.resultsContainer}>
          {renderExchangeFilter()}
          
          {searchQuery.length >= 2 ? (
            searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => `${item.symbol}-${item.exchange}`}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
              />
            ) : (
              <View style={styles.noResults}>
                <Ionicons name="search" size={32} color={theme.colors.textSecondary} />
                <Text variant="body" color="textSecondary" style={styles.noResultsText}>
                  No {marketType} found for "{searchQuery}"
                </Text>
              </View>
            )
          ) : (
            <View style={styles.searchHint}>
              <Ionicons name="information-circle" size={24} color={theme.colors.textSecondary} />
              <Text variant="body" color="textSecondary" style={styles.hintText}>
                Type at least 2 characters to search
              </Text>
            </View>
          )}
        </Card>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    marginLeft: 8,
    marginRight: 12,
  },
  searchInput: {
    fontSize: 16,
    height: 36,
    paddingVertical: 0,
  },
  resultsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    maxHeight: 400,
    zIndex: 1001,
  },
  exchangeFilter: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterLabel: {
    marginBottom: 8,
  },
  exchangeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exchangeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  resultExchange: {
    marginLeft: 6,
    opacity: 0.7,
  },
  resultPrice: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    marginTop: 8,
    textAlign: 'center',
  },
  searchHint: {
    alignItems: 'center',
    padding: 24,
  },
  hintText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

OptimizedSearch.displayName = 'OptimizedSearch';
export default OptimizedSearch;
