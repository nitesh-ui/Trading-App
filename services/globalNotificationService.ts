/**
 * Global notification service
 * Allows any service to show notifications without direct access to React context
 */

interface NotificationData {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

class GlobalNotificationService {
  private static instance: GlobalNotificationService;
  private notificationHandler?: (notification: NotificationData) => void;

  static getInstance(): GlobalNotificationService {
    if (!GlobalNotificationService.instance) {
      GlobalNotificationService.instance = new GlobalNotificationService();
    }
    return GlobalNotificationService.instance;
  }

  /**
   * Set the notification handler (called from NotificationContext)
   */
  setNotificationHandler(handler: (notification: NotificationData) => void): void {
    this.notificationHandler = handler;
  }

  /**
   * Show a notification
   */
  showNotification(notification: NotificationData): void {
    if (this.notificationHandler) {
      this.notificationHandler(notification);
    } else {
      console.log('📢 Notification:', notification.title, notification.message || '');
    }
  }

  /**
   * Clear the notification handler
   */
  clearNotificationHandler(): void {
    this.notificationHandler = undefined;
  }
}

export const globalNotificationService = GlobalNotificationService.getInstance();
export type { NotificationData };
