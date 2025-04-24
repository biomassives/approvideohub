// form-validator.js - Form validation utilities for ApproVideo Hub
// Vanilla JS implementation as requested

/**
 * FormValidator class to handle form validation logic
 */
class FormValidator {
  /**
   * Create a validator with validation rules
   * @param {Object} config - Configuration and rules
   */
  constructor(config = {}) {
    // Default messages that can be overridden
    this.messages = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: value => `Must be at least ${value} characters`,
      maxLength: value => `Must not exceed ${value} characters`,
      passwordMatch: 'Passwords do not match',
      terms: 'You must accept the terms and conditions',
      default: 'Invalid value'
    };
    
    // Override default messages with any provided
    if (config.messages) {
      this.messages = { ...this.messages, ...config.messages };
    }
    
    // Store custom validators if provided
    this.customValidators = config.validators || {};
  }

  /**
   * Validate a form field
   * @param {HTMLElement} field - Form field to validate
   * @param {Object} rules - Validation rules to apply
   * @param {Object} compareFields - Other fields to compare with (e.g. for password confirmation)
   * @returns {Object} Validation result with error message if any
   */
  validateField(field, rules = {}, compareFields = {}) {
    const value = field.value.trim();
    const fieldName = field.getAttribute('data-name') || field.name || 'Field';
    
    // Check for empty field if required
    if (rules.required && !value) {
      return {
        valid: false,
        message: rules.requiredMessage || this.messages.required
      };
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { valid: true };
    }
    
    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          valid: false,
          message: rules.emailMessage || this.messages.email
        };
      }
    }
    
    // Minimum length validation
    if (rules.minLength && value.length < rules.minLength) {
      return {
        valid: false,
        message: rules.minLengthMessage || this.messages.minLength(rules.minLength)
      };
    }
    
    // Maximum length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        message: rules.maxLengthMessage || this.messages.maxLength(rules.maxLength)
      };
    }
    
    // Password match validation
    if (rules.matchField && compareFields[rules.matchField]) {
      if (value !== compareFields[rules.matchField].value) {
        return {
          valid: false,
          message: rules.matchMessage || this.messages.passwordMatch
        };
      }
    }
    
    // Terms checkbox validation
    if (field.type === 'checkbox' && rules.required && !field.checked) {
      return {
        valid: false,
        message: rules.requiredMessage || this.messages.terms
      };
    }
    
    // Custom validator if provided
    if (rules.validator && typeof rules.validator === 'function') {
      const customResult = rules.validator(value, field, compareFields);
      if (customResult !== true) {
        return {
          valid: false,
          message: customResult || rules.validatorMessage || this.messages.default
        };
      }
    }
    
    // Named custom validator
    if (rules.customValidator && typeof this.customValidators[rules.customValidator] === 'function') {
      const customResult = this.customValidators[rules.customValidator](value, field, compareFields);
      if (customResult !== true) {
        return {
          valid: false,
          message: customResult || rules.validatorMessage || this.messages.default
        };
      }
    }
    
    // Field is valid if it passed all validation rules
    return { valid: true };
  }

  /**
   * Display validation error message for a field
   * @param {HTMLElement} field - Form field with error
   * @param {String} message - Error message to display
   * @param {HTMLElement} errorElement - Element to show error in (optional)
   */
  showError(field, message, errorElement = null) {
    // Find or create error element
    const errorEl = errorElement || this.findErrorElement(field);
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
      field.classList.add('error');
      field.setAttribute('aria-invalid', 'true');
    }
  }

  /**
   * Clear validation error for a field
   * @param {HTMLElement} field - Form field to clear error for
   * @param {HTMLElement} errorElement - Element to clear error from (optional)
   */
  clearError(field, errorElement = null) {
    // Find error element
    const errorEl = errorElement || this.findErrorElement(field);
    
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
      field.classList.remove('error');
      field.setAttribute('aria-invalid', 'false');
    }
  }

  /**
   * Find error element associated with a field
   * @param {HTMLElement} field - Form field
   * @returns {HTMLElement} Error element
   * @private
   */
  findErrorElement(field) {
    // First, check for data-error attribute
    if (field.dataset.error) {
      return document.getElementById(field.dataset.error);
    }
    
    // Check for error element with field's ID + -error
    const errorId = `${field.id}-error`;
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      return errorEl;
    }
    
    // Look for sibling error element
    const parent = field.parentElement;
    if (parent) {
      const errorElements = parent.querySelectorAll('.error-message');
      if (errorElements.length > 0) {
        return errorElements[0];
      }
    }
    
    return null;
  }

  /**
   * Validate an entire form
   * @param {HTMLFormElement} form - Form to validate
   * @param {Object} ruleSets - Validation rules for form fields
   * @param {Function} callback - Optional callback for each validation result
   * @returns {Object} Validation results including validity and errors
   */
  validateForm(form, ruleSets, callback = null) {
    const fields = form.elements;
    const errors = {};
    const fieldValues = {};
    
    // First, collect all field values for comparison rules (like password confirmation)
    for (const field of fields) {
      if (field.name && !field.disabled) {
        fieldValues[field.name] = field;
      }
    }
    
    // Then validate each field
    let isValid = true;
    
    for (const field of fields) {
      // Skip buttons, fieldsets, etc.
      if (!field.name || field.disabled || ['button', 'submit', 'reset', 'fieldset'].includes(field.type)) {
        continue;
      }
      
      const rules = ruleSets[field.name] || {};
      const result = this.validateField(field, rules, fieldValues);
      
      if (!result.valid) {
        isValid = false;
        errors[field.name] = result.message;
        
        // Show error message
        this.showError(field, result.message);
      } else {
        // Clear any existing error
        this.clearError(field);
      }
      
      // Call callback with result if provided
      if (callback && typeof callback === 'function') {
        callback(field.name, result);
      }
    }
    
    return {
      valid: isValid,
      errors
    };
  }

  /**
   * Clear all errors in a form
   * @param {HTMLFormElement} form - Form to clear errors in
   */
  clearAllErrors(form) {
    const fields = form.elements;
    
    for (const field of fields) {
      if (field.name && !field.disabled && field.type !== 'submit') {
        this.clearError(field);
      }
    }
  }

  /**
   * Create password strength meter
   * @param {Object} options - Configuration options
   * @returns {Object} Password strength functions
   */
  createPasswordStrengthMeter(options = {}) {
    const defaults = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: false
    };
    
    const config = { ...defaults, ...options };
    
    return {
      /**
       * Check password strength
       * @param {String} password - Password to check
       * @returns {Object} Strength assessment
       */
      checkStrength: (password) => {
        const strength = {
          score: 0,
          max: 5,
          percentage: 0,
          level: 'weak',
          color: 'red',
          feedback: [],
          checks: {
            length: password.length >= config.minLength,
            uppercase: !config.requireUppercase || /[A-Z]/.test(password),
            lowercase: !config.requireLowercase || /[a-z]/.test(password),
            numbers: !config.requireNumbers || /[0-9]/.test(password),
            special: !config.requireSpecial || /[^A-Za-z0-9]/.test(password)
          }
        };
        
        // Add points for length
        if (password.length >= config.minLength) {
          strength.score += 1;
        }
        
        // Add points for complexity
        if (/[A-Z]/.test(password)) strength.score += 1;
        if (/[a-z]/.test(password)) strength.score += 1;
        if (/[0-9]/.test(password)) strength.score += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength.score += 1;
        
        // Calculate percentage
        strength.percentage = Math.round((strength.score / strength.max) * 100);
        
        // Determine level
        if (strength.score <= 1) {
          strength.level = 'weak';
          strength.color = 'red';
        } else if (strength.score <= 2) {
          strength.level = 'fair';
          strength.color = 'orange';
        } else if (strength.score <= 3) {
          strength.level = 'good';
          strength.color = 'blue';
        } else {
          strength.level = 'strong';
          strength.color = 'green';
        }
        
        // Generate feedback
        if (!strength.checks.length) {
          strength.feedback.push(`Password should be at least ${config.minLength} characters long`);
        }
        if (config.requireUppercase && !strength.checks.uppercase) {
          strength.feedback.push('Include at least one uppercase letter');
        }
        if (config.requireLowercase && !strength.checks.lowercase) {
          strength.feedback.push('Include at least one lowercase letter');
        }
        if (config.requireNumbers && !strength.checks.numbers) {
          strength.feedback.push('Include at least one number');
        }
        if (config.requireSpecial && !strength.checks.special) {
          strength.feedback.push('Include at least one special character');
        }
        
        return strength;
      },
      
      /**
       * Update UI with password strength
       * @param {String} password - Password to check
       * @param {Object} elements - UI elements to update
       */
      updateUI: (password, elements) => {
        const strength = this.createPasswordStrengthMeter(config).checkStrength(password);
        
        if (elements.meter) {
          elements.meter.style.width = `${strength.percentage}%`;
          elements.meter.className = `password-strength-meter-bar password-strength-${strength.level}`;
        }
        
        if (elements.label) {
          elements.label.textContent = strength.level.charAt(0).toUpperCase() + strength.level.slice(1);
          elements.label.className = `password-strength-label password-strength-${strength.level}`;
        }
        
        if (elements.feedback) {
          if (strength.feedback.length > 0) {
            elements.feedback.innerHTML = strength.feedback.map(item => `<li>${item}</li>`).join('');
            elements.feedback.classList.remove('hidden');
          } else {
            elements.feedback.classList.add('hidden');
          }
        }
        
        // Update check indicators if they exist
        if (elements.checks) {
          for (const [key, value] of Object.entries(strength.checks)) {
            if (elements.checks[key]) {
              if (value) {
                elements.checks[key].classList.add('text-green-600');
                elements.checks[key].classList.remove('text-red-600');
              } else {
                elements.checks[key].classList.add('text-red-600');
                elements.checks[key].classList.remove('text-green-600');
              }
            }
          }
        }
        
        return strength;
      }
    };
  }
}

// Create and export a singleton instance
const formValidator = new FormValidator();
export default formValidator;
