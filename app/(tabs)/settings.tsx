import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useEffect, useState } from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text } from '../../components/atomic';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRenderPerformance } from '../../hooks/usePerformance';
import { sessionManager } from '../../services/sessionManager';
import { tradingApiService } from '../../services/tradingApiService';

/**
 * Memoized Settings Section Component
 */
const MemoizedSettingsSection = memo<{
  title: string;
  children: React.ReactNode;
}>(({ title, children }) => (
  <View style={styles.settingsSection}>
    <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
      {title}
    </Text>
    {children}
  </View>
));

MemoizedSettingsSection.displayName = 'MemoizedSettingsSection';

/**
 * Memoized Settings Item Component
 */
const MemoizedSettingsItem = memo<{
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}>(({ icon, title, subtitle, onPress, rightElement }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.settingsItem}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <View style={styles.settingsItemText}>
          <Text variant="body" color="text">{title}</Text>
          {subtitle && (
            <Text variant="caption" color="textSecondary">{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
});

MemoizedSettingsItem.displayName = 'MemoizedSettingsItem';

export default function SettingsScreen() {
  const { theme, themeType, setTheme } = useTheme();
  const { showNotification } = useNotification();
  
  // Performance monitoring
  useRenderPerformance('SettingsScreen');
  
  // Toggle states
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [helpSupportExpanded, setHelpSupportExpanded] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    mobile: '+91 98765 43210',
    username: 'demo',
    accountType: 'Demo Account',
    joinDate: '15 Jan 2024',
    totalTrades: 127,
    currentBalance: '₹5,00,000',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load user data from session
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = sessionManager.getCurrentUser();
      if (currentUser) {
        setUserInfo({
          name: currentUser.name || 'Trading User',
          email: currentUser.email || 'user@example.com',
          mobile: '+91 98765 43210', // This would come from API
          username: currentUser.username || currentUser.id,
          accountType: 'Live Account',
          joinDate: '15 Jan 2024', // This would come from API
          totalTrades: 127, // This would come from API
          currentBalance: '₹5,00,000', // This would come from API
        });
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call logout API
              await tradingApiService.logout(sessionManager.getToken() || undefined);
              
              // Clear local session
              await sessionManager.clearSession();

              showNotification({
                type: 'success',
                title: 'Logged Out',
                message: 'You have been successfully logged out'
              });

              setTimeout(() => {
                router.replace('/auth/login');
              }, 1000);
            } catch (error) {
              console.error('❌ Logout error:', error);
              
              // Still clear local session even if API fails
              await sessionManager.clearSession();
              
              showNotification({
                type: 'warning',
                title: 'Logged Out',
                message: 'Logged out locally (server logout failed)'
              });

              setTimeout(() => {
                router.replace('/auth/login');
              }, 1000);
            }
          },
        },
      ]
    );
  };

  const handleWhatsAppSupport = () => {
    const phoneNumber = '+919876543210'; // Replace with actual support number
    const message = encodeURIComponent('Hi, I need help with the Virtual Trading App.');
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    const webUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Could not open WhatsApp. Please try again.'
        });
      });
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    isExpandable = false,
    isExpanded = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    isExpandable?: boolean;
    isExpanded?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        <View style={styles.settingText}>
          <Text variant="body" weight="medium" color="text">
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color="textSecondary">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {isExpandable ? (
        <Ionicons 
          name={isExpanded ? "chevron-down" : "chevron-forward"} 
          size={20} 
          color={theme.colors.textSecondary} 
        />
      ) : showArrow && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScreenErrorBoundary screenName="Settings">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Fixed Header */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background + 'E6' }]}>
          <View style={styles.statusBarSpacer} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text variant="headline" weight="bold" color="text">
                Settings
              </Text>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                setIsRefreshing(true);
                // Simulate refresh
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >

        {/* Account Details */}
      <Card padding="large" style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text variant="headline" weight="bold" style={{ color: 'white' }}>
              {userInfo.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text variant="subtitle" weight="semibold" color="text">
              {userInfo.name}
            </Text>
            <Text variant="caption" color="textSecondary">
              {userInfo.accountType}
            </Text>
            <Text variant="caption" color="textSecondary">
              Member since {userInfo.joinDate}
            </Text>
          </View>
        </View>

        <View style={styles.accountStats}>
          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {userInfo.totalTrades}
            </Text>
            <Text variant="caption" color="textSecondary">
              Total Trades
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {userInfo.currentBalance}
            </Text>
            <Text variant="caption" color="textSecondary">
              Current Balance
            </Text>
          </View>
        </View>
      </Card>

      {/* Account Settings */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Account Details
          </Text>
        </View>
        
        <SettingItem
          icon="person-outline"
          title="Personal Information"
          subtitle="Manage your personal details"
          onPress={() => setPersonalInfoExpanded(!personalInfoExpanded)}
          isExpandable={true}
          isExpanded={personalInfoExpanded}
          showArrow={false}
        />
        
        {personalInfoExpanded && (
          <View style={styles.expandedSection}>
            <SettingItem
              icon="mail-outline"
              title="Email"
              subtitle={userInfo.email}
              onPress={() => showNotification({
                type: 'info',
                title: 'Email Settings',
                message: 'Email management coming soon'
              })}
            />
            
            <SettingItem
              icon="phone-portrait-outline"
              title="Mobile Number"
              subtitle={userInfo.mobile}
              onPress={() => showNotification({
                type: 'info',
                title: 'Mobile Settings',
                message: 'Mobile number management coming soon'
              })}
            />
          </View>
        )}
        
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your account password"
          onPress={() => showNotification({
            type: 'info',
            title: 'Change Password',
            message: 'Password management coming soon'
          })}
        />
      </Card>

      {/* Wallets Section */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Wallets
          </Text>
        </View>
        
        <SettingItem
          icon="wallet-outline"
          title="Trading Wallet"
          subtitle="Manage your trading funds"
          onPress={() => showNotification({
            type: 'info',
            title: 'Trading Wallet',
            message: 'Wallet management coming soon'
          })}
        />
        
        <SettingItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Add or manage payment options"
          onPress={() => showNotification({
            type: 'info',
            title: 'Payment Methods',
            message: 'Payment management coming soon'
          })}
        />
      </Card>

      {/* Ledger Section */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Ledger
          </Text>
        </View>
        
        <SettingItem
          icon="document-text-outline"
          title="Transaction History"
          subtitle="View all your transactions"
          onPress={() => showNotification({
            type: 'info',
            title: 'Transaction History',
            message: 'Transaction history coming soon'
          })}
        />
        
        <SettingItem
          icon="analytics-outline"
          title="Trade Reports"
          subtitle="Download trading reports"
          onPress={() => showNotification({
            type: 'info',
            title: 'Trade Reports',
            message: 'Report generation coming soon'
          })}
        />
      </Card>

      {/* App Settings */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            App Settings
          </Text>
        </View>
        
        <SettingItem
          icon="color-palette-outline"
          title="Theme"
          subtitle={`Current: ${themeType.charAt(0).toUpperCase() + themeType.slice(1)}`}
          onPress={() => setThemeExpanded(!themeExpanded)}
          isExpandable={true}
          isExpanded={themeExpanded}
          showArrow={false}
        />
        
        {/* Theme Selector */}
        {themeExpanded && (
          <View style={styles.themeSelector}>
            <View style={styles.themeButtons}>
              {[
                { key: 'light', label: 'Light' },
                { key: 'dark', label: 'Dark' },
                { key: 'ocean', label: 'Ocean' },
                { key: 'forest', label: 'Forest' },
                { key: 'sunset', label: 'Sunset' },
                { key: 'cyberpunk', label: 'Cyberpunk' },
                { key: 'purple', label: 'Purple' },
              ].map((themeOption) => (
                <TouchableOpacity
                  key={themeOption.key}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: themeType === themeOption.key ? theme.colors.primary : theme.colors.card,
                      borderColor: themeType === themeOption.key ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setTheme(themeOption.key as any)}
                >
                  <Text 
                    variant="caption" 
                    weight="medium"
                    style={{ 
                      color: themeType === themeOption.key ? 'white' : theme.colors.text 
                    }}
                  >
                    {themeOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <SettingItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Push notifications, alerts"
          onPress={() => showNotification({
            type: 'info',
            title: 'Notification Settings',
            message: 'Notification preferences coming soon'
          })}
        />
        
        <SettingItem
          icon="shield-checkmark-outline"
          title="Security"
          subtitle="Password, biometric settings"
          onPress={() => showNotification({
            type: 'info',
            title: 'Security Settings',
            message: 'Security options coming soon'
          })}
        />
      </Card>

      {/* Support */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Support
          </Text>
        </View>
        
        <SettingItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="FAQ, contact support"
          onPress={() => setHelpSupportExpanded(!helpSupportExpanded)}
          isExpandable={true}
          isExpanded={helpSupportExpanded}
          showArrow={false}
        />
        
        {/* WhatsApp Support */}
        {helpSupportExpanded && (
          <View style={styles.expandedSection}>
            <TouchableOpacity 
              style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
              onPress={handleWhatsAppSupport}
            >
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text variant="body" color="text" weight="medium" style={styles.whatsappText}>
                Need Help? Contact Support
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <SettingItem
          icon="document-text-outline"
          title="Terms & Privacy"
          subtitle="Legal information"
          onPress={() => showNotification({
            type: 'info',
            title: 'Legal Documents',
            message: 'Terms and privacy policy coming soon'
          })}
        />
      </Card>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="large"
          fullWidth={true}
          style={{
            ...styles.logoutButton,
            backgroundColor: theme.colors.background
          }}
        />
      </View>

      <View style={styles.footer}>
        <Text variant="caption" color="textSecondary" style={styles.footerText}>
          Virtual Trading App v1.0.0{'\n'}
          For educational purposes only
        </Text>
      </View>
      </ScrollView>
      </View>
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backdropFilter: 'blur(10px)', // Web only
  },
  statusBarSpacer: {
    height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : 120, // Reduced space for fixed header
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  accountCard: {
    margin: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  logoutContainer: {
    margin: 16,
  },
  logoutButton: {
    height: 56,  // Further increased height
    justifyContent: 'center',
    paddingVertical: 4, // Added padding for extra space
  },
  logoutButtonText: {
    lineHeight: 36,  // Further increased line height
    includeFontPadding: false, // Removes default font padding
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    textAlign: 'center',
  },
  themeSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  expandedSection: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderLeftWidth: 0,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 12,
    borderRadius: 8,
    gap: 8,
  },
  whatsappText: {
    color: 'white',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 16,
    flex: 1,
  },
});
