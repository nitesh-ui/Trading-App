/**
 * Optimized List Components
 * Production-ready FlatList and SectionList with performance optimizations
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  SectionList,
  SectionListData,
  SectionListProps,
  ViewStyle
} from 'react-native';

import { StockCardSkeleton, TradeItemSkeleton } from './LoadingComponents';

// Generic item type for lists
interface ListItem {
  id: string;
  [key: string]: any;
}

// Props for optimized FlatList
interface OptimizedFlatListProps<T extends ListItem> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  estimatedItemSize?: number;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  isLoading?: boolean;
  onEndReachedThresholdValue?: number;
  windowSize?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
}

/**
 * Optimized FlatList Component
 * Includes performance optimizations for smooth scrolling
 */
export function OptimizedFlatList<T extends ListItem>({
  data,
  renderItem,
  itemHeight,
  estimatedItemSize,
  loadingComponent: LoadingComponent = StockCardSkeleton,
  emptyComponent: EmptyComponent,
  isLoading = false,
  onEndReachedThresholdValue = 0.5,
  windowSize = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  ...props
}: OptimizedFlatListProps<T>) {
  
  // Optimized keyExtractor - memoized for performance
  const keyExtractor = useCallback((item: T, index: number) => {
    return item.id || `item-${index}`;
  }, []);

  // Optimized getItemLayout if itemHeight is provided
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      const MemoizedItem = memo(() => renderItem({ item, index, separators: {} as any }));
      return <MemoizedItem />;
    },
    [renderItem]
  );

  // Viewability config removed to prevent React Native stability issues
  // const viewabilityConfig = useMemo(() => ({
  //   itemVisiblePercentThreshold: 50,
  //   minimumViewTime: 300,
  // }), []);

  // Loading state
  if (isLoading) {
    return (
      <FlatList
        data={Array.from({ length: 5 }, (_, i) => ({ id: `loading-${i}` }))}
        renderItem={() => <LoadingComponent />}
        keyExtractor={(_, index) => `loading-${index}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    );
  }

  // Empty state
  if (!isLoading && data.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      onEndReachedThreshold={onEndReachedThresholdValue}
      
      // Performance optimizations
      windowSize={windowSize}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      removeClippedSubviews={removeClippedSubviews}
      
      // Viewability tracking removed to prevent stability issues
      // onViewableItemsChanged={onViewableItemsChangedRef.current}
      // viewabilityConfig={viewabilityConfig}
      
      // Additional performance settings
      disableVirtualization={false}
      legacyImplementation={false}
      
      // Scroll indicators
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
}

// Props for optimized SectionList
interface OptimizedSectionListProps<T extends ListItem, S = any> 
  extends Omit<SectionListProps<T, S>, 'renderItem' | 'sections'> {
  sections: SectionListData<T, S>[];
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  sectionHeaderHeight?: number;
  loadingComponent?: React.ComponentType;
  emptyComponent?: React.ComponentType;
  isLoading?: boolean;
}

/**
 * Optimized SectionList Component
 * Includes performance optimizations for sectioned data
 */
export function OptimizedSectionList<T extends ListItem, S = any>({
  sections,
  renderItem,
  itemHeight,
  sectionHeaderHeight,
  loadingComponent: LoadingComponent = StockCardSkeleton,
  emptyComponent: EmptyComponent,
  isLoading = false,
  ...props
}: OptimizedSectionListProps<T, S>) {
  
  const keyExtractor = useCallback((item: T, index: number) => {
    return item.id || `section-item-${index}`;
  }, []);

  const getItemLayout = useMemo(() => {
    if (!itemHeight || !sectionHeaderHeight) return undefined;
    
    return (data: SectionListData<T, S>[] | null, index: number) => {
      // Calculate offset considering section headers
      let offset = 0;
      let currentIndex = 0;
      
      for (const section of data || []) {
        if (currentIndex === index) break;
        
        offset += sectionHeaderHeight; // Section header height
        
        if (currentIndex + section.data.length > index) {
          offset += (index - currentIndex) * itemHeight;
          break;
        }
        
        offset += section.data.length * itemHeight;
        currentIndex += section.data.length;
      }
      
      return {
        length: itemHeight,
        offset,
        index,
      };
    };
  }, [itemHeight, sectionHeaderHeight]);

  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      const MemoizedItem = memo(() => renderItem({ item, index, separators: {} as any }));
      return <MemoizedItem />;
    },
    [renderItem]
  );

  if (isLoading) {
    return (
      <FlatList
        data={Array.from({ length: 5 }, (_, i) => ({ id: `loading-${i}` }))}
        renderItem={() => <LoadingComponent />}
        keyExtractor={(_, index) => `loading-${index}`}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    );
  }

  if (!isLoading && sections.length === 0 && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <SectionList
      {...props}
      sections={sections}
      renderItem={memoizedRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      
      // Performance optimizations
      windowSize={10}
      maxToRenderPerBatch={5}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={true}
      
      // Scroll indicators
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
    />
  );
}

/**
 * Memoized List Item Wrapper
 * Use this to wrap your list items for automatic memoization
 */
export const MemoizedListItem = memo<{ children: React.ReactNode; itemId: string }>(
  ({ children }) => <>{children}</>,
  (prevProps, nextProps) => {
    // Custom comparison function
    return prevProps.itemId === nextProps.itemId;
  }
);

/**
 * Stock List Component
 * Specialized optimized list for stock/crypto/forex items
 */
interface StockListProps<T extends ListItem> {
  data: T[];
  renderItem: ListRenderItem<T>;
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  emptyMessage?: string;
  style?: ViewStyle;
}

export function StockList<T extends ListItem>({
  data,
  renderItem,
  isLoading = false,
  onRefresh,
  refreshing = false,
  onEndReached,
  emptyMessage = "No items found",
  style,
}: StockListProps<T>) {
  return (
    <OptimizedFlatList
      data={data}
      renderItem={renderItem}
      isLoading={isLoading}
      estimatedItemSize={120} // Typical stock card height
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={[{ paddingVertical: 8 }, style]}
      loadingComponent={StockCardSkeleton}
    />
  );
}

/**
 * Trade List Component
 * Specialized optimized list for trade history items
 */
export function TradeList<T extends ListItem>({
  data,
  renderItem,
  isLoading = false,
  onRefresh,
  refreshing = false,
  style,
}: Omit<StockListProps<T>, 'onEndReached' | 'emptyMessage'>) {
  return (
    <OptimizedFlatList
      data={data}
      renderItem={renderItem}
      isLoading={isLoading}
      estimatedItemSize={100} // Typical trade item height
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={[{ paddingVertical: 8 }, style]}
      loadingComponent={TradeItemSkeleton}
    />
  );
}

export default OptimizedFlatList;
