// page-security.js - Implements page protection for authenticated routes
import authService from './auth-service.js';
import latticeSecuritySystem from './lattice-security.js';

/**
 * PageSecurity - Handles page access control and route protection
 */
class PageSecurity {
  constructor() {
    this.publicRoutes = [
      '/index.html',
      '/login.html',
      '/signup.html',
      '/forgot-password.html',
      '/reset-password.html',
      '/terms.html',
      '/privacy.html'
    ];
    
    // Pages that require special roles
    this.roleRoutes = {
      '/admin-dashboard.html': ['admin'],
      '/expert-dashboard.html': ['expert', 'admin'],
      '/data-analytics.html': ['admin', 'researcher'],
      '/manage-users.html': ['admin']
    };
    
    this.initialize();
  }
  
  /**
   * Initialize page security
   */
  initialize() {
    // Run security check on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.checkPageAccess();
    });
    
    console.log('Page security initialized');
  }
  
  /**
   * Check if current page should be accessible
   */
  async checkPageAccess() {
    const currentPath = window.location.pathname;
    
    // Always allow access to public routes
    if (this.isPublicRoute(currentPath)) {
      return true;
    }
    
    // For non-public routes, check authentication
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      this.redirectToLogin(currentPath);
      return false;
    }
    
    // Verify the session is still valid
    const isSessionValid = await latticeSecuritySystem.verifySession();
    
    if (!isSessionValid) {
      // Session invalidated, redirect to login
      this.redirectToLogin(currentPath);
      return false;
    }
    
    // Check if page requires specific roles
    if (this.requiresRole(currentPath)) {
      const user = authService.getUser();
      
      if (!user || !this.hasRequiredRole(currentPath, user.role)) {
        // User doesn't have required role
        this.redirectUnauthorized();
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if route is public (no auth required)
   * @param {String} path - Current path
   * @returns {Boolean} Whether route is public
   */
  isPublicRoute(path) {
    return this.publicRoutes.some(route => {
      // Exact match
      if (route === path) {
        return true;
      }
      
      // Check if route ends with one of the public routes
      // This handles both '/login.html' and '/en/login.html'
      if (path.endsWith(route)) {
        return true;
      }
      
      return false;
    });
  }
  
  /**
   * Check if page requires a specific role
   * @param {String} path - Current path
   * @returns {Boolean} Whether page requires a role
   */
  requiresRole(path) {
    return Object.keys(this.roleRoutes).some(route => path.endsWith(route));
  }
  
  /**
   * Check if user has required role for page
   * @param {String} path - Current path
   * @param {String} userRole - User's role
   * @returns {Boolean} Whether user has required role
   */
  hasRequiredRole(path, userRole) {
    // Find the matching route
    const route = Object.keys(this.roleRoutes).find(r => path.endsWith(r));
    
    if (!route) {
      return true; // No role requirements
    }
    
    const requiredRoles = this.roleRoutes[route];
    return requiredRoles.includes(userRole);
  }
  
  /**
   * Redirect to login page
   * @param {String} returnPath - Path to return to after login
   */
  redirectToLogin(returnPath) {
    const encodedReturnPath = encodeURIComponent(returnPath);
    window.location.href = `/login.html?redirect=${encodedReturnPath}`;
  }
  
  /**
   * Redirect unauthorized user to appropriate page
   */
  redirectUnauthorized() {
    const user = authService.getUser();
    
    if (!user) {
      // No user data, go to login
      window.location.href = '/login.html';
      return;
    }
    
    // Redirect to user's default dashboard based on role
    authService.redirectToDashboard(user.role);
  }
  
  /**
   * Add a public route dynamically
   * @param {String} route - Route to add as public
   */
  addPublicRoute(route) {
    if (!this.publicRoutes.includes(route)) {
      this.publicRoutes.push(route);
    }
  }
  
  /**
   * Add a role-protected route dynamically
   * @param {String} route - Route to protect
   * @param {Array|String} roles - Role(s) that can access this route
   */
  addRoleRoute(route, roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    this.roleRoutes[route] = roleArray;
  }
}

// Create and export singleton instance
const pageSecurity = new PageSecurity();
export default pageSecurity;
