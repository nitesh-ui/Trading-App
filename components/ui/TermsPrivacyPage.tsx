import { Ionicons } from '@expo/vector-icons';
import React, { memo, useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Card, Text } from '../atomic';
import SlidingPage from './SlidingPage';
import { useTheme } from '../../contexts/ThemeContext';

interface TermsPrivacyPageProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'terms' | 'privacy';

const TermsPrivacyPage = memo(({ visible, onClose }: TermsPrivacyPageProps) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const termsContent = `Terms of Service

Effective Date: December 13, 2025

1. Acceptance of Terms
By using the Trading App trading application (the "App") and accessing any of the services provided by Sanaita Technologies ("we," "our," or "us"), you agree to comply with and be bound by these Terms of Service, our Privacy Policy, and any additional policies that may apply. If you do not agree with these terms, you should not use the App.

2. User Eligibility
You must be at least 18 years old and legally able to enter into binding contracts in order to use this App. By using the App, you represent that you meet the eligibility criteria.

3. Account Registration and Security
To use certain features of the App, you may need to create an account. You agree to provide accurate, up-to-date information during registration and to update it as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.

If you suspect unauthorized access to your account, you must notify us immediately at support@sanaita.com. We are not responsible for any losses resulting from unauthorized use of your account.

4. Use of Services
The App provides trading services related to stocks, cryptocurrencies, forex, and commodities. You agree to use the App only for lawful purposes and in accordance with these Terms.

You acknowledge that the App is a platform for executing trades and not a financial advisor. You are solely responsible for the decisions you make based on the information provided by the App.

5. Fees
Access to and use of the App may be subject to certain fees, such as transaction fees or account maintenance fees. The specific fees will be disclosed to you before you complete any transactions. You agree to pay all applicable fees as specified.

6. Risk Acknowledgment
Trading involves substantial risk and may not be suitable for all users. The value of assets can fluctuate significantly, and you may lose all or part of your investment. By using the App, you acknowledge and accept these risks.

7. Restrictions
You agree not to:

• Use the App for any unlawful purpose or in violation of applicable laws or regulations.

• Engage in market manipulation, fraud, or any other activity that could negatively impact the market or other users.

• Interfere with the security or functionality of the App.

8. Suspension and Termination
We reserve the right to suspend or terminate your access to the App if you violate these Terms or engage in any prohibited activity. Upon termination, your rights to use the App will cease, and you must stop using it immediately.

9. Limitation of Liability
To the maximum extent permitted by law, we are not liable for any direct, indirect, incidental, special, or consequential damages arising out of or related to your use of the App, including but not limited to financial loss or loss of data.

10. Changes to Terms
We may modify these Terms of Service at any time by posting the revised terms within the App. You are responsible for reviewing these Terms regularly. Continued use of the App after changes to the Terms constitutes your acceptance of the updated terms.

11. Governing Law
These Terms shall be governed by the laws of India, without regard to its conflict of law principles. Any disputes arising under these Terms will be subject to the exclusive jurisdiction of the courts located in India.

12. Contact Information
If you have any questions about these Terms, please contact us at:
Email: support@sanaita.com
Phone: +91-XXX-XXX-XXXX`;

  const privacyContent = `Privacy Policy

Effective Date: December 13, 2025

Sanaita Technologies ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share your personal information when you use the Trading App trading application (the "App").

1. Information We Collect
We may collect the following types of personal information when you use the App:

• Account Information: Name, email address, phone number, and any other information you provide during registration.

• Transaction Information: Data related to your trades, including transaction history, amounts, and asset types.

• Usage Data: Information about how you interact with the App, including IP address, device type, browser type, and location data.

• Financial Information: Payment information (e.g., credit card details, bank account information) for completing transactions.

2. How We Use Your Information
We may use your information for the following purposes:

• To provide and maintain the App's services, including facilitating trades.

• To communicate with you, including sending important updates, offers, and customer support messages.

• To analyze usage trends and improve the App's functionality and user experience.

• To comply with legal and regulatory obligations.

3. Data Sharing
We may share your personal information in the following circumstances:

• Service Providers: We may share information with third-party service providers who assist us in operating the App (e.g., payment processors, hosting services).

• Legal Compliance: We may disclose your information if required by law or if we believe that such action is necessary to comply with legal obligations, protect our rights, or prevent fraud.

We do not sell your personal information to third parties.

4. Data Security
We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee complete security.

5. Your Rights
Depending on your location, you may have the right to:

• Access, correct, or delete your personal information.

• Object to or restrict the processing of your personal data.

• Withdraw consent to certain data processing activities, where applicable.

To exercise your rights, please contact us at support@sanaita.com.

6. Cookies and Tracking Technologies
The App uses cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and personalize content. You can control cookie settings through your device or browser, but disabling cookies may impact the functionality of the App.

7. Retention of Data
We will retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, including compliance with legal obligations.

8. International Data Transfers
If you are located outside India, please be aware that your personal information may be transferred to and processed in India. We will ensure that any such transfers comply with applicable data protection laws.

9. Changes to Privacy Policy
We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the revised policy in the App. Please review the Privacy Policy regularly.

10. Contact Us
If you have any questions about this Privacy Policy or our data practices, please contact us at:
Email: support@sanaita.com
Phone: +91-XXX-XXX-XXXX`;

  return (
    <SlidingPage
      visible={visible}
      onClose={handleClose}
      title="Terms & Privacy"
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'terms' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('terms')}
          >
            <Text 
              variant="body" 
              color={activeTab === 'terms' ? 'primary' : 'textSecondary'}
              style={styles.tabText}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'privacy' && [styles.activeTab, { borderBottomColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab('privacy')}
          >
            <Text 
              variant="body" 
              color={activeTab === 'privacy' ? 'primary' : 'textSecondary'}
              style={styles.tabText}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text 
            variant="body" 
            color="text" 
            style={{ ...styles.contentText, color: theme.colors.text }}
          >
            {activeTab === 'terms' ? termsContent : privacyContent}
          </Text>
        </ScrollView>
      </View>
    </SlidingPage>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  
  activeTab: {
    borderBottomWidth: 2,
  },
  
  tabText: {
    fontWeight: '600',
    fontSize: 13,
  },
  
  // Content
  contentContainer: {
    flex: 1,
  },
  
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
});

export default TermsPrivacyPage;
