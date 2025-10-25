'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

export default function ForgotPasswordPage() {
  const { siteLanguage } = useSiteLanguage();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Site language mətnləri
  const content = {
    azerbaijani: {
      title: 'Şifrəni Unutmusunuz?',
      subtitle: 'E-poçt ünvanınızı daxil edin, şifrə yeniləmə linki göndərək',
      emailLabel: 'E-poçt ünvanı',
      emailPlaceholder: 'numune@cvera.net',
      sendingText: 'Göndərilir...',
      sendButton: 'Şifrə Yeniləmə Linki Göndərin',
      backToLogin: '← Girişə qayıdın',
      emailSentTitle: 'E-poçt Göndərildi!',
      checkSpam: 'E-poçt almadınızsa spam qovluğunu yoxlayın',
      tryAgain: 'Başqa e-poçt ilə yenidən cəhd edin',
      backToLoginButton: 'Girişə qayıdın',
      errorMessage: 'Bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
    },
    english: {
      title: 'Forgot Your Password?',
      subtitle: 'Enter your email address and we will send you a password reset link',
      emailLabel: 'Email address',
      emailPlaceholder: 'example@cvera.net',
      sendingText: 'Sending...',
      sendButton: 'Send Password Reset Link',
      backToLogin: '← Back to login',
      emailSentTitle: 'Email Sent!',
      checkSpam: 'If you did not receive the email, check your spam folder',
      tryAgain: 'Try again with another email',
      backToLoginButton: 'Back to login',
      errorMessage: 'An error occurred. Please try again.',
    },
    russian: {
      title: 'Забыли пароль?',
      subtitle: 'Введите ваш адрес электронной почты, и мы отправим вам ссылку для сброса пароля',
      emailLabel: 'Адрес электронной почты',
      emailPlaceholder: 'example@cvera.net',
      sendingText: 'Отправка...',
      sendButton: 'Отправить ссылку для сброса пароля',
      backToLogin: '← Вернуться к входу',
      emailSentTitle: 'Письмо отправлено!',
      checkSpam: 'Если вы не получили письмо, проверьте папку спам',
      tryAgain: 'Попробовать снова с другой почтой',
      backToLoginButton: 'Вернуться к входу',
      errorMessage: 'Произошла ошибка. Пожалуйста, попробуйте снова.',
    }
  }[siteLanguage];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-site-language': siteLanguage,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message);
      } else {
        setIsSuccess(false);
        setMessage(data.message || content.errorMessage);
      }
    } catch (error) {
      setIsSuccess(false);
      setMessage(content.errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header showAuthButtons={false} currentPage="login" />
<br/><br/><br/><br/>
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
              {content.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {content.subtitle}
            </p>
          </div>

          {!isSuccess ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {content.emailLabel}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={(e) => {
                    const input = e.target as HTMLInputElement;
                    if (!input.value) {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'E-poçt tələb olunur' : 
                                               siteLanguage === 'russian' ? 'Требуется электронная почта' : 
                                               'Email is required');
                    } else if (input.validity.typeMismatch) {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Zəhmət olmasa düzgün e-poçt ünvanı daxil edin' : 
                                               siteLanguage === 'russian' ? 'Пожалуйста, введите правильный адрес электронной почты' : 
                                               'Please enter a valid email address');
                    } else {
                      input.setCustomValidity(siteLanguage === 'azerbaijani' ? 'Zəhmət olmasa bu sahəni düzgün doldurun' : 
                                               siteLanguage === 'russian' ? 'Пожалуйста, правильно заполните это поле' : 
                                               'Please fill out this field correctly');
                    }
                  }}
                  onInput={(e) => {
                    (e.target as HTMLInputElement).setCustomValidity('');
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder={content.emailPlaceholder}
                />
              </div>

              {message && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-md text-sm ${
                    isSuccess
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {message}
                </motion.div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {content.sendingText}
                    </div>
                  ) : (
                    content.sendButton
                  )}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {content.backToLogin}
                </Link>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">{content.emailSentTitle}</h3>
                <p className="text-sm text-gray-600">{message}</p>
                <p className="text-xs text-gray-500">
                  {content.checkSpam}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setMessage('');
                    setEmail('');
                  }}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {content.tryAgain}
                </button>

                <Link
                  href="/auth/login"
                  className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  {content.backToLoginButton}
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
      <br/><br/><br/><br/>
      <Footer />
    </div>
  );
}
