/**
 * React hook for WebSocket integration
 * Handles connection lifecycle and message subscriptions
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { websocketService, WebSocketMessage } from '../services/websocketService';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnMount?: boolean;
  subscribeToAll?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: string;
  lastMessage: WebSocketMessage | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  subscribe: (messageType: string, callback: (data: any) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  send: (message: any) => boolean;
  subscriptionCount: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    autoConnect = true,
    reconnectOnMount = true,
    subscribeToAll = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  
  const subscriptionsRef = useRef<string[]>([]);
  const statusCheckInterval = useRef<any>(null);

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    const status = websocketService.getConnectionStatus();
    const connected = websocketService.isConnected();
    const subCount = websocketService.getSubscriptionCount();
    
    setConnectionStatus(status);
    setIsConnected(connected);
    setSubscriptionCount(subCount);
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const success = await websocketService.connect();
      updateConnectionStatus();
      return success;
    } catch (error) {
      updateConnectionStatus();
      return false;
    }
  }, [updateConnectionStatus]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Subscribe to message type
  const subscribe = useCallback((messageType: string, callback: (data: any) => void): string => {
    const subscriptionId = websocketService.subscribe(messageType, callback);
    subscriptionsRef.current.push(subscriptionId);
    updateConnectionStatus();
    return subscriptionId;
  }, [updateConnectionStatus]);

  // Unsubscribe from message type
  const unsubscribe = useCallback((subscriptionId: string) => {
    websocketService.unsubscribe(subscriptionId);
    subscriptionsRef.current = subscriptionsRef.current.filter(id => id !== subscriptionId);
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Send message
  const send = useCallback((message: any): boolean => {
    return websocketService.send(message);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Start status check interval
    statusCheckInterval.current = setInterval(updateConnectionStatus, 1000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, [autoConnect, connect, updateConnectionStatus]);

  // Subscribe to all messages if requested
  useEffect(() => {
    if (subscribeToAll && isConnected) {
      const allSubscriptionId = subscribe('all', (message: WebSocketMessage) => {
        setLastMessage(message);
      });

      return () => {
        unsubscribe(allSubscriptionId);
      };
    }
  }, [subscribeToAll, isConnected, subscribe, unsubscribe]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach(subscriptionId => {
        websocketService.unsubscribe(subscriptionId);
      });
      subscriptionsRef.current = [];
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    subscriptionCount
  };
};
