// Server-side error messages for API routes
// These are used when we can't access client-side language context
import { NextRequest } from 'next/server';

export const serverErrorMessages = {
  azerbaijani: {
    invalidCredentials: 'E-poçt və ya şifrə yanlışdır',
    emailRequired: 'E-poçt və şifrə tələb olunur',
    accountDeactivated: 'Hesabınız aktiv deyil. Dəstək komandası ilə əlaqə saxlayın.',
    linkedinOnlyAccount: 'Bu hesab LinkedIn ilə qeydiyyatdan keçib. LinkedIn ilə daxil olun.',
    emailNotVerified: 'E-poçt ünvanınız təsdiqlənməyib',
    verificationEmailSent: 'Yeni təsdiqləmə linki e-poçt ünvanına göndərildi',
    emailAlreadyExists: 'Bu e-poçt ünvanı artıq mövcuddur',
    passwordTooShort: 'Şifrə ən azı 8 hərf olmalıdır',
    nameRequired: 'Ad tələb olunur',
    invalidEmail: 'Düzgün e-poçt ünvanı daxil edin',
    registrationError: 'Qeydiyyat zamanı xəta baş verdi',
  },
  english: {
    invalidCredentials: 'Invalid email or password',
    emailRequired: 'Email and password are required',
    accountDeactivated: 'Your account is not active. Please contact support.',
    linkedinOnlyAccount: 'This account was registered with LinkedIn. Please sign in with LinkedIn.',
    emailNotVerified: 'Your email address is not verified',
    verificationEmailSent: 'New verification link sent to your email address',
    emailAlreadyExists: 'This email address already exists',
    passwordTooShort: 'Password must be at least 8 characters long',
    nameRequired: 'Name is required',
    invalidEmail: 'Please enter a valid email address',
    registrationError: 'Registration error occurred',
  },
  russian: {
    invalidCredentials: 'Неверный email или пароль',
    emailRequired: 'Требуются email и пароль',
    accountDeactivated: 'Ваш аккаунт неактивен. Обратитесь в службу поддержки.',
    linkedinOnlyAccount: 'Этот аккаунт зарегистрирован через LinkedIn. Войдите через LinkedIn.',
    emailNotVerified: 'Ваш email не подтверждён',
    verificationEmailSent: 'Новая ссылка подтверждения отправлена на ваш email',
    emailAlreadyExists: 'Этот email уже существует',
    passwordTooShort: 'Пароль должен содержать минимум 8 символов',
    nameRequired: 'Требуется имя',
    invalidEmail: 'Введите корректный email',
    registrationError: 'Произошла ошибка регистрации',
  }
};

export type SiteLanguage = 'azerbaijani' | 'english' | 'russian';

export function getServerErrorMessage(key: keyof typeof serverErrorMessages.azerbaijani, language: SiteLanguage = 'azerbaijani'): string {
  return serverErrorMessages[language][key] || serverErrorMessages.azerbaijani[key];
}

// Function to detect language from request headers or use default
export function detectLanguageFromRequest(req: NextRequest): SiteLanguage {
  // Try to get language from a custom header if the client sets it
  const langHeader = req.headers.get('x-site-language');
  if (langHeader && ['azerbaijani', 'english', 'russian'].includes(langHeader)) {
    return langHeader as SiteLanguage;
  }
  
  // Try to detect from Accept-Language header
  const acceptLanguage = req.headers.get('accept-language');
  if (acceptLanguage) {
    if (acceptLanguage.includes('ru')) return 'russian';
    if (acceptLanguage.includes('en')) return 'english';
  }
  
  // Default to Azerbaijani
  return 'azerbaijani';
}