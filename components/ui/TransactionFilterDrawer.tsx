import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../atomic';
import SlidingPage from './SlidingPage';

export type ScriptExchange = 'All' | 'CDS' | 'NSE' | 'NFO' | 'BSE' | 'MCX' | 'CRYPTO' | 'FOREX' | 'BFO' | 'NCDEX';
export type CurrentPosition = 'All' | 'Buy' | 'Sell';

export interface TransactionFilters {
  startDate: Date;
  endDate: Date;
  scriptExchange: ScriptExchange;
  currentPosition: CurrentPosition;
}

interface TransactionFilterDrawerProps {
  visible: boolean;
  filters: TransactionFilters;
  onClose: () => void;
  onFiltersChange: (filters: TransactionFilters) => void;
  theme: any;
}

const SCRIPT_EXCHANGES: ScriptExchange[] = ['All', 'CDS', 'NSE', 'NFO', 'BSE', 'MCX', 'CRYPTO', 'FOREX', 'BFO', 'NCDEX'];
const CURRENT_POSITIONS: CurrentPosition[] = ['All', 'Buy', 'Sell'];

export const TransactionFilterDrawer: React.FC<TransactionFilterDrawerProps> = ({
  visible,
  filters,
  onClose,
  onFiltersChange,
  theme,
}) => {
  const [tempFilters, setTempFilters] = useState<TransactionFilters>(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(tempFilters);
    onClose();
  }, [tempFilters, onFiltersChange, onClose]);

  const handleResetFilters = useCallback(() => {
    const resetFilters: TransactionFilters = {
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      endDate: new Date(),
      scriptExchange: 'All',
      currentPosition: 'All',
    };
    setTempFilters(resetFilters);
  }, []);

  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({ ...prev, startDate: selectedDate }));
    }
  }, []);

  const handleEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({ ...prev, endDate: selectedDate }));
    }
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View style={styles.filterSection}>
      <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );

  const renderDatePicker = (
    label: string,
    date: Date,
    onPress: () => void,
    showPicker: boolean,
    onDateChange: (event: any, selectedDate?: Date) => void
  ) => (
    <View style={styles.dateContainer}>
      <Text variant="body" color="textSecondary" style={styles.dateLabel}>
        {label}
      </Text>
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
      >
        <Text variant="body" color="text" weight="medium">
          {formatDate(date)}
        </Text>
        <Ionicons name="calendar" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      
      {/* Simple Date Selection Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => onDateChange(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.datePickerModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.datePickerHeader}>
              <Text variant="subtitle" weight="semibold" color="text">
                Select {label}
              </Text>
              <TouchableOpacity onPress={() => onDateChange(null)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text variant="body" color="textSecondary" style={styles.datePickerNote}>
              For now, using default dates. Advanced date picker coming soon!
            </Text>
            
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.datePickerButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => onDateChange(null, date)}
              >
                <Text variant="body" weight="medium" style={{ color: '#FFFFFF' }}>
                  Use Current Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderDropdown = <T extends string>(
    options: T[],
    selectedValue: T,
    onSelect: (value: T) => void,
    label: string
  ) => (
    <View style={styles.dropdownContainer}>
      <Text variant="body" color="textSecondary" style={styles.dropdownLabel}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                {
                  backgroundColor: selectedValue === option ? theme.colors.primary : theme.colors.surface,
                  borderColor: selectedValue === option ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => onSelect(option)}
            >
              <Text
                variant="body"
                weight="medium"
                style={{
                  color: selectedValue === option ? '#FFFFFF' : theme.colors.text,
                }}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SlidingPage
      visible={visible}
      title="Transaction Filters"
      onClose={onClose}
      showBackButton={true}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Date Range Filters */}
        {renderFilterSection(
          'Date Range',
          <View style={styles.dateRangeContainer}>
            {renderDatePicker(
              'Start Date',
              tempFilters.startDate,
              () => setShowStartDatePicker(true),
              showStartDatePicker,
              handleStartDateChange
            )}
            {renderDatePicker(
              'End Date',
              tempFilters.endDate,
              () => setShowEndDatePicker(true),
              showEndDatePicker,
              handleEndDateChange
            )}
          </View>
        )}

        {/* Script Exchange Filter */}
        {renderFilterSection(
          'Script Exchange',
          renderDropdown(
            SCRIPT_EXCHANGES,
            tempFilters.scriptExchange,
            (value) => setTempFilters(prev => ({ ...prev, scriptExchange: value })),
            'Select Exchange'
          )
        )}

        {/* Current Position Filter */}
        {renderFilterSection(
          'Current Position',
          renderDropdown(
            CURRENT_POSITIONS,
            tempFilters.currentPosition,
            (value) => setTempFilters(prev => ({ ...prev, currentPosition: value })),
            'Select Position Type'
          )
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleResetFilters}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
            <Text variant="body" weight="medium" color="textSecondary">
              Reset
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleApplyFilters}
          >
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text variant="body" weight="medium" style={{ color: '#FFFFFF' }}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SlidingPage>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  dateRangeContainer: {
    gap: 16,
  },
  dateContainer: {
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownContainer: {
    gap: 12,
  },
  dropdownLabel: {
    fontSize: 14,
  },
  optionsScroll: {
    flexGrow: 0,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 280,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  datePickerNote: {
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerActions: {
    alignItems: 'center',
  },
  datePickerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
