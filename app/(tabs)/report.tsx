import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    Text as RNText,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { Card, Text } from '../../components/atomic';
import NotificationsPage from '../../components/ui/NotificationsPage';
import { NotificationIcon } from '../../components/ui/NotificationIcon';
import { TransactionFilterDrawer, TransactionFilters, ScriptExchange, CurrentPosition } from '../../components/ui/TransactionFilterDrawer';
import WalletPage from '../../components/ui/WalletPage';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { tradingApiService, TransactionHistoryItem } from '../../services/tradingApiService';
import { sessionManager } from '../../services/sessionManager';
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

// Use TransactionHistoryItem from API service
// No need for local Transaction interface

export default function ReportScreen() {
  const { theme, isDark } = useTheme();
  const { showNotification } = useNotification();
  const { handle401 } = useAuthErrorHandler();
  
  // State management
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    scriptExchange: 'All',
    currentPosition: 'All',
  });
  
  // UI state
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);

  const styles = createStyles(theme);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const sessionToken = sessionManager.getToken();
      if (!sessionToken) {
        setError('Please log in to view transactions');
        return;
      }

      // Format dates for API (YYYY-MM-DD)
      const startDate = filters.startDate.toISOString().split('T')[0];
      const endDate = filters.endDate.toISOString().split('T')[0];

      const response = await tradingApiService.getTransactionHistoryForReports({
        pageNo: page,
        startDate,
        endDate,
        scriptExchange: filters.scriptExchange === 'All' ? 'All' : filters.scriptExchange,
        currentPosition: filters.currentPosition === 'All' ? 'All' : filters.currentPosition,
      });

      if (response.data && response.data.length > 0) {
        // Transform API response to match our interface
        const transformedTransactions: TransactionHistoryItem[] = response.data.map((item: any) => ({
          id: item.completedtradeid,
          tradeSymbol: item.tradeSymbol,
          currentPosition: item.currentPosition,
          strategy: item.strategyname || 'Manual',
          status: item.status,
          entryTime: `${item.entrydate} ${item.entrytime}`,
          exitTime: `${item.exitDate} ${item.exittime}`,
          entryPrice: item.entryprice,
          exitPrice: item.exitprice,
          qty: item.qty,
          profitLoss: item.profitorloss,
          scriptExchange: item.scriptExchange,
          total_Page: item.total_Page,
        }));

        setTransactions(transformedTransactions);
        setTotalPages(transformedTransactions[0]?.total_Page || 1);
        setCurrentPage(page);
      } else {
        setTransactions([]);
        setTotalPages(1);
      }

      if (response.message && response.message !== 'Transaction history fetched successfully') {
        showNotification({
          type: 'info',
          title: response.message,
        });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
      showNotification({
        type: 'error',
        title: 'Failed to fetch transactions',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, sessionManager, showNotification]);

  // Load transactions on component mount and filter change
  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'settled':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPositionColor = (position: string) => {
    return position.toLowerCase() === 'buy' ? theme.colors.success : theme.colors.error;
  };

  const handleWalletPress = useCallback(() => {
    setIsWalletPageVisible(true);
  }, []);

  const handleNotificationPress = useCallback(() => {
    setIsNotificationsPageVisible(true);
  }, []);

  const handleCloseNotificationsPage = useCallback(() => {
    setIsNotificationsPageVisible(false);
  }, []);

  const handleCloseWalletPage = useCallback(() => {
    setIsWalletPageVisible(false);
  }, []);

  const handleFilterPress = useCallback(() => {
    setIsFilterDrawerVisible(true);
  }, []);

  const handleCloseFilterDrawer = useCallback(() => {
    setIsFilterDrawerVisible(false);
  }, []);

  const handleFiltersChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  // Pagination handlers
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      fetchTransactions(currentPage - 1);
    }
  }, [currentPage, fetchTransactions]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchTransactions(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchTransactions]);

  const handleRefresh = useCallback(() => {
    fetchTransactions(currentPage, true);
  }, [currentPage, fetchTransactions]);

  const handleReportPress = () => {
    showNotification({
      type: 'info',
      title: 'Advanced reports coming soon!',
    });
  };

  // Format date for display
  const formatDateTime = (dateTime: string) => {
    try {
      // Parse DD-MM-YYYY HH:MM format
      const [datePart, timePart] = dateTime.split(' ');
      const [day, month, year] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');
      
      const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
      
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateTime;
    }
  };

  const renderTransaction = ({ item }: { item: TransactionHistoryItem }) => (
    <Card padding="medium" style={styles.transactionCard}>
      {/* Header Row with ID and Current Position */}
      <View style={styles.transactionHeader}>
        <View style={styles.symbolInfo}>
          <Text variant="body" color="text" weight="medium">ID: {item.id}</Text>
          <Text variant="body" color="text" weight="bold" style={styles.tradeSymbol}>
            {item.tradeSymbol}
          </Text>
        </View>
        <View style={styles.typeContainer}>
          <Text 
            variant="caption" 
            color={item.currentPosition.toLowerCase() === 'buy' ? 'success' : 'error'}
            weight="bold"
            style={styles.positionText}
          >
            {item.currentPosition.toUpperCase()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <RNText style={styles.statusText}>
              {item.status.toUpperCase()}
            </RNText>
          </View>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Text variant="caption" color="textSecondary">Strategy</Text>
          <Text variant="caption" color="text" weight="medium">{item.strategy}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text variant="caption" color="textSecondary">Entry Time</Text>
          <Text variant="caption" color="text">{formatDateTime(item.entryTime)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text variant="caption" color="textSecondary">Exit Time</Text>
          <Text variant="caption" color="text">{formatDateTime(item.exitTime)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text variant="caption" color="textSecondary">Entry Price</Text>
          <Text variant="caption" color="text" weight="medium">
            {formatIndianCurrency(item.entryPrice)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text variant="caption" color="textSecondary">Exit Price</Text>
          <Text variant="caption" color="text" weight="medium">
            {formatIndianCurrency(item.exitPrice)}
          </Text>
        </View>
      </View>
    </Card>
  );

  // Skeleton loader component
  const renderSkeletonCard = () => (
    <Card padding="medium" style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.symbolInfo}>
          <View style={[styles.skeleton, { width: 60, height: 16, marginBottom: 4 }]} />
          <View style={[styles.skeleton, { width: 120, height: 20 }]} />
        </View>
        <View style={styles.typeContainer}>
          <View style={[styles.skeleton, { width: 40, height: 16, marginBottom: 4 }]} />
          <View style={[styles.skeleton, { width: 60, height: 24, borderRadius: 12 }]} />
        </View>
      </View>
      <View style={styles.transactionDetails}>
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.detailRow}>
            <View style={[styles.skeleton, { width: 80, height: 14 }]} />
            <View style={[styles.skeleton, { width: 100, height: 14 }]} />
          </View>
        ))}
      </View>
    </Card>
  );

  const renderFilterSummary = () => {
    const activeFiltersCount = [
      filters.scriptExchange !== 'All' ? 1 : 0,
      filters.currentPosition !== 'All' ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);

    if (activeFiltersCount === 0) {
      return (
        <View style={styles.filterSummary}>
          <View style={styles.filterSummaryRow}>
            <Text variant="body" color="textSecondary">
              Showing all transactions ({transactions.length})
            </Text>
            <TouchableOpacity
              style={[styles.filterIconButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleFilterPress}
            >
              <Ionicons name="filter" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.filterSummary}>
        <View style={styles.filterSummaryRow}>
          <Text variant="body" color="text" weight="medium">
            Filtered Results ({transactions.length})
          </Text>
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setFilters({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                endDate: new Date(),
                scriptExchange: 'All',
                currentPosition: 'All',
              })}
            >
              <Text variant="caption" color="primary" weight="medium">
                Clear All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterIconButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleFilterPress}
            >
              <Ionicons name="filter" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.activeFilters}>
          {filters.scriptExchange !== 'All' && (
            <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text variant="caption" color="primary" weight="medium">
                {filters.scriptExchange}
              </Text>
            </View>
          )}
          {filters.currentPosition !== 'All' && (
            <View style={[styles.filterChip, { backgroundColor: theme.colors.success + '20' }]}>
              <Text variant="caption" color="success" weight="medium">
                {filters.currentPosition}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // FOR DEVELOPMENT TESTING ONLY - Remove this in production
  const handleTest401 = useCallback(async () => {
    console.log('🧪 Testing 401 handler...');
    try {
      const Test401Handler = require('../../services/test401Handler').default;
      await Test401Handler.simulate401();
    } catch (error) {
      console.error('❌ Error testing 401:', error);
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background + 'E6'}
        translucent
      />
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
        <View style={styles.statusBarSpacer} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text 
              variant="headline" 
              weight="bold" 
              color="text"
              style={
                Dimensions.get('window').width < 375
                  ? { fontSize: 16, lineHeight: 18 }
                  : undefined
              }
            >
              Transaction Report
            </Text>
            <Text variant="body" color="textSecondary">
              View your trading history
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]} 
              onPress={handleWalletPress}
            >
              <Ionicons name="wallet" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <NotificationIcon
              onPress={handleNotificationPress}
              color={theme.colors.primary}
              backgroundColor={theme.colors.surface}
              borderColor={theme.colors.border}
            />
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]} 
              onPress={handleReportPress}
            >
              <Ionicons name="document-text" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Transaction List */}
      <View style={styles.transactionList}>
        <FlatList
          data={loading && transactions.length === 0 ? Array(5).fill({}) : transactions}
          renderItem={loading && transactions.length === 0 ? renderSkeletonCard : renderTransaction}
          keyExtractor={(item, index) => loading && transactions.length === 0 ? `skeleton-${index}` : item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={renderFilterSummary}
          ListEmptyComponent={() => !loading && !error && transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={48} color={theme.colors.textSecondary} />
              <Text variant="body" color="textSecondary" style={styles.emptyStateText}>
                No transactions found
              </Text>
              <Text variant="caption" color="textSecondary">
                Try adjusting your filters to see more results
              </Text>
            </View>
          )}
          ListFooterComponent={() => {
            if (error && transactions.length === 0) {
              return (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                  <Text variant="body" color="error" style={styles.errorText}>
                    {error}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
                    onPress={() => fetchTransactions(currentPage)}
                  >
                    <RNText style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
                      Retry
                    </RNText>
                  </TouchableOpacity>
                </View>
              );
            }
            
            if (transactions.length > 0 && !loading) {
              return (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.paginationButton, 
                      { backgroundColor: currentPage === 1 ? theme.colors.border : theme.colors.primary }
                    ]} 
                    onPress={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={16} 
                      color={currentPage === 1 ? theme.colors.textSecondary : 'white'} 
                    />
                    <RNText style={{ 
                      color: currentPage === 1 ? theme.colors.textSecondary : 'white',
                      fontSize: 12,
                      fontWeight: '500'
                    }}>
                      Previous
                    </RNText>
                  </TouchableOpacity>

                  <View style={styles.pageInfo}>
                    <Text variant="caption" color="text" weight="medium">
                      Page {currentPage} of {totalPages}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={[
                      styles.paginationButton, 
                      { backgroundColor: currentPage === totalPages ? theme.colors.border : theme.colors.primary }
                    ]} 
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <RNText style={{
                      color: currentPage === totalPages ? theme.colors.textSecondary : 'white',
                      fontSize: 12,
                      fontWeight: '500'
                    }}>
                      Next
                    </RNText>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={currentPage === totalPages ? theme.colors.textSecondary : 'white'} 
                    />
                  </TouchableOpacity>
                </View>
              );
            }
            
            return null;
          }}
        />
      </View>

      {/* Notifications Page */}
      <NotificationsPage
        visible={isNotificationsPageVisible}
        onClose={handleCloseNotificationsPage}
      />

      {/* Wallet Page */}
      <WalletPage
        visible={isWalletPageVisible}
        onClose={handleCloseWalletPage}
      />

      {/* Transaction Filter Drawer */}
      <TransactionFilterDrawer
        visible={isFilterDrawerVisible}
        filters={filters}
        onClose={handleCloseFilterDrawer}
        onFiltersChange={handleFiltersChange}
        theme={theme}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    smallScreenTitle: {
      fontSize: 16,
      lineHeight: 18,
    },
    fixedHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      paddingTop: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      backdropFilter: 'blur(10px)', // Web only
    },
    statusBarSpacer: {
      height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 16,
    },
    transactionList: {
      flex: 1,
      marginTop: Platform.OS === 'ios' ? 120 : 140, // Space for fixed header
    },
    listContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
    },
    transactionCard: {
      marginBottom: 12,
      marginHorizontal: 0, // Remove horizontal margin to match other cards
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    symbolInfo: {
      flex: 1,
    },
    symbol: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    exchange: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    typeContainer: {
      alignItems: 'flex-end',
    },
    type: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    transactionDetails: {
      marginBottom: 0,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    totalValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    filterSummary: {
      paddingVertical: 12,
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    filterSummaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    filterActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterIconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    clearFiltersButton: {
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    activeFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    emptyStateText: {
      textAlign: 'center',
    },
    // New styles for API integration
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    loadingText: {
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      gap: 12,
    },
    errorText: {
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 4,
      marginTop: 8,
    },
    paginationButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    pageInfo: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    tradeSymbol: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 4,
    },
    positionText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    skeleton: {
      backgroundColor: theme.colors.border,
      borderRadius: 4,
    },
  });
