import React, { memo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { TransactionDetailsResponse } from '../../services/tradingApiService';

interface TransactionDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  transactionDetails: TransactionDetailsResponse | null;
  loading: boolean;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = memo(({
  visible,
  onClose,
  transactionDetails,
  loading,
}) => {
  const { theme } = useTheme();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const formatPnL = (amount: number) => {
    const isPositive = amount >= 0;
    return {
      text: `${isPositive ? '+' : ''}₹${formatCurrency(Math.abs(amount))}`,
      color: isPositive ? '#4ade80' : '#f87171'
    };
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <Text variant="subtitle" weight="semibold" color="text">
            Transaction Details ({transactionDetails?.Completedtradeid || 'N/A'})
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text variant="body" color="textSecondary">Loading transaction details...</Text>
          </View>
        ) : !transactionDetails ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
            <Text variant="body" color="error" style={styles.errorText}>
              Failed to load transaction details
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Trade Information */}
            <Card padding="large" style={styles.section}>
              <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                Trade Information
              </Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Trade Symbol</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.TradeSymbol}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Script Name</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.ScriptName}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Quantity</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Qty}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Current Position</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.CurrentPosition}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Product Type</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.ProductType}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Entry & Exit Details */}
            <Card padding="large" style={styles.section}>
              <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                Entry & Exit Details
              </Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Entry Date</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Entrydate}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Entry Time</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Entrytime}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Entry Price</Text>
                  <Text variant="body" weight="medium" color="text">
                    ₹{formatCurrency(transactionDetails.Entryprice)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Exit Date</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.ExitDate}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Exit Time</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Exittime}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Exit Price</Text>
                  <Text variant="body" weight="medium" color="text">
                    ₹{formatCurrency(transactionDetails.Exitprice)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* P&L Information */}
            <Card padding="large" style={styles.section}>
              <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                Profit & Loss
              </Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Gross P&L</Text>
                  <Text 
                    variant="body" 
                    weight="semibold" 
                    style={{ color: formatPnL(transactionDetails.Profitorloss).color }}
                  >
                    {formatPnL(transactionDetails.Profitorloss).text}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Brokerage</Text>
                  <Text variant="body" weight="medium" color="text">
                    ₹{formatCurrency(transactionDetails.Brokerage)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Net P&L</Text>
                  <Text 
                    variant="body" 
                    weight="semibold" 
                    style={{ color: formatPnL(transactionDetails.Netprofitorloss).color }}
                  >
                    {formatPnL(transactionDetails.Netprofitorloss).text}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Strategy & Watchlist */}
            <Card padding="large" style={styles.section}>
              <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                Strategy & Watchlist
              </Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Strategy Name</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Strategyname}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Watchlist Name</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Watchlistname}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Script Exchange</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.ScriptExchange}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Status</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.Status}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text variant="body" color="textSecondary">Is Live</Text>
                  <Text variant="body" weight="medium" color="text">
                    {transactionDetails.IsLive ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  detailGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});

export default TransactionDetailsModal;
