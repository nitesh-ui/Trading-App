import { useEffect, useState } from 'react';
import { tradingApiService } from '../services/tradingApiService';

interface NotificationCountState {
  count: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useNotificationCount() {
  const [state, setState] = useState<NotificationCountState>({
    count: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchNotificationCount = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await tradingApiService.getNotificationCount();
      
      if (result.success) {
        setState({
          count: result.count,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Failed to fetch notification count',
        }));
      }
    } catch (error) {
      console.error('❌ Error in useNotificationCount:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const refreshCount = () => {
    fetchNotificationCount();
  };

  // Fetch notification count on mount
  useEffect(() => {
    fetchNotificationCount();
  }, []);

  // Auto-refresh every 30 seconds to keep count updated
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    notificationCount: state.count,
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refreshCount,
  };
}
