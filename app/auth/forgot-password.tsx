import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button, Card, Input, Text } from '../../components/atomic';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFadeAnimation, useSlideUpAnimation } from '../../hooks/useAnimations';

interface ForgotPasswordForm {
  identifier: string; // email or mobile
}

interface ForgotPasswordErrors {
  identifier?: string;
  general?: string;
}

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [form, setForm] = useState<ForgotPasswordForm>({
    identifier: '',
  });
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'otp' | 'reset'>('input');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Animations
  const fadeAnimation = useFadeAnimation(true);
  const slideAnimation = useSlideUpAnimation(true, 200);

  const validateIdentifier = (): boolean => {
    const newErrors: ForgotPasswordErrors = {};

    if (!form.identifier.trim()) {
      newErrors.identifier = 'Email or mobile number is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      const isEmail = emailRegex.test(form.identifier);
      const isMobile = mobileRegex.test(form.identifier.replace(/\s/g, ''));

      if (!isEmail && !isMobile) {
        newErrors.identifier = 'Please enter a valid email or mobile number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validateIdentifier()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      showNotification({
        type: 'info',
        title: 'Sending OTP...',
        message: 'Please wait while we send the verification code',
        duration: 1500
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification({
        type: 'success',
        title: 'OTP Sent!',
        message: `A verification code has been sent to ${form.identifier}`
      });
      setStep('otp');
    } catch (error) {
      setErrors({ general: 'Failed to send OTP. Please try again.' });
      showNotification({
        type: 'error',
        title: 'Failed to Send OTP',
        message: 'Please try again or contact support'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      showNotification({
        type: 'warning',
        title: 'Invalid OTP',
        message: 'Please enter a valid 6-digit OTP'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      showNotification({
        type: 'info',
        title: 'Verifying OTP...',
        message: 'Please wait while we verify your code',
        duration: 1000
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (otp === '123456') { // Demo OTP
        showNotification({
          type: 'success',
          title: 'OTP Verified!',
          message: 'Please create a new password'
        });
        setStep('reset');
      } else {
        showNotification({
          type: 'error',
          title: 'Invalid OTP',
          message: 'Please enter the correct OTP (use 123456 for demo)'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Verification Failed',
        message: 'Failed to verify OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showNotification({
        type: 'warning',
        title: 'Invalid Password',
        message: 'Password must be at least 8 characters'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification({
        type: 'warning',
        title: 'Password Mismatch',
        message: 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      showNotification({
        type: 'info',
        title: 'Resetting Password...',
        message: 'Please wait while we update your password',
        duration: 1500
      });

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification({
        type: 'success',
        title: 'Password Reset Successful!',
        message: 'Your password has been reset successfully. You can now log in with your new password.',
        duration: 3000
      });

      // Navigate back to login after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Reset Failed',
        message: 'Failed to reset password. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIdentifierIcon = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(form.identifier)) {
      return <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />;
    } else {
      return <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.textSecondary} />;
    }
  };

  const renderInputStep = () => (
    <>
      <Animated.View style={[styles.header, fadeAnimation]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headline" weight="bold" color="text">
          Forgot Password
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Enter your email or mobile number to reset your password
        </Text>
      </Animated.View>

      <Animated.View style={[styles.formContainer, slideAnimation]}>
        <Card padding="large" shadow={true}>
          <Input
            label="Email or Mobile Number"
            value={form.identifier}
            onChangeText={(text) => setForm({ ...form, identifier: text })}
            placeholder="Enter email or mobile number"
            error={errors.identifier}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={getIdentifierIcon()}
            style={styles.input}
          />

          {errors.general && (
            <View style={styles.errorContainer}>
              <Text variant="caption" color="error">
                {errors.general}
              </Text>
            </View>
          )}
        </Card>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, slideAnimation]}>
        <Button
          title="Send OTP"
          onPress={handleSendOTP}
          variant="primary"
          size="large"
          loading={isLoading}
          fullWidth={true}
          style={styles.button}
        />
      </Animated.View>
    </>
  );

  const renderOTPStep = () => (
    <>
      <Animated.View style={[styles.header, fadeAnimation]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setStep('input')}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text variant="headline" weight="bold" color="text">
          Verify OTP
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Enter the 6-digit code sent to {form.identifier}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.formContainer, slideAnimation]}>
        <Card padding="large" shadow={true}>
          <Input
            label="OTP Code"
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6-digit OTP"
            keyboardType="numeric"
            maxLength={6}
            leftIcon={<Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />}
            style={styles.input}
          />

          <Text variant="caption" color="textSecondary" style={styles.otpNote}>
            Demo OTP: 123456
          </Text>
        </Card>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, slideAnimation]}>
        <Button
          title="Verify OTP"
          onPress={handleVerifyOTP}
          variant="primary"
          size="large"
          loading={isLoading}
          fullWidth={true}
          style={styles.button}
        />

        <TouchableOpacity 
          style={styles.resendContainer}
          onPress={handleSendOTP}
        >
          <Text variant="body" color="primary" weight="medium">
            Resend OTP
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  const renderResetStep = () => (
    <>
      <Animated.View style={[styles.header, fadeAnimation]}>
        <Text variant="headline" weight="bold" color="text">
          Reset Password
        </Text>
        <Text variant="body" color="textSecondary" style={styles.subtitle}>
          Create a new strong password
        </Text>
      </Animated.View>

      <Animated.View style={[styles.formContainer, slideAnimation]}>
        <Card padding="large" shadow={true}>
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
            rightIcon={
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
            style={styles.input}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry={!showPassword}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
            style={styles.input}
          />
        </Card>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, slideAnimation]}>
        <Button
          title="Reset Password"
          onPress={handleResetPassword}
          variant="primary"
          size="large"
          loading={isLoading}
          fullWidth={true}
          style={styles.button}
        />
      </Animated.View>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'input' && renderInputStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'reset' && renderResetStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  otpNote: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    marginTop: 8,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    height: 56,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});
