// API service for authentication and trading
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
    token?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      username: string;
    };
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

      // Successful login
      return {
        success: true,
        message: data.message || 'Login successful',
        data: {
          token: data.token || data.accessToken || data.authToken,
          user: {
            id: data.userId || data.id || credentials.emailOrUsername,
            name: data.name || data.userName || credentials.emailOrUsername,
            email: data.email || (credentials.emailOrUsername.includes('@') ? credentials.emailOrUsername : ''),
            username: data.username || credentials.emailOrUsername,
          },
        },
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
    // Implement if logout API endpoint exists
    return {
      success: true,
      message: 'Logged out successfully',
    };
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
}

export const tradingApiService = TradingApiService.getInstance();
