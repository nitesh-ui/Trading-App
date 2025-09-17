import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Text } from '../atomic';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  const { theme } = useTheme();

  const defaultActions: QuickAction[] = [
    {
      id: 'buy',
      title: 'Buy Stocks',
      subtitle: 'Purchase shares',
      icon: '📈',
      color: theme.colors.profit,
      onPress: () => console.log('Buy pressed'),
    },
    {
      id: 'sell',
      title: 'Sell Stocks',
      subtitle: 'Sell your shares',
      icon: '📉',
      color: theme.colors.loss,
      onPress: () => console.log('Sell pressed'),
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      subtitle: 'View holdings',
      icon: '💼',
      color: theme.colors.primary,
      onPress: () => console.log('Portfolio pressed'),
    },
    {
      id: 'watchlist',
      title: 'Watchlist',
      subtitle: 'Track favorites',
      icon: '⭐',
      color: theme.colors.warning,
      onPress: () => console.log('Watchlist pressed'),
    },
    {
      id: 'news',
      title: 'Market News',
      subtitle: 'Latest updates',
      icon: '📰',
      color: theme.colors.info,
      onPress: () => console.log('News pressed'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Performance data',
      icon: '📊',
      color: theme.colors.secondary,
      onPress: () => console.log('Analytics pressed'),
    },
  ];

  const actionsToRender = actions.length > 0 ? actions : defaultActions;

  return (
    <View style={styles.container}>
      <Text variant="title" weight="bold" color="text" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      
      <View style={styles.actionsGrid}>
        {actionsToRender.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionWrapper}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <Card padding="medium" style={styles.actionCard}>
              <View style={styles.actionContent}>
                <View 
                  style={[
                    styles.iconContainer, 
                    { backgroundColor: action.color + '20' }
                  ]}
                >
                  <Text style={styles.icon}>{action.icon}</Text>
                </View>
                
                <View style={styles.actionText}>
                  <Text 
                    variant="body" 
                    weight="semibold" 
                    color="text"
                    numberOfLines={1}
                  >
                    {action.title}
                  </Text>
                  <Text 
                    variant="caption" 
                    color="textSecondary"
                    numberOfLines={1}
                  >
                    {action.subtitle}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionWrapper: {
    width: '48%', // Two columns
  },
  actionCard: {
    height: 80,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  actionText: {
    flex: 1,
  },
});
