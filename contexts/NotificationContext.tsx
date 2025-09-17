import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useCallback, useContext, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '../components/atomic';
import { useTheme } from './ThemeContext';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  hideNotification: (id: string) => void;
  notificationCount: number;
  incrementNotificationCount: () => void;
  clearNotificationCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const { width: screenWidth } = Dimensions.get('window');

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { theme } = useTheme();
  const timeoutsRef = React.useRef<Map<string, number>>(new Map());

  const hideNotification = useCallback((id: string) => {
    // Use setTimeout to avoid scheduling updates during render
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 0);
    
    // Clear timeout if it exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 4000,
    };

    // Use setTimeout to avoid scheduling updates during render
    setTimeout(() => {
      setNotifications(prev => [...prev, newNotification]);
    }, 0);

    // Auto-hide after duration
    const timeout = setTimeout(() => {
      hideNotification(id);
    }, newNotification.duration);
    
    // Store timeout reference for cleanup
    timeoutsRef.current.set(id, timeout as number);
  }, [hideNotification]);

  const incrementNotificationCount = useCallback(() => {
    setNotificationCount(prev => prev + 1);
  }, []);

  const clearNotificationCount = useCallback(() => {
    setNotificationCount(0);
  }, []);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const getNotificationStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.success,
          icon: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error,
          icon: 'alert-circle' as const,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning,
          icon: 'warning' as const,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info,
          icon: 'information-circle' as const,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          icon: 'notifications' as const,
        };
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      hideNotification, 
      notificationCount, 
      incrementNotificationCount, 
      clearNotificationCount 
    }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => hideNotification(notification.id)}
            styles={getNotificationStyles(notification.type)}
          />
        ))}
      </View>
    </NotificationContext.Provider>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
  styles: {
    backgroundColor: string;
    icon: keyof typeof Ionicons.glyphMap;
  };
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  styles: notificationStyles,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const handleDismiss = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [slideAnim, opacityAnim, onDismiss]);

  React.useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss animation
    const timer = setTimeout(() => {
      handleDismiss();
    }, notification.duration! - 300);

    return () => clearTimeout(timer);
  }, [handleDismiss, notification.duration]);

  return (
    <Animated.View
      style={[
        styles.notification,
        {
          backgroundColor: notificationStyles.backgroundColor,
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={notificationStyles.icon}
          size={24}
          color="white"
          style={styles.icon}
        />
        
        <View style={styles.textContainer}>
          <Text variant="body" weight="semibold" style={styles.title}>
            {notification.title}
          </Text>
          {notification.message && (
            <Text variant="caption" style={styles.message}>
              {notification.message}
            </Text>
          )}
        </View>

        {notification.action && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              notification.action!.onPress();
              handleDismiss();
            }}
          >
            <Text variant="caption" weight="semibold" style={styles.actionText}>
              {notification.action.label}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  notification: {
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: 'white',
    marginBottom: 2,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: {
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
});
