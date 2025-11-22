/**
 * React Hook for SignalR real-time connection
 * Manages SignalR connection lifecycle and provides message subscription
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { signalRService } from '../services/signalRService';

export interface UseSignalROptions {
  autoConnect?: boolean;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: any) => void;
}

export interface UseSignalRReturn {
  isConnected: boolean;
  connectionStatus: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  subscribe: (messageType: string, callback: (data: any) => void) => string;
  unsubscribe: (subscriptionId: string) => void;
  invoke: (methodName: string, ...args: any[]) => Promise<any>;
  send: (methodName: string, ...args: any[]) => Promise<void>;
  subscribeToInstruments: (instrumentTokens: string[] | number[]) => Promise<void>;
  unsubscribeFromInstruments: (instrumentTokens: string[] | number[]) => Promise<void>;
  lastMessage: { type: string; data: any } | null;
}

export function useSignalR(options: UseSignalROptions = {}): UseSignalRReturn {
  const { autoConnect = false, onConnected, onDisconnected, onError } = options;
  
  // Log hook initialization
  console.log('🎯🎯🎯 useSignalR HOOK INITIALIZED 🎯🎯🎯');
  console.log('Options:', { autoConnect, hasOnConnected: !!onConnected, hasOnDisconnected: !!onDisconnected, hasOnError: !!onError });
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState<{ type: string; data: any } | null>(null);
  
  const subscriptionIdRef = useRef<string | null>(null);
  const statusCheckIntervalRef = useRef<any>(null);

  // Check connection status periodically
  useEffect(() => {
    const checkStatus = () => {
      const status = signalRService.getConnectionStatus();
      const connected = signalRService.isConnected();
      
      setConnectionStatus(status);
      setIsConnected(connected);
    };

    // Initial check
    checkStatus();

    // Check every 2 seconds
    statusCheckIntervalRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, []);

  // Connect to SignalR
  const connect = useCallback(async () => {
    try {
      console.log('🔌 useSignalR: Attempting to connect...');
      const success = await signalRService.connect();
      
      if (success) {
        setIsConnected(true);
        setConnectionStatus('connected');
        onConnected?.();
        console.log('✅ useSignalR: Connected successfully');
      }
      
      return success;
    } catch (error) {
      console.error('❌ useSignalR: Connection failed:', error);
      onError?.(error);
      return false;
    }
  }, [onConnected, onError]);

  // Disconnect from SignalR
  const disconnect = useCallback(async () => {
    try {
      console.log('🔌 useSignalR: Disconnecting...');
      await signalRService.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
      onDisconnected?.();
      console.log('✅ useSignalR: Disconnected successfully');
    } catch (error) {
      console.error('❌ useSignalR: Disconnect failed:', error);
      onError?.(error);
    }
  }, [onDisconnected, onError]);

  // Subscribe to messages
  const subscribe = useCallback((messageType: string, callback: (data: any) => void) => {
    console.log(`✅ useSignalR: Subscribing to '${messageType}'`);
    return signalRService.subscribe(messageType, callback);
  }, []);

  // Unsubscribe from messages
  const unsubscribe = useCallback((subscriptionId: string) => {
    console.log(`🗑️ useSignalR: Unsubscribing from '${subscriptionId}'`);
    signalRService.unsubscribe(subscriptionId);
  }, []);

  // Invoke hub method
  const invoke = useCallback(async (methodName: string, ...args: any[]) => {
    return await signalRService.invoke(methodName, ...args);
  }, []);

  // Send hub method (fire and forget)
  const send = useCallback(async (methodName: string, ...args: any[]) => {
    await signalRService.send(methodName, ...args);
  }, []);

  // Subscribe to specific instruments
  const subscribeToInstruments = useCallback(async (instrumentTokens: string[] | number[]) => {
    await signalRService.subscribeToInstruments(instrumentTokens);
  }, []);

  // Unsubscribe from specific instruments
  const unsubscribeFromInstruments = useCallback(async (instrumentTokens: string[] | number[]) => {
    await signalRService.unsubscribeFromInstruments(instrumentTokens);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    console.log('🎯 useSignalR: autoConnect effect triggered');
    console.log('  - autoConnect:', autoConnect);
    console.log('  - connect function exists:', !!connect);
    
    if (autoConnect) {
      console.log('🚀 useSignalR: Auto-connecting NOW...');
      connect()
        .then((success) => {
          console.log('🚀 useSignalR: Auto-connect completed, success:', success);
        })
        .catch((error) => {
          console.error('❌ useSignalR: Auto-connect failed:', error);
        });
    } else {
      console.log('⏸️ useSignalR: Auto-connect disabled');
    }
  }, [autoConnect, connect]);

  // Subscribe to all messages to update lastMessage
  useEffect(() => {
    subscriptionIdRef.current = signalRService.subscribe('all', (message: any) => {
      setLastMessage(message);
    });

    return () => {
      if (subscriptionIdRef.current) {
        signalRService.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount to allow other components to use the connection
      // The connection will be managed globally by the service
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    invoke,
    send,
    subscribeToInstruments,
    unsubscribeFromInstruments,
    lastMessage,
  };
}
