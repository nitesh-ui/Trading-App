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
import { formatIndianCurrency } from '../../utils/indianFormatting';
import { Card, Text } from '../atomic';
import { AssetItem, MarketType } from './types';

interface AssetDrawerProps {
  visible: boolean;
  asset: AssetItem | null;
  marketType: MarketType;
  onClose: () => void;
  onBuyPress: () => void;
  onSellPress: () => void;
  onRemoveFromWatchlist: () => void;
  theme: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_HEIGHT = SCREEN_HEIGHT * 0.6;

const AssetDrawer = memo<AssetDrawerProps>(({
  visible,
  asset,
  marketType,
  onClose,
  onBuyPress,
  onSellPress,
  onRemoveFromWatchlist,
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

  if (!asset) return null;

  const formatPrice = (price: number) => {
    if (marketType === 'stocks') {
      return formatIndianCurrency(price);
    }
    if (marketType === 'crypto' && price > 1000) {
      return `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const changeColor = asset.change >= 0 ? theme.colors.success : theme.colors.error;
  const changeIcon = asset.change >= 0 ? 'trending-up' : 'trending-down';

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
                  <View style={styles.symbolContainer}>
                    <Text variant="headline" weight="bold" color="text">
                      {asset.symbol}
                    </Text>
                    {asset.exchange && (
                      <Text variant="caption" color="textSecondary">
                        {asset.exchange}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>

                <Text variant="body" color="textSecondary" style={styles.companyName}>
                  {asset.name}
                </Text>

                {/* Price Section */}
                <Card padding="medium" style={styles.priceCard}>
                  <View style={styles.priceSection}>
                    <Text variant="display" weight="bold" color="text">
                      {formatPrice(asset.price)}
                    </Text>
                    <View style={[styles.changeContainer, { backgroundColor: changeColor + '20' }]}>
                      <Ionicons name={changeIcon} size={16} color={changeColor} />
                      <Text variant="body" weight="medium" style={{ color: changeColor, marginLeft: 6 }}>
                        {asset.change >= 0 ? '+' : ''}{formatPrice(asset.change)} ({asset.changePercent.toFixed(2)}%)
                      </Text>
                    </View>
                  </View>
                </Card>

                {/* Additional Info */}
                {(asset.high || asset.low || asset.volume || asset.marketCap) && (
                  <Card padding="medium" style={styles.statsCard}>
                    <Text variant="subtitle" weight="medium" color="text" style={styles.statsTitle}>
                      Market Stats
                    </Text>
                    <View style={styles.statsGrid}>
                      {asset.high && (
                        <View style={styles.statItem}>
                          <Text variant="caption" color="textSecondary">High</Text>
                          <Text variant="body" weight="medium" color="text">
                            {formatPrice(asset.high)}
                          </Text>
                        </View>
                      )}
                      {asset.low && (
                        <View style={styles.statItem}>
                          <Text variant="caption" color="textSecondary">Low</Text>
                          <Text variant="body" weight="medium" color="text">
                            {formatPrice(asset.low)}
                          </Text>
                        </View>
                      )}
                      {asset.volume && (
                        <View style={styles.statItem}>
                          <Text variant="caption" color="textSecondary">Volume</Text>
                          <Text variant="body" weight="medium" color="text">
                            {asset.volume.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      {asset.marketCap && (
                        <View style={styles.statItem}>
                          <Text variant="caption" color="textSecondary">Market Cap</Text>
                          <Text variant="body" weight="medium" color="text">
                            {formatIndianCurrency(asset.marketCap)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Card>
                )}

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    onPress={onBuyPress}
                    style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-up" size={20} color="white" />
                    <Text variant="body" weight="bold" style={styles.actionButtonText}>
                      BUY
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={onSellPress}
                    style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trending-down" size={20} color="white" />
                    <Text variant="body" weight="bold" style={styles.actionButtonText}>
                      SELL
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Remove from Watchlist */}
                <TouchableOpacity
                  onPress={onRemoveFromWatchlist}
                  style={[styles.removeButton, { borderColor: theme.colors.error }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  <Text variant="body" weight="medium" style={{ color: theme.colors.error, marginLeft: 8 }}>
                    Remove from Watchlist
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  symbolContainer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    marginBottom: 16,
    opacity: 0.8,
  },
  priceCard: {
    marginBottom: 16,
  },
  priceSection: {
    alignItems: 'flex-start',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statsCard: {
    marginBottom: 24,
  },
  statsTitle: {
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginBottom: 8,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
  },
  removeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});

AssetDrawer.displayName = 'AssetDrawer';
export default AssetDrawer;
