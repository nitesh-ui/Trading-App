import React, { useState, useCallback, useMemo, useRef, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Dimensions,
  Pressable,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useWatchlist } from '../watchlist/WatchlistContext';
import { watchlistApiService, SearchResult } from '../../services/watchlistApiService';
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
  const [apiSearchResults, setApiSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Debounced API search function
  const performApiSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setApiSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      
      console.log('🔍 Searching for:', query);
      
      // Get exchange filter based on selected filter
      let exchangeFilter = '';
      if (selectedFilter === 'stocks') {
        exchangeFilter = ''; // All stock exchanges (NSE, BSE)
      } else if (selectedFilter === 'crypto') {
        exchangeFilter = 'CRYPTO';
      } else if (selectedFilter === 'forex') {
        exchangeFilter = 'FOREX';
      }

      const results = await watchlistApiService.searchSymbols(query, exchangeFilter);
      
      // Filter results based on selected filter
      let filteredResults = results;
      if (selectedFilter !== 'all') {
        // Filter by asset type based on the selected filter
        filteredResults = results.filter(result => {
          const assetType = watchlistApiService.determineAssetType(result.symbol, result.exchange || '');
          
          switch (selectedFilter) {
            case 'stocks':
              return assetType === 'stock';
            case 'crypto':
              return assetType === 'crypto';
            case 'forex':
              return assetType === 'forex';
            default:
              return true;
          }
        });
      }

      setApiSearchResults(filteredResults);
      console.log('✅ Search results:', filteredResults.length, 'items');
      
    } catch (error) {
      console.error('❌ Search error:', error);
      setApiSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedFilter]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performApiSearch(localSearchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, performApiSearch]);

  // Use API search results when available, fallback to local search
  const searchResults = useMemo((): SearchResult[] => {
    // If we have searched via API, use API results
    if (hasSearched) {
      return apiSearchResults;
    }

    // Fallback to local search for immediate feedback - convert AssetItem to SearchResult
    let assets = filteredAssets;

    // Filter by market type if not 'all'
    if (selectedFilter !== 'all') {
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

    // Convert AssetItem to SearchResult for local fallback
    return assets.map(asset => ({
      ...asset,
      isInWatchlist: watchlistState.watchlistItems.includes(asset.symbol),
      canAdd: !watchlistState.watchlistItems.includes(asset.symbol)
    }));
  }, [filteredAssets, selectedFilter, localSearchQuery, watchlistState.marketType, watchlistState.watchlistItems, hasSearched, apiSearchResults]);

  const handleSearch = useCallback((query: string) => {
    setLocalSearchQuery(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleFilterSelect = useCallback((filterValue: MarketType | 'all') => {
    setSelectedFilter(filterValue);
    if (filterValue !== 'all') {
      setMarketType(filterValue);
    }
    // Re-trigger search with new filter
    if (localSearchQuery.trim()) {
      performApiSearch(localSearchQuery);
    }
  }, [setMarketType, localSearchQuery, performApiSearch]);

  const handleRecentSearch = useCallback((query: string) => {
    handleSearch(query);
    searchInputRef.current?.focus();
  }, [handleSearch]);

  const handleAddToWatchlist = useCallback((item: SearchResult) => {
    if (item.canAdd) {
      addToWatchlist(item.symbol);
    }
  }, [addToWatchlist]);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchQuery('');
    setApiSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  }, [setSearchQuery]);

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

  const renderSearchResult = useCallback(({ item }: { item: SearchResult }) => {
    const isInWatchlist = item.isInWatchlist;
    const canAdd = item.canAdd;
    
    return (
      <Pressable
        style={[styles.searchResultItem, { backgroundColor: theme.colors.card }]}
        android_ripple={{ color: theme.colors.primary + '10' }}
        onPress={() => canAdd && handleAddToWatchlist(item)}
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
                {item.exchange || 'N/A'}
              </Text>
            </View>
            {isInWatchlist && (
              <View
                style={[
                  styles.watchlistTag,
                  { backgroundColor: theme.colors.success + '20' }
                ]}
              >
                <Text
                  variant="caption"
                  color="success"
                >
                  In Watchlist
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.resultActions}>
          {item.price > 0 && (
            <Text variant="body" weight="semibold" color="text">
              ${item.price.toFixed(item.exchange === 'CRYPTO' ? 4 : 2)}
            </Text>
          )}
          {canAdd ? (
            <Pressable
              style={[
                styles.addButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => handleAddToWatchlist(item)}
            >
              <Ionicons
                name="add"
                size={16}
                color="#FFFFFF"
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.addButton,
                { 
                  backgroundColor: theme.colors.success,
                  opacity: 0.7
                }
              ]}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color="#FFFFFF"
              />
            </View>
          )}
        </View>
      </Pressable>
    );
  }, [theme.colors, handleAddToWatchlist]);

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
        {isSearching && (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        )}
        {localSearchQuery.length > 0 && !isSearching && (
          <Pressable onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Search Status */}
      {hasSearched && !isSearching && (
        <View style={styles.searchStatus}>
          <Text variant="caption" color="textSecondary">
            {apiSearchResults.length > 0 
              ? `Found ${apiSearchResults.length} result${apiSearchResults.length === 1 ? '' : 's'} for "${localSearchQuery}"`
              : `No results found for "${localSearchQuery}"`
            }
          </Text>
        </View>
      )}

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
          {isSearching && (
            <Text variant="caption" color="textSecondary">
              Searching...
            </Text>
          )}
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
    hasSearched,
    isSearching,
    apiSearchResults.length,
  ]);

  const EmptyComponent = useMemo(() => {
    if (localSearchQuery.length === 0) {
      // Show recent searches when no query
      return (
        <FlatList
          data={recentSearches}
          renderItem={renderRecentSearch}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.recentSearchesContainer}
        />
      );
    }

    if (isSearching) {
      // Show loading when searching
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
            Searching for "{localSearchQuery}"...
          </Text>
        </View>
      );
    }

    // Show no results message
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search" size={48} color={theme.colors.textSecondary} />
        <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
          No results found for "{localSearchQuery}"
        </Text>
        <Text variant="caption" color="textSecondary" style={styles.emptyStateSubtext}>
          Try different keywords or check spelling
        </Text>
      </View>
    );
  }, [localSearchQuery, recentSearches, renderRecentSearch, isSearching, theme.colors]);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title="Search Assets"
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          data={localSearchQuery.length > 0 ? searchResults : []}
          renderItem={renderSearchResult}
          keyExtractor={(item) => `${item.symbol}-${item.exchange}`}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </SlidingPage>
  );
});

SearchPage.displayName = 'SearchPage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
  },
  listHeader: {
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchStatus: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filtersSection: {
    marginBottom: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 1,
  },
  resultInfo: {
    flex: 1,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  watchlistTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSearchesContainer: {
    paddingHorizontal: 20,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  recentSearchText: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateText: {
    textAlign: 'center',
  },
  emptyStateSubtext: {
    textAlign: 'center',
  },
});

export default SearchPage;
