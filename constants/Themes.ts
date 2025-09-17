export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    profit: string;
    loss: string;
    neutral: string;
    shadow: string;
    overlay: string;
    tabBarBackground: string;
    tabBarInactive: string;
    tabBarActive: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  typography: {
    fontSizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    fontWeights: {
      light: '300';
      regular: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
}

const baseTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 50,
  },
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeights: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};

export const lightTheme: Theme = {
  name: 'Light',
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    accent: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#007AFF',
    profit: '#00C896',
    loss: '#FF6B6B',
    neutral: '#8E8E93',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#8E8E93',
    tabBarActive: '#007AFF',
  },
  ...baseTheme,
};

export const darkTheme: Theme = {
  name: 'Dark',
  colors: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
    accent: '#FF453A',
    success: '#32D74B',
    warning: '#FF9F0A',
    error: '#FF453A',
    info: '#64D2FF',
    profit: '#00D4AA',
    loss: '#FF6B6B',
    neutral: '#8E8E93',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBarBackground: '#1C1C1E',
    tabBarInactive: '#8E8E93',
    tabBarActive: '#0A84FF',
  },
  ...baseTheme,
};

export const oceanTheme: Theme = {
  name: 'Ocean',
  colors: {
    primary: '#0077BE',
    secondary: '#00A8CC',
    background: '#F0F8FF',
    surface: '#E6F3FF',
    card: '#FFFFFF',
    text: '#003D5B',
    textSecondary: '#5B8FA8',
    border: '#B8D4E3',
    accent: '#FF6B35',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#E17055',
    info: '#74B9FF',
    profit: '#00B894',
    loss: '#E17055',
    neutral: '#7F8C8D',
    shadow: 'rgba(0, 119, 190, 0.15)',
    overlay: 'rgba(0, 61, 91, 0.6)',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#5B8FA8',
    tabBarActive: '#0077BE',
  },
  ...baseTheme,
};

export const forestTheme: Theme = {
  name: 'Forest',
  colors: {
    primary: '#2D5016',
    secondary: '#4A7C59',
    background: '#F8FFF8',
    surface: '#F0F8F0',
    card: '#FFFFFF',
    text: '#1B4332',
    textSecondary: '#52796F',
    border: '#A8DADC',
    accent: '#F77F00',
    success: '#52B788',
    warning: '#F9C74F',
    error: '#F8961E',
    info: '#277DA1',
    profit: '#52B788',
    loss: '#F8961E',
    neutral: '#6C757D',
    shadow: 'rgba(45, 80, 22, 0.15)',
    overlay: 'rgba(27, 67, 50, 0.6)',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#52796F',
    tabBarActive: '#2D5016',
  },
  ...baseTheme,
};

export const sunsetTheme: Theme = {
  name: 'Sunset',
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#FFF8F0',
    surface: '#FFE8CC',
    card: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#7F8C8D',
    border: '#F39C12',
    accent: '#9B59B6',
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
    profit: '#27AE60',
    loss: '#E74C3C',
    neutral: '#95A5A6',
    shadow: 'rgba(255, 107, 107, 0.15)',
    overlay: 'rgba(44, 62, 80, 0.6)',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#7F8C8D',
    tabBarActive: '#FF6B6B',
  },
  ...baseTheme,
};

export const cyberpunkTheme: Theme = {
  name: 'Cyberpunk',
  colors: {
    primary: '#00FFFF',
    secondary: '#FF00FF',
    background: '#0A0A0A',
    surface: '#1A1A1A',
    card: '#2A2A2A',
    text: '#00FFFF',
    textSecondary: '#888888',
    border: '#333333',
    accent: '#FF0080',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0040',
    info: '#0080FF',
    profit: '#00FF80',
    loss: '#FF4080',
    neutral: '#666666',
    shadow: 'rgba(0, 255, 255, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    tabBarBackground: '#1A1A1A',
    tabBarInactive: '#888888',
    tabBarActive: '#00FFFF',
  },
  ...baseTheme,
};

export const purpleTheme: Theme = {
  name: 'Purple',
  colors: {
    primary: '#6B46C1',
    secondary: '#A855F7',
    background: '#FDFBFF',
    surface: '#F3E8FF',
    card: '#FFFFFF',
    text: '#4C1D95',
    textSecondary: '#7C3AED',
    border: '#C4B5FD',
    accent: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    profit: '#10B981',
    loss: '#EF4444',
    neutral: '#6B7280',
    shadow: 'rgba(107, 70, 193, 0.15)',
    overlay: 'rgba(76, 29, 149, 0.6)',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#7C3AED',
    tabBarActive: '#6B46C1',
  },
  ...baseTheme,
};

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
  forest: forestTheme,
  sunset: sunsetTheme,
  cyberpunk: cyberpunkTheme,
  purple: purpleTheme,
};

export type ThemeType = keyof typeof themes;
export const themeKeys = Object.keys(themes) as ThemeType[];
