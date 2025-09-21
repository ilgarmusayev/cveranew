'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer'; // Footer əlavə edirik

export default function RegisterPage() {
  // All hooks must be called at the top level, before any early returns
  const { user, register, loading: authLoading } = useAuth();
  const router = useRouter();
  const { siteLanguage } = useSiteLanguage();

  const content = {
    azerbaijani: {
      title: 'Qeydiyyat',
      subtitle: 'CV yaratmaq üçün yeni hesab yaradın',
      firstNameLabel: 'Ad',
      firstNamePlaceholder: 'Adınızı daxil edin',
      lastNameLabel: 'Soyad',
      lastNamePlaceholder: 'Soyadınızı daxil edin',
      emailLabel: 'E-poçt',
      emailPlaceholder: 'E-poçt ünvanınızı daxil edin',
      passwordLabel: 'Şifrə',
      passwordPlaceholder: 'Şifrənizi daxil edin',
      confirmPasswordLabel: 'Şifrəni təsdiq edin',
      confirmPasswordPlaceholder: 'Şifrənizi təkrar daxil edin',
      showPassword: 'Şifrəni göstər',
      hidePassword: 'Şifrəni gizlət',
      agreeToTerms: 'İstifadə şərtləri və məxfilik siyasəti ilə razıyam',
      agreeToTermsPrefix: '',
      agreeToTermsMiddle: ' və ',
      agreeToTermsSuffix: ' ni qəbul edirəm',
      termsLink: 'İstifadə şərtləri',
      privacyLink: 'Məxfilik siyasəti',
      registerButton: 'Qeydiyyat',
      registering: 'Qeydiyyat edilir...',
      haveAccount: 'Artıq hesabınız var?',
      loginLink: 'Giriş edin',
      orContinueWith: 'və ya',
      continueWithLinkedIn: 'LinkedIn ilə qeydiyyat'
    },
    english: {
      title: 'Sign Up',
      subtitle: 'Create a new account to start building CVs',
      firstNameLabel: 'First Name',
      firstNamePlaceholder: 'Enter your first name',
      lastNameLabel: 'Last Name',
      lastNamePlaceholder: 'Enter your last name',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email address',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      agreeToTerms: 'I agree to the Terms of Service and Privacy Policy',
      agreeToTermsPrefix: 'I agree to the ',
      agreeToTermsMiddle: ' and ',
      agreeToTermsSuffix: '',
      termsLink: 'Terms of Service',
      privacyLink: 'Privacy Policy',
      registerButton: 'Sign Up',
      registering: 'Signing up...',
      haveAccount: 'Already have an account?',
      loginLink: 'Sign in',
      orContinueWith: 'or',
      continueWithLinkedIn: 'Continue with LinkedIn'
    },
    russian: {
      title: 'Регистрация',
      subtitle: 'Создайте новый аккаунт для создания резюме',
      firstNameLabel: 'Имя',
      firstNamePlaceholder: 'Введите ваше имя',
      lastNameLabel: 'Фамилия',
      lastNamePlaceholder: 'Введите вашу фамилию',
      emailLabel: 'Электронная почта',
      emailPlaceholder: 'Введите адрес электронной почты',
      passwordLabel: 'Пароль',
      passwordPlaceholder: 'Введите пароль',
      confirmPasswordLabel: 'Подтвердите пароль',
      confirmPasswordPlaceholder: 'Повторите пароль',
      showPassword: 'Показать пароль',
      hidePassword: 'Скрыть пароль',
      agreeToTerms: 'Я согласен с Условиями использования и Политикой конфиденциальности',
      agreeToTermsPrefix: 'Я согласен с ',
      agreeToTermsMiddle: ' и ',
      agreeToTermsSuffix: '',
      termsLink: 'Условия использования',
      privacyLink: 'Политика конфиденциальности',
      registerButton: 'Зарегистрироваться',
      registering: 'Регистрация...',
      haveAccount: 'Уже есть аккаунт?',
      loginLink: 'Войти',
      orContinueWith: 'или',
      continueWithLinkedIn: 'Продолжить с LinkedIn'
    }
  }[siteLanguage];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // All useEffect hooks must be at the top level
  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Set custom validation messages for Azerbaijani
  useEffect(() => {
    const setCustomValidationMessages = () => {
      // Get all required inputs
      const inputs = document.querySelectorAll('input[required]') as NodeListOf<HTMLInputElement>;

      inputs.forEach((input) => {
        // Clear any existing custom validity
        input.setCustomValidity('');

        // Set initial custom validity for empty fields
        if (!input.value.trim()) {
          input.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
        }

        // Handle validation on input
        input.oninput = function() {
          (this as HTMLInputElement).setCustomValidity('');
        };

        // Handle validation on invalid event
        input.oninvalid = function() {
          const target = this as HTMLInputElement;

          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          } else if (target.type === 'email' && target.validity.typeMismatch) {
            target.setCustomValidity('Zəhmət olmasa düzgün email ünvanı daxil edin');
          } else if (target.id === 'password' && target.validity.tooShort) {
            target.setCustomValidity('Şifrə ən azı 8 simvoldan ibarət olmalıdır');
          } else {
            target.setCustomValidity('Zəhmət olmasa bu sahəni düzgün doldurun');
          }
        };
      });
    };

    // Apply validation with delay to ensure DOM is ready
    const timer = setTimeout(setCustomValidationMessages, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="app-background flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 backdrop-blur-sm border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Yüklənir...</p>
        </div>
      </div>
    );
  }

  // Don't render register form if user is authenticated
  if (user) {
    return null;
  }

  // Password validation function
  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Şifrə ən azı 8 simvoldan ibarət olmalıdır');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Şifrə ən azı bir böyük hərf ehtiva etməlidir');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Şifrə ən azı bir kiçik hərf ehtiva etməlidir');
    }

    return errors;
  };

  // Name validation function - only letters, spaces and certain characters allowed
  const validateName = (name: string, fieldName: string) => {
    const errors: string[] = [];

    if (name.trim().length < 2) {
      errors.push(`${fieldName} ən azı 2 simvoldan ibarət olmalıdır`);
    }

    // Only allow letters (including Azerbaijani), spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-ZəğĞıİöÖşŞüÜçÇ\s'-]+$/;
    if (!nameRegex.test(name)) {
      errors.push(`${fieldName} yalnız hərflər ehtiva etməlidir (rəqəm və xüsusi simvollar qadağandır)`);
    }

    // Check for consecutive spaces or special characters
    if (/\s{2,}/.test(name) || /[-']{2,}/.test(name)) {
      errors.push(`${fieldName} ardıcıl boşluq və ya xüsusi simvollar ehtiva edə bilməz`);
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate names
    const firstNameErrors = validateName(formData.firstName, 'Ad');
    const lastNameErrors = validateName(formData.lastName, 'Soyad');

    if (firstNameErrors.length > 0) {
      setError(firstNameErrors.join(', '));
      setLoading(false);
      return;
    }

    if (lastNameErrors.length > 0) {
      setError(lastNameErrors.join(', '));
      setLoading(false);
      return;
    }

    // Validate password
    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      setError(passwordValidationErrors.join(', '));
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifrələr uyğun gəlmir');
      setLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('İstifadə qaydalarını qəbul etməlisiniz');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Redirect to login page with email verification message
        router.push('/auth/login?message=email_verification_sent&email=' + encodeURIComponent(formData.email));
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Qeydiyyat uğursuz oldu');
      }
    } catch (error) {
      setError('Sistem xətası baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInRegister = () => {
    // Open LinkedIn logout in a new window to clear session
    const logoutWin = window.open(
      "https://www.linkedin.com/m/logout/",
      "_blank",
      "width=600,height=400"
    );

    // İmproved logout window management with smart detection
    let windowClosed = false;

    const monitorLogoutWindow = () => {
      if (!logoutWin || logoutWin.closed) {
        windowClosed = true;
        console.log('LinkedIn logout pəncərəsi bağlandı');
        // Proceed to LinkedIn auth
        window.location.href = "/api/auth/linkedin?from=register";
        return;
      }

      // Check if logout completed by monitoring URL or content
      try {
        const currentUrl = logoutWin.location.href;
        if (currentUrl.includes('linkedin.com') && !currentUrl.includes('logout')) {
          // Logout completed successfully
          logoutWin.close();
          windowClosed = true;
          console.log('LinkedIn logout tamamlandı');
          window.location.href = "/api/auth/linkedin?from=register";
          return;
        }
      } catch (e) {
        // Cross-origin restriction - likely logout completed
        console.log('LinkedIn logout cross-origin - logout likely complete');
        // Wait a bit more then proceed
        setTimeout(() => {
          if (!windowClosed) {
            logoutWin.close();
            windowClosed = true;
            window.location.href = "/api/auth/linkedin?from=register";
          }
        }, 1000);
        return;
      }

      // Continue monitoring
      if (!windowClosed) {
        setTimeout(monitorLogoutWindow, 500);
      }
    };

    // Start monitoring after initial delay
    setTimeout(monitorLogoutWindow, 1000);

    // Fallback: force proceed after 8 seconds maximum
    setTimeout(() => {
      if (!windowClosed) {
        logoutWin?.close();
        console.log('LinkedIn logout timeout - proceeding anyway');
        window.location.href = "/api/auth/linkedin?from=register";
      }
    }, 8000); // 8 saniyə maksimum
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header currentPage="register" />

      {/* Main Content with Responsive Container */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-20 2xl:px-24 py-8 sm:py-12 lg:py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100" style={{ borderWidth: '2px', borderColor: '#3b82f6' }}>
            {/* Register Form Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{content.title}</h1>
              <p className="text-gray-600">{content.subtitle}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.firstNameLabel}
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens and apostrophes in real-time
                      const value = e.target.value;
                      const filteredValue = value.replace(/[^a-zA-ZəğĞıİöÖşŞüÜçÇ\s'-]/g, '');
                      setFormData({ ...formData, firstName: filteredValue });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={content.firstNamePlaceholder}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.lastNameLabel}
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => {
                      // Only allow letters, spaces, hyphens and apostrophes in real-time
                      const value = e.target.value;
                      const filteredValue = value.replace(/[^a-zA-ZəğĞıİöÖşŞüÜçÇ\s'-]/g, '');
                      setFormData({ ...formData, lastName: filteredValue });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={content.lastNamePlaceholder}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {content.emailLabel}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={content.emailPlaceholder}
                />
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {content.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                    placeholder={content.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    title={showPassword ? content.hidePassword : content.showPassword}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.878 9.878m4.242 4.242L19.5 19.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {content.confirmPasswordLabel}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                    placeholder={content.confirmPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    title={showConfirmPassword ? content.hidePassword : content.showPassword}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M14.12 14.12l1.415 1.415M14.12 14.12L9.878 9.878m4.242 4.242L19.5 19.5" />
                    </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="agreedToTerms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="agreedToTerms" className="text-sm text-gray-600">
                  {content.agreeToTermsPrefix}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                    {content.termsLink}
                  </Link>
                  {content.agreeToTermsMiddle}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                    {content.privacyLink}
                  </Link>
                  {content.agreeToTermsSuffix}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !agreedToTerms}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="ml-2">{content.registering}</span>
                  </div>
                ) : (
                  content.registerButton
                )}
              </button>
            </form>

            {/* Social Login Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">{content.orContinueWith}</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* LinkedIn Register Button */}
            <button
              onClick={handleLinkedInRegister}
              disabled={loading}
              className="w-full bg-[#1e40af] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#005885] focus:ring-2 focus:ring-[#0077B5] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span>{content.continueWithLinkedIn}</span>
            </button>

            {/* Links */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                {content.haveAccount}{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  {content.loginLink}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
