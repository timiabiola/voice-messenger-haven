// Validate phone number format (basic validation)
export function isValidPhoneNumber(phone: string | null): boolean {
  if (!phone) return false
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // Check if it's a valid length (10-15 digits)
  return cleaned.length >= 10 && cleaned.length <= 15
}

// Format phone number for SMS
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Add country code if not present (assuming US/Canada)
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  
  // Return as is if already has country code
  return phone.startsWith('+') ? phone : `+${cleaned}`
}

// Generate short link for SMS (you would implement actual URL shortening here)
export function generateShortLink(messageId: string, baseUrl: string): string {
  // In production, you'd use a URL shortening service
  // For now, we'll just return the full URL
  return `${baseUrl}/inbox?m=${messageId}`
}

// Mask sensitive data for logging
export function maskSensitiveData(data: string | null): string {
  if (!data) return 'null'
  if (data.includes('@')) {
    // Email masking
    const [local, domain] = data.split('@')
    return `${local.substring(0, 2)}***@${domain}`
  } else {
    // Phone masking
    return `${data.substring(0, 3)}***${data.substring(data.length - 2)}`
  }
} 