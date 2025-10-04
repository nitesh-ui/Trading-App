// API service for authentication and trading
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionManager } from './sessionManager';

const API_BASE_URL = 'https://tradingapi.sanaitatechnologies.com';

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
  domainURL: string;
  user_Location?: string;
  ipAddess?: string;
}

export interface RegisterRequest {
  fullname: string;
  email: string;
  mobilenumber: string;
  password: string;
  confirmPassword: string;
  domainURL: string;
  sponserId: string;
}

export interface RegisterResponse {
  message?: string;
  data?: {
    userId?: string;
    username?: string;
    email?: string;
  };
  error?: string;
  success?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    sessionValidity?: string;
    sessionToken?: string;
    loggedInUser?: {
      username: string;
      email: string;
      tenantId: number;
      fullname: string;
      mobileno: string;
      sponsorid: string;
    };
    loggedInWatchlistAccess?: Array<{
      scriptExchange: string;
      id: number;
    }>;
  };
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}

export interface SendOtpRequest {
  email: string;
  domainURL: string;
}

export interface SendOtpResponse {
  message?: string;
  data?: {
    userID?: string;
  };
  error?: string;
  success?: boolean;
}

export interface UpdatePasswordRequest {
  password: string;
  email: string;
  userID: string;
  otp: string;
}

export interface UpdatePasswordResponse {
  message?: string;
  data?: any;
  error?: string;
  success?: boolean;
}

export interface ProceedBuySellRequest {
  intWID: number;
  scriptCode: number;
  currentPosition: string;
  quantity: string;
  price: string;
  triggerPrice: string;
  productType: string;
  marketType: string;
  tradeID: string;
  status: string;
  target: string;
  stopLoss: string;
  tradinG_UNIT: number;
}

export interface ProceedBuySellResponse {
  message?: string;
  data?: any;
  error?: string;
  success?: boolean;
}

export interface ActiveTradeItem {
  activeTradeID: number;
  status: string;
  profitorloss: number;
  tradeSymbol: string;
  scriptInstrumentType: string;
  productType: string;
  priceType: string;
  currentPosition: string;
  currentPositionNew: string;
  strategyname: string;
  qty: number;
  sl: number;
  tgT2: number;
  tgT3: number;
  tgT4: number;
  triggerPrice: string;
  orderPrice: number;
  orderDate: string;
  orderTime: string;
  userID: number;
  tradinG_UNIT_TYPE: number;
  tradinG_UNIT: string;
  companY_INITIAL: string;
  tenanT_ID: number;
  objScriptDTO: {
    scriptExchange: string;
    lastprice: number;
    scriptLotSize: number;
    bid: number;
    ask: number;
  };
}

export interface GetActiveTradesResponse {
  message: string;
  data: ActiveTradeItem[];
}

export interface NotificationItem {
  id: number;
  userID: number;
  description: string;
  type: number;
  seen: number;
  createdDate: string;
  createdDateString: string;
  email: string;
  source: string;
  userip: string;
  total_Page: number;
  fullname: string;
  username: string;
  location: string;
  deviceName: string;
}

export interface GetNotificationsResponse {
  message: string;
  data: NotificationItem[];
}

export interface TransactionHistoryRequest {
  pageNo: number;
  sessionKey?: string; // Optional for the interface
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  scriptExchange?: string;
  currentPosition?: string; // 'BUY' | 'SELL'
}

export interface TransactionHistoryReportsRequest {
  pageNo: number;
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string;   // Format: YYYY-MM-DD
  scriptExchange?: string;
  currentPosition?: string; // 'BUY' | 'SELL'
}

export interface TransactionHistoryItem {
  id: number;
  tradeSymbol: string;
  currentPosition: string;
  strategy: string;
  status: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
  // Additional fields that might be in the API response
  qty?: number;
  profitLoss?: number;
  scriptExchange?: string;
  total_Page?: number;
}

export interface TransactionHistoryReportsItem {
  completedtradeid: number;
  tradeSymbol: string;
  currentPosition: string;
  strategyname: string;
  status: string;
  entrydate: string;
  entrytime: string;
  exitDate: string;
  exittime: string;
  entryprice: number;
  exitprice: number;
  qty: number;
  profitorloss: number;
  scriptExchange: string;
  total_Page: number;
}

export interface TransactionHistoryResponse {
  message: string;
  data: TransactionHistoryItem[];
  success?: boolean;
}

export interface TransactionHistoryReportsResponse {
  message: string;
  data: TransactionHistoryReportsItem[];
  success?: boolean;
}

export interface WalletBalanceData {
  amount: string;
  totalprofitloss: number;
  availablebalance: number;
  usedbalance: number;
  usedMargin: number;
  availableMargin: number;
  totalmargin: number;
  // Additional fields from API response
  userID: number;
  tenantId: number;
  totalinflow: number;
  totaloutflow: number;
  closingbalance: number;
  openingbalance: number;
  loanbalance: number;
  deliveryPledge: number;
  dailyTotalprofitloss: number;
}

export interface WalletBalanceResponse {
  message: string;
  data: WalletBalanceData;
}

// Transaction History Interfaces
export interface TransactionHistoryRequest {
  pageNo: number;
  startDate?: string;
  endDate?: string;
  payinPayout: boolean;
}

export interface TransactionHistoryItem {
  id: number;
  activeTradeID: number;
  email: string;
  userID: number;
  tenantId: number;
  description: string;
  date_Time: string;
  date_Time_String: string;
  amount: string;
  amountindouble: number;
  totalinflow: number;
  totaloutflow: number;
  type: number;
  transectionid: string;
  isread: number;
  total_Pages: number;
  recievedform: string;
  status: string;
  returnUrl: string;
  balance: string;
  closingbalance: number;
  openingbalance: number;
  loanbalance: number;
  parentUserID: number;
  level: number;
  equitybrokerfixedorpercentage: boolean;
  futuresbrokerfixedorpercentage: boolean;
  optionsbrokerfixedorpercentage: boolean;
  equitybrokerfixedorpercentagevalue: number;
  futuresBrokerFixedOrPercentageValue: number;
  optionsbrokerfixedorpercentagevalue: number;
  scriptExchange?: string;
  availablebalance: number;
  usedbalance: number;
  totalprofitloss: number;
  deliveryPledge: number;
  usedMargin: number;
  availableMargin: number;
  dailyTotalprofitloss: number;
  totalmargin: number;
  brokeragecutfor: string;
}

export interface TransactionHistoryResponse {
  message: string;
  data: TransactionHistoryItem[];
}

export interface TransactionDetailsResponse {
  Completedtradeid: number;
  Activetradeidfororderlog: number;
  TradeSymbol: string;
  Scriptsegment: string;
  Scripttype: string;
  Entrydate: string;
  Entrytime: string;
  Entryprice: number;
  ExitDate: string;
  Exittime: string;
  Exitprice: number;
  Openingwalletbalance: number;
  Profitorloss: number;
  Status: string;
  StatusMessage: string;
  UserID: number;
  CurrentPosition: string;
  Qty: number;
  strategyID: number;
  Fundmanagername: string;
  Strategyname: string;
  WID: number;
  Watchlistname: string;
  IsLive: boolean;
  Username: string;
  Fullname: string;
  isReverseOrder: boolean;
  Publishname: string;
  ProductType: string;
  ScriptLotSize: number;
  Brokerage: number;
  Total_Page: number;
  Netprofitorloss: number;
  Totalprofit: number;
  Totalloss: number;
  TotalBrokerage: number;
  ScriptExchange: string;
  LAST_PRICE_TYPE: number;
  TRADING_UNIT_TYPE: number;
  ScriptInstrumentType: string;
  Issoftdeleted: number;
  ScriptName: string;
  ScriptCode: number;
  HOLDED_EXPOSURE: number;
  IsaddedToMargin: boolean;
  Email: string;
  BuyQtyWiseOrLot: number;
  Averageprice: number;
  Lastprice: number;
  TRADING_UNIT: string;
  Active_LTP: number;
  Active_Bid: number;
  Active_Ask: number;
  Datescriptexpiry: string;
  Scriptexpiry: string;
  TENANT_ID: number;
  COMPANY_INITIAL: string;
  Orderplacedfrom: string;
  Sponsorid: string;
  Userroleid: string;
  Userip: string;
  CREATED_BY: number;
  CREATED_DATE: string;
  CREATED_BY_2: string;
  UPDATED_BY: number;
  UPDATED_DATE: string;
  UPDATED_BY_2: string;
  Qty_MODIFIED_BY: number;
  Qty_MODIFIED_DATE: string;
  Qty_MODIFIED_BY_2: string;
  BROKRAGE_DEDUCTED_AMOUNT: number;
  Brokrage_Deducted_Amount_2: number;
}

// GetRequiredMargin API Interfaces
export interface GetRequiredMarginRequest {
  ScriptLotSize: number;
  ScriptCode: string;
  quantity: number;
  Totalwalletbalance: number;
  MisOrNot: number; // 1 for MIS, 0 for NRML
  Lastprice: number;
  TRADING_UNIT_TYPE: number;
  ScriptExchange: string;
  CurrentPosition: string; // 'Buy' or 'Sell'
}

export interface RequiredMarginData {
  WID: number;
  Watchlistname: string;
  Scripts: number;
  UserID: number;
  Email: string;
  ScriptExchange: string;
  ExpireDay: number;
  Ismanual: boolean;
  ENABLE_SCRIPTWISE_BROKERAGE: number;
  ENABLE_LOTWISE_BROKERAGE: number;
  MIS_EXPOSER: number;
  NORMAL_EXPOSER: number;
  BROKERAGE_TYPE: number;
  BROKERAGE_VALUE: number;
  Banscriptid: number;
  ScriptName: string;
  Total_Page: number;
  Requiredmargin: number;
  Availablemargin: number;
  Usedmargin: number;
  PledgeMargin: number;
  ScriptCode: number;
  roleid: string;
  rolename: string;
  Level: number;
}

export interface GetRequiredMarginResponse {
  message?: string;
  data?: RequiredMarginData[];
  success?: boolean;
}

class TradingApiService {
  private static instance: TradingApiService;
  private unauthorizedHandler?: (notificationSystem?: { showNotification: (notification: any) => void }) => Promise<void>;

  static getInstance(): TradingApiService {
    if (!TradingApiService.instance) {
      TradingApiService.instance = new TradingApiService();
    }
    return TradingApiService.instance;
  }

  /**
   * Set a global handler for 401 unauthorized responses
   */
  setUnauthorizedHandler(handler: (notificationSystem?: { showNotification: (notification: any) => void }) => Promise<void>): void {
    this.unauthorizedHandler = handler;
  }

  /**
   * Login user with email/username and password
   */
  async login(credentials: { emailOrUsername: string; password: string }): Promise<LoginResponse> {
    try {
      const requestBody: LoginRequest = {
        emailOrUsername: credentials.emailOrUsername,
        password: credentials.password,
        domainURL: 'uat.sanaitatechnologies.com',
        user_Location: '',
        ipAddess: ''
      };

      console.log('🚀 Login API Request:', {
        url: `${API_BASE_URL}/LoginAPI/UserLogin`,
        method: 'POST',
        body: requestBody
      });

      const response = await fetch(`${API_BASE_URL}/LoginAPI/UserLogin`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response Status:', response.status);

      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        
        return {
          success: false,
          message: `Login failed: ${response.status} ${response.statusText}`,
          error: errorText || 'Network error occurred',
        };
      }

      const data = await response.json();
      console.log('✅ API Success Response:', data);

      // Handle different response formats
      if (data.success === false || data.error) {
        return {
          success: false,
          message: data.message || data.error || 'Login failed',
          error: data.error,
        };
      }

      // Check if we have the expected login response format
      if (data.message && data.data && data.data.sessionToken && data.data.loggedInUser) {
        // Save session data to AsyncStorage
        await this.saveSessionData(data.data);

        // Successful login with new API response format
        return {
          success: true,
          message: data.message || 'Login successful',
          data: {
            sessionToken: data.data.sessionToken,
            sessionValidity: data.data.sessionValidity,
            loggedInUser: data.data.loggedInUser,
            loggedInWatchlistAccess: data.data.loggedInWatchlistAccess,
          },
        };
      }

      // Fallback for other response formats
      return {
        success: true,
        message: data.message || 'Login successful',
        data: data.data || {},
      };

    } catch (error) {
      console.error('🔥 API Request Error:', error);
      
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Save session data to AsyncStorage with enhanced validity tracking
   */
  private async saveSessionData(sessionData: any): Promise<void> {
    try {
      const now = new Date();
      const originalValidity = new Date(sessionData.sessionValidity);
      
      // Initialize extended validity to 19 minutes from now (first extension on login)
      const initialExtendedValidity = new Date(now.getTime() + 19 * 60 * 1000);
      
      const sessionInfo = {
        sessionToken: sessionData.sessionToken,
        sessionValidity: sessionData.sessionValidity,
        loggedInUser: sessionData.loggedInUser,
        loggedInWatchlistAccess: sessionData.loggedInWatchlistAccess,
        loginTime: now.toISOString(),
        lastApiCall: now.toISOString(),
        extendedValidityTime: initialExtendedValidity.toISOString(),
      };

      await AsyncStorage.multiSet([
        ['trading_session_token', sessionData.sessionToken || ''],
        ['trading_session_validity', sessionData.sessionValidity || ''],
        ['trading_user_data', JSON.stringify(sessionData.loggedInUser || {})],
        ['trading_watchlist_access', JSON.stringify(sessionData.loggedInWatchlistAccess || [])],
        ['trading_session_info', JSON.stringify(sessionInfo)],
      ]);

      console.log('✅ Session data saved to AsyncStorage:', {
        originalValidity: originalValidity.toISOString(),
        extendedValidity: initialExtendedValidity.toISOString(),
        user: sessionData.loggedInUser?.username,
        loginTime: now.toISOString()
      });
    } catch (error) {
      console.error('❌ Error saving session data:', error);
    }
  }

  /**
   * Check if session is valid and not expired
   */
  async isSessionValid(): Promise<boolean> {
    try {
      const sessionInfo = await AsyncStorage.getItem('trading_session_info');
      if (!sessionInfo) {
        console.log('⚠️ No session info found');
        return false;
      }

      const parsed = JSON.parse(sessionInfo);
      const now = new Date();
      
      // Check original session validity
      const originalValidity = new Date(parsed.sessionValidity);
      
      // Check extended validity (original + extensions from API calls)
      const extendedValidity = new Date(parsed.extendedValidityTime || parsed.sessionValidity);
      
      const isOriginalValid = originalValidity > now;
      const isExtendedValid = extendedValidity > now;
      
      console.log('🔍 Session validity check:', {
        now: now.toISOString(),
        originalValidity: originalValidity.toISOString(),
        extendedValidity: extendedValidity.toISOString(),
        isOriginalValid,
        isExtendedValid,
        minutesUntilExpiry: Math.round((extendedValidity.getTime() - now.getTime()) / (1000 * 60)),
        lastApiCall: parsed.lastApiCall
      });

      if (!isExtendedValid) {
        console.log('⚠️ Session expired, clearing session data');
        await this.clearSessionData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error checking session validity:', error);
      return false;
    }
  }

  /**
   * Extend session validity by 19 minutes on successful API calls
   */
  async extendSessionValidity(): Promise<void> {
    try {
      const sessionInfo = await AsyncStorage.getItem('trading_session_info');
      if (!sessionInfo) {
        console.log('⚠️ No session info found for extension');
        return;
      }

      const parsed = JSON.parse(sessionInfo);
      const now = new Date();
      
      // Extend validity by 19 minutes from now
      const newExtendedValidity = new Date(now.getTime() + 19 * 60 * 1000);
      
      const previousExtendedValidity = parsed.extendedValidityTime;
      
      parsed.lastApiCall = now.toISOString();
      parsed.extendedValidityTime = newExtendedValidity.toISOString();

      await AsyncStorage.setItem('trading_session_info', JSON.stringify(parsed));
      
      console.log('✅ Session validity extended:', {
        previousExpiry: previousExtendedValidity,
        newExpiry: newExtendedValidity.toISOString(),
        extensionMinutes: 19,
        lastApiCall: now.toISOString()
      });
    } catch (error) {
      console.error('❌ Error extending session validity:', error);
    }
  }

  /**
   * Get saved session data from AsyncStorage with validity check
   */
  async getSessionData(): Promise<any | null> {
    try {
      const isValid = await this.isSessionValid();
      if (!isValid) {
        return null;
      }

      const sessionInfo = await AsyncStorage.getItem('trading_session_info');
      if (sessionInfo) {
        return JSON.parse(sessionInfo);
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting session data:', error);
      return null;
    }
  }

  /**
   * Clear session data from AsyncStorage
   */
  async clearSessionData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'trading_session_token',
        'trading_session_validity',
        'trading_user_data',
        'trading_watchlist_access',
        'trading_session_info',
      ]);
      console.log('✅ Session data cleared from AsyncStorage');
    } catch (error) {
      console.error('❌ Error clearing session data:', error);
    }
  }

  /**
   * Check if user has a valid session
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isSessionValid();
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testBody = {
        emailOrUsername: 'test',
        password: 'test',
        domainURL: 'uat.sanaitatechnologies.com',
        user_Location: '',
        ipAddess: ''
      };

      const response = await fetch(`${API_BASE_URL}/LoginAPI/UserLogin`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBody),
      });

      return {
        success: response.ok,
        message: response.ok ? 'API is reachable' : `API returned ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot reach API: ${error instanceof Error ? error.message : 'Network error'}`,
      };
    }
  }

  /**
   * Logout user (if API supports it)
   */
  async logout(token?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Clear session data from AsyncStorage
      await this.clearSessionData();
      
      // If we have a session token, try to call logout API
      const sessionData = await this.getSessionData();
      if (sessionData?.sessionToken || token) {
        // You can implement API logout call here if the API supports it
        // await fetch(`${API_BASE_URL}/LoginAPI/Logout`, { ... });
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('❌ Error during logout:', error);
      return {
        success: false,
        message: 'Error occurred during logout',
      };
    }
  }

  async sendForgotPasswordOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    try {
      console.log('🚀 Send OTP API Request:', {
        url: `${API_BASE_URL}/LoginAPI/SendForgotPasswordOtp`,
        method: 'POST',
        body: data
      });

      const response = await fetch(`${API_BASE_URL}/LoginAPI/SendForgotPasswordOtp`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📡 API Response Status:', response.status);

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Parsed API Response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        return {
          success: false,
          message: 'Invalid response format from server',
          error: responseText
        };
      }

      if (!response.ok) {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        return {
          success: false,
          message: responseData.message || 'Failed to send OTP',
          error: responseData.error || 'Server error'
        };
      }

      return {
        success: true,
        message: responseData.message || 'OTP sent successfully',
        data: responseData.data
      };

    } catch (error) {
      console.error('🔥 Send OTP API Error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateForgotPassword(data: UpdatePasswordRequest): Promise<UpdatePasswordResponse> {
    try {
      console.log('🚀 Update Password API Request:', {
        url: `${API_BASE_URL}/LoginAPI/UpdateForgotPassword`,
        method: 'POST',
        body: { ...data, password: '******' } // Log masked password
      });

      const response = await fetch(`${API_BASE_URL}/LoginAPI/UpdateForgotPassword`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📡 API Response Status:', response.status);

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Parsed API Response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        return {
          success: false,
          message: 'Invalid response format from server',
          error: responseText
        };
      }

      if (!response.ok) {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        return {
          success: false,
          message: responseData.message || 'Password update failed',
          error: responseData.error || 'Server error'
        };
      }

      return {
        success: true,
        message: responseData.message || 'Password updated successfully',
        data: responseData.data
      };

    } catch (error) {
      console.error('🔥 Update Password API Error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Basic validation
      if (!data.email || !data.password || !data.confirmPassword || !data.fullname || !data.mobilenumber) {
        return {
          success: false,
          message: 'All fields are required',
          error: 'Missing required fields'
        };
      }

      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
          error: 'Password mismatch'
        };
      }

      // Prepare the request body
      const requestBody = {
        fullname: data.fullname,
        email: data.email,
        mobilenumber: data.mobilenumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        domainURL: data.domainURL || 'uat.sanaitatechnologies.com',
        sponserId: data.sponserId
      };

      console.log('🚀 Register API Request:', {
        url: `${API_BASE_URL}/LoginAPI/Register`,
        method: 'POST',
        body: {
          ...requestBody,
          password: '******',
          confirmPassword: '******'
        }
      });

      const response = await fetch(`${API_BASE_URL}/LoginAPI/Register`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response Status:', response.status);

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Parsed API Response:', responseData);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        return {
          success: false,
          message: 'Invalid response format from server',
          error: responseText
        };
      }

      // Handle unsuccessful response
      if (!response.ok) {
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });

        return {
          success: false,
          message: responseData.message || 'Registration failed',
          error: responseData.error || 'Server error'
        };
      }

      // Check for specific error messages in the response
      if (responseData.message?.toLowerCase().includes('already exists')) {
        return {
          success: false,
          message: 'User already exists with this email or mobile number',
          error: responseData.message
        };
      }

      // Return successful response
      return {
        success: true,
        message: responseData.message || 'Registration successful',
        data: responseData.data
      };

    } catch (error) {
      console.error('🔥 Register API Error:', error);
      return {
        success: false,
        message: 'Network error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Make authenticated API request with session token and validity management
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Check if session is valid before making request
    const isValid = await this.isSessionValid();
    if (!isValid) {
      console.log('⚠️ Session invalid, clearing data and throwing error');
      await this.clearSessionData();
      throw new Error('Session expired. Please login again.');
    }

    const sessionData = await this.getSessionData();
    if (!sessionData?.sessionToken) {
      throw new Error('No valid session token found. Please login again.');
    }

    const headers = {
      'accept': '*/*',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.sessionToken}`,
      'X-Session-Key': sessionData.sessionToken,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - session expired on server
      if (response.status === 401) {
        console.log('⚠️ Received 401 - session expired on server, clearing local session');
        await this.clearSessionData();
        
        // Call the global unauthorized handler if set
        if (this.unauthorizedHandler) {
          try {
            await this.unauthorizedHandler();
            return response; // Return early since handler manages the flow
          } catch (handlerError) {
            console.error('❌ Error in unauthorized handler:', handlerError);
          }
        }
        
        throw new Error('Session expired. Please login again.');
      }

      // Handle 403 Forbidden - insufficient permissions
      if (response.status === 403) {
        console.log('⚠️ Received 403 - insufficient permissions, clearing local session');
        await this.clearSessionData();
        
        // Call the global unauthorized handler if set (403 is also auth-related)
        if (this.unauthorizedHandler) {
          try {
            await this.unauthorizedHandler();
            return response; // Return early since handler manages the flow
          } catch (handlerError) {
            console.error('❌ Error in unauthorized handler:', handlerError);
          }
        }
        
        throw new Error('Access denied. Please login again.');
      }

      // If request is successful, extend session validity
      if (response.ok) {
        await this.extendSessionValidity();
      }

      return response;
    } catch (error) {
      // If it's a network error or other error, check if it's auth-related
      if (error instanceof Error && error.message.includes('Session expired')) {
        throw error; // Re-throw session errors
      }
      
      console.error('❌ Network error in authenticated request:', error);
      throw error;
    }
  }

  /**
   * Get user session info from AsyncStorage
   */
  async getUserInfo(): Promise<any | null> {
    try {
      const sessionData = await this.getSessionData();
      return sessionData?.loggedInUser || null;
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return null;
    }
  }

  /**
   * Get user watchlist access from session
   */
  async getWatchlistAccess(): Promise<any[]> {
    try {
      const sessionData = await this.getSessionData();
      return sessionData?.loggedInWatchlistAccess || [];
    } catch (error) {
      console.error('❌ Error getting watchlist access:', error);
      return [];
    }
  }

  /**
   * Execute buy/sell trade with session management
   */
  async proceedBuySell(tradeData: ProceedBuySellRequest): Promise<ProceedBuySellResponse> {
    try {
      console.log('🚀 ProceedBuySell API Request with session management:', tradeData);

      // Make API call to execute trade using authenticated request
      const response = await this.makeAuthenticatedRequest(
        `${API_BASE_URL}/WatchListApi/ProceedBuySell`,
        {
          method: 'POST',
          body: JSON.stringify(tradeData)
        }
      );

      console.log('📡 ProceedBuySell API Response Status:', response.status);

      const data = await response.json();
      console.log('✅ ProceedBuySell API Success Response:', data);

      return {
        success: true,
        message: data.message || 'Trade executed successfully',
        data: data.data || data
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        // Re-throw session errors to be handled by calling components
        return {
          success: false,
          message: 'Session expired. Please login again.',
          error: 'Session expired'
        };
      }
      
      console.error('❌ Error executing trade:', error);
      return {
        success: false,
        message: 'Failed to execute trade',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get active trades for the current user with session management
   */
  async getActiveTrades(): Promise<GetActiveTradesResponse> {
    try {
      console.log('🚀 GetActiveTrades API Request with session management');

      const response = await this.makeAuthenticatedRequest(
        `${API_BASE_URL}/WatchListApi/GetActiveTrades`,
        {
          method: 'GET'
        }
      );

      console.log('📡 GetActiveTrades API Response Status:', response.status);

      const data = await response.json();
      console.log('✅ GetActiveTrades API Success Response:', data);

      return {
        message: data.message || '',
        data: data.data || []
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        // Re-throw session errors to be handled by calling components
        throw error;
      }
      
      console.error('❌ Error fetching active trades:', error);
      throw error;
    }
  }

  /**
   * Square off a trade (placeholder for future implementation)
   */
  async squareOffTrade(tradeId: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Implement actual square off API call
      // const response = await this.makeAuthenticatedRequest(
      //   `${API_BASE_URL}/WatchListApi/SquareOffTrade`,
      //   {
      //     method: 'POST',
      //     body: JSON.stringify({ tradeId })
      //   }
      // );
      
      console.log('🚀 Square off trade placeholder called for trade ID:', tradeId);
      
      // Placeholder response
      return {
        success: true,
        message: 'Square off order placed successfully'
      };
    } catch (error) {
      console.error('❌ Error squaring off trade:', error);
      return {
        success: false,
        message: 'Failed to square off trade'
      };
    }
  }

  /**
   * Get session statistics for debugging and monitoring
   */
  async getSessionStats(): Promise<any> {
    try {
      const sessionInfo = await AsyncStorage.getItem('trading_session_info');
      if (!sessionInfo) {
        return { hasSession: false, message: 'No session found' };
      }

      const parsed = JSON.parse(sessionInfo);
      const now = new Date();
      const originalValidity = new Date(parsed.sessionValidity);
      const extendedValidity = new Date(parsed.extendedValidityTime || parsed.sessionValidity);
      const loginTime = new Date(parsed.loginTime);
      const lastApiCall = new Date(parsed.lastApiCall);

      return {
        hasSession: true,
        user: parsed.loggedInUser?.username,
        loginTime: loginTime.toISOString(),
        sessionAge: Math.round((now.getTime() - loginTime.getTime()) / (1000 * 60)), // minutes
        originalValidity: originalValidity.toISOString(),
        extendedValidity: extendedValidity.toISOString(),
        minutesUntilExpiry: Math.round((extendedValidity.getTime() - now.getTime()) / (1000 * 60)),
        lastApiCall: lastApiCall.toISOString(),
        minutesSinceLastCall: Math.round((now.getTime() - lastApiCall.getTime()) / (1000 * 60)),
        isOriginalValid: originalValidity > now,
        isExtendedValid: extendedValidity > now,
        totalExtensions: Math.round((extendedValidity.getTime() - originalValidity.getTime()) / (1000 * 60 * 19)) // number of 19-minute extensions
      };
    } catch (error) {
      console.error('❌ Error getting session stats:', error);
      return { hasSession: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get total notification count for the user
   */
  async getNotificationCount(): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      console.log('🔔 Getting notification count...');

      const response = await this.makeAuthenticatedRequest(
        `${API_BASE_URL}/NotificationApi/GetTotalNotificationCount`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        console.error('❌ Failed to get notification count:', response.status);
        return {
          success: false,
          count: 0,
          message: `API returned ${response.status}`,
        };
      }

      const data = await response.json();
      console.log('✅ Notification count response:', data);

      // Handle the API response format: { message: "", data: 11 }
      const count = typeof data.data === 'number' ? data.data : 0;

      return {
        success: true,
        count: count,
        message: data.message || 'Notification count retrieved successfully',
      };

    } catch (error) {
      console.error('❌ Error getting notification count:', error);
      return {
        success: false,
        count: 0,
        message: error instanceof Error ? error.message : 'Failed to get notification count',
      };
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getNotifications(pageNumber: number = 1): Promise<GetNotificationsResponse> {
    try {
      console.log('🚀 GetNotifications API Request:', {
        url: `${API_BASE_URL}/NotificationApi/GetNotification`,
        method: 'GET',
        pageNumber
      });

      // Make API call using authenticated request
      const response = await this.makeAuthenticatedRequest(
        `${API_BASE_URL}/NotificationApi/GetNotification?PageNumber=${pageNumber}`,
        {
          method: 'GET',
        }
      );

      console.log('📡 Notifications API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Notifications API Error Response:', errorText);
        
        return {
          message: `Failed to fetch notifications: ${response.status} ${response.statusText}`,
          data: [],
        };
      }

      const data = await response.json();
      console.log('✅ Notifications API Success Response:', {
        message: data.message,
        dataCount: data.data?.length || 0,
        totalPages: data.data?.[0]?.total_Page || 0
      });

      return {
        message: data.message || 'Notifications fetched successfully',
        data: data.data || [],
      };

    } catch (error) {
      console.error('🔥 Get Notifications API Error:', error);
      
      return {
        message: 'Network error. Please check your connection and try again.',
        data: [],
      };
    }
  }

  // Get transaction history for reports
  async getTransactionHistoryForReports(request: TransactionHistoryReportsRequest): Promise<TransactionHistoryReportsResponse> {
    console.log('📊 Getting Transaction History For Reports:', {
      pageNo: request.pageNo,
      startDate: request.startDate,
      endDate: request.endDate,
      scriptExchange: request.scriptExchange,
      currentPosition: request.currentPosition
    });

    try {
      const sessionToken = sessionManager.getToken();
      if (!sessionToken) {
        return {
          message: 'Session token not available. Please log in again.',
          data: [],
        };
      }

      const response = await fetch(`${API_BASE_URL}/CompleteTradeApi/GetTransactionHistoryForReports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'X-Session-Key': sessionToken,
        },
        body: JSON.stringify({
          pageNo: request.pageNo,
          scriptExchange: request.scriptExchange || 'All',
          currentPosition: request.currentPosition || 'All',
          startDate: request.startDate,
          endDate: request.endDate,
        }),
      });

      console.log('📊 Transaction History API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Transaction History API Error Response:', errorText);
        
        return {
          message: `Failed to fetch transaction history: ${response.status} ${response.statusText}`,
          data: [],
        };
      }

      const data = await response.json();
      console.log('✅ Transaction History API Success Response:', {
        message: data.message,
        dataCount: data.data?.length || 0,
        totalPages: data.data?.[0]?.total_Page || 0
      });

      return {
        message: data.message || 'Transaction history fetched successfully',
        data: data.data || [],
      };

    } catch (error) {
      console.error('🔥 Get Transaction History API Error:', error);
      
      return {
        message: 'Network error. Please check your connection and try again.',
        data: [],
      };
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<WalletBalanceResponse> {
    console.log('💰 Getting Wallet Balance');

    try {
      const sessionToken = sessionManager.getToken();
      if (!sessionToken) {
        return {
          message: 'Session token not available. Please log in again.',
          data: {
            amount: '0',
            totalprofitloss: 0,
            availablebalance: 0,
            usedbalance: 0,
            usedMargin: 0,
            availableMargin: 0,
            totalmargin: 0,
            userID: 0,
            tenantId: 0,
            totalinflow: 0,
            totaloutflow: 0,
            closingbalance: 0,
            openingbalance: 0,
            loanbalance: 0,
            deliveryPledge: 0,
            dailyTotalprofitloss: 0,
          },
        };
      }

      const response = await fetch(`${API_BASE_URL}/UserWalletApi/GetBalance`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'X-Session-Key': sessionToken,
        },
      });

      console.log('💰 Wallet Balance API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Wallet Balance API Error Response:', errorText);
        
        return {
          message: `Failed to fetch wallet balance: ${response.status} ${response.statusText}`,
          data: {
            amount: '0',
            totalprofitloss: 0,
            availablebalance: 0,
            usedbalance: 0,
            usedMargin: 0,
            availableMargin: 0,
            totalmargin: 0,
            userID: 0,
            tenantId: 0,
            totalinflow: 0,
            totaloutflow: 0,
            closingbalance: 0,
            openingbalance: 0,
            loanbalance: 0,
            deliveryPledge: 0,
            dailyTotalprofitloss: 0,
          },
        };
      }

      const data = await response.json();
      console.log('✅ Wallet Balance API Success Response:', {
        message: data.message,
        amount: data.data?.amount,
        totalprofitloss: data.data?.totalprofitloss
      });

      return {
        message: data.message || 'Wallet balance fetched successfully',
        data: data.data || {
          amount: '0',
          totalprofitloss: 0,
          availablebalance: 0,
          usedbalance: 0,
          usedMargin: 0,
          availableMargin: 0,
          totalmargin: 0,
          userID: 0,
          tenantId: 0,
          totalinflow: 0,
          totaloutflow: 0,
          closingbalance: 0,
          openingbalance: 0,
          loanbalance: 0,
          deliveryPledge: 0,
          dailyTotalprofitloss: 0,
        },
      };

    } catch (error) {
      console.error('🔥 Get Wallet Balance API Error:', error);
      
      return {
        message: 'Network error. Please check your connection and try again.',
        data: {
          amount: '0',
          totalprofitloss: 0,
          availablebalance: 0,
          usedbalance: 0,
          usedMargin: 0,
          availableMargin: 0,
          totalmargin: 0,
          userID: 0,
          tenantId: 0,
          totalinflow: 0,
          totaloutflow: 0,
          closingbalance: 0,
          openingbalance: 0,
          loanbalance: 0,
          deliveryPledge: 0,
          dailyTotalprofitloss: 0,
        },
      };
    }
  }

  // Get transaction history with filters and pagination
  async getTransactionHistory(request: TransactionHistoryRequest): Promise<TransactionHistoryResponse> {
    console.log('📋 Getting Transaction History', request);

    try {
      const sessionToken = sessionManager.getToken();
      if (!sessionToken) {
        return {
          message: 'Session token not available. Please log in again.',
          data: [],
        };
      }

      const payload: any = {
        pageNo: request.pageNo,
        payinPayout: request.payinPayout
      };

      // Only include dates if they are provided
      if (request.startDate) {
        payload.startDate = request.startDate;
      }
      if (request.endDate) {
        payload.endDate = request.endDate;
      }

      const response = await fetch(`${API_BASE_URL}/UserWalletApi/GetLedgerHistory`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'X-Session-Key': sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📋 Transaction History API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Transaction History API Error Response:', errorText);
        
        return {
          message: `Failed to fetch transaction history: ${response.status} ${response.statusText}`,
          data: [],
        };
      }

      const data = await response.json();
      console.log('✅ Transaction History API Success Response:', {
        message: data.message,
        dataLength: data.data?.length || 0
      });

      return {
        message: data.message || 'Transaction history fetched successfully',
        data: data.data || [],
      };

    } catch (error) {
      console.error('🔥 Get Transaction History API Error:', error);
      
      return {
        message: 'Network error. Please check your connection and try again.',
        data: [],
      };
    }
  }

  /**
   * Get required margin for a trade
   */
  async getRequiredMargin(request: GetRequiredMarginRequest): Promise<GetRequiredMarginResponse> {
    try {
      const queryParams = new URLSearchParams({
        ScriptLotSize: request.ScriptLotSize.toString(),
        ScriptCode: request.ScriptCode,
        quantity: request.quantity.toString(),
        Totalwalletbalance: request.Totalwalletbalance.toString(),
        MisOrNot: request.MisOrNot.toString(),
        Lastprice: request.Lastprice.toString(),
        TRADING_UNIT_TYPE: request.TRADING_UNIT_TYPE.toString(),
        ScriptExchange: request.ScriptExchange,
        CurrentPosition: request.CurrentPosition
      });

      console.log('🚀 GetRequiredMargin API Request:', {
        url: `https://uat.sanaitatechnologies.com/Trade/GetRequiredMargin?${queryParams.toString()}`,
        method: 'GET'
      });

      const response = await this.makeAuthenticatedRequest(
        `https://uat.sanaitatechnologies.com/Trade/GetRequiredMargin?${queryParams.toString()}`,
        {
          method: 'GET'
        }
      );

      console.log('📡 GetRequiredMargin API Response Status:', response.status);

      if (!response.ok) {
        throw new Error(`GetRequiredMargin failed with status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📋 GetRequiredMargin Raw Response:', responseText);

      // Parse the JSON string response
      const data = JSON.parse(responseText);
      console.log('✅ GetRequiredMargin Parsed Response:', data);

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        message: 'Required margin fetched successfully'
      };

    } catch (error) {
      if (error instanceof Error && error.message.includes('Session expired')) {
        throw error;
      }
      
      console.error('❌ Error fetching required margin:', error);
      throw error;
    }
  }
}

export const tradingApiService = TradingApiService.getInstance();
