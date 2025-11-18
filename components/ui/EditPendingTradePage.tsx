/**
 * Edit Pending Trade Page Component
 * Modal for editing pending trade order price, target, and stop loss
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Card, Text } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { tradingApiService } from '../../services/tradingApiService';
import { watchlistApiService } from '../../services/watchlistApiService';
import type { AssetItem } from '../watchlist/types';

interface EditPendingTradePageProps {
  visible: boolean;
  onClose: () => void;
  trade: {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    activeTradeID: number;
    currentOrderPrice?: string;
    currentTarget?: string;
    currentStopLoss?: string;
    // Additional fields for proceedBuySell API
    productType?: string;
    priceType?: string;
    triggerPrice?: string;
    tradinG_UNIT?: number;
    apiStatus?: string;
    intWID?: number;
    scriptCode?: number;
  };
  onSave: () => void;
}

const EditPendingTradePage: React.FC<EditPendingTradePageProps> = ({

  visible, 
  onClose, 
  trade,
  onSave 
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [orderPrice, setOrderPrice] = useState(
    trade.currentOrderPrice ? trade.currentOrderPrice : trade.price.toString()
  );
  const [targetPrice, setTargetPrice] = useState(trade.currentTarget || '');
  const [stopLossPrice, setStopLossPrice] = useState(trade.currentStopLoss || '');
  const [isSaving, setIsSaving] = useState(false);
  const [matchedAsset, setMatchedAsset] = useState<AssetItem | null>(null);
  const [isLoadingAsset, setIsLoadingAsset] = useState(false);

  // Fetch fresh watchlist data and find matching asset when modal opens
  useEffect(() => {
    const fetchAndMatchAsset = async () => {
      if (visible && trade.symbol) {
        setIsLoadingAsset(true);
        try {
          console.log('🔍 [EditPendingTrade] Fetching fresh watchlist data for:', trade.symbol);
          
          // Fetch fresh watchlist data from API
          const assets = await watchlistApiService.fetchWatchlistData();
          console.log('📊 [EditPendingTrade] Fetched assets count:', assets.length);
          
          // Find exact match - try both symbol and name
          const found = assets.find((asset: AssetItem) => 
            asset.symbol?.toUpperCase() === trade.symbol.toUpperCase() ||
            asset.name?.toUpperCase() === trade.symbol.toUpperCase()
          );

          if (found) {
            console.log('✅ [EditPendingTrade] Found matching asset:', {
              symbol: found.symbol,
              name: found.name,
              scriptCode: found.scriptCode,
              intWID: found.intWID,
              wid: found.wid
            });
            setMatchedAsset(found);
          } else {
            console.warn('⚠️ [EditPendingTrade] No matching asset found for:', trade.symbol);
            console.log('📋 [EditPendingTrade] Available symbols:', assets.slice(0, 10).map((a: AssetItem) => ({
              symbol: a.symbol,
              name: a.name
            })));
            setMatchedAsset(null);
          }
        } catch (error) {
          console.error('❌ [EditPendingTrade] Error fetching watchlist data:', error);
          setMatchedAsset(null);
        } finally {
          setIsLoadingAsset(false);
        }
      }
    };

    fetchAndMatchAsset();
  }, [visible, trade.symbol]);

  const validateInputs = (): { isValid: boolean; errorMessage: string } => {
    const orderPriceNum = parseFloat(orderPrice) || 0;
    const target = parseFloat(targetPrice) || 0;
    const stopLoss = parseFloat(stopLossPrice) || 0;

    // Order price is required
    if (orderPriceNum <= 0) {
      return { isValid: false, errorMessage: 'Please enter a valid order price' };
    }

    // For BUY positions
    if (trade.type === 'BUY') {
      // Target should be greater than order price
      if (target > 0 && target <= orderPriceNum) {
        return { isValid: false, errorMessage: 'Target price must be greater than order price' };
      }
      // Stop loss should be less than order price
      if (stopLoss > 0 && stopLoss >= orderPriceNum) {
        return { isValid: false, errorMessage: 'Stop loss must be lower than order price' };
      }
    }
    
    // For SELL positions
    if (trade.type === 'SELL') {
      // Target should be less than order price
      if (target > 0 && target >= orderPriceNum) {
        return { isValid: false, errorMessage: 'Target price must be lower than order price' };
      }
      // Stop loss should be greater than order price
      if (stopLoss > 0 && stopLoss <= orderPriceNum) {
        return { isValid: false, errorMessage: 'Stop loss must be greater than order price' };
      }
    }

    return { isValid: true, errorMessage: '' };
  };

  const handleSave = async () => {
    // Validate inputs
    const validation = validateInputs();
    if (!validation.isValid) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: validation.errorMessage
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Use intWID and scriptCode from matched watchlist asset, with fallback to trade props
      const intWID = matchedAsset?.intWID || trade.intWID || 0;
      const scriptCode = matchedAsset?.scriptCode || trade.scriptCode || 0;

      console.log('💾 [EditPendingTrade] Saving with IDs:', {
        intWID,
        scriptCode,
        fromWatchlist: !!matchedAsset,
        symbol: trade.symbol
      });

      // Warn if IDs are still zero
      if (intWID === 0 || scriptCode === 0) {
        console.warn('⚠️ [EditPendingTrade] Missing IDs! intWID:', intWID, 'scriptCode:', scriptCode);
      }

      // Call proceedBuySell API to update pending trade with new order price, target and stop loss
      const response = await tradingApiService.proceedBuySell({
        intWID,
        scriptCode,
        currentPosition: trade.type,
        quantity: trade.quantity.toString(),
        price: orderPrice, // Use the updated order price
        triggerPrice: trade.triggerPrice || '0',
        productType: trade.productType || 'INTRADAY',
        marketType: trade.priceType || 'LIMIT',
        tradeID: trade.activeTradeID.toString(),
        status: trade.apiStatus || 'OPEN',
        target: targetPrice || '0',
        stopLoss: stopLossPrice || '0',
        tradinG_UNIT: trade.tradinG_UNIT || 0
      });

      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Pending Trade Updated',
          message: 'Successfully updated order price, target and stop loss for this trade'
        });
        onSave();
        onClose();
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: response.message || 'Failed to update pending trade'
        });
      }
    } catch (error) {
      console.error('❌ Error updating pending trade:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating the pending trade'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title={`Edit ${trade.symbol}`}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.container}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Trade Info Card */}
          <Card padding="medium" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text variant="body" color="textSecondary">Symbol</Text>
              <Text variant="body" weight="semibold" color="text">{trade.symbol}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="body" color="textSecondary">Type</Text>
              <View style={[styles.typeBadge, { 
                backgroundColor: trade.type === 'BUY' ? theme.colors.success : theme.colors.error 
              }]}>
                <Text variant="caption" style={{ color: theme.colors.surface }}>
                  {trade.type}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text variant="body" color="textSecondary">Quantity</Text>
              <Text variant="body" weight="semibold" color="text">{trade.quantity}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="body" color="textSecondary">Current Price</Text>
              <Text variant="body" weight="semibold" color="text">₹{trade.price.toFixed(2)}</Text>
            </View>
          </Card>

          {/* Order Price, Target and Stop Loss Inputs */}
          <Card padding="medium" style={styles.inputCard}>
            <Text variant="title" weight="bold" color="text" style={styles.sectionTitle}>
              Set Order Details
            </Text>
            
            {/* Order Price Input */}
            <View style={styles.inputGroup}>
              <Text variant="body" color="text" style={styles.inputLabel}>
                Order Price (Abs) *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={orderPrice}
                onChangeText={setOrderPrice}
                placeholder="Enter order price"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
              <Text variant="caption" color="textSecondary" style={styles.hint}>
                Price at which the order will be executed
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text variant="body" color="text" style={styles.inputLabel}>
                Target Price (Abs)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="Enter target price"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
              {trade.type === 'BUY' && (
                <Text variant="caption" color="textSecondary" style={styles.hint}>
                  Target should be greater than order price
                </Text>
              )}
              {trade.type === 'SELL' && (
                <Text variant="caption" color="textSecondary" style={styles.hint}>
                  Target should be lower than order price
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text variant="body" color="text" style={styles.inputLabel}>
                Stop Loss (Abs)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={stopLossPrice}
                onChangeText={setStopLossPrice}
                placeholder="Enter stop loss"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
              />
              {trade.type === 'BUY' && (
                <Text variant="caption" color="textSecondary" style={styles.hint}>
                  Stop loss should be lower than order price
                </Text>
              )}
              {trade.type === 'SELL' && (
                <Text variant="caption" color="textSecondary" style={styles.hint}>
                  Stop loss should be greater than order price
                </Text>
              )}
            </View>
          </Card>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { 
              backgroundColor: theme.colors.primary,
              opacity: isSaving ? 0.7 : 1
            }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text variant="body" weight="semibold" style={{ color: theme.colors.surface }}>
              {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SlidingPage>
  );
};

export default EditPendingTradePage;

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120, // Increased padding to prevent button from being cut off
  },
  infoCard: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inputCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    marginTop: 4,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
