'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';
import { getConnectionSpeed } from '@/lib/performance';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToForgot?: () => void;
}

const LoginForm = ({ onSwitchToRegister, onSwitchToForgot }: LoginFormProps) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });

  // Form validasiya mesajlarını Azərbaycan dilinə çevirmək
  useEffect(() => {
    const setCustomValidationMessages = () => {
      // Daha spesifik selektorlar istifadə edək
      const form = document.querySelector('form');
      if (!form) return;

      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const passwordInput = form.querySelector('#password') as HTMLInputElement;

      if (emailInput) {
        emailInput.setCustomValidity('');
        emailInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          } else if (target.validity.typeMismatch) {
            target.setCustomValidity('Zəhmət olmasa düzgün email ünvanı daxil edin');
          }
        };
        emailInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
        emailInput.onfocus = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }

      if (passwordInput) {
        passwordInput.setCustomValidity('');
        passwordInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          } else if (target.validity.tooShort) {
            target.setCustomValidity('Şifrə ən azı 6 simvoldan ibarət olmalıdır');
          }
        };
        passwordInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
        passwordInput.onfocus = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }
    };

    // Bir az gecikmə ilə çağır ki, DOM elementi tam yüklənsin
    const timer1 = setTimeout(setCustomValidationMessages, 100);
    const timer2 = setTimeout(setCustomValidationMessages, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Real-time email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));

    // Clear previous error
    setFieldErrors(prev => ({ ...prev, email: '' }));

    // Validate email if not empty
    if (email.trim()) {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        setFieldErrors(prev => ({ ...prev, email: validation.error! }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));

    // Clear previous error
    setFieldErrors(prev => ({ ...prev, password: '' }));

    // Basic validation
    if (password && password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır' }));
    }
  };

  // OPTIMIZED: Faster form submission with performance tracking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');
    setFieldErrors({ email: '', password: '' });

    // Quick validation before API call
    if (!validateEmail(formData.email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Düzgün email ünvanı daxil edin' }));
      return;
    }

    if (formData.password.length < 6) {
      setFieldErrors(prev => ({ ...prev, password: 'Şifrə ən az 6 simvol olmalıdır' }));
      return;
    }

    try {
      setLoading(true);

      // INSTANT LOGIN: No performance tracking delay
      const connectionSpeed = getConnectionSpeed();
      console.log('🌐 Connection Speed:', connectionSpeed);

      // OPTIMIZED: Login function now handles immediate redirect
      await login(formData.email, formData.password);

      // No need to handle redirect here - auth.tsx handles it instantly
    } catch (err: any) {
      setError(err.message || 'Giriş zamanı xəta baş verdi');
      setLoading(false); // Only set loading false on error
    }
    // Don't set loading false on success - let redirect handle it
  };

  const handleLinkedInLogin = () => {
    // Show loading state
    setLoading(true);
    setError('');

    try {
      // LinkedIn OAuth login
      window.location.href = '/api/auth/linkedin';
    } catch (error) {
      setError('LinkedIn ilə giriş zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* LinkedIn Login Button */}
      <button
        type="button"
        onClick={handleLinkedInLogin}
        disabled={loading}
        className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077B5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        LinkedIn ilə daxil olun
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">və ya</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-poçt
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleEmailChange}
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.valueMissing) {
                target.setCustomValidity('E-poçt tələb olunur');
              } else if (target.validity.typeMismatch) {
                target.setCustomValidity('Düzgün e-poçt ünvanı daxil edin');
              } else {
                target.setCustomValidity('Etibarlı e-poçt ünvanı daxil edin');
              }
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="example@email.com"
          />
          {fieldErrors.email && (
            <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Şifrə
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={handlePasswordChange}
            onInvalid={(e) => {
              const target = e.target as HTMLInputElement;
              if (target.validity.valueMissing) {
                target.setCustomValidity('Şifrə tələb olunur');
              } else if (target.validity.tooShort) {
                target.setCustomValidity('Şifrə ən azı 6 simvoldan ibarət olmalıdır');
              } else {
                target.setCustomValidity('Düzgün şifrə daxil edin');
              }
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Şifrənizi daxil edin"
          />
          {fieldErrors.password && (
            <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || Object.values(fieldErrors).some(error => error !== '')}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Giriş edilir...' : 'Giriş'}
        </button>

        <div className="flex flex-col space-y-3">
          {onSwitchToForgot && (
            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToForgot}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Şifrəni unutmusunuz?
              </button>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Hesabınız yoxdur? Qeydiyyatdan keçin
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
