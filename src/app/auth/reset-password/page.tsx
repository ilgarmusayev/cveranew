'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

function ResetPasswordContent() {
  const { siteLanguage } = useSiteLanguage();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Site language mətnləri
  const content = {
    azerbaijani: {
      tokenNotFound: 'Sıfırlama tokeni tapılmadı',
      passwordMinLength: 'Şifrə ən azı 8 simvoldan ibarət olmalıdır',
      passwordUppercase: 'Şifrə ən azı bir böyük hərf ehtiva etməlidir',
      passwordLowercase: 'Şifrə ən azı bir kiçik hərf ehtiva etməlidir',
      fillField: 'Zəhmət olmasa bu sahəni doldurun',
      fillCorrectly: 'Zəhmət olmasa bu sahəni düzgün doldurun',
      passwordsMismatch: 'Şifrələr uyğun gəlmir',
      resetFailed: 'Şifrə sıfırlanması uğursuz oldu',
      systemError: 'Sistem xətası baş verdi',
      strengthWeak: 'Zəif',
      strengthMedium: 'Orta',
      strengthGood: 'Yaxşı',
      strengthStrong: 'Güclü',
      successTitle: 'Şifrə Uğurla Yeniləndi',
      successMessage: 'Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.',
      redirectMessage: '3 saniyə ərzində giriş səhifəsinə yönləndiriləcəksiniz...',
      loginNow: 'İndi Daxil Olun →',
      newPassword: 'Yeni Şifrə',
      confirmNewPassword: 'Yeni Şifrəni Təsdiq Edin',
      passwordPlaceholder: 'Yeni şifrənizi daxil edin',
      confirmPasswordPlaceholder: 'Şifrənizi yenidən daxil edin',
      updating: 'Yenilənir...',
      updatePassword: 'Şifrəni Yeniləyin',
      backToLogin: '← Girişə qayıdın',
      passwordRequirements: 'Şifrə tələbləri:',
      requirementMinChars: 'Ən azı 8 simvol',
      requirementUppercase: 'Bir böyük hərf',
      requirementLowercase: 'Bir kiçik hərf',
      setNewPassword: 'Yeni Şifrə Təyin Edin',
      createStrongPassword: 'Hesabınız üçün yeni və güclü şifrə yaradın',
    },
    english: {
      tokenNotFound: 'Reset token not found',
      passwordMinLength: 'Password must be at least 8 characters long',
      passwordUppercase: 'Password must contain at least one uppercase letter',
      passwordLowercase: 'Password must contain at least one lowercase letter',
      fillField: 'Please fill out this field',
      fillCorrectly: 'Please fill out this field correctly',
      passwordsMismatch: 'Passwords do not match',
      resetFailed: 'Password reset failed',
      systemError: 'System error occurred',
      strengthWeak: 'Weak',
      strengthMedium: 'Medium',
      strengthGood: 'Good',
      strengthStrong: 'Strong',
      successTitle: 'Password Successfully Updated',
      successMessage: 'Your password has been successfully updated. You can now log in with your new password.',
      redirectMessage: 'You will be redirected to the login page in 3 seconds...',
      loginNow: 'Login Now →',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      passwordPlaceholder: 'Enter your new password',
      confirmPasswordPlaceholder: 'Re-enter your password',
      updating: 'Updating...',
      updatePassword: 'Update Password',
      backToLogin: '← Back to login',
      passwordRequirements: 'Password requirements:',
      requirementMinChars: 'At least 8 characters',
      requirementUppercase: 'One uppercase letter',
      requirementLowercase: 'One lowercase letter',
      setNewPassword: 'Set New Password',
      createStrongPassword: 'Create a new and strong password for your account',
    },
    russian: {
      tokenNotFound: 'Токен сброса не найден',
      passwordMinLength: 'Пароль должен содержать не менее 8 символов',
      passwordUppercase: 'Пароль должен содержать как минимум одну заглавную букву',
      passwordLowercase: 'Пароль должен содержать как минимум одну строчную букву',
      fillField: 'Пожалуйста, заполните это поле',
      fillCorrectly: 'Пожалуйста, заполните это поле правильно',
      passwordsMismatch: 'Пароли не совпадают',
      resetFailed: 'Не удалось сбросить пароль',
      systemError: 'Произошла системная ошибка',
      strengthWeak: 'Слабый',
      strengthMedium: 'Средний',
      strengthGood: 'Хороший',
      strengthStrong: 'Сильный',
      successTitle: 'Пароль успешно обновлен',
      successMessage: 'Ваш пароль был успешно обновлен. Теперь вы можете войти в систему с новым паролем.',
      redirectMessage: 'Через 3 секунды вы будете перенаправлены на страницу входа...',
      loginNow: 'Войти сейчас →',
      newPassword: 'Новый пароль',
      confirmNewPassword: 'Подтвердите новый пароль',
      passwordPlaceholder: 'Введите ваш новый пароль',
      confirmPasswordPlaceholder: 'Повторите ваш пароль',
      updating: 'Обновление...',
      updatePassword: 'Обновить пароль',
      backToLogin: '← Вернуться к входу',
      passwordRequirements: 'Требования к паролю:',
      requirementMinChars: 'Минимум 8 символов',
      requirementUppercase: 'Одна заглавная буква',
      requirementLowercase: 'Одна строчная буква',
      setNewPassword: 'Установить новый пароль',
      createStrongPassword: 'Создайте новый и надежный пароль для вашей учетной записи',
    }
  }[siteLanguage];

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (!urlToken) {
      setError(content.tokenNotFound);
      return;
    }
    setToken(urlToken);
  }, [searchParams, content.tokenNotFound]);

  // Password validation function
  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push(content.passwordMinLength);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push(content.passwordUppercase);
    }

    if (!/[a-z]/.test(password)) {
      errors.push(content.passwordLowercase);
    }


    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!token) {
      setError(content.tokenNotFound);
      setLoading(false);
      return;
    }

    // Validate password
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(content.passwordsMismatch);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-site-language': siteLanguage,
        },
        body: JSON.stringify({
          token,
          newPassword: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setError(data.message || content.resetFailed);
      }
    } catch (error) {
      setError(content.systemError);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: content.strengthWeak, color: 'text-red-600' };
    if (password.length < 8) return { strength: 2, text: content.strengthMedium, color: 'text-yellow-600' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, text: content.strengthStrong, color: 'text-green-600' };
    }
    return { strength: 2, text: content.strengthGood, color: 'text-blue-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header showAuthButtons={false} currentPage="login" />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {content.successTitle}
              </h2>
              <p className="text-gray-600 mb-6">
                {content.successMessage}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {content.redirectMessage}
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 text-blue-600 font-medium hover:text-blue-700"
              >
                {content.loginNow}
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header showAuthButtons={false} currentPage="login" />

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{content.tokenNotFound}</h2>
            <p className="text-gray-600">{content.tokenNotFound}</p>
            <Link
              href="/auth/forgot-password"
              className="inline-block w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {content.backToLogin}
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header showAuthButtons={false} currentPage="login" />

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              CVERA
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {content.setNewPassword}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {content.createStrongPassword}
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {content.newPassword}
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  onInvalid={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (!input.value) {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Şifrə tələb olunur' : 
                                               siteLanguage === 'russian' ? 'Требуется пароль' : 
                                               'Password is required');
                    } else if (input.validity.tooShort) {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Şifrə ən azı 8 simvoldan ibarət olmalıdır' : 
                                               siteLanguage === 'russian' ? 'Пароль должен содержать минимум 8 символов' : 
                                               'Password must be at least 8 characters');
                    } else {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Zəhmət olmasa bu sahəni düzgün doldurun' : 
                                               siteLanguage === 'russian' ? 'Пожалуйста, правильно заполните это поле' : 
                                               'Please fill out this field correctly');
                    }
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={content.passwordPlaceholder}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? (siteLanguage === 'azerbaijani' ? 'Şifrəni gizlət' : siteLanguage === 'russian' ? 'Скрыть пароль' : 'Hide password') : (siteLanguage === 'azerbaijani' ? 'Şifrəni göstər' : siteLanguage === 'russian' ? 'Показать пароль' : 'Show password')}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {content.confirmNewPassword}
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  onInvalid={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (!input.value) {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Şifrə təsdiqi tələb olunur' : 
                                               siteLanguage === 'russian' ? 'Требуется подтверждение пароля' : 
                                               'Password confirmation is required');
                    } else {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Zəhmət olmasa bu sahəni düzgün doldurun' : 
                                               siteLanguage === 'russian' ? 'Пожалуйста, правильно заполните это поле' : 
                                               'Please fill out this field correctly');
                    }
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={content.confirmPasswordPlaceholder}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? (siteLanguage === 'azerbaijani' ? 'Şifrəni gizlət' : siteLanguage === 'russian' ? 'Скрыть пароль' : 'Hide password') : (siteLanguage === 'azerbaijani' ? 'Şifrəni göstər' : siteLanguage === 'russian' ? 'Показать пароль' : 'Show password')}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{content.passwordRequirements}</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{formData.password.length >= 8 ? '✓' : '•'}</span>
                  {content.requirementMinChars}
                </li>
                <li className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[A-Z]/.test(formData.password) ? '✓' : '•'}</span>
                  {content.requirementUppercase}
                </li>
                <li className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                  <span className="mr-2">{/[a-z]/.test(formData.password) ? '✓' : '•'}</span>
                  {content.requirementLowercase}
                </li>

              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {content.updating}
                  </div>
                ) : (
                  content.updatePassword
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                {content.backToLogin}
              </Link>
            </div>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
