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

interface RegisterForm {
  sponserId: string;
  fullName: string;
  email: string;
  mobile: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface RegisterErrors {
  sponserId?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirmPassword: '',
    sponserId: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Animations
  const fadeAnimation = useFadeAnimation(true);
  const slideAnimation = useSlideUpAnimation(true, 200);

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Validate full name
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate mobile
    const mobileRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(form.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    // Validate username
    if (!form.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Validate password
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Validate confirm password
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    if (!agreeToTerms) {
      showNotification({
        type: 'warning',
        title: 'Terms and Conditions',
        message: 'Please agree to the terms and conditions to continue'
      });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      showNotification({
        type: 'info',
        title: 'Creating Account...',
        message: 'Please wait while we set up your demo account',
        duration: 2000
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification({
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your demo account has been created successfully. You can now log in.',
        duration: 3000
      });

      // Navigate back to login after a short delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
      showNotification({
        type: 'error',
        title: 'Registration Failed',
        message: 'Please try again or contact support'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Header */}
        <Animated.View style={[styles.header, fadeAnimation]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text variant="headline" weight="bold" color="text">
            Create Account
          </Text>
          <Text variant="body" color="textSecondary" style={styles.subtitle}>
            Join our virtual trading platform
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formContainer, slideAnimation]}>
          <Card padding="large" shadow={true}>
            {/* Full Name */}
            <Input
              label="Full Name"
              value={form.fullName}
              onChangeText={(text) => setForm({ ...form, fullName: text })}
              placeholder="Enter your full name"
              error={errors.fullName}
              leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />

            {/* Email */}
            <Input
              label="Email Address"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              placeholder="Enter your email"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />

            {/* Mobile */}
            <Input
              label="Mobile Number"
              value={form.mobile}
              onChangeText={(text) => setForm({ ...form, mobile: text })}
              placeholder="Enter your mobile number"
              error={errors.mobile}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="phone-portrait-outline" size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />

            {/* Username */}
            <Input
              label="Username"
              value={form.username}
              onChangeText={(text) => setForm({ ...form, username: text.toLowerCase() })}
              placeholder="Choose a username"
              error={errors.username}
              autoCapitalize="none"
              leftIcon={<Ionicons name="at-outline" size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />

            {/* Password */}
            <Input
              label="Password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Create a strong password"
              error={errors.password}
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

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />}
              rightIcon={
                <Ionicons 
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.input}
            />

            {/* Sponser Id */}
            <Input
              label="Sponser Id (Optional)"
              value={form.sponserId}
              onChangeText={(text) => setForm({ ...form, sponserId: text })}
              placeholder="Enter your sponser id"
              error={errors.sponserId}
              leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />}
              style={styles.input}
            />

            {/* Terms Agreement */}
            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: agreeToTerms ? theme.colors.primary : 'transparent'
                }
              ]}>
                {agreeToTerms && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text variant="caption" color="text" style={styles.termsText}>
                I agree to the Terms and Conditions and Privacy Policy
              </Text>
            </TouchableOpacity>

            {/* General Error */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text variant="caption" color="error">
                  {errors.general}
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Register Button */}
        <Animated.View style={[styles.buttonContainer, slideAnimation]}>
          <Button
            title="Create Demo Account"
            onPress={handleRegister}
            variant="primary"
            size="large"
            loading={isLoading}
            fullWidth={true}
            style={styles.registerButton}
          />
        </Animated.View>

        {/* Login Link */}
        <Animated.View style={[styles.loginContainer, fadeAnimation]}>
          <Text variant="body" color="textSecondary">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text variant="body" color="primary" weight="medium">
              Log in
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    flex: 1,
    lineHeight: 18,
  },
  errorContainer: {
    marginTop: 8,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  registerButton: {
    height: 56,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
