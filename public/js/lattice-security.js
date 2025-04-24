// lattice-security.js - Implements the Lattice Security System for ApproVideo Hub
// Using vanilla JS as requested

/**
 * LatticeSecuritySystem - Provides security features for authentication and data
 */
class LatticeSecuritySystem {
  constructor() {
    this.config = {
      tokenRefreshTimeBuffer: 5 * 60 * 1000, // 5 minutes in milliseconds
      tokenCheckInterval: 60 * 1000, // 1 minute in milliseconds
      securityLevel: 'high'
    };
    
    // Initialize security features
    this.initSecurity();
  }
  
  /**
   * Initialize security features
   */
  initSecurity() {
    // Check HTTPS status
    this.checkSecureConnection();
    
    // Set up token refresh timer
    this.setupTokenRefresh();
    
    // Add security event listeners
    this.addSecurityListeners();
    
    console.log('Lattice Security System initialized');
  }
  
  /**
   * Check if connection is secure (HTTPS)
   * @returns {Boolean} Whether connection is secure
   */
  checkSecureConnection() {
    const isSecure = window.location.protocol === 'https:';
    
    // Update any security indicators on the page
    const securityStatusElement = document.getElementById('security-status');
    if (securityStatusElement) {
      securityStatusElement.textContent = isSecure ? 'Secure Connection' : 'Insecure Connection';
      securityStatusElement.classList.remove(isSecure ? 'text-red-600' : 'text-green-600');
      securityStatusElement.classList.add(isSecure ? 'text-green-600' : 'text-red-600');
    }
    
    // Log security warning if in development environment
    if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.warn('Warning: Connection is not secure. Data may be compromised.');
    }
    
    return isSecure;
  }
  
  /**
   * Set up automatic token refresh
   */
  setupTokenRefresh() {
    // Check for token expiration periodically
    const checkToken = () => {
      const tokenData = this.getTokenData();
      
      if (tokenData && tokenData.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const expiryTime = tokenData.exp;
        const timeLeft = expiryTime - currentTime;
        
        // If token will expire soon, refresh it
        if (timeLeft < this.config.tokenRefreshTimeBuffer / 1000) {
          this.refreshToken();
        }
      }
    };
    
    // Set up interval to check token
    setInterval(checkToken, this.config.tokenCheckInterval);
    
    // Also check immediately
    checkToken();
  }
  
  /**
   * Add security-related event listeners
   */
  addSecurityListeners() {
    // Listen for visibility changes (tab/window focus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // When user returns to the tab/window, verify session
        this.verifySession();
      }
    });
    
    // Listen for storage events (for multi-tab logout)
    window.addEventListener('storage', (event) => {
      if (event.key === 'avh_auth_token' && !event.newValue) {
        // Token was removed in another tab, reload page
        window.location.reload();
      }
    });
  }
  
  /**
   * Get decoded data from JWT token
   * @returns {Object|null} Decoded token data or null
   */
  getTokenData() {
    const token = localStorage.getItem('avh_auth_token');
    if (!token) return null;
    
    try {
      // Parse the token (JWT has three parts separated by dots)
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }
  
  /**
   * Verify the current session is still valid
   * @returns {Promise<Boolean>} Whether session is valid
   */
  async verifySession() {
    const token = localStorage.getItem('avh_auth_token');
    if (!token) return false;
    
    try {
      const response = await fetch('/api/auth/access-check', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Session is invalid, log out
        this.handleInvalidSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session verification error:', error);
      return false;
    }
  }
  
  /**
   * Handle invalid session (logout)
   */
  handleInvalidSession() {
    // Clear auth data
    localStorage.removeItem('avh_auth_token');
    localStorage.removeItem('avh_refresh_token');
    localStorage.removeItem('avh_user');
    
    // Redirect to login page
    window.location.href = '/login.html?session=expired';
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<Boolean>} Whether token was successfully refreshed
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('avh_refresh_token');
    if (!refreshToken) return false;
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Refresh failed, log out
        this.handleInvalidSession();
        return false;
      }
      
      // Update tokens
      localStorage.setItem('avh_auth_token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('avh_refresh_token', data.refreshToken);
      }
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
  
  /**
   * Encrypt data using a derived key (simplified for demo)
   * @param {String} data - Data to encrypt
   * @param {String} key - Encryption key
   * @returns {String} Encrypted data
   */
  encryptData(data, key) {
    // This is a placeholder for demonstration
    // In a real implementation, use Web Crypto API
    console.warn('Using demo encryption - not for production use');
    
    // Simple XOR for demonstration (NOT SECURE)
    const result = [];
    for (let i = 0; i < data.length; i++) {
      result.push(String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
    }
    
    return btoa(result.join(''));
  }
  
  /**
   * Decrypt data using a derived key (simplified for demo)
   * @param {String} encryptedData - Data to decrypt
   * @param {String} key - Decryption key
   * @returns {String} Decrypted data
   */
  decryptData(encryptedData, key) {
    // This is a placeholder for demonstration
    // In a real implementation, use Web Crypto API
    console.warn('Using demo decryption - not for production use');
    
    // Simple XOR for demonstration (NOT SECURE)
    try {
      const data = atob(encryptedData);
      const result = [];
      
      for (let i = 0; i < data.length; i++) {
        result.push(String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length)));
      }
      
      return result.join('');
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
  
  /**
   * Store sensitive data securely in localStorage
   * @param {String} key - Storage key
   * @param {Any} data - Data to store
   */
  secureStore(key, data) {
    // Get token to use as encryption key (not ideal but better than plaintext)
    const token = localStorage.getItem('avh_auth_token');
    if (!token) {
      console.error('Cannot securely store data: No authentication token');
      return;
    }
    
    // Stringify data if it's an object
    const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Encrypt and store
    const encrypted = this.encryptData(dataString, token);
    localStorage.setItem(`secure_${key}`, encrypted);
  }
  
  /**
   * Retrieve sensitive data from localStorage
   * @param {String} key - Storage key
   * @returns {Any} Retrieved data
   */
  secureRetrieve(key) {
    // Get token to use as decryption key
    const token = localStorage.getItem('avh_auth_token');
    if (!token) {
      console.error('Cannot retrieve secure data: No authentication token');
      return null;
    }
    
    // Get encrypted data
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    
    // Decrypt data
    const decrypted = this.decryptData(encrypted, token);
    if (!decrypted) return null;
    
    // Try to parse as JSON if possible
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      // Not JSON, return as string
      return decrypted;
    }
  }
}

// Create and export singleton instance
const latticeSecuritySystem = new LatticeSecuritySystem();
export default latticeSecuritySystem;
