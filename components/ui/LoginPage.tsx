import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Input, Text } from '../../components/atomic';
import SlidingPage from '../../components/ui/SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { authService } from '../../services/authService';

interface LoginPageProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export default function LoginPage({ visible, onClose, onLoginSuccess }: LoginPageProps) {
  const { theme } = useTheme();
  const [credentials, setCredentials] = useState({
    emailOrUsername: 'shashir8540@gmail.com', // Pre-filled for demo
    password: '123456', // Pre-filled for demo
    rememberMe: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!credentials.emailOrUsername.trim() || !credentials.password.trim()) {
      Alert.alert('Error', 'Please enter both email/username and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({
        emailOrUsername: credentials.emailOrUsername.trim(),
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });

      if (result.success) {
        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => {
              onLoginSuccess?.();
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await authService.autoLogin();
      if (success) {
        Alert.alert('Success', 'Auto-login successful!', [
          {
            text: 'OK',
            onPress: () => {
              onLoginSuccess?.();
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Auto-login Failed', 'Please login manually');
      }
    } catch (error) {
      Alert.alert('Error', 'Auto-login failed. Please try manual login.');
      console.error('Auto-login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title="Login to Trading Account"
    >
      <View style={styles.container}>
        <Card padding="large" style={styles.loginCard}>
          <View style={styles.header}>
            <Text variant="headline" weight="bold" color="text" style={styles.title}>
              Sign In
            </Text>
            <Text variant="body" color="textSecondary" style={styles.subtitle}>
              Enter your credentials to access real market data
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email or Username"
              value={credentials.emailOrUsername}
              onChangeText={(text) => setCredentials(prev => ({ ...prev, emailOrUsername: text }))}
              placeholder="Enter email or username"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Input
              label="Password"
              value={credentials.password}
              onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
              placeholder="Enter password"
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setCredentials(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
            >
              <View style={[
                styles.checkbox,
                { borderColor: theme.colors.border },
                credentials.rememberMe && { backgroundColor: theme.colors.primary }
              ]}>
                {credentials.rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text variant="body" color="text" style={styles.checkboxLabel}>
                Remember me
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text variant="body" weight="semibold" style={styles.primaryButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { borderColor: theme.colors.border }]}
              onPress={handleAutoLogin}
              disabled={isLoading}
            >
              <Text
                variant="body"
                weight="semibold"
                style={{ ...styles.secondaryButtonText, color: theme.colors.primary }}
              >
                {isLoading ? 'Auto-Login...' : 'Quick Demo Login'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text variant="caption" color="textSecondary" style={styles.footerText}>
              Demo credentials are pre-filled for testing
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.footerText}>
              Your session will be saved for 24 hours
            </Text>
          </View>
        </Card>
      </View>
    </SlidingPage>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loginCard: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
