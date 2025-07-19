/**
 * Error handling and sanitization utility
 * Maps technical errors to user-friendly messages and prevents information disclosure
 */

import { logger } from './logger';

// Error codes that might expose system information
const SENSITIVE_ERROR_PATTERNS = [
  /PGRST\d+/, // PostgreSQL REST API codes
  /row-level security/i,
  /violates foreign key constraint/i,
  /duplicate key value/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /permission denied for/i,
  /authentication.*failed/i,
  /invalid.*token/i,
  /JWT/i,
  /supabase/i,
  /postgres/i,
  /database/i,
];

// Map of known error patterns to user-friendly messages
const ERROR_MAPPINGS: Record<string, string> = {
  // Authentication errors
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please check your email and confirm your account before signing in.',
  'User not found': 'No account found with these credentials.',
  'Invalid token': 'Your session has expired. Please sign in again.',
  'No authorization': 'Please sign in to continue.',
  
  // Validation errors
  'Password should be at least': 'Password does not meet security requirements.',
  'Invalid email': 'Please enter a valid email address.',
  'Invalid phone': 'Please enter a valid phone number.',
  
  // Permission errors
  'new row violates row-level security': 'You do not have permission to perform this action.',
  'permission denied': 'Access denied. You do not have the required permissions.',
  
  // Network errors
  'Failed to fetch': 'Connection error. Please check your internet connection.',
  'Network request failed': 'Unable to connect to the server. Please try again.',
  
  // Storage errors
  'The resource already exists': 'This file already exists. Please choose a different name.',
  'Payload too large': 'File size exceeds the maximum allowed limit.',
  'Invalid file type': 'This file type is not supported.',
  
  // Generic errors
  'Internal server error': 'Something went wrong. Please try again later.',
  'Service unavailable': 'Service is temporarily unavailable. Please try again later.',
  'infinite recursion detected': 'Database configuration error. Please contact support.',
};

export interface SanitizedError {
  message: string;
  code?: string;
  isRetryable: boolean;
  originalError?: Error;
}

/**
 * Sanitizes error messages to prevent information disclosure
 */
export function sanitizeError(error: any): SanitizedError {
  // Log the original error for debugging (only in development)
  logger.error('Original error:', error);
  
  // Extract error message
  const errorMessage = error?.message || error?.error_description || error?.error || 'An unexpected error occurred';
  
  // Check if error contains sensitive information
  const containsSensitiveInfo = SENSITIVE_ERROR_PATTERNS.some(pattern => 
    pattern.test(errorMessage)
  );
  
  if (containsSensitiveInfo) {
    // DEBUG: Temporarily show actual error for debugging
    return {
      message: `DEBUG (sensitive): ${errorMessage}`,
      code: 'GENERIC_ERROR',
      isRetryable: true,
      originalError: error,
    };
  }
  
  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(ERROR_MAPPINGS)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return {
        message: friendlyMessage,
        code: error?.code || 'KNOWN_ERROR',
        isRetryable: isRetryableError(error),
        originalError: error,
      };
    }
  }
  
  // For unknown errors, provide a generic message
  // DEBUG: Temporarily show actual error for debugging
  return {
    message: `DEBUG: ${errorMessage}`,
    code: error?.code || 'UNKNOWN_ERROR',
    isRetryable: isRetryableError(error),
    originalError: error,
  };
}

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any): boolean {
  const errorMessage = error?.message || '';
  const statusCode = error?.status || error?.statusCode;
  
  // Network errors are usually retryable
  if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return true;
  }
  
  // 5xx errors are usually temporary
  if (statusCode >= 500 && statusCode < 600) {
    return true;
  }
  
  // Rate limiting errors are retryable after a delay
  if (statusCode === 429) {
    return true;
  }
  
  // Authentication errors are not retryable
  if (statusCode === 401 || statusCode === 403) {
    return false;
  }
  
  return false;
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the default browser error handling
    event.preventDefault();
    
    // You could show a toast notification here
    // Example: toast.error(sanitizeError(event.reason).message);
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    logger.error('Global error:', event.error);
    
    // Let React Error Boundary handle React errors
    if (event.error?.stack?.includes('React')) {
      return;
    }
    
    // Prevent the default browser error handling for non-React errors
    event.preventDefault();
  });
}

/**
 * Formats error for display in development mode
 */
export function formatErrorForDevelopment(error: any): string {
  if (!import.meta.env.DEV) {
    return '';
  }
  
  const details = {
    message: error?.message,
    code: error?.code,
    status: error?.status || error?.statusCode,
    stack: error?.stack,
  };
  
  return JSON.stringify(details, null, 2);
}