import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id: string;
  name: string;
  email: string;
  username: string;
  token?: string;
}

interface SessionData {
  user: UserData;
  token: string;
  loginTime: number;
  expiresAt?: number;
}

class SessionManager {
  private static instance: SessionManager;
  private currentUser: UserData | null = null;
  private sessionToken: string | null = null;

  private readonly STORAGE_KEYS = {
    SESSION: '@trading_app_session',
    USER: '@trading_app_user',
    TOKEN: '@trading_app_token',
  };

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Save user session after successful login
   */
  async saveSession(user: UserData, token: string): Promise<void> {
    try {
      const sessionData: SessionData = {
        user,
        token,
        loginTime: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours from now
      };

      await AsyncStorage.multiSet([
        [this.STORAGE_KEYS.SESSION, JSON.stringify(sessionData)],
        [this.STORAGE_KEYS.USER, JSON.stringify(user)],
        [this.STORAGE_KEYS.TOKEN, token],
      ]);

      this.currentUser = user;
      this.sessionToken = token;

      console.log('✅ Session saved for user:', user.username);
    } catch (error) {
      console.error('❌ Failed to save session:', error);
      throw new Error('Failed to save user session');
    }
  }

  /**
   * Load existing session on app startup
   */
  async loadSession(): Promise<UserData | null> {
    try {
      const sessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      
      if (!sessionData) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionData);

      // Check if session is expired
      if (session.expiresAt && Date.now() > session.expiresAt) {
        console.log('⚠️ Session expired, clearing...');
        await this.clearSession();
        return null;
      }

      this.currentUser = session.user;
      this.sessionToken = session.token;

      console.log('✅ Session loaded for user:', session.user.username);
      return session.user;
    } catch (error) {
      console.error('❌ Failed to load session:', error);
      return null;
    }
  }

  /**
   * Clear user session (logout)
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.SESSION,
        this.STORAGE_KEYS.USER,
        this.STORAGE_KEYS.TOKEN,
      ]);

      this.currentUser = null;
      this.sessionToken = null;

      console.log('✅ Session cleared');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
      throw new Error('Failed to clear session');
    }
  }

  /**
   * Get current user data
   */
  getCurrentUser(): UserData | null {
    return this.currentUser;
  }

  /**
   * Get current session token
   */
  getToken(): string | null {
    return this.sessionToken;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUser !== null && this.sessionToken !== null;
  }

  /**
   * Check if current session is valid (logged in and not expired)
   */
  async isSessionValid(): Promise<boolean> {
    try {
      // First check if user is logged in
      if (!this.isLoggedIn()) {
        return false;
      }

      // Then check if session is not expired
      const sessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      
      if (!sessionData) {
        return false;
      }

      const session: SessionData = JSON.parse(sessionData);
      
      // If no expiration set, consider valid
      if (!session.expiresAt) {
        return true;
      }

      // Check if session has expired
      return session.expiresAt > Date.now();
    } catch (error) {
      console.error('❌ Failed to validate session:', error);
      return false;
    }
  }

  /**
   * Update user data (for profile updates)
   */
  async updateUser(userData: Partial<UserData>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No active user session');
    }

    try {
      const updatedUser = { ...this.currentUser, ...userData };
      
      await AsyncStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      this.currentUser = updatedUser;

      console.log('✅ User data updated');
    } catch (error) {
      console.error('❌ Failed to update user:', error);
      throw new Error('Failed to update user data');
    }
  }

  /**
   * Check if session needs refresh (close to expiration)
   */
  async shouldRefreshSession(): Promise<boolean> {
    try {
      const sessionData = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      
      if (!sessionData) {
        return false;
      }

      const session: SessionData = JSON.parse(sessionData);
      
      if (!session.expiresAt) {
        return false;
      }

      // Refresh if less than 2 hours remaining
      const twoHours = 2 * 60 * 60 * 1000;
      return (session.expiresAt - Date.now()) < twoHours;
    } catch (error) {
      console.error('❌ Failed to check session refresh:', error);
      return false;
    }
  }
}

export const sessionManager = SessionManager.getInstance();
