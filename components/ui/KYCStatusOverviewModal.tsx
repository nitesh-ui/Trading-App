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
        style={{ color: getStatusColor(status), fontSize: 13 }}
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
          <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        </View>
        <Text variant="body" weight="medium" color="text" style={{ fontSize: 16 }}>
          {label}
        </Text>
      </View>
      <StatusBadge status={status} />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Drag Indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerTitle}>
              <Ionicons name="document-outline" size={28} color={theme.colors.primary} />
              <Text variant="headline" weight="bold" color="text" style={styles.headerText} numberOfLines={1}>
                KYC Status Overview
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={() => setRefreshTrigger(prev => prev + 1)}
                style={styles.iconButton}
              >
                <Ionicons name="refresh" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.iconButton}
              >
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
                        style={{ color: '#10B981', fontSize: 28 }}
                      >
                        {approvedCount}
                      </Text>
                      <Text variant="caption" color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
                        Approved
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#EF4444', fontSize: 28 }}
                      >
                        {rejectedCount}
                      </Text>
                      <Text variant="caption" color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
                        Rejected
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#F59E0B', fontSize: 28 }}
                      >
                        {underReviewCount}
                      </Text>
                      <Text variant="caption" color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
                        Under Review
                      </Text>
                    </View>

                    <View style={styles.progressItem}>
                      <Text 
                        variant="headline" 
                        weight="bold" 
                        color="text"
                        style={{ color: '#6B7280', fontSize: 28 }}
                      >
                        {pendingCount}
                      </Text>
                      <Text variant="caption" color="textSecondary" style={{ fontSize: 13, marginTop: 4 }}>
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

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: screenHeight * 0.90,
    maxHeight: screenHeight * 0.90,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  headerText: {
    fontSize: 20,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexShrink: 0,
  },
  iconButton: {
    padding: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    marginBottom: 18,
    fontSize: 18,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  progressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressItem: {
    width: '48%',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 30 : 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
});

