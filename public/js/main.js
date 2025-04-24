// main.js - Main entry point for ApproVideo Hub authentication pages
import authService from './auth-service.js';
import latticeSecuritySystem from './lattice-security.js';
import pageSecurity from './page-security.js';
import './signup.js';  // Import to initialize signup handler
import './login.js';   // Import to initialize login handler

/**
 * Initialize the application
 */
function initApp() {
  // Check if we're on a page that needs auth components
  const path = window.location.pathname;
  const isAuthPage = path.includes('login.html') || path.includes('signup.html');
  
  if (isAuthPage) {
    setupAuthPages();
  } else {
    // For non-auth pages, just check security
    checkSession();
  }
  
  // Setup language handling
  setupLanguage();
  
  // Add common event listeners
  addCommonListeners();
  
  console.log('ApproVideo Hub initialized');
}

/**
 * Setup authentication pages
 */
function setupAuthPages() {
  // Check if we're redirected with a specific message
  const urlParams = new URLSearchParams(window.location.search);
  const statusMsg = urlParams.get('status');
  const errorMsg = urlParams.get('error');
  const redirectPath = urlParams.get('redirect');
  
  // Store redirect path if provided
  if (redirectPath) {
    sessionStorage.setItem('auth_redirect', redirectPath);
  }
  
  // Display any status messages
  if (statusMsg === 'logout') {
    showStatusMessage('You have been successfully logged out.');
  } else if (statusMsg === 'session_expired') {
    showStatusMessage('Your session has expired. Please log in again.', 'warning');
  } else if (errorMsg) {
    showStatusMessage(decodeURIComponent(errorMsg), 'error');
  }
  
  // Toggle between login/signup if needed
  const showSignup = urlParams.get('signup') === 'true';
  if (showSignup && document.getElementById('signup-section') && document.getElementById('login-section')) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.remove('hidden');
  }
  
  // If already logged in, redirect to dashboard
  if (authService.isAuthenticated()) {
    const user = authService.getUser();
    if (user && user.role) {
      // Redirect to stored path or dashboard
      const redirectTo = sessionStorage.getItem('auth_redirect') || null;
      if (redirectTo) {
        sessionStorage.removeItem('auth_redirect');
        window.location.href = redirectTo;
      } else {
        authService.redirectToDashboard(user.role);
      }
    }
  }
}

/**
 * Check user session
 */
async function checkSession() {
  if (authService.isAuthenticated()) {
    try {
      // Verify session with server
      const sessionCheck = await latticeSecuritySystem.verifySession();
      if (!sessionCheck) {
        // Session invalid, will be redirected by lattice security
        console.warn('Session is invalid');
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }
}

/**
 * Setup language handling
 */
function setupLanguage() {
  const langSwitcher = document.getElementById('lang-switch');
  
  if (langSwitcher) {
    // Set initial value from storage or URL param
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const storedLang = localStorage.getItem('preferredLang');
    
    if (urlLang) {
      langSwitcher.value = urlLang;
      localStorage.setItem('preferredLang', urlLang);
    } else if (storedLang) {
      langSwitcher.value = storedLang;
    }
    
    // Add change listener
    langSwitcher.addEventListener('change', (e) => {
      const selectedLang = e.target.value;
      localStorage.setItem('preferredLang', selectedLang);
      
      // Reload with language parameter
      const url = new URL(window.location.href);
      url.searchParams.set('lang', selectedLang);
      window.location.href = url.toString();
    });
  }
}

/**
 * Add common event listeners
 */
function addCommonListeners() {
  // Add listener for password toggle buttons
  const togglePasswordButtons = document.querySelectorAll('.toggle-password');
  togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const passwordField = document.getElementById(targetId);
      
      if (passwordField) {
        // Toggle password visibility
        const isPassword = passwordField.type === 'password';
        passwordField.type = isPassword ? 'text' : 'password';
        
        // Update icon if it exists
        const eyeOpen = this.querySelector('.eye-open');
        const eyeClosed = this.querySelector('.eye-closed');
        
        if (eyeOpen && eyeClosed) {
          eyeOpen.classList.toggle('hidden');
          eyeClosed.classList.toggle('hidden');
        }
      }
    });
  });
}

/**
 * Show a status message
 * @param {String} message - Message to show
 * @param {String} type - Message type (info, success, warning, error)
 */
function showStatusMessage(message, type = 'info') {
  // Find the status area
  const loginStatus = document.getElementById('status-message');
  const signupStatus = document.getElementById('signup-status-area');
  const statusArea = loginStatus || signupStatus;
  
  if (!statusArea) return;
  
  // Set message
  statusArea.textContent = message;
  
  // Add appropriate class
  statusArea.className = 'status-box';
  
  switch (type) {
    case 'success':
      statusArea.classList.add('text-green-600');
      break;
    case 'warning':
      statusArea.classList.add('text-yellow-600');
      break;
    case 'error':
      statusArea.classList.add('text-red-600');
      break;
    default:
      statusArea.classList.add('text-blue-600');
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  // Find all logout buttons
  const logoutButtons = document.querySelectorAll('[data-action="logout"]');
  
  logoutButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        // Call auth service to logout
        await authService.logout();
        
        // Redirect to login page with status
        window.location.href = '/login.html?status=logout';
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if API call fails
        window.location.href = '/login.html?status=logout';
      }
    });
  });
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Initialize logout handlers
document.addEventListener('DOMContentLoaded', handleLogout);

// Export functions for potential reuse
export { showStatusMessage, checkSession };
