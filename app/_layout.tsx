import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// import 'react-native-reanimated';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useColorScheme } from '../hooks/useColorScheme';
import { cleanupNetworkListener, prefetchCriticalData, queryClient, setupNetworkListener } from '../services/queryClient';
import { sessionManager } from '../services/sessionManager';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Load user session on app startup
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Setup network listener for smart query refetching
        setupNetworkListener();
        
        // Load user session
        const user = await sessionManager.loadSession();
        if (user) {
          console.log('✅ User session restored:', user.username);
        } else {
          console.log('ℹ️ No existing session found');
        }

        // Prefetch critical data after session is loaded
        await prefetchCriticalData();
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };

    if (loaded) {
      initializeApp();
    }

    // Cleanup on unmount
    return () => {
      cleanupNetworkListener();
    };
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NotificationProvider>
              <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                  <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </NavigationThemeProvider>
            </NotificationProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
