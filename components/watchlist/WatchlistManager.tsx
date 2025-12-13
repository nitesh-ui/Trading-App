import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, Button } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useWatchlist } from './index';
import { watchlistManagerService, type Watchlist } from '../../services/watchlistManagerService';

interface WatchlistManagerProps {
  visible: boolean;
  onClose: () => void;
  onSelectWatchlist: (watchlist: Watchlist) => void;
  currentWatchlist?: Watchlist | null;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  visible,
  onClose,
  onSelectWatchlist,
  currentWatchlist,
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const { updateWatchlistItems } = useWatchlist();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load watchlists
  useEffect(() => {
    if (visible) {
      loadWatchlists();
    }
  }, [visible]);

  const loadWatchlists = useCallback(async () => {
    try {
      setIsLoading(true);
      const lists = await watchlistManagerService.getAllWatchlists();
      setWatchlists(lists);
    } catch (error) {
      console.error('Error loading watchlists:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load watchlists',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  const handleCreateWatchlist = useCallback(async () => {
    if (!newWatchlistName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Invalid Name',
        message: 'Please enter a watchlist name',
      });
      return;
    }

    try {
      setIsLoading(true);
      const newWatchlist = await watchlistManagerService.createWatchlist(newWatchlistName);
      await loadWatchlists();
      setNewWatchlistName('');
      setShowCreateModal(false);
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: `Watchlist "${newWatchlist.name}" created`,
      });
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to create watchlist',
      });
    } finally {
      setIsLoading(false);
    }
  }, [newWatchlistName, loadWatchlists, showNotification]);

  const handleDeleteWatchlist = useCallback((watchlist: Watchlist) => {
    Alert.alert(
      'Delete Watchlist',
      `Are you sure you want to delete "${watchlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await watchlistManagerService.deleteWatchlist(watchlist.id);
              await loadWatchlists();
              showNotification({
                type: 'success',
                title: 'Deleted',
                message: 'Watchlist deleted successfully',
              });
            } catch (error) {
              showNotification({
                type: 'error',
                title: 'Error',
                message: 'Failed to delete watchlist',
              });
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [loadWatchlists, showNotification]);

  const handleSelectWatchlist = useCallback((watchlist: Watchlist) => {
    watchlistManagerService.setActiveWatchlist(watchlist.id);
    // Update the watchlist context with the selected watchlist items
    updateWatchlistItems(watchlist.items);
    onSelectWatchlist(watchlist);
    showNotification({
      type: 'success',
      title: 'Switched',
      message: `Now viewing "${watchlist.name}" watchlist`,
    });
    onClose();
  }, [onSelectWatchlist, onClose, updateWatchlistItems, showNotification]);

  const renderWatchlistItem = ({ item }: { item: Watchlist }) => {
    const isActive = currentWatchlist?.id === item.id;
    
    return (
      <Card
        padding="medium"
        style={[
          styles.watchlistCard,
          {
            backgroundColor: isActive ? `${theme.colors.primary}20` : theme.colors.surface,
            borderColor: isActive ? theme.colors.primary : theme.colors.border,
            borderWidth: isActive ? 2 : 1,
          },
        ] as any}
      >
        <TouchableOpacity
          style={styles.watchlistContent}
          onPress={() => handleSelectWatchlist(item)}
          disabled={isActive}
        >
          <View style={styles.watchlistInfo}>
            <Text variant="body" weight="semibold" color="text">
              {item.name}
            </Text>
            <Text variant="caption" color="textSecondary">
              {item.items.length}/20 items
            </Text>
          </View>
          
          {isActive && (
            <View style={{ justifyContent: 'center' }}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            </View>
          )}
        </TouchableOpacity>

        {!isActive && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWatchlist(item)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text variant="headline" weight="bold" color="text">
            My Watchlists
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Watchlists List */}
        <FlatList
          data={watchlists}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color={theme.colors.textSecondary} />
              <Text variant="body" color="textSecondary" style={styles.emptyText}>
                No watchlists yet
              </Text>
              <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
                Create your first watchlist to get started
              </Text>
            </View>
          }
        />

        {/* Create Button */}
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <Button
            title="+ Create Watchlist"
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            size="large"
          />
        </View>

        {/* Create Watchlist Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Card padding="large" style={[styles.createModal, { backgroundColor: theme.colors.surface }] as any}>
              <Text variant="headline" weight="bold" color="text" style={styles.modalTitle}>
                Create New Watchlist
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="Enter watchlist name"
                placeholderTextColor={theme.colors.textSecondary}
                value={newWatchlistName}
                onChangeText={setNewWatchlistName}
                editable={!isLoading}
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                  onPress={() => setShowCreateModal(false)}
                  disabled={isLoading}
                >
                  <Text variant="body" weight="semibold" color="text">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleCreateWatchlist}
                  disabled={isLoading}
                >
                  <Text variant="body" weight="semibold" color="text">
                    {isLoading ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  watchlistCard: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchlistContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchlistInfo: {
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createModal: {
    width: '80%',
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});
