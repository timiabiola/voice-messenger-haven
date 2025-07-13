/**
 * Phone number utilities for consistent formatting and validation
 */

/**
 * Format a phone number for display (1-XXX-XXX-XXXX)
 */
export const formatPhoneForDisplay = (value: string): string => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format as US phone number (1-XXX-XXX-XXXX)
  if (phoneNumber.length <= 1) return phoneNumber;
  if (phoneNumber.length <= 4) return `1-${phoneNumber.slice(1)}`;
  if (phoneNumber.length <= 7) return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4)}`;
  return `1-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 11)}`;
};

/**
 * Convert formatted phone to E.164 format for Supabase
 */
export const formatPhoneToE164 = (formattedPhone: string): string => {
  const digits = formattedPhone.replace(/\D/g, '');
  
  if (!digits) return '';
  
  // If it already starts with 1 and has 11 digits, it's a US/Canada number
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it's 10 digits, assume US/Canada and prepend +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's already in E.164 format (starts with country code)
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // For other cases, just prepend + if not already there
  return digits.startsWith('+') ? digits : `+${digits}`;
};

/**
 * Validate if a phone number is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const e164Phone = formatPhoneToE164(phone);
  // E.164 format: + followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(e164Phone);
};

/**
 * Get a user-friendly error message for invalid phone numbers
 */
export const getPhoneErrorMessage = (phone: string): string | null => {
  if (!phone) {
    return 'Phone number is required';
  }
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length < 10) {
    return 'Phone number is too short';
  }
  
  if (digits.length > 15) {
    return 'Phone number is too long';
  }
  
  if (!isValidPhoneNumber(phone)) {
    return 'Please enter a valid phone number';
  }
  
  return null;
};

/**
 * Extract country code from E.164 phone number
 */
export const getCountryCode = (e164Phone: string): string => {
  if (!e164Phone.startsWith('+')) return '';
  
  // Common country codes (can be extended)
  const countryCodes = [
    '1',    // US/Canada
    '44',   // UK
    '33',   // France
    '49',   // Germany
    '81',   // Japan
    '86',   // China
    '91',   // India
    '7',    // Russia
    '55',   // Brazil
    '61',   // Australia
  ];
  
  // Check for matching country codes (longest match first)
  for (const code of countryCodes.sort((a, b) => b.length - a.length)) {
    if (e164Phone.startsWith(`+${code}`)) {
      return code;
    }
  }
  
  // Default to first digit after +
  return e164Phone.substring(1, 2);
}; 