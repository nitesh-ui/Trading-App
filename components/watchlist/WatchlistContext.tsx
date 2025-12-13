import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { binanceService, CryptoPair } from '../../services/binanceService';
import { ForexPair, forexService } from '../../services/forexService';
import { IndianStock, indianStockService } from '../../services/indianStockService';
import { watchlistApiService } from '../../services/watchlistApiService';
import { AssetItem, MarketType, StockExchangeFilter, TradeState, WatchlistState } from './types';

// Action types
type WatchlistAction =
  | { type: 'SET_MARKET_TYPE'; payload: MarketType }
  | { type: 'SET_EXCHANGE_FILTER'; payload: StockExchangeFilter }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_EXPANDED'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_LOADING_INDICES'; payload: boolean }
  | { type: 'SET_LOADING_ASSETS'; payload: boolean }
  | { type: 'UPDATE_STOCKS'; payload: IndianStock[] }
  | { type: 'UPDATE_FOREX'; payload: ForexPair[] }
  | { type: 'UPDATE_CRYPTO'; payload: CryptoPair[] }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'UPDATE_WATCHLIST_ITEMS'; payload: string[] }
  | { type: 'UPDATE_TRADE_STATE'; payload: Partial<TradeState> }
  | { type: 'RESET_TRADE_STATE' }
  | { type: 'SET_FILTER_VISIBLE'; payload: boolean };

// Initial states
const initialWatchlistState: WatchlistState = {
  marketType: 'stocks',
  exchangeFilter: 'All',
  searchQuery: '',
  isSearchExpanded: false,
  isFilterVisible: false,
  refreshing: false,
  notificationCount: 0,
  watchlistItems: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ITC', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTC', 'ETH', 'ADA'], // Pre-populated for instant switching
  isLoadingIndices: false,
  isLoadingAssets: false,
};

const initialTradeState: TradeState = {
  isVisible: false,
  selectedAsset: null,
  assetType: null,
  action: 'buy',
  quantity: 1,
  orderType: 'market',
  positionType: 'nrml',
  limitPrice: '0',
  stopLossPrice: '0',
  targetPrice: '0',
  triggerPrice: '0',
};

// Reducers
function watchlistReducer(state: WatchlistState, action: WatchlistAction): WatchlistState {
  switch (action.type) {
    case 'SET_MARKET_TYPE':
      return { ...state, marketType: action.payload };
    case 'SET_EXCHANGE_FILTER':
      return { ...state, exchangeFilter: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SEARCH_EXPANDED':
      return { ...state, isSearchExpanded: action.payload };
    case 'SET_FILTER_VISIBLE':
      return { ...state, isFilterVisible: action.payload };
    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };
    case 'SET_LOADING_INDICES':
      return { ...state, isLoadingIndices: action.payload };
    case 'SET_LOADING_ASSETS':
      return { ...state, isLoadingAssets: action.payload };
    case 'ADD_TO_WATCHLIST':
      return {
        ...state,
        watchlistItems: state.watchlistItems.includes(action.payload)
          ? state.watchlistItems
          : [...state.watchlistItems, action.payload],
      };
    case 'REMOVE_FROM_WATCHLIST':
      return {
        ...state,
        watchlistItems: state.watchlistItems.filter(item => item !== action.payload),
      };
    case 'UPDATE_WATCHLIST_ITEMS':
      return {
        ...state,
        watchlistItems: action.payload,
      };
    default:
      return state;
  }
}

function tradeReducer(state: TradeState, action: WatchlistAction): TradeState {
  switch (action.type) {
    case 'UPDATE_TRADE_STATE':
      return { ...state, ...action.payload };
    case 'RESET_TRADE_STATE':
      return { ...initialTradeState };
    default:
      return state;
  }
}

// Context types
interface WatchlistContextType {
  // State
  watchlistState: WatchlistState;
  tradeState: TradeState;
  // REMOVED: stocks, forexPairs, cryptoPairs (no longer exposing mock data)
  
  // Computed values
  filteredAssets: AssetItem[];
  searchResults: AssetItem[];
  
  // Actions
  setMarketType: (type: MarketType) => void;
  setExchangeFilter: (filter: StockExchangeFilter) => void;
  setSearchQuery: (query: string) => void;
  setSearchExpanded: (expanded: boolean) => void;
  setFilterVisible: (visible: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string, scriptCode?: number, wid?: number) => Promise<{ success: boolean; message?: string }>;
  updateTradeState: (updates: Partial<TradeState>) => void;
  resetTradeState: () => void;
  refreshData: () => Promise<void>;
  updateWatchlistItems: (items: string[]) => void;
  
  // Asset drawer state
  selectedAssetForDetails: AssetItem | null;
  setSelectedAssetForDetails: (asset: AssetItem | null) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// Provider component
export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlistState, watchlistDispatch] = useReducer(watchlistReducer, initialWatchlistState);
  const [tradeState, tradeDispatch] = useReducer(tradeReducer, initialTradeState);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = React.useState<AssetItem | null>(null);
  
  // REMOVED: Mock data state (stocks, forexPairs, cryptoPairs) - now using API data only
  
  // API-based data state
  const [apiAssets, setApiAssets] = useState<AssetItem[]>([]);
  const [isLoadingApiData, setIsLoadingApiData] = useState(false);

  // Load API data function
  const loadApiData = useCallback(async () => {
    try {
      setIsLoadingApiData(true);
      watchlistDispatch({ type: 'SET_LOADING_ASSETS', payload: true });
      
      console.log('🔄 Loading watchlist data from API...');
      const assets = await watchlistApiService.fetchWatchlistData();
      
      setApiAssets(assets);
      console.log('✅ API watchlist data loaded:', assets.length, 'assets');
      
    } catch (error) {
      console.error('❌ Error loading API data:', error);
      // Fallback to existing mock data
    } finally {
      setIsLoadingApiData(false);
      watchlistDispatch({ type: 'SET_LOADING_ASSETS', payload: false });
    }
  }, []);

  // Load API data only - no mock services
  useEffect(() => {
    // Load API data on mount
    loadApiData();

    // REMOVED: All mock service subscriptions (indianStockService, forexService, binanceService)
    // Now we ONLY use data from the watchlist API
    
    console.log('✅ Watchlist initialized - using API data only');
    
    // No cleanup needed since we're not subscribing to anything
  }, [loadApiData]);

  // Memoized computed values - prioritize API data when available
  const filteredAssets = useMemo((): AssetItem[] => {
    // If we have API data, use categorized assets from it
    if (apiAssets.length > 0) {
      const categorized = watchlistApiService.categorizeAssets(apiAssets);
      
      // Debug log categorization
      console.log('📊 Asset categorization:', {
        stocks: categorized.stocks.length,
        forex: categorized.forex.length,
        crypto: categorized.crypto.length,
        indices: categorized.indices.length,
        commodities: categorized.commodities.length,
        forexSymbols: categorized.forex.map(f => f.symbol),
      });
      
      switch (watchlistState.marketType) {
        case 'stocks':
          // Include stocks, commodities, and indices in the stocks tab
          // Indices (like NIFTY 50, SENSEX) now appear as regular stocks when added to watchlist
          const stocksAndCommoditiesAndIndices = [
            ...categorized.stocks,
            ...categorized.commodities,
            ...categorized.indices
          ];
          
          // Debug: Log first stock to see if scriptCode and wid are present
          if (stocksAndCommoditiesAndIndices.length > 0) {
            const firstStock = stocksAndCommoditiesAndIndices[0];
            console.log('🔍 First stock in filteredAssets:', {
              symbol: firstStock.symbol,
              scriptCode: firstStock.scriptCode,
              wid: firstStock.wid,
              intWID: firstStock.intWID,
              lotSize: firstStock.lotSize,
              allKeys: Object.keys(firstStock)
            });
          }
          
          return stocksAndCommoditiesAndIndices.filter(stock => 
            watchlistState.exchangeFilter === 'All' || 
            stock.exchange === watchlistState.exchangeFilter
          );
        case 'forex':
          // ONLY use forex assets from watchlist API - no hardcoded data
          const apiForexAssets = categorized.forex || [];
          
          console.log('📊 Forex assets from API:', {
            count: apiForexAssets.length,
            symbols: apiForexAssets.map(f => f.symbol)
          });
          
          return apiForexAssets;
        case 'crypto':
          // ONLY use crypto assets from watchlist API - no hardcoded data
          const apiCryptoAssets = categorized.crypto || [];
          
          console.log('📊 Crypto assets from API:', {
            count: apiCryptoAssets.length,
            symbols: apiCryptoAssets.map(c => c.symbol)
          });
          
          return apiCryptoAssets;
        default:
          return [...categorized.stocks, ...categorized.commodities, ...categorized.indices];
      }
    }

    // No API data available - return empty array
    console.warn('⚠️ No API data available for watchlist');
    return [];
  }, [watchlistState.marketType, watchlistState.exchangeFilter, apiAssets]);

  const searchResults = useMemo((): AssetItem[] => {
    if (!watchlistState.searchQuery.trim()) return [];
    
    const query = watchlistState.searchQuery.toLowerCase();
    return filteredAssets.filter(asset =>
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
  }, [watchlistState.searchQuery, filteredAssets]);

  // Action creators - INSTANT tab switching with smooth content animation
  const setMarketType = useCallback((type: MarketType) => {
    // 🚀 INSTANT tab switch - UI shows new tab immediately
    watchlistDispatch({ type: 'SET_MARKET_TYPE', payload: type });
    
    // Never block tab switching with loading states
    // Content can load asynchronously while tab is already switched
    watchlistDispatch({ type: 'SET_LOADING_INDICES', payload: false });
    watchlistDispatch({ type: 'SET_LOADING_ASSETS', payload: false });
  }, []);

  const setExchangeFilter = useCallback((filter: StockExchangeFilter) => {
    watchlistDispatch({ type: 'SET_EXCHANGE_FILTER', payload: filter });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    watchlistDispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setSearchExpanded = useCallback((expanded: boolean) => {
    watchlistDispatch({ type: 'SET_SEARCH_EXPANDED', payload: expanded });
  }, []);

  const setFilterVisible = useCallback((visible: boolean) => {
    watchlistDispatch({ type: 'SET_FILTER_VISIBLE', payload: visible });
  }, []);

  const setRefreshing = useCallback((refreshing: boolean) => {
    watchlistDispatch({ type: 'SET_REFRESHING', payload: refreshing });
  }, []);

  const addToWatchlist = useCallback((symbol: string) => {
    watchlistDispatch({ type: 'ADD_TO_WATCHLIST', payload: symbol });
  }, []);

  const removeFromWatchlist = useCallback(async (symbol: string, scriptCode?: number, wid?: number) => {
    try {
      // If scriptCode and wid are provided, call the API to delete from server
      if (scriptCode !== undefined && wid !== undefined) {
        console.log(`🗑️ Removing ${symbol} with scriptCode ${scriptCode} and wid ${wid} from watchlist via API`);
        const result = await watchlistApiService.removeFromWatchlist(scriptCode, wid);
        
        if (!result.success) {
          console.error('❌ Failed to remove from watchlist via API:', result.message);
          return { success: false, message: result.message };
        }
        
        console.log('✅ Successfully removed from watchlist via API');
      } else {
        console.warn('⚠️ scriptCode or wid not provided, skipping API call');
        return { success: false, message: 'Missing required information to delete' };
      }
      
      // Update local state
      watchlistDispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: symbol });
      
      // Refresh the watchlist data from API to get updated list
      await loadApiData();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error in removeFromWatchlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from watchlist';
      return { success: false, message: errorMessage };
    }
  }, [loadApiData]);

  const updateTradeState = useCallback((updates: Partial<TradeState>) => {
    tradeDispatch({ type: 'UPDATE_TRADE_STATE', payload: updates });
  }, []);

  const resetTradeState = useCallback(() => {
    tradeDispatch({ type: 'RESET_TRADE_STATE' });
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload API data
      await loadApiData();
      
      // Trigger refresh for mock services as well (fallback)
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 500)), // Simulate API delay
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [loadApiData]);

  const updateWatchlistItems = useCallback((items: string[]) => {
    console.log('📝 Updating watchlist items:', items);
    watchlistDispatch({ type: 'UPDATE_WATCHLIST_ITEMS', payload: items });
  }, []);

  const contextValue = useMemo<WatchlistContextType>(() => ({
    // State
    watchlistState,
    tradeState,
    // REMOVED: stocks, forexPairs, cryptoPairs (no longer using mock data)
    
    // Computed values
    filteredAssets,
    searchResults,
    
    // Actions
    setMarketType,
    setExchangeFilter,
    setSearchQuery,
    setSearchExpanded,
    setFilterVisible,
    setRefreshing,
    addToWatchlist,
    removeFromWatchlist,
    updateTradeState,
    resetTradeState,
    refreshData,
    updateWatchlistItems,
    
    // Asset drawer state
    selectedAssetForDetails,
    setSelectedAssetForDetails,
  }), [
    watchlistState,
    tradeState,
    filteredAssets,
    searchResults,
    setMarketType,
    setExchangeFilter,
    setSearchQuery,
    setSearchExpanded,
    setRefreshing,
    addToWatchlist,
    removeFromWatchlist,
    updateTradeState,
    resetTradeState,
    refreshData,
    updateWatchlistItems,
    selectedAssetForDetails,
  ]);

  return (
    <WatchlistContext.Provider value={contextValue}>
      {children}
    </WatchlistContext.Provider>
  );
};

// Hook to use the context
export const useWatchlist = (): WatchlistContextType => {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
