import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Button, Text } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';

type KYCDocumentStatus = 'Not Sent' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

interface KYCStatusOverviewModalProps {
  visible: boolean;
  onClose: () => void;
  documentStatuses?: {
    aadharCard: KYCDocumentStatus;
    panCard: KYCDocumentStatus;
    profilePicture: KYCDocumentStatus;
    digitalSignature: KYCDocumentStatus;
    bankDetails: KYCDocumentStatus;
  };
}

export default function KYCStatusOverviewModal({ 
  visible, 
  onClose,
  documentStatuses = {
    aadharCard: 'Not Sent',
    panCard: 'Not Sent',
    profilePicture: 'Not Sent',
    digitalSignature: 'Not Sent',
    bankDetails: 'Not Sent',
  }
}: KYCStatusOverviewModalProps) {
  const { theme } = useTheme();

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
      case 'Not Sent':
      default:
        return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const calculateProgress = () => {
    const statuses = Object.values(documentStatuses);
    const approved = statuses.filter(s => s === 'Approved').length;
    const rejected = statuses.filter(s => s === 'Rejected').length;
    const underReview = statuses.filter(s => s === 'Under Review').length;
    const pending = statuses.filter(s => s === 'Pending').length;

    return { approved, rejected, underReview, pending };
  };

  const progress = calculateProgress();

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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
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
                    {progress.approved}
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
                    {progress.rejected}
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
                    {progress.underReview}
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
                    {progress.pending}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    Pending
                  </Text>
                </View>
              </View>
            </View>
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
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
  },
  headerText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 10,
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
});
