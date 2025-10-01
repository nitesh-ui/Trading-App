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
      // Check both tradingApiService and sessionManager for complete validation
      const tradingApiLoggedIn = await tradingApiService.isLoggedIn();
      const sessionManagerLoggedIn = sessionManager.getCurrentUser() !== null;

      // Both should be true for complete authentication
      return tradingApiLoggedIn && sessionManagerLoggedIn;
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
      const sessionData = await tradingApiService.getSessionData();
      if (sessionData?.sessionValidity) {
        const expiryDate = new Date(sessionData.sessionValidity);
        const now = new Date();
        
        if (expiryDate <= now) {
          console.log('⚠️ Session expired, redirecting to login');
          await this.logout();
          router.replace('/auth/login');
          return false;
        }
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
