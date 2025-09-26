import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  FlatList,
  RefreshControl
} from 'react-native';
import { Card, Text, Button } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell' | 'dividend' | 'fees';
  amount: number;
  currency: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface WalletPageProps {
  visible: boolean;
  onClose: () => void;
}

// Mock data - In real app, this would come from API/context
const MOCK_BALANCE = {
  total: 125430.50,
  available: 98234.75,
  invested: 27195.75,
  currency: 'INR'
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'deposit',
    amount: 10000,
    currency: 'INR',
    description: 'UPI Transfer - Bank of India',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    status: 'completed'
  },
  {
    id: '2',
    type: 'buy',
    amount: -2500,
    currency: 'INR',
    description: 'Purchased AAPL - 5 shares',
    timestamp: new Date('2024-01-15T09:15:00Z'),
    status: 'completed'
  },
  {
    id: '3',
    type: 'sell',
    amount: 3200,
    currency: 'INR',
    description: 'Sold MSFT - 3 shares',
    timestamp: new Date('2024-01-14T14:22:00Z'),
    status: 'completed'
  },
  {
    id: '4',
    type: 'dividend',
    amount: 145.50,
    currency: 'INR',
    description: 'Dividend from RELIANCE',
    timestamp: new Date('2024-01-14T11:00:00Z'),
    status: 'completed'
  },
  {
    id: '5',
    type: 'fees',
    amount: -18.50,
    currency: 'INR',
    description: 'Brokerage charges',
    timestamp: new Date('2024-01-13T16:45:00Z'),
    status: 'completed'
  },
  {
    id: '6',
    type: 'withdraw',
    amount: -5000,
    currency: 'INR',
    description: 'Bank Transfer - HDFC Bank',
    timestamp: new Date('2024-01-12T12:30:00Z'),
    status: 'pending'
  },
  {
    id: '7',
    type: 'deposit',
    amount: 25000,
    currency: 'INR',
    description: 'NEFT Transfer - SBI Bank',
    timestamp: new Date('2024-01-10T08:15:00Z'),
    status: 'completed'
  },
  {
    id: '8',
    type: 'buy',
    amount: -8750,
    currency: 'INR',
    description: 'Purchased TCS - 10 shares',
    timestamp: new Date('2024-01-09T11:30:00Z'),
    status: 'completed'
  }
];

const WalletBalanceCard = memo(() => {
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

  return (
    <Card padding="large" style={StyleSheet.flatten([styles.balanceCard, { backgroundColor: theme.colors.primary }])}>
      <View style={styles.balanceHeader}>
        <Text variant="body" style={StyleSheet.flatten([styles.balanceLabel, { color: 'white' }])}>
          Total Balance
        </Text>
        <TouchableOpacity>
          <Ionicons name="eye" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      <Text variant="display" weight="bold" style={StyleSheet.flatten([styles.totalBalance, { color: 'white' }])}>
        ₹{MOCK_BALANCE.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </Text>
      
      <View style={styles.balanceBreakdown}>
        <View style={styles.breakdownItem}>
          <Text variant="caption" style={StyleSheet.flatten([styles.breakdownLabel, { color: 'white' }])}>
            Available
          </Text>
          <Text variant="body" weight="semibold" style={{ color: 'white' }}>
            ₹{MOCK_BALANCE.available.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.breakdownItem}>
          <Text variant="caption" style={StyleSheet.flatten([styles.breakdownLabel, { color: 'white' }])}>
            Invested
          </Text>
          <Text variant="body" weight="semibold" style={{ color: 'white' }}>
            ₹{MOCK_BALANCE.invested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

const TransactionItem = memo(({ transaction }: { transaction: Transaction }) => {
  const { theme } = useTheme();

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'deposit':
        return 'arrow-down-circle';
      case 'withdraw':
        return 'arrow-up-circle';
      case 'buy':
        return 'trending-up';
      case 'sell':
        return 'trending-down';
      case 'dividend':
        return 'gift';
      case 'fees':
        return 'receipt';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = () => {
    if (transaction.status === 'failed') return theme.colors.error;
    if (transaction.status === 'pending') return theme.colors.warning;
    
    switch (transaction.type) {
      case 'deposit':
      case 'sell':
      case 'dividend':
        return theme.colors.success;
      case 'withdraw':
      case 'buy':
      case 'fees':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const formatAmount = () => {
    const isPositive = transaction.amount > 0;
    const prefix = isPositive ? '+' : '';
    return `${prefix}₹${Math.abs(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = () => {
    return transaction.timestamp.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            {formatDate()} • {transaction.status}
          </Text>
        </View>
      </View>
      <Text 
        variant="body" 
        weight="semibold" 
        style={StyleSheet.flatten([styles.transactionAmount, { color: getTransactionColor() }])}
      >
        {formatAmount()}
      </Text>
    </TouchableOpacity>
  );
});

const TransactionHistory = memo(() => {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  ), []);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const ListHeader = useCallback(() => (
    <View style={styles.transactionHeader}>
      <Text variant="subtitle" weight="semibold" color="text">
        Recent Transactions
      </Text>
      <TouchableOpacity>
        <Text variant="body" weight="medium" color="primary">
          View All
        </Text>
      </TouchableOpacity>
    </View>
  ), []);

  const ListEmpty = useCallback(() => (
    <View style={styles.emptyTransactions}>
      <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
      <Text variant="body" color="textSecondary" style={styles.emptyText}>
        No transactions yet
      </Text>
    </View>
  ), [theme.colors.textSecondary]);

  return (
    <Card padding="large" style={styles.card}>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false} // Since it's inside a ScrollView
      />
    </Card>
  );
});

const WalletPage: React.FC<WalletPageProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call to refresh wallet data
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SlidingPage
      visible={visible}
      onClose={onClose}
      title="Wallet"
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <WalletBalanceCard />
        <AccountInfoCard />
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
