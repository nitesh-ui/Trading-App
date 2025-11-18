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
  const [unitType, setUnitType] = useState<'Lot' | 'Share'>('Lot');
  const [productType, setProductType] = useState<'MIS' | 'NRML'>('NRML');
  const [targetPrice, setTargetPrice] = useState('0');
  const [stopLossPrice, setStopLossPrice] = useState('0');
  const [limitPrice, setLimitPrice] = useState('0');
  const [triggerPrice, setTriggerPrice] = useState('0');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [requiredMargin, setRequiredMargin] = useState<number>(0);
  const [isLoadingMargin, setIsLoadingMargin] = useState(false);
  const [marginData, setMarginData] = useState<RequiredMarginData | null>(null);
  const [isMarginFromApi, setIsMarginFromApi] = useState<boolean>(false); // Track if margin is from API
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletData, setWalletData] = useState<WalletBalanceData | null>(null);

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
    console.log('🔍 Full asset object:', JSON.stringify(asset, null, 2));
  }, [asset]);

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

  // Calculate bid/ask based on actual asset price (simple estimation)
  const getBidAsk = () => {
    const spread = marketType === 'stocks' ? 0.05 : 0.0001; // Small spread for stocks, smaller for forex
    return {
      bid: asset.price - spread,
      ask: asset.price + spread
    };
  };

  const { bid, ask } = getBidAsk();

  // Debug log to see what asset data is available
  console.log('📊 TradePage asset data:', {
    symbol: asset.symbol,
    name: asset.name,
    price: asset.price,
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
    // Show full wallet balance amount without formatting
    return `₹${walletBalance}`;
  };

  const handleQuantityChange = (change: number) => {
    // Get lot size from asset, default to 1
    const lotSize = asset.lotSize || 1;
    
    // Increment/decrement by lot size
    const newQuantity = Math.max(lotSize, quantity + (change * lotSize));
    setQuantity(newQuantity);
    
    // Trigger margin recalculation with new quantity
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
      // Log warning if required fields are missing
      if (!asset.wid && !asset.intWID) {
        console.warn('⚠️ Missing wid/intWID for asset:', asset.symbol);
      }
      if (!asset.scriptCode) {
        console.warn('⚠️ Missing scriptCode for asset:', asset.symbol);
      }

      // Prepare the API request data
      const apiRequest: ProceedBuySellRequest = {
        intWID: asset.wid || asset.intWID || 0, // Use wid from watchlist API, fallback to intWID or 0
        scriptCode: asset.scriptCode || 0, // Use from asset data or fallback to 0
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
        scriptCode: asset.scriptCode,
        wid: asset.wid,
        intWID: asset.intWID,
        usingWID: asset.wid || asset.intWID || 0
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
      setIsLoadingMargin(true);
      
      const request: GetRequiredMarginRequest = {
        currentPosition: action === 'buy' ? 'Buy' : 'Sell',
        qty: quantity,
        scriptCode: asset.scriptCode || 0,
        lastprice: asset.price,
        isMisOrder: productType === 'MIS'
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
      setIsLoadingMargin(false);
    }
  }, [quantity, productType, asset.price, asset.exchange, asset.scriptCode, asset.lotSize, action, walletData, walletBalance, orderType, showNotification]);

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

  // Fetch wallet balance when page becomes visible
  useEffect(() => {
    if (visible) {
      fetchWalletBalance();
    }
  }, [visible, fetchWalletBalance]);

  // Initialize quantity with lot size when page opens or asset changes
  useEffect(() => {
    if (visible && asset) {
      const lotSize = asset.lotSize || 1;
      setQuantity(lotSize);
      console.log('📊 Initialized quantity with lot size:', lotSize, 'for asset:', asset.symbol);
    }
  }, [visible, asset.lotSize, asset.symbol]);

  // Fetch required margin when wallet balance is available and parameters change
  useEffect(() => {
    if (visible && walletBalance !== '0') {
      fetchRequiredMargin();
    }
  }, [visible, quantity, productType, orderType, walletBalance, fetchRequiredMargin]);

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
                currencySymbol={marketType === 'stocks' ? '₹' : '$'}
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
            <Text variant="body" color="text">Lot (Lot Size: {asset.lotSize || 1})</Text>
          </View>
          
          {/* Unit Dropdown and Quantity Controls - Side by Side */}
          <View style={styles.unitQuantityRow}>
            {/* Unit Dropdown */}
            <View style={[styles.unitDropdown, { borderColor: theme.colors.border }]}>
              <Text variant="body" color="text">Lot</Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
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
              {isLoadingMargin && (
                <Text variant="caption" color="textSecondary" style={{ marginRight: 8 }}>
                  Loading...
                </Text>
              )}
              <Text variant="body" weight="bold" color="error">
                {formatPrice(calculateRequiredAmount(), marketType)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body" weight="bold" color="text">
              Available
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isLoadingWallet && (
                <Text variant="caption" color="textSecondary" style={{ marginRight: 8 }}>
                  Loading...
                </Text>
              )}
              <Text variant="body" weight="bold" color="success">
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
    minWidth: '18%',
    alignItems: 'center',
    marginBottom: 4,
    flex: 1,
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
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    flex: 1.2,
    minWidth: 100,
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
