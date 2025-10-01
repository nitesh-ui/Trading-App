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
import { tradingApiService } from '../../services/tradingApiService';
import { format, isToday } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationItem {
  id: number;
  userID: number;
  description: string;
  type: number;
  seen: number;
  createdDate: string;
  createdDateString: string;
  email: string;
  source: string;
  userip: string;
  total_Page: number;
  fullname: string;
  username: string;
  location: string;
  deviceName: string;
}

interface NotificationsPageProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationsPage = memo(({ visible, onClose }: NotificationsPageProps) => {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1); // API uses 1-based pagination
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'today'>('all');

  // Fetch notifications when page changes
  useEffect(() => {
    async function fetchNotifications() {
      if (!visible) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await tradingApiService.getNotifications(currentPage);
        setNotifications(response.data);
        if (response.data.length > 0) {
          setTotalPages(response.data[0].total_Page);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        console.error('Failed to fetch notifications:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNotifications();
  }, [currentPage, visible]);

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
  
  // Filter notifications based on active filter and format dates
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    switch (activeFilter) {
      case 'unread':
        filtered = notifications.filter(n => n.seen === 0);
        break;
      case 'today':
        filtered = notifications.filter(n => {
          const notificationDate = new Date(n.createdDate);
          return isToday(notificationDate);
        });
        break;
      case 'all':
      default:
        filtered = notifications;
        break;
    }
    return filtered;
  }, [notifications, activeFilter]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleFilterChange = useCallback((filter: 'all' | 'unread' | 'today') => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  const getNotificationIcon = useCallback((type: number) => {
    // Map notification types to icons based on type number
    switch (type) {
      case 1: // Trade booked
        return 'checkmark-circle';
      case 2: // Trade squared off
        return 'square';
      case 3: // Order placed
        return 'add-circle';
      default:
        return 'notifications';
    }
  }, []);

  const getNotificationColor = useCallback((type: number, seen: number) => {
    if (seen === 1) return theme.colors.textSecondary;
    
    switch (type) {
      case 1: // Trade booked
        return theme.colors.success;
      case 2: // Trade squared off
        return theme.colors.warning;
      case 3: // Order placed
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
          backgroundColor: item.seen === 1 ? theme.colors.surface : theme.colors.card,
          borderLeftColor: getNotificationColor(item.type, item.seen),
        },
      ]}
      android_ripple={{ color: theme.colors.primary + '10' }}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getNotificationColor(item.type, item.seen) + '20' },
            ]}
          >
            <Ionicons
              name={getNotificationIcon(item.type)}
              size={20}
              color={getNotificationColor(item.type, item.seen)}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text
              variant="body"
              weight={item.seen === 1 ? 'medium' : 'semibold'}
              color={item.seen === 1 ? 'textSecondary' : 'text'}
            >
              {item.username}
            </Text>
            <Text
              variant="caption"
              color="textSecondary"
              style={styles.notificationMessage}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
        </View>
        <View style={styles.notificationMeta}>
          <Text variant="caption" color="textSecondary">
            {format(new Date(item.createdDate), 'dd MMM yy')}
          </Text>
          <Text variant="caption" color="textSecondary">
            {format(new Date(item.createdDate), 'HH:mm')}
          </Text>
          {item.seen === 0 && (
            <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
          )}
        </View>
      </View>
    </Pressable>
  ), [theme.colors, getNotificationIcon, getNotificationColor]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.listHeader}>
      <View style={styles.headerStats}>
        <Pressable
          style={[
            styles.statCard,
            {
              backgroundColor: activeFilter === 'all' ? theme.colors.primary + '20' : theme.colors.surface,
              borderWidth: activeFilter === 'all' ? 2 : 0,
              borderColor: activeFilter === 'all' ? theme.colors.primary : 'transparent',
            },
          ]}
          onPress={() => handleFilterChange('all')}
          android_ripple={{ color: theme.colors.primary + '10' }}
        >
          <Text variant="caption" color={activeFilter === 'all' ? 'primary' : 'textSecondary'}>
            Total Notifications
          </Text>
          <Text variant="title" weight="bold" color="primary">
            {notifications.length}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.statCard,
            {
              backgroundColor: activeFilter === 'unread' ? theme.colors.warning + '20' : theme.colors.surface,
              borderWidth: activeFilter === 'unread' ? 2 : 0,
              borderColor: activeFilter === 'unread' ? theme.colors.warning : 'transparent',
            },
          ]}
          onPress={() => handleFilterChange('unread')}
          android_ripple={{ color: theme.colors.warning + '10' }}
        >
          <Text variant="caption" color={activeFilter === 'unread' ? 'warning' : 'textSecondary'}>
            Unread
          </Text>
          <Text variant="title" weight="bold" color="warning">
            {notifications.filter(n => n.seen === 0).length}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.statCard,
            {
              backgroundColor: activeFilter === 'today' ? theme.colors.success + '20' : theme.colors.surface,
              borderWidth: activeFilter === 'today' ? 2 : 0,
              borderColor: activeFilter === 'today' ? theme.colors.success : 'transparent',
            },
          ]}
          onPress={() => handleFilterChange('today')}
          android_ripple={{ color: theme.colors.success + '10' }}
        >
          <Text variant="caption" color={activeFilter === 'today' ? 'success' : 'textSecondary'}>
            Today
          </Text>
          <Text variant="title" weight="bold" color="success">
            {notifications.filter(n => isToday(new Date(n.createdDate))).length}
          </Text>
        </Pressable>
      </View>
      
      {/* Pagination Controls */}
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
            Prev
          </Text>
        </Pressable>

        <View style={styles.pageIndicator}>
          <Text variant="body" color="text" weight="medium">
            Page {currentPage} of {totalPages}
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
    </View>
  ), [theme.colors, notifications, currentPage, totalPages, handlePreviousPage, handleNextPage, activeFilter, handleFilterChange]);

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
      ) : error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="body" color="error" style={styles.emptyStateText}>
            {error}
          </Text>
          <Text variant="caption" color="textSecondary">
            Please try again later
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          refreshing={isLoading}
          onRefresh={() => setCurrentPage(1)}
        />
      )}
    </SlidingPage>
  );
});

NotificationsPage.displayName = 'NotificationsPage';

const styles = StyleSheet.create({
  listHeader: {
    paddingBottom: 8,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
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
