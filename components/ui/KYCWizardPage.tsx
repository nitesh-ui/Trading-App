import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
import { tradingApiService } from '../../services/tradingApiService';
import { sessionManager } from '../../services/sessionManager';

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

  const handleFileUpload = async (type: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('File selection canceled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate file type
        if (!['image/jpeg', 'image/png'].includes(asset.mimeType || '')) {
          showNotification({
            type: 'error',
            title: 'Invalid File Type',
            message: 'Please select a JPG or PNG image',
          });
          return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (asset.size && asset.size > maxSize) {
          showNotification({
            type: 'error',
            title: 'File Too Large',
            message: 'Please select an image smaller than 5MB',
          });
          return;
        }

        // Set the file URI based on type
        switch (type) {
          case 'aadharFront':
            setAadharFront(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'Aadhar front image selected',
            });
            break;
          case 'aadharBack':
            setAadharBack(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'Aadhar back image selected',
            });
            break;
          case 'panImage':
            setPanImage(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'PAN image selected',
            });
            break;
          case 'profilePicture':
            setProfilePicture(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'Profile picture selected',
            });
            break;
          case 'digitalSignature':
            setDigitalSignature(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'Digital signature selected',
            });
            break;
          case 'bankDocument':
            setBankDocument(asset.uri);
            showNotification({
              type: 'success',
              title: 'Success',
              message: 'Bank document selected',
            });
            break;
        }

        console.log(`✅ File selected for ${type}:`, asset.uri, `(Size: ${asset.size} bytes)`);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to select file. Please try again.',
      });
    }
  };

  const handleBankDetailsSubmit = async () => {
    // Validate all fields
    if (!accountHolderName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter account holder name',
      });
      return;
    }
    if (!bankName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter bank name',
      });
      return;
    }
    if (!ifscCode.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter IFSC code',
      });
      return;
    }
    if (!accountNumber.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter account number',
      });
      return;
    }
    if (!bankDocument) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload a document (passport/cheque)',
      });
      return;
    }

    // Submit bank details
    setLoading(true);
    try {
      console.log('🏦 Starting bank details submission...');
      const currentUser = sessionManager.getCurrentUser();
      const userName = currentUser?.username || 'User';

      console.log('📋 Bank Details:', {
        Name: accountHolderName,
        BankName: bankName,
        IFSC: ifscCode,
        AccountNumber: accountNumber,
        UserName: userName,
      });

      const response = await tradingApiService.submitBankDetails({
        Id: 1,
        Name: accountHolderName,
        BankName: bankName,
        IFSC: ifscCode,
        AccountNumber: accountNumber,
        FrontImage: {
          uri: bankDocument,
          type: 'image/jpeg',
          name: 'bank_document.jpg',
        },
        UserName: userName,
      });

      console.log('✅ Bank details submitted successfully:', response);
      showNotification({
        type: 'success',
        title: 'Success',
        message: response.message || 'Bank details submitted successfully',
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error submitting bank details:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit bank details. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAadharSubmit = async () => {
    // Validate all fields
    if (!aadharName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your name',
      });
      return;
    }
    if (!aadharNumber.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter Aadhar number',
      });
      return;
    }
    if (!aadharFront) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload front image',
      });
      return;
    }
    if (!aadharBack) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload back image',
      });
      return;
    }

    // Submit Aadhar details
    setLoading(true);
    try {
      console.log('🎫 Starting Aadhar submission...');
      const currentUser = sessionManager.getCurrentUser();
      const userId = parseInt(currentUser?.id || '1');

      const response = await tradingApiService.submitKyc({
        Type: 1, // Aadhar
        Id: userId,
        Name: aadharName,
        DocumentNumber: aadharNumber,
        FrontImageFile: {
          uri: aadharFront,
          type: 'image/jpeg',
          name: 'aadhar_front.jpg',
        },
        BackImageFile: {
          uri: aadharBack,
          type: 'image/jpeg',
          name: 'aadhar_back.jpg',
        },
      });

      console.log('✅ Aadhar submitted successfully:', response);
      showNotification({
        type: 'success',
        title: 'Success',
        message: response.message || 'Aadhar card submitted successfully',
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error submitting Aadhar:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit Aadhar. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePanSubmit = async () => {
    // Validate all fields
    if (!panName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your name',
      });
      return;
    }
    if (!panNumber.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter PAN number',
      });
      return;
    }
    if (!panImage) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload PAN image',
      });
      return;
    }

    // Submit PAN details
    setLoading(true);
    try {
      console.log('💳 Starting PAN submission...');
      const currentUser = sessionManager.getCurrentUser();
      const userId = parseInt(currentUser?.id || '1');

      const response = await tradingApiService.submitKyc({
        Type: 2, // PAN
        Id: userId,
        Name: panName,
        DocumentNumber: panNumber,
        FrontImageFile: {
          uri: panImage,
          type: 'image/jpeg',
          name: 'pan_image.jpg',
        },
      });

      console.log('✅ PAN submitted successfully:', response);
      showNotification({
        type: 'success',
        title: 'Success',
        message: response.message || 'PAN card submitted successfully',
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error submitting PAN:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit PAN. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureSubmit = async () => {
    if (!profilePicture) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload profile picture',
      });
      return;
    }

    // Submit Profile Picture
    setLoading(true);
    try {
      console.log('📷 Starting Profile Picture submission...');
      const currentUser = sessionManager.getCurrentUser();
      const userId = parseInt(currentUser?.id || '1');
      const userName = currentUser?.username || 'User';

      const response = await tradingApiService.submitKyc({
        Type: 3, // Profile Picture
        Id: userId,
        Name: userName,
        DocumentNumber: '',
        FrontImageFile: {
          uri: profilePicture,
          type: 'image/jpeg',
          name: 'profile_picture.jpg',
        },
      });

      console.log('✅ Profile Picture submitted successfully:', response);
      showNotification({
        type: 'success',
        title: 'Success',
        message: response.message || 'Profile picture submitted successfully',
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error submitting Profile Picture:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit Profile Picture. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalSignatureSubmit = async () => {
    if (!digitalSignatureName.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your name',
      });
      return;
    }
    if (!digitalSignature) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload digital signature',
      });
      return;
    }

    // Submit Digital Signature
    setLoading(true);
    try {
      console.log('✍️ Starting Digital Signature submission...');
      const currentUser = sessionManager.getCurrentUser();
      const userId = parseInt(currentUser?.id || '1');

      const response = await tradingApiService.submitKyc({
        Type: 4, // Digital Signature
        Id: userId,
        Name: digitalSignatureName,
        DocumentNumber: '',
        FrontImageFile: {
          uri: digitalSignature,
          type: 'image/jpeg',
          name: 'digital_signature.jpg',
        },
      });

      console.log('✅ Digital Signature submitted successfully:', response);
      showNotification({
        type: 'success',
        title: 'Success',
        message: response.message || 'Digital signature submitted successfully',
      });
      handleClose();
    } catch (error) {
      console.error('❌ Error submitting Digital Signature:', error);
      showNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit Digital Signature. Please try again.',
      });
    } finally {
      setLoading(false);
    }
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
          onPress={handleAadharSubmit}
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
          onPress={handlePanSubmit}
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
          onPress={handleProfilePictureSubmit}
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
          onPress={handleDigitalSignatureSubmit}
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
          onPress={handleBankDetailsSubmit}
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
