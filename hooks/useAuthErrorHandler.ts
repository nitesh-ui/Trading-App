/**
 * Custom hook for handling 401 unauthorized responses with notifications
 * This provides a way for any component to handle auth errors gracefully
 */

import { useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import AuthUtils from '../services/authUtils';

export const useAuthErrorHandler = () => {
  const { showNotification } = useNotification();

  const handle401 = useCallback(async () => {
    await AuthUtils.handle401Unauthorized({ showNotification });
  }, [showNotification]);

  return {
    handle401,
  };
};
