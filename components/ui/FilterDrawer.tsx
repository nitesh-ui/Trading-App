import React, { memo, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, Button, Toggle } from '../atomic';
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // State for start date picker
  const [startSelectedYear, setStartSelectedYear] = useState(filters.startDate?.getFullYear() || new Date().getFullYear());
  const [startSelectedMonth, setStartSelectedMonth] = useState(filters.startDate?.getMonth() || new Date().getMonth());
  const [startSelectedDay, setStartSelectedDay] = useState(filters.startDate?.getDate() || new Date().getDate());
  
  // State for end date picker
  const [endSelectedYear, setEndSelectedYear] = useState(filters.endDate?.getFullYear() || new Date().getFullYear());
  const [endSelectedMonth, setEndSelectedMonth] = useState(filters.endDate?.getMonth() || new Date().getMonth());
  const [endSelectedDay, setEndSelectedDay] = useState(filters.endDate?.getDate() || new Date().getDate());

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
  }, [onResetFilters]);

  const handleStartDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      handleFilterChange('startDate', selectedDate);
    }
  }, [handleFilterChange]);

  const handleEndDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      handleFilterChange('endDate', selectedDate);
    }
  }, [handleFilterChange]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderDatePicker = (
    label: string,
    date: Date | null,
    onPress: () => void,
    showPicker: boolean,
    onDateChange: (event: any, selectedDate?: Date) => void,
    selectedYear: number,
    setSelectedYear: (year: number) => void,
    selectedMonth: number,
    setSelectedMonth: (month: number) => void,
    selectedDay: number,
    setSelectedDay: (day: number) => void
  ) => {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1);

    const handleConfirm = () => {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      onDateChange(null, newDate);
    };

    return (
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
        
        {/* Custom Date Picker Modal */}
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
              
              <View style={styles.datePickerContent}>
                {/* Year Selector */}
                <View style={styles.datePickerSection}>
                  <Text variant="caption" color="textSecondary" style={styles.pickerLabel}>Year</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {years.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.pickerOption,
                          {
                            backgroundColor: selectedYear === year ? theme.colors.primary : 'transparent',
                          }
                        ]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text
                          variant="body"
                          weight={selectedYear === year ? 'semibold' : 'regular'}
                          style={{ color: selectedYear === year ? '#FFFFFF' : theme.colors.text }}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month Selector */}
                <View style={styles.datePickerSection}>
                  <Text variant="caption" color="textSecondary" style={styles.pickerLabel}>Month</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.pickerOption,
                          {
                            backgroundColor: selectedMonth === index ? theme.colors.primary : 'transparent',
                          }
                        ]}
                        onPress={() => setSelectedMonth(index)}
                      >
                        <Text
                          variant="body"
                          weight={selectedMonth === index ? 'semibold' : 'regular'}
                          style={{ color: selectedMonth === index ? '#FFFFFF' : theme.colors.text }}
                        >
                          {month.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Day Selector */}
                <View style={styles.datePickerSection}>
                  <Text variant="caption" color="textSecondary" style={styles.pickerLabel}>Day</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.pickerOption,
                          {
                            backgroundColor: selectedDay === day ? theme.colors.primary : 'transparent',
                          }
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text
                          variant="body"
                          weight={selectedDay === day ? 'semibold' : 'regular'}
                          style={{ color: selectedDay === day ? '#FFFFFF' : theme.colors.text }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
              
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={[styles.datePickerCancelButton, { borderColor: theme.colors.border }]}
                  onPress={() => onDateChange(null)}
                >
                  <Text variant="body" weight="medium" color="textSecondary">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerConfirmButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleConfirm}
                >
                  <Text variant="body" weight="medium" style={{ color: '#FFFFFF' }}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const hasActiveFilters = filters.startDate || filters.endDate || filters.payinPayout;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text variant="title" weight="semibold" color="text">
              Filters
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Date Range Filters */}
          <View style={styles.section}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Date Range
            </Text>
            <View style={styles.dateRangeContainer}>
              {renderDatePicker(
                'Start Date',
                filters.startDate,
                () => setShowStartDatePicker(true),
                showStartDatePicker,
                handleStartDateChange,
                startSelectedYear,
                setStartSelectedYear,
                startSelectedMonth,
                setStartSelectedMonth,
                startSelectedDay,
                setStartSelectedDay
              )}
              {renderDatePicker(
                'End Date',
                filters.endDate,
                () => setShowEndDatePicker(true),
                showEndDatePicker,
                handleEndDateChange,
                endSelectedYear,
                setEndSelectedYear,
                endSelectedMonth,
                setEndSelectedMonth,
                endSelectedDay,
                setEndSelectedDay
              )}
            </View>
          </View>

          {/* Transaction Type Filter */}
          <View style={styles.section}>
            <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
              Transaction Type
            </Text>
            
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
              <Text variant="body" weight="medium" color="textSecondary">
                Reset
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text variant="body" weight="medium" style={{ color: '#FFFFFF' }}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  modalContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 100 : 80,
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
    minWidth: 320,
    maxWidth: 360,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    minHeight: 200,
  },
  datePickerSection: {
    flex: 1,
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  pickerScroll: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginVertical: 2,
    marginHorizontal: 4,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default FilterDrawer;
