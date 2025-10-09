import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { 
  View,
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ViewStyle
} from 'react-native';
import { Card, Text, Button, Input } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';

interface AccountInfoPageProps {
  visible: boolean;
  onClose: () => void;
}

const AccountInfoPage: React.FC<AccountInfoPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [bankName, setBankName] = React.useState('');
  const [holderName, setHolderName] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [ifscCode, setIfscCode] = React.useState('');
  const [upiId, setUpiId] = React.useState('');
  const [usdtAddress, setUsdtAddress] = React.useState('');

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title="Account Information"
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Warning Message */}
        <View style={[styles.warningCard, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]}>
          <Text variant="body" weight="medium" style={{ color: theme.colors.error }}>
            Ensure to confirm with the recipient before sending money
          </Text>
        </View>

        {/* Bank Details Section */}
        <Card padding="large" style={styles.card}>
          <View>
            <View style={styles.fullWidth}>
              <Text variant="body" color="textSecondary" style={styles.label}>
                Bank Name
              </Text>
              <Input
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter bank name"
                style={styles.inputField}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.fullWidth}>
              <Text variant="body" color="textSecondary" style={styles.label}>
                Holder Name
              </Text>
              <Input
                value={holderName}
                onChangeText={setHolderName}
                placeholder="Enter account holder name"
                style={styles.inputField}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View>
            <View style={styles.fullWidth}>
              <Text variant="body" color="textSecondary" style={styles.label}>
                Account Number
              </Text>
              <Input
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter account number"
                style={styles.inputField}
                keyboardType="numeric"
                maxLength={18}
              />
            </View>
            <View style={styles.fullWidth}>
              <Text variant="body" color="textSecondary" style={styles.label}>
                IFSC Code
              </Text>
              <Input
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="Enter IFSC code"
                style={styles.inputField}
                autoCapitalize="characters"
                maxLength={11}
              />
            </View>
          </View>

          <View style={styles.fullWidth}>
            <Text variant="body" color="textSecondary" style={styles.label}>
              UPI ID
            </Text>
            <Input
              value={upiId}
              onChangeText={setUpiId}
              placeholder="Enter UPI ID"
              style={styles.inputField}
              autoCapitalize="none"
            />
          </View>
        </Card>

        {/* PhonePe QR Section */}
        <Card padding="large" style={styles.card}>
          <View style={styles.qrSection}>
            <View style={styles.qrHeader}>
              <View style={styles.phonePeHeader}>
                <View style={[styles.phonePeIcon, { backgroundColor: '#5f259f' }]}>
                  <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>
                    P
                  </Text>
                </View>
                <Text variant="body" weight="semibold" color="text">PhonePe</Text>
              </View>
              <Text variant="caption" style={{ color: '#8b5cf6' }}>
                ACCEPTED HERE
              </Text>
            </View>
            
            <Text variant="caption" color="textSecondary" style={styles.qrInstructions}>
              Scan any QR using PhonePe App
            </Text>
            
            <View style={styles.qrCodeContainer}>
              <View style={[styles.qrCodePlaceholder, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                {/* QR Code placeholder - you can replace this with actual QR code component */}
                <View style={styles.qrPattern}>
                  {Array.from({ length: 64 }).map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.qrDot,
                        { 
                          backgroundColor: Math.random() > 0.5 ? theme.colors.text : 'transparent'
                        }
                      ]}
                    />
                  ))}
                </View>
                <View style={[styles.qrCenter, { backgroundColor: '#5f259f' }]}>
                  <Text variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>
                    P
                  </Text>
                </View>
              </View>
            </View>
            
            <Text variant="body" weight="medium" color="text" style={styles.qrName}>
              Rehan Malik
            </Text>
          </View>
        </Card>

        {/* USDT Section */}
        <Card padding="large" style={styles.card}>
          <View style={styles.fullWidth}>
            <Text variant="body" color="textSecondary" style={styles.label}>
              USDT Address
            </Text>
            <Input
              value={usdtAddress}
              onChangeText={setUsdtAddress}
              placeholder="Enter USDT address"
              style={styles.inputField}
              autoCapitalize="none"
            />
          </View>
        </Card>

        {/* Close Button */}
        <View style={styles.closeButtonContainer}>
          <Button
            title="Close"
            onPress={onClose}
            variant="primary"
            style={styles.closeButton}
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
    paddingBottom: 100, // Increased padding to ensure close button is fully visible
  },
  
  // Warning Card
  warningCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
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
    marginBottom: 5,
  },
  
  // Input Field Styles
  label: {
    marginBottom:0,
    fontWeight: '500',
  },
  inputField: {
    padding: 0,
    paddingTop: 5,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  } as ViewStyle,
  
  // QR Code Section
  qrSection: {
    alignItems: 'center',
  },
  qrHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  phonePeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  phonePeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrInstructions: {
    marginBottom: 16,
  },
  qrCodeContainer: {
    marginBottom: 16,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  qrPattern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 160,
    height: 160,
    position: 'absolute',
  },
  qrDot: {
    width: 5,
    height: 5,
    margin: 0.5,
  },
  qrCenter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  qrName: {
    textAlign: 'center',
  },
  
  // USDT Section
  usdtIconContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  usdtIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Close Button
  closeButtonContainer: {
    marginTop: 32,
    paddingHorizontal: 0, // Remove extra padding since we already have padding in scrollContent
    paddingBottom: 20, // Add bottom padding for better spacing
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 8,
  },
});

export default AccountInfoPage;
