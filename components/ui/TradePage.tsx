import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Card, Text, Button } from '../atomic';
import { PriceDisplay } from '../trading';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotification } from '../../contexts/NotificationContext';
import { AssetItem, MarketType, TradeState } from '../watchlist/types';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { formatPrice } from '../../utils/priceFormatting';
import { 
  tradingApiService, 
  ProceedBuySellRequest,
  GetRequiredMarginRequest,
  RequiredMarginData,
  WalletBalanceData
} from '../../services/tradingApiService';
import { watchlistApiService } from '../../services/watchlistApiService';
import { queryKeys } from '../../services/queryClient';

interface TradePageProps {
  visible: boolean;
  onClose: () => void;
  asset: AssetItem;
  marketType: MarketType;
  action: 'buy' | 'sell';
  availableBalance: number;
  onTradeExecute: (tradeData: any) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TradePage: React.FC<TradePageProps> = ({ 
  visible, 
  onClose, 
  asset, 
  marketType, 
  action,
  availableBalance,
  onTradeExecute 
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
  const [unitType, setUnitType] = useState<'Lot' | 'Quantity'>('Lot');
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const [productType, setProductType] = useState<'MIS' | 'NRML'>('NRML');
  const [targetPrice, setTargetPrice] = useState('0');
  const [stopLossPrice, setStopLossPrice] = useState('0');
  const [limitPrice, setLimitPrice] = useState('0');
  const [triggerPrice, setTriggerPrice] = useState('0');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [requiredMargin, setRequiredMargin] = useState<number>(0);
  const [isLoadingMargin, setIsLoadingMargin] = useState(true); // Start as true, will be set to false after API call
  const [marginData, setMarginData] = useState<RequiredMarginData | null>(null);
  const [isMarginFromApi, setIsMarginFromApi] = useState<boolean>(false); // Track if margin is from API
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletData, setWalletData] = useState<WalletBalanceData | null>(null);
  const [fetchedWatchlistAsset, setFetchedWatchlistAsset] = useState<AssetItem | null>(null);
  const [isLoadingWatchlistData, setIsLoadingWatchlistData] = useState(false);

  // Debug: Log asset data immediately when component receives it
  React.useEffect(() => {
    console.log('🎯 === TradePage MOUNTED/UPDATED ===');
    console.log('📊 Asset received in TradePage:', {
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      exchange: asset.exchange,
      scriptCode: asset.scriptCode,
      wid: asset.wid,
      intWID: asset.intWID,
      lotSize: asset.lotSize,
      // Log all properties to see what's available
      allKeys: Object.keys(asset)
    });
    
    // Highlight critical fields
    if (!asset.scriptCode) {
      console.error('❌ CRITICAL: scriptCode is missing from asset!');
    }
    if (!asset.wid && !asset.intWID) {
      console.error('❌ CRITICAL: both wid and intWID are missing from asset!');
    }
    
    console.log('🔍 Full asset object:', JSON.stringify(asset, null, 2));
  }, [asset]);

  // Debug: Log fetched watchlist data when it changes
  React.useEffect(() => {
    if (fetchedWatchlistAsset) {
      console.log('✅ Fetched watchlist asset updated:', {
        symbol: fetchedWatchlistAsset.symbol,
        fetchedIntWID: fetchedWatchlistAsset.intWID,
        fetchedWID: fetchedWatchlistAsset.wid,
        fetchedScriptCode: fetchedWatchlistAsset.scriptCode,
        assetIntWID: asset.intWID,
        assetWID: asset.wid,
        assetScriptCode: asset.scriptCode
      });
    }
  }, [fetchedWatchlistAsset, asset.symbol, asset.intWID, asset.wid, asset.scriptCode]);

  // Validation function for trade inputs
  const validateTradeInputs = (): { isValid: boolean; errorMessage: string } => {
    const marketPrice = asset.price;
    const orderPrice = parseFloat(limitPrice) || 0;
    const trigger = parseFloat(triggerPrice) || 0;
    const target = parseFloat(targetPrice) || 0;
    const stopLoss = parseFloat(stopLossPrice) || 0;

    // For BUY orders
    if (action === 'buy') {
      switch (orderType) {
        case 'MARKET':
          // Target > Market Price, StopLoss < Market Price
          if (target > 0 && target <= marketPrice) {
            return { isValid: false, errorMessage: 'Target price must be greater than current market price' };
          }
          if (stopLoss > 0 && stopLoss >= marketPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be lower than current market price' };
          }
          break;

        case 'LIMIT':
          // Price < Market Price
          if (orderPrice <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid limit price' };
          }
          if (orderPrice >= marketPrice) {
            return { isValid: false, errorMessage: 'Limit price must be lower than current market price' };
          }
          // Target > Order Price, StopLoss < Order Price
          if (target > 0 && target <= orderPrice) {
            return { isValid: false, errorMessage: 'Target price must be greater than order price' };
          }
          if (stopLoss > 0 && stopLoss >= orderPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be lower than order price' };
          }
          break;

        case 'SL':
          // Trigger Price > Market Price
          if (trigger <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid trigger price' };
          }
          if (trigger <= marketPrice) {
            return { isValid: false, errorMessage: 'Trigger price must be greater than current market price' };
          }
          // Price > Trigger Price
          if (orderPrice <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid order price' };
          }
          if (orderPrice <= trigger) {
            return { isValid: false, errorMessage: 'Order price must be greater than trigger price' };
          }
          // Target > Order Price, StopLoss < Order Price
          if (target > 0 && target <= orderPrice) {
            return { isValid: false, errorMessage: 'Target price must be greater than order price' };
          }
          if (stopLoss > 0 && stopLoss >= orderPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be lower than order price' };
          }
          break;

        case 'SL-M':
          // Trigger Price > Market Price
          if (trigger <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid trigger price' };
          }
          if (trigger <= marketPrice) {
            return { isValid: false, errorMessage: 'Trigger price must be greater than current market price' };
          }
          // No Target and StopLoss required for SL-M
          break;
      }
    }
    
    // For SELL orders
    if (action === 'sell') {
      switch (orderType) {
        case 'MARKET':
          // Target < Market Price, StopLoss > Market Price
          if (target > 0 && target >= marketPrice) {
            return { isValid: false, errorMessage: 'Target price must be lower than current market price' };
          }
          if (stopLoss > 0 && stopLoss <= marketPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be greater than current market price' };
          }
          break;

        case 'LIMIT':
          // Price > Market Price
          if (orderPrice <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid limit price' };
          }
          if (orderPrice <= marketPrice) {
            return { isValid: false, errorMessage: 'Limit price must be greater than current market price' };
          }
          // Target < Order Price, StopLoss > Order Price
          if (target > 0 && target >= orderPrice) {
            return { isValid: false, errorMessage: 'Target price must be lower than order price' };
          }
          if (stopLoss > 0 && stopLoss <= orderPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be greater than order price' };
          }
          break;

        case 'SL':
          // Trigger Price < Market Price
          if (trigger <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid trigger price' };
          }
          if (trigger >= marketPrice) {
            return { isValid: false, errorMessage: 'Trigger price must be lower than current market price' };
          }
          // Price < Trigger Price
          if (orderPrice <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid order price' };
          }
          if (orderPrice >= trigger) {
            return { isValid: false, errorMessage: 'Order price must be lower than trigger price' };
          }
          // Target < Order Price, StopLoss > Order Price
          if (target > 0 && target >= orderPrice) {
            return { isValid: false, errorMessage: 'Target price must be lower than order price' };
          }
          if (stopLoss > 0 && stopLoss <= orderPrice) {
            return { isValid: false, errorMessage: 'Stop loss must be greater than order price' };
          }
          break;

        case 'SL-M':
          // Trigger Price < Market Price
          if (trigger <= 0) {
            return { isValid: false, errorMessage: 'Please enter a valid trigger price' };
          }
          if (trigger >= marketPrice) {
            return { isValid: false, errorMessage: 'Trigger price must be lower than current market price' };
          }
          // No Target and StopLoss required for SL-M
          break;
      }
    }

    return { isValid: true, errorMessage: '' };
  };

  // Calculate bid/ask - Use fetched watchlist data if available, otherwise fall back to estimation
  const getBidAsk = () => {
    // Priority 1: Use fetched watchlist data from API
    if (fetchedWatchlistAsset && fetchedWatchlistAsset.bid && fetchedWatchlistAsset.ask) {
      return {
        bid: fetchedWatchlistAsset.bid,
        ask: fetchedWatchlistAsset.ask
      };
    }
    
    // Priority 2: Use original asset data if it has bid/ask
    if (asset.bid && asset.ask) {
      return {
        bid: asset.bid,
        ask: asset.ask
      };
    }
    
    // Priority 3: Estimate based on price with a small spread
    const spread = marketType === 'stocks' ? 0.05 : 0.0001; // Small spread for stocks, smaller for forex
    return {
      bid: asset.price - spread,
      ask: asset.price + spread
    };
  };

  const { bid, ask } = getBidAsk();

  // Debug log to see what asset data is available and bid/ask source
  console.log('📊 TradePage asset data:', {
    symbol: asset.symbol,
    name: asset.name,
    price: asset.price,
    bid: bid,
    ask: ask,
    bidAskSource: fetchedWatchlistAsset?.bid && fetchedWatchlistAsset?.ask ? 'fetched-watchlist' :
                  asset.bid && asset.ask ? 'asset-prop' : 'calculated',
    fetchedBid: fetchedWatchlistAsset?.bid,
    fetchedAsk: fetchedWatchlistAsset?.ask,
    assetBid: asset.bid,
    assetAsk: asset.ask,
    change: asset.change,
    high: asset.high,
    low: asset.low,
    exchange: asset.exchange,
    volume: asset.volume,
    marketCap: asset.marketCap,
    wid: asset.wid,
    intWID: asset.intWID,
    scriptCode: asset.scriptCode
  });

  const orderTypeOptions = [
    { label: 'MARKET', value: 'MARKET' },
    { label: 'LIMIT', value: 'LIMIT' },
    { label: 'SL', value: 'SL' },
    { label: 'SL-M', value: 'SL-M' }
  ];

  const productTypeOptions = [
    { label: 'MIS', value: 'MIS' },
    { label: 'NRML', value: 'NRML' }
  ];

  const calculateRequiredAmount = () => {
    // Show loading if still fetching margin data (initial load only)
    if (isLoadingMargin) {
      return 0; // Return 0, will be displayed as "Loading..." in UI
    }
    // Use API margin data if available (already calculated for the current quantity)
    if (isMarginFromApi && requiredMargin > 0) {
      return requiredMargin;
    }
    
    // Fallback to manual calculation if API data is not available
    const price = orderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || asset.price;
    const lotSize = asset.lotSize || 1;
    return quantity * price * lotSize;
  };

  const getAvailableFormatted = () => {
    // Show loading if still fetching margin data
    if (isLoadingMargin) {
      return 'Loading...';
    }
    // Use available margin from API if available
    if (isMarginFromApi && marginData?.availablemargin !== undefined) {
      console.log(`[TradePage] Using available margin from API: ${marginData.availablemargin.toFixed(2)}`);
      return `${marginData.availablemargin.toFixed(2)}`;
    }
    // Fallback to wallet balance if margin data is not available
    console.log(`[TradePage] Falling back to wallet balance: ${walletBalance}`);
    return `${walletBalance}`;
  };

  const handleQuantityChange = (change: number) => {
    // Increment/decrement by 1
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
    
    // Trigger margin recalculation with new quantity
    // Don't show loading state for subsequent updates, only for initial load
    if (visible) {
      setTimeout(() => fetchRequiredMargin(), 300); // Small delay to avoid too many API calls
    }
  };

  const handleExecuteTrade = async () => {
    // Prevent multiple simultaneous executions
    if (isExecutingTrade) return;
    
    // Validate inputs before executing trade
    const validation = validateTradeInputs();
    if (!validation.isValid) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: validation.errorMessage
      });
      return;
    }
    
    setIsExecutingTrade(true);
    
    try {
      // Use fetched watchlist asset data with multiple fallback levels
      // Priority: 1. Fetched from watchlist API, 2. Asset props, 3. Default 0
      const finalIntWID = fetchedWatchlistAsset?.intWID || fetchedWatchlistAsset?.wid || asset.wid || asset.intWID || 0;
      const finalScriptCode = fetchedWatchlistAsset?.scriptCode || asset.scriptCode || 0;
      
      // Debug: Log the source of IDs
      console.log('🔍 Trade ID sources for', asset.symbol, ':', {
        intWID: {
          value: finalIntWID,
          source: fetchedWatchlistAsset?.intWID ? 'fetched.intWID' :
                  fetchedWatchlistAsset?.wid ? 'fetched.wid' :
                  asset.wid ? 'asset.wid' :
                  asset.intWID ? 'asset.intWID' : 'default(0)'
        },
        scriptCode: {
          value: finalScriptCode,
          source: fetchedWatchlistAsset?.scriptCode ? 'fetched.scriptCode' :
                  asset.scriptCode ? 'asset.scriptCode' : 'default(0)'
        }
      });

      // Log warnings if critical fields are still missing
      if (finalIntWID === 0) {
        console.error('❌ intWID is 0 for asset:', asset.symbol, '- Trade will fail!', {
          marketType: marketType,
          exchange: asset.exchange,
          fetchedAsset: fetchedWatchlistAsset,
          assetProps: { wid: asset.wid, intWID: asset.intWID, scriptCode: asset.scriptCode },
          allAssetKeys: Object.keys(asset)
        });
        showNotification({
          type: 'error',
          title: 'Missing Trading ID',
          message: `Unable to place trade: Missing watchlist ID for ${asset.symbol}. This asset may not be available for trading.`
        });
        return;
      }
      if (finalScriptCode === 0 || !finalScriptCode) {
        console.error('❌ scriptCode is 0 or undefined for asset:', asset.symbol, '- Trade will fail!', {
          marketType: marketType,
          exchange: asset.exchange,
          fetchedAsset: fetchedWatchlistAsset,
          assetProps: { scriptCode: asset.scriptCode, wid: asset.wid, intWID: asset.intWID },
          allAssetKeys: Object.keys(asset)
        });
        showNotification({
          type: 'error',
          title: 'Missing Script Code',
          message: `Unable to place trade: Missing script code for ${asset.symbol}. This asset may not be available for trading.`
        });
        return;
      }

      // Prepare the API request data
      const apiRequest: ProceedBuySellRequest = {
        intWID: finalIntWID, // Use fetched value or fallback chain
        scriptCode: finalScriptCode, // Use fetched value or fallback chain
        currentPosition: action === 'buy' ? 'Buy' : 'Sell', // Capitalize as required by API
        quantity: quantity.toString(),
        price: (orderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || asset.price).toString(),
        triggerPrice: triggerPrice || '0',
        productType: productType, // Empty string for LIMIT, SL, SL-M; selected value for MARKET
        marketType: orderType, // 'MARKET', 'LIMIT', 'SL', 'SL-M'
        tradeID: '0', // Default empty string
        status: '', // Default empty string
        target: targetPrice || '0',
        stopLoss: stopLossPrice || '0',
        tradinG_UNIT: 1 // Default value as per API
      };

      console.log('🔄 Executing trade with API:', apiRequest);
      console.log('📊 Asset data for trade:', {
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        exchange: asset.exchange,
        fetchedWatchlistAsset: fetchedWatchlistAsset ? {
          intWID: fetchedWatchlistAsset.intWID,
          wid: fetchedWatchlistAsset.wid,
          scriptCode: fetchedWatchlistAsset.scriptCode
        } : null,
        assetProps: {
          intWID: asset.intWID,
          wid: asset.wid,
          scriptCode: asset.scriptCode
        },
        finalValues: {
          intWID: finalIntWID,
          scriptCode: finalScriptCode
        }
      });

      // Call the real trading API
      const response = await tradingApiService.proceedBuySell(apiRequest);

      console.log('📡 Trade API Response:', response);

      // The API service now properly handles success/failure detection
      if (response.success) {
        // Success - show success notification and close
        showNotification({
          type: 'success',
          title: `${action.toUpperCase()} order placed successfully`,
          message: `${quantity} ${asset.symbol} order has been executed`
        });

        // Invalidate trades query to refresh the trades list immediately
        console.log('🔄 Invalidating trades and portfolio queries to refresh data');
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.userTrades(),
          exact: false, // This will invalidate all variations of userTrades queries
          refetchType: 'all' // Refetch both active and inactive queries
        });

        // Also invalidate user portfolio data since balance/holdings may have changed
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.userPortfolio(),
          exact: false,
          refetchType: 'all'
        });

        // Invalidate user profile in case balance info is stored there
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.userProfile(),
          exact: false,
          refetchType: 'all'
        });

        // Also call the original onTradeExecute for any UI updates
        const legacyTradeData = {
          asset,
          action,
          quantity,
          orderType,
          unitType,
          productType,
          price: orderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || asset.price,
          targetPrice: parseFloat(targetPrice),
          stopLossPrice: parseFloat(stopLossPrice),
          triggerPrice: parseFloat(triggerPrice),
          totalAmount: calculateRequiredAmount()
        };
        onTradeExecute(legacyTradeData);
        onClose();
      } else {
        // Error - show error notification
        const errorMessage = response.message || response.error || 'Failed to execute trade. Please try again.';
        console.error('❌ Trade failed:', errorMessage);
        
        showNotification({
          type: 'error',
          title: 'Trade Failed',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('❌ Error executing trade:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      
      // Use notification toast for error feedback
      showNotification({
        type: 'error',
        title: 'Trade Failed',
        message: errorMessage
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  const fetchRequiredMargin = useCallback(async () => {
    try {
      // Only show loading state if we don't have data yet (initial load)
      // For subsequent updates (quantity changes), just update the values without showing loading
      if (!isMarginFromApi) {
        setIsLoadingMargin(true);
      }
      
      // Use fetched scriptCode with fallback
      const finalScriptCode = fetchedWatchlistAsset?.scriptCode || asset.scriptCode || 0;
      const finalLotSize = fetchedWatchlistAsset?.lotSize || asset.lotSize || 1;
      
      const request: GetRequiredMarginRequest = {
        currentPosition: action === 'buy' ? 'Buy' : 'Sell',
        qty: quantity,
        scriptCode: finalScriptCode,
        lastprice: asset.price,
        isMisOrder: productType === 'MIS',
        tradinG_UNIT_TYPE: unitType === 'Lot' ? 1 : 2, // 1 for 'Lot', 2 for 'Quantity'
        scriptLotSize: finalLotSize
      };

      console.log('🚀 Fetching required margin with request:', request);
      
      const response = await tradingApiService.getRequiredMargin(request);
      
      if (response.success && response.data && response.data.length > 0) {
        const marginInfo = response.data[0];
        setMarginData(marginInfo);
        
        // Use the API's requiredmargin value directly (already calculated for the given quantity)
        setRequiredMargin(marginInfo.requiredmargin);
        setIsMarginFromApi(true);
        
        // For market orders, auto-fill the price field with the last price
        if (orderType === 'MARKET') {
          setLimitPrice(asset.price.toString());
        }
        
        console.log('✅ Required margin fetched from API:', {
          requiredmargin: marginInfo.requiredmargin,
          availablemargin: marginInfo.availablemargin,
          usedmargin: marginInfo.usedmargin,
          quantity: quantity
        });
      } else {
        console.error('❌ Failed to fetch required margin:', response);
        // Fallback to calculated amount
        setIsMarginFromApi(false);
        setRequiredMargin(0);
      }
    } catch (error) {
      console.error('❌ Error fetching required margin:', error);
      // Fallback to calculated amount
      setIsMarginFromApi(false);
      setRequiredMargin(0);
      // showNotification({
      //   type: 'warning',
      //   title: 'Margin Calculation',
      //   message: 'Using estimated margin calculation'
      // });
    } finally {
      // Only set loading to false if it was true (initial load)
      if (isLoadingMargin) {
        setIsLoadingMargin(false);
      }
    }
  }, [quantity, productType, asset.price, asset.exchange, asset.scriptCode, fetchedWatchlistAsset, asset.lotSize, action, walletData, walletBalance, orderType, showNotification, isMarginFromApi, isLoadingMargin]);

  const fetchWalletBalance = useCallback(async () => {
    try {
      setIsLoadingWallet(true);
      
      console.log('🚀 Fetching wallet balance for TradePage');
      
      const response = await tradingApiService.getWalletBalance();
      
      if (response.data) {
        setWalletData(response.data);
        setWalletBalance(response.data.amount || '0');
        console.log('✅ Wallet balance fetched:', response.data.amount);
      } else {
        console.error('❌ Failed to fetch wallet balance:', response);
        setWalletBalance('0');
        showNotification({
          type: 'warning',
          title: 'Wallet Balance',
          message: 'Unable to fetch wallet balance'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching wallet balance:', error);
      setWalletBalance('0');
      showNotification({
        type: 'error',
        title: 'Wallet Error',
        message: 'Failed to fetch wallet balance'
      });
    } finally {
      setIsLoadingWallet(false);
    }
  }, [showNotification]);

  /**
   * Fetch watchlist data to get correct intWID and scriptCode for the asset
   * This ensures we always have the latest values from the API
   * 
   * IMPORTANT FIX (Nov 18, 2025):
   * - For forex/crypto assets: Check if IDs exist in asset props first (from forexService/binanceService)
   * - If IDs exist in props, use them directly without backend API call
   * - Only fetch from backend if IDs are missing from props
   * - This fixes the issue where forex pairs like EURUSD couldn't be traded due to missing IDs
   * - The forexService now provides mock IDs (scriptCode, wid, intWID) for all forex pairs
   */
  const fetchWatchlistData = useCallback(async () => {
    try {
      setIsLoadingWatchlistData(true);
      
      console.log('🔍 Fetching watchlist data for asset:', asset.symbol, {
        exchange: asset.exchange,
        marketType: marketType,
        hasIDs: {
          scriptCode: !!asset.scriptCode,
          wid: !!asset.wid,
          intWID: !!asset.intWID
        }
      });
      
      // For forex and crypto assets that already have IDs from their services,
      // we can use them directly without fetching from backend
      if ((marketType === 'forex' || marketType === 'crypto') && 
          (asset.scriptCode || asset.intWID || asset.wid)) {
        console.log('✅ Using IDs from forex/crypto service for', asset.symbol, ':', {
          scriptCode: asset.scriptCode,
          wid: asset.wid,
          intWID: asset.intWID,
          lotSize: asset.lotSize
        });
        
        // Use the asset as-is since it already has the necessary IDs
        setFetchedWatchlistAsset(asset);
        setIsLoadingWatchlistData(false);
        return;
      }
      
      // Get all watchlist data from API (for stocks and forex/crypto without IDs)
      const watchlistResponse = await watchlistApiService.fetchWatchlistData();
      
      if (watchlistResponse && watchlistResponse.length > 0) {
        // Find the matching asset by symbol (try exact match first, then partial match)
        const matchingAsset = watchlistResponse.find(
          (item: any) => 
            item.symbol === asset.symbol || 
            item.scriptName === asset.symbol ||
            item.symbol?.toLowerCase() === asset.symbol?.toLowerCase() ||
            item.scriptName?.toLowerCase() === asset.symbol?.toLowerCase()
        );
        
        if (matchingAsset) {
          // Store the entire watchlist asset object
          setFetchedWatchlistAsset(matchingAsset);
          
          console.log('✅ Watchlist asset fetched for', asset.symbol, ':', {
            intWID: matchingAsset.intWID || matchingAsset.wid,
            scriptCode: matchingAsset.scriptCode,
            exchange: matchingAsset.exchange,
            fullAsset: matchingAsset
          });
        } else {
          console.warn('⚠️ Asset not found in backend watchlist:', asset.symbol);
          
          // For forex/crypto, check if asset props have IDs
          if ((marketType === 'forex' || marketType === 'crypto') && 
              (asset.scriptCode || asset.intWID || asset.wid)) {
            console.log('✅ Using fallback IDs from asset props for', asset.symbol);
            setFetchedWatchlistAsset(asset);
          } else {
            console.error('❌ No IDs available for asset:', asset.symbol);
            setFetchedWatchlistAsset(null);
          }
        }
      } else {
        console.warn('⚠️ No watchlist data returned from API');
        
        // Fallback: Use asset props if they have IDs
        if ((marketType === 'forex' || marketType === 'crypto') && 
            (asset.scriptCode || asset.intWID || asset.wid)) {
          console.log('✅ Using fallback IDs from asset props (no API data)');
          setFetchedWatchlistAsset(asset);
        } else {
          setFetchedWatchlistAsset(null);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching watchlist data:', error);
      
      // Fallback: Try to use asset props if they have IDs
      if ((marketType === 'forex' || marketType === 'crypto') && 
          (asset.scriptCode || asset.intWID || asset.wid)) {
        console.log('✅ Using fallback IDs from asset props (error case)');
        setFetchedWatchlistAsset(asset);
      } else {
        setFetchedWatchlistAsset(null);
        showNotification({
          type: 'warning',
          title: 'Data Fetch',
          message: 'Using cached asset data'
        });
      }
    } finally {
      setIsLoadingWatchlistData(false);
    }
  }, [asset, marketType, showNotification]);

  // Fetch watchlist data when page becomes visible to get correct intWID and scriptCode
  useEffect(() => {
    if (visible) {
      fetchWatchlistData();
    }
  }, [visible, fetchWatchlistData]);

  // Fetch wallet balance when page becomes visible
  useEffect(() => {
    if (visible) {
      fetchWalletBalance();
    }
  }, [visible, fetchWalletBalance]);

  // Initialize quantity to 1 when page opens or asset changes
  useEffect(() => {
    if (visible && asset) {
      setQuantity(1);
      console.log('📊 Initialized quantity to 1 for asset:', asset.symbol);
    }
  }, [visible, asset.symbol]);

  // Fetch required margin when wallet balance is available and parameters change
  useEffect(() => {
    if (visible && walletBalance !== '0') {
      fetchRequiredMargin();
    }
  }, [visible, quantity, productType, orderType, walletBalance, fetchRequiredMargin]);

  // Fetch watchlist data when the component mounts or asset changes
  useEffect(() => {
    if (visible && asset) {
      fetchWatchlistData();
    }
  }, [visible, asset, fetchWatchlistData]);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title={`${action.toUpperCase()} ${asset.name || asset.symbol}`}
    >
      <View style={styles.pageWrapper}>
        <ScrollView 
          style={[styles.container, { backgroundColor: theme.colors.background }]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
        {/* Asset Header with Real-time Price */}
        <Card padding="medium" style={styles.priceHeaderCard}>
          <View style={styles.headerContainer}>
            <View style={styles.assetInfo}>
              <Text variant="title" weight="bold" color="text" style={styles.symbolText}>
                {asset.symbol}
              </Text>
              <Text variant="caption" color="textSecondary" style={styles.exchangeText}>
                {asset.exchange || 'NSE'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <PriceDisplay
                price={asset.price}
                change={asset.change}
                changePercent={asset.changePercent}
                size="medium"
                showCurrency={marketType === 'stocks'}
                currencySymbol=""
                showSymbol={true}
                showChange={true}
                align="right"
                theme={theme}
              />
            </View>
          </View>
          <View style={styles.bidAskContainer}>
            <Text variant="caption" weight="medium" color="success" style={styles.bidAskText}>
              Bid: {formatPrice(bid, marketType)}
            </Text>
            <Text variant="caption" weight="medium" color="error" style={styles.bidAskText}>
              Ask: {formatPrice(ask, marketType)}
            </Text>
          </View>
        </Card>

        {/* Market Data - Only show fields available from API */}
        <Card 
          padding="medium" 
          style={{
            ...styles.marketDataCard,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface 
          }}
        >
          <View style={styles.marketDataGrid}>
            {/* Only show Open if we can calculate it from available data */}
            {asset.high !== undefined && asset.low !== null && (
              <View style={styles.marketDataItem}>
                <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>Open</Text>
                <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                  {formatPrice(asset.high - Math.abs(asset.change || 0) * 0.5, marketType)}
                </Text>
              </View>
            )}
            
            {/* High - only show if available from API */}
            {asset.high !== undefined && asset.high !== null && (
              <View style={styles.marketDataItem}>
                <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>High</Text>
                <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                  {formatPrice(asset.high, marketType)}
                </Text>
              </View>
            )}
            
            {/* Low - only show if available from API */}
            {asset.low !== undefined && asset.low !== null && (
              <View style={styles.marketDataItem}>
                <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>Low</Text>
                <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                  {formatPrice(asset.low, marketType)}
                </Text>
              </View>
            )}
            
            {/* Previous Close - calculated from current price and change */}
            <View style={styles.marketDataItem}>
              <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>Prev Close</Text>
              <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                {formatPrice(asset.price - (asset.change || 0), marketType)}
              </Text>
            </View>
            
            {/* LTP - always show current price */}
            <View style={styles.marketDataItem}>
              <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>LTP</Text>
              <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                {formatPrice(asset.price, marketType)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Product Type Selection (MIS/NRML) */}
        <View style={styles.productTypeRow}>
          {productTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setProductType(option.value as 'MIS' | 'NRML')}
              style={[
                styles.productTypeButton,
                {
                  backgroundColor: productType === option.value 
                    ? theme.colors.primary 
                    : 'transparent',
                  borderColor: productType === option.value
                    ? theme.colors.primary
                    : theme.colors.border
                }
              ]}
            >
              <Text
                variant="body"
                weight={productType === option.value ? 'semibold' : 'medium'}
                style={{
                  color: productType === option.value 
                    ? theme.colors.surface 
                    : theme.colors.text
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Unit and Quantity Section */}
        <View style={styles.quantitySection}>
          {/* Unit Header */}
          <View style={styles.quantityHeader}>
            <Text variant="body" color="text">Unit</Text>
            <Text variant="body" color="text">
              {unitType === 'Lot' ? `Lot (Lot Size: ${asset.lotSize || 1})` : 'Quantity'}
            </Text>
          </View>
          
          {/* Unit Dropdown and Quantity Controls - Side by Side */}
          <View style={[styles.unitQuantityRow, { gap: 12 }]}>
            {/* Unit Dropdown with Menu */}
            <View style={styles.unitDropdownWrapper}>
              <TouchableOpacity 
                onPress={() => setShowUnitMenu(!showUnitMenu)}
                style={[styles.unitDropdown, { borderColor: theme.colors.border }]}
              >
                <Text variant="body" color="text">{unitType}</Text>
                <Ionicons 
                  name={showUnitMenu ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={theme.colors.text} 
                />
              </TouchableOpacity>

              {/* Unit Menu - Dropdown options */}
              {showUnitMenu && (
                <View style={[styles.unitMenuPopup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <TouchableOpacity 
                    onPress={() => {
                      setUnitType('Lot');
                      setShowUnitMenu(false);
                    }}
                    style={[
                      styles.unitMenuOption,
                      unitType === 'Lot' && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                  >
                    <Text 
                      variant="body" 
                      color={unitType === 'Lot' ? 'primary' : 'text'}
                      weight={unitType === 'Lot' ? 'bold' : 'regular'}
                    >
                      Lot
                    </Text>
                  </TouchableOpacity>
                  <View style={{ height: 1, backgroundColor: theme.colors.border }} />
                  <TouchableOpacity 
                    onPress={() => {
                      setUnitType('Quantity');
                      setShowUnitMenu(false);
                    }}
                    style={[
                      styles.unitMenuOption,
                      unitType === 'Quantity' && { backgroundColor: theme.colors.primary + '20' }
                    ]}
                  >
                    <Text 
                      variant="body" 
                      color={unitType === 'Quantity' ? 'primary' : 'text'}
                      weight={unitType === 'Quantity' ? 'bold' : 'regular'}
                    >
                      Quantity
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Quantity Controls */}
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => handleQuantityChange(-1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.surface }]}
              >
                <Ionicons name="remove" size={15} color={theme.colors.text} />
              </TouchableOpacity>
              
              <View style={styles.quantityDisplay}>
                <Text variant="title" weight="bold" color="text">
                  {quantity}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={() => handleQuantityChange(1)}
                style={[styles.quantityButton, { backgroundColor: theme.colors.surface }]}
              >
                <Ionicons name="add" size={15} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Type and Price Inputs Section */}
        <Card padding="small" style={styles.orderCard}>
          {/* Order Type Selection */}
          <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            <Text variant="body" color="text" style={styles.sectionTitle}>
              Order Type
            </Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.orderTypeContainer}
          >
            {orderTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setOrderType(option.value as any)}
                style={[
                  styles.orderTypeButton,
                  {
                    backgroundColor: orderType === option.value 
                      ? theme.colors.primary 
                      : 'transparent',
                    borderColor: orderType === option.value
                      ? theme.colors.primary
                      : theme.colors.border
                  }
                ]}
              >
                <Text
                  variant="body"
                  weight={orderType === option.value ? 'semibold' : 'medium'}
                  style={{
                    color: orderType === option.value 
                      ? theme.colors.surface 
                      : theme.colors.text
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Price Inputs */}
          {/* First Row: Target and Stop Loss */}
          <View style={styles.advancedRow}>
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Target (Abs)</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: orderType === 'SL-M' ? theme.colors.border + '40' : theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: orderType === 'SL-M' ? 0.5 : 1 // Disabled for SL-M
                }]}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={orderType !== 'SL-M'} // Disabled for SL-M
              />
            </View>
            
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Stop Loss (Abs)</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: orderType === 'SL-M' ? theme.colors.border + '40' : theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: orderType === 'SL-M' ? 0.5 : 1 // Disabled for SL-M
                }]}
                value={stopLossPrice}
                onChangeText={setStopLossPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={orderType !== 'SL-M'} // Disabled for SL-M
              />
            </View>
          </View>
          
          {/* Second Row: Price and Trigger Price */}
          <View style={styles.advancedRow}>
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Price</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: (orderType === 'MARKET' || orderType === 'SL-M') ? theme.colors.border + '40' : theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: (orderType === 'MARKET' || orderType === 'SL-M') ? 0.5 : 1 // Disabled for MARKET and SL-M
                }]}
                value={orderType === 'MARKET' ? asset.price.toString() : limitPrice}
                onChangeText={(orderType === 'MARKET' || orderType === 'SL-M') ? undefined : setLimitPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={orderType !== 'MARKET' && orderType !== 'SL-M'} // Read-only for MARKET and SL-M
              />
            </View>
            
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Trigger Price</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: (orderType === 'SL' || orderType === 'SL-M') ? theme.colors.surface : theme.colors.border + '40', 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: (orderType === 'SL' || orderType === 'SL-M') ? 1 : 0.5 // Disabled for MARKET and LIMIT
                }]}
                value={triggerPrice}
                onChangeText={setTriggerPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={orderType === 'SL' || orderType === 'SL-M'} // Enabled only for SL and SL-M
              />
            </View>
          </View>
        </Card>

        {/* Order Summary */}
        <Card padding="small" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text variant="body" weight="bold" color="text">
              Required
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text 
                variant="body" 
                weight="bold" 
                color={isLoadingMargin ? "textSecondary" : "error"}
              >
                {isLoadingMargin ? 'Loading...' : formatPrice(calculateRequiredAmount(), marketType)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body" weight="bold" color="text">
              Available
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text 
                variant="body" 
                weight="bold" 
                color={isLoadingMargin ? "textSecondary" : "success"}
              >
                {getAvailableFormatted()}
              </Text>
            </View>
          </View>
        </Card>

      </ScrollView>

      {/* Sticky Execute Button */}
      <View style={[
        styles.footer,
        {
          backgroundColor: theme.colors.background,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          bottom: 64, // Position above the bottom tab bar (typical tab bar height)
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.stickyExecuteButton,
            {
              backgroundColor: action === 'buy' ? theme.colors.primary : theme.colors.error,
              opacity: isExecutingTrade ? 0.7 : 1
            }
          ]}
          onPress={handleExecuteTrade}
          disabled={isExecutingTrade}
          activeOpacity={0.8}
        >
          <Text style={styles.stickyExecuteButtonText}>
            {isExecutingTrade ? 'EXECUTING...' : `TAP TO ${action.toUpperCase()}`}
          </Text>
        </TouchableOpacity>
      </View>
      </View>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  pageWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 140, // Space for button and tab bar
  },
  
  // Header Container - No border/background
  priceHeaderCard: {
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  assetInfo: {
    flex: 1,
    minWidth: 0, // Important: allows flex child to shrink below content size
  },
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  symbolText: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 20,
  },
  exchangeText: {
    fontSize: 11,
  },
  bidAskText: {
    fontSize: 11,
  },
  headerCard: {
    marginBottom: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidAskContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  
  // Market Data
  marketDataCard: {
    marginTop: 0,
    marginBottom: 4,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  marketDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  marketDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  marketDataColumn: {
    flex: 1,
    alignItems: 'center',
  },
  marketDataItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  marketDataLabel: {
    fontSize: 10,
    marginBottom: 1,
  },
  marketDataValue: {
    fontSize: 11,
  },
  
  // Product Type
  productTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  productTypeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  productTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  
  // Quantity
  quantitySection: {
    gap: 8,
    marginBottom: 8,
    overflow: 'visible',
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitQuantityRowWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unitQuantityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unitDropdownWrapper: {
    flex: 1.2,
    minWidth: 100,
    zIndex: 1000,
    overflow: 'visible',
  },
  unitSelector: {
    gap: 16,
  },
  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitMenuPopup: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: -1,
  },
  unitMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    borderWidth: 1,
    borderRadius: 8,
    minWidth: 100,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unitMenuOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    flex: 1.8,
    minWidth: 140,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
  },
  
  // Order Type and Advanced Options Combined
  orderCard: {
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  orderTypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  
  // Advanced Options
  advancedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  advancedGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  advancedItem: {
    flex: 1,
  },
  advancedLabel: {
    marginBottom: 2,
    fontSize: 13,
  },
  advancedInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
    fontSize: 14,
  },
  
  // Summary
  summaryCard: {
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  
  // Execute Button
  executeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },

  // Sticky Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stickyExecuteButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stickyExecuteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default TradePage;
