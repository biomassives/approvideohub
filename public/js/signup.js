// signup.js - Handle signup form validation and submission for ApproVideo Hub
import authService from './auth-service.js';
import formValidator from './form-validator.js';

/**
 * SignupHandler - Manages the signup form logic
 */
class SignupHandler {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) {
      console.error(`Form with ID "${formId}" not found`);
      return;
    }
    
    // Get form elements
    this.emailField = this.form.querySelector('#signup-email');
    this.passwordField = this.form.querySelector('#signup-password');
    this.confirmPasswordField = this.form.querySelector('#signup-confirm-password');
    this.roleField = this.form.querySelector('#signup-role');
    this.termsField = this.form.querySelector('#signup-terms');
    this.submitButton = this.form.querySelector('button[type="submit"]');
    this.statusArea = this.form.querySelector('#signup-status-area');
    
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
        minLength: 8,
        requiredMessage: 'Password is required',
        minLengthMessage: 'Password must be at least 8 characters'
      },
      'confirm-password': {
        required: true,
        matchField: 'password',
        requiredMessage: 'Please confirm your password',
        matchMessage: 'Passwords do not match'
      },
      'role': {
        required: true,
        requiredMessage: 'Please select your role'
      },
      'terms': {
        required: true,
        requiredMessage: 'You must accept the Terms of Service and Privacy Policy'
      }
    };
    
    // Create password strength meter
    this.passwordStrength = formValidator.createPasswordStrengthMeter({
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true
    });
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize the signup form
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
      
      // Add password strength meter
      this.passwordField.addEventListener('input', this.updatePasswordStrength.bind(this));
    }
    
    if (this.confirmPasswordField) {
      this.confirmPasswordField.addEventListener('blur', () => {
        const fields = { 'password': this.passwordField };
        formValidator.validateField(
          this.confirmPasswordField, 
          this.validationRules['confirm-password'],
          fields
        );
      });
    }
    
    if (this.roleField) {
      this.roleField.addEventListener('change', () => {
        formValidator.validateField(
          this.roleField, 
          this.validationRules['role']
        );
      });
    }
    
    if (this.termsField) {
      this.termsField.addEventListener('change', () => {
        formValidator.validateField(
          this.termsField, 
          this.validationRules['terms']
        );
      });
    }
    
    console.log('Signup form handler initialized');
  }
  
  /**
   * Update password strength indicator
   */
  updatePasswordStrength() {
    // Currently just validates the password field
    // Could be extended to show a visual strength meter
    const password = this.passwordField.value;
    
    // Example of basic password strength checks
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    // Validate the field
    const result = formValidator.validateField(
      this.passwordField, 
      this.validationRules['password']
    );
    
    // If you have UI elements for password strength, update them here
    // Example:
    // const strengthMeter = document.getElementById('password-strength-meter');
    // if (strengthMeter) {
    //   // Update the strength meter
    // }
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
    const formData = {
      email: this.emailField.value.trim(),
      password: this.passwordField.value,
      role: this.roleField.value
    };
    
    try {
      // Call auth service to register user
      const result = await authService.register(formData);
      
      if (result.success) {
        // Registration successful
        this.showStatusMessage('success', 'Account created successfully! Redirecting...');
        
        // Redirect to appropriate dashboard based on role
        setTimeout(() => {
          authService.redirectToDashboard(formData.role);
        }, 1500);
      } else {
        // Registration failed
        let errorMessage = 'Registration failed';
        
        // Handle specific error codes
        if (result.status === 409) {
          errorMessage = 'An account with this email already exists';
        } else if (result.data && result.data.message) {
          errorMessage = result.data.message;
        }
        
        this.showStatusMessage('error', errorMessage);
        this.setLoadingState(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
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
        this.submitButton.textContent = 'Create Account';
      }
    }
  }
}

// Initialize signup handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const signupHandler = new SignupHandler('signup-form');
});

// Export the class for potential reuse
export default SignupHandler;
