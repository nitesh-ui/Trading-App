/**
 * Custom Hooks for Data Fetching and State Management
 * Production-optimized hooks with caching, error handling, and offline support
 */

import NetInfo from '@react-native-community/netinfo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { forexService } from '../services/forexService';
import { indianStockService } from '../services/indianStockService';
import { queryKeys } from '../services/queryClient';

/**
 * Network Status Hook
 * Provides real-time network connectivity status
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [networkType, setNetworkType] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable ?? false);
      setNetworkType(state.type);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isInternetReachable,
    networkType,
    isOnline: isConnected && isInternetReachable,
  };
};

/**
 * Stock Data Hook
 * Fetches and manages Indian stock market data with caching
 */
export const useStocks = () => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.stockList('indian'),
    queryFn: () => indianStockService.getStocks(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isOnline ? 30 * 1000 : false, // Refetch every 30 seconds when online
    enabled: true, // Always enable, will use cache when offline
  });
};

/**
 * Market Indices Hook
 * Fetches market indices (Nifty, Sensex, etc.)
 */
export const useMarketIndices = () => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.market,
    queryFn: () => indianStockService.getIndices(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: isOnline ? 60 * 1000 : false, // Refetch every minute when online
  });
};

/**
 * Forex Data Hook
 * Fetches forex pairs with smart caching
 */
export const useForexData = () => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.forexList(),
    queryFn: () => forexService.getPairs(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isOnline ? 60 * 1000 : false,
  });
};

/**
 * Stock Detail Hook
 * Fetches detailed information for a specific stock
 */
export const useStockDetail = (symbol: string) => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.stockDetail(symbol),
    queryFn: () => indianStockService.getStock(symbol),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isOnline ? 30 * 1000 : false,
    enabled: !!symbol, // Only fetch if symbol is provided
  });
};

/**
 * Portfolio Hook
 * Fetches user portfolio data with optimistic updates
 */
export const usePortfolio = () => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.userPortfolio(),
    queryFn: async () => {
      // Mock portfolio data - replace with real API call
      return {
        totalValue: 500000,
        totalInvested: 475000,
        totalPnL: 25000,
        totalPnLPercent: 5.26,
        holdings: [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: isOnline ? 2 * 60 * 1000 : false,
  });
};

/**
 * Trades Hook
 * Fetches user trade history with pagination
 */
export const useTrades = (filters?: any) => {
  const { isOnline } = useNetworkStatus();

  return useQuery({
    queryKey: queryKeys.userTrades(filters),
    queryFn: async () => {
      // Mock trades data - replace with real API call
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: isOnline ? 5 * 60 * 1000 : false,
  });
};

/**
 * Trading Mutation Hook
 * Handles buy/sell orders with optimistic updates
 */
export const useTradingMutation = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (orderData: any) => {
      if (!isOnline) {
        throw new Error('Cannot place orders while offline');
      }
      
      // Mock trading API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Simulate success/failure
      if (Math.random() > 0.1) { // 90% success rate
        return {
          success: true,
          orderId: `ORDER_${Date.now()}`,
          message: 'Order placed successfully',
        };
      } else {
        throw new Error('Order failed due to insufficient funds');
      }
    },
    onMutate: async (orderData) => {
      // Optimistic update - show order as pending immediately
      await queryClient.cancelQueries({ queryKey: queryKeys.userTrades() });
      
      const previousTrades = queryClient.getQueryData(queryKeys.userTrades());
      
      // Add optimistic trade entry
      queryClient.setQueryData(queryKeys.userTrades(), (old: any) => {
        const newTrade = {
          id: `temp-${Date.now()}`,
          ...orderData,
          status: 'PENDING',
          timestamp: new Date().toISOString(),
        };
        return old ? [newTrade, ...old] : [newTrade];
      });

      return { previousTrades };
    },
    onError: (err, orderData, context) => {
      // Revert optimistic update on error
      if (context?.previousTrades) {
        queryClient.setQueryData(queryKeys.userTrades(), context.previousTrades);
      }
      
      Alert.alert(
        'Order Failed',
        err instanceof Error ? err.message : 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    },
    onSuccess: (data, orderData) => {
      // Refresh relevant data after successful order
      queryClient.invalidateQueries({ queryKey: queryKeys.userTrades() });
      queryClient.invalidateQueries({ queryKey: queryKeys.userPortfolio() });
      
      Alert.alert(
        'Order Successful',
        `Your ${orderData.type} order for ${orderData.symbol} has been placed successfully.`,
        [{ text: 'OK' }]
      );
    },
  });
};

/**
 * Optimistic Data Hook
 * Provides optimistic updates for better UX
 */
export const useOptimisticData = <T>(
  queryKey: any[],
  updater: (oldData: T | undefined, newData: any) => T | undefined
) => {
  const queryClient = useQueryClient();

  const updateOptimistically = useCallback(
    (newData: any) => {
      queryClient.setQueryData(queryKey, (oldData: T | undefined) =>
        updater(oldData, newData)
      );
    },
    [queryClient, queryKey, updater]
  );

  const revertOptimisticUpdate = useCallback(
    (previousData: T) => {
      queryClient.setQueryData(queryKey, previousData);
    },
    [queryClient, queryKey]
  );

  return { updateOptimistically, revertOptimisticUpdate };
};

/**
 * Refresh Hook
 * Manual refresh control for pull-to-refresh
 */
export const useRefresh = (queryKey: any[]) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKey]);

  return { isRefreshing, refresh };
};

/**
 * Data Prefetch Hook
 * Prefetches data for better performance
 */
export const useDataPrefetch = () => {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const prefetchStockDetail = useCallback(
    (symbol: string) => {
      if (isOnline) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.stockDetail(symbol),
          queryFn: () => indianStockService.getStock(symbol),
          staleTime: 30 * 1000,
        });
      }
    },
    [queryClient, isOnline]
  );

  const prefetchUserData = useCallback(() => {
    if (isOnline) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.userPortfolio(),
        queryFn: async () => {
          // Replace with actual API call
          return {};
        },
        staleTime: 60 * 1000,
      });
    }
  }, [queryClient, isOnline]);

  return { prefetchStockDetail, prefetchUserData };
};

/**
 * Error Handling Hook
 * Centralized error handling for queries
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

    // Don't show alerts for network errors when offline
    const isNetworkError = error.message.includes('Network') || 
                           error.message.includes('fetch');

    if (!isNetworkError) {
      Alert.alert(
        'Error',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  return { handleError };
};

/**
 * Debounced Search Hook
 * Optimized search with debouncing
 */
export const useDebouncedSearch = (
  searchFn: (query: string) => Promise<any>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  const searchResults = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchFn(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    query,
    setQuery,
    ...searchResults,
  };
};
