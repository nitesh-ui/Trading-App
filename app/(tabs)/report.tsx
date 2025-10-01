import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
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
import WalletPage from '../../components/ui/WalletPage';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { formatIndianCurrency } from '../../utils/indianFormatting';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  price: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  exchange?: string;
  total: number;
  pnl?: number;
}

const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'buy',
    symbol: 'RELIANCE',
    quantity: 10,
    price: 2485.50,
    date: '2024-01-15 09:30:00',
    status: 'completed',
    exchange: 'NSE',
    total: 24855.00,
  },
  {
    id: '2',
    type: 'sell',
    symbol: 'TCS',
    quantity: 5,
    price: 3520.75,
    date: '2024-01-15 10:45:00',
    status: 'completed',
    exchange: 'BSE',
    total: 17603.75,
    pnl: 875.25,
  },
  {
    id: '3',
    type: 'buy',
    symbol: 'EUR/USD',
    quantity: 1000,
    price: 1.0850,
    date: '2024-01-15 11:20:00',
    status: 'completed',
    total: 1085.00,
  },
  {
    id: '4',
    type: 'sell',
    symbol: 'BTC',
    quantity: 0.05,
    price: 42500.00,
    date: '2024-01-15 14:30:00',
    status: 'pending',
    total: 2125.00,
    pnl: 325.50,
  },
  {
    id: '5',
    type: 'buy',
    symbol: 'HDFC BANK',
    quantity: 8,
    price: 1650.25,
    date: '2024-01-15 15:15:00',
    status: 'completed',
    exchange: 'NSE',
    total: 13202.00,
  },
  {
    id: '6',
    type: 'sell',
    symbol: 'ETH',
    quantity: 0.8,
    price: 2650.75,
    date: '2024-01-15 16:00:00',
    status: 'cancelled',
    total: 2120.60,
  },
];

export default function ReportScreen() {
  const { theme, isDark } = useTheme();
  const { showNotification } = useNotification();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Modal states
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);

  const styles = createStyles(theme);

  const filteredTransactions = DUMMY_TRANSACTIONS.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return transaction.type === selectedFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'buy' ? theme.colors.success : theme.colors.error;
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

  const handleReportPress = () => {
    showNotification({
      type: 'info',
      title: 'Advanced reports coming soon!',
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <Card padding="medium" style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.symbolInfo}>
          <RNText style={styles.symbol}>{item.symbol}</RNText>
          {item.exchange && (
            <RNText style={styles.exchange}>{item.exchange}</RNText>
          )}
        </View>
        <View style={styles.typeContainer}>
          <RNText style={[styles.type, { color: getTypeColor(item.type) }]}>
            {item.type.toUpperCase()}
          </RNText>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <RNText style={styles.statusText}>{item.status.toUpperCase()}</RNText>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <RNText style={styles.detailLabel}>Quantity</RNText>
          <RNText style={styles.detailValue}>{item.quantity}</RNText>
        </View>
        <View style={styles.detailRow}>
          <RNText style={styles.detailLabel}>Price</RNText>
          <RNText style={styles.detailValue}>
            {item.symbol.includes('/') || item.symbol === 'BTC' || item.symbol === 'ETH' 
              ? `$${item.price.toFixed(2)}` 
              : formatIndianCurrency(item.price)}
          </RNText>
        </View>
        <View style={styles.detailRow}>
          <RNText style={styles.detailLabel}>Total</RNText>
          <RNText style={[styles.detailValue, styles.totalValue]}>
            {item.symbol.includes('/') || item.symbol === 'BTC' || item.symbol === 'ETH' 
              ? `$${item.total.toFixed(2)}` 
              : formatIndianCurrency(item.total)}
          </RNText>
        </View>
        {item.pnl && (
          <View style={styles.detailRow}>
            <RNText style={styles.detailLabel}>P&L</RNText>
            <RNText style={[styles.detailValue, { color: item.pnl > 0 ? theme.colors.success : theme.colors.error }]}>
              {item.pnl > 0 ? '+' : ''}{item.symbol.includes('/') || item.symbol === 'BTC' || item.symbol === 'ETH' 
                ? `$${item.pnl.toFixed(2)}` 
                : formatIndianCurrency(item.pnl)}
            </RNText>
          </View>
        )}
      </View>

      <RNText style={styles.dateText}>
        {new Date(item.date).toLocaleString('en-IN', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </RNText>
    </Card>
  );

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
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, position: 'relative' }]} 
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications" size={20} color={theme.colors.primary} />
              {notificationCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.notificationText}>
                    {notificationCount > 99 ? '99+' : notificationCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]} 
              onPress={handleReportPress}
            >
              <Ionicons name="document-text" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'buy', 'sell'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab,
            ]}
            onPress={() => setSelectedFilter(filter as 'all' | 'buy' | 'sell')}
          >
            <RNText
              style={[
                styles.filterText,
                selectedFilter === filter && styles.activeFilterText,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </RNText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.transactionList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

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
    notificationBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: theme.colors.error,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 16,
    },


    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.background,
      marginTop: Platform.OS === 'ios' ? 120 : 140, // Reduced space for fixed header
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterTab: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginRight: 15,
      borderRadius: 20,
      backgroundColor: theme.colors.cardBackground,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    activeFilterTab: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    activeFilterText: {
      color: 'white',
    },
    transactionList: {
      flex: 1,
    },
    listContainer: {
      paddingHorizontal: 20,
      paddingTop: 12, // Small gap between filters and first card
      paddingBottom: 20,
    },
    transactionCard: {
      marginBottom: 12,
      marginHorizontal: 0, // Remove horizontal margin to match other cards
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
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
  });
