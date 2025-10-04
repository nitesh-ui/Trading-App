/**
 * WebSocket Service for real-time trading data
 * Handles connection to wss://uat.sanaitatechnologies.com/ws
 */

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export interface WebSocketSubscription {
  id: string;
  callback: (data: any) => void;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private heartbeatInterval: any = null;
  private url = 'wss://uat.sanaitatechnologies.com/ws';
  private isConnecting = false;
  private shouldReconnect = true;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    try {
      this.isConnecting = true;

      this.ws = new WebSocket(this.url);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.ws.onopen = (event) => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.stopHeartbeat();
          
          if (this.shouldReconnect) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;
          reject(error);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout
      });
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.subscriptions.clear();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      
      let message: WebSocketMessage;
      
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(data);
        message = {
          type: parsed.type || 'unknown',
          data: parsed.data || parsed,
          timestamp: Date.now()
        };
      } catch (parseError) {
        // If not JSON, treat as raw message
        message = {
          type: 'raw',
          data: data,
          timestamp: Date.now()
        };
      }


      // Notify subscribers based on message type
      this.notifySubscribers(message.type, message.data);
      
      // Also notify 'all' subscribers
      this.notifySubscribers('all', message);

    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  }

  /**
   * Subscribe to WebSocket messages by type
   */
  subscribe(messageType: string, callback: (data: any) => void): string {
    const subscriptionId = `${messageType}_${Date.now()}_${Math.random()}`;
    
    if (!this.subscriptions.has(messageType)) {
      this.subscriptions.set(messageType, []);
    }
    
    this.subscriptions.get(messageType)?.push({
      id: subscriptionId,
      callback
    });

    
    return subscriptionId;
  }

  /**
   * Unsubscribe from WebSocket messages
   */
  unsubscribe(subscriptionId: string): void {
    for (const [messageType, subs] of this.subscriptions) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        
        // Clean up empty subscription arrays
        if (subs.length === 0) {
          this.subscriptions.delete(messageType);
        }
        break;
      }
    }
  }

  /**
   * Notify subscribers of a message
   */
  private notifySubscribers(messageType: string, data: any): void {
    const subscribers = this.subscriptions.get(messageType);
    if (subscribers && subscribers.length > 0) {
      subscribers.forEach(sub => {
        try {
          sub.callback(data);
        } catch (error) {
          console.error(`❌ Error in subscriber callback for '${messageType}':`, error);
        }
      });
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(message: any): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      console.log('📤 Sending WebSocket message:', messageString);
      this.ws.send(messageString);
      return true;
    } catch (error) {
      console.error('❌ Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscription count for debugging
   */
  getSubscriptionCount(): number {
    let total = 0;
    for (const subs of this.subscriptions.values()) {
      total += subs.length;
    }
    return total;
  }

  /**
   * Get all subscription types for debugging
   */
  getSubscriptionTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

export const websocketService = WebSocketService.getInstance();
