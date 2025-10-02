import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';

interface DatePickerProps {
  value: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder,
  minimumDate,
  maximumDate,
}) => {
  const { theme } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handleClear = useCallback(() => {
    onDateChange(null);
  }, [onDateChange]);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const handleDateSelect = useCallback((selectedDate: Date) => {
    onDateChange(selectedDate);
    setShowPicker(false);
  }, [onDateChange]);

  const generateDateOptions = useCallback(() => {
    const dates = [];
    const today = new Date();
    const startDate = minimumDate || new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const endDate = maximumDate || today;
    
    // Generate dates from end to start (most recent first)
    for (let i = 0; i < 30; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      
      if (date >= startDate) {
        dates.push(date);
      }
    }
    
    return dates;
  }, [minimumDate, maximumDate]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.dateButton,
          { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border 
          }
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={theme.colors.textSecondary} 
        />
        <Text 
          variant="body" 
          color={value ? "text" : "textSecondary"}
          style={styles.dateText}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons 
              name="close-circle" 
              size={18} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="fade"
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View 
            style={[
              styles.pickerContainer, 
              { backgroundColor: theme.colors.surface }
            ]}
          >
            <View style={styles.header}>
              <Text variant="subtitle" weight="semibold" color="text">
                Select Date
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateList}>
              {generateDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateOption,
                    { 
                      backgroundColor: value?.toDateString() === date.toDateString() 
                        ? theme.colors.primary 
                        : 'transparent',
                      borderBottomColor: theme.colors.border
                    }
                  ]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text 
                    variant="body" 
                    color={value?.toDateString() === date.toDateString() ? undefined : 'text'}
                    style={{
                      color: value?.toDateString() === date.toDateString() ? 'white' : undefined
                    }}
                  >
                    {formatDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  dateText: {
    flex: 1,
  },
  clearButton: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '70%',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  dateList: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginVertical: 2,
  },
});

export default DatePicker;
