import React from 'react';
import {
    ActivityIndicator,
    Animated,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useScaleAnimation } from '../../hooks/useAnimations';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const { theme } = useTheme();
  const scaleAnimation = useScaleAnimation(!disabled && !loading);

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: theme.colors.primary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.colors.secondary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.primary,
          },
          text: {
            color: theme.colors.primary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: {
            color: theme.colors.primary,
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: theme.colors.error,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      default:
        return {
          container: {
            backgroundColor: theme.colors.primary,
            borderWidth: 0,
          },
          text: {
            color: '#FFFFFF',
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
            minHeight: 32,
          },
          text: {
            fontSize: theme.typography.fontSizes.sm,
          },
        };
      case 'medium':
        return {
          container: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            minHeight: 44,
          },
          text: {
            fontSize: theme.typography.fontSizes.md,
          },
        };
      case 'large':
        return {
          container: {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            minHeight: 56,
          },
          text: {
            fontSize: theme.typography.fontSizes.lg,
          },
        };
      default:
        return {
          container: {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            minHeight: 44,
          },
          text: {
            fontSize: theme.typography.fontSizes.md,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      borderRadius: theme.borderRadius.md,
      shadowColor: theme.colors.shadow,
    },
    variantStyles.container,
    sizeStyles.container,
    ...(fullWidth ? [styles.fullWidth] : []),
    ...(disabled ? [styles.disabled] : []),
    ...(style ? [style] : []),
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    {
      fontWeight: theme.typography.fontWeights.semibold,
    },
    variantStyles.text,
    sizeStyles.text,
    ...(disabled ? [styles.disabledText] : []),
    ...(textStyle ? [textStyle] : []),
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variantStyles.text.color} 
            style={styles.loader}
          />
          <Text style={textStyles}>{title}</Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={[styles.contentContainer, iconPosition === 'right' && styles.contentReverse]}>
          {iconPosition === 'left' && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
          {iconPosition === 'right' && <View style={styles.iconContainer}>{icon}</View>}
        </View>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  return (
    <Animated.View style={[scaleAnimation]}>
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentReverse: {
    flexDirection: 'row-reverse',
  },
  iconContainer: {
    marginHorizontal: 4,
  },
});
