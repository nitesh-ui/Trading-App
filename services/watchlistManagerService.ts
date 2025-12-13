import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Watchlist {
  id: string;
  name: string;
  items: string[]; // Symbol names
  createdAt: string;
  updatedAt: string;
}

class WatchlistManagerService {
  private static readonly WATCHLIST_KEY = 'user_watchlists';
  private static readonly ACTIVE_WATCHLIST_KEY = 'active_watchlist_id';
  private static readonly MAX_ITEMS_PER_WATCHLIST = 20;

  /**
   * Create a new watchlist
   */
  async createWatchlist(name: string): Promise<Watchlist> {
    try {
      const watchlists = await this.getAllWatchlists();
      
      // Check if watchlist name already exists
      if (watchlists.some(w => w.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Watchlist with this name already exists');
      }

      const newWatchlist: Watchlist = {
        id: `watchlist_${Date.now()}`,
        name: name.trim(),
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      watchlists.push(newWatchlist);
      await AsyncStorage.setItem(WatchlistManagerService.WATCHLIST_KEY, JSON.stringify(watchlists));

      // Set as active if it's the first watchlist
      if (watchlists.length === 1) {
        await this.setActiveWatchlist(newWatchlist.id);
      }

      console.log('✅ Watchlist created:', newWatchlist.name);
      return newWatchlist;
    } catch (error) {
      console.error('❌ Error creating watchlist:', error);
      throw error;
    }
  }

  /**
   * Get all watchlists
   */
  async getAllWatchlists(): Promise<Watchlist[]> {
    try {
      const data = await AsyncStorage.getItem(WatchlistManagerService.WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Error fetching watchlists:', error);
      return [];
    }
  }

  /**
   * Delete a watchlist
   */
  async deleteWatchlist(id: string): Promise<void> {
    try {
      let watchlists = await this.getAllWatchlists();
      const index = watchlists.findIndex(w => w.id === id);
      
      if (index === -1) {
        throw new Error('Watchlist not found');
      }

      watchlists.splice(index, 1);
      await AsyncStorage.setItem(WatchlistManagerService.WATCHLIST_KEY, JSON.stringify(watchlists));

      // If deleted watchlist was active, set another as active
      const activeId = await AsyncStorage.getItem(WatchlistManagerService.ACTIVE_WATCHLIST_KEY);
      if (activeId === id) {
        if (watchlists.length > 0) {
          await this.setActiveWatchlist(watchlists[0].id);
        } else {
          await AsyncStorage.removeItem(WatchlistManagerService.ACTIVE_WATCHLIST_KEY);
        }
      }

      console.log('✅ Watchlist deleted:', id);
    } catch (error) {
      console.error('❌ Error deleting watchlist:', error);
      throw error;
    }
  }

  /**
   * Add item to watchlist
   */
  async addItemToWatchlist(watchlistId: string, symbol: string): Promise<void> {
    try {
      const watchlists = await this.getAllWatchlists();
      const watchlist = watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) {
        throw new Error('Watchlist not found');
      }

      if (watchlist.items.length >= WatchlistManagerService.MAX_ITEMS_PER_WATCHLIST) {
        throw new Error(`Watchlist can contain maximum ${WatchlistManagerService.MAX_ITEMS_PER_WATCHLIST} items`);
      }

      if (watchlist.items.includes(symbol)) {
        console.warn('⚠️ Item already in watchlist:', symbol);
        return;
      }

      watchlist.items.push(symbol);
      watchlist.updatedAt = new Date().toISOString();

      const index = watchlists.findIndex(w => w.id === watchlistId);
      watchlists[index] = watchlist;
      await AsyncStorage.setItem(WatchlistManagerService.WATCHLIST_KEY, JSON.stringify(watchlists));

      console.log('✅ Item added to watchlist:', symbol);
    } catch (error) {
      console.error('❌ Error adding item to watchlist:', error);
      throw error;
    }
  }

  /**
   * Remove item from watchlist
   */
  async removeItemFromWatchlist(watchlistId: string, symbol: string): Promise<void> {
    try {
      const watchlists = await this.getAllWatchlists();
      const watchlist = watchlists.find(w => w.id === watchlistId);
      
      if (!watchlist) {
        throw new Error('Watchlist not found');
      }

      const index = watchlist.items.indexOf(symbol);
      if (index === -1) {
        throw new Error('Item not found in watchlist');
      }

      watchlist.items.splice(index, 1);
      watchlist.updatedAt = new Date().toISOString();

      const watchlistIndex = watchlists.findIndex(w => w.id === watchlistId);
      watchlists[watchlistIndex] = watchlist;
      await AsyncStorage.setItem(WatchlistManagerService.WATCHLIST_KEY, JSON.stringify(watchlists));

      console.log('✅ Item removed from watchlist:', symbol);
    } catch (error) {
      console.error('❌ Error removing item from watchlist:', error);
      throw error;
    }
  }

  /**
   * Set active watchlist
   */
  async setActiveWatchlist(id: string): Promise<void> {
    try {
      await AsyncStorage.setItem(WatchlistManagerService.ACTIVE_WATCHLIST_KEY, id);
      console.log('✅ Active watchlist set:', id);
    } catch (error) {
      console.error('❌ Error setting active watchlist:', error);
      throw error;
    }
  }

  /**
   * Get active watchlist ID
   */
  async getActiveWatchlistId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(WatchlistManagerService.ACTIVE_WATCHLIST_KEY);
    } catch (error) {
      console.error('❌ Error fetching active watchlist ID:', error);
      return null;
    }
  }

  /**
   * Get active watchlist with full data
   */
  async getActiveWatchlist(): Promise<Watchlist | null> {
    try {
      const activeId = await this.getActiveWatchlistId();
      if (!activeId) {
        const watchlists = await this.getAllWatchlists();
        if (watchlists.length > 0) {
          return watchlists[0];
        }
        return null;
      }
      return await this.getWatchlistById(activeId);
    } catch (error) {
      console.error('❌ Error fetching active watchlist:', error);
      return null;
    }
  }

  /**
   * Get watchlist by ID
   */
  async getWatchlistById(id: string): Promise<Watchlist | null> {
    try {
      const watchlists = await this.getAllWatchlists();
      return watchlists.find(w => w.id === id) || null;
    } catch (error) {
      console.error('❌ Error fetching watchlist:', error);
      return null;
    }
  }

  /**
   * Check if watchlist is at capacity
   */
  isWatchlistFull(watchlist: Watchlist): boolean {
    return watchlist.items.length >= WatchlistManagerService.MAX_ITEMS_PER_WATCHLIST;
  }

  /**
   * Get remaining slots in watchlist
   */
  getRemainingSlots(watchlist: Watchlist): number {
    return WatchlistManagerService.MAX_ITEMS_PER_WATCHLIST - watchlist.items.length;
  }

  /**
   * Get max items per watchlist
   */
  getMaxItemsPerWatchlist(): number {
    return WatchlistManagerService.MAX_ITEMS_PER_WATCHLIST;
  }
}

// Singleton instance
export const watchlistManagerService = new WatchlistManagerService();
