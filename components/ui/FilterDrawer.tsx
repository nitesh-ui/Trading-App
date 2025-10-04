import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, Button, Toggle } from '../atomic';
import DatePicker from './DatePicker';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionFilters {
  startDate: Date | null;
  endDate: Date | null;
  payinPayout: boolean;
}

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

const payinPayoutOptions = [
  { value: 'false', label: 'All' },
  { value: 'true', label: 'PayIn/PayOut' },
];

const { width: screenWidth } = Dimensions.get('window');

const FilterDrawer: React.FC<FilterDrawerProps> = memo(({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
}) => {
  const { theme } = useTheme();

  const handleFilterChange = useCallback((key: keyof TransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const handleToggleChange = useCallback((value: string) => {
    handleFilterChange('payinPayout', value === 'true');
  }, [handleFilterChange]);

  const handleApply = useCallback(() => {
    onApplyFilters();
    onClose();
  }, [onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    onResetFilters();
    onClose();
  }, [onResetFilters, onClose]);

  const hasActiveFilters = filters.startDate || filters.endDate || filters.payinPayout;

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
          <View style={styles.headerLeft}>
            <Ionicons name="filter" size={24} color={theme.colors.primary} />
            <Text variant="title" weight="semibold" color="text">
              Filters
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Date Filters */}
          <Card padding="none" style={styles.section}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Date Range
            </Text>
            
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  Start Date
                </Text>
                <DatePicker
                  value={filters.startDate}
                  onDateChange={(date) => handleFilterChange('startDate', date)}
                  placeholder="Start date"
                  maximumDate={new Date()}
                />
              </View>
              
              <View style={styles.dateField}>
                <Text variant="caption" color="textSecondary" style={styles.fieldLabel}>
                  End Date
                </Text>
                <DatePicker
                  value={filters.endDate}
                  onDateChange={(date) => handleFilterChange('endDate', date)}
                  placeholder="End date"
                  minimumDate={filters.startDate || undefined}
                  maximumDate={new Date()}
                />
              </View>
            </View>
          </Card>

          {/* Transaction Type Filter */}
          <Card padding="none" style={styles.section}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Transaction Type
            </Text>
            
            <View style={styles.toggleSection}>
              <Text variant="body" color="textSecondary" style={styles.toggleDescription}>
                Filter transactions by type
              </Text>
              <Toggle
                options={payinPayoutOptions}
                selectedValue={filters.payinPayout.toString()}
                onValueChange={handleToggleChange}
                style={styles.toggle}
              />
            </View>
          </Card>

          {/* Filter Status */}
          {hasActiveFilters && (
            <Card 
              padding="medium" 
              style={StyleSheet.flatten([
                styles.statusCard, 
                { backgroundColor: `${theme.colors.primary}10` }
              ])}
            >
              <View style={styles.statusContent}>
                <View style={styles.statusLeft}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  <Text variant="body" color="primary" weight="medium">
                    {getActiveFiltersCount(filters)} filter(s) active
                  </Text>
                </View>
                <TouchableOpacity onPress={handleReset} style={styles.clearButton}>
                  <Text variant="caption" color="primary" weight="medium">
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Button
            title="Reset"
            onPress={handleReset}
            variant="secondary"
            style={StyleSheet.flatten([styles.footerButton, { borderColor: theme.colors.border }])}
          />
          <Button
            title="Apply Filters"
            onPress={handleApply}
            variant="primary"
            style={styles.footerButton}
          />
        </View>
      </View>
    </Modal>
  );
});

const getActiveFiltersCount = (filters: TransactionFilters): number => {
  let count = 0;
  if (filters.startDate) count++;
  if (filters.endDate) count++;
  if (filters.payinPayout) count++;
  return count;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
    gap: 8,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  toggleSection: {
    gap: 12,
  },
  toggleDescription: {
    marginBottom: 8,
  },
  toggle: {
    alignSelf: 'center',
  },
  statusCard: {
    borderRadius: 12,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
  },
});

export default FilterDrawer;
