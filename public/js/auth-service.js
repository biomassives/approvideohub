// auth-service.js - Handles authentication logic for ApproVideo Hub
// Uses vanilla JS as requested, no dependencies

/**
 * AuthService class for handling all authentication-related operations
 */
class AuthService {
  constructor() {
    this.apiBaseUrl = '/api/auth';
    this.tokenKey = 'avh_auth_token';
    this.refreshTokenKey = 'avh_refresh_token';
    this.userKey = 'avh_user';
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise object with registration result
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store auth data on successful registration if provided
        if (data.token && data.user) {
          this.saveSession(data);
        }
      }
      
      return {
        success: response.ok && data.success,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network or server error occurred',
        details: error.message
      };
    }
  }

  /**
   * Log in an existing user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} Promise object with login result
   */
  async login(credentials) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.saveSession(data);
      }
      
      return {
        success: response.ok && data.success,
        data,
        status: response.status
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network or server error occurred',
        details: error.message
      };
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {Boolean} Authentication status
   */
  isAuthenticated() {
    return Boolean(this.getToken());
  }

  /**
   * Get current authentication token
   * @returns {String|null} Current token or null
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get current authenticated user data
   * @returns {Object|null} User data object or null
   */
  getUser() {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Save authentication session data
   * @param {Object} sessionData - Session data including token and user info
   * @private
   */
  saveSession(sessionData) {
    if (sessionData.token) {
      localStorage.setItem(this.tokenKey, sessionData.token);
    }
    
    if (sessionData.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, sessionData.refreshToken);
    }
    
    if (sessionData.user) {
      localStorage.setItem(this.userKey, JSON.stringify(sessionData.user));
    }
  }

  /**
   * Log out the current user
   * @returns {Promise} Promise object with logout result
   */
  async logout() {
    // Call the logout API if we have a token
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${this.apiBaseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // We still clear local storage regardless of API success
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with local logout even if API call fails
      }
    }
    
    // Clear local storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    
    return { success: true };
  }

  /**
   * Check if session is valid
   * @returns {Promise} Promise with validation result
   */
  async validateSession() {
    const token = this.getToken();
    if (!token) {
      return { valid: false };
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/access-check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      return { 
        valid: response.ok && data.success,
        user: data.user
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Redirect user to appropriate dashboard based on role
   * @param {String} role - User role
   */
  redirectToDashboard(role) {
    // Define role mapping for redirecting to appropriate dashboard
    const redirectMap = {
      'admin': '/admin-dashboard.html',
      'expert': '/expert-dashboard.html',
      'learner': '/dashboard.html',
      'organizer': '/dashboard.html',
      'resources': '/dashboard.html',
      'researcher': '/dashboard.html'
    };
    
    // Get the appropriate URL for the role, defaulting to dashboard
    const redirectUrl = redirectMap[role] || '/dashboard.html';
    window.location.href = redirectUrl;
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
