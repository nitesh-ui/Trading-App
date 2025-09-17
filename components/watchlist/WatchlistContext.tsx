import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { binanceService, CryptoPair } from '../../services/binanceService';
import { ForexPair, forexService } from '../../services/forexService';
import { IndianStock, indianStockService } from '../../services/indianStockService';
import { AssetItem, MarketType, StockExchangeFilter, TradeState, WatchlistState } from './types';

// Action types
type WatchlistAction =
  | { type: 'SET_MARKET_TYPE'; payload: MarketType }
  | { type: 'SET_EXCHANGE_FILTER'; payload: StockExchangeFilter }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_EXPANDED'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'UPDATE_STOCKS'; payload: IndianStock[] }
  | { type: 'UPDATE_FOREX'; payload: ForexPair[] }
  | { type: 'UPDATE_CRYPTO'; payload: CryptoPair[] }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
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
  watchlistItems: [],
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
  stocks: IndianStock[];
  forexPairs: ForexPair[];
  cryptoPairs: CryptoPair[];
  
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
  removeFromWatchlist: (symbol: string) => void;
  updateTradeState: (updates: Partial<TradeState>) => void;
  resetTradeState: () => void;
  refreshData: () => Promise<void>;
  
  // Asset drawer state
  selectedAssetForDetails: AssetItem | null;
  setSelectedAssetForDetails: (asset: AssetItem | null) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

// Provider component
export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlistState, watchlistDispatch] = useReducer(watchlistReducer, initialWatchlistState);
  const [tradeState, tradeDispatch] = useReducer(tradeReducer, initialTradeState);
  const [stocks, setStocks] = React.useState<IndianStock[]>([]);
  const [forexPairs, setForexPairs] = React.useState<ForexPair[]>([]);
  const [cryptoPairs, setCryptoPairs] = React.useState<CryptoPair[]>([]);
  const [selectedAssetForDetails, setSelectedAssetForDetails] = React.useState<AssetItem | null>(null);

  // Subscribe to data services
  useEffect(() => {
    // Stocks
    const stocksUnsubscribe = indianStockService.subscribe((updatedStocks) => {
      setStocks(updatedStocks);
    });

    // Forex
    const forexUnsubscribe = forexService.subscribe((updatedPairs) => {
      setForexPairs(updatedPairs);
    });

    // Crypto
    const cryptoUnsubscribe = binanceService.subscribe((updatedPairs) => {
      setCryptoPairs(updatedPairs);
    });

    // Initial data load with error handling
    try {
      setStocks(indianStockService.getStocks());
      setForexPairs(forexService.getPairs());
      setCryptoPairs(binanceService.getCryptoPairs());
    } catch (error) {
      console.warn('Error loading initial data:', error);
      // Set fallback data
      setStocks([]);
      setForexPairs([]);
      setCryptoPairs([]);
    }

    return () => {
      stocksUnsubscribe();
      forexUnsubscribe();
      cryptoUnsubscribe();
    };
  }, []);

  // Memoized computed values
  const filteredAssets = useMemo((): AssetItem[] => {
    let assets: AssetItem[] = [];

    switch (watchlistState.marketType) {
      case 'stocks':
        assets = stocks
          .filter(stock => 
            watchlistState.exchangeFilter === 'All' || 
            stock.exchange === watchlistState.exchangeFilter
          )
          .map(stock => ({
            symbol: stock.symbol,
            name: stock.name,
            exchange: stock.exchange,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            marketCap: stock.marketCap,
            volume: stock.volume,
            high: stock.high,
            low: stock.low,
          }));
        break;
      case 'forex':
        assets = forexPairs.map(pair => ({
          symbol: pair.symbol,
          name: pair.name,
          exchange: 'Forex',
          price: pair.price,
          change: pair.change,
          changePercent: pair.changePercent,
          high: pair.high,
          low: pair.low,
          volume: pair.volume,
        }));
        break;
      case 'crypto':
        assets = cryptoPairs.map(pair => ({
          symbol: pair.symbol,
          name: pair.name,
          exchange: 'Crypto',
          price: pair.price,
          change: pair.change24h || 0,
          changePercent: pair.changePercent24h || 0,
          volume: pair.volume24h || 0,
          marketCap: pair.marketCap || 0,
          high: pair.price * 1.05, // Estimate high
          low: pair.price * 0.95, // Estimate low
        }));
        break;
    }

    return assets;
  }, [watchlistState.marketType, watchlistState.exchangeFilter, stocks, forexPairs, cryptoPairs]);

  const searchResults = useMemo((): AssetItem[] => {
    if (!watchlistState.searchQuery.trim()) return [];
    
    const query = watchlistState.searchQuery.toLowerCase();
    return filteredAssets.filter(asset =>
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query)
    );
  }, [watchlistState.searchQuery, filteredAssets]);

  // Action creators
  const setMarketType = useCallback((type: MarketType) => {
    watchlistDispatch({ type: 'SET_MARKET_TYPE', payload: type });
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

  const removeFromWatchlist = useCallback((symbol: string) => {
    watchlistDispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: symbol });
  }, []);

  const updateTradeState = useCallback((updates: Partial<TradeState>) => {
    tradeDispatch({ type: 'UPDATE_TRADE_STATE', payload: updates });
  }, []);

  const resetTradeState = useCallback(() => {
    tradeDispatch({ type: 'RESET_TRADE_STATE' });
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      // Trigger refresh for all services
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 1000)), // Simulate API delay
      ]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const contextValue = useMemo<WatchlistContextType>(() => ({
    // State
    watchlistState,
    tradeState,
    stocks,
    forexPairs,
    cryptoPairs,
    
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
    
    // Asset drawer state
    selectedAssetForDetails,
    setSelectedAssetForDetails,
  }), [
    watchlistState,
    tradeState,
    stocks,
    forexPairs,
    cryptoPairs,
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
