import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Button, Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { tradingApiService, KYCStep } from '../../services/tradingApiService';

type KYCDocumentStatus = 'Sent' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Not Sent';

interface KYCStatusOverviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function KYCStatusOverviewModal({ 
  visible, 
  onClose,
}: KYCStatusOverviewModalProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [underReviewCount, setUnderReviewCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<KYCStep[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState({
    aadharCard: 'Not Sent' as KYCDocumentStatus,
    panCard: 'Not Sent' as KYCDocumentStatus,
    profilePicture: 'Not Sent' as KYCDocumentStatus,
    digitalSignature: 'Not Sent' as KYCDocumentStatus,
    bankDetails: 'Not Sent' as KYCDocumentStatus,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch KYC Wizard data from API
  useEffect(() => {
    if (visible) {
      // Add a small delay to ensure previous operations are complete
      const timer = setTimeout(() => {
        fetchKYCData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, refreshTrigger]);

  const determineDocumentStatus = (step: KYCStep): KYCDocumentStatus => {
    // Check if document is approved
    if (step.data && step.data.isApproved === true) {
      return 'Approved';
    }
    
    // Check if document is rejected
    if (step.data && step.data.isRejected === true) {
      return 'Rejected';
    }
    
    // If data is not null, the document has been submitted - mark as "Sent"
    if (step.data !== null) {
      return 'Sent';
    }
    // If data is null, document hasn't been sent yet
    return 'Not Sent';
  };

  const fetchKYCData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Fetching KYC data...');
      const response = await tradingApiService.getKYCWizard();
      
      console.log('📊 KYC API Response received:', {
        hasSummary: !!response.summary,
        summary: response.summary,
        hasSteps: !!response.steps,
        stepsCount: response.steps?.length || 0,
      });
      
      if (response.summary) {
        setApprovedCount(response.summary.approved);
        setRejectedCount(response.summary.rejected);
        setUnderReviewCount(response.summary.underReview);
        setPendingCount(response.summary.pending);
      }

      // Process steps and determine document statuses
      if (response.steps && response.steps.length > 0) {
        setSteps(response.steps);

        // Build document statuses based on step data
        const newStatuses = {
          aadharCard: 'Not Sent' as KYCDocumentStatus,
          panCard: 'Not Sent' as KYCDocumentStatus,
          profilePicture: 'Not Sent' as KYCDocumentStatus,
          digitalSignature: 'Not Sent' as KYCDocumentStatus,
          bankDetails: 'Not Sent' as KYCDocumentStatus,
        };

        response.steps.forEach((step) => {
          const status = determineDocumentStatus(step);
          console.log(`🔍 Processing KYC Type ${step.kycType} - Status: ${status}, Data:`, step.data);
          
          switch (step.kycType) {
            case 1: // Aadhaar Card
              newStatuses.aadharCard = status;
              break;
            case 2: // PAN Card
              newStatuses.panCard = status;
              break;
            case 4: // Profile Picture
              newStatuses.profilePicture = status;
              break;
            case 5: // Digital Signature
              newStatuses.digitalSignature = status;
              break;
            case 6: // Bank Details
              newStatuses.bankDetails = status;
              break;
          }
        });

        setDocumentStatuses(newStatuses);
        console.log('📋 All Document Statuses Updated:', newStatuses);
      }
    } catch (err) {
      console.error('❌ Error fetching KYC data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load KYC status. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: KYCDocumentStatus) => {
    switch (status) {
      case 'Approved':
        return '#10B981'; // Green
      case 'Rejected':
        return '#EF4444'; // Red
      case 'Under Review':
        return '#F59E0B'; // Amber
      case 'Pending':
        return '#6B7280'; // Gray
      case 'Sent':
        return '#3B82F6'; // Blue
      case 'Not Sent':
      default:
        return '#9CA3AF'; // Light Gray
    }
  };

  const getStatusBgColor = (status: KYCDocumentStatus) => {
    switch (status) {
      case 'Approved':
        return 'rgba(16, 185, 129, 0.1)';
      case 'Rejected':
        return 'rgba(239, 68, 68, 0.1)';
      case 'Under Review':
        return 'rgba(245, 158, 11, 0.1)';
      case 'Pending':
        return 'rgba(107, 114, 128, 0.1)';
      case 'Sent':
        return 'rgba(59, 130, 246, 0.1)'; // Blue background
      case 'Not Sent':
      default:
        return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const StatusBadge = ({ status }: { status: KYCDocumentStatus }) => (
    <View
      style={[
        styles.statusBadge,
        { 
          backgroundColor: getStatusBgColor(status),
          borderColor: getStatusColor(status),
        }
      ]}
    >
      <Text 
        variant="caption" 
        weight="medium"
        style={{ color: getStatusColor(status) }}
      >
        {status}
      </Text>
    </View>
  );

  const DocumentStatusItem = ({ 
    icon, 
    label, 
    status 
  }: { 
    icon: string; 
    label: string; 
    status: KYCDocumentStatus 
  }) => (
    <View style={styles.documentItem}>
      <View style={styles.documentLeft}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary} />
        </View>
        <Text variant="body" weight="medium" color="text">
          {label}
        </Text>
      </View>
      <StatusBadge status={status} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerTitle}>
              <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
              <Text variant="headline" weight="bold" color="text" style={styles.headerText}>
                KYC Status Overview
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity onPress={() => setRefreshTrigger(prev => prev + 1)}>
                <Ionicons name="refresh" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Loading State */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="body" color="textSecondary" style={styles.loadingText}>
                  Loading KYC Status...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
                <Text variant="body" color="error" style={styles.errorText}>
                  {error}
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={fetchKYCData}
                >
                  <Text variant="body" weight="semibold" style={{ color: 'white' }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Document Status Section */}
                <View style={styles.section}>
                  <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                    Document Status
                  </Text>

                  <DocumentStatusItem 
                    icon="id-card-outline" 
                    label="Aadhar Card" 
                    status={documentStatuses.aadharCard}
                  />
                  <DocumentStatusItem 
                    icon="card-outline" 
                    label="PAN Card" 
                    status={documentStatuses.panCard}
                  />
                  <DocumentStatusItem 
                    icon="person-circle-outline" 
                    label="Profile Picture" 
                    status={documentStatuses.profilePicture}
                  />
                  <DocumentStatusItem 
                    icon="checkmark-done-outline" 
                    label="Digital Signature" 
                    status={documentStatuses.digitalSignature}
                  />
                  <DocumentStatusItem 
                    icon="home" 
                    label="Bank Details" 
                    status={documentStatuses.bankDetails}
                  />
                </View>

                {/* Progress Section */}
                <View style={styles.section}>
                  <Text variant="subtitle" weight="semibold" color="text" style={styles.sectionTitle}>
                    Progress
                  </Text>

                  <View style={styles.progressGrid}>
                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#10B981' }}
                      >
                        {approvedCount}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        Approved
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#EF4444' }}
                      >
                        {rejectedCount}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        Rejected
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#F59E0B' }}
                      >
                        {underReviewCount}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        Under Review
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#6B7280' }}
                      >
                        {pendingCount}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        Pending
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Close Button */}
          <View style={styles.footer}>
            <Button
              title="Close"
              onPress={onClose}
              variant="outline"
              size="large"
              fullWidth={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    maxHeight: Dimensions.get('window').height * 0.85,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    minHeight: 200,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontSize: 16,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressItem: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
});

