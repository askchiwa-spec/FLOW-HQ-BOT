/**
 * WhatsApp number validation utilities
 */

// Valid WhatsApp number formats:
// - +255712345678 (Tanzania)
// - +254712345678 (Kenya)
// - +256712345678 (Uganda)
// - +2348123456789 (Nigeria)
// etc.

const AFRICAN_COUNTRY_CODES = [
  { code: '+255', country: 'Tanzania', length: 13, pattern: /^\+255[67][0-9]{8}$/ },
  { code: '+254', country: 'Kenya', length: 13, pattern: /^\+254[17][0-9]{8}$/ },
  { code: '+256', country: 'Uganda', length: 13, pattern: /^\+256[7][0-9]{8}$/ },
  { code: '+234', country: 'Nigeria', length: 14, pattern: /^\+234[789][0-9]{9}$/ },
  { code: '+27', country: 'South Africa', length: 12, pattern: /^\+27[6-8][0-9]{8}$/ },
  { code: '+233', country: 'Ghana', length: 13, pattern: /^\+233[2-9][0-9]{8}$/ },
  { code: '+251', country: 'Ethiopia', length: 13, pattern: /^\+251[9][0-9]{8}$/ },
  { code: '+20', country: 'Egypt', length: 13, pattern: /^\+20[1][0-9]{9}$/ },
  { code: '+212', country: 'Morocco', length: 13, pattern: /^\+212[6-7][0-9]{8}$/ },
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  country?: string;
  formatted?: string;
}

/**
 * Validate a WhatsApp number
 */
export function validateWhatsAppNumber(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s\-]/g, '');

  // Check if it starts with +
  if (!cleaned.startsWith('+')) {
    return { isValid: false, error: 'Phone number must start with + (e.g., +255712345678)' };
  }

  // Check for African country code
  const countryConfig = AFRICAN_COUNTRY_CODES.find(c => cleaned.startsWith(c.code));
  
  if (!countryConfig) {
    return { 
      isValid: false, 
      error: `Unsupported country code. Supported: ${AFRICAN_COUNTRY_CODES.map(c => c.country).join(', ')}` 
    };
  }

  // Validate against country pattern
  if (!countryConfig.pattern.test(cleaned)) {
    return { 
      isValid: false, 
      error: `Invalid ${countryConfig.country} phone number format` 
    };
  }

  return {
    isValid: true,
    country: countryConfig.country,
    formatted: cleaned,
  };
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-]/g, '');
  
  // Tanzania format: +255 712 345 678
  if (cleaned.startsWith('+255') && cleaned.length === 13) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  }
  
  // Kenya format: +254 712 345 678
  if (cleaned.startsWith('+254') && cleaned.length === 13) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  }
  
  // Default: return as-is
  return phone;
}

/**
 * Get all supported African countries
 */
export function getSupportedCountries() {
  return AFRICAN_COUNTRY_CODES.map(c => ({
    code: c.code,
    country: c.country,
    example: c.code + '712345678'.slice(0, c.length - c.code.length),
  }));
}
