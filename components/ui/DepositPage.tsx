import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card, Text, Button, Input } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { sessionManager } from '../../services/sessionManager';

interface DepositPageProps {
  visible: boolean;
  onClose: () => void;
}

const DepositPage: React.FC<DepositPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [screenshot, setScreenshot] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountInfo, setAccountInfo] = useState('');

  const handleChooseFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*', // Allow all image types
        copyToCacheDirectory: true, // Important for iOS
        multiple: false
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      
      // Check file size (limit to 5MB)
      if (asset.size && asset.size > 5 * 1024 * 1024) {
        showNotification({
          type: 'error',
          title: 'File Too Large',
          message: 'Please select an image less than 5MB in size'
        });
        return;
      }

      setScreenshot({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType || 'image/jpeg'
      });
      
      console.log('📸 Screenshot selected:', {
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
        uri: asset.uri.substring(0, 50) + '...'
      });
    } catch (error) {
      console.error('❌ Error picking document:', error);
      showNotification({
        type: 'error',
        title: 'File Selection Failed',
        message: 'Failed to select file. Please try again.'
      });
    }
  }, [showNotification]);

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
      
      // Use FormData API which works on both web and React Native
      const formData = new FormData();
      
      // Add text fields
      formData.append('AccountInfo', accountInfo.trim() || 'No description provided');
      formData.append('RequestType', '1');
      formData.append('Amount', amount);
      formData.append('PhoneNumber', phoneNumber.replace(/\s+/g, ''));
      
      // If there's a screenshot, add it as a file
      if (screenshot) {
        // For React Native, we need to handle file upload differently
        // The FormData in React Native expects a specific object structure
        const fileToUpload: any = {
          uri: screenshot.uri,
          type: screenshot.mimeType || 'image/jpeg',
          name: screenshot.name || 'transaction_screenshot.jpg',
        };
        
        formData.append('_RequestImage', fileToUpload);
      }

      console.log('📤 Submitting deposit request:', {
        amount,
        phoneNumber: phoneNumber.replace(/\s+/g, ''),
        hasScreenshot: !!screenshot,
        accountInfo: accountInfo.trim() || 'No description provided'
      });

      const response = await fetch('https://prod-tradingapi.sanaitatechnologies.com/FundRequestApi/AddFundInformationHistory', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionManager.getToken() || '',
          // Don't set Content-Type header - let the browser/app set it automatically for multipart/form-data
        },
        body: formData
      });

      console.log('📡 Deposit API Response Status:', response.status);

      const result = await response.json();
      console.log('✅ Deposit API Response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit deposit request');
      }

      showNotification({
        type: 'success',
        title: 'Success',
        message: result.message || 'Request sent, check after sometime.'
      });

      // Reset form and close
      setAmount('');
      setPhoneNumber('');
      setScreenshot(null);
      onClose();
      setAccountInfo('');

    } catch (error: any) {
      console.error('❌ Error submitting deposit:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
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
    setAccountInfo('');
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
              Account Information
            </Text>
            <View style={[styles.textAreaContainer, { 
              backgroundColor: theme.colors.surface, 
              borderColor: theme.colors.border 
            }]}>
              <TextInput
                value={accountInfo}
                onChangeText={setAccountInfo}
                placeholder="Please enter some required information"
                multiline
                numberOfLines={6}
                style={[styles.textArea, { 
                  color: theme.colors.text,
                  fontSize: 16,
                }]}
                placeholderTextColor={theme.colors.textSecondary}
                textAlignVertical="top"
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
                  {screenshot ? screenshot.name : 'No file chosen'}
                </Text>
              </View>
              {screenshot && (
                <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface }]}>
                  <Image
                    source={{ uri: screenshot.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.error + '20' }]}
                    onPress={() => setScreenshot(null)}
                  >
                    <Text variant="caption" color="error">Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
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

  // Preview Styles
  previewContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  textAreaContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 120,
  },
  textArea: {
    flex: 1,
    textAlignVertical: 'top',
    lineHeight: 20,
    fontSize: 16,
  },
});

export default DepositPage;
