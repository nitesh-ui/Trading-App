// Watchlist Types
export type MarketType = 'stocks' | 'forex' | 'crypto';
export type StockExchangeFilter = 'All' | 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDSL' | 'NCDEX';

export interface AssetItem {
  symbol: string;
  name: string;
  exchange?: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  high?: number;
  low?: number;
  // Additional fields for trading
  lotSize?: number;
  size?: number;
  currency?: string;
  sector?: string;
  type?: string;
  open?: number;
  previousClose?: number;
  marketStatus?: string;
  lastUpdated?: string;
  // API-specific fields for trading operations
  scriptCode?: number;
  intWID?: number;
}

export interface TradeState {
  isVisible: boolean;
  selectedAsset: AssetItem | null;
  assetType: MarketType | null;
  action: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'sl' | 'sl-m';
  positionType: 'mis' | 'nrml';
  limitPrice: string;
  stopLossPrice: string;
  targetPrice: string;
  triggerPrice: string;
}

export interface WatchlistState {
  marketType: MarketType;
  exchangeFilter: StockExchangeFilter;
  searchQuery: string;
  isSearchExpanded: boolean;
  isFilterVisible: boolean;
  refreshing: boolean;
  notificationCount: number;
  watchlistItems: string[];
  // Loading states for skeleton loaders
  isLoadingIndices: boolean;
  isLoadingAssets: boolean;
}
