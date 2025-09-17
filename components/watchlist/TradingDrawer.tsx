import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { Card, Text, Toggle, ToggleOption } from '../atomic';
import { AssetItem, MarketType, TradeState } from './types';

interface TradingDrawerProps {
  visible: boolean;
  asset: AssetItem | null;
  marketType: MarketType;
  tradeState: TradeState;
  availableBalance: number;
  onClose: () => void;
  onTradeExecute: (tradeData: any) => void;
  onTradeStateChange: (updates: Partial<TradeState>) => void;
  theme: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.8;

const TradingDrawer = memo<TradingDrawerProps>(({
  visible,
  asset,
  marketType,
  tradeState,
  availableBalance,
  onClose,
  onTradeExecute,
  onTradeStateChange,
  theme,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  const [localQuantity, setLocalQuantity] = useState(tradeState.quantity.toString());
  const [localLimitPrice, setLocalLimitPrice] = useState(tradeState.limitPrice);
  const [localStopLoss, setLocalStopLoss] = useState(tradeState.stopLossPrice);
  const [localTarget, setLocalTarget] = useState(tradeState.targetPrice);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const formatPrice = useCallback((price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    if (marketType === 'crypto' && price > 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  }, [marketType]);

  const calculateOrderValue = useCallback(() => {
    if (!asset) return 0;
    const qty = parseInt(localQuantity) || 0;
    const price = tradeState.orderType === 'market' ? asset.price : parseFloat(localLimitPrice) || asset.price;
    return qty * price;
  }, [asset, localQuantity, localLimitPrice, tradeState.orderType]);

  const actionToggleOptions: ToggleOption[] = [
    { value: 'buy', label: 'BUY' },
    { value: 'sell', label: 'SELL' },
  ];

  const orderTypeOptions: ToggleOption[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'sl', label: 'SL' },
    { value: 'sl-m', label: 'SL-M' },
  ];

  const positionTypeOptions: ToggleOption[] = [
    { value: 'mis', label: 'MIS' },
    { value: 'nrml', label: 'NRML' },
  ];

  const handleExecuteTrade = useCallback(() => {
    const orderValue = calculateOrderValue();
    const tradeData = {
      asset,
      marketType,
      action: tradeState.action,
      quantity: parseInt(localQuantity),
      orderType: tradeState.orderType,
      positionType: tradeState.positionType,
      limitPrice: localLimitPrice,
      stopLossPrice: localStopLoss,
      targetPrice: localTarget,
      orderValue,
    };
    onTradeExecute(tradeData);
  }, [asset, marketType, tradeState, localQuantity, localLimitPrice, localStopLoss, localTarget, calculateOrderValue, onTradeExecute]);

  if (!asset) return null;

  const orderValue = calculateOrderValue();
  const changeColor = asset.change >= 0 ? theme.colors.success : theme.colors.error;
  const isInsufficientBalance = tradeState.action === 'buy' && orderValue > availableBalance;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background + 'CC', opacity: opacityAnim },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.colors.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <SafeAreaView style={styles.safeArea}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.symbolContainer}>
                      <Text variant="headline" weight="bold" color="text">
                        {asset.symbol}
                      </Text>
                      <Text variant="body" color="textSecondary">
                        {formatPrice(asset.price)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={onClose}
                      style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Action Toggle */}
                  <Card padding="medium" style={styles.section}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                      Action
                    </Text>
                    <Toggle
                      options={actionToggleOptions}
                      selectedValue={tradeState.action}
                      onValueChange={(value: string) => onTradeStateChange({ action: value as 'buy' | 'sell' })}
                    />
                  </Card>

                  {/* Quantity Input */}
                  <Card padding="medium" style={styles.section}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                      Quantity
                    </Text>
                    <View style={styles.inputRow}>
                      <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                        <TextInput
                          style={[styles.input, { color: theme.colors.text }]}
                          value={localQuantity}
                          onChangeText={(text) => {
                            setLocalQuantity(text);
                            onTradeStateChange({ quantity: parseInt(text) || 0 });
                          }}
                          placeholder="0"
                          placeholderTextColor={theme.colors.textSecondary}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={styles.quantityButtons}>
                        <TouchableOpacity
                          onPress={() => {
                            const newQty = Math.max(0, (parseInt(localQuantity) || 0) - 1);
                            setLocalQuantity(newQty.toString());
                            onTradeStateChange({ quantity: newQty });
                          }}
                          style={[styles.quantityButton, { backgroundColor: theme.colors.border }]}
                        >
                          <Ionicons name="remove" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const newQty = (parseInt(localQuantity) || 0) + 1;
                            setLocalQuantity(newQty.toString());
                            onTradeStateChange({ quantity: newQty });
                          }}
                          style={[styles.quantityButton, { backgroundColor: theme.colors.border }]}
                        >
                          <Ionicons name="add" size={16} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>

                  {/* Order Type */}
                  <Card padding="medium" style={styles.section}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                      Order Type
                    </Text>
                    <Toggle
                      options={orderTypeOptions}
                      selectedValue={tradeState.orderType}
                      onValueChange={(value: string) => onTradeStateChange({ orderType: value as any })}
                    />
                  </Card>

                  {/* Limit Price (if applicable) */}
                  {(tradeState.orderType === 'limit' || tradeState.orderType === 'sl') && (
                    <Card padding="medium" style={styles.section}>
                      <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                        {tradeState.orderType === 'limit' ? 'Limit Price' : 'Stop Loss Price'}
                      </Text>
                      <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                        <TextInput
                          style={[styles.input, { color: theme.colors.text }]}
                          value={localLimitPrice}
                          onChangeText={setLocalLimitPrice}
                          placeholder={formatPrice(asset.price)}
                          placeholderTextColor={theme.colors.textSecondary}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </Card>
                  )}

                  {/* Position Type */}
                  <Card padding="medium" style={styles.section}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                      Position Type
                    </Text>
                    <Toggle
                      options={positionTypeOptions}
                      selectedValue={tradeState.positionType}
                      onValueChange={(value: string) => onTradeStateChange({ positionType: value as 'mis' | 'nrml' })}
                    />
                  </Card>

                  {/* Order Summary */}
                  <Card padding="medium" style={styles.section}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.sectionTitle}>
                      Order Summary
                    </Text>
                    <View style={styles.summaryRow}>
                      <Text variant="body" color="textSecondary">Order Value</Text>
                      <Text variant="body" weight="medium" color="text">
                        {formatIndianCurrency(orderValue)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text variant="body" color="textSecondary">Available Balance</Text>
                      <Text variant="body" weight="medium" color="text">
                        {formatIndianCurrency(availableBalance)}
                      </Text>
                    </View>
                    {isInsufficientBalance && (
                      <Text variant="caption" color="error" style={styles.errorText}>
                        Insufficient balance for this order
                      </Text>
                    )}
                  </Card>
                </ScrollView>

                {/* Execute Button */}
                <View style={styles.executeSection}>
                  <TouchableOpacity
                    onPress={handleExecuteTrade}
                    disabled={isInsufficientBalance || !localQuantity || parseInt(localQuantity) === 0}
                    style={[
                      styles.executeButton,
                      {
                        backgroundColor: isInsufficientBalance || !localQuantity || parseInt(localQuantity) === 0
                          ? theme.colors.border
                          : tradeState.action === 'buy'
                          ? theme.colors.success
                          : theme.colors.error,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text variant="body" weight="bold" style={styles.executeButtonText}>
                      {tradeState.action.toUpperCase()} {asset.symbol}
                    </Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  safeArea: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  symbolContainer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    textAlign: 'right',
  },
  quantityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  executeSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  executeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  executeButtonText: {
    color: 'white',
  },
});

TradingDrawer.displayName = 'TradingDrawer';
export default TradingDrawer;
