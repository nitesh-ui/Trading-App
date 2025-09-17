import { StyleSheet } from 'react-native';
// import Animated, {
//   useAnimatedStyle,
//   useSharedValue,
//   withRepeat,
//   withSequence,
//   withTiming,
// } from 'react-native-reanimated';

import { ThemedText } from './ThemedText';

export function HelloWave() {
  return (
    <ThemedText style={styles.text}>👋</ThemedText>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
