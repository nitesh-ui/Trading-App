import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { Card, Text, Toggle, ToggleOption } from '../../components/atomic';
import { CandlestickChart, CryptoCard, ForexCard, PriceDisplay, StockCard } from '../../components/trading';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { binanceService, CryptoIndices, CryptoPair } from '../../services/binanceService';
import { ForexIndices, ForexPair, forexService } from '../../services/forexService';
import { IndianStock, indianStockService, MarketIndices } from '../../services/indianStockService';
import { formatIndianCurrency } from '../../utils/indianFormatting';

type MarketType = 'stocks' | 'forex' | 'crypto';
type StockExchangeFilter = 'All' | 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDSL' | 'NCDEX';

export default function WatchlistScreen() {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [marketType, setMarketType] = useState<MarketType>('stocks');
  const [stockExchangeFilter, setStockExchangeFilter] = useState<StockExchangeFilter>('All');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(500)).current; // Start further below screen
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const searchModalSlideAnim = useRef(new Animated.Value(700)).current; // Start below screen
  const searchModalOpacityAnim = useRef(new Animated.Value(0)).current;
  const [stocks, setStocks] = useState<IndianStock[]>([]);
  const [indices, setIndices] = useState<MarketIndices | null>(null);
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [forexIndices, setForexIndices] = useState<ForexIndices | null>(null);
  const [cryptoPairs, setCryptoPairs] = useState<CryptoPair[]>([]);
  const [cryptoIndices, setCryptoIndices] = useState<CryptoIndices | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [selectedForexPair, setSelectedForexPair] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  
  // Trading drawer state
  const [isTradeDrawerVisible, setIsTradeDrawerVisible] = useState(false);
  const [selectedAssetForTrade, setSelectedAssetForTrade] = useState<any>(null);
  const [assetTypeForTrade, setAssetTypeForTrade] = useState<'stock' | 'forex' | 'crypto' | null>(null);
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy');
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [watchlistDeleteConfirmVisible, setWatchlistDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{symbol: string, type: 'stock' | 'forex' | 'crypto'} | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeUnit, setTradeUnit] = useState<'shares' | 'lots'>('shares');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'sl' | 'sl-m'>('market');
  const [positionType, setPositionType] = useState<'mis' | 'nrml'>('nrml');
  const [targetPrice, setTargetPrice] = useState<string>('0');
  const [stopLossPrice, setStopLossPrice] = useState<string>('0');
  const [limitPrice, setLimitPrice] = useState<string>('0');
  const [triggerPrice, setTriggerPrice] = useState<string>('0');
  const tradeDrawerSlideAnim = useRef(new Animated.Value(800)).current; // Start further below screen
  const tradeDrawerOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Available balance - mock data
  const [availableBalance] = useState(1269884.76);
  
  // Notification count
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<string[]>([]);
  const [selectedSearchExchange, setSelectedSearchExchange] = useState<StockExchangeFilter>('All');
  const searchWidthAnim = useRef(new Animated.Value(44)).current;
  const searchOpacityAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Animation refs for expanded sections - moved outside map to avoid hooks rule violation
  const stockAnimationRefs = useRef<{ [key: string]: Animated.Value }>({}).current;
  const forexAnimationRefs = useRef<{ [key: string]: Animated.Value }>({}).current;
  const cryptoAnimationRefs = useRef<{ [key: string]: Animated.Value }>({}).current;

  const toggleOptions: ToggleOption[] = [
    { value: 'stocks', label: 'Stocks' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto' },
  ];

  // Mock search data for different market types
  const mockStockData = [
    { symbol: 'TATAPOWER', name: 'Tata Power Company Ltd.', exchange: 'NSE', price: 385.80, change: 3.20, changePercent: 0.84 },
    { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd.', exchange: 'BSE', price: 934.05, change: -4.55, changePercent: -0.48 },
    { symbol: 'TATACHEM', name: 'Tata Chemicals Ltd.', exchange: 'NSE', price: 933.45, change: -5.30, changePercent: -0.56 },
    { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', exchange: 'NSE', price: 1234.50, change: 25.30, changePercent: 2.09 },
    { symbol: 'TATACOMM', name: 'Tata Communications Ltd.', exchange: 'BSE', price: 1235.80, change: 26.60, changePercent: 2.20 },
    { symbol: 'TATATECH', name: 'Tata Technologies Ltd.', exchange: 'NSE', price: 890.25, change: 15.75, changePercent: 1.80 },
    { symbol: 'TATATECH', name: 'Tata Technologies Ltd.', exchange: 'BSE', price: 891.50, change: 17.00, changePercent: 1.94 },
    { symbol: 'TATAGOLD', name: 'Tata Gold ETF', exchange: 'NSE', price: 4250.00, change: -12.50, changePercent: -0.29 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', exchange: 'BSE', price: 785.40, change: -8.90, changePercent: -1.12 },
    { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', exchange: 'NSE', price: 786.20, change: -8.10, changePercent: -1.02 },
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', price: 2456.30, change: 34.50, changePercent: 1.42 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', price: 3542.80, change: -12.30, changePercent: -0.35 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', price: 1687.90, change: 8.75, changePercent: 0.52 },
    { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', price: 1456.20, change: 15.80, changePercent: 1.10 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exchange: 'NSE', price: 987.65, change: -5.40, changePercent: -0.54 },
    { symbol: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', price: 456.30, change: 7.20, changePercent: 1.60 },
    { symbol: 'ITC', name: 'ITC Ltd.', exchange: 'NSE', price: 234.56, change: -2.30, changePercent: -0.97 },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', price: 3245.80, change: 45.60, changePercent: 1.43 },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', price: 567.80, change: 12.40, changePercent: 2.23 },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE', price: 9876.50, change: 123.40, changePercent: 1.27 },
  ];

  const mockForexData = [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', exchange: 'Forex', price: 1.0789, change: 0.0023, changePercent: 0.21 },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', exchange: 'Forex', price: 1.2456, change: -0.0034, changePercent: -0.27 },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', exchange: 'Forex', price: 149.85, change: 0.67, changePercent: 0.45 },
    { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', exchange: 'Forex', price: 0.6745, change: 0.0012, changePercent: 0.18 },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', exchange: 'Forex', price: 1.3456, change: -0.0023, changePercent: -0.17 },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', exchange: 'Forex', price: 0.8934, change: 0.0008, changePercent: 0.09 },
    { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', exchange: 'Forex', price: 0.6123, change: -0.0015, changePercent: -0.24 },
    { symbol: 'EUR/GBP', name: 'Euro / British Pound', exchange: 'Forex', price: 0.8667, change: 0.0019, changePercent: 0.22 },
    { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', exchange: 'Forex', price: 161.67, change: 0.89, changePercent: 0.55 },
    { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', exchange: 'Forex', price: 186.54, change: -0.45, changePercent: -0.24 },
    { symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', exchange: 'Forex', price: 83.24, change: 0.12, changePercent: 0.14 },
    { symbol: 'EUR/INR', name: 'Euro / Indian Rupee', exchange: 'Forex', price: 89.78, change: 0.23, changePercent: 0.26 },
  ];

  const mockCryptoData = [
    { symbol: 'BTC/USD', name: 'Bitcoin', exchange: 'Crypto', price: 65420.50, change: 1234.80, changePercent: 1.92 },
    { symbol: 'ETH/USD', name: 'Ethereum', exchange: 'Crypto', price: 3456.78, change: -89.50, changePercent: -2.52 },
    { symbol: 'BNB/USD', name: 'Binance Coin', exchange: 'Crypto', price: 567.89, change: 12.45, changePercent: 2.24 },
    { symbol: 'ADA/USD', name: 'Cardano', exchange: 'Crypto', price: 0.4567, change: 0.0234, changePercent: 5.39 },
    { symbol: 'SOL/USD', name: 'Solana', exchange: 'Crypto', price: 89.45, change: -3.67, changePercent: -3.94 },
    { symbol: 'XRP/USD', name: 'Ripple', exchange: 'Crypto', price: 0.6789, change: 0.0123, changePercent: 1.85 },
    { symbol: 'DOT/USD', name: 'Polkadot', exchange: 'Crypto', price: 7.456, change: 0.234, changePercent: 3.24 },
    { symbol: 'LINK/USD', name: 'Chainlink', exchange: 'Crypto', price: 12.34, change: -0.56, changePercent: -4.34 },
    { symbol: 'MATIC/USD', name: 'Polygon', exchange: 'Crypto', price: 0.8901, change: 0.0456, changePercent: 5.40 },
    { symbol: 'UNI/USD', name: 'Uniswap', exchange: 'Crypto', price: 6.789, change: -0.234, changePercent: -3.33 },
    { symbol: 'AVAX/USD', name: 'Avalanche', exchange: 'Crypto', price: 23.45, change: 1.23, changePercent: 5.54 },
    { symbol: 'LTC/USD', name: 'Litecoin', exchange: 'Crypto', price: 78.90, change: -2.34, changePercent: -2.88 },
  ];

  // Subscribe to live updates for stocks
  useEffect(() => {
    // Initial data load
    setStocks(indianStockService.getStocks());
    setIndices(indianStockService.getIndices());

    // Subscribe to live updates
    const unsubscribe = indianStockService.subscribe((updatedStocks, updatedIndices) => {
      setStocks(updatedStocks);
      setIndices(updatedIndices);
    });

    return unsubscribe;
  }, []);

  // Subscribe to live updates for forex
  useEffect(() => {
    // Initial data load
    setForexPairs(forexService.getPairs());
    setForexIndices(forexService.getIndices());

    // Subscribe to live updates
    const unsubscribe = forexService.subscribe((updatedPairs, updatedIndices) => {
      setForexPairs(updatedPairs);
      setForexIndices(updatedIndices);
    });

    return unsubscribe;
  }, []);

  // Subscribe to live updates for crypto
  useEffect(() => {
    // Initial data load
    setCryptoPairs(binanceService.getCryptoPairs());
    setCryptoIndices(binanceService.getCryptoIndices());

    // Subscribe to live updates
    const unsubscribe = binanceService.subscribe((updatedPairs, updatedIndices) => {
      setCryptoPairs(updatedPairs);
      setCryptoIndices(updatedIndices);
    });

    return unsubscribe;
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchModalVisible) {
      // Delay focus to ensure modal is fully rendered
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isSearchModalVisible]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Simulate API refresh delay
    setTimeout(() => {
      if (marketType === 'stocks') {
        setStocks(indianStockService.getStocks());
        setIndices(indianStockService.getIndices());
      } else if (marketType === 'forex') {
        setForexPairs(forexService.getPairs());
        setForexIndices(forexService.getIndices());
      } else if (marketType === 'crypto') {
        setCryptoPairs(binanceService.getCryptoPairs());
        setCryptoIndices(binanceService.getCryptoIndices());
      }
      setRefreshing(false);
    }, 1000);
  }, [marketType]);

  const handleStockPress = (symbol: string) => {
    if (selectedStock === symbol) {
      animateStockExpansion(symbol, false);
      setSelectedStock(null);
    } else {
      // Collapse any currently expanded stock
      if (selectedStock) {
        animateStockExpansion(selectedStock, false);
      }
      // Expand the new stock
      animateStockExpansion(symbol, true);
      setSelectedStock(symbol);
      setSelectedForexPair(null); // Clear forex selection
      setSelectedCrypto(null); // Clear crypto selection
    }
  };

  const handleForexPress = (symbol: string) => {
    if (selectedForexPair === symbol) {
      animateForexExpansion(symbol, false);
      setSelectedForexPair(null);
    } else {
      // Collapse any currently expanded forex pair
      if (selectedForexPair) {
        animateForexExpansion(selectedForexPair, false);
      }
      // Expand the new forex pair
      animateForexExpansion(symbol, true);
      setSelectedForexPair(symbol);
      setSelectedStock(null); // Clear stock selection
      setSelectedCrypto(null); // Clear crypto selection
    }
  };

  const handleCryptoPress = (symbol: string) => {
    if (selectedCrypto === symbol) {
      animateCryptoExpansion(symbol, false);
      setSelectedCrypto(null);
    } else {
      // Collapse any currently expanded crypto
      if (selectedCrypto) {
        animateCryptoExpansion(selectedCrypto, false);
      }
      // Expand the new crypto
      animateCryptoExpansion(symbol, true);
      setSelectedCrypto(symbol);
      setSelectedStock(null); // Clear stock selection
      setSelectedForexPair(null); // Clear forex selection
    }
  };

  const handleMarketTypeChange = (type: string) => {
    // Collapse any currently expanded items before switching
    if (selectedStock) {
      animateStockExpansion(selectedStock, false);
    }
    if (selectedForexPair) {
      animateForexExpansion(selectedForexPair, false);
    }
    if (selectedCrypto) {
      animateCryptoExpansion(selectedCrypto, false);
    }
    
    setMarketType(type as MarketType);
    setSelectedStock(null);
    setSelectedForexPair(null);
    setSelectedCrypto(null);
    // Reset stock exchange filter when switching market types
    setStockExchangeFilter('All');
  };

  // Trading drawer functions
  const openTradeDrawer = (asset: any, assetType: 'stock' | 'forex' | 'crypto', action: 'buy' | 'sell' = 'buy') => {
    setSelectedAssetForTrade(asset);
    setAssetTypeForTrade(assetType);
    setTradeAction(action);
    setTradeQuantity(1); // Reset quantity
    setTradeUnit('shares'); // Reset unit
    setOrderType('market'); // Reset order type
    setPositionType('nrml'); // Reset position type
    setTargetPrice('0'); // Reset target
    setStopLossPrice('0'); // Reset stop loss
    setLimitPrice('0'); // Reset limit price
    setTriggerPrice('0'); // Reset trigger price
    
    // First, reset animation values
    tradeDrawerSlideAnim.setValue(800);
    tradeDrawerOpacityAnim.setValue(0);
    
    // Then set modal visible
    setIsTradeDrawerVisible(true);
    
    // Small delay to ensure modal is rendered before animation
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(tradeDrawerSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(tradeDrawerOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeTradeDrawer = () => {
    console.log('Trade drawer closing - starting fade');
    // First fade out overlay immediately, then slide modal
    Animated.timing(tradeDrawerOpacityAnim, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      console.log('Trade drawer - overlay faded, starting slide down');
      // After overlay is gone, slide the modal down
      Animated.timing(tradeDrawerSlideAnim, {
        toValue: 800,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        console.log('Trade drawer - slide completed, hiding modal');
        setIsTradeDrawerVisible(false);
        setSelectedAssetForTrade(null);
        setAssetTypeForTrade(null);
        setTradeQuantity(1);
        setTradeUnit('shares');
        setOrderType('market');
        setPositionType('nrml');
        setTargetPrice('0');
        setStopLossPrice('0');
        setLimitPrice('0');
        setTriggerPrice('0');
      });
    });
  };

  const increaseQuantity = () => {
    setTradeQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setTradeQuantity(prev => Math.max(1, prev - 1));
  };

  const getTotalValue = () => {
    const price = parseFloat(limitPrice) || selectedAssetForTrade?.price || 0;
    return price * tradeQuantity;
  };

  const getRequiredAmount = () => {
    const price = parseFloat(limitPrice) || selectedAssetForTrade?.price || 0;
    return price * tradeQuantity;
  };

  const handleOrderTypeChange = (type: 'market' | 'limit' | 'sl' | 'sl-m') => {
    setOrderType(type);
    
    // Set default prices when changing order type
    if (type === 'market') {
      setLimitPrice('0');
      setTriggerPrice('0');
    } else if (type === 'limit') {
      setLimitPrice(selectedAssetForTrade?.price?.toString() || '0');
      setTriggerPrice('0');
    } else if (type === 'sl') {
      setLimitPrice('0');
      setTriggerPrice(selectedAssetForTrade?.price?.toString() || '0');
    } else if (type === 'sl-m') {
      setLimitPrice(selectedAssetForTrade?.price?.toString() || '0');
      setTriggerPrice(selectedAssetForTrade?.price?.toString() || '0');
    }
  };

  const handleTradeSubmit = () => {
    if (tradeAction === 'sell') {
      // Show sell confirmation popup
      closeTradeDrawer();
      setTimeout(() => {
        Alert.alert(
          'Confirm Sale',
          `Are you sure you want to sell ${tradeQuantity} ${tradeUnit} of ${selectedAssetForTrade?.symbol}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Sell', 
              style: 'destructive', 
              onPress: () => {
                console.log(`Selling ${tradeQuantity} ${tradeUnit} of ${selectedAssetForTrade?.symbol}`);
                Alert.alert('Success', 'Sell order placed successfully!');
                incrementNotificationCount(); // Add notification when order is placed
              }
            }
          ]
        );
      }, 500);
    } else {
      // Handle buy
      console.log(`Buying ${tradeQuantity} ${tradeUnit} of ${selectedAssetForTrade?.symbol}`);
      Alert.alert('Success', 'Buy order placed successfully!');
      incrementNotificationCount(); // Add notification when order is placed
      closeTradeDrawer();
    }
  };

  const handleDeleteAsset = () => {
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteAsset = () => {
    console.log(`Deleting ${selectedAssetForTrade?.symbol} from watchlist`);
    setDeleteConfirmVisible(false);
    closeTradeDrawer();
    // Handle delete logic here
  };

  const handleBuyStock = (symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      openTradeDrawer(stock, 'stock', 'buy');
    }
  };

  const handleSellStock = (symbol: string) => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      openTradeDrawer(stock, 'stock', 'sell');
    }
  };

  const handleBuyForex = (symbol: string) => {
    const forex = forexPairs.find(f => f.symbol === symbol);
    if (forex) {
      openTradeDrawer(forex, 'forex', 'buy');
    }
  };

  const handleSellForex = (symbol: string) => {
    const forex = forexPairs.find(f => f.symbol === symbol);
    if (forex) {
      openTradeDrawer(forex, 'forex', 'sell');
    }
  };

  const handleBuyCrypto = (symbol: string) => {
    const crypto = cryptoPairs.find(c => c.symbol === symbol);
    if (crypto) {
      openTradeDrawer(crypto, 'crypto', 'buy');
    }
  };

  const handleSellCrypto = (symbol: string) => {
    const crypto = cryptoPairs.find(c => c.symbol === symbol);
    if (crypto) {
      openTradeDrawer(crypto, 'crypto', 'sell');
    }
  };

  // Watchlist delete functions
  const handleDeleteFromWatchlist = (symbol: string, type: 'stock' | 'forex' | 'crypto') => {
    setItemToDelete({ symbol, type });
    setWatchlistDeleteConfirmVisible(true);
  };

  // Notification helper functions
  const incrementNotificationCount = () => {
    setNotificationCount(prev => prev + 1);
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const confirmDeleteFromWatchlist = () => {
    if (itemToDelete) {
      const { symbol, type } = itemToDelete;
      
      // Remove from respective arrays
      if (type === 'stock') {
        setStocks(prev => prev.filter(stock => stock.symbol !== symbol));
        // Collapse if currently expanded
        if (selectedStock === symbol) {
          animateStockExpansion(symbol, false);
          setSelectedStock(null);
        }
      } else if (type === 'forex') {
        setForexPairs(prev => prev.filter(pair => pair.symbol !== symbol));
        // Collapse if currently expanded
        if (selectedForexPair === symbol) {
          animateForexExpansion(symbol, false);
          setSelectedForexPair(null);
        }
      } else if (type === 'crypto') {
        setCryptoPairs(prev => prev.filter(crypto => crypto.symbol !== symbol));
        // Collapse if currently expanded
        if (selectedCrypto === symbol) {
          animateCryptoExpansion(symbol, false);
          setSelectedCrypto(null);
        }
      }
      
      console.log(`Removed ${symbol} from ${type} watchlist`);
    }
    
    setWatchlistDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const cancelDeleteFromWatchlist = () => {
    setWatchlistDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  // Helper functions to get or create animation values
  const getStockAnimationValue = (symbol: string) => {
    if (!stockAnimationRefs[symbol]) {
      stockAnimationRefs[symbol] = new Animated.Value(0);
    }
    return stockAnimationRefs[symbol];
  };

  const getForexAnimationValue = (pair: string) => {
    if (!forexAnimationRefs[pair]) {
      forexAnimationRefs[pair] = new Animated.Value(0);
    }
    return forexAnimationRefs[pair];
  };

  const getCryptoAnimationValue = (symbol: string) => {
    if (!cryptoAnimationRefs[symbol]) {
      cryptoAnimationRefs[symbol] = new Animated.Value(0);
    }
    return cryptoAnimationRefs[symbol];
  };

  // Functions to animate expanded sections
  const animateStockExpansion = (symbol: string, expanded: boolean) => {
    const animValue = getStockAnimationValue(symbol);
    Animated.timing(animValue, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    }).start();
  };

  const animateForexExpansion = (pair: string, expanded: boolean) => {
    const animValue = getForexAnimationValue(pair);
    Animated.timing(animValue, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    }).start();
  };

  const animateCryptoExpansion = (symbol: string, expanded: boolean) => {
    const animValue = getCryptoAnimationValue(symbol);
    Animated.timing(animValue, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    }).start();
  };

  // Helper functions for filtering
  const filterItems = (items: any[], query: string) => {
    if (!query.trim()) return items;
    
    return items.filter(item => 
      item.symbol?.toLowerCase().includes(query.toLowerCase()) ||
      item.name?.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filterStocksByExchange = (stocks: IndianStock[], exchangeFilter: StockExchangeFilter) => {
    if (exchangeFilter === 'All') return stocks;
    if (exchangeFilter === 'NFO') {
      // NFO is derivatives market, for demo purposes we'll show NSE stocks with F&O
      // In real app, you'd have a separate NFO data or flag
      return stocks.filter(stock => stock.exchange === 'NSE' && ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'].includes(stock.symbol));
    }
    // For other exchanges, filter by exact match
    return stocks.filter(stock => stock.exchange === exchangeFilter);
  };

  // Deprecated search functions (keeping for backward compatibility)
  const expandSearch = () => {
    // Open search modal instead
    openSearchModal();
  };

  const collapseSearch = () => {
    // Close search modal instead  
    closeSearchModal();
  };

  const handleSearchSubmit = () => {
    // Open search modal instead
    openSearchModal();
  };

  const openFilterModal = () => {
    // First, reset animation values
    modalSlideAnim.setValue(500);
    modalOpacityAnim.setValue(0);
    
    // Then set modal visible
    setIsFilterModalVisible(true);
    
    // Small delay to ensure modal is rendered before animation
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeFilterModal = () => {
    console.log('Filter modal closing - starting fade');
    // First fade out overlay immediately, then slide modal
    Animated.timing(modalOpacityAnim, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      console.log('Filter modal - overlay faded, starting slide down');
      // After overlay is gone, slide the modal down
      Animated.timing(modalSlideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        console.log('Filter modal - slide completed, hiding modal');
        setIsFilterModalVisible(false);
      });
    });
  };

  // Search modal animation functions
  const openSearchModal = () => {
    // First, reset animation values
    searchModalSlideAnim.setValue(700);
    searchModalOpacityAnim.setValue(0);
    
    // Set initial data and modal visible
    setIsSearchModalVisible(true);
    setSearchQuery('');
    setSearchResults([]);
    
    // Small delay to ensure modal is rendered before animation
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(searchModalSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 90,
        }),
        Animated.timing(searchModalOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeSearchModal = () => {
    // First fade out overlay immediately, then slide modal
    Animated.timing(searchModalOpacityAnim, {
      toValue: 0,
      duration: 80,
      useNativeDriver: true,
    }).start(() => {
      // After overlay is gone, slide the modal down
      Animated.timing(searchModalSlideAnim, {
        toValue: 700,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsSearchModalVisible(false);
        setSearchQuery('');
        setSearchResults([]);
      });
    });
  };

  // Search functionality
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Get appropriate data based on market type
    let searchData: any[] = [];
    if (marketType === 'stocks') {
      searchData = mockStockData;
    } else if (marketType === 'forex') {
      searchData = mockForexData;
    } else if (marketType === 'crypto') {
      searchData = mockCryptoData;
    }

    // Filter data based on search query
    let results = searchData.filter((item: any) => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    // Apply exchange filter only for stocks
    if (marketType === 'stocks' && selectedSearchExchange !== 'All') {
      results = results.filter((item: any) => item.exchange === selectedSearchExchange);
    }

    // Remove duplicates and limit results
    const uniqueResults = results.filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t.symbol === item.symbol && t.exchange === item.exchange)
    ).slice(0, 20);

    setSearchResults(uniqueResults);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const handleSearchExchangeFilter = (exchange: StockExchangeFilter) => {
    setSelectedSearchExchange(exchange);
    performSearch(searchQuery);
  };

  // Add to watchlist functionality
  const addToWatchlist = (symbol: string, exchange: string) => {
    const itemKey = `${symbol}-${exchange}`;
    if (!watchlistItems.includes(itemKey)) {
      setWatchlistItems(prev => [...prev, itemKey]);
      // You can add a notification here
      console.log(`Added ${symbol} (${exchange}) to watchlist`);
    }
  };

  const isInWatchlist = (symbol: string, exchange: string) => {
    return watchlistItems.includes(`${symbol}-${exchange}`);
  };

  // Apply filters to current market data (no search filtering for watchlist)
  const exchangeFilteredStocks = filterStocksByExchange(stocks, stockExchangeFilter);
  const filteredStocks = exchangeFilteredStocks; // Remove search filtering from watchlist
  const filteredForexPairs = forexPairs; // No search filtering for watchlist
  const filteredCryptoPairs = cryptoPairs; // No search filtering for watchlist

  // Stock exchange toggle options
  const stockExchangeOptions: ToggleOption[] = [
    { value: 'All', label: 'All' },
    { value: 'NSE', label: 'NSE' },
    { value: 'BSE', label: 'BSE' },
    { value: 'NFO', label: 'NFO' },
    { value: 'MCX', label: 'MCX' },
    { value: 'CDSL', label: 'CDSL' },
    { value: 'NCDEX', label: 'NCDEX' },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.header}>
          {!isSearchExpanded && (
            <View style={styles.headerLeft}>
              <Text variant="headline" weight="bold" color="text">
                Watchlist
              </Text>
              <Text variant="body" color="textSecondary">
                Favorite {marketType === 'stocks' ? 'stocks' : marketType === 'forex' ? 'currency pairs' : 'cryptocurrencies'}
              </Text>
            </View>
          )}
          
          <View style={[styles.headerActions, isSearchExpanded && styles.headerActionsExpanded]}>
            {/* Notification and Wallet Icons - hidden when search is expanded */}
            {!isSearchExpanded && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
                  onPress={() => showNotification({
                    type: 'info',
                    title: 'Coming Soon',
                    message: 'Wallet features will be available soon'
                  })}
                >
                  <Ionicons name="wallet" size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, position: 'relative' }]}
                  onPress={() => {
                    if (notificationCount > 0) {
                      clearNotifications(); // Clear notifications when clicked if there are any
                    } else {
                      showNotification({
                        type: 'info',
                        title: 'Coming Soon',
                        message: 'Advanced notification features will be available soon'
                      });
                    }
                  }}
                >
                  <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                  {notificationCount > 0 && (
                    <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                      <Text style={styles.notificationText}>
                        {notificationCount > 99 ? '99+' : notificationCount.toString()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Animated Search */}
            <Animated.View 
              style={[
                styles.searchContainer,
                isSearchExpanded && { flex: 1 },
                {
                  width: isSearchExpanded ? undefined : searchWidthAnim,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                }
              ]}
            >
              {!isSearchExpanded ? (
                <TouchableOpacity
                  style={styles.searchIconButton}
                  onPress={expandSearch}
                >
                  <Ionicons name="search" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.searchInputContainer}>
                  <Ionicons 
                    name="search" 
                    size={16} 
                    color={theme.colors.textSecondary} 
                    style={styles.searchInputIcon}
                  />
                  <Animated.View style={{ opacity: searchOpacityAnim, flex: 1 }}>
                    <TextInput
                      ref={searchInputRef}
                      style={[
                        styles.searchInput,
                        { color: theme.colors.text }
                      ]}
                      placeholder={`Search ${marketType}...`}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onSubmitEditing={handleSearchSubmit}
                      returnKeyType="search"
                    />
                  </Animated.View>
                  
                  <View style={styles.searchActions}>
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={collapseSearch}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        </View>

        {/* Market Type Toggle - Also in fixed header */}
        <View style={styles.toggleContainer}>
          <Toggle
            options={toggleOptions}
            selectedValue={marketType}
            onValueChange={handleMarketTypeChange}
            style={styles.toggle}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >

        {/* Market Indices */}
        {marketType === 'stocks' && indices && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Market Indices
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>NIFTY 50</Text>
                  <PriceDisplay
                    price={indices.nifty50.value}
                    change={indices.nifty50.change}
                    changePercent={indices.nifty50.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>SENSEX</Text>
                  <PriceDisplay
                    price={indices.sensex.value}
                    change={indices.sensex.change}
                    changePercent={indices.sensex.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>BANK NIFTY</Text>
                  <PriceDisplay
                    price={indices.bankNifty.value}
                    change={indices.bankNifty.change}
                    changePercent={indices.bankNifty.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Forex Indices */}
        {marketType === 'forex' && forexIndices && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Forex Indices
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>DXY</Text>
                  <PriceDisplay
                    price={forexIndices.dxy.value}
                    change={forexIndices.dxy.change}
                    changePercent={forexIndices.dxy.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>EUR/USD</Text>
                  <PriceDisplay
                    price={forexIndices.eur.value}
                    change={forexIndices.eur.change}
                    changePercent={forexIndices.eur.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>GBP/USD</Text>
                  <PriceDisplay
                    price={forexIndices.gbp.value}
                    change={forexIndices.gbp.change}
                    changePercent={forexIndices.gbp.changePercent}
                    size="medium"
                    showSymbol={false}
                    showChange={true}
                    align="center"
                  />
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Crypto Indices */}
        {marketType === 'crypto' && cryptoIndices && (
          <View style={styles.indicesContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Crypto Market
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.indicesRow}>
                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>Market Cap</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    ${(cryptoIndices.totalMarketCap / 1e12).toFixed(2)}T
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>24h Volume</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    ${(cryptoIndices.totalVolume24h / 1e9).toFixed(1)}B
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>BTC Dominance</Text>
                  <Text variant="body" weight="semibold" color="text" style={styles.indexValue}>
                    {cryptoIndices.btcDominance.toFixed(1)}%
                  </Text>
                </Card>

                <Card padding="medium" style={styles.indexCard}>
                  <Text variant="caption" color="textSecondary" style={styles.indexLabel}>Fear & Greed</Text>
                  <Text
                    variant="body"
                    weight="semibold"
                    color={cryptoIndices.fearGreedIndex > 50 ? 'success' : 'error'}
                    style={styles.indexValue}
                  >
                    {Math.round(cryptoIndices.fearGreedIndex)}
                  </Text>
                </Card>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Stocks List */}
        {marketType === 'stocks' && (
          <View style={styles.stocksContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                  Your Stocks 
                  {stockExchangeFilter !== 'All' && ` - ${stockExchangeFilter}`}
                  {stockExchangeFilter !== 'All' && ` (${filteredStocks.length})`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.filterIconButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={openFilterModal}
              >
                <Ionicons name="filter" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {filteredStocks.length === 0 && stockExchangeFilter !== 'All' ? (
              <Card padding="large" style={styles.noResultsCard}>
                <Ionicons name="search" size={48} color={theme.colors.textSecondary} style={styles.noResultsIcon} />
                <Text variant="body" color="textSecondary" style={styles.noResultsText}>
                  No stocks found in {stockExchangeFilter}
                </Text>
                <Text variant="caption" color="textSecondary">
                  Try adjusting your filter selection
                </Text>
              </Card>
            ) : (
              filteredStocks.map((stock) => {
                const isExpanded = selectedStock === stock.symbol;
                const animatedHeight = getStockAnimationValue(stock.symbol);

                return (
              <View key={stock.symbol} style={styles.stockItem} collapsable={false}>
                <StockCard
                  stock={{
                    symbol: stock.symbol,
                    name: stock.name,
                    price: stock.price,
                    change: stock.change,
                    changePercent: stock.changePercent,
                    volume: stock.volume,
                    marketCap: stock.marketCap,
                  }}
                  showDetails={selectedStock === stock.symbol}
                  onPress={() => handleStockPress(stock.symbol)}
                />

                <Animated.View style={{
                  opacity: animatedHeight.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0.8, 1],
                    extrapolate: 'clamp',
                  }),
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 650],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}>
                  <Card padding="medium" style={StyleSheet.flatten([styles.expandedCard, { borderBottomColor: theme.colors.border }])}>
                    {/* Stock Details */}
                    <View style={styles.stockDetails}>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Open</Text>
                        <Text variant="caption" color="text">{formatIndianCurrency(stock.open)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">High</Text>
                        <Text variant="caption" color="text">{formatIndianCurrency(stock.high)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Low</Text>
                        <Text variant="caption" color="text">{formatIndianCurrency(stock.low)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Prev Close</Text>
                        <Text variant="caption" color="text">{formatIndianCurrency(stock.previousClose)}</Text>
                      </View>
                    </View>

                    {/* Chart */}
                    <View style={styles.chartContainer}>
                      <CandlestickChart symbol={stock.symbol} />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleBuyStock(stock.symbol)}
                      >
                        <Ionicons name="trending-up" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Buy
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sellButton, { backgroundColor: theme.colors.error }]}
                        onPress={() => handleSellStock(stock.symbol)}
                      >
                        <Ionicons name="trending-down" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Sell
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.colors.textSecondary + '20', borderColor: theme.colors.textSecondary + '40' }]}
                        onPress={() => handleDeleteFromWatchlist(stock.symbol, 'stock')}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </Animated.View>
              </View>
                )
              })
            )}
          </View>
        )}

        {/* Forex List */}
        {marketType === 'forex' && (
          <View style={styles.stocksContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Your Currency Pairs
            </Text>

            {filteredForexPairs.length === 0 ? (
              <Card padding="large" style={styles.noResultsCard}>
                <Ionicons name="search" size={48} color={theme.colors.textSecondary} style={styles.noResultsIcon} />
                <Text variant="body" color="textSecondary" style={styles.noResultsText}>
                  No forex pairs in your watchlist
                </Text>
                <Text variant="caption" color="textSecondary">
                  Use the search feature to add forex pairs
                </Text>
              </Card>
            ) : (
              filteredForexPairs.map((pair) => {
                const isExpanded = selectedForexPair === pair.symbol;
                const animatedHeight = getForexAnimationValue(pair.symbol);

                return (
              <View key={pair.symbol} style={styles.stockItem} collapsable={false}>
                <ForexCard
                  pair={{
                    symbol: pair.symbol,
                    name: pair.name,
                    price: pair.price,
                    change: pair.change,
                    changePercent: pair.changePercent,
                    volume: pair.volume,
                    spread: pair.spread,
                    pipValue: pair.pipValue,
                  }}
                  showDetails={selectedForexPair === pair.symbol}
                  onPress={() => handleForexPress(pair.symbol)}
                />

                <Animated.View style={{
                  opacity: animatedHeight.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0.8, 1],
                    extrapolate: 'clamp',
                  }),
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 650],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}>
                  <Card padding="medium" style={StyleSheet.flatten([styles.expandedCard, { paddingBottom: 20, borderBottomColor: theme.colors.border }])}>
                    {/* Forex Details */}
                    <View style={styles.stockDetails}>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Open</Text>
                        <Text variant="caption" color="text">{pair.open.toFixed(4)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">High</Text>
                        <Text variant="caption" color="text">{pair.high.toFixed(4)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Low</Text>
                        <Text variant="caption" color="text">{pair.low.toFixed(4)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Prev Close</Text>
                        <Text variant="caption" color="text">{pair.previousClose.toFixed(4)}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Spread</Text>
                        <Text variant="caption" color="text">{pair.spread.toFixed(4)}</Text>
                      </View>
                    </View>

                    {/* Chart */}
                    <View style={styles.chartContainer}>
                      <CandlestickChart symbol={pair.symbol} />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleBuyForex(pair.symbol)}
                      >
                        <Ionicons name="trending-up" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Buy
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sellButton, { backgroundColor: theme.colors.error }]}
                        onPress={() => handleSellForex(pair.symbol)}
                      >
                        <Ionicons name="trending-down" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Sell
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.colors.textSecondary + '20', borderColor: theme.colors.textSecondary + '40' }]}
                        onPress={() => handleDeleteFromWatchlist(pair.symbol, 'forex')}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </Animated.View>
              </View>
                )
              })
            )}
          </View>
        )}

        {/* Crypto List */}
        {marketType === 'crypto' && (
          <View style={styles.stocksContainer}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Your Cryptocurrencies
            </Text>

            {filteredCryptoPairs.length === 0 ? (
              <Card padding="large" style={styles.noResultsCard}>
                <Ionicons name="search" size={48} color={theme.colors.textSecondary} style={styles.noResultsIcon} />
                <Text variant="body" color="textSecondary" style={styles.noResultsText}>
                  No cryptocurrencies in your watchlist
                </Text>
                <Text variant="caption" color="textSecondary">
                  Use the search feature to add cryptocurrencies
                </Text>
              </Card>
            ) : (
              filteredCryptoPairs.map((crypto) => {
                const isExpanded = selectedCrypto === crypto.symbol;
                const animatedHeight = getCryptoAnimationValue(crypto.symbol);

                return (
                <View key={crypto.symbol} style={styles.stockItem} collapsable={false}>
                <CryptoCard
                  crypto={{
                    id: crypto.id,
                    symbol: crypto.symbol,
                    name: crypto.name,
                    price: crypto.price,
                    change24h: crypto.change24h,
                    changePercent24h: crypto.changePercent24h,
                    volume24h: crypto.volume24h,
                    marketCap: crypto.marketCap,
                    rank: crypto.rank,
                  }}
                  onPress={() => handleCryptoPress(crypto.symbol)}
                  showDetails={selectedCrypto === crypto.symbol}
                />

                <Animated.View style={{
                  opacity: animatedHeight.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 0.8, 1],
                    extrapolate: 'clamp',
                  }),
                  maxHeight: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 650],
                    extrapolate: 'clamp',
                  }),
                  overflow: 'hidden',
                }}>
                  <Card padding="medium" style={StyleSheet.flatten([styles.expandedCard, { borderBottomColor: theme.colors.border }])}>
                    {/* Detailed Stats */}
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">24h Volume</Text>
                        <Text variant="caption" color="text">
                          ${(crypto.volume24h / 1e9).toFixed(2)}B
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Market Cap</Text>
                        <Text variant="caption" color="text">
                          ${(crypto.marketCap / 1e9).toFixed(1)}B
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Rank</Text>
                        <Text variant="caption" color="text">#{crypto.rank}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text variant="caption" color="textSecondary">Last Updated</Text>
                        <Text variant="caption" color="text">
                          {new Date(crypto.lastUpdated).toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>

                    {/* Chart */}
                    <View style={styles.chartContainer}>
                      <CandlestickChart symbol={crypto.symbol} />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.buyButton, { backgroundColor: theme.colors.success }]}
                        onPress={() => handleBuyCrypto(crypto.symbol)}
                      >
                        <Ionicons name="trending-up" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Buy
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sellButton, { backgroundColor: theme.colors.error }]}
                        onPress={() => handleSellCrypto(crypto.symbol)}
                      >
                        <Ionicons name="trending-down" size={16} color={theme.colors.surface} />
                        <Text variant="body" weight="semibold" style={{ color: theme.colors.surface, marginLeft: 4 }}>
                          Sell
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.colors.textSecondary + '20', borderColor: theme.colors.textSecondary + '40' }]}
                        onPress={() => handleDeleteFromWatchlist(crypto.symbol, 'crypto')}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                </Animated.View>
              </View>
                )
              })
            )}
          </View>
        )}

      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={closeFilterModal}
        statusBarTranslucent
        hardwareAccelerated={true}
      >
        <View style={styles.searchModalWrapper}>
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: modalOpacityAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeFilterModal}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.modalContainer, 
              { 
                backgroundColor: theme.colors.card,
                transform: [{ translateY: modalSlideAnim }],
              }
            ]}
          >
            {/* Content Container with ScrollView */}
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Drawer Handle */}
              <View style={[styles.drawerHandle, { backgroundColor: theme.colors.textSecondary + '40' }]} />
              
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text variant="title" weight="bold" color="text">
                    Filter by Exchange
                  </Text>
                  <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                    Choose which exchange to display
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeFilterModal}
                  style={[styles.searchModalCloseButton, { backgroundColor: theme.colors.surface }]}
                >
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
                <View style={styles.modalContent}>
                  {stockExchangeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.modalOption,
                        {
                          backgroundColor: stockExchangeFilter === option.value 
                            ? theme.colors.primary + '15' 
                            : 'transparent',
                          borderColor: stockExchangeFilter === option.value 
                            ? theme.colors.primary 
                            : theme.colors.border,
                        }
                      ]}
                      onPress={() => {
                        setStockExchangeFilter(option.value as StockExchangeFilter);
                        closeFilterModal();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text 
                        variant="body" 
                        weight={stockExchangeFilter === option.value ? 'semibold' : 'medium'}
                        color={stockExchangeFilter === option.value ? 'primary' : 'text'}
                      >
                        {option.label}
                      </Text>
                      {stockExchangeFilter === option.value && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            </Animated.View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isSearchModalVisible}
        onRequestClose={closeSearchModal}
        statusBarTranslucent
        hardwareAccelerated={true}
      >
        <View style={styles.searchModalWrapper}>
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: searchModalOpacityAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeSearchModal}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.searchModalContainer, 
              { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                transform: [{ translateY: searchModalSlideAnim }],
              }
            ]}
          >
            {/* Content Container with ScrollView to handle keyboard */}
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Drawer Handle */}
              <View style={[styles.drawerHandle, { backgroundColor: theme.colors.textSecondary + '40' }]} />
              
              {/* Header */}
              <View style={[styles.searchModalHeader, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.searchModalHeaderLeft}>
                  <Text variant="title" weight="bold" color="text">
                    Search {marketType === 'stocks' ? 'Stocks' : marketType === 'forex' ? 'Forex' : 'Crypto'}
                  </Text>
                  <Text variant="caption" color="textSecondary" style={styles.searchModalSubtitle}>
                    Find and add to your watchlist
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={closeSearchModal}
                  style={[styles.searchModalCloseButton, { backgroundColor: theme.colors.surface }]}
                >
                  <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <View style={[styles.searchInputContainerModal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons 
                  name="search" 
                  size={18} 
                  color={theme.colors.textSecondary} 
                />
                <TextInput
                  ref={searchInputRef}
                  style={[
                    styles.searchInputModal,
                    { 
                      color: theme.colors.text,
                      fontSize: 16,
                    }
                  ]}
                  placeholder={`Search ${marketType}...`}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearchQueryChange}
                  returnKeyType="search"
                  autoFocus={true}
                  selectionColor={theme.colors.primary}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.searchClearButton}
                  >
                    <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Exchange Filter for Stocks */}
              {marketType === 'stocks' && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={[styles.exchangeFilterScroll, { borderBottomColor: theme.colors.border }]}
                  contentContainerStyle={styles.exchangeFilterContent}
                >
                  {stockExchangeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.exchangeFilterTab,
                        {
                          backgroundColor: selectedSearchExchange === option.value 
                            ? theme.colors.primary 
                            : 'transparent',
                          borderColor: selectedSearchExchange === option.value 
                            ? theme.colors.primary 
                            : theme.colors.border,
                        }
                      ]}
                      onPress={() => handleSearchExchangeFilter(option.value as StockExchangeFilter)}
                    >
                      <Text 
                        variant="caption" 
                        weight="medium"
                        style={{
                          color: selectedSearchExchange === option.value 
                            ? theme.colors.surface 
                            : theme.colors.text
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Search Results */}
              <View style={styles.searchResultsContainer}>
                {searchQuery.length === 0 ? (
                  <View style={styles.searchEmptyState}>
                    <Ionicons name="search" size={48} color={theme.colors.textSecondary + '40'} />
                    <Text variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 16 }}>
                      Start typing to search for {marketType}
                    </Text>
                  </View>
                ) : searchResults.length === 0 ? (
                  <View style={styles.searchEmptyState}>
                    <Ionicons name="sad-outline" size={48} color={theme.colors.textSecondary + '40'} />
                    <Text variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 16 }}>
                      No results found for "{searchQuery}"
                    </Text>
                    <Text variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
                      Try different keywords or check spelling
                    </Text>
                  </View>
                ) : (
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                  >
                    {searchResults.map((item, index) => (
                      <TouchableOpacity
                        key={`${item.symbol}-${item.exchange}-${index}`}
                        style={[styles.searchResultItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => {
                          if (!isInWatchlist(item.symbol, item.exchange)) {
                            addToWatchlist(item.symbol, item.exchange);
                          }
                          closeSearchModal();
                        }}
                      >
                        <View style={styles.searchResultLeft}>
                          <View style={styles.searchResultHeader}>
                            <Text variant="body" weight="semibold" color="text">
                              {item.symbol}
                            </Text>
                            {marketType === 'stocks' && (
                              <View style={[styles.searchResultExchangeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Text variant="caption" weight="medium" style={{ color: theme.colors.primary }}>
                                  {item.exchange}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text variant="caption" color="textSecondary" numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        
                        <View style={styles.searchResultRight}>
                          <Text variant="body" weight="semibold" color="text">
                            {marketType === 'stocks' ? formatIndianCurrency(item.price) : 
                             marketType === 'forex' ? item.price.toFixed(4) : 
                             `$${item.price.toLocaleString()}`}
                          </Text>
                          <Text 
                            variant="caption" 
                            weight="medium"
                            style={{ 
                              color: item.changePercent >= 0 ? theme.colors.success : theme.colors.error 
                            }}
                          >
                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </Text>
                          
                          {isInWatchlist(item.symbol, item.exchange) ? (
                            <View style={[styles.addedButton, { backgroundColor: theme.colors.success + '20' }]}>
                              <Ionicons name="checkmark" size={14} color={theme.colors.success} />
                              <Text variant="caption" style={{ color: theme.colors.success, marginLeft: 4 }}>
                                Added
                              </Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                              onPress={(e) => {
                                e.stopPropagation();
                                addToWatchlist(item.symbol, item.exchange);
                              }}
                            >
                              <Ionicons name="add" size={14} color="white" />
                              <Text variant="caption" style={{ color: 'white', marginLeft: 4 }}>
                                Add
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </ScrollView>
            </Animated.View>
        </View>
      </Modal>

      {/* Trading Drawer */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isTradeDrawerVisible}
        onRequestClose={closeTradeDrawer}
        statusBarTranslucent
        hardwareAccelerated={true}
      >
        <View style={styles.searchModalWrapper}>
          <Animated.View 
            style={[
              styles.modalOverlay,
              { opacity: tradeDrawerOpacityAnim }
            ]}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeTradeDrawer}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.tradeDrawerContainer, 
              { 
                backgroundColor: theme.colors.card,
                transform: [{ translateY: tradeDrawerSlideAnim }],
              }
            ]}
          >
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tradeDrawerContent}>
              {/* Drawer Handle */}
              <View style={styles.drawerHandle} />

              {/* Header */}
              <View style={styles.tradeDrawerHeader}>
                <Text variant="title" weight="bold" color="text">
                  {selectedAssetForTrade?.symbol}
                </Text>
                <TouchableOpacity
                  onPress={closeTradeDrawer}
                  style={styles.tradeDrawerCloseButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={styles.tradeDrawerScrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >

              {/* Exchange and Price Info */}
              <View style={styles.tradePriceInfoSection}>
                <View style={styles.exchangeRow}>
                  <Text variant="subtitle" weight="semibold" color="text">
                    {assetTypeForTrade === 'stock' ? 'NSE' : assetTypeForTrade?.toUpperCase()}
                  </Text>
                  <View style={styles.bidAskRow}>
                    <Text variant="caption" color="success">
                      B: {assetTypeForTrade === 'stock' 
                        ? (selectedAssetForTrade?.price || 0).toFixed(2)
                        : assetTypeForTrade === 'forex'
                        ? (selectedAssetForTrade?.price || 0).toFixed(4)
                        : (selectedAssetForTrade?.price || 0).toFixed(2)
                      }
                    </Text>
                    <Text variant="caption" color="error">
                      A: {assetTypeForTrade === 'stock' 
                        ? (selectedAssetForTrade?.price || 0).toFixed(2)
                        : assetTypeForTrade === 'forex'
                        ? (selectedAssetForTrade?.price || 0).toFixed(4)
                        : (selectedAssetForTrade?.price || 0).toFixed(2)
                      }
                    </Text>
                  </View>
                </View>

                {/* OHLC Data */}
                <View style={styles.ohlcSection}>
                  <View style={styles.ohlcRow}>
                    <View style={styles.ohlcItem}>
                      <Text variant="caption" color="textSecondary">Open</Text>
                      <Text variant="caption" color="text">
                        {assetTypeForTrade === 'stock' && selectedAssetForTrade?.open
                          ? selectedAssetForTrade.open.toFixed(2)
                          : (selectedAssetForTrade?.price || 0).toFixed(assetTypeForTrade === 'forex' ? 4 : 2)
                        }
                      </Text>
                    </View>
                    <View style={styles.ohlcItem}>
                      <Text variant="caption" color="textSecondary">High</Text>
                      <Text variant="caption" color="text">
                        {assetTypeForTrade === 'stock' && selectedAssetForTrade?.high
                          ? selectedAssetForTrade.high.toFixed(2)
                          : ((selectedAssetForTrade?.price || 0) * 1.02).toFixed(assetTypeForTrade === 'forex' ? 4 : 2)
                        }
                      </Text>
                    </View>
                    <View style={styles.ohlcItem}>
                      <Text variant="caption" color="textSecondary">Low</Text>
                      <Text variant="caption" color="text">
                        {assetTypeForTrade === 'stock' && selectedAssetForTrade?.low
                          ? selectedAssetForTrade.low.toFixed(2)
                          : ((selectedAssetForTrade?.price || 0) * 0.98).toFixed(assetTypeForTrade === 'forex' ? 4 : 2)
                        }
                      </Text>
                    </View>
                    <View style={styles.ohlcItem}>
                      <Text variant="caption" color="textSecondary">Close</Text>
                      <Text variant="caption" color="text">
                        {(selectedAssetForTrade?.price || 0).toFixed(assetTypeForTrade === 'forex' ? 4 : 2)}
                      </Text>
                    </View>
                    <View style={styles.ohlcItem}>
                      <Text variant="caption" color="textSecondary">LTP</Text>
                      <Text variant="caption" color="text">
                        {(selectedAssetForTrade?.price || 0).toFixed(assetTypeForTrade === 'forex' ? 4 : 2)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Position Type Toggle */}
              <View style={styles.positionTypeSection}>
                <View style={styles.positionTypeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      {
                        backgroundColor: positionType === 'mis' ? 'transparent' : 'transparent',
                        borderColor: theme.colors.border,
                      }
                    ]}
                    onPress={() => setPositionType('mis')}
                  >
                    <Text 
                      variant="caption" 
                      weight="medium"
                      color={positionType === 'mis' ? 'text' : 'textSecondary'}
                    >
                      MIS
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.positionTypeButton,
                      {
                        backgroundColor: positionType === 'nrml' ? theme.colors.primary : 'transparent',
                        borderColor: positionType === 'nrml' ? theme.colors.primary : theme.colors.border,
                      }
                    ]}
                    onPress={() => setPositionType('nrml')}
                  >
                    <Text 
                      variant="caption" 
                      weight="medium"
                      style={{ 
                        color: positionType === 'nrml' ? 'white' : theme.colors.textSecondary 
                      }}
                    >
                      NRML
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Unit and Quantity */}
              <View style={styles.unitQuantitySection}>
                <View style={styles.unitSection}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Unit</Text>
                  <View style={styles.unitDropdown}>
                    <Text variant="body" color="text">Lot</Text>
                    <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                  </View>
                </View>
                
                <View style={styles.quantitySection}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>
                    Lot (Lot Size: 1)
                  </Text>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={[styles.quantityButton, { borderColor: theme.colors.border }]} 
                      onPress={decreaseQuantity}
                    >
                      <Text variant="body" color="text">-</Text>
                    </TouchableOpacity>
                    <Text variant="body" weight="semibold" color="text" style={styles.quantityValue}>
                      {tradeQuantity}
                    </Text>
                    <TouchableOpacity 
                      style={[styles.quantityButton, { borderColor: theme.colors.border }]} 
                      onPress={increaseQuantity}
                    >
                      <Text variant="body" color="text">+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Order Type */}
              <View style={styles.orderTypeSection}>
                <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Order Type</Text>
                <View style={styles.orderTypeButtons}>
                  {['market', 'limit', 'sl', 'sl-m'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.orderTypeButton,
                        {
                          backgroundColor: orderType === type ? theme.colors.textSecondary : 'transparent',
                          borderColor: theme.colors.border,
                        }
                      ]}
                      onPress={() => handleOrderTypeChange(type as any)}
                    >
                      <Text 
                        variant="caption" 
                        weight="medium"
                        style={{ 
                          color: orderType === type ? 'white' : theme.colors.text 
                        }}
                      >
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Target and Stop Loss */}
              <View style={styles.targetStopSection}>
                <View style={styles.targetSection}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Target (Abs)</Text>
                  <View style={styles.inputWithArrows}>
                    <TextInput
                      style={[styles.priceInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                      value={targetPrice}
                      onChangeText={setTargetPrice}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={theme.colors.textSecondary}
                    />
                    <View style={styles.inputArrows}>
                      <TouchableOpacity onPress={() => setTargetPrice((parseFloat(targetPrice) + 1).toString())}>
                        <Ionicons name="chevron-up" size={12} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setTargetPrice(Math.max(0, parseFloat(targetPrice) - 1).toString())}>
                        <Ionicons name="chevron-down" size={12} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                
                <View style={styles.stopLossSection}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Stop Loss (Abs)</Text>
                  <TextInput
                    style={[styles.priceInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={stopLossPrice}
                    onChangeText={setStopLossPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>

              {/* Price and Trigger Price */}
              <View style={styles.priceSection}>
                <View style={styles.priceField}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Price</Text>
                  <TextInput
                    style={[
                      styles.priceInput, 
                      { 
                        color: orderType === 'market' ? theme.colors.textSecondary : theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: orderType === 'market' ? theme.colors.surface : 'transparent'
                      }
                    ]}
                    value={limitPrice}
                    onChangeText={setLimitPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    editable={orderType !== 'market'}
                  />
                </View>
                
                <View style={styles.triggerPriceField}>
                  <Text variant="body" color="textSecondary" style={styles.sectionLabel}>Trigger Price</Text>
                  <TextInput
                    style={[
                      styles.priceInput, 
                      { 
                        color: orderType === 'market' || orderType === 'limit' ? theme.colors.textSecondary : theme.colors.text,
                        borderColor: theme.colors.border,
                        backgroundColor: orderType === 'market' || orderType === 'limit' ? theme.colors.surface : 'transparent'
                      }
                    ]}
                    value={triggerPrice}
                    onChangeText={setTriggerPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.textSecondary}
                    editable={orderType === 'sl' || orderType === 'sl-m'}
                  />
                </View>
              </View>

              {/* Financial Summary */}
              <View style={styles.financialSummary}>
                <View style={styles.financialRow}>
                  <Text variant="body" weight="semibold" color="text">Required</Text>
                  <Text variant="body" weight="semibold" color="error">
                    {assetTypeForTrade === 'stock' 
                      ? formatIndianCurrency(getRequiredAmount())
                      : getRequiredAmount().toFixed(assetTypeForTrade === 'forex' ? 4 : 2)
                    }
                  </Text>
                </View>
                <View style={styles.financialRow}>
                  <Text variant="body" weight="semibold" color="text">Available</Text>
                  <Text variant="body" weight="semibold" color="success">
                    {assetTypeForTrade === 'stock' 
                      ? formatIndianCurrency(availableBalance)
                      : availableBalance.toFixed(2)
                    }
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.tradeActionButtons}>
                <TouchableOpacity
                  style={[
                    styles.tradeSubmitButton,
                    {
                      backgroundColor: tradeAction === 'buy' ? theme.colors.primary : theme.colors.error,
                    }
                  ]}
                  onPress={handleTradeSubmit}
                >
                  <Text variant="body" weight="bold" style={{ color: 'white' }} numberOfLines={1}>
                    Tap to {tradeAction === 'buy' ? 'Buy' : 'Sell'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tradeDeleteButton,
                    {
                      borderColor: theme.colors.error,
                    }
                  ]}
                  onPress={handleDeleteAsset}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              </ScrollView>
            </View>
            </ScrollView>
            </Animated.View>
        </View>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteConfirmVisible}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.deleteConfirmOverlay}>
          <View style={[styles.deleteConfirmContainer, { backgroundColor: theme.colors.card }]}>
            <Ionicons name="warning" size={48} color={theme.colors.error} style={styles.deleteWarningIcon} />
            
            <Text variant="title" weight="bold" color="text" style={styles.deleteConfirmTitle}>
              Delete from Watchlist
            </Text>
            
            <Text variant="body" color="textSecondary" style={styles.deleteConfirmMessage}>
              Are you sure you want to remove {selectedAssetForTrade?.symbol} from your watchlist?
            </Text>

            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.deleteConfirmCancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text variant="body" weight="semibold" color="text">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmDeleteButton, { backgroundColor: theme.colors.error }]}
                onPress={confirmDeleteAsset}
              >
                <Text variant="body" weight="bold" style={{ color: 'white' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Watchlist Delete Confirmation */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={watchlistDeleteConfirmVisible}
        onRequestClose={cancelDeleteFromWatchlist}
        statusBarTranslucent
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={24} color={theme.colors.error} />
              <Text variant="title" weight="bold" color="text" style={{ marginLeft: 12 }}>
                Remove from Watchlist
              </Text>
            </View>
            
            <Text variant="body" color="textSecondary" style={styles.deleteModalText}>
              Are you sure you want to remove {itemToDelete?.symbol} from your watchlist?
            </Text>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={cancelDeleteFromWatchlist}
              >
                <Text variant="body" weight="semibold" color="textSecondary">
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton, { backgroundColor: theme.colors.error }]}
                onPress={confirmDeleteFromWatchlist}
              >
                <Text variant="body" weight="semibold" style={{ color: theme.colors.surface }}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backdropFilter: 'blur(10px)', // Web only
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 200 : 220, // Space for fixed header + toggle + margins
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionsExpanded: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  searchContainer: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  noResultsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  noResultsIcon: {
    marginBottom: 12,
    opacity: 0.5,
  },
  noResultsText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  toggleSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 16,
    marginHorizontal: 16,
  },
  toggleLabel: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 15,
  },
  toggleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  toggle: {
    marginHorizontal: 'auto',
  },
  sectionTitle: {
    marginBottom: 12,
  },
  indicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  indicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  indexCard: {
    width: 140, // Fixed width instead of minWidth
    minHeight: 80, // Ensure consistent height
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabel: {
    textAlign: 'center',
    marginBottom: 8,
  },
  indexValue: {
    textAlign: 'center',
    fontSize: 16,
  },
  stocksContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  stockItem: {
    marginBottom: 12,
  },
  expandedDetails: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  expandedCard: {
    marginTop: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  stockDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    marginBottom: 8,
  },
  chartPlaceholder: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  sellButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  exchangeFilterContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  exchangeScrollContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  exchangeToggle: {
    marginHorizontal: 'auto',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  // Search Modal Wrapper
  searchModalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
  },
  modalContentWrapper: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    minHeight: 56,
  },
  modalSearchContent: {
    paddingTop: 20,
    paddingBottom: 40,
    flex: 1,
  },
  modalSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    marginHorizontal: 20,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSearchInputIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 18,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  modalExchangeFilterContainer: {
    marginBottom: 16,
  },
  modalExchangeFilterLabel: {
    marginBottom: 8,
  },
  modalExchangeFilterToggle: {
    marginHorizontal: 'auto',
  },
  modalSearchResultsContainer: {
    maxHeight: 300,
  },
  modalSearchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  modalSearchResultInfo: {
    flex: 1,
  },
  modalSearchResultPriceContainer: {
    alignItems: 'flex-end',
  },
  modalSearchResultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalSearchResultChange: {
    marginTop: 4,
    fontSize: 14,
  },
  modalNoResultsText: {
    textAlign: 'center',
    color: '#666666',
    paddingVertical: 20,
  },
  // Search Modal styles
  searchModalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    minHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    borderTopWidth: 1,
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchModalHeaderLeft: {
    flex: 1,
  },
  searchModalSubtitle: {
    marginTop: 4,
  },
  searchInputContainerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    borderWidth: 1,
  },
  searchInputModal: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    fontWeight: '400',
  },
  searchClearButton: {
    padding: 4,
  },
  searchModalCloseButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  exchangeFilterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    maxHeight: 50,
  },
  exchangeFilterContent: {
    gap: 8,
    alignItems: 'center',
  },
  exchangeFilterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 45,
    alignItems: 'center',
  },
  searchResultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  searchResultExchange: {
    fontSize: 12,
    opacity: 0.7,
  },
  searchResultExchangeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  searchResultRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  addToWatchlistButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 16,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  addedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  // Trading Drawer Styles
  tradeDrawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  tradeDrawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  tradeDrawerScrollContent: {
    flex: 1,
    paddingBottom: 20,
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  tradeDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  tradeDrawerHeaderLeft: {
    flex: 1,
  },
  tradeDrawerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tradePriceSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  tradePriceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  tradeTypeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeDetailsSection: {
    marginBottom: 32,
    gap: 20,
  },
  tradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quantityValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 18,
  },
  tradeActionButtons: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
    paddingHorizontal: 0,
  },
  tradeSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 56,
  },
  tradeDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  // New Trading Drawer Styles
  tradePriceInfoSection: {
    marginBottom: 20,
  },
  exchangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bidAskRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ohlcSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  ohlcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ohlcItem: {
    alignItems: 'center',
    flex: 1,
  },
  positionTypeSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  positionTypeToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  positionTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitQuantitySection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  unitSection: {
    flex: 1,
  },
  unitDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  quantitySection: {
    flex: 1,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  orderTypeSection: {
    marginBottom: 20,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetStopSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  targetSection: {
    flex: 1,
  },
  stopLossSection: {
    flex: 1,
  },
  inputWithArrows: {
    position: 'relative',
  },
  inputArrows: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -12 }],
    gap: 2,
  },
  priceInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    marginTop: 4,
  },
  priceSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  priceField: {
    flex: 1,
  },
  triggerPriceField: {
    flex: 1,
  },
  financialSummary: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // Delete Confirmation Styles
  deleteConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteConfirmContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 15,
  },
  deleteWarningIcon: {
    marginBottom: 16,
  },
  deleteConfirmTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteConfirmMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deleteConfirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalText: {
    marginBottom: 24,
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    // backgroundColor will be set dynamically
  },
});
