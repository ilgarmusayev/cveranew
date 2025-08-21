'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
}

const RegisterForm = ({ onSuccess, onSwitchToLogin }: RegisterFormProps) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Form validasiya mesajlarını Azərbaycan dilinə çevirmək
  useEffect(() => {
    const setCustomValidationMessages = () => {
      // Daha spesifik selektorlar istifadə edək
      const form = document.querySelector('form');
      if (!form) return;

      const nameInput = form.querySelector('#name') as HTMLInputElement;
      const emailInput = form.querySelector('#email') as HTMLInputElement;
      const passwordInput = form.querySelector('#password') as HTMLInputElement;
      const confirmPasswordInput = form.querySelector('#confirmPassword') as HTMLInputElement;

      // ULTRA AGGRESSIVE AUTO-FILL PREVENTION
      // Track user typing state using WeakMap to avoid TypeScript errors
      const userTypingMap = new WeakMap<HTMLInputElement, boolean>();
      const manualValueMap = new WeakMap<HTMLInputElement, string>();

      const inputs = [nameInput, emailInput, passwordInput, confirmPasswordInput].filter(Boolean);
      inputs.forEach((input) => {
        // Clear any existing custom validity
        input.setCustomValidity('');

        // Set initial custom validity for empty fields
        if (!input.value.trim()) {
          input.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
        }

        // Initialize manual value tracking
        manualValueMap.set(input, '');

        // Override the value setter to detect auto-fill
        Object.defineProperty(input, 'value', {
          get: () => input.getAttribute('value') || '',
          set: (val) => {
            const manualValue = manualValueMap.get(input) || '';
            // Only update if user is typing or it's a manual change
            if (userTypingMap.get(input) || val === manualValue) {
              manualValueMap.set(input, val);
              input.setAttribute('value', val);
            } else {
              // This might be auto-fill, clear it
              input.setAttribute('value', '');
              console.log('🚫 Blocked potential auto-fill on:', input.id);
            }
          },
          configurable: true
        });

        // Track manual typing using WeakMap
        input.addEventListener('keydown', () => {
          userTypingMap.set(input, true);
          setTimeout(() => {
            userTypingMap.set(input, false);
          }, 50);
        });

        // IMMEDIATE: Clear any auto-filled values on every check
        if (input.value && !formData.name && !formData.email && !formData.password && !formData.confirmPassword) {
          input.value = '';
          manualValueMap.set(input, '');
          console.log('🚫 Cleared auto-filled value from:', input.id);
        }

        // NUCLEAR: Completely disable browser auto-fill mechanisms
        input.setAttribute('readonly', 'true');
        setTimeout(() => {
          input.removeAttribute('readonly');
        }, 100);

        // AGGRESSIVE: Clear on any browser attempt to auto-fill
        const clearValue = () => {
          if (input.hasAttribute('data-auto-filled') || input.matches(':-webkit-autofill')) {
            input.value = '';
            manualValueMap.set(input, '');
            input.blur();
            setTimeout(() => input.focus(), 10);
          }
        };

        // Multiple event listeners to catch all auto-fill attempts
        input.addEventListener('focus', clearValue);
        input.addEventListener('blur', clearValue);
        input.addEventListener('change', (e) => {
          // Block programmatic changes
          if (!userTypingMap.get(input)) {
            e.preventDefault();
            input.value = '';
            manualValueMap.set(input, '');
          }
        });

        // NUCLEAR: Monitor for any value changes
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
              if (!userTypingMap.get(input)) {
                input.value = '';
                manualValueMap.set(input, '');
                console.log('🚫 Blocked mutation auto-fill on:', input.id);
              }
            }
          });
        });

        observer.observe(input, {
          attributes: true,
          attributeFilter: ['value']
        });

        // Force clear every 50ms for maximum aggression
        const interval = setInterval(() => {
          if (input.hasAttribute('data-auto-filled') ||
              input.matches(':-webkit-autofill') ||
              (input.value && !userTypingMap.get(input) && !formData.name && !formData.email && !formData.password && !formData.confirmPassword)) {
            input.value = '';
            manualValueMap.set(input, '');
            console.log('🚫 Interval cleared auto-fill:', input.id);
          }
        }, 50);

        // Clear interval when component unmounts
        setTimeout(() => {
          clearInterval(interval);
          observer.disconnect();
        }, 10000);
      });

      if (nameInput) {
        nameInput.setCustomValidity('');
        nameInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          }
        };
        nameInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
        nameInput.onfocus = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }

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
            target.setCustomValidity('Şifrə ən azı 8 simvoldan ibarət olmalıdır');
          }
        };
        passwordInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
        passwordInput.onfocus = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }

      if (confirmPasswordInput) {
        confirmPasswordInput.setCustomValidity('');
        confirmPasswordInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          }
        };
        confirmPasswordInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
        confirmPasswordInput.onfocus = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }
    };

    // Bir az gecikmə ilə çağır ki, DOM elementi tam yüklənsin
    const timer1 = setTimeout(setCustomValidationMessages, 100);
    const timer2 = setTimeout(setCustomValidationMessages, 500);
    const timer3 = setTimeout(setCustomValidationMessages, 1000); // Extra delay for stubborn browsers

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [formData]);

  // Real-time validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    setFieldErrors(prev => ({ ...prev, email: '' }));

    if (email.trim()) {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        setFieldErrors(prev => ({ ...prev, email: validation.error! }));
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({ ...prev, name }));
    setFieldErrors(prev => ({ ...prev, name: '' }));

    if (name.trim()) {
      const validation = validateName(name);
      if (!validation.isValid) {
        setFieldErrors(prev => ({ ...prev, name: validation.error! }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
    setFieldErrors(prev => ({ ...prev, password: '' }));

    if (password) {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setFieldErrors(prev => ({ ...prev, password: validation.error! }));
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const confirmPassword = e.target.value;
    setFormData(prev => ({ ...prev, confirmPassword }));
    setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));

    if (confirmPassword && formData.password) {
      if (confirmPassword !== formData.password) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Şifrələr uyğun gəlmir' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });

    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    let hasErrors = false;
    const newFieldErrors = { name: '', email: '', password: '', confirmPassword: '' };

    if (!nameValidation.isValid) {
      newFieldErrors.name = nameValidation.error!;
      hasErrors = true;
    }

    if (!emailValidation.isValid) {
      newFieldErrors.email = emailValidation.error!;
      hasErrors = true;
    }

    if (!passwordValidation.isValid) {
      newFieldErrors.password = passwordValidation.error!;
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Şifrələr uyğun gəlmir. Zəhmət olmasa yenidən daxil edin.';
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      await register(formData.name.trim(), formData.email.trim().toLowerCase(), formData.password);
      onSuccess?.();
    } catch (error) {
      console.error('Registration failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          setError('Bu e-poçt ünvanı artıq mövcuddur. Başqa e-poçt ünvanı istifadə edin.');
        } else if (error.message.includes('invalid email')) {
          setError('E-poçt ünvanı düzgün formatda deyil.');
        } else if (error.message.includes('weak password')) {
          setError('Şifrə çox sadədir. Daha güclü şifrə seçin.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          setError('İnternet bağlantısı problemi. Zəhmət olmasa yenidən cəhd edin.');
        } else {
          setError('Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
        }
      } else {
        setError('Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    setLoading(true);
    setError('');

    try {
      window.location.href = '/api/auth/linkedin';
    } catch (error) {
      setError('LinkedIn ilə qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      setLoading(false);
    }
  };

  return (
      <div className="space-y-6">
        <button
            type="button"
            onClick={handleLinkedInLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077B5">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn ilə qeydiyyat
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">və ya</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" key={Math.random()}>
          {/* INVISIBLE DUMMY FIELDS TO CONFUSE BROWSERS */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
            <input type="email" name="fake_email" tabIndex={-1} autoComplete="off" />
            <input type="password" name="fake_password" tabIndex={-1} autoComplete="off" />
            <input type="text" name="fake_username" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Ad Soyad
            </label>
            <input
                id="name"
                name={`name_${Math.random().toString(36)}`}
                type="text"
                required
                minLength={2}
                value={formData.name}
                onChange={handleNameChange}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-dashlane-ignore="true"
                style={{
                  backgroundColor: 'transparent !important',
                  backgroundImage: 'none !important',
                  color: 'inherit !important'
                }}
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.valueMissing) {
                    target.setCustomValidity('Ad Soyad tələb olunur');
                  } else if (target.validity.tooShort) {
                    target.setCustomValidity('Ad Soyad ən azı 2 simvoldan ibarət olmalıdır');
                  } else {
                    target.setCustomValidity('Düzgün Ad Soyad daxil edin');
                  }
                }}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Adınızı və soyadınızı daxil edin"
            />
            {fieldErrors.name && <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-poçt
            </label>
            {/* DECOY EMAIL FIELD - INVISIBLE */}
            <input
              type="email"
              name="email_decoy"
              style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
              tabIndex={-1}
              autoComplete="email"
            />
            <input
                id="email"
                name={`email_${Math.random().toString(36)}`}
                type="email"
                required
                value={formData.email}
                onChange={handleEmailChange}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-dashlane-ignore="true"
                style={{
                  backgroundColor: 'transparent !important',
                  backgroundImage: 'none !important',
                  color: 'inherit !important'
                }}
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
            {fieldErrors.email && <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifrə
            </label>
            {/* DECOY PASSWORD FIELD - INVISIBLE */}
            <input
              type="password"
              name="password_decoy"
              style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
              tabIndex={-1}
              autoComplete="current-password"
            />
            <input
                id="password"
                name={`password_${Math.random().toString(36)}`}
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-dashlane-ignore="true"
                style={{
                  backgroundColor: 'transparent !important',
                  backgroundImage: 'none !important',
                  color: 'inherit !important'
                }}
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.valueMissing) {
                    target.setCustomValidity('Şifrə tələb olunur');
                  } else if (target.validity.tooShort) {
                    target.setCustomValidity('Şifrə ən azı 8 simvoldan ibarət olmalıdır');
                  } else {
                    target.setCustomValidity('Güclü şifrə daxil edin');
                  }
                }}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Ən azı 8 simvoldan ibarət şifrə"
            />
            {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Şifrəni təsdiq edin
            </label>
            <input
                id="confirmPassword"
                name={`confirm_password_${Math.random().toString(36)}`}
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                data-dashlane-ignore="true"
                style={{
                  backgroundColor: 'transparent !important',
                  backgroundImage: 'none !important',
                  color: 'inherit !important'
                }}
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.valueMissing) {
                    target.setCustomValidity('Şifrə təsdiqi tələb olunur');
                  } else {
                    target.setCustomValidity('Şifrələr uyğun gəlmir');
                  }
                }}
                onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Şifrəni təkrar daxil edin"
            />
            {fieldErrors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
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
            {loading ? 'Qeydiyyat edilir...' : 'Qeydiyyat'}
          </button>

          <div className="text-center">
            <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-blue-600 hover:text-blue-500"
            >
              Hesabınız var? Giriş edin
            </button>
          </div>
        </form>
      </div>
  );
};

export default RegisterForm;
