import React from 'react';
import {
    Text as RNText,
    StyleSheet,
    TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type TextVariant = 
  | 'display' 
  | 'headline' 
  | 'title' 
  | 'subtitle' 
  | 'body' 
  | 'caption' 
  | 'overline';

export type TextWeight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

export type TextColor = 
  | 'primary' 
  | 'secondary' 
  | 'text' 
  | 'textSecondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'profit'
  | 'loss';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  style?: TextStyle;
  numberOfLines?: number;
  onPress?: () => void;
  testID?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  weight = 'regular',
  color = 'text',
  style,
  numberOfLines,
  onPress,
  testID,
}) => {
  const { theme } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'display':
        return {
          fontSize: theme.typography.fontSizes.xxxl,
          lineHeight: theme.typography.fontSizes.xxxl * 1.2,
        };
      case 'headline':
        return {
          fontSize: theme.typography.fontSizes.xxl,
          lineHeight: theme.typography.fontSizes.xxl * 1.3,
        };
      case 'title':
        return {
          fontSize: theme.typography.fontSizes.xl,
          lineHeight: theme.typography.fontSizes.xl * 1.4,
        };
      case 'subtitle':
        return {
          fontSize: theme.typography.fontSizes.lg,
          lineHeight: theme.typography.fontSizes.lg * 1.4,
        };
      case 'body':
        return {
          fontSize: theme.typography.fontSizes.md,
          lineHeight: theme.typography.fontSizes.md * 1.5,
        };
      case 'caption':
        return {
          fontSize: theme.typography.fontSizes.sm,
          lineHeight: theme.typography.fontSizes.sm * 1.4,
        };
      case 'overline':
        return {
          fontSize: theme.typography.fontSizes.xs,
          lineHeight: theme.typography.fontSizes.xs * 1.3,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        };
      default:
        return {
          fontSize: theme.typography.fontSizes.md,
          lineHeight: theme.typography.fontSizes.md * 1.5,
        };
    }
  };

  const getWeightStyle = (): TextStyle => {
    return {
      fontWeight: theme.typography.fontWeights[weight],
    };
  };

  const getColorStyle = (): TextStyle => {
    return {
      color: theme.colors[color],
    };
  };

  const textStyle: TextStyle[] = [
    styles.text,
    getVariantStyle(),
    getWeightStyle(),
    getColorStyle(),
    ...(style ? [style] : []),
  ];

  return (
    <RNText
      style={textStyle}
      numberOfLines={numberOfLines}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    // Base text styles
  },
});
