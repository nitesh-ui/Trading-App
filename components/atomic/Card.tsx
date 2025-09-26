import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  borderRadius?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 'medium',
  shadow = true,
  borderRadius = 'medium',
}) => {
  const { theme } = useTheme();

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'small':
        return { padding: theme.spacing.sm };
      case 'medium':
        return { padding: theme.spacing.md };
      case 'large':
        return { padding: theme.spacing.lg };
      default:
        return { padding: theme.spacing.md };
    }
  };

  const getBorderRadiusStyle = (): ViewStyle => {
    switch (borderRadius) {
      case 'small':
        return { borderRadius: theme.borderRadius.sm };
      case 'medium':
        return { borderRadius: theme.borderRadius.md };
      case 'large':
        return { borderRadius: theme.borderRadius.lg };
      default:
        return { borderRadius: theme.borderRadius.md };
    }
  };

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    },
    getPaddingStyle(),
    getBorderRadiusStyle(),
    ...(shadow ? [{
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }] : []),
    ...(style ? [style] : []),
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    // Removed default border
  },
});
