/**
 * Email validation utilities
 * Provides comprehensive email format validation
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format using comprehensive regex and additional checks
 */
export function validateEmail(email: string): ValidationResult {
  // Remove whitespace
  const trimmedEmail = email.trim();

  // Basic checks
  if (!trimmedEmail) {
    return { isValid: false, error: 'E-poçt ünvanı tələb olunur' };
  }

  // Check minimum length
  if (trimmedEmail.length < 5) {
    return { isValid: false, error: 'E-poçt ünvanı çox qısadır' };
  }

  // Check maximum length (RFC 5321 limit)
  if (trimmedEmail.length > 254) {
    return { isValid: false, error: 'E-poçt ünvanı çox uzundur' };
  }

  // Comprehensive email regex pattern
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check for multiple @ symbols
  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Split local and domain parts
  const [localPart, domainPart] = trimmedEmail.split('@');

  // Validate local part (before @)
  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  if (localPart.length > 64) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check for consecutive dots in local part
  if (localPart.includes('..')) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check if local part starts or ends with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Validate domain part (after @)
  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  if (domainPart.length > 253) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check for valid domain format
  const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domainPart)) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check if domain has at least one dot
  if (!domainPart.includes('.')) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check if domain ends with valid TLD (at least 2 characters)
  const tld = domainPart.split('.').pop();
  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check for invalid characters in domain
  if (domainPart.includes('..') || domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return { isValid: false, error: 'E-poçt formatı yanlışdır' };
  }

  // Check for common invalid patterns
  const invalidPatterns = [
    /^[^@]+@[^@]+@/, // Multiple @ symbols
    /^@/, // Starts with @
    /@$/, // Ends with @
    /\s/, // Contains whitespace
    /\.{2,}/, // Multiple consecutive dots
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmedEmail)) {
      return { isValid: false, error: 'E-poçt formatı yanlışdır' };
    }
  }

  return { isValid: true };
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Şifrə tələb olunur' };
  }

  if (password.length < 6) {
    return { isValid: false, error: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Şifrə çox uzundur' };
  }

  return { isValid: true };
}

/**
 * Validates name field
 */
export function validateName(name: string): ValidationResult {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return { isValid: false, error: 'Ad Soyad tələb olunur' };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Ad Soyad ən azı 2 simvoldan ibarət olmalıdır' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: 'Ad Soyad çox uzundur' };
  }

  // Check for dash/hyphen (-) character
  if (trimmedName.includes('-')) {
    return { isValid: false, error: 'Ad Soyadda tire (-) istifadə edilə bilməz' };
  }

  // Check for numbers
  if (/\d/.test(trimmedName)) {
    return { isValid: false, error: 'Ad Soyadda rəqəm istifadə edilə bilməz' };
  }

  // FIXED: Include all Azerbaijani letters including "ə" and "Ə" with explicit Unicode codes
  // Azərbaycan əlifbasının bütün hərfləri daxil edilib (a-z, A-Z və Azərbaycan hərfləri)
  // ə = \u0259, Ə = \u018F, ğ = \u011F, Ğ = \u011E, ü = \u00FC, Ü = \u00DC
  // ş = \u015F, Ş = \u015E, ö = \u00F6, Ö = \u00D6, ç = \u00E7, Ç = \u00C7
  // ı = \u0131, İ = \u0130
  const nameRegex = /^[a-zA-Z\u0259\u018F\u011F\u011E\u00FC\u00DC\u015F\u015E\u00F6\u00D6\u00E7\u00C7\u0131\u0130\s'.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: 'Ad Soyadda yalnız hərflər istifadə edilə bilər' };
  }

  // Check for multiple consecutive spaces
  if (trimmedName.includes('  ')) {
    return { isValid: false, error: 'Ad Soyadda ardıcıl boşluqlar ola bilməz' };
  }

  // Check if starts or ends with space (should be handled by trim, but double check)
  if (trimmedName.startsWith(' ') || trimmedName.endsWith(' ')) {
    return { isValid: false, error: 'Ad Soyad boşluqla başlaya və ya bitə bilməz' };
  }

  return { isValid: true };
}
