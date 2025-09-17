import React from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useFadeAnimation } from '../../hooks/useAnimations';
import { Text } from '../atomic';

interface LoadingScreenProps {
  message?: string;
  visible?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  visible = true,
}) => {
  const { theme } = useTheme();
  const fadeAnimation = useFadeAnimation(visible);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.spinner}
        />
        <Animated.View style={fadeAnimation}>
          <Text
            variant="body"
            weight="medium"
            color="text"
            style={styles.message}
          >
            {message}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
  },
});
