import React, { useState, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Dimensions,
  Pressable,
  Keyboard,
} from 'react-native';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useWatchlist } from '../watchlist/WatchlistContext';
import { Ionicons } from '@expo/vector-icons';
import SlidingPage from '../ui/SlidingPage';
import { AssetItem, MarketType } from '../watchlist/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchPageProps {
  visible: boolean;
  onClose: () => void;
}

interface FilterOption {
  id: string;
  label: string;
  value: MarketType | 'all';
  icon: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', value: 'all', icon: 'apps' },
  { id: 'stocks', label: 'Stocks', value: 'stocks', icon: 'trending-up' },
  { id: 'crypto', label: 'Crypto', value: 'crypto', icon: 'logo-bitcoin' },
  { id: 'forex', label: 'Forex', value: 'forex', icon: 'cash' },
];

const SearchPage = memo(({ visible, onClose }: SearchPageProps) => {
  const { theme } = useTheme();
  const { 
    filteredAssets, 
    watchlistState,
    setSearchQuery,
    addToWatchlist,
    setMarketType,
  } = useWatchlist();

  const [selectedFilter, setSelectedFilter] = useState<MarketType | 'all'>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [recentSearches] = useState<string[]>(['AAPL', 'MSFT', 'BTC-USD', 'EUR/USD']);
  const searchInputRef = useRef<TextInput>(null);

  // Filter assets based on search query and selected filter
  const searchResults = useMemo(() => {
    let assets = filteredAssets;

    // Filter by market type if not 'all'
    if (selectedFilter !== 'all') {
      // Since we don't have type field in AssetItem, we'll use the current market type
      assets = watchlistState.marketType === selectedFilter ? assets : [];
    }

    // Filter by search query
    if (localSearchQuery.trim()) {
      const query = localSearchQuery.toLowerCase().trim();
      assets = assets.filter(item =>
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
      );
    }

    return assets;
  }, [filteredAssets, selectedFilter, localSearchQuery, watchlistState.marketType]);

  const handleSearch = useCallback((query: string) => {
    setLocalSearchQuery(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleFilterSelect = useCallback((filterValue: MarketType | 'all') => {
    setSelectedFilter(filterValue);
    if (filterValue !== 'all') {
      setMarketType(filterValue);
    }
  }, [setMarketType]);

  const handleRecentSearch = useCallback((query: string) => {
    handleSearch(query);
    searchInputRef.current?.focus();
  }, [handleSearch]);

  const handleAddToWatchlist = useCallback((item: AssetItem) => {
    addToWatchlist(item.symbol);
  }, [addToWatchlist]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, [setSearchQuery]);

  const isInWatchlist = useCallback((symbol: string) => {
    return watchlistState.watchlistItems.includes(symbol);
  }, [watchlistState.watchlistItems]);

  const renderFilterChip = useCallback(({ item }: { item: FilterOption }) => {
    const isSelected = selectedFilter === item.value;
    
    return (
      <Pressable
        onPress={() => handleFilterSelect(item.value)}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
          },
        ]}
        android_ripple={{ color: theme.colors.primary + '20' }}
      >
        <Ionicons
          name={item.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : theme.colors.text}
        />
        <Text
          variant="body"
          weight="medium"
          color={isSelected ? 'text' : 'text'}
          style={{ color: isSelected ? '#FFFFFF' : theme.colors.text }}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  }, [selectedFilter, theme.colors, handleFilterSelect]);

  const renderSearchResult = useCallback(({ item }: { item: AssetItem }) => {
    const isAdded = isInWatchlist(item.symbol);
    
    return (
      <Pressable
        style={[styles.searchResultItem, { backgroundColor: theme.colors.card }]}
        android_ripple={{ color: theme.colors.primary + '10' }}
        onPress={() => !isAdded && handleAddToWatchlist(item)}
      >
        <View style={styles.resultInfo}>
          <Text variant="body" weight="semibold" color="text">
            {item.symbol}
          </Text>
          <Text variant="body" color="textSecondary" numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.resultMeta}>
            <View
              style={[
                styles.typeTag,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Text
                variant="caption"
                color="textSecondary"
              >
                {watchlistState.marketType.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultActions}>
          <Text variant="body" weight="semibold" color="text">
            ${item.price.toFixed(watchlistState.marketType === 'crypto' ? 4 : 2)}
          </Text>
          <Pressable
            style={[
              styles.addButton,
              {
                backgroundColor: isAdded ? theme.colors.success : theme.colors.primary,
              },
            ]}
            onPress={() => !isAdded && handleAddToWatchlist(item)}
          >
            <Ionicons
              name={isAdded ? 'checkmark' : 'add'}
              size={16}
              color="#FFFFFF"
            />
          </Pressable>
        </View>
      </Pressable>
    );
  }, [theme.colors, isInWatchlist, handleAddToWatchlist, watchlistState.marketType]);

  const renderRecentSearch = useCallback(({ item }: { item: string }) => (
    <Pressable
      style={[styles.recentSearchItem, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleRecentSearch(item)}
      android_ripple={{ color: theme.colors.primary + '10' }}
    >
      <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
      <Text variant="body" color="text" style={styles.recentSearchText}>
        {item}
      </Text>
    </Pressable>
  ), [theme.colors, handleRecentSearch]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.listHeader}>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search stocks, crypto, forex..."
          placeholderTextColor={theme.colors.textSecondary}
          value={localSearchQuery}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
        {localSearchQuery.length > 0 && (
          <Pressable onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTER_OPTIONS}
          renderItem={renderFilterChip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filtersContainer}
        />
      </View>

      {/* Search State Headers */}
      {localSearchQuery.length === 0 ? (
        <View style={styles.sectionHeader}>
          <Text variant="body" weight="semibold" color="text">
            Recent Searches
          </Text>
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text variant="body" weight="semibold" color="text">
            Search Results
            {searchResults.length > 0 && (
              <Text variant="body" color="textSecondary">
                {' '}({searchResults.length})
              </Text>
            )}
          </Text>
        </View>
      )}
    </View>
  ), [
    theme.colors,
    localSearchQuery,
    handleSearch,
    handleClearSearch,
    renderFilterChip,
    searchResults.length,
  ]);

  const ListEmptyComponent = useMemo(() => {
    if (localSearchQuery.length > 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={theme.colors.textSecondary} />
          <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
            No results found for "{localSearchQuery}"
          </Text>
          <Text variant="body" color="textSecondary">
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }

    return null;
  }, [localSearchQuery, theme.colors.textSecondary]);

  return (
    <SlidingPage
      visible={visible}
      title="Search Assets"
      onClose={onClose}
      showBackButton={true}
    >
      <FlatList<AssetItem | string>
        data={localSearchQuery.length === 0 ? recentSearches : searchResults}
        renderItem={({ item }: { item: AssetItem | string }) => {
          if (typeof item === 'string') {
            return renderRecentSearch({ item });
          } else {
            return renderSearchResult({ item });
          }
        }}
        keyExtractor={(item, index) => 
          typeof item === 'string' ? `recent-${item}` : `result-${item.symbol}-${index}`
        }
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={undefined} // Let FlatList handle dynamic heights
      />
    </SlidingPage>
  );
});

SearchPage.displayName = 'SearchPage';

const styles = StyleSheet.create({
  listHeader: {
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  clearButton: {
    padding: 4,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
    gap: 12,
  },
  recentSearchText: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    textAlign: 'center',
  },
});

export default SearchPage;
