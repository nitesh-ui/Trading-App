import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
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

interface EditTradeTargetPageProps {
  visible: boolean;
  onClose: () => void;
  trade: {
    id: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    activeTradeID: number;
    currentTarget?: string;
    currentStopLoss?: string;
  };
  onSave: () => void;
}

const EditTradeTargetPage: React.FC<EditTradeTargetPageProps> = ({ 
  visible, 
  onClose, 
  trade,
  onSave
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [targetPrice, setTargetPrice] = useState(trade.currentTarget || '');
  const [stopLossPrice, setStopLossPrice] = useState(trade.currentStopLoss || '');
  const [isSaving, setIsSaving] = useState(false);

  const validateInputs = (): { isValid: boolean; errorMessage: string } => {
    const target = parseFloat(targetPrice) || 0;
    const stopLoss = parseFloat(stopLossPrice) || 0;
    const entryPrice = trade.price;

    // At least one field should be filled
    if (target === 0 && stopLoss === 0) {
      return { isValid: false, errorMessage: 'Please enter at least Target or Stop Loss' };
    }

    // For BUY positions
    if (trade.type === 'BUY') {
      // Target should be greater than entry price
      if (target > 0 && target <= entryPrice) {
        return { isValid: false, errorMessage: 'Target price must be greater than entry price' };
      }
      // Stop loss should be less than entry price
      if (stopLoss > 0 && stopLoss >= entryPrice) {
        return { isValid: false, errorMessage: 'Stop loss must be lower than entry price' };
      }
    }
    
    // For SELL positions
    if (trade.type === 'SELL') {
      // Target should be less than entry price
      if (target > 0 && target >= entryPrice) {
        return { isValid: false, errorMessage: 'Target price must be lower than entry price' };
      }
      // Stop loss should be greater than entry price
      if (stopLoss > 0 && stopLoss <= entryPrice) {
        return { isValid: false, errorMessage: 'Stop loss must be greater than entry price' };
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
      // Call API to update target and stop loss
      const response = await tradingApiService.updateTradeTargetStopLoss(
        trade.activeTradeID,
        targetPrice || '0',
        stopLossPrice || '0'
      );

      if (response.success) {
        showNotification({
          type: 'success',
          title: 'Target/Stop Loss Updated',
          message: 'Successfully updated target and stop loss for this trade'
        });
        onSave();
        onClose();
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: response.message || 'Failed to update target and stop loss'
        });
      }
    } catch (error) {
      console.error('❌ Error updating target/stop loss:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'An error occurred while updating target and stop loss'
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
            <Text variant="body" color="textSecondary">Entry Price</Text>
            <Text variant="body" weight="semibold" color="text">₹{trade.price.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Target and Stop Loss Inputs */}
        <Card padding="medium" style={styles.inputCard}>
          <Text variant="title" weight="bold" color="text" style={styles.sectionTitle}>
            Set Target & Stop Loss
          </Text>
          
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
                Target should be greater than ₹{trade.price.toFixed(2)}
              </Text>
            )}
            {trade.type === 'SELL' && (
              <Text variant="caption" color="textSecondary" style={styles.hint}>
                Target should be lower than ₹{trade.price.toFixed(2)}
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
                Stop loss should be lower than ₹{trade.price.toFixed(2)}
              </Text>
            )}
            {trade.type === 'SELL' && (
              <Text variant="caption" color="textSecondary" style={styles.hint}>
                Stop loss should be greater than ₹{trade.price.toFixed(2)}
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

export default EditTradeTargetPage;
