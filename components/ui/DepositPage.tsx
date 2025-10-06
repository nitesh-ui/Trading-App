import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { Card, Text, Button, Input } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

interface DepositPageProps {
  visible: boolean;
  onClose: () => void;
}

const DepositPage: React.FC<DepositPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChooseFile = useCallback(() => {
    // For now, show a placeholder message
    // In a real app, you would use a file picker library like expo-document-picker
    Alert.alert(
      'File Upload',
      'Transaction screenshot upload functionality will be available soon',
      [{ text: 'OK' }]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validate form
    if (!amount.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter an amount'
      });
      return;
    }

    if (!phoneNumber.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your phone number'
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid amount'
      });
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid 10-digit phone number'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // TODO: Implement actual deposit API call
      // const response = await tradingApiService.submitDeposit({
      //   amount: numericAmount,
      //   phoneNumber: phoneNumber.replace(/\s+/g, ''),
      //   screenshot: screenshot
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      showNotification({
        type: 'success',
        title: 'Deposit Request Submitted',
        message: `Your deposit request for ₹${numericAmount.toLocaleString('en-IN')} has been submitted successfully. It will be processed within 24 hours.`
      });

      // Reset form and close
      setAmount('');
      setPhoneNumber('');
      setScreenshot(null);
      onClose();

    } catch (error: any) {
      console.error('Error submitting deposit:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit deposit request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, phoneNumber, screenshot, showNotification, onClose]);

  const handleClose = useCallback(() => {
    setAmount('');
    setPhoneNumber('');
    setScreenshot(null);
    onClose();
  }, [onClose]);

  const formatAmount = useCallback((value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return numericValue;
  }, []);

  const formatPhoneNumber = useCallback((value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (numericValue.length <= 10) {
      return numericValue;
    }
    
    return numericValue.slice(0, 10);
  }, []);

  return (
    <SlidingPage
      visible={visible}
      onClose={handleClose}
      title="Add Balance"
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Deposit Form */}
        <Card padding="large" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text variant="body" color="text" style={styles.label}>
                Amount
              </Text>
              <Input
                value={amount}
                onChangeText={(value) => setAmount(formatAmount(value))}
                placeholder="Amount"
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Text variant="body" color="text" style={styles.label}>
                Phone Number
              </Text>
              <Input
                value={phoneNumber}
                onChangeText={(value) => setPhoneNumber(formatPhoneNumber(value))}
                placeholder="Phone"
                keyboardType="phone-pad"
                style={styles.input}
                maxLength={10}
              />
            </View>
          </View>

          <View style={styles.fullWidth}>
            <Text variant="body" color="text" style={styles.label}>
              Transaction Screenshot
            </Text>
            <TouchableOpacity 
              style={[styles.fileUploadContainer, { 
                backgroundColor: theme.colors.surface, 
                borderColor: theme.colors.border 
              }]}
              onPress={handleChooseFile}
            >
              <View style={styles.fileUploadContent}>
                <View style={[styles.chooseFileButton, { 
                  backgroundColor: theme.colors.background, 
                  borderColor: theme.colors.border 
                }]}>
                  <Text variant="body" color="text">
                    Choose file
                  </Text>
                </View>
                <Text variant="body" color="textSecondary" style={styles.fileName}>
                  {screenshot || 'No file chosen'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Instructions */}
        <Card padding="large" style={styles.card}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
            <Text variant="subtitle" weight="semibold" color="primary" style={styles.instructionsTitle}>
              Deposit Instructions
            </Text>
          </View>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>1</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Transfer the amount to our account using any UPI app
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>2</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Take a screenshot of the successful transaction
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>3</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Fill this form with amount, phone number, and upload screenshot
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>4</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Your balance will be updated within 24 hours
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Close"
            onPress={handleClose}
            variant="secondary"
            style={styles.actionButton}
          />
          <Button
            title="Add Balance"
            onPress={handleSubmit}
            variant="primary"
            style={styles.actionButton}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  
  // Card Styles
  card: {
    marginBottom: 8,
  },
  
  // Layout Styles
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    marginBottom: 16,
  },
  
  // Input Styles
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
  },
  
  // File Upload Styles
  fileUploadContainer: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fileUploadContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chooseFileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  fileName: {
    flex: 1,
  },
  
  // Instructions Styles
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    flex: 1,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
    lineHeight: 20,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
  },
});

export default DepositPage;
