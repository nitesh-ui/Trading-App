// API service for authentication and trading
import AsyncStorage from '@react-native-async-storage/async-storage';

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

class TradingApiService {
  private static instance: TradingApiService;

  static getInstance(): TradingApiService {
    if (!TradingApiService.instance) {
      TradingApiService.instance = new TradingApiService();
    }
    return TradingApiService.instance;
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
   * Save session data to AsyncStorage
   */
  private async saveSessionData(sessionData: any): Promise<void> {
    try {
      const sessionInfo = {
        sessionToken: sessionData.sessionToken,
        sessionValidity: sessionData.sessionValidity,
        loggedInUser: sessionData.loggedInUser,
        loggedInWatchlistAccess: sessionData.loggedInWatchlistAccess,
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.multiSet([
        ['trading_session_token', sessionData.sessionToken || ''],
        ['trading_session_validity', sessionData.sessionValidity || ''],
        ['trading_user_data', JSON.stringify(sessionData.loggedInUser || {})],
        ['trading_watchlist_access', JSON.stringify(sessionData.loggedInWatchlistAccess || [])],
        ['trading_session_info', JSON.stringify(sessionInfo)],
      ]);

      console.log('✅ Session data saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Error saving session data:', error);
    }
  }

  /**
   * Get saved session data from AsyncStorage
   */
  async getSessionData(): Promise<any | null> {
    try {
      const sessionInfo = await AsyncStorage.getItem('trading_session_info');
      if (sessionInfo) {
        const parsed = JSON.parse(sessionInfo);
        // Check if session is still valid
        if (parsed.sessionValidity && new Date(parsed.sessionValidity) > new Date()) {
          return parsed;
        } else {
          // Session expired, clear it
          await this.clearSessionData();
          return null;
        }
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
    const sessionData = await this.getSessionData();
    return sessionData !== null;
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
   * Make authenticated API request with session token
   */
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const sessionData = await this.getSessionData();
    if (!sessionData?.sessionToken) {
      throw new Error('No valid session token found. Please login again.');
    }

    const headers = {
      'accept': '*/*',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionData.sessionToken}`,
      ...(options.headers || {}),
    };

    return fetch(url, {
      ...options,
      headers,
    });
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
   * Execute buy/sell trade
   */
  async proceedBuySell(tradeData: ProceedBuySellRequest): Promise<ProceedBuySellResponse> {
    try {
      // Check if user is authenticated
      const isLoggedIn = await this.isLoggedIn();
      if (!isLoggedIn) {
        throw new Error('Authentication required. Please login first.');
      }

      // Get session data from AsyncStorage
      const sessionData = await this.getSessionData();
      if (!sessionData?.sessionToken) {
        throw new Error('No valid session token found. Please login again.');
      }

      console.log('🚀 ProceedBuySell API Request:', {
        url: `${API_BASE_URL}/WatchListApi/ProceedBuySell`,
        method: 'POST',
        headers: {
          'X-Session-Key': sessionData.sessionToken ? '***TOKEN***' : 'None',
        },
        body: tradeData
      });

      // Make API call to execute trade
      const response = await fetch(`${API_BASE_URL}/WatchListApi/ProceedBuySell`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'X-Session-Key': sessionData.sessionToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tradeData),
      });

      console.log('📡 ProceedBuySell API Response Status:', response.status);

      if (!response.ok) {
        console.error('❌ ProceedBuySell API Error:', response.status, response.statusText);
        
        // If unauthorized, session might be expired
        if (response.status === 401 || response.status === 403) {
          console.log('⚠️ Session might be expired');
          await this.clearSessionData();
          return {
            success: false,
            message: 'Session expired. Please login again.',
            error: 'Session expired'
          };
        }
        
        const errorText = await response.text();
        return {
          success: false,
          message: `Trade execution failed: ${response.status} ${response.statusText}`,
          error: errorText || 'Network error occurred'
        };
      }

      const data = await response.json();
      console.log('✅ ProceedBuySell API Success Response:', data);

      return {
        success: true,
        message: data.message || 'Trade executed successfully',
        data: data.data || data
      };

    } catch (error) {
      console.error('❌ Error executing trade:', error);
      return {
        success: false,
        message: 'Failed to execute trade',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const tradingApiService = TradingApiService.getInstance();
