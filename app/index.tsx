import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AuthUtils from '../services/authUtils';
import { sessionManager } from '../services/sessionManager';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Use AuthUtils for comprehensive authentication check
        const isAuth = await AuthUtils.isAuthenticated();
        
        if (isAuth) {
          // Double-check session expiry
          const sessionValid = await AuthUtils.checkSessionExpiry();
          if (sessionValid) {
            setIsAuthenticated(true);
            console.log('✅ User session is valid, redirecting to tabs');
          } else {
            setIsAuthenticated(false);
            console.log('⚠️ Session expired, redirecting to login');
          }
        } else {
          setIsAuthenticated(false);
          console.log('ℹ️ No valid session, redirecting to login');
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/(tabs)" : "/auth/login"} />;
}
