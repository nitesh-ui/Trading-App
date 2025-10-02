/**
 * Authentication utilities
 * Helper functions for managing authentication state across the app
 */

import { router } from 'expo-router';
import { tradingApiService } from './tradingApiService';
import { sessionManager } from './sessionManager';

export class AuthUtils {
  /**
   * Check if user is authenticated with proper session
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      // Use tradingApiService's comprehensive session validation
      // This checks both session existence and validity (including extended validity)
      const tradingApiLoggedIn = await tradingApiService.isLoggedIn();
      
      // If tradingApiService says user is logged in, check sessionManager for completeness
      if (tradingApiLoggedIn) {
        const sessionManagerUser = await sessionManager.ensureSessionLoaded();
        if (!sessionManagerUser) {
          // Sync sessionManager with tradingApiService data
          const userInfo = await tradingApiService.getUserInfo();
          if (userInfo) {
            // Note: We don't have the token from tradingApiService, but we know it's valid
            await sessionManager.saveSession(
              {
                id: userInfo.sponsorid || userInfo.username,
                name: userInfo.fullname,
                email: userInfo.email,
                username: userInfo.username,
                mobile: userInfo.mobileno,
                tenantId: userInfo.tenantId?.toString(),
              },
              'session_from_tradingapi' // placeholder token since it's already validated
            );
          }
        }
      }

      return tradingApiLoggedIn;
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user info from both sources
   */
  static async getCurrentUser(): Promise<any> {
    try {
      const tradingApiUser = await tradingApiService.getUserInfo();
      const sessionManagerUser = sessionManager.getCurrentUser();

      // Return the more complete user data
      return tradingApiUser || sessionManagerUser;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  /**
   * Logout user from both systems
   */
  static async logout(): Promise<void> {
    try {
      // Clear session from both services
      await tradingApiService.logout();
      await sessionManager.clearSession();

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  }

  /**
   * Redirect to login if not authenticated
   */
  static async requireAuth(): Promise<boolean> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      router.replace('/auth/login');
      return false;
    }
    return true;
  }

  /**
   * Check if session is expired and redirect to login
   */
  static async checkSessionExpiry(): Promise<boolean> {
    try {
      // Use the tradingApiService's built-in session validity check which considers extended validity
      const isValid = await tradingApiService.isSessionValid();
      
      if (!isValid) {
        console.log('⚠️ Session expired, redirecting to login');
        await this.logout();
        router.replace('/auth/login');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking session expiry:', error);
      return false;
    }
  }

  /**
   * Initialize authentication state on app startup
   */
  static async initializeAuth(): Promise<void> {
    try {
      const isAuth = await this.isAuthenticated();
      if (isAuth) {
        // Check if session is expired
        const sessionValid = await this.checkSessionExpiry();
        if (!sessionValid) {
          return;
        }

        console.log('✅ User is authenticated');
        // User is authenticated and session is valid
      } else {
        console.log('ℹ️ User is not authenticated');
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
    }
  }
}

export default AuthUtils;
