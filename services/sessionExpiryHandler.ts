import { router } from 'expo-router';
import { tradingApiService } from './tradingApiService';

/**
 * Session Expiry Handler
 * Manages session expiry scenarios and redirects user to login when needed
 */
export class SessionExpiryHandler {
  private static instance: SessionExpiryHandler;
  private isHandlingExpiry = false;

  static getInstance(): SessionExpiryHandler {
    if (!SessionExpiryHandler.instance) {
      SessionExpiryHandler.instance = new SessionExpiryHandler();
    }
    return SessionExpiryHandler.instance;
  }

  /**
   * Handle session expiry by clearing data and redirecting to login
   */
  async handleSessionExpiry(reason: string = 'Session expired'): Promise<void> {
    // Prevent multiple simultaneous expiry handling
    if (this.isHandlingExpiry) {
      console.log('⚠️ Session expiry already being handled, skipping...');
      return;
    }

    this.isHandlingExpiry = true;

    try {
      console.log('🔄 Handling session expiry:', reason);

      // Get session stats before clearing for debugging
      try {
        const stats = await tradingApiService.getSessionStats();
        console.log('📊 Session stats before expiry:', stats);
      } catch (error) {
        console.log('⚠️ Could not get session stats before expiry');
      }

      // Clear all session data
      await tradingApiService.clearSessionData();

      // Navigate to login screen
      router.replace('/auth/login');

      console.log('✅ Session expiry handled, redirected to login');
    } catch (error) {
      console.error('❌ Error handling session expiry:', error);
    } finally {
      // Reset the flag after a short delay to allow navigation to complete
      setTimeout(() => {
        this.isHandlingExpiry = false;
      }, 1000);
    }
  }

  /**
   * Check if currently handling session expiry
   */
  isHandling(): boolean {
    return this.isHandlingExpiry;
  }

  /**
   * Wrap API calls with automatic session expiry handling
   */
  async withSessionHandling<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        await this.handleSessionExpiry('API session expired');
        throw error; // Re-throw so calling code can handle accordingly
      }
      throw error;
    }
  }

  /**
   * Check session validity and handle expiry if needed
   */
  async checkAndHandleSessionValidity(): Promise<boolean> {
    const isValid = await tradingApiService.isSessionValid();
    if (!isValid) {
      await this.handleSessionExpiry('Session validity check failed');
      return false;
    }
    return true;
  }

  /**
   * Check session health and log detailed information (for debugging)
   */
  async checkSessionHealth(): Promise<boolean> {
    try {
      console.log('🔍 Performing session health check...');

      const stats = await tradingApiService.getSessionStats();
      console.log('📊 Current session stats:', stats);

      if (!stats.hasSession) {
        console.log('❌ No session found');
        return false;
      }

      const isValid = await tradingApiService.isSessionValid();
      console.log('✅ Session validity check result:', isValid);

      if (!isValid) {
        console.log('⚠️ Session invalid, triggering expiry handler');
        await this.handleSessionExpiry('Session health check failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error during session health check:', error);
      return false;
    }
  }
}

export const sessionExpiryHandler = SessionExpiryHandler.getInstance();
