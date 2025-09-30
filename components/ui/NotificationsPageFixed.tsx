import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
} from 'react-native';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SlidingPage from './SlidingPage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'trade_booked' | 'trade_squared' | 'order_placed';
  timestamp: string;
  date: string;
  isRead?: boolean;
}

interface NotificationsPageProps {
  visible: boolean;
  onClose: () => void;
}

// Sample notification data based on the screenshot
const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Trade Square Off Manually',
    message: 'Trade 54021 is completed on NIFTY25SEP25000CE Buy And Username= DC199797U',
    type: 'trade_squared',
    timestamp: '10:59 AM',
    date: '25 Sep 25',
    isRead: false,
  },
  {
    id: '2',
    title: 'Trade Square Off Manually',
    message: 'Trade 54150 is completed on NIFTY25SEP25100CE Buy And Username= DC199797U',
    type: 'trade_squared',
    timestamp: '10:59 AM',
    date: '25 Sep 25',
    isRead: false,
  },
  {
    id: '3',
    title: 'Trade Booked Manually',
    message: 'NIFTY25SEP25100CE Buy with Qty 1. order placed Successfully @73.75',
    type: 'trade_booked',
    timestamp: '10:59 AM',
    date: '25 Sep 25',
    isRead: false,
  },
  {
    id: '4',
    title: 'Trade Square Off Manually',
    message: 'Trade 54130 is completed on SILVER25DECFUT Buy And Username= DC199797U',
    type: 'trade_squared',
    timestamp: '16:28 PM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '5',
    title: 'Trade Booked Manually',
    message: 'SILVER25DECFUT Buy with Qty 5. order placed Successfully @133959.00',
    type: 'trade_booked',
    timestamp: '16:28 PM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '6',
    title: 'Trade Square Off Manually',
    message: 'Trade 54119 is completed on SILVER25DECFUT Buy And Username= DC199797U',
    type: 'trade_squared',
    timestamp: '16:17 PM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '7',
    title: 'Trade Booked Manually',
    message: 'SILVER25DECFUT Buy with Qty 1. order placed Successfully @134276.00',
    type: 'trade_booked',
    timestamp: '16:17 PM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '8',
    title: 'Trade Booked Manually',
    message: 'NIFTY25SEP25000CE Buy with Qty 1. order placed Successfully @204.55',
    type: 'trade_booked',
    timestamp: '10:08 AM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '9',
    title: 'Trade Square Off Manually',
    message: 'Trade 54020 is completed on TATAPOWER Buy And Username= DC199797U',
    type: 'trade_squared',
    timestamp: '10:07 AM',
    date: '24 Sep 25',
    isRead: true,
  },
  {
    id: '10',
    title: 'Trade Booked Manually',
    message: 'TATAPOWER Buy with Qty 1. order placed Successfully @394.45',
    type: 'trade_booked',
    timestamp: '10:07 AM',
    date: '24 Sep 25',
    isRead: true,
  },
];

const NotificationsPage = memo(({ visible, onClose }: NotificationsPageProps) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [notifications] = useState(SAMPLE_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for fast opening
  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      // Simulate quick loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(notifications.length / itemsPerPage);

  // Get current page notifications
  const currentNotifications = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return notifications.slice(startIndex, endIndex);
  }, [notifications, currentPage]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  }, [totalPages]);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'trade_booked':
        return 'checkmark-circle';
      case 'trade_squared':
        return 'square';
      case 'order_placed':
        return 'add-circle';
      default:
        return 'notifications';
    }
  }, []);

  const getNotificationColor = useCallback((type: string, isRead: boolean) => {
    if (isRead) return theme.colors.textSecondary;
    
    switch (type) {
      case 'trade_booked':
        return theme.colors.success;
      case 'trade_squared':
        return theme.colors.warning;
      case 'order_placed':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  }, [theme.colors]);

  // Skeleton loader for fast opening
  const renderNotificationSkeleton = useCallback(() => (
    <View style={[styles.notificationItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.border }]} />
          <View style={styles.notificationContent}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border, width: '60%', height: 16 }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border, width: '100%', height: 12, marginTop: 8 }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border, width: '80%', height: 12, marginTop: 4 }]} />
          </View>
        </View>
        <View style={styles.notificationMeta}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border, width: 60, height: 12 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.border, width: 50, height: 12, marginTop: 4 }]} />
        </View>
      </View>
    </View>
  ), [theme.colors]);

  const renderSkeletonLoader = useCallback(() => (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <React.Fragment key={`skeleton-${index}`}>
          {renderNotificationSkeleton()}
        </React.Fragment>
      ))}
    </>
  ), [renderNotificationSkeleton]);

  const renderNotificationItem = useCallback(({ item }: { item: NotificationItem }) => (
    <Pressable
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? theme.colors.surface : theme.colors.card,
          borderLeftColor: getNotificationColor(item.type, item.isRead || false),
        },
      ]}
      android_ripple={{ color: theme.colors.primary + '10' }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getNotificationColor(item.type, item.isRead || false) + '20' },
            ]}
          >
            <Ionicons
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={getNotificationColor(item.type, item.isRead || false)}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text
              variant="body"
              weight={item.isRead ? 'medium' : 'semibold'}
              color={item.isRead ? 'textSecondary' : 'text'}
            >
              {item.title}
            </Text>
            <Text
              variant="caption"
              color="textSecondary"
              style={styles.notificationMessage}
              numberOfLines={2}
            >
              {item.message}
            </Text>
          </View>
        </View>
        <View style={styles.notificationMeta}>
          <Text variant="caption" color="textSecondary">
            {item.date}
          </Text>
          <Text variant="caption" color="textSecondary">
            {item.timestamp}
          </Text>
          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
      </View>
    </Pressable>
  ), [theme.colors, getNotificationIcon, getNotificationColor]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.headerStats}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="caption" color="textSecondary">
            Total Notifications
          </Text>
          <Text variant="title" weight="bold" color="primary">
            {notifications.length}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="caption" color="textSecondary">
            Unread
          </Text>
          <Text variant="title" weight="bold" color="warning">
            {notifications.filter(n => !n.isRead).length}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="caption" color="textSecondary">
            Today
          </Text>
          <Text variant="title" weight="bold" color="success">
            {notifications.filter(n => n.date === '25 Sep 25').length}
          </Text>
        </View>
      </View>
    </View>
  ), [theme.colors, notifications]);

  const ListFooterComponent = useMemo(() => (
    <View style={[styles.paginationContainer, { backgroundColor: theme.colors.surface }]}>
      <Pressable
        style={[
          styles.paginationButton,
          {
            backgroundColor: currentPage === 0 ? theme.colors.surface : theme.colors.primary,
            opacity: currentPage === 0 ? 0.5 : 1,
          },
        ]}
        onPress={handlePreviousPage}
        disabled={currentPage === 0}
        android_ripple={{ color: theme.colors.primary + '20' }}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={currentPage === 0 ? theme.colors.textSecondary : '#FFFFFF'}
        />
        <Text
          variant="body"
          weight="medium"
          style={{ color: currentPage === 0 ? theme.colors.textSecondary : '#FFFFFF' }}
        >
          Previous
        </Text>
      </Pressable>

      <View style={styles.pageIndicator}>
        <Text variant="body" color="text" weight="medium">
          Page {currentPage + 1} of {totalPages}
        </Text>
      </View>

      <Pressable
        style={[
          styles.paginationButton,
          {
            backgroundColor: currentPage === totalPages - 1 ? theme.colors.surface : theme.colors.primary,
            opacity: currentPage === totalPages - 1 ? 0.5 : 1,
          },
        ]}
        onPress={handleNextPage}
        disabled={currentPage === totalPages - 1}
        android_ripple={{ color: theme.colors.primary + '20' }}
      >
        <Text
          variant="body"
          weight="medium"
          style={{ color: currentPage === totalPages - 1 ? theme.colors.textSecondary : '#FFFFFF' }}
        >
          Next
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={currentPage === totalPages - 1 ? theme.colors.textSecondary : '#FFFFFF'}
        />
      </Pressable>
    </View>
  ), [theme.colors, currentPage, totalPages, handlePreviousPage, handleNextPage]);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={48} color={theme.colors.textSecondary} />
      <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
        No notifications found
      </Text>
      <Text variant="caption" color="textSecondary">
        Your trading notifications will appear here
      </Text>
    </View>
  ), [theme.colors.textSecondary]);

  return (
    <SlidingPage
      visible={visible}
      title="Notifications"
      onClose={onClose}
      showBackButton={true}
    >
      {isLoading ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={() => renderSkeletonLoader()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={currentNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
    </SlidingPage>
  );
});

NotificationsPage.displayName = 'NotificationsPage';

const styles = StyleSheet.create({
  listHeader: {
    paddingBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    marginTop: 4,
    lineHeight: 18,
  },
  notificationMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  skeletonLine: {
    borderRadius: 4,
    opacity: 0.3,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  pageIndicator: {
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyStateText: {
    textAlign: 'center',
  },
});

export default NotificationsPage;
