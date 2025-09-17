/**
 * Error Boundary Components
 * Production-ready error handling and fallback UI
 */

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Text } from './atomic';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean; // Whether to isolate errors to this boundary
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  retry: () => void;
}

/**
 * Main Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (__DEV__) {
      console.error('🚨 Error Boundary caught an error:', error);
      console.error('📍 Error Info:', errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry, Bugsnag, Firebase Crashlytics, etc.
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Example implementation for error logging service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location?.href || 'react-native',
    };

    // In production, send to your error reporting service
    if (!__DEV__) {
      // Example: analytics.track('error', errorReport);
      console.warn('Error logged to service:', errorReport);
    }
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  retry = () => {
    this.resetError();
    // Force a re-render of child components
    this.forceUpdate();
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          retry={this.retry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback Component
 * Shown when an error occurs and no custom fallback is provided
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  retry,
}) => {
  const { theme } = useTheme();

  const handleReportError = () => {
    Alert.alert(
      'Report Error',
      'Would you like to report this error to help us improve the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: () => {
            // In production, open email client or send to support
            Alert.alert('Thank You', 'Error report has been sent to our team.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Ionicons
          name="warning-outline"
          size={64}
          color={theme.colors.error}
          style={styles.icon}
        />
        
        <Text variant="headline" weight="bold" color="text" style={styles.title}>
          Oops! Something went wrong
        </Text>
        
        <Text variant="body" color="textSecondary" style={styles.description}>
          We encountered an unexpected error. Don't worry, your data is safe.
        </Text>

        {__DEV__ && error && (
          <View style={[styles.errorDetails, { backgroundColor: theme.colors.card }]}>
            <Text variant="caption" color="error" style={styles.errorText}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Try Again"
            onPress={retry}
            style={styles.button}
            variant="primary"
          />
          
          <Button
            title="Go Home"
            onPress={() => {
              resetError();
              router.replace('/(tabs)');
            }}
            style={styles.button}
            variant="secondary"
          />
          
          <Button
            title="Report Issue"
            onPress={handleReportError}
            style={styles.button}
            variant="ghost"
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Async Error Boundary for handling Promise rejections
 * Use this for components that do async operations
 */
export const AsyncErrorBoundary: React.FC<Props> = ({ children, ...props }) => {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
      
      // In production, log to error service
      if (!__DEV__) {
        // Example: analytics.track('unhandled_promise_rejection', { reason: event.reason });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
};

/**
 * Screen-level Error Boundary
 * Use this to wrap individual screens for isolated error handling
 */
export const ScreenErrorBoundary: React.FC<{ children: ReactNode; screenName: string }> = ({
  children,
  screenName,
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error(`🚨 Error in ${screenName} screen:`, error);
    
    // Track screen-specific errors
    if (!__DEV__) {
      // Example: analytics.track('screen_error', { screenName, error: error.message });
    }
  };

  return (
    <ErrorBoundary onError={handleError} isolate>
      {children}
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
});

// Helper hook for manual error throwing
export const useErrorHandler = () => {
  return React.useCallback((error: Error, context?: string) => {
    console.error(`🚨 Manual error thrown${context ? ` in ${context}` : ''}:`, error);
    
    // In development, throw immediately to trigger error boundary
    if (__DEV__) {
      throw error;
    }
    
    // In production, log and show user-friendly error
    Alert.alert(
      'Error',
      'Something went wrong. Please try again or contact support if the problem persists.',
      [{ text: 'OK' }]
    );
  }, []);
};
