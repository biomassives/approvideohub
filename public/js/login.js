// login.js - Handle login form validation and submission for ApproVideo Hub
import authService from './auth-service.js';
import formValidator from './form-validator.js';

/**
 * LoginHandler - Manages the login form logic
 */
class LoginHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) {
      console.error(`Form with ID "${formId}" not found`);
      return;
    }
    
    // Get form elements
    this.emailField = this.form.querySelector('#email');
    this.passwordField = this.form.querySelector('#password');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.statusArea = this.form.querySelector('#status-message');
    
    // Setup form validation rules
    this.validationRules = {
      'email': {
        required: true,
        email: true,
        requiredMessage: 'Email address is required',
        emailMessage: 'Please enter a valid email address'
      },
      'password': {
        required: true,
        requiredMessage: 'Password is required'
      }
    };
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the login form
   */
  initialize() {
    // Attach event listeners
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Add validation on blur for each field
    if (this.emailField) {
      this.emailField.addEventListener('blur', () => {
        formValidator.validateField(
          this.emailField, 
          this.validationRules['email']
        );
      });
    }
    
    if (this.passwordField) {
      this.passwordField.addEventListener('blur', () => {
        formValidator.validateField(
          this.passwordField, 
          this.validationRules['password']
        );
      });
    }
    
    console.log('Login form handler initialized');
  }
  
  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async handleSubmit(event) {
    event.preventDefault();
    
    // Clear previous messages
    this.clearStatusMessage();
    
    // Validate all fields
    const validation = formValidator.validateForm(this.form, this.validationRules);
    
    if (!validation.valid) {
      // Form has errors, stop submission
      this.showStatusMessage('error', 'Please correct the errors in the form');
      return;
    }
    
    // Set loading state
    this.setLoadingState(true);
    
    // Get form data
    const credentials = {
      email: this.emailField.value.trim(),
      password: this.passwordField.value
    };
    
    try {
      // Call auth service to login user
      const result = await authService.login(credentials);
      
      if (result.success) {
        // Login successful
        this.showStatusMessage('success', 'Login successful! Redirecting...');
        
        // Get user data
        const user = authService.getUser();
        
        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          authService.redirectToDashboard(user.role);
        }, 1000);
      } else {
        // Login failed
        let errorMessage = 'Login failed';
        
        // Handle specific error codes
        if (result.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (result.data && result.data.message) {
          errorMessage = result.data.message;
        }
        
        this.showStatusMessage('error', errorMessage);
        this.setLoadingState(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showStatusMessage('error', 'An unexpected error occurred. Please try again.');
      this.setLoadingState(false);
    }
  }
  
  /**
   * Show status message
   * @param {String} type - Message type (success, error, info)
   * @param {String} message - Message text
   */
  showStatusMessage(type, message) {
    if (!this.statusArea) return;
    
    this.statusArea.textContent = message;
    this.statusArea.className = 'status-box';
    
    // Add specific styling based on message type
    switch (type) {
      case 'success':
        this.statusArea.classList.add('text-green-600');
        break;
      case 'error':
        this.statusArea.classList.add('text-red-600');
        break;
      case 'info':
        this.statusArea.classList.add('text-blue-600');
        break;
    }
  }
  
  /**
   * Clear status message
   */
  clearStatusMessage() {
    if (this.statusArea) {
      this.statusArea.textContent = '';
      this.statusArea.className = 'status-box';
    }
  }
  
  /**
   * Set loading state
   * @param {Boolean} isLoading - Whether the form is in loading state
   */
  setLoadingState(isLoading) {
    if (this.submitButton) {
      if (isLoading) {
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Processing...';
        // Disable all form inputs
        Array.from(this.form.elements).forEach(element => {
          element.disabled = true;
        });
        // Re-enable the button so it shows as processing
        this.submitButton.disabled = false;
      } else {
        // Re-enable all form inputs
        Array.from(this.form.elements).forEach(element => {
          element.disabled = false;
        });
        this.submitButton.textContent = 'Log In';
      }
    }
  }
