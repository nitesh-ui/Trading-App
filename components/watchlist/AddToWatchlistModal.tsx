import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Text, Button } from '../atomic';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { watchlistManagerService, type Watchlist } from '../../services/watchlistManagerService';

interface AddToWatchlistModalProps {
  visible: boolean;
  onClose: () => void;
  assetSymbol: string;
  assetName: string;
}

export const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  visible,
  onClose,
  assetSymbol,
  assetName,
}) => {
  const { theme } = useTheme();
  const { showNotification } = useNotification();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

  // Load watchlists when modal is visible
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
      setSelectedWatchlistId(null);
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

  const handleAddToWatchlist = useCallback(async () => {
    if (!selectedWatchlistId) {
      showNotification({
        type: 'warning',
        title: 'Select Watchlist',
        message: 'Please select a watchlist to add the stock',
      });
      return;
    }

    try {
      setIsLoading(true);
      const selectedWatchlist = watchlists.find(w => w.id === selectedWatchlistId);
      
      if (!selectedWatchlist) {
        throw new Error('Watchlist not found');
      }

      // Check if item already exists in watchlist
      if (selectedWatchlist.items.includes(assetSymbol)) {
        showNotification({
          type: 'info',
          title: 'Already Added',
          message: `${assetName} is already in "${selectedWatchlist.name}" watchlist`,
        });
        onClose();
        return;
      }

      // Check if watchlist is full
      if (selectedWatchlist.items.length >= 20) {
        Alert.alert(
          'Watchlist Full',
          `"${selectedWatchlist.name}" watchlist has reached the maximum limit of 20 items. Please remove an item to add a new one.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Add item to watchlist
      await watchlistManagerService.addItemToWatchlist(selectedWatchlistId, assetSymbol);
      
      showNotification({
        type: 'success',
        title: 'Added',
        message: `${assetName} added to "${selectedWatchlist.name}" watchlist`,
      });

      onClose();
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Failed to add stock to watchlist',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedWatchlistId, watchlists, assetSymbol, assetName, showNotification, onClose]);

  const renderWatchlistItem = ({ item }: { item: Watchlist }) => {
    const isSelected = selectedWatchlistId === item.id;
    const isFull = item.items.length >= 20;
    
    return (
      <TouchableOpacity
        onPress={() => !isFull && setSelectedWatchlistId(item.id)}
        disabled={isFull}
        activeOpacity={0.7}
      >
        <Card
          padding="medium"
          style={[
            styles.watchlistItem,
            {
              backgroundColor: isSelected ? `${theme.colors.primary}20` : theme.colors.surface,
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              borderWidth: isSelected ? 2 : 1,
              opacity: isFull ? 0.5 : 1,
            },
          ] as any}
        >
          <View style={styles.watchlistContent}>
            <View style={styles.watchlistInfo}>
              <Text variant="body" weight="semibold" color="text">
                {item.name}
              </Text>
              <Text variant="caption" color="textSecondary">
                {item.items.length}/20 items
              </Text>
              {isFull && (
                <Text variant="caption" color="error" style={styles.fullText}>
                  Watchlist is full
                </Text>
              )}
            </View>
            
            {isSelected && (
              <View style={{ justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
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
            Add to Watchlist
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Asset Info */}
        <View style={[styles.assetInfo, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <Text variant="body" weight="medium" color="text">
            {assetName}
          </Text>
          <Text variant="caption" color="textSecondary">
            Stock Symbol: {assetSymbol}
          </Text>
        </View>

        {/* Watchlists List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : watchlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={48} color={theme.colors.textSecondary} />
            <Text variant="body" color="textSecondary" style={styles.emptyText}>
              No watchlists yet
            </Text>
            <Text variant="caption" color="textSecondary" style={styles.emptySubtext}>
              Create a watchlist first to add stocks
            </Text>
          </View>
        ) : (
          <FlatList
            data={watchlists}
            renderItem={renderWatchlistItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}

        {/* Action Buttons */}
        {watchlists.length > 0 && (
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              size="medium"
              fullWidth={false}
              style={styles.cancelButton}
            />
            <Button
              title="Add to Watchlist"
              onPress={handleAddToWatchlist}
              variant="primary"
              size="medium"
              fullWidth={false}
              loading={isLoading}
              disabled={!selectedWatchlistId || isLoading}
              style={styles.confirmButton}
            />
          </View>
        )}
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
  assetInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  watchlistItem: {
    marginBottom: 12,
  },
  watchlistContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchlistInfo: {
    flex: 1,
  },
  fullText: {
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
});
