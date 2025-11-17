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
} from 'react-native';
import { Button, Input, Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChangePasswordPageProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordPage({ visible, onClose }: ChangePasswordPageProps) {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleClose = () => {
    // Clear fields on close
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const validateForm = () => {
    if (!currentPassword.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter your current password',
      });
      return false;
    }

    if (!newPassword.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a new password',
      });
      return false;
    }

    if (newPassword.length < 6) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'New password must be at least 6 characters long',
      });
      return false;
    }

    if (newPassword === currentPassword) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'New password must be different from current password',
      });
      return false;
    }

    if (!confirmPassword.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please confirm your new password',
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'New password and confirm password do not match',
      });
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Call the change password API here
      // Example:
      // await tradingApiService.changePassword({
      //   currentPassword,
      //   newPassword,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      showNotification({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password has been changed successfully',
      });

      handleClose();
    } catch (error: any) {
      console.error('Error changing password:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to change password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <StatusBar barStyle="light-content" backgroundColor="rgba(0, 0, 0, 0.5)" />

          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="headline" weight="bold" color="text">
              Change Password
            </Text>
            <View style={styles.closeButton} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.content}>
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                  <Text variant="caption" color="text" style={styles.infoText}>
                    Your password must be at least 6 characters long and different from your current password.
                  </Text>
                </View>

                {/* Current Password */}
                <View style={styles.inputContainer}>
                  <Text variant="body" weight="medium" color="text" style={styles.label}>
                    Current Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <Input
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                      style={styles.passwordInput}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Ionicons
                        name={showCurrentPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputContainer}>
                  <Text variant="body" weight="medium" color="text" style={styles.label}>
                    New Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <Input
                      placeholder="Enter new password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      style={styles.passwordInput}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Ionicons
                        name={showNewPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Text variant="body" weight="medium" color="text" style={styles.label}>
                    Confirm New Password
                  </Text>
                  <View style={styles.passwordInputContainer}>
                    <Input
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      style={styles.passwordInput}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <View style={styles.buttonContainer}>
                  <Button
                    title={loading ? 'Changing Password...' : 'Change Password'}
                    onPress={handleChangePassword}
                    disabled={loading}
                    size="large"
                    fullWidth
                    icon={
                      loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color="white" />
                      )
                    }
                  />
                </View>
              </View>
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
  },
  container: {
    flex: 1,
    marginLeft: 'auto',
    width: SCREEN_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: '100%',
  },
  buttonContainer: {
    marginTop: 12,
  },
});
