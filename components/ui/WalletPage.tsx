import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Card, Text, Button, Toggle } from '../atomic';
import SlidingPage from './SlidingPage';
import DatePicker from './DatePicker';
import TransactionDetailsModal from './TransactionDetailsModal';
import FilterDrawer from './FilterDrawer';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { 
  tradingApiService, 
  WalletBalanceData, 
  TransactionHistoryItem,
  TransactionDetailsResponse
} from '../../services/tradingApiService';
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

interface WalletPageProps {
  visible: boolean;
  onClose: () => void;
}

interface TransactionFilters {
  startDate: Date | null;
  endDate: Date | null;
  payinPayout: boolean;
}

const WalletBalanceCard = memo(({ 
  walletData, 
  loading, 
  error, 
  onRefresh 
}: { 
  walletData: WalletBalanceData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();

  const handleDeposit = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Coming Soon',
      message: 'Deposit functionality will be available soon'
    });
  }, [showNotification]);

  const handleWithdraw = useCallback(() => {
    showNotification({
      type: 'info',
      title: 'Coming Soon', 
      message: 'Withdrawal functionality will be available soon'
    });
  }, [showNotification]);

  const formatCurrency = useCallback((amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }, []);

  if (loading) {
    return (
      <Card padding="large" style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: theme.colors.primary }])}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text variant="body" style={{ color: 'white', marginTop: 12 }}>
            Loading wallet balance...
          </Text>
        </View>
      </Card>
    );
  }

  if (error && !walletData) {
    return (
      <Card padding="large" style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: theme.colors.error }])}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="white" />
          <Text variant="body" style={{ color: 'white', textAlign: 'center', marginTop: 12 }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={onRefresh}
          >
            <Text variant="caption" style={{ color: 'white', fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  // Use API data or fallback to 0
  const walletBalance = walletData?.amount || '0';
  const totalProfitLoss = walletData?.totalprofitloss || 0;

  return (
    <Card padding="large" style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: theme.colors.primary }])}>
      <View style={styles.balanceHeader}>
        <Text variant="body" style={StyleSheet.flatten([styles.balanceLabel, { color: 'white' }])}>
          Wallet Balance
        </Text>
        <TouchableOpacity>
          <Ionicons name="eye" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <Text variant="display" weight="bold" style={StyleSheet.flatten([styles.totalBalance, { color: 'white' }])}>
        ₹{formatCurrency(walletBalance)}
      </Text>
      
      <View style={styles.balanceBreakdown}>
        <View style={styles.breakdownItem}>
          <Text variant="caption" style={StyleSheet.flatten([styles.breakdownLabel, { color: 'white' }])}>
            Active Trades
          </Text>
          <Text 
            variant="body" 
            weight="semibold" 
            style={{ 
              color: totalProfitLoss >= 0 ? '#4ade80' : '#f87171' 
            }}
          >
            {totalProfitLoss >= 0 ? '+' : ''}₹{formatCurrency(Math.abs(totalProfitLoss))}
          </Text>
        </View>
      </View>
      
      <View style={styles.balanceActions}>
        <Button
          title="Deposit"
          onPress={handleDeposit}
          variant="secondary"
          style={StyleSheet.flatten([styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }])}
          textStyle={{ color: 'white' }}
        />
        <Button
          title="Withdraw"
          onPress={handleWithdraw}
          variant="secondary"
          style={StyleSheet.flatten([styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }])}
          textStyle={{ color: 'white' }}
        />
      </View>
    </Card>
  );
});

const AccountInfoCard = memo(() => {
  const { theme } = useTheme();

  return (
    <Card padding="large" style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="subtitle" weight="semibold" color="text">
          Account Information
        </Text>
        <TouchableOpacity>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.accountInfo}>
        <View style={styles.infoRow}>
          <Text variant="body" color="textSecondary">Account ID</Text>
          <Text variant="body" weight="medium" color="text">TR123456789</Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body" color="textSecondary">Account Type</Text>
          <Text variant="body" weight="medium" color="text">Individual</Text>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body" color="textSecondary">KYC Status</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
            <Text variant="body" weight="medium" color="success">Verified</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text variant="body" color="textSecondary">Bank Account</Text>
          <Text variant="body" weight="medium" color="text">HDFC ****1234</Text>
        </View>
      </View>
    </Card>
  );
});

const TransactionItem = memo(({ transaction, onDetailsPress }: { 
  transaction: TransactionHistoryItem;
  onDetailsPress: (id: number) => void;
}) => {
  const { theme } = useTheme();

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 1:
        return 'arrow-down-circle'; // Credit/Deposit
      case 2:
        return 'arrow-up-circle'; // Debit/Withdraw
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = () => {
    switch (transaction.type) {
      case 1:
        return theme.colors.success; // Credit/Deposit
      case 2:
        return theme.colors.error; // Debit/Withdraw
      default:
        return theme.colors.text;
    }
  };

  const formatAmount = () => {
    const amount = transaction.amount;
    const isPositive = amount.startsWith('+');
    const numericAmount = parseFloat(amount.replace(/[+\-]/g, ''));
    return `${isPositive ? '+' : '-'}₹${numericAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = () => {
    try {
      const date = new Date(transaction.date_Time);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return transaction.date_Time_String;
    }
  };

  const getStatusText = () => {
    return transaction.status === '1' ? 'Completed' : 'Pending';
  };

  return (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: `${getTransactionColor()}20` }]}>
          <Ionicons 
            name={getTransactionIcon() as any} 
            size={20} 
            color={getTransactionColor()} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text variant="body" weight="medium" color="text" numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text variant="caption" color="textSecondary">
            {formatDate()} • {getStatusText()}
          </Text>
          {transaction.recievedform && (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              From: {transaction.recievedform}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text 
          variant="body" 
          weight="semibold" 
          style={StyleSheet.flatten([styles.transactionAmount, { color: getTransactionColor() }])}
        >
          {formatAmount()}
        </Text>
        <TouchableOpacity 
          style={[styles.detailsButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onDetailsPress(transaction.id)}
        >
          <Text variant="caption" style={{ color: 'white', fontWeight: '600' }}>
            Details
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

const TransactionHistory = memo(() => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const { handle401 } = useAuthErrorHandler();
  
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters and drawer state
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: null,
    endDate: null,
    payinPayout: false
  });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  
  // Transaction details modal
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetailsResponse | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchTransactionHistory = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const request = {
        pageNo: page,
        payinPayout: filters.payinPayout,
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() })
      };

      const response = await tradingApiService.getTransactionHistory(request);
      
      if (response.data && response.data.length > 0) {
        const newTransactions = response.data;
        
        // Always replace data, don't append
        setTransactions(newTransactions);
        
        // Get total pages from the first item
        const totalPagesFromAPI = newTransactions[0]?.total_Pages || 1;
        setTotalPages(totalPagesFromAPI);
        setCurrentPage(page);
      } else {
        setTransactions([]);
        setError(response.message || 'No transactions found');
      }
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
      
      if (err.status === 401) {
        await handle401();
        setError('Session expired. Please login again.');
      } else {
        const errorMessage = err.message || 'Unable to fetch transaction history. Please try again.';
        setError(errorMessage);
        showNotification({
          type: 'error',
          title: 'Transaction History Error',
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification, handle401]);

  const fetchTransactionDetails = useCallback(async (transactionId: number) => {
    try {
      setLoadingDetails(true);
      setSelectedTransactionId(transactionId);
      setShowDetailsModal(true);
      
      const details = await tradingApiService.getTransactionDetails(transactionId);
      
      if (details) {
        setTransactionDetails(details);
      } else {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to load transaction details'
        });
      }
    } catch (err: any) {
      console.error('Error fetching transaction details:', err);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load transaction details'
      });
    } finally {
      setLoadingDetails(false);
    }
  }, [showNotification]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchTransactionHistory(1).finally(() => setRefreshing(false));
  }, [fetchTransactionHistory]);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      fetchTransactionHistory(currentPage - 1);
    }
  }, [currentPage, fetchTransactionHistory]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      fetchTransactionHistory(currentPage + 1);
    }
  }, [currentPage, totalPages, fetchTransactionHistory]);

  const handleFilterChange = useCallback((key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchTransactionHistory(1);
  }, [fetchTransactionHistory]);

  const handleResetFilters = useCallback(() => {
    setFilters({
      startDate: null,
      endDate: null,
      payinPayout: false
    });
    setCurrentPage(1);
    fetchTransactionHistory(1);
  }, [fetchTransactionHistory]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.payinPayout) count++;
    return count;
  }, [filters]);

  // Fetch data on mount only
  useEffect(() => {
    fetchTransactionHistory(1);
  }, []);

  const renderTransaction = useCallback(({ item }: { item: TransactionHistoryItem }) => (
    <TransactionItem 
      transaction={item} 
      onDetailsPress={fetchTransactionDetails}
    />
  ), [fetchTransactionDetails]);

  const keyExtractor = useCallback((item: TransactionHistoryItem) => item.id.toString(), []);

  const ListHeader = useCallback(() => (
    <View>
      {/* Filter Summary */}
      <View style={styles.filterSummary}>
        <View style={styles.filterSummaryRow}>
          <Text variant="subtitle" weight="semibold" color="text">
            Recent Transactions
          </Text>
          <View style={styles.headerRight}>
            {getActiveFiltersCount() > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}>
                <Text variant="caption" style={{ color: 'white', fontSize: 10 }}>
                  {getActiveFiltersCount()}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              onPress={() => setShowFilterDrawer(true)}
              style={[
                styles.filterIconButton, 
                { 
                  backgroundColor: getActiveFiltersCount() > 0 ? theme.colors.primary + '20' : theme.colors.surface,
                  borderColor: theme.colors.border 
                }
              ]}
            >
              <Ionicons 
                name="filter" 
                size={16} 
                color={getActiveFiltersCount() > 0 ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <View style={styles.activeFilters}>
            {filters.startDate && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text variant="caption" color="primary">
                  From: {filters.startDate.toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            {filters.endDate && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text variant="caption" color="primary">
                  To: {filters.endDate.toLocaleDateString('en-IN')}
                </Text>
              </View>
            )}
            {filters.payinPayout && (
              <View style={[styles.filterChip, { backgroundColor: theme.colors.primary + '20' }]}>
                <Text variant="caption" color="primary">
                  PayIn/PayOut Only
                </Text>
              </View>
            )}
          </View>
        )}

      </View>
    </View>
  ), [filters, currentPage, totalPages, transactions.length, theme, getActiveFiltersCount]);

  const ListFooter = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="caption" color="textSecondary" style={styles.loadingMoreText}>
            Loading transactions...
          </Text>
        </View>
      );
    }
    
    if (totalPages > 1) {
      return (
        <View style={styles.paginationContainer}>
          <TouchableOpacity 
            style={[
              styles.paginationButton,
              { 
                backgroundColor: currentPage > 1 ? theme.colors.primary : theme.colors.surface,
                opacity: currentPage > 1 ? 1 : 0.5
              }
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={16} 
              color={currentPage > 1 ? 'white' : theme.colors.textSecondary} 
            />
            <Text 
              variant="body" 
              style={{ 
                color: currentPage > 1 ? 'white' : theme.colors.textSecondary,
                fontWeight: '600',
                fontSize: 14
              }}
            >
              Previous
            </Text>
          </TouchableOpacity>
          
          <View style={styles.paginationPageInfo}>
            <Text variant="body" color="text" weight="medium">
              {currentPage} / {totalPages}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.paginationButton,
              { 
                backgroundColor: currentPage < totalPages ? theme.colors.primary : theme.colors.surface,
                opacity: currentPage < totalPages ? 1 : 0.5
              }
            ]}
            onPress={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <Text 
              variant="body" 
              style={{ 
                color: currentPage < totalPages ? 'white' : theme.colors.textSecondary,
                fontWeight: '600',
                fontSize: 14
              }}
            >
              Next
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={currentPage < totalPages ? 'white' : theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  }, [loading, currentPage, totalPages, transactions.length, theme, goToPreviousPage, goToNextPage]);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyTransactions}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="textSecondary" style={styles.emptyText}>
            Loading transactions...
          </Text>
        </>
      ) : error ? (
        <>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text variant="body" color="error" style={styles.emptyText}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => fetchTransactionHistory(1)}
          >
            <Text variant="caption" style={{ color: 'white', fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
          <Text variant="body" color="textSecondary" style={styles.emptyText}>
            No transactions found
          </Text>
        </>
      )}
    </View>
  ), [loading, error, theme, fetchTransactionHistory]);

  return (
    <>
      <Card padding="large" style={styles.card}>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Since it's inside a ScrollView
        />
      </Card>
      
      <TransactionDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setTransactionDetails(null);
          setSelectedTransactionId(null);
        }}
        transactionDetails={transactionDetails}
        loading={loadingDetails}
      />
      
      <FilterDrawer
        visible={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </>
  );
});

const WalletPage: React.FC<WalletPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const { handle401 } = useAuthErrorHandler();
  
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<WalletBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await tradingApiService.getWalletBalance();
      
      if (response.data) {
        setWalletData(response.data);
      } else {
        setError(response.message || 'Failed to fetch wallet balance');
      }
    } catch (err: any) {
      console.error('Error fetching wallet balance:', err);
      
      if (err.status === 401) {
        await handle401();
        setError('Session expired. Please login again.');
      } else {
        const errorMessage = err.message || 'Unable to fetch wallet balance. Please try again.';
        setError(errorMessage);
        showNotification({
          type: 'error',
          title: 'Wallet Error',
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showNotification, handle401]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletBalance();
    setRefreshing(false);
  }, [fetchWalletBalance]);

  // Fetch wallet balance when component mounts and becomes visible
  useEffect(() => {
    if (visible) {
      fetchWalletBalance();
    }
  }, [visible, fetchWalletBalance]);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title="Wallet"
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WalletBalanceCard 
          walletData={walletData}
          loading={loading}
          error={error}
          onRefresh={fetchWalletBalance}
        />
        <TransactionHistory />
      </ScrollView>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  
  // Balance Card Styles
  balanceCard: {
    marginBottom: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    opacity: 0.9,
  },
  totalBalance: {
    fontSize: 32,
    marginBottom: 16,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  breakdownItem: {
    flex: 1,
  },
  breakdownLabel: {
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  
  // Loading and Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  
  // Card Styles
  card: {
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // Account Info Styles
  accountInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Transaction Styles
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  filterIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
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
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  pageInfo: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 4,
  },
  paginationPageInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
    gap: 2,
  },
  transactionAmount: {
    marginLeft: 12,
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    maxWidth: 120,
    justifyContent: 'center',
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    textAlign: 'center',
  },
  
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
  },
});

export default WalletPage;
