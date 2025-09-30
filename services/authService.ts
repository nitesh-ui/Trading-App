/**
 * Authentication Service
 * Handles login, logout, and session management for the trading API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthSession {
  isAuthenticated: boolean;
  cookies: string;
  userCred: string;
  sessionId: string;
  antiforgeryCookie: string;
  tempDataCookie: string;
  loginTime: number;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  redirectUrl?: string;
  session?: AuthSession;
}

class AuthService {
  private readonly baseUrl = 'https://mob_demo.sanaitatechnologies.com';
  private session: AuthSession | null = null;
  private readonly SESSION_STORAGE_KEY = 'trading_app_session';

  constructor() {
    // Try to restore session from storage
    this.initializeSession();
  }

  /**
   * Initialize auth service and restore session
   */
  private async initializeSession(): Promise<void> {
    await this.restoreSession();
  }

  /**
   * Initialize the auth service (call this on app startup)
   */
  async initialize(): Promise<void> {
    await this.restoreSession();
  }

  /**
   * Perform login with credentials
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // First, get the login page to obtain initial cookies and antiforgery token
      const loginPageResponse = await fetch(`${this.baseUrl}/Account/Login`, {
        method: 'GET',
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'none',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
        }
      });

      if (!loginPageResponse.ok) {
        throw new Error(`Failed to load login page: ${loginPageResponse.status}`);
      }

      // Extract cookies from the login page response
      const setCookieHeaders = loginPageResponse.headers.getSetCookie?.() || 
                              loginPageResponse.headers.get('set-cookie')?.split(',') || [];
      
      let sessionCookie = '';
      let antiforgeryCookie = '';
      let tempDataCookie = '';

      setCookieHeaders.forEach(cookie => {
        if (cookie.includes('.AspNetCore.Session=')) {
          sessionCookie = cookie.split(';')[0];
        } else if (cookie.includes('.AspNetCore.Antiforgery.')) {
          antiforgeryCookie = cookie.split(';')[0];
        } else if (cookie.includes('.AspNetCore.Mvc.CookieTempDataProvider=')) {
          tempDataCookie = cookie.split(';')[0];
        }
      });

      // Get the HTML content to extract the antiforgery token
      const loginPageHtml = await loginPageResponse.text();
      const antiforgeryTokenMatch = loginPageHtml.match(/name="__RequestVerificationToken".*?value="([^"]*?)"/);
      const antiforgeryToken = antiforgeryTokenMatch ? antiforgeryTokenMatch[1] : '';

      // Prepare login data
      const formData = new FormData();
      formData.append('EmailOrUsername', credentials.emailOrUsername);
      formData.append('Password', credentials.password);
      formData.append('RememberMe', credentials.rememberMe ? 'true' : 'false');
      if (antiforgeryToken) {
        formData.append('__RequestVerificationToken', antiforgeryToken);
      }

      // Perform the actual login
      const loginResponse = await fetch(`${this.baseUrl}/Account/Login`, {
        method: 'POST',
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
          'cookie': [sessionCookie, antiforgeryCookie, tempDataCookie].filter(Boolean).join('; '),
          'origin': this.baseUrl,
          'referer': `${this.baseUrl}/Account/Login`,
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
        },
        body: formData
      });

      // Check if login was successful (usually redirects on success)
      const loginResponseText = await loginResponse.text();
      const isRedirect = loginResponse.status === 302 || loginResponse.url.includes('/Trade/Index') || loginResponse.redirected;
      
      if (isRedirect || loginResponseText.includes('/Trade/Index')) {
        // Login successful, extract all cookies
        const allCookies = loginResponse.headers.getSetCookie?.() || 
                          loginResponse.headers.get('set-cookie')?.split(',') || [];
        
        // Update cookies from login response
        allCookies.forEach(cookie => {
          if (cookie.includes('.AspNetCore.Session=')) {
            sessionCookie = cookie.split(';')[0];
          } else if (cookie.includes('.AspNetCore.Antiforgery.')) {
            antiforgeryCookie = cookie.split(';')[0];
          } else if (cookie.includes('.AspNetCore.Mvc.CookieTempDataProvider=')) {
            tempDataCookie = cookie.split(';')[0];
          }
        });

        // Create UserCred cookie
        const userCred = JSON.stringify({
          EmailOrUsername: credentials.emailOrUsername,
          Password: credentials.password,
          RememberMe: credentials.rememberMe || false,
          isDirectLogin: 1,
          Username: null,
          ServerCode: 0,
          User_Location: null
        });

        const userCredCookie = `UserCred=${encodeURIComponent(userCred)}`;

        // Combine all cookies
        const allCookiesString = [
          sessionCookie,
          antiforgeryCookie,
          userCredCookie,
          tempDataCookie
        ].filter(Boolean).join('; ');

        // Create session object
        this.session = {
          isAuthenticated: true,
          cookies: allCookiesString,
          userCred: userCredCookie,
          sessionId: sessionCookie,
          antiforgeryCookie,
          tempDataCookie,
          loginTime: Date.now()
        };

        // Save session to storage
        await this.saveSession();

        return {
          success: true,
          message: 'Login successful',
          session: this.session
        };
      } else {
        // Login failed
        return {
          success: false,
          message: 'Invalid credentials or login failed'
        };
      }

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.session?.cookies) {
        // Call logout endpoint
        await fetch(`${this.baseUrl}/Account/Logout`, {
          method: 'POST',
          headers: {
            'cookie': this.session.cookies,
            'referer': `${this.baseUrl}/Trade/Index`
          }
        });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear session regardless of logout request result
      this.session = null;
      await this.clearSession();
    }
  }

  /**
   * Get current session
   */
  getSession(): AuthSession | null {
    // Check if session is expired (24 hours)
    if (this.session && Date.now() - this.session.loginTime > 24 * 60 * 60 * 1000) {
      this.logout();
      return null;
    }
    return this.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const session = this.getSession();
    return session?.isAuthenticated || false;
  }

  /**
   * Get cookies for API requests
   */
  getCookies(): string {
    const session = this.getSession();
    return session?.cookies || '';
  }

  /**
   * Auto-login with stored credentials (for demo purposes)
   * In production, you should use proper token refresh mechanisms
   */
  async autoLogin(): Promise<boolean> {
    try {
      // For demo purposes, use the provided credentials
      const result = await this.login({
        emailOrUsername: 'shashir8540@gmail.com',
        password: '123456',
        rememberMe: true
      });
      return result.success;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return false;
    }
  }

  /**
   * Save session to AsyncStorage
   */
  private async saveSession(): Promise<void> {
    if (this.session) {
      try {
        await AsyncStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(this.session));
      } catch (error) {
        console.warn('Failed to save session to storage:', error);
      }
    }
  }

  /**
   * Restore session from AsyncStorage
   */
  private async restoreSession(): Promise<void> {
    try {
      const savedSession = await AsyncStorage.getItem(this.SESSION_STORAGE_KEY);
      if (savedSession) {
        const session: AuthSession = JSON.parse(savedSession);
        // Check if session is not too old (24 hours)
        if (Date.now() - session.loginTime < 24 * 60 * 60 * 1000) {
          this.session = session;
        } else {
          await this.clearSession();
        }
      }
    } catch (error) {
      console.warn('Failed to restore session from storage:', error);
      await this.clearSession();
    }
  }

  /**
   * Clear session from AsyncStorage
   */
  private async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session from storage:', error);
    }
  }
}

export const authService = new AuthService();
