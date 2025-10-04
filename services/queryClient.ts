/**
 * TanStack Query Client Configuration
 * Centralized data fetching, caching, and synchronization with session management
 */

import NetInfo from '@react-native-community/netinfo';
import { QueryClient } from '@tanstack/react-query';
import { indianStockService } from './indianStockService';
import { forexService } from './forexService';
import { sessionExpiryHandler } from './sessionExpiryHandler';

// Create query client with optimized defaults for mobile and session handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      gcTime: 5 * 60 * 1000, // 5 minutes
      staleTime: 30 * 1000, // 30 seconds - data is considered fresh for 30s
      
      // Retry failed requests up to 3 times with session expiry handling
      retry: (failureCount, error: any) => {
        // Handle session expiry errors
        if (error?.message?.includes('Session expired')) {
          sessionExpiryHandler.handleSessionExpiry('Query error - session expired');
          return false; // Don't retry session expiry errors
        }
        
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Only refetch on window focus in development
      refetchOnWindowFocus: __DEV__,
      
      // Don't refetch on reconnect by default (we'll handle this manually)
      refetchOnReconnect: false,
      
      // Network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once on failure with session handling
      retry: (failureCount, error: any) => {
        // Handle session expiry errors
        if (error?.message?.includes('Session expired')) {
          sessionExpiryHandler.handleSessionExpiry('Mutation error - session expired');
          return false; // Don't retry session expiry errors
        }
        return failureCount < 1;
      },
      
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Setup network state listener for smart refetching
let unsubscribe: (() => void) | null = null;

export const setupNetworkListener = () => {
  unsubscribe = NetInfo.addEventListener((state) => {
    console.log('📶 Network state changed:', {
      isConnected: state.isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
    });
    
    // Refetch all queries when coming back online
    if (state.isConnected && state.isInternetReachable) {
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  });
};

export const cleanupNetworkListener = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};

// Query keys factory for consistent key management
export const queryKeys = {
  // Stock data
  stocks: ['stocks'] as const,
  stockList: (market: string) => [...queryKeys.stocks, 'list', market] as const,
  stockDetail: (symbol: string) => [...queryKeys.stocks, 'detail', symbol] as const,
  stockChart: (symbol: string, timeframe: string) => [...queryKeys.stocks, 'chart', symbol, timeframe] as const,
  
  // Forex data
  forex: ['forex'] as const,
  forexList: () => [...queryKeys.forex, 'list'] as const,
  forexDetail: (pair: string) => [...queryKeys.forex, 'detail', pair] as const,
  
  // Crypto data
  crypto: ['crypto'] as const,
  cryptoList: () => [...queryKeys.crypto, 'list'] as const,
  cryptoDetail: (symbol: string) => [...queryKeys.crypto, 'detail', symbol] as const,
  
  // User data
  user: ['user'] as const,
  userProfile: () => [...queryKeys.user, 'profile'] as const,
  userPortfolio: () => [...queryKeys.user, 'portfolio'] as const,
  userTrades: (filters?: any) => [...queryKeys.user, 'trades', filters] as const,
  
  // Market data
  market: ['market'] as const,
  marketMovers: (type: 'gainers' | 'losers') => [...queryKeys.market, 'movers', type] as const,
  marketNews: () => [...queryKeys.market, 'news'] as const,
} as const;

// Prefetch helper for critical data
export const prefetchCriticalData = async () => {
  // Prefetch market data and popular assets
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.stockList('indian'),
      queryFn: () => indianStockService.getStocks(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.market,
      queryFn: () => indianStockService.getIndices(),
      staleTime: 60 * 1000, // 1 minute
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.forexList(),
      queryFn: () => forexService.getPairs(),
      staleTime: 60 * 1000, // 1 minute
    }),
  ]);
};
