import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import SlidingPage from './SlidingPage';
import { tradingApiService, NotificationItem as ApiNotificationItem } from '../../services/tradingApiService';
import { useNotification } from '../../contexts/NotificationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProcessedNotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'trade_booked' | 'trade_squared' | 'order_placed' | 'general';
  timestamp: string;
  date: string;
  isRead: boolean;
  isExpanded: boolean;
  source: string;
  rawData: ApiNotificationItem;
}

interface NotificationsPageProps {
  visible: boolean;
  onClose: () => void;
}

// Helper function to process API notification data
const processNotificationData = (apiNotification: ApiNotificationItem): ProcessedNotificationItem => {
  // Extract title and message from description
  const description = apiNotification.description;
  let title = 'Notification';
  let type: 'trade_booked' | 'trade_squared' | 'order_placed' | 'general' = 'general';

  // Determine notification type and title based on description content
  if (description.includes('order placed Successfully')) {
    title = 'Trade Booked Successfully';
    type = 'trade_booked';
  } else if (description.includes('is completed')) {
    title = 'Trade Completed';
    type = 'trade_squared';
  } else if (description.includes('Trade Book')) {
    title = 'Trade Book Updated';
    type = 'order_placed';
  } else {
    title = 'Trading Notification';
    type = 'general';
  }

  // Format date and time
  const createdDate = new Date(apiNotification.createdDate);
  const now = new Date();
  const isToday = createdDate.toDateString() === now.toDateString();
  const isYesterday = createdDate.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  let dateStr = '';
  if (isToday) {
    dateStr = 'Today';
  } else if (isYesterday) {
    dateStr = 'Yesterday';
  } else {
    dateStr = createdDate.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: '2-digit' 
    });
  }

  const timeStr = createdDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return {
    id: apiNotification.id.toString(),
    title,
    message: description,
    type,
    timestamp: timeStr,
    date: dateStr,
    isRead: apiNotification.seen !== 0,
    isExpanded: false,
    source: apiNotification.source,
    rawData: apiNotification,
  };
};

const NotificationsPage = memo(({ visible, onClose }: NotificationsPageProps) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState<ProcessedNotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'today'>('all');

  // Load notifications from API
  const loadNotifications = useCallback(async (page: number = 1, refresh: boolean = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setHasError(false);
      } else if (page === 1) {
        setIsLoading(true);
        setHasError(false);
      } else {
        // Page navigation loading
        setIsPageLoading(true);
        setHasError(false);
      }

      const response = await tradingApiService.getNotifications(page);
      
      if (response.data && response.data.length > 0) {
        const processedNotifications = response.data.map(processNotificationData);
        
        // Always replace data for pagination (not append)
        setNotifications(processedNotifications);

        // Get total pages from the first item
        if (response.data[0]?.total_Page) {
          setTotalPages(response.data[0].total_Page);
        }
        
        setCurrentPage(page);
      } else {
        // No data returned, clear notifications
        setNotifications([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setHasError(true);
      showNotification({
        type: 'error',
        title: 'Failed to load notifications',
        message: 'Please check your connection and try again'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsPageLoading(false);
    }
  }, [showNotification]);

  // Handle filter changes
  const handleFilterChange = useCallback((filter: 'all' | 'unread' | 'today') => {
    setActiveFilter(filter);
  }, []);

  // Handle pagination
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      loadNotifications(currentPage - 1);
    }
  }, [currentPage, loadNotifications]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadNotifications(currentPage + 1);
    }
  }, [currentPage, totalPages, loadNotifications]);

  // Filter notifications based on active filter
  const currentNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'today':
        return notifications.filter(n => n.date === 'Today');
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  // Handle notification item press to toggle expand
  const toggleNotificationExpand = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isExpanded: !notification.isExpanded }
          : notification
      )
    );
  }, []);

  // Load initial notifications when page becomes visible
  useEffect(() => {
    if (visible) {
      loadNotifications(1);
    }
  }, [visible, loadNotifications]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadNotifications(1, true);
  }, [loadNotifications]);

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

  const renderNotificationItem = useCallback(({ item }: { item: ProcessedNotificationItem }) => (
    <Pressable
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? theme.colors.surface : theme.colors.card,
          borderLeftColor: getNotificationColor(item.type, item.isRead || false),
        },
      ]}
      onPress={() => toggleNotificationExpand(item.id)}
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
              numberOfLines={item.isExpanded ? undefined : 1}
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
  ), [theme.colors, getNotificationIcon, getNotificationColor, toggleNotificationExpand]);

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
            {notifications.filter(n => !n.isRead).length}
          </Text>
        </Pressable>
        {/* <Pressable
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
            {notifications.filter(n => n.date === 'Today').length}
          </Text>
        </Pressable> */}
      </View>
      
      {/* Pagination Controls */}
      <View style={[styles.paginationContainer, { backgroundColor: theme.colors.surface }]}>
        <Pressable
          style={[
            styles.paginationButton,
            {
              backgroundColor: (currentPage === 1 || isPageLoading) ? theme.colors.surface : theme.colors.primary,
              opacity: (currentPage === 1 || isPageLoading) ? 0.5 : 1,
            },
          ]}
          onPress={handlePreviousPage}
          disabled={currentPage === 1 || isPageLoading}
          android_ripple={{ color: theme.colors.primary + '20' }}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={(currentPage === 1 || isPageLoading) ? theme.colors.textSecondary : '#FFFFFF'}
          />
          <Text
            variant="body"
            weight="medium"
            style={{ color: (currentPage === 1 || isPageLoading) ? theme.colors.textSecondary : '#FFFFFF' }}
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
              backgroundColor: (currentPage === totalPages || isPageLoading) ? theme.colors.surface : theme.colors.primary,
              opacity: (currentPage === totalPages || isPageLoading) ? 0.5 : 1,
            },
          ]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages || isPageLoading}
          android_ripple={{ color: theme.colors.primary + '20' }}
        >
          <Text
            variant="body"
            weight="medium"
            style={{ color: (currentPage === totalPages || isPageLoading) ? theme.colors.textSecondary : '#FFFFFF' }}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={(currentPage === totalPages || isPageLoading) ? theme.colors.textSecondary : '#FFFFFF'}
          />
        </Pressable>
      </View>
    </View>
  ), [theme.colors, notifications, currentPage, totalPages, handlePreviousPage, handleNextPage, activeFilter, handleFilterChange, isPageLoading]);

  const ListEmptyComponent = useMemo(() => {
    if (hasError) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="body" color="error" style={styles.emptyStateText}>
            Failed to load notifications
          </Text>
          <Text variant="caption" color="textSecondary">
            Please check your connection and try again
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadNotifications(1, true)}
            android_ripple={{ color: theme.colors.primary + '20' }}
          >
            <Text variant="body" weight="medium" style={{ color: '#FFFFFF' }}>
              Retry
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-off" size={48} color={theme.colors.textSecondary} />
        <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
          No notifications found
        </Text>
        <Text variant="caption" color="textSecondary">
          Your trading notifications will appear here
        </Text>
      </View>
    );
  }, [theme.colors, hasError, loadNotifications]);

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
        <>
          <FlatList
            data={currentNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            removeClippedSubviews={true}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          />
          
          {/* Page Loading Overlay */}
          {isPageLoading && (
            <View style={styles.pageLoadingOverlay}>
              <View style={[styles.loadingIndicator, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="refresh" size={24} color={theme.colors.primary} />
                <Text variant="body" color="primary" weight="medium">
                  Loading page {currentPage}...
                </Text>
              </View>
            </View>
          )}
        </>
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
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  pageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default NotificationsPage;
