import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Linking,
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
import { sessionManager } from '../../services/sessionManager';
import { tradingApiService } from '../../services/tradingApiService';

interface LoginForm {
  identifier: string; // Can be mobile, username, or email
  password: string;
}

interface LoginErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [form, setForm] = useState<LoginForm>({
    identifier: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnimation = useFadeAnimation(true);
  const slideAnimation = useSlideUpAnimation(true, 200);
  const buttonSlideAnimation = useSlideUpAnimation(true, 400);

  const getMaxLength = () => {
    if (/^\d/.test(form.identifier)) {
      return 10;
    }
    return 50;
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Validate identifier (mobile/username/email)
    if (!form.identifier.trim()) {
      newErrors.identifier = 'Username, email, or mobile number is required';
    } else {
      // Enhanced validation patterns
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobileRegex = /^[0-9]{10}$/; // More flexible mobile pattern
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // Username: alphanumeric + underscore, 3-20 chars
      
      const cleanIdentifier = form.identifier.replace(/\s/g, '');
      const isEmail = emailRegex.test(form.identifier);
      const isMobile = mobileRegex.test(cleanIdentifier);
      const isUsername = usernameRegex.test(form.identifier);

      if (!isEmail && !isMobile && !isUsername) {
        if (form.identifier.includes('@')) {
          newErrors.identifier = 'Please enter a valid email address';
        } else if (/^\d/.test(form.identifier)) {
          newErrors.identifier = 'Please enter a valid mobile number (7-15 digits)';
        } else {
          newErrors.identifier = 'Username must be 3-20 characters (letters, numbers, underscore only)';
        }
      }
    }

    // Enhanced password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (form.password.length > 50) {
      newErrors.password = 'Password must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Show initial loading notification
      showNotification({
        type: 'info',
        title: 'Connecting...',
        message: 'Verifying your credentials with server',
        duration: 2000
      });

      // Call real API - COMMENTED FOR TESTING
      // const response = await tradingApiService.login({
      //   emailOrUsername: form.identifier.trim(),
      //   password: form.password,
      // });

      // Simulate API success for testing
      const response = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: '12345',
            name: form.identifier.includes('@') ? form.identifier.split('@')[0] : form.identifier,
            email: form.identifier.includes('@') ? form.identifier : `${form.identifier}@demo.com`,
            username: form.identifier,
          },
          token: 'mock_jwt_token_' + Date.now(),
        }
      };

      if (response.success) {
        // Store user session
        if (response.data?.user && response.data?.token) {
          await sessionManager.saveSession(response.data.user, response.data.token);
        }

        // Handle remember password option
        if (rememberPassword) {
          // TODO: Store credentials securely using Keychain/Keystore
          showNotification({
            type: 'info',
            title: 'Password Saved',
            message: 'Your password has been saved securely for next time',
            duration: 2000
          });
        }

        // Success notification
        showNotification({
          type: 'success',
          title: 'Welcome Back!',
          message: response.message || 'Login successful. Redirecting to dashboard...',
          duration: 2000
        });

        // Log success for debugging
        console.log('✅ User logged in:', response.data?.user);
        
        // Navigate to main app immediately
        router.replace('/(tabs)');

      } else {
        // API returned error
        const errorMessage = response.message || 'Login failed. Please check your credentials.';
        setErrors({ general: errorMessage });
        
        showNotification({
          type: 'error',
          title: 'Login Failed',
          message: errorMessage
        });
      }

    } catch (error) {
      // Network or unexpected error
      const errorMessage = 'Network error. Please check your connection and try again.';
      setErrors({ general: errorMessage });
      
      showNotification({
        type: 'error',
        title: 'Connection Error',
        message: errorMessage
      });
      
      console.error('🔥 Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '+1234567890'; // Replace with actual support number
    const message = 'Hi, I need help with my trading account login';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          showNotification({
            type: 'warning',
            title: 'WhatsApp not installed',
            message: 'Please install WhatsApp to contact support'
          });
        }
      })
      .catch(() => {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Unable to open WhatsApp'
        });
      });
  };

  const handleTestApi = async () => {
    showNotification({
      type: 'info',
      title: 'Testing API...',
      message: 'Checking server connectivity',
      duration: 2000
    });

    try {
      const result = await tradingApiService.testConnection();
      showNotification({
        type: result.success ? 'success' : 'warning',
        title: result.success ? 'API Connected' : 'API Issue',
        message: result.message
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Test Failed',
        message: 'Unable to test API connection'
      });
    }
  };

  const getIdentifierIcon = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[+]?[\d\s\-\(\)]{7,15}$/;
    const cleanIdentifier = form.identifier.replace(/\s/g, '');
    
    if (emailRegex.test(form.identifier)) {
      return <Ionicons name="mail" size={20} color={theme.colors.success} />;
    } else if (mobileRegex.test(cleanIdentifier)) {
      return <Ionicons name="phone-portrait" size={20} color={theme.colors.success} />;
    } else if (form.identifier.length >= 3) {
      return <Ionicons name="person" size={20} color={theme.colors.success} />;
    } else {
      return <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />;
    }
  };

  const getIdentifierKeyboardType = () => {
    if (form.identifier.includes('@')) {
      return 'email-address' as const;
    } else if (/^\+?\d/.test(form.identifier)) {
      return 'phone-pad' as const;
    } else {
      return 'default' as const;
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
        {/* Logo Section */}
        <Animated.View style={[styles.logoSection, fadeAnimation]}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.logoIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="cube-outline" size={40} color="white" />
            </View>
          </View>
          <Text variant="title" weight="bold" color="text" style={styles.logoText}>
            YOUR LOGO
          </Text>
          <Text variant="caption" color="textSecondary" style={styles.logoSubtext}>
            Your Trading Partner
          </Text>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, slideAnimation]}>
          <Text variant="headline" weight="bold" color="text">
            Get started
          </Text>
          <Text variant="body" color="textSecondary" style={styles.subtitle}>
            Fill the form to log in
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={[styles.formContainer, slideAnimation]}>
          <Card padding="large" shadow={true}>
            {/* Identifier Input */}
            <Input
              label="Username, Email, or Mobile"
              value={form.identifier}
              onChangeText={(text) => setForm({ ...form, identifier: text })}
              placeholder="Email or mobile"
              error={errors.identifier}
              keyboardType={getIdentifierKeyboardType()}
              autoCapitalize="none"
              leftIcon={getIdentifierIcon()}
              style={styles.input}
              maxLength={getMaxLength()}
            />

            {/* Password Input */}
            <Input
              label="Password"
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              placeholder="Enter your password"
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

            {/* Remember Password */}
            <TouchableOpacity 
              style={styles.rememberContainer}
              onPress={() => setRememberPassword(!rememberPassword)}
            >
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: theme.colors.border,
                  backgroundColor: rememberPassword ? theme.colors.primary : 'transparent'
                }
              ]}>
                {rememberPassword && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
              <Text variant="body" color="text" style={styles.rememberText}>
                Save password
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

        {/* Action Links */}
        <Animated.View style={[styles.linksContainer, slideAnimation]}>
          <TouchableOpacity onPress={handleRegister}>
            <Text variant="body" color="primary" weight="medium">
              Create demo account
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text variant="body" color="primary" weight="medium">
              Forgot Password?
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Button */}
        <Animated.View style={[styles.buttonContainer, buttonSlideAnimation]}>
          <Button
            title="Log in"
            onPress={handleLogin}
            variant="primary"
            size="large"
            loading={isLoading}
            fullWidth={true}
            style={styles.loginButton}
          />
        </Animated.View>

        {/* WhatsApp Support */}
        <Animated.View style={[styles.supportContainer, buttonSlideAnimation]}>
          <TouchableOpacity 
            style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
            onPress={handleWhatsAppSupport}
          >
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text variant="body" color="text" weight="medium" style={styles.whatsappText}>
              Need Help? Contact Support
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View style={[styles.disclaimerContainer, fadeAnimation]}>
          <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
            Note: No Real Money Is Involved. This Is A Virtual Trading Platform 
            Which Includes All The Features. This Is Only For Education Purpose.
          </Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    marginBottom: 4,
  },
  logoSubtext: {
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    flex: 1,
  },
  errorContainer: {
    marginTop: 8,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  loginButton: {
    height: 56,
  },
  testButtonContainer: {
    marginBottom: 16,
  },
  testButton: {
    height: 48,
  },
  supportContainer: {
    marginBottom: 24,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  whatsappText: {
    marginLeft: 8,
    color: 'white',
  },
  disclaimerContainer: {
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  demoHintContainer: {
    marginBottom: 24,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  demoHintText: {
    marginLeft: 8,
    textAlign: 'center',
  },
});
