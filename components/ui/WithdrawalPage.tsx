import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
  Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Card, Text, Button, Input } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { sessionManager } from '../../services/sessionManager';

interface WithdrawalPageProps {
  visible: boolean;
  onClose: () => void;
}

const WithdrawalPage: React.FC<WithdrawalPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountInfo, setAccountInfo] = useState('');
  const [qrCode, setQrCode] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChooseFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png'], // Allow only JPG and PNG
        copyToCacheDirectory: true // Important for iOS
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

      // Validate file type
      if (asset.mimeType && !['image/jpeg', 'image/png'].includes(asset.mimeType)) {
        showNotification({
          type: 'error',
          title: 'Invalid File Type',
          message: 'Please select a JPG or PNG image file'
        });
        return;
      }

      setQrCode({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType
      });
    } catch (error) {
      console.error('Error picking document:', error);
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

    if (!accountInfo.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in the account information'
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

      // Generate a unique boundary
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      
      const formParts = [];
      
      // Add text fields
      formParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="AccountInfo"\r\n\r\n${accountInfo.trim()}`);
      formParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="RequestType"\r\n\r\n2`);
      formParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="Amount"\r\n\r\n${amount}`);
      formParts.push(`--${boundary}\r\nContent-Disposition: form-data; name="PhoneNumber"\r\n\r\n${phoneNumber.replace(/\s+/g, '')}`);
      
      // If there's a QR code image, add it
      if (qrCode) {
        // Convert the image URI to a blob
        const response = await fetch(qrCode.uri);
        const blob = await response.blob();
        
        formParts.push(
          `--${boundary}\r\nContent-Disposition: form-data; name="_RequestImage"; filename="${qrCode.name || 'qr_code.jpg'}"\r\nContent-Type: ${qrCode.mimeType || 'image/jpeg'}\r\n\r\n`
        );
        formParts.push(await blob.text());
      }
      
      // Add the final boundary
      formParts.push(`--${boundary}--\r\n`);
      
      // Join all parts with CRLF
      const formBody = formParts.join('\r\n');

      const response = await fetch('https://prod-tradingapi.sanaitatechnologies.com/FundRequestApi/AddFundInformationHistory', {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionManager.getToken() || '',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formBody
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit withdrawal request');
      }

      showNotification({
        type: 'success',
        title: 'Withdrawal Request Response',
        message: result.message || 'Withdrawal request submitted successfully.'
      });

      // Reset form and close
      setAmount('');
      setPhoneNumber('');
      setAccountInfo('');
      setQrCode(null);
      onClose();

    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error.message || 'Failed to submit withdrawal request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, phoneNumber, accountInfo, qrCode, showNotification, onClose]);

  const handleClose = useCallback(() => {
    setAmount('');
    setPhoneNumber('');
    setAccountInfo('');
    setQrCode(null);
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
      title="Withdrawal"
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Withdrawal Form */}
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
              Account Info
            </Text>
            <View style={[styles.textAreaContainer, { 
              backgroundColor: theme.colors.surface, 
              borderColor: theme.colors.border 
            }]}>
              <TextInput
                value={accountInfo}
                onChangeText={setAccountInfo}
                placeholder="Please fill in this field with your bank account details, UPI ID, or other relevant payment information"
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
              QR Code
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
                  {qrCode ? qrCode.name : 'No file chosen'}
                </Text>
              </View>
              {qrCode && (
                <View style={[styles.previewContainer, { backgroundColor: theme.colors.surface }]}>
                  <Image
                    source={{ uri: qrCode.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: theme.colors.error + '20' }]}
                    onPress={() => setQrCode(null)}
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
              Withdrawal Instructions
            </Text>
          </View>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>1</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Enter the withdrawal amount (minimum 100)
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>2</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Provide your registered phone number
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>3</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Fill in your bank account details or UPI information
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>4</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Upload your payment QR code (optional but recommended)
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <View style={[styles.stepNumber, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>5</Text>
              </View>
              <Text variant="body" color="text" style={styles.instructionText}>
                Your withdrawal will be processed within 24-48 hours
              </Text>
            </View>
          </View>
        </Card>

        {/* Warning */}
        <Card padding="large" style={StyleSheet.flatten([styles.card, styles.warningCard])}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color={theme.colors.error} />
            <Text variant="subtitle" weight="semibold" color="error" style={styles.warningTitle}>
              Important Notice
            </Text>
          </View>
          <Text variant="body" color="error" style={styles.warningText}>
            • Ensure all provided information is accurate to avoid delays
          </Text>
          <Text variant="body" color="error" style={styles.warningText}>
            • Withdrawal processing fee may apply as per terms
          </Text>
          <Text variant="body" color="error" style={styles.warningText}>
            • Contact support if you don't receive funds within 48 hours
          </Text>
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
            title="Withdrawal"
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
  
  // Text Area Styles
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
  
  // Warning Styles
  warningCard: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    flex: 1,
  },
  warningText: {
    lineHeight: 18,
    marginBottom: 4,
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
});

export default WithdrawalPage;
