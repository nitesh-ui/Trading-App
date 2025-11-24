/**
 * SignalR Service for real-time trading data
 * Uses Microsoft SignalR for WebSocket communication with the trading backend
 * 
 * Connection URL: wss://demo.sanaitatechnologies.com/ws
 * 
 * FEATURES:
 * - Automatic reconnection on disconnect
 * - Session token authentication
 * - Real-time price updates
 * - Pub/sub message handling
 */

import * as SignalR from '@microsoft/signalr';
import { tradingApiService } from './tradingApiService';

export interface SignalRMessage {
  type: string;
  data: any;
  timestamp?: number;
}

export interface SignalRSubscription {
  id: string;
  callback: (data: any) => void;
}

class SignalRService {
  private static instance: SignalRService;
  private connection: SignalR.HubConnection | null = null;
  private subscriptions: Map<string, SignalRSubscription[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private shouldReconnect = true;
  private sessionToken: string | null = null;
  
  // SignalR hub URL - adjust based on your server configuration
  private hubUrl = 'https://prod-tradingapi.sanaitatechnologies.com/hub/market';

  static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  /**
   * Connect to SignalR hub
   */
  async connect(): Promise<boolean> {
    console.log('');
    console.log('🌟'.repeat(35));
    console.log('🌟 SIGNALR CONNECT() FUNCTION CALLED 🌟');
    console.log('🌟'.repeat(35));
    console.log('');
    
    if (this.connection?.state === SignalR.HubConnectionState.Connected) {
      console.log('✅ SignalR already connected');
      return true;
    }

    if (this.isConnecting) {
      console.log('⏳ SignalR connection already in progress');
      return false;
    }

    try {
      // Get session token from trading API service
      const sessionData = await tradingApiService.getSessionData();
      if (!sessionData?.sessionToken) {
        console.error('❌ No session token available for SignalR connection');
        return false;
      }

      this.sessionToken = sessionData.sessionToken;
      console.log('🔑 SignalR connecting with session token:', this.sessionToken ? '***TOKEN***' : 'None');

      this.isConnecting = true;

      // Build SignalR connection with authentication
      // CRITICAL: Use accessTokenFactory for React Native compatibility
      this.connection = new SignalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          // accessTokenFactory is more reliable in React Native than headers
          accessTokenFactory: () => this.sessionToken || '',
          skipNegotiation: false, // Allow SignalR to negotiate the best transport
          transport: SignalR.HttpTransportType.WebSockets, // Prefer WebSockets
        })
        .withAutomaticReconnect()
        .configureLogging(SignalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      console.log('🔌 Starting SignalR connection to:', this.hubUrl);
      console.log('📡 This is SignalR (NOT plain WebSocket!)');
      console.log('🌐 Full URL:', this.hubUrl);
      console.log('🔧 Library: @microsoft/signalr');
      console.log('🔑 Auth method: accessTokenFactory (session token)');
      console.log('🔑 Has session token:', !!this.sessionToken);
      
      await this.connection.start();
      
      console.log('');
      console.log('✅✅✅ SignalR connected successfully ✅✅✅');
      console.log('🔗 Connection ID:', this.connection.connectionId);
      console.log('🎯 Transport:', 'WebSockets (via SignalR)');
      console.log('');
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      // Subscribe to market data hub methods
      console.log('');
      console.log('🔥'.repeat(35));
      console.log('🔥 CALLING setupHubMethods() NOW 🔥');
      console.log('🔥'.repeat(35));
      console.log('');
      
      this.setupHubMethods();
      
      console.log('');
      console.log('✅ setupHubMethods() call completed');
      console.log('');

      return true;

    } catch (error) {
      console.error('❌ SignalR connection error:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Set up SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection closed
    this.connection.onclose((error) => {
      console.log('🔌 SignalR connection closed:', error?.message || 'No error');
      this.isConnecting = false;
      
      if (this.shouldReconnect && error) {
        this.handleManualReconnect();
      }
    });

    // Reconnecting
    this.connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting...', error?.message || '');
      this.reconnectAttempts++;
    });

    // Reconnected
    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected with connectionId:', connectionId);
      this.reconnectAttempts = 0;
      // Resubscribe to hub methods after reconnection
      this.setupHubMethods();
    });
  }

  /**
   * Set up SignalR hub methods to receive messages from server
   * CRITICAL: The server sends data as JSON string that needs to be parsed!
   */
  private setupHubMethods(): void {
    if (!this.connection) return;

    console.log('📡 Setting up SignalR hub methods...');

    // THIS IS THE CORRECT METHOD NAME FROM THE SERVER: ReceiveMarketUpdate
    this.connection.on('ReceiveMarketUpdate', (message: any) => {
      console.log('📨📨📨 SignalR ReceiveMarketUpdate received!');
      console.log('📨 Full message object:', JSON.stringify(message, null, 2));
      console.log('📨 Message type:', typeof message);
      console.log('📨 Message keys:', Object.keys(message || {}));
      console.log('📨 Has data property:', !!message?.data);
      console.log('📨 Has timestamp property:', !!message?.timestamp);
      
      try {
        // IMPORTANT: The server sends data as message.data which is a JSON string
        const jsonString = message?.data;
        
        if (!jsonString) {
          console.error('❌ No data property in message!');
          console.log('Full message:', message);
          return;
        }
        
        console.log('📨 JSON string type:', typeof jsonString);
        console.log('📨 JSON string (first 500 chars):', jsonString?.substring(0, 500));
        
        const parsedData = JSON.parse(jsonString);
        console.log('✅ Successfully parsed market data:', {
          hasTable: !!parsedData?.Table,
          hasTable1: !!parsedData?.Table1,
          tableLength: parsedData?.Table?.length || 0,
          table1Length: parsedData?.Table1?.length || 0,
          sampleItem: parsedData?.Table?.[0] || parsedData?.Table1?.[0]
        });
        
        // Notify all subscribers with the parsed data
        this.notifySubscribers('market_data', parsedData);
        this.notifySubscribers('all', { type: 'market_data', data: parsedData, timestamp: Date.now() });
        
      } catch (error) {
        console.error('❌ Failed to parse market update data:', error);
        console.log('❌ Raw message was:', JSON.stringify(message, null, 2));
      }
    });

    // Keep legacy listeners for backward compatibility
    this.connection.on('ReceiveMarketData', (data: any) => {
      console.log('📨 SignalR ReceiveMarketData (legacy):', {
        hasTable: !!data?.Table,
        hasTable1: !!data?.Table1,
        tableLength: data?.Table?.length || 0,
        table1Length: data?.Table1?.length || 0,
      });
      
      this.notifySubscribers('market_data', data);
      this.notifySubscribers('all', { type: 'market_data', data, timestamp: Date.now() });
    });

    console.log('✅ SignalR hub methods configured (primary: ReceiveMarketUpdate)');
    
    // After connecting, subscribe the user to market data
    console.log('');
    console.log('🔥🔥🔥 ABOUT TO CALL subscribeToMarketData() 🔥🔥🔥');
    console.log('Connection state before call:', this.connection?.state);
    console.log('');
    
    // Wait a moment for the connection to be fully established
    setTimeout(() => {
      console.log('⏰ Delayed call to subscribeToMarketData() (after 1 second)...');
      console.log('Connection state now:', this.connection?.state);
      
      this.subscribeToMarketData()
        .then(() => {
          console.log('✅ subscribeToMarketData() completed successfully');
        })
        .catch(err => {
          console.error('❌ subscribeToMarketData() threw error:', err);
          console.error('Error stack:', err.stack);
        });
    }, 1000); // Wait 1 second for connection to fully stabilize
  }

  /**
   * Subscribe to market data after connection
   * This tells the server to start sending us real-time updates
   * NOTE: Some SignalR hubs automatically send data after connection without explicit subscription
   */
  private async subscribeToMarketData(): Promise<void> {
    console.log('');
    console.log('='.repeat(70));
    console.log('🚀🚀🚀 === subscribeToMarketData FUNCTION CALLED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Connection exists:', !!this.connection);
    console.log('Connection state:', this.connection?.state);
    console.log('Connection state (string):', this.getConnectionStatus());
    console.log('Expected state:', SignalR.HubConnectionState.Connected);
    console.log('Connection ID:', this.connection?.connectionId);
    console.log('='.repeat(70));
    console.log('');
    
    if (!this.connection) {
      console.error('❌ FATAL: No connection object!');
      return;
    }
    
    if (this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.error('❌ Cannot subscribe to market data: SignalR not in Connected state');
      console.error('Current state:', this.connection.state);
      console.error('Current state (string):', this.getConnectionStatus());
      console.error('Expected:', SignalR.HubConnectionState.Connected);
      return;
    }

    console.log('✅✅✅ Connection check passed! ✅✅✅');
    console.log('Now fetching session data...');

    try {
      // Get user ID from session data - THIS IS CRITICAL!
      console.log('📡 Calling tradingApiService.getSessionData()...');
      const sessionData = await tradingApiService.getSessionData();
      console.log('✅ Session data received!');
      
      console.log('📤 Subscribing user to market hub...');
      console.log('🔍 DEBUGGING: Full session data structure:', {
        topLevel: Object.keys(sessionData || {}),
        loggedInUser: sessionData?.loggedInUser,
        hasUserId: !!sessionData?.userId,
        hasCustomerId: !!sessionData?.customerId,
        hasUserID: !!sessionData?.userID,
        hasTenantId: !!sessionData?.loggedInUser?.tenantId,
      });
      
      console.log('🔍 FULL loggedInUser object:', JSON.stringify(sessionData?.loggedInUser, null, 2));
      
      // Try multiple possible locations for user ID in the session data
      // CRITICAL: We need to find the CORRECT user ID field
      // Based on the actual session data structure:
      // loggedInUser has: userID, username, email, tenantId, fullname, mobileno, sponsorid
      // ✅ CONFIRMED: userID is the correct field (value: 407)
      // Web sends: {"target":"SubscribeUser","arguments":["407"],"invocationId":"0","type":1}
      const userId = sessionData?.loggedInUser?.userID ||     // ✅ CORRECT - Primary user ID field
                     sessionData?.loggedInUser?.tenantId ||   // Fallback
                     sessionData?.loggedInUser?.sponsorid ||  // Fallback
                     sessionData?.userId || 
                     sessionData?.customerId || 
                     sessionData?.userID;
      
      console.log('👤 Selected User ID:', userId ? `***USER_ID: ${userId}***` : 'NOT FOUND');
      console.log('📋 Using field:', 
        sessionData?.loggedInUser?.userID ? `loggedInUser.userID (${sessionData.loggedInUser.userID}) - ✅ PRIMARY FIELD` :
        sessionData?.loggedInUser?.tenantId ? `loggedInUser.tenantId (${sessionData.loggedInUser.tenantId})` :
        sessionData?.loggedInUser?.sponsorid ? `loggedInUser.sponsorid (${sessionData.loggedInUser.sponsorid})` :
        sessionData?.userId ? 'sessionData.userId' :
        sessionData?.customerId ? 'sessionData.customerId' :
        sessionData?.userID ? 'sessionData.userID' :
        'NONE'
      );
      
      console.log('📊 Available user fields in session:');
      console.log('  - userID:', sessionData?.loggedInUser?.userID, '✅ PRIMARY');
      console.log('  - tenantId:', sessionData?.loggedInUser?.tenantId);
      console.log('  - sponsorid:', sessionData?.loggedInUser?.sponsorid);
      console.log('  - username:', sessionData?.loggedInUser?.username);

      if (!userId) {
        console.error('❌ No user ID found in session! Cannot subscribe to market data.');
        console.log('Available session data keys:', Object.keys(sessionData || {}));
        console.log('Full session data (sanitized):', JSON.stringify(sessionData, null, 2).replace(/[0-9]{10,}/g, '***'));
        return;
      }

      try {
        // THIS IS THE CORRECT METHOD FROM THE SERVER CODE: SubscribeUser
        // The server expects the user ID as a STRING (from jQuery .val() which returns string)
        
        // Convert userId to string - server expects string format
        const userIdString = String(userId);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('📤📤📤 INVOKING SubscribeUser METHOD 📤📤📤');
        console.log('✅ Using actual userID from session');
        console.log('User ID from session:', userId);
        console.log('User ID (as string):', userIdString);
        console.log('User ID type:', typeof userIdString);
        console.log('Expected format: {"target":"SubscribeUser","arguments":["407"],"invocationId":"0","type":1}');
        console.log('We send:', `["${userIdString}"]`);
        console.log('Hub URL:', this.connection.baseUrl);
        console.log('Connection ID:', this.connection.connectionId);
        console.log('='.repeat(60));
        console.log('');
        
        console.log('🔥 ATTEMPTING INVOKE NOW...');
        console.log('🔥 Pre-invoke check:');
        console.log('  - Connection exists:', !!this.connection);
        console.log('  - Connection state:', this.connection?.state);
        console.log('  - Is Connected:', this.connection?.state === SignalR.HubConnectionState.Connected);
        console.log('  - Method name:', 'SubscribeUser');
        console.log('  - Argument:', userIdString);
        console.log('  - Argument type:', typeof userIdString);
        
        const invokeResult = await this.connection.invoke('SubscribeUser', userIdString);
        
        console.log('🔥 INVOKE CALL COMPLETED!');
        console.log('🔥 Invoke result:', invokeResult);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('✅✅✅ SubscribeUser SUCCESSFUL! ✅✅✅');
        console.log('Market data should start flowing now...');
        console.log('='.repeat(60));
        console.log('');
      } catch (error: any) {
        if (error.message?.includes('does not exist')) {
          console.error('❌ SubscribeUser method does not exist on server!');
        } else {
          console.error('❌ SubscribeUser failed:', error);
          console.error('❌ Error details:', {
            message: error.message,
            userId: userId,
            userIdType: typeof userId,
            userIdString: String(userId)
          });
        }
        
        // Try as number if string failed
        try {
          console.log('🔄 Retrying SubscribeUser with userId as number...');
          await this.connection.invoke('SubscribeUser', Number(userId));
          console.log('✅ SubscribeUser succeeded with number!');
        } catch (retryError) {
          console.error('❌ Retry also failed:', retryError);
          throw error; // Throw original error
        }
      }
      
    } catch (error) {
      console.error('❌ Error in subscribeToMarketData:', error);
    }
  }

  /**
   * Subscribe to specific instruments for real-time updates
   * @param instrumentTokens Array of instrument tokens to subscribe to
   * NOTE: If server doesn't support instrument-level subscription, it may send all market data by default
   */
  async subscribeToInstruments(instrumentTokens: string[] | number[]): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.warn('⚠️ Cannot subscribe to instruments: SignalR not connected');
      return;
    }

    if (instrumentTokens.length === 0) {
      console.log('ℹ️ No instruments to subscribe to');
      return;
    }

    try {
      console.log(`📤 Attempting to subscribe to ${instrumentTokens.length} instruments`);
      console.log('🔍 Sample tokens:', instrumentTokens.slice(0, 5));
      
      // Try different possible method names
      const possibleMethods = [
        { name: 'SubscribeInstruments', args: [instrumentTokens] },
        { name: 'Subscribe', args: [instrumentTokens] },
        { name: 'SubscribeToInstruments', args: [instrumentTokens] },
        { name: 'AddInstruments', args: [instrumentTokens] },
        { name: 'JoinGroup', args: ['market_data', instrumentTokens] },
      ];

      let success = false;
      
      for (const method of possibleMethods) {
        try {
          console.log(`📤 Trying: ${method.name}`);
          await this.connection.invoke(method.name, ...method.args);
          console.log(`✅ Successfully subscribed via ${method.name}`);
          success = true;
          break;
        } catch (error: any) {
          if (error.message?.includes('does not exist')) {
            // Expected - method doesn't exist, continue to next
            continue;
          } else {
            console.warn(`⚠️ ${method.name} failed:`, error.message);
          }
        }
      }

      if (!success) {
        console.log('ℹ️ No instrument subscription method found on server');
        console.log('ℹ️ Server may broadcast all market data automatically');
        console.log('ℹ️ Client will filter data by matching instrument tokens');
      }
      
    } catch (error) {
      console.error('❌ Error in subscribeToInstruments:', error);
    }
  }

  /**
   * Unsubscribe from specific instruments
   * @param instrumentTokens Array of instrument tokens to unsubscribe from
   */
  async unsubscribeFromInstruments(instrumentTokens: string[] | number[]): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.warn('⚠️ Cannot unsubscribe from instruments: SignalR not connected');
      return;
    }

    try {
      console.log(`📤 Unsubscribing from ${instrumentTokens.length} instruments`);
      
      const possibleMethods = [
        'UnsubscribeFromInstruments',
        'Unsubscribe',
        'UnsubscribeInstruments',
        'RemoveInstruments',
        'LeaveInstrumentGroup'
      ];

      for (const methodName of possibleMethods) {
        try {
          await this.connection.invoke(methodName, instrumentTokens);
          console.log(`✅ Successfully unsubscribed via ${methodName}`);
          break;
        } catch (error: any) {
          if (!error.message?.includes('does not exist')) {
            console.warn(`⚠️ ${methodName} failed:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error unsubscribing from instruments:', error);
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('✅ SignalR disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting SignalR:', error);
      }
      this.connection = null;
    }
    
    this.subscriptions.clear();
  }

  /**
   * Subscribe to SignalR messages by type
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

    console.log('✅ SignalR subscription added:', {
      subscriptionId,
      messageType,
      totalSubscriptions: this.getSubscriptionCount(),
      subscriptionTypes: this.getSubscriptionTypes()
    });
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from SignalR messages
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
      console.log(`📢 Notifying ${subscribers.length} subscribers for '${messageType}'`);
      subscribers.forEach(sub => {
        try {
          sub.callback(data);
        } catch (error) {
          console.error(`❌ Error in subscriber callback for '${messageType}':`, error);
        }
      });
    } else {
      console.log(`⚠️ No subscribers for message type '${messageType}'`);
    }
  }

  /**
   * Invoke a method on the SignalR hub (send message to server)
   */
  async invoke(methodName: string, ...args: any[]): Promise<any> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.error('❌ Cannot invoke method: SignalR not connected');
      throw new Error('SignalR not connected');
    }

    try {
      console.log(`📤 Invoking SignalR method '${methodName}' with args:`, args);
      const result = await this.connection.invoke(methodName, ...args);
      console.log(`✅ SignalR method '${methodName}' invoked successfully:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error invoking SignalR method '${methodName}':`, error);
      throw error;
    }
  }

  /**
   * Send a message to the SignalR hub (fire and forget)
   */
  async send(methodName: string, ...args: any[]): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.error('❌ Cannot send message: SignalR not connected');
      return;
    }

    try {
      console.log(`📤 Sending SignalR message '${methodName}' with args:`, args);
      await this.connection.send(methodName, ...args);
      console.log(`✅ SignalR message '${methodName}' sent successfully`);
    } catch (error) {
      console.error(`❌ Error sending SignalR message '${methodName}':`, error);
    }
  }

  /**
   * Handle manual reconnection logic
   */
  private handleManualReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ Manual reconnection failed:', error);
        this.reconnectAttempts++;
        if (this.shouldReconnect) {
          this.handleManualReconnect();
        }
      }
    }, delay);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    if (!this.connection) return 'disconnected';
    
    switch (this.connection.state) {
      case SignalR.HubConnectionState.Connecting:
        return 'connecting';
      case SignalR.HubConnectionState.Connected:
        return 'connected';
      case SignalR.HubConnectionState.Disconnecting:
        return 'disconnecting';
      case SignalR.HubConnectionState.Disconnected:
        return 'disconnected';
      case SignalR.HubConnectionState.Reconnecting:
        return 'reconnecting';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if SignalR is connected
   */
  isConnected(): boolean {
    return this.connection?.state === SignalR.HubConnectionState.Connected;
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

  /**
   * Get connection ID
   */
  getConnectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

export const signalRService = SignalRService.getInstance();
