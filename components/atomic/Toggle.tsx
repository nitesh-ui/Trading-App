import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from './Text';

export type ToggleOption = {
  value: string;
  label: string;
  icon?: string; // For future icon support
};

interface ToggleProps {
  options: ToggleOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: any;
}

export const Toggle: React.FC<ToggleProps> = ({
  options,
  selectedValue,
  onValueChange,
  style,
}) => {
  const { theme } = useTheme();
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const selectedIndex = options.findIndex(option => option.value === selectedValue);
    Animated.timing(slideAnimation, {
      toValue: selectedIndex,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selectedValue, options, slideAnimation]);

  const handlePress = (value: string) => {
    // Haptic feedback animation
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
    
    onValueChange(value);
  };

  const toggleWidth = Math.min(screenWidth - 40, 320); // Responsive width
  const optionWidth = toggleWidth / options.length;

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            width: toggleWidth,
          },
          { transform: [{ scale: scaleAnimation }] }
        ]}
      >
        {/* Sliding background indicator */}
        <Animated.View
          style={[
            styles.slidingBackground,
            {
              backgroundColor: theme.colors.primary,
              width: optionWidth - 6,
              transform: [
                {
                  translateX: slideAnimation.interpolate({
                    inputRange: [0, options.length - 1],
                    outputRange: [3, (options.length - 1) * optionWidth + 3],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        />
        
        {/* Options */}
        {options.map((option, index) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { width: optionWidth },
              ]}
              onPress={() => handlePress(option.value)}
              activeOpacity={0.8}
            >
              <Animated.View style={styles.optionContent}>
                <Text
                  style={{
                    ...styles.optionText,
                    color: isSelected 
                      ? '#FFFFFF'
                      : theme.colors.textSecondary,
                  }}
                  weight={isSelected ? 'semibold' : 'medium'}
                >
                  {option.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 3,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    position: 'relative',
    backgroundColor: '#F8F9FA',
  },
  slidingBackground: {
    position: 'absolute',
    top: 3,
    height: 40,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  option: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    zIndex: 1,
    height: 40,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});
