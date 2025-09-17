import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { Card, Text, ToggleOption } from '../atomic';
import { MarketType, StockExchangeFilter } from './types';

interface FilterDrawerProps {
  visible: boolean;
  marketType: MarketType;
  selectedExchange: StockExchangeFilter;
  availableExchanges: StockExchangeFilter[];
  onClose: () => void;
  onExchangeChange: (exchange: StockExchangeFilter) => void;
  theme: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.4;

const FilterDrawer = memo<FilterDrawerProps>(({
  visible,
  marketType,
  selectedExchange,
  availableExchanges,
  onClose,
  onExchangeChange,
  theme,
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, opacityAnim]);

  const exchangeOptions: ToggleOption[] = availableExchanges.map(exchange => ({
    value: exchange,
    label: exchange,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background + 'CC', opacity: opacityAnim },
          ]}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawer,
                {
                  backgroundColor: theme.colors.surface,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <SafeAreaView style={styles.safeArea}>
                {/* Handle */}
                <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

                {/* Header */}
                <View style={styles.header}>
                  <Text variant="headline" weight="bold" color="text">
                    Filter Options
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Exchange Filter (only for stocks) */}
                {marketType === 'stocks' && (
                  <Card padding="medium" style={styles.filterCard}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.filterTitle}>
                      Exchange
                    </Text>
                    <Text variant="caption" color="textSecondary" style={styles.filterDescription}>
                      Filter stocks by exchange
                    </Text>
                    
                    <View style={styles.exchangeGrid}>
                      {availableExchanges.map((exchange) => (
                        <TouchableOpacity
                          key={exchange}
                          onPress={() => onExchangeChange(exchange)}
                          style={[
                            styles.exchangeButton,
                            {
                              backgroundColor: selectedExchange === exchange 
                                ? theme.colors.primary 
                                : 'transparent',
                              borderColor: selectedExchange === exchange
                                ? theme.colors.primary
                                : theme.colors.border,
                            },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text
                            variant="body"
                            weight="medium"
                            style={{
                              color: selectedExchange === exchange 
                                ? 'white' 
                                : theme.colors.text,
                            }}
                          >
                            {exchange}
                          </Text>
                          {exchange !== 'All' && (
                            <Text
                              variant="caption"
                              style={{
                                color: selectedExchange === exchange 
                                  ? 'white' 
                                  : theme.colors.textSecondary,
                                opacity: 0.8,
                              }}
                            >
                              Exchange
                            </Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Card>
                )}

                {/* Additional Filters placeholder */}
                <Card padding="medium" style={styles.filterCard}>
                  <Text variant="subtitle" weight="medium" color="text" style={styles.filterTitle}>
                    Sort By
                  </Text>
                  <Text variant="caption" color="textSecondary" style={styles.filterDescription}>
                    Sort your watchlist
                  </Text>
                  
                  <View style={styles.sortOptions}>
                    {['Price', 'Change %', 'Volume', 'Name'].map((sortOption) => (
                      <TouchableOpacity
                        key={sortOption}
                        style={[
                          styles.sortButton,
                          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text variant="body" color="text">
                          {sortOption}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>

                {/* Reset Filters */}
                <TouchableOpacity
                  onPress={() => onExchangeChange('All')}
                  style={[styles.resetButton, { borderColor: theme.colors.border }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />
                  <Text variant="body" weight="medium" style={{ color: theme.colors.textSecondary, marginLeft: 8 }}>
                    Reset Filters
                  </Text>
                </TouchableOpacity>
              </SafeAreaView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawer: {
    height: DRAWER_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCard: {
    marginBottom: 16,
  },
  filterTitle: {
    marginBottom: 4,
  },
  filterDescription: {
    marginBottom: 16,
    opacity: 0.8,
  },
  exchangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exchangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptions: {
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
});

FilterDrawer.displayName = 'FilterDrawer';
export default FilterDrawer;
