/**
 * Real Watchlist API Service
 * Handles communication with the trading API to fetch real watchlist data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssetItem } from '../components/watchlist/types';
import { tradingApiService } from './tradingApiService';

export interface SearchResult extends AssetItem {
  isInWatchlist: boolean;
  canAdd: boolean;
  lotSize?: number;
  size?: number;
}

export interface WatchlistApiItem {
  lastprice: number;
  scriptName: string;
  scriptTradingSymbol: string;
  scriptInstrumentType: string;
  scriptExchange: string;
  close: number;
  scriptCode: number;
  wid: number;
  bid: number;
  ask: number;
  high: number;
  low: number;
  scriptLotSize: number;
  scripttype: string;
  scriptexpiry?: string;
  instrumentToken?: string | number; // Added to capture if API provides this
  intWID?: number; // Added to capture if API provides this
}

export interface WatchlistDataForAdd {
  scriptTradingSymbol: string;
  scriptTradingSymbol_NEW: string;
  scriptExchange: string;
  intWID: number;
  userID: string;
  lot: number;
  size: number;
  scriptexpiry: string;
}

export interface WatchlistApiResponse {
  message: string;
  data: {
    objLstWatchList: WatchlistApiItem[];
    watchlistDataForAdd: WatchlistDataForAdd[];
  };
}

export interface WatchlistApiRequest {
  searchedData: string;
  watchListPage: number;
  scriptExchange: string;
  scriptInstrumentType: string;
  onlyCurrentMonth: number;
  datalimit: number;
}

export interface AddScriptRequest {
  scriptTradingSymbol: string;
  intWID: number;
  watchlistname: string;
  scriptExchange: string;
  lot: string;
  size: string;
}

class WatchlistApiService {
  private readonly baseUrl = 'https://prod-tradingapi.sanaitatechnologies.com';
  private unauthorizedHandler?: (notificationSystem?: { showNotification: (notification: any) => void }) => Promise<void>;

  /**
   * Set a global handler for 401 unauthorized responses
   */
  setUnauthorizedHandler(handler: (notificationSystem?: { showNotification: (notification: any) => void }) => Promise<void>): void {
    this.unauthorizedHandler = handler;
  }

  /**
   * Fetch watchlist data from the trading API
   */
  async fetchWatchlistData(): Promise<AssetItem[]> {
    try {
      // Check if user is authenticated
      const isLoggedIn = await tradingApiService.isLoggedIn();
      if (!isLoggedIn) {
        throw new Error('Authentication required. Please login first.');
      }

      // Get session data from AsyncStorage
      const sessionData = await tradingApiService.getSessionData();
      if (!sessionData?.sessionToken) {
        throw new Error('No valid session token found. Please login again.');
      }

      console.log('🚀 Fetching watchlist data with session:', {
        sessionToken: sessionData.sessionToken ? '***TOKEN***' : 'None',
        user: sessionData.loggedInUser?.username,
      });

      // Prepare API request body
      const requestBody: WatchlistApiRequest = {
        searchedData: "",
        watchListPage: 0,
        scriptExchange: "",
        scriptInstrumentType: "",
        onlyCurrentMonth: 0,
        datalimit: 0
      };

      // Make API call to get watchlist data
      const response = await fetch(`${this.baseUrl}/WatchListApi/GetWatchListData`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionData.sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 Watchlist API Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ Watchlist API Error:', response.status, response.statusText);
        
        // If unauthorized, session might be expired
        if (response.status === 401 || response.status === 403) {
          console.log('⚠️ Session might be expired in watchlist service');
          await tradingApiService.clearSessionData();
          
          // Call the global unauthorized handler if set
          if (this.unauthorizedHandler) {
            try {
              await this.unauthorizedHandler();
              return [];
            } catch (handlerError) {
              console.error('❌ Error in unauthorized handler:', handlerError);
            }
          }
          
          // Fallback to empty array if no handler is set
          console.log('⚠️ Falling back to empty watchlist');
          return [];
        }
        
        throw new Error(`Watchlist API request failed with status: ${response.status}`);
      }

      const data: WatchlistApiResponse = await response.json();
      console.log('✅ Watchlist API Success Response:', {
        message: data.message,
        itemCount: data.data?.objLstWatchList?.length || 0
      });

      // Log first item to see raw API structure including all fields
      if (data.data?.objLstWatchList && data.data.objLstWatchList.length > 0) {
        console.log('📊 Sample API item (first) - FULL OBJECT:', data.data.objLstWatchList[0]);
        console.log('📊 Sample API item (first) - KEY FIELDS:', {
          symbol: data.data.objLstWatchList[0].scriptTradingSymbol,
          lastprice: data.data.objLstWatchList[0].lastprice,
          close: data.data.objLstWatchList[0].close,
          high: data.data.objLstWatchList[0].high,
          low: data.data.objLstWatchList[0].low,
          scriptCode: data.data.objLstWatchList[0].scriptCode,
          wid: data.data.objLstWatchList[0].wid
        });
      }

      // Transform API data to our internal format
      if (data.data?.objLstWatchList && data.data.objLstWatchList.length > 0) {
        const transformedAssets = this.transformApiDataToAssets(data.data.objLstWatchList);
        console.log('✅ Transformed watchlist data:', transformedAssets.length, 'assets');
        return transformedAssets;
      } else {
        console.log('⚠️ No watchlist data received from API, returning empty array');
        return [];
      }

    } catch (error) {
      console.error('❌ Error fetching watchlist data:', error);
      // Return empty array if API fails
      console.log('⚠️ Falling back to empty watchlist due to error');
      return [];
    }
  }

  /**
   * Get fallback mock data when API is unavailable
   */
  private getMockWatchlistData(): AssetItem[] {
    return [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        price: 2456.75,
        change: 23.45,
        changePercent: 0.96,
        high: 2470.00,
        low: 2435.20,
        exchange: 'NSE',
        volume: 1234567,
        marketCap: 16580000000000,
        scriptCode: 738561,
        intWID: 1001,
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services Ltd',
        price: 3890.50,
        change: -15.25,
        changePercent: -0.39,
        high: 3920.00,
        low: 3880.75,
        exchange: 'NSE',
        volume: 876543,
        marketCap: 14230000000000,
        scriptCode: 532540,
        intWID: 1002,
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Ltd',
        price: 1678.90,
        change: 8.70,
        changePercent: 0.52,
        high: 1685.00,
        low: 1665.25,
        exchange: 'NSE',
        volume: 2345678,
        marketCap: 12780000000000,
        scriptCode: 500180,
        intWID: 1003,
      },
      {
        symbol: 'INFY',
        name: 'Infosys Ltd',
        price: 1456.25,
        change: -12.35,
        changePercent: -0.84,
        high: 1475.00,
        low: 1448.50,
        exchange: 'NSE',
        volume: 1456789,
        marketCap: 6123000000000,
        scriptCode: 500209,
        intWID: 1004,
      },
      {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank Ltd',
        price: 945.60,
        change: 18.45,
        changePercent: 1.99,
        high: 952.00,
        low: 925.75,
        exchange: 'NSE',
        volume: 3456789,
        marketCap: 6789000000000,
        scriptCode: 532174,
        intWID: 1005,
      }
    ];
  }

  /**
   * Transform API data to our internal AssetItem format
   */
  private transformApiDataToAssets(apiItems: WatchlistApiItem[]): AssetItem[] {
    return apiItems.map((item, index) => {
      const change = item.lastprice - item.close;
      const changePercent = item.close !== 0 ? (change / item.close) * 100 : 0;

      // Debug logging for first 3 items to see actual values
      if (index < 3) {
        console.log('📊 Asset price calculation:', {
          symbol: item.scriptTradingSymbol,
          lastprice: item.lastprice,
          close: item.close,
          calculatedChange: change,
          changePercent: changePercent
        });
      }

      return {
        symbol: item.scriptTradingSymbol,
        name: item.scriptName || item.scriptTradingSymbol,
        price: item.lastprice,
        change: change,
        changePercent: changePercent,
        high: item.high,
        low: item.low,
        exchange: item.scriptExchange,
        volume: 0, // Not provided in API
        marketCap: 0, // Not provided in API
        scriptCode: item.scriptCode,
        intWID: item.intWID || item.wid, // Use intWID if provided, otherwise wid
        wid: item.wid, // Watchlist ID for delete operations
        instrumentToken: item.instrumentToken || item.scriptCode, // Use instrumentToken if provided, fallback to scriptCode
        lotSize: item.scriptLotSize, // Include lot size from API
        bid: item.bid, // Include bid price from API
        ask: item.ask, // Include ask price from API
      };
    });
  }

  /**
   * Categorize assets by type for different market tabs
   */
  categorizeAssets(assets: AssetItem[]): {
    stocks: AssetItem[];
    forex: AssetItem[];
    crypto: AssetItem[];
    indices: AssetItem[];
    commodities: AssetItem[];
    derivatives: AssetItem[];
  } {
    const stocks: AssetItem[] = [];
    const forex: AssetItem[] = [];
    const crypto: AssetItem[] = [];
    const indices: AssetItem[] = [];
    const commodities: AssetItem[] = [];
    const derivatives: AssetItem[] = [];

    assets.forEach(asset => {
      // Categorize based on exchange and symbol patterns
      if (asset.exchange === 'CRYPTO') {
        crypto.push(asset);
      } else if (asset.exchange === 'FOREX') {
        forex.push(asset);
      } else if (asset.exchange === 'CDS' || this.isCDSTicker(asset.symbol)) {
        // Currency Derivatives (CDS) - e.g., USDINR26116FUT
        // These are forex derivatives and should be categorized under Forex
        forex.push(asset);
      } else if (asset.exchange === 'MCX' || asset.exchange === 'NCDEX' || asset.exchange === 'NCO') {
        commodities.push(asset);
      } else if (
        asset.symbol.includes('NIFTY') || 
        asset.symbol.includes('SENSEX') || 
        asset.symbol.includes('INDEX') ||
        asset.symbol === 'NIFTY 50' ||
        asset.symbol === 'NIFTY 500' ||
        asset.symbol === 'SENSEX'
      ) {
        indices.push(asset);
      } else if (asset.exchange === 'NSE' || asset.exchange === 'BSE') {
        // Regular stocks - exclude ETFs and indices
        if (!asset.symbol.includes('NIFTY') && 
            !asset.symbol.includes('SENSEX') && 
            !asset.symbol.includes('ETF') &&
            !asset.name.toLowerCase().includes('etf')) {
          // Debug: Log critical fields for first few stocks
          if (stocks.length < 2) {
            console.log('🔍 Categorizing stock asset:', {
              symbol: asset.symbol,
              scriptCode: asset.scriptCode,
              wid: asset.wid,
              intWID: asset.intWID,
              lotSize: asset.lotSize
            });
          }
          stocks.push(asset);
        } else {
          indices.push(asset);
        }
      } else {
        // Default to stocks for unknown categories
        stocks.push(asset);
      }
    });

    return {
      stocks,
      forex,
      crypto,
      indices,
      commodities,
      derivatives
    };
  }

  /**
   * Check if a symbol is a CDS (Currency Derivative Segment) ticker
   * CDS tickers typically follow patterns like: USDINR26116FUT, EURINR25DECFUT, etc.
   */
  private isCDSTicker(symbol: string): boolean {
    // Check if symbol contains currency pairs followed by date and FUT
    // Common currency pairs: USDINR, EURINR, GBPINR, JPYINR, etc.
    const cdsPairs = ['USDINR', 'EURINR', 'GBPINR', 'JPYINR', 'AUDINR', 'CADINR', 'CHFINR', 'SGDINR', 'HKDINR', 'NZDINR', 'SEKUSD', 'NOKUSD', 'DKKUSD', 'ZARUSD'];
    
    // Check if symbol starts with any currency pair and contains FUT
    return cdsPairs.some(pair => symbol.startsWith(pair)) && symbol.includes('FUT');
  }

  /**
   * Get market indices data for the header display
   */
  getMarketIndicesFromAssets(assets: AssetItem[]): {
    nifty50?: AssetItem;
    sensex?: AssetItem;
    bankNifty?: AssetItem;
    nifty500?: AssetItem;
  } {
    const indices = assets.filter(asset => 
      asset.symbol.includes('NIFTY') || asset.symbol.includes('SENSEX')
    );

    return {
      nifty50: indices.find(idx => idx.symbol === 'NIFTY 50'),
      sensex: indices.find(idx => idx.symbol === 'SENSEX'),
      bankNifty: indices.find(idx => idx.symbol.includes('BANK NIFTY')),
      nifty500: indices.find(idx => idx.symbol === 'NIFTY 500'),
    };
  }

  /**
   * Add a symbol to watchlist using the real API
   */
  async addToWatchlist(
    symbol: string, 
    exchange: string, 
    lotSize: string = "1", 
    size: string = ""
  ): Promise<boolean> {
    try {
      const sessionData = await tradingApiService.getSessionData();
      if (!sessionData?.sessionToken) {
        throw new Error('No valid session token found.');
      }

      console.log('📝 Adding to watchlist:', { symbol, exchange, lotSize, size });

      const requestBody: AddScriptRequest = {
        scriptTradingSymbol: symbol,
        intWID: 0,
        watchlistname: "",
        scriptExchange: exchange,
        lot: lotSize,
        size: size // Now includes the actual size value
      };

      const response = await fetch(`${this.baseUrl}/WatchListApi/AddScript`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionData.sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('� Add to Watchlist API Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ Add to Watchlist API Error:', response.status, response.statusText);
        throw new Error(`Add to watchlist API request failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Add to Watchlist API Success:', responseData);
      
      return true;
    } catch (error) {
      console.error('❌ Error adding to watchlist:', error);
      return false;
    }
  }

  /**
   * Remove a symbol from watchlist
   */
  async removeFromWatchlist(scriptCode: number, watchListID: number = 0): Promise<{ success: boolean; message?: string }> {
    try {
      const sessionData = await tradingApiService.getSessionData();
      if (!sessionData?.sessionToken) {
        return { success: false, message: 'No valid session token found.' };
      }

      console.log(`🗑️ Removing script from watchlist:`, { scriptCode, watchListID });

      const requestBody = {
        watchListID: watchListID,
        scriptCode: scriptCode
      };

      const response = await fetch(`${this.baseUrl}/WatchListApi/DeleteScript`, {
        method: 'DELETE',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionData.sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🗑️ Delete Script API Response Status:', response.status);

      const responseData = await response.json();
      console.log('📋 Delete Script API Response:', responseData);

      // Check if deletion was successful
      // The API returns { message: string, data: number }
      if (responseData.message && responseData.message.toLowerCase().includes('unable to delete')) {
        // Deletion failed with a specific reason
        console.error('❌ Delete Script Failed:', responseData.message);
        return { success: false, message: responseData.message };
      }

      // Check response status
      if (!response.ok) {
        console.error('❌ Delete Script API Error:', response.status, response.statusText);
        return { 
          success: false, 
          message: responseData.message || `Failed to delete script (Status: ${response.status})` 
        };
      }
      
      console.log('✅ Delete Script API Success');
      return { success: true };
    } catch (error) {
      console.error('❌ Error removing from watchlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from watchlist';
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Determine asset type based on symbol and exchange - public method for external use
   */
  determineAssetType(symbol: string, exchange: string): 'stock' | 'forex' | 'crypto' | 'index' | 'commodity' | 'derivative' {
    if (exchange === 'CRYPTO') {
      return 'crypto';
    } else if (exchange === 'FOREX') {
      return 'forex';
    } else if (exchange === 'CDS' || this.isCDSTicker(symbol)) {
      // Currency Derivatives (CDS) should be treated as forex
      return 'forex';
    } else if (exchange === 'MCX' || exchange === 'NCDEX' || exchange === 'NCO') {
      return 'commodity';
    } else if (exchange === 'NFO' || symbol.includes('FUT') || symbol.includes('CE') || symbol.includes('PE')) {
      // Only treat as derivative if it's not a CDS ticker
      if (!this.isCDSTicker(symbol)) {
        return 'derivative';
      }
      return 'forex';
    } else if (
      symbol.includes('NIFTY') || 
      symbol.includes('SENSEX') || 
      symbol.includes('INDEX') ||
      symbol === 'NIFTY 50' ||
      symbol === 'NIFTY 500' ||
      symbol === 'SENSEX'
    ) {
      return 'index';
    } else {
      return 'stock';
    }
  }

  /**
   * Transform watchlistDataForAdd items to AssetItem format
   */
  private transformWatchlistDataForAddToAssets(items: WatchlistDataForAdd[]): AssetItem[] {
    return items.map(item => {
      const symbol = item.scriptTradingSymbol;
      const name = item.scriptTradingSymbol_NEW || symbol; // Use NEW symbol if available, otherwise original
      const exchange = item.scriptExchange;
      
      return {
        symbol,
        name,
        price: 0, // Price not available in watchlistDataForAdd
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        exchange,
        currency: exchange === 'NSE' || exchange === 'BSE' ? 'INR' : 'USD',
        sector: 'Unknown',
        type: this.determineAssetType(symbol, exchange),
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketStatus: 'closed',
        lastUpdated: new Date().toISOString(),
        // Add lot information for proper API calls
        lotSize: item.lot,
        size: item.size,
        // API-specific fields for trading operations
        intWID: item.intWID,
        scriptCode: 0, // Not available in watchlistDataForAdd, use default
      };
    });
  }

  /**
   * Search for symbols to add to watchlist
   * Returns combined results from both objLstWatchList (already in watchlist) and watchlistDataForAdd (available to add)
   * Also includes forex data from Polygon API when searching for forex or all exchanges
   */
  async searchSymbols(query: string, exchange?: string): Promise<SearchResult[]> {
    try {
      const sessionData = await tradingApiService.getSessionData();
      if (!sessionData?.sessionToken) {
        throw new Error('No valid session token found.');
      }

      const requestBody: WatchlistApiRequest = {
        searchedData: query,
        watchListPage: 0,
        scriptExchange: exchange || "",
        scriptInstrumentType: "",
        onlyCurrentMonth: 0,
        datalimit: 50 // Increase limit for search results
      };

      console.log('🔍 Searching with API:', {
        query,
        exchange,
        requestBody
      });

      // Prepare parallel API calls
      const apiCalls: Promise<any>[] = [];

      // 1. Main watchlist API call
      const watchlistCall = fetch(`${this.baseUrl}/WatchListApi/GetWatchListData`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionData.sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }).then(response => {
        if (!response.ok) {
          throw new Error(`Search API request failed with status: ${response.status}`);
        }
        return response.json();
      });
      apiCalls.push(watchlistCall);

      // 2. Forex API call - COMMENTED OUT as main API now supports forex
      // const shouldFetchForex = !exchange || exchange === '' || exchange.toLowerCase() === 'all' || exchange.toLowerCase() === 'forex';
      // let forexCall: Promise<any> | null = null;
      
      // if (shouldFetchForex && query && query.length >= 2) {
      //   console.log('🔍 Fetching forex data from Polygon API for query:', query);
      //   forexCall = fetch(
      //     `https://api.polygon.io/v3/reference/tickers?market=fx&search=${encodeURIComponent(query)}&active=true&order=asc&limit=100&sort=ticker&apiKey=4wqkqLIE5GW8YhLTXGcPE15V8z8EL0aK`
      //   )
      //     .then(response => {
      //       if (!response.ok) {
      //         console.warn('⚠️ Forex API request failed:', response.status);
      //         return null;
      //       }
      //       return response.json();
      //     })
      //     .catch(error => {
      //       console.error('❌ Error fetching forex data:', error);
      //       return null;
      //     });
      //   apiCalls.push(forexCall);
      // }

      // Execute all API calls in parallel
      const [watchlistData] = await Promise.all(apiCalls);
      const forexData = null; // Forex data now comes from main API

      console.log('✅ Search API Response:', {
        message: watchlistData.message,
        watchlistItems: watchlistData.data?.objLstWatchList?.length || 0,
        availableToAdd: watchlistData.data?.watchlistDataForAdd?.length || 0
      });

      const results: SearchResult[] = [];

      // Add items already in watchlist (show without add button)
      if (watchlistData.data?.objLstWatchList) {
        const watchlistAssets = this.transformApiDataToAssets(watchlistData.data.objLstWatchList);
        const watchlistResults: SearchResult[] = watchlistAssets.map(asset => ({
          ...asset,
          isInWatchlist: true,
          canAdd: false
        }));
        results.push(...watchlistResults);
      }

      // Add items available to add (show with add button)
      if (watchlistData.data?.watchlistDataForAdd) {
        const availableAssets = this.transformWatchlistDataForAddToAssets(watchlistData.data.watchlistDataForAdd);
        const availableResults: SearchResult[] = availableAssets.map(asset => ({
          ...asset,
          isInWatchlist: false,
          canAdd: true,
          lotSize: asset.lotSize,
          size: asset.size,
        }));
        results.push(...availableResults);
      }

      // COMMENTED OUT: Forex data now comes directly from main API
      // // Add forex data from Polygon API
      // if (forexData && forexData.results && forexData.results.length > 0) {
      //   const forexResults = this.transformPolygonForexToSearchResults(forexData.results);
      //   results.push(...forexResults);
      //   console.log('✅ Added', forexResults.length, 'forex results from Polygon API');
      // }

      console.log('✅ Search results from main API:', results.length, 'items');
      return results;
      
    } catch (error) {
      console.error('❌ Error searching symbols:', error);
      return [];
    }
  }

  /**
   * Transform Polygon API forex data to SearchResult format
   */
  private transformPolygonForexToSearchResults(forexItems: any[]): SearchResult[] {
    return forexItems.map(item => {
      // Extract currency pair from ticker (e.g., "C:EURUSD" -> "EURUSD")
      const symbol = item.ticker?.replace('C:', '') || item.ticker;
      const name = item.name || symbol;
      
      return {
        symbol,
        name,
        price: item.last_quote?.ask || 0,
        change: 0, // Not available in reference data
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        exchange: 'FOREX',
        currency: 'USD',
        sector: 'Forex',
        type: 'forex' as const,
        high: 0,
        low: 0,
        open: 0,
        previousClose: 0,
        marketStatus: item.active ? 'open' : 'closed',
        lastUpdated: item.last_updated_utc || new Date().toISOString(),
        isInWatchlist: false,
        canAdd: true,
        lotSize: 1,
        size: 1,
        intWID: 0,
        scriptCode: 0,
      };
    });
  }
}

export const watchlistApiService = new WatchlistApiService();
