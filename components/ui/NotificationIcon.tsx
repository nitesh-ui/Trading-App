import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../atomic';
import { useNotificationCount } from '../../hooks/useNotificationCount';

interface NotificationIconProps {
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: any;
}

export function NotificationIcon({
  onPress,
  size = 20,
  color = '#007AFF',
  backgroundColor = 'transparent',
  borderColor = '#E5E5E7',
  style,
}: NotificationIconProps) {
  const { notificationCount } = useNotificationCount();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          borderWidth: borderColor !== 'transparent' ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
    >
      <Ionicons name="notifications" size={size} color={color} />
      
      {/* Notification Count Badge */}
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text
            variant="caption"
            weight="bold"
            style={styles.badgeText}
          >
            {notificationCount > 99 ? '99+' : notificationCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 12,
    textAlign: 'center' as const,
    color: 'white',
    fontWeight: 'bold' as const,
  },
});
