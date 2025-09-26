import React, { useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  Easing,
  Pressable,
} from 'react-native';
import { Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlidingPageProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  showBackButton?: boolean;
  headerActions?: React.ReactNode;
  fullScreen?: boolean;
}

const SlidingPage = memo(({
  visible,
  title,
  onClose,
  children,
  showBackButton = true,
  headerActions,
  fullScreen = true,
}: SlidingPageProps) => {
  const { theme, isDark } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in from right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Material Design easing
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to right
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayOpacity]);

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
      >
        <Pressable 
          style={styles.overlayPressable} 
          onPress={onClose}
        />
      </Animated.View>

      {/* Sliding Page */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            transform: [{ translateX: slideAnim }],
            height: fullScreen ? SCREEN_HEIGHT : SCREEN_HEIGHT * 0.9,
            top: fullScreen ? 0 : SCREEN_HEIGHT * 0.1,
          },
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.background + 'E6' }]}>
          <View style={styles.statusBarSpacer} />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {showBackButton && (
                <Pressable
                  onPress={onClose}
                  style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                  android_ripple={{ color: theme.colors.primary + '20' }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={theme.colors.text}
                  />
                </Pressable>
              )}
              <Text variant="headline" weight="semibold" color="text" style={styles.headerTitle}>
                {title}
              </Text>
            </View>

            {headerActions && (
              <View style={styles.headerActions}>
                {headerActions}
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </>
  );
});

SlidingPage.displayName = 'SlidingPage';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  overlayPressable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    right: 0,
    width: SCREEN_WIDTH,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    flex: 1,
  },
});

export default SlidingPage;
