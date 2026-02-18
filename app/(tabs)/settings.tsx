import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { memo, useEffect, useState, useCallback } from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Card, Text, Button } from '../../components/atomic';
import WalletPage from '../../components/ui/WalletPage';
import DepositPage from '../../components/ui/DepositPage';
import WithdrawalPage from '../../components/ui/WithdrawalPage';
import NotificationsPage from '../../components/ui/NotificationsPage';
import ChangePasswordPage from '../../components/ui/ChangePasswordPage';
import TermsPrivacyPage from '../../components/ui/TermsPrivacyPage';
import KYCWizardPage from '../../components/ui/KYCWizardPage';
import KYCStatusOverviewModal from '../../components/ui/KYCStatusOverviewModal';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSegment } from '../../contexts/SegmentContext';
import { useRenderPerformance } from '../../hooks/usePerformance';
import AuthUtils from '../../services/authUtils';
import { sessionManager } from '../../services/sessionManager';
import { tradingApiService, WalletBalanceData } from '../../services/tradingApiService';
import { useAuthErrorHandler } from '../../hooks/useAuthErrorHandler';

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
  isExpandable?: boolean;
  isExpanded?: boolean;
}>(({ icon, title, subtitle, onPress, isExpandable, isExpanded }) => {
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
      {isExpandable ? (
        <Ionicons 
          name={isExpanded ? "chevron-down" : "chevron-forward"} 
          size={20} 
          color={theme.colors.textSecondary} 
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
});

MemoizedSettingsItem.displayName = 'MemoizedSettingsItem';

export default function SettingsScreen() {
  const { theme, themeType, setTheme } = useTheme();
  const { showNotification } = useNotification();
  const { handle401 } = useAuthErrorHandler();
  const { selectedSegments, toggleSegment } = useSegment();
  
  // Performance monitoring
  useRenderPerformance('SettingsScreen');
  
  // Toggle states
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(false);
  const [themeExpanded, setThemeExpanded] = useState(false);
  const [helpSupportExpanded, setHelpSupportExpanded] = useState(false);
  const [paymentMethodsExpanded, setPaymentMethodsExpanded] = useState(false);
  
  // KYC Wizard states
  const [kycExpanded, setKycExpanded] = useState(false);
  const [expandedKycItem, setExpandedKycItem] = useState<string | null>(null);
  const [kycModalVisible, setKycModalVisible] = useState(false);
  const [selectedKycType, setSelectedKycType] = useState<'aadhar' | 'pan' | 'profile-picture' | 'digital-signature' | 'bank-details' | null>(null);
  const [kycStatusModalVisible, setKycStatusModalVisible] = useState(false);
  const [kycDocumentStatuses, setKycDocumentStatuses] = useState({
    aadharCard: 'Not Sent' as const,
    panCard: 'Not Sent' as const,
    profilePicture: 'Not Sent' as const,
    digitalSignature: 'Not Sent' as const,
    bankDetails: 'Not Sent' as const,
  });
  
  const [userInfo, setUserInfo] = useState({
    name: 'Demo User',
    email: 'demo@example.com',
    mobile: '+91 XXXXXXXXXX',
    username: 'demo',
    accountType: 'Demo Account',
    joinDate: new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }),
    totalTrades: 0,
    currentBalance: '5,00,000',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWalletPageVisible, setIsWalletPageVisible] = useState(false);
  const [isDepositPageVisible, setIsDepositPageVisible] = useState(false);
  const [isWithdrawalPageVisible, setIsWithdrawalPageVisible] = useState(false);
  const [isNotificationsPageVisible, setIsNotificationsPageVisible] = useState(false);
  const [isChangePasswordPageVisible, setIsChangePasswordPageVisible] = useState(false);
  const [isTermsPrivacyPageVisible, setIsTermsPrivacyPageVisible] = useState(false);
  const [walletData, setWalletData] = useState<WalletBalanceData | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const handleResetPasswordPress = () => {
    setIsChangePasswordPageVisible(true);
  };
  
  const handleCloseChangePasswordPage = () => {
    setIsChangePasswordPageVisible(false);
  };

  const handleTermsPrivacyPress = () => {
    setIsTermsPrivacyPageVisible(true);
  };

  const handleCloseTermsPrivacyPage = () => {
    setIsTermsPrivacyPageVisible(false);
  };
  
  const [isReportsPageVisible, setIsReportsPageVisible] = useState(false);

  const handleNotificationsPress = () => {
    setIsNotificationsPageVisible(true);
  };

  const handleCloseNotificationsPage = () => {
    setIsNotificationsPageVisible(false);
  };

  const handleWalletPress = () => {
    setIsWalletPageVisible(true);
  };

  const handleCloseWalletPage = () => {
    setIsWalletPageVisible(false);
    // Refresh wallet balance when closing wallet page
    fetchWalletBalance();
  };

  const handleDepositPress = () => {
    setIsDepositPageVisible(true);
  };

  const handleCloseDepositPage = () => {
    setIsDepositPageVisible(false);
    // Refresh wallet balance after deposit
    fetchWalletBalance();
  };

  const handleWithdrawPress = () => {
    setIsWithdrawalPageVisible(true);
  };

  const handleCloseWithdrawalPage = () => {
    setIsWithdrawalPageVisible(false);
    // Refresh wallet balance after withdrawal
    fetchWalletBalance();
  };

  const handleReportsPress = () => {
    setIsReportsPageVisible(true);
  };

  const handleCloseReportsPage = () => {
    setIsReportsPageVisible(false);
  };

  // Fetch wallet balance from API
  const fetchWalletBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      
      const response = await tradingApiService.getWalletBalance();
      
      if (response.data) {
        setWalletData(response.data);
        // Update current balance in userInfo - use 'amount' field from API
        const balance = parseFloat(response.data.amount || '0');
        setUserInfo(prev => ({
          ...prev,
          currentBalance: `${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }));
      }
    } catch (err: any) {
      console.error('Error fetching wallet balance:', err);
      
      if (err.status === 401) {
        await handle401();
      } else {
        // Don't show notification for balance fetch errors in settings
        console.error('Failed to fetch wallet balance:', err.message);
      }
    } finally {
      setLoadingBalance(false);
    }
  }, [handle401]);

  // Fetch total number of completed trades
  const fetchCompletedTradesCount = useCallback(async () => {
    try {
      // Get today's date range to fetch all completed trades
      const today = new Date();
      const startDate = new Date(2020, 0, 1); // Start from a very old date to get all trades
      const endDateStr = today.toISOString().split('T')[0];
      const startDateStr = startDate.toISOString().split('T')[0];

      const response = await tradingApiService.getTransactionHistoryForReports({
        pageNo: 1,
        startDate: startDateStr,
        endDate: endDateStr,
        scriptExchange: 'All',
        currentPosition: 'All',
      });

      if (response.data && response.data.length > 0) {
        // Count the total number of completed trades
        const totalTrades = response.data.length;
        setUserInfo(prev => ({
          ...prev,
          totalTrades,
        }));
      }
    } catch (err) {
      console.error('Error fetching completed trades count:', err);
    }
  }, []);

  // Load user data from session
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = sessionManager.getCurrentUser();
      if (currentUser) {
        // Format mobile number with country code and spacing
        let formattedMobile = currentUser.mobile || 'Number Not Found';
        if (formattedMobile && formattedMobile !== 'Number Not Found') {
          // Ensure it starts with +91 for India
          if (!formattedMobile.startsWith('+91')) {
            formattedMobile = `+91 ${formattedMobile}`;
          } else if (!formattedMobile.includes(' ')) {
            // Add spacing if +91 exists but no space
            formattedMobile = formattedMobile.replace(/(\d{2})(\d{5})(\d{5})/, '$1 $2 $3');
          }
        }
        
        // Format join date if available
        let formattedJoinDate = currentUser.joinDate || new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
        if (formattedJoinDate && formattedJoinDate !== new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })) {
          try {
            const date = new Date(formattedJoinDate);
            formattedJoinDate = date.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } catch (error) {
            // Keep original format if parsing fails
            console.error('Error formatting join date:', error);
          }
        }
        
        setUserInfo(prev => ({
          ...prev,
          name: currentUser.name || 'Trading User',
          email: currentUser.email || 'user@example.com',
          mobile: formattedMobile,
          username: currentUser.username || currentUser.id,
          accountType: 'Live Account',
          joinDate: formattedJoinDate,
        }));
      }
      
      // Fetch wallet balance and completed trades count
      await fetchWalletBalance();
      await fetchCompletedTradesCount();
    };

    loadUserData();
  }, [fetchWalletBalance, fetchCompletedTradesCount]);

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
              // Use AuthUtils for comprehensive logout
              await AuthUtils.logout();

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
        <StatusBar
          barStyle={['dark', 'cyberpunk'].includes(themeType) ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        {/* Fixed Header */}
        <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.statusBarSpacer, { backgroundColor: theme.colors.background }]} />
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
              onRefresh={async () => {
                setIsRefreshing(true);
                await fetchWalletBalance();
                setIsRefreshing(false);
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
            {loadingBalance ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text variant="body" weight="semibold" color="text">
                {userInfo.currentBalance}
              </Text>
            )}
            <Text variant="caption" color="textSecondary">
              Current Balance
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text variant="body" weight="semibold" color="text">
              {userInfo.totalTrades}
            </Text>
            <Text variant="caption" color="textSecondary">
              Total Trades
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
              // onPress={() => showNotification({
              //   type: 'info',
              //   title: 'Email Settings',
              //   message: 'Email management coming soon'
              // })}
            />
            
            <SettingItem
              icon="phone-portrait-outline"
              title="Mobile Number"
              subtitle={userInfo.mobile}
              // onPress={() => showNotification({
              //   type: 'info',
              //   title: 'Mobile Settings',
              //   message: 'Mobile number management coming soon'
              // })}
            />
          </View>
        )}
        
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your account password"
          onPress={handleResetPasswordPress}
        />
      </Card>

      {/* KYC Wizard Section */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            KYC Wizard
          </Text>
        </View>
        
        <SettingItem
          icon="document-outline"
          title="Aadhar Card"
          subtitle="Upload the Aadhar document"
          onPress={() => {
            setSelectedKycType('aadhar');
            setKycModalVisible(true);
          }}
        />
        
        <SettingItem
          icon="card-outline"
          title="PAN Card"
          subtitle="Upload PAN Document"
          onPress={() => {
            setSelectedKycType('pan');
            setKycModalVisible(true);
          }}
        />
        
        <SettingItem
          icon="person-circle-outline"
          title="Profile Picture"
          subtitle="Upload your profile picture"
          onPress={() => {
            setSelectedKycType('profile-picture');
            setKycModalVisible(true);
          }}
        />
        
        <SettingItem
          icon="checkmark-done-outline"
          title="Digital Signature"
          subtitle="Upload your digital signature"
          onPress={() => {
            setSelectedKycType('digital-signature');
            setKycModalVisible(true);
          }}
        />
        
        <SettingItem
          icon="home"
          title="Bank Details"
          subtitle="Add your bank account information"
          onPress={() => {
            setSelectedKycType('bank-details');
            setKycModalVisible(true);
          }}
        />
        
        <SettingItem
          icon="document-text-outline"
          title="KYC Status Overview"
          subtitle="View your KYC submission status"
          onPress={() => {
            setKycStatusModalVisible(true);
          }}
        />
      </Card>
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Request Segment
          </Text>
        </View>
        
        {/* Segment Selector */}
        <View style={styles.segmentSelectorContainer}>
          {[
            { key: 'stocks', label: 'Stocks' },
            { key: 'forex', label: 'Forex' },
            { key: 'crypto', label: 'Crypto' }
          ].map((segment) => (
            <TouchableOpacity
              key={segment.key}
              style={styles.segmentRow}
              onPress={() => toggleSegment(segment.key as any)}
              activeOpacity={0.7}
            >
              <Text variant="body" color="text">
                {segment.label}
              </Text>
              <View 
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: selectedSegments.includes(segment.key as any) ? theme.colors.primary : theme.colors.border }
                ]}
              >
                <View 
                  style={[
                    styles.toggleCircle,
                    { 
                      alignSelf: selectedSegments.includes(segment.key as any) ? 'flex-end' : 'flex-start',
                      backgroundColor: theme.colors.surface
                    }
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
          onPress={handleWalletPress}
        />
        
        <SettingItem
          icon="card-outline"
          title="Payment Methods"
          subtitle="Deposit or Withdraw funds"
          onPress={() => setPaymentMethodsExpanded(!paymentMethodsExpanded)}
          isExpandable={true}
          isExpanded={paymentMethodsExpanded}
        />
        
        {paymentMethodsExpanded && (
          <View style={styles.expandedSection}>
            <SettingItem
              icon="arrow-down-outline"
              title="Deposit"
              subtitle="Add funds to your wallet"
              onPress={handleDepositPress}
            />
            <SettingItem
              icon="arrow-up-outline"
              title="Withdraw"
              subtitle="Withdraw funds from your wallet"
              onPress={handleWithdrawPress}
            />
          </View>
        )}
      </Card>

      {/* Ledger Section */}
      <Card padding="none" style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="subtitle" weight="semibold" color="text">
            Ledger
          </Text>
        </View>
        
        <SettingItem
          icon="analytics-outline"
          title="Trade Reports"
          subtitle="Download trading reports"
          onPress={() => router.push("/report")}
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
          onPress={handleNotificationsPress}
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
          onPress={handleTermsPrivacyPress}
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

      {/* <View style={styles.footer}>
        <Text variant="caption" color="textSecondary" style={styles.footerText}>
          Virtual Trading App v1.0.0{'\n'}
          For educational purposes only
        </Text>
      </View> */}
      </ScrollView>
      </View>
      {/* Wallet Page */}
      <WalletPage
        visible={isWalletPageVisible}
        onClose={handleCloseWalletPage}
      />
      <DepositPage
        visible={isDepositPageVisible}
        onClose={handleCloseDepositPage}
      />
      <WithdrawalPage
        visible={isWithdrawalPageVisible}
        onClose={handleCloseWithdrawalPage}
      />
      <NotificationsPage
        visible={isNotificationsPageVisible}
        onClose={handleCloseNotificationsPage}
      />
      <ChangePasswordPage
        visible={isChangePasswordPageVisible}
        onClose={handleCloseChangePasswordPage}
      />
      <TermsPrivacyPage
        visible={isTermsPrivacyPageVisible}
        onClose={handleCloseTermsPrivacyPage}
      />
      <KYCWizardPage
        visible={kycModalVisible}
        selectedType={selectedKycType}
        onClose={() => {
          setKycModalVisible(false);
          setSelectedKycType(null);
          // Trigger KYC Status Overview to refresh when wizard closes
          if (kycStatusModalVisible) {
            // Add a small delay to let the wizard close first
            setTimeout(() => {
              setKycStatusModalVisible(false);
              setTimeout(() => {
                setKycStatusModalVisible(true);
              }, 100);
            }, 300);
          }
        }}
      />
      <KYCStatusOverviewModal
        visible={kycStatusModalVisible}
        onClose={() => setKycStatusModalVisible(false)}
      />
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
    paddingTop: Platform.OS === 'ios' ? 76 : 96, // Reduced top padding
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
    marginHorizontal: 16,
    marginBottom: 16,
    marginLeft: 0,
    marginRight: 0,
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
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
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
  segmentSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  segmentSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentToggle: {
    marginBottom: 0,
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
