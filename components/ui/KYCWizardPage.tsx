import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, Input, Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type KYCType = 'aadhar' | 'pan' | 'profile-picture' | 'digital-signature' | 'bank-details';

interface KYCWizardPageProps {
  visible: boolean;
  selectedType?: KYCType | null;
  onClose: () => void;
}

const KYC_STEPS = [
  { id: 'aadhar', label: 'Aadhar Card' },
  { id: 'pan', label: 'PAN Card' },
  { id: 'profile-picture', label: 'Profile Picture' },
  { id: 'digital-signature', label: 'Digital Sig' },
  { id: 'bank-details', label: 'Bank Details' },
] as const;

export default function KYCWizardPage({ visible, selectedType, onClose }: KYCWizardPageProps) {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  // Track current tab
  const [currentTab, setCurrentTab] = useState<KYCType>(selectedType || 'aadhar');

  // Aadhar Card State
  const [aadharName, setAadharName] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState<string | null>(null);
  const [aadharBack, setAadharBack] = useState<string | null>(null);

  // PAN Card State
  const [panName, setPanName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panImage, setPanImage] = useState<string | null>(null);

  // Profile Picture State
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Digital Signature State
  const [digitalSignatureName, setDigitalSignatureName] = useState('');
  const [digitalSignature, setDigitalSignature] = useState<string | null>(null);

  // Bank Details State
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankDocument, setBankDocument] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const slideAnim = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  React.useEffect(() => {
    if (selectedType) {
      setCurrentTab(selectedType);
    }
  }, [selectedType]);

  const handleClose = () => {
    // Reset all forms
    setAadharName('');
    setAadharNumber('');
    setAadharFront(null);
    setAadharBack(null);
    setPanName('');
    setPanNumber('');
    setPanImage(null);
    setProfilePicture(null);
    setDigitalSignatureName('');
    setDigitalSignature(null);
    setBankName('');
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setBankDocument(null);
    onClose();
  };

  const handleFileUpload = (type: string) => {
    showNotification({
      type: 'info',
      title: 'File Upload',
      message: 'File picker will open here',
    });
  };

  const renderAadharForm = () => (
    <View style={styles.formContainer}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.formTitle}>
        Aadhar Card
      </Text>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Name
        </Text>
        <Input
          placeholder="Enter your name"
          value={aadharName}
          onChangeText={setAadharName}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Document Number
        </Text>
        <Input
          placeholder="Enter Aadhar number"
          value={aadharNumber}
          onChangeText={setAadharNumber}
          keyboardType="numeric"
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload front image
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('aadharFront')}
        >
          <Text variant="body" color={aadharFront ? 'text' : 'textSecondary'}>
            {aadharFront ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload back image
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('aadharBack')}
        >
          <Text variant="body" color={aadharBack ? 'text' : 'textSecondary'}>
            {aadharBack ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submitButtonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit'}
          onPress={async () => {
            if (!aadharName.trim() || !aadharNumber.trim() || !aadharFront || !aadharBack) {
              showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Please fill all fields and upload required documents',
              });
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Aadhar card details submitted successfully',
              });
              handleClose();
            }, 1500);
          }}
          disabled={loading}
          fullWidth={true}
        />
      </View>
    </View>
  );

  const renderPanForm = () => (
    <View style={styles.formContainer}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.formTitle}>
        PAN Card
      </Text>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Name
        </Text>
        <Input
          placeholder="Enter your name"
          value={panName}
          onChangeText={setPanName}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Document Number
        </Text>
        <Input
          placeholder="Enter PAN number"
          value={panNumber}
          onChangeText={setPanNumber}
          maxLength={10}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload image
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('panImage')}
        >
          <Text variant="body" color={panImage ? 'text' : 'textSecondary'}>
            {panImage ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submitButtonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit'}
          onPress={async () => {
            if (!panName.trim() || !panNumber.trim() || !panImage) {
              showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Please fill all fields and upload required documents',
              });
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'PAN card details submitted successfully',
              });
              handleClose();
            }, 1500);
          }}
          disabled={loading}
          fullWidth={true}
        />
      </View>
    </View>
  );

  const renderProfilePictureForm = () => (
    <View style={styles.formContainer}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.formTitle}>
        Profile Picture
      </Text>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload front image
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('profilePicture')}
        >
          <Text variant="body" color={profilePicture ? 'text' : 'textSecondary'}>
            {profilePicture ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submitButtonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit'}
          onPress={async () => {
            if (!profilePicture) {
              showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Please upload a profile picture',
              });
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Profile picture uploaded successfully',
              });
              handleClose();
            }, 1500);
          }}
          disabled={loading}
          fullWidth={true}
        />
      </View>
    </View>
  );

  const renderDigitalSignatureForm = () => (
    <View style={styles.formContainer}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.formTitle}>
        Digital Signature
      </Text>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Name
        </Text>
        <Input
          placeholder="Enter your name"
          value={digitalSignatureName}
          onChangeText={setDigitalSignatureName}
          disabled={loading}
        />
      </View>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload your digital signature
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('digitalSignature')}
        >
          <Text variant="body" color={digitalSignature ? 'text' : 'textSecondary'}>
            {digitalSignature ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submitButtonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit'}
          onPress={async () => {
            if (!digitalSignatureName.trim() || !digitalSignature) {
              showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Please enter your name and upload a digital signature',
              });
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Digital signature uploaded successfully',
              });
              handleClose();
            }, 1500);
          }}
          disabled={loading}
          fullWidth={true}
        />
      </View>
    </View>
  );

  const renderBankDetailsForm = () => (
    <View style={styles.formContainer}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.formTitle}>
        Bank Details
      </Text>
      
      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Account Holder Name
        </Text>
        <Input
          placeholder="Enter account holder name"
          value={accountHolderName}
          onChangeText={setAccountHolderName}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Bank Name
        </Text>
        <Input
          placeholder="Enter bank name"
          value={bankName}
          onChangeText={setBankName}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          IFSC
        </Text>
        <Input
          placeholder="Enter IFSC code"
          value={ifscCode}
          onChangeText={setIfscCode}
          maxLength={11}
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Account Number
        </Text>
        <Input
          placeholder="Enter account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          disabled={loading}
        />
      </View>

      <View style={styles.formSection}>
        <Text variant="body" weight="medium" color="text" style={styles.label}>
          Upload passport/cheque
        </Text>
        <TouchableOpacity 
          style={[styles.fileButton, { borderColor: theme.colors.border }]}
          onPress={() => handleFileUpload('bankDocument')}
        >
          <Text variant="body" color={bankDocument ? 'text' : 'textSecondary'}>
            {bankDocument ? 'File chosen' : 'Choose file'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.submitButtonContainer}>
        <Button
          title={loading ? 'Submitting...' : 'Submit'}
          onPress={async () => {
            if (!accountHolderName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
              showNotification({
                type: 'error',
                title: 'Validation Error',
                message: 'Please fill all bank details',
              });
              return;
            }
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              showNotification({
                type: 'success',
                title: 'Success',
                message: 'Bank details submitted successfully',
              });
              handleClose();
            }, 1500);
          }}
          disabled={loading}
          fullWidth={true}
        />
      </View>
    </View>
  );

  const renderFormContent = () => {
    switch (currentTab) {
      case 'aadhar':
        return renderAadharForm();
      case 'pan':
        return renderPanForm();
      case 'profile-picture':
        return renderProfilePictureForm();
      case 'digital-signature':
        return renderDigitalSignatureForm();
      case 'bank-details':
        return renderBankDetailsForm();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateX: slideAnim }],
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
              <Text variant="headline" weight="bold" color="text">
                KYC Wizard
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <View style={styles.subtitle}>
              <Text variant="caption" color="textSecondary">
                Complete the steps below to finish KYC. You can update any step until it is approved.
              </Text>
            </View>

            {/* KYC Steps Tab Navigation */}
            {/* <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
              <Text variant="body" weight="semibold" color="text" style={styles.tabLabel}>
                KYC Steps
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabContent}
              >
                {KYC_STEPS.map((step) => (
                  <TouchableOpacity
                    key={step.id}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: currentTab === step.id ? theme.colors.primary : theme.colors.card,
                      }
                    ]}
                    onPress={() => setCurrentTab(step.id as KYCType)}
                  >
                    <Text 
                      variant="caption" 
                      weight="medium"
                      style={{ 
                        color: currentTab === step.id ? 'white' : theme.colors.text 
                      }}
                    >
                      {step.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View> */}

            {/* Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderFormContent()}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    maxWidth: '100%',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  subtitle: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabLabel: {
    marginBottom: 12,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabContent: {
    gap: 8,
    paddingRight: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 'auto',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  formTitle: {
    marginBottom: 24,
    fontSize: 18,
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  fileButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 48,
  },
  submitButtonContainer: {
    marginTop: 24,
  },
});
