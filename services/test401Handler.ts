/**
 * Test utilities for 401 handling
 * This can be used during development to test the global 401 handling
 */

import { tradingApiService } from './tradingApiService';
import AuthUtils from './authUtils';

export class Test401Handler {
  /**
   * Simulate a 401 response to test the global handler
   * Call this from a component to test the flow
   */
  static async simulate401(): Promise<void> {
    console.log('🧪 Simulating 401 response...');
    
    try {
      // Directly call the global handler to test it
      await AuthUtils.handle401Unauthorized();
    } catch (error) {
      console.error('❌ Error in 401 simulation:', error);
    }
  }

  /**
   * Force clear session to test authentication flow
   */
  static async forceClearSession(): Promise<void> {
    console.log('🧪 Force clearing session...');
    
    try {
      await tradingApiService.clearSessionData();
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }

  /**
   * Test if global notification service is working
   */
  static testGlobalNotifications(): void {
    console.log('🧪 Testing global notifications...');
    
    try {
      const { globalNotificationService } = require('./globalNotificationService');
      
      globalNotificationService.showNotification({
        type: 'info',
        title: 'Test notification from service',
        message: 'This is a test to verify global notifications work'
      });
      
      console.log('✅ Global notification test sent');
    } catch (error) {
      console.error('❌ Error testing global notifications:', error);
    }
  }
}

// Export for development testing
export default Test401Handler;
