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
import { Card, Text, Button } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AssetItem, MarketType, TradeState } from '../watchlist/types';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { tradingApiService, ProceedBuySellRequest } from '../../services/tradingApiService';

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
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'SL' | 'SL-M'>('MARKET');
  const [unitType, setUnitType] = useState<'Lot' | 'Share'>('Lot');
  const [productType, setProductType] = useState<'MIS' | 'NRML'>('NRML');
  const [targetPrice, setTargetPrice] = useState('0');
  const [stopLossPrice, setStopLossPrice] = useState('0');
  const [limitPrice, setLimitPrice] = useState('0');
  const [triggerPrice, setTriggerPrice] = useState('0');
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);

  const formatPrice = (price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    return `$${price.toFixed(2)}`;
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
    marketCap: asset.marketCap
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
    const price = orderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || asset.price;
    return quantity * price;
  };

  const getAvailableFormatted = () => {
    return `₹${(availableBalance / 100000).toFixed(1)}L`;
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleExecuteTrade = async () => {
    // Prevent multiple simultaneous executions
    if (isExecutingTrade) return;
    
    setIsExecutingTrade(true);
    
    try {
      // Prepare the API request data
      const apiRequest: ProceedBuySellRequest = {
        intWID: 0, // Default value as per API
        scriptCode: 0, // Default value as per API
        currentPosition: action, // 'buy' or 'sell'
        quantity: quantity.toString(),
        price: (orderType === 'MARKET' ? asset.price : parseFloat(limitPrice) || asset.price).toString(),
        triggerPrice: triggerPrice || '0',
        productType: productType, // 'MIS' or 'NRML'
        marketType: orderType, // 'MARKET', 'LIMIT', 'SL', 'SL-M'
        tradeID: '', // Default empty string
        status: '', // Default empty string
        target: targetPrice || '0',
        stopLoss: stopLossPrice || '0',
        tradinG_UNIT: 0 // Default value as per API
      };

      console.log('🔄 Executing trade with API:', apiRequest);
      console.log('📊 Asset data for trade:', {
        symbol: asset.symbol,
        name: asset.name,
        price: asset.price,
        exchange: asset.exchange
      });

      // Call the real trading API
      const response = await tradingApiService.proceedBuySell(apiRequest);

      if (response.success) {
        // Success - show success notification and close
        showNotification({
          type: 'success',
          title: `${action.toUpperCase()} order placed successfully`,
          message: `${quantity} ${asset.symbol} order has been executed`
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
        showNotification({
          type: 'error',
          title: 'Trade Failed',
          message: response.message || response.error || 'Failed to execute trade. Please try again.'
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

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title={`${action.toUpperCase()} ${asset.name || asset.symbol}`}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Asset Header with Bid/Ask - No border, clean design */}
        <View style={styles.headerContainer}>
          <Text variant="headline" weight="bold" color="text">
            {asset.exchange || 'NSE'}
          </Text>
          <View style={styles.bidAskContainer}>
            <Text variant="caption" weight="medium" color="success" style={styles.bidAskText}>
              B: {formatPrice(bid)}
            </Text>
            <Text variant="caption" weight="medium" color="error" style={styles.askPriceText}>
              A: {formatPrice(ask)}
            </Text>
          </View>
        </View>

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
                  {formatPrice(asset.high - Math.abs(asset.change || 0) * 0.5)}
                </Text>
              </View>
            )}
            
            {/* High - only show if available from API */}
            {asset.high !== undefined && asset.high !== null && (
              <View style={styles.marketDataItem}>
                <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>High</Text>
                <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                  {formatPrice(asset.high)}
                </Text>
              </View>
            )}
            
            {/* Low - only show if available from API */}
            {asset.low !== undefined && asset.low !== null && (
              <View style={styles.marketDataItem}>
                <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>Low</Text>
                <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                  {formatPrice(asset.low)}
                </Text>
              </View>
            )}
            
            {/* Previous Close - calculated from current price and change */}
            <View style={styles.marketDataItem}>
              <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>Prev Close</Text>
              <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                {formatPrice(asset.price - (asset.change || 0))}
              </Text>
            </View>
            
            {/* LTP - always show current price */}
            <View style={styles.marketDataItem}>
              <Text variant="caption" color="textSecondary" style={styles.marketDataLabel}>LTP</Text>
              <Text variant="caption" weight="medium" color="text" style={styles.marketDataValue}>
                {formatPrice(asset.price)}
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
            <Text variant="body" color="text">Lot (Lot Size: 1)</Text>
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
                <Ionicons name="remove" size={18} color={theme.colors.text} />
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
                <Ionicons name="add" size={18} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Type and Price Inputs Section */}
        <Card padding="large" style={styles.orderCard}>
          {/* Order Type Selection */}
          <Text variant="body" color="text" style={styles.sectionTitle}>
            Order Type
          </Text>
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
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: 1 // Target is always enabled
                }]}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={true} // Target is always enabled
              />
            </View>
            
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Stop Loss (Abs)</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: 1 // Stop Loss is always enabled
                }]}
                value={stopLossPrice}
                onChangeText={setStopLossPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={true} // Stop Loss is always enabled
              />
            </View>
          </View>
          
          {/* Second Row: Price and Trigger Price */}
          <View style={styles.advancedRow}>
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Price</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: orderType === 'MARKET' ? 0.5 : 1 // Disabled for MARKET
                }]}
                value={limitPrice}
                onChangeText={setLimitPrice}
                placeholder="0"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                editable={orderType !== 'MARKET'} // Enabled for LIMIT, SL, SL-M
              />
            </View>
            
            <View style={styles.advancedItem}>
              <Text variant="body" color="text" style={styles.advancedLabel}>Trigger Price</Text>
              <TextInput
                style={[styles.advancedInput, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  opacity: (orderType === 'SL' || orderType === 'SL-M') ? 1 : 0.5 // Enabled only for SL and SL-M
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
        <Card padding="large" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text variant="body" weight="bold" color="text">
              Required
            </Text>
            <Text variant="body" weight="bold" color="error">
              {formatPrice(calculateRequiredAmount())}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="body" weight="bold" color="text">
              Available
            </Text>
            <Text variant="body" weight="bold" color="success">
              {getAvailableFormatted()}
            </Text>
          </View>
        </Card>

        {/* Execute Button */}
        <Button
          title={isExecutingTrade ? 'Executing...' : `Tap to ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          onPress={handleExecuteTrade}
          variant="primary"
          disabled={isExecutingTrade}
          style={{
            ...styles.executeButton,
            backgroundColor: action === 'buy' ? theme.colors.primary : theme.colors.error,
            opacity: isExecutingTrade ? 0.7 : 1
          }}
        />
      </ScrollView>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 2,
    paddingBottom: 80, // Extra space at bottom for execute button visibility
  },
  
  // Header Container - No border/background
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 0,
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
    gap: 16,
  },
  bidAskText: {
    fontSize: 12,
  },
  askPrice: {
    marginLeft: 8,
  },
  askPriceText: {
    fontSize: 12,
    marginLeft: 8,
  },
  
  // Market Data
  marketDataCard: {
    marginTop: 0,
    marginBottom: 8,
    borderWidth: 1,
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
    marginBottom: 8,
    flex: 1,
  },
  marketDataLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  marketDataValue: {
    fontSize: 12,
  },
  
  // Product Type
  productTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  productTypeRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  productTypeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  
  // Quantity
  quantitySection: {
    gap: 16,
    marginBottom: 16,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1.2,
    minWidth: 120,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flex: 1.8,
    minWidth: 160,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    minWidth: 60,
    alignItems: 'center',
  },
  
  // Order Type and Advanced Options Combined
  orderCard: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  orderTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  orderTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  
  // Advanced Options
  advancedRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  advancedGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  advancedItem: {
    flex: 1,
  },
  advancedLabel: {
    marginBottom: 4,
  },
  advancedInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    fontSize: 16,
  },
  
  // Summary
  summaryCard: {
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Execute Button
  executeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
});

export default TradePage;
