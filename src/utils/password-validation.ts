/**
 * Password validation utility
 * Enforces strong password requirements for security
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  // Check maximum length
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Check for uppercase letter
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (PASSWORD_REQUIREMENTS.requireSpecialChars) {
    const hasSpecialChar = PASSWORD_REQUIREMENTS.specialChars
      .split('')
      .some(char => password.includes(char));
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let strength = 0;
  
  // Length check
  if (password.length >= 12) strength += 2;
  else if (password.length >= 8) strength += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  
  // Common patterns (negative points)
  if (/(.)\1{2,}/.test(password)) strength -= 1; // Repeated characters
  if (/^[0-9]+$/.test(password)) strength -= 1; // Only numbers
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

export function getPasswordRequirementsText(): string {
  return `Password must be ${PASSWORD_REQUIREMENTS.minLength}-${PASSWORD_REQUIREMENTS.maxLength} characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`;
}