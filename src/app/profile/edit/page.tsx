'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StandardHeader from "@/components/ui/StandardHeader";
import Footer from "@/components/Footer";
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: string;
  loginMethod: string;
  linkedinUsername?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function ProfileEditPage() {
  const { siteLanguage } = useSiteLanguage();
  
  // Site language mətnləri
  const labels = {
    azerbaijani: {
      pageTitle: 'Profil Düzənləmə',
      profileInfo: 'Profil Məlumatları',
      personalInfo: 'Şəxsi Məlumatlar',
      fullName: 'Ad və Soyad',
      fullNamePlaceholder: 'Ad və soyadınızı daxil edin',
      email: 'E-poçt ünvanı',
      emailPlaceholder: 'E-poçt ünvanınızı daxil edin',
      passwordSection: 'Şifrə Dəyişikliyi',
      changePassword: 'Şifrəni dəyişdirmək istəyirəm',
      currentPassword: 'Cari şifrə',
      currentPasswordPlaceholder: 'Cari şifrənizi daxil edin',
      newPassword: 'Yeni şifrə',
      newPasswordPlaceholder: 'Yeni şifrənizi daxil edin',
      confirmPassword: 'Şifrəni təsdiq edin',
      confirmPasswordPlaceholder: 'Yeni şifrənizi təkrar daxil edin',
      showPassword: 'Şifrəni göstər',
      hidePassword: 'Şifrəni gizlət',
      saveChanges: 'Dəyişiklikləri yadda saxla',
      saving: 'Yadda saxlanır...',
      cancel: 'Ləğv et',
      accountInfo: 'Hesab Məlumatları',
      tier: 'Paket',
      loginMethod: 'Giriş üsulu',
      linkedinUsername: 'LinkedIn istifadəçi adı',
      joinDate: 'Qoşulma tarixi',
      lastLogin: 'Son giriş',
      // Error messages
      loadingProfile: 'Profil məlumatları yüklənir...',
      profileLoadError: 'Profil məlumatları yüklənərkən xəta baş verdi',
      systemError: 'Sistem xətası baş verdi',
      validationNameRequired: 'Ad və soyad tələb olunur',
      validationEmailRequired: 'E-poçt ünvanı tələb olunur',
      validationEmailInvalid: 'Keçərli e-poçt ünvanı daxil edin',
      validationCurrentPasswordRequired: 'Şifrəni dəyişdirmək üçün cari şifrəni daxil edin',
      validationNewPasswordRequired: 'Yeni şifrə tələb olunur',
      validationPasswordLength: 'Şifrə ən azı 6 simvol olmalıdır',
      validationPasswordsNotMatch: 'Şifrələr uyğun gəlmir',
      profileUpdateSuccess: 'Profil uğurla yeniləndi',
      profileUpdateError: 'Profil yenilənərkən xəta baş verdi',
      // Tier names
      freeTier: 'Pulsuz',
      mediumTier: 'Orta',
      popularTier: 'Populyar',
      premiumTier: 'Premium',
      // Login methods
      emailLogin: 'E-poçt',
      googleLogin: 'Google',
      linkedinLogin: 'LinkedIn',
      createdCVs: 'Yaradılmış CV-lər'
    },
    english: {
      pageTitle: 'Profile Edit',
      profileInfo: 'Profile Information',
      personalInfo: 'Personal Information',
      fullName: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email address',
      passwordSection: 'Password Change',
      changePassword: 'I want to change my password',
      currentPassword: 'Current Password',
      currentPasswordPlaceholder: 'Enter your current password',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter your new password',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter your new password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      cancel: 'Cancel',
      accountInfo: 'Account Information',
      tier: 'Package',
      loginMethod: 'Login method',
      linkedinUsername: 'LinkedIn username',
      joinDate: 'Join date',
      lastLogin: 'Last login',
      // Error messages
      loadingProfile: 'Loading profile...',
      profileLoadError: 'Error occurred while loading profile',
      systemError: 'System error occurred',
      validationNameRequired: 'Full name is required',
      validationEmailRequired: 'Email address is required',
      validationEmailInvalid: 'Please enter a valid email address',
      validationCurrentPasswordRequired: 'Enter current password to change password',
      validationNewPasswordRequired: 'New password is required',
      validationPasswordLength: 'Password must be at least 6 characters',
      validationPasswordsNotMatch: 'Passwords do not match',
      profileUpdateSuccess: 'Profile updated successfully',
      profileUpdateError: 'Error occurred while updating profile',
      // Tier names
      freeTier: 'Free',
      mediumTier: 'Medium',
      popularTier: 'Popular',
      premiumTier: 'Premium',
      // Login methods
      emailLogin: 'Email',
      googleLogin: 'Google',
      linkedinLogin: 'LinkedIn',
      createdCVs: 'Created CVs'
    },
    russian: {
      pageTitle: 'Редактирование профиля',
      profileInfo: 'Информация профиля',
      personalInfo: 'Личная информация',
      fullName: 'Полное имя',
      fullNamePlaceholder: 'Введите ваше полное имя',
      email: 'Адрес электронной почты',
      emailPlaceholder: 'Введите ваш адрес электронной почты',
      passwordSection: 'Смена пароля',
      changePassword: 'Я хочу изменить пароль',
      currentPassword: 'Текущий пароль',
      currentPasswordPlaceholder: 'Введите ваш текущий пароль',
      newPassword: 'Новый пароль',
      newPasswordPlaceholder: 'Введите ваш новый пароль',
      confirmPassword: 'Подтвердите пароль',
      confirmPasswordPlaceholder: 'Повторно введите ваш новый пароль',
      showPassword: 'Показать пароль',
      hidePassword: 'Скрыть пароль',
      saveChanges: 'Сохранить изменения',
      saving: 'Сохранение...',
      cancel: 'Отмена',
      accountInfo: 'Информация аккаунта',
      tier: 'Пакет',
      loginMethod: 'Способ входа',
      linkedinUsername: 'Имя пользователя LinkedIn',
      joinDate: 'Дата регистрации',
      lastLogin: 'Последний вход',
      // Error messages
      loadingProfile: 'Загрузка профиля...',
      profileLoadError: 'Произошла ошибка при загрузке профиля',
      systemError: 'Произошла системная ошибка',
      validationNameRequired: 'Полное имя обязательно',
      validationEmailRequired: 'Адрес электронной почты обязателен',
      validationEmailInvalid: 'Пожалуйста, введите действительный адрес электронной почты',
      validationCurrentPasswordRequired: 'Введите текущий пароль для смены пароля',
      validationNewPasswordRequired: 'Новый пароль обязателен',
      validationPasswordLength: 'Пароль должен содержать не менее 6 символов',
      validationPasswordsNotMatch: 'Пароли не совпадают',
      profileUpdateSuccess: 'Профиль успешно обновлен',
      profileUpdateError: 'Произошла ошибка при обновлении профиля',
      // Tier names
      freeTier: 'Бесплатный',
      mediumTier: 'Средний',
      popularTier: 'Популярный',
      premiumTier: 'Премиум',
      // Login methods
      emailLogin: 'Электронная почта',
      googleLogin: 'Google',
      linkedinLogin: 'LinkedIn',
      createdCVs: 'Созданные резюме'
    }
  };

  const content = labels[siteLanguage];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Load user profile - wrapped in useCallback to fix dependency issue
  const loadProfile = useCallback(async () => {
    try {
      // Check multiple possible token names
      let token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      console.log('✅ Token found, loading profile...');

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.log('❌ Token expired or invalid, redirecting to login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded successfully');
        setProfile(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          currentPassword: '', // Həmişə boş başlasın
          newPassword: '',     // Həmişə boş başlasın
          confirmPassword: ''  // Həmişə boş başlasın
        });
      } else {
        console.error('❌ Failed to load profile:', response.status);
        setError(content.profileLoadError);
      }
    } catch (error) {
      console.error('❌ Profile load error:', error);
      setError(content.systemError);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load user profile
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validate password fields if changing password
    if (showPasswordSection) {
      if (!formData.currentPassword) {
        setError(content.validationCurrentPasswordRequired);
        setSaving(false);
        return;
      }
      if (!formData.newPassword) {
        setError(content.validationNewPasswordRequired);
        setSaving(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError(content.validationPasswordsNotMatch);
        setSaving(false);
        return;
      }
      if (formData.newPassword.length < 8) {
        setError(content.validationPasswordLength);
        setSaving(false);
        return;
      }
    }

    try {
      // Use the same token checking logic as in loadProfile
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found during update, redirecting to login');
        router.push('/auth/login');
        return;
      }

      const updateData: any = {
        name: formData.name,
        email: formData.email
      };

      // Add password fields if changing password
      if (showPasswordSection) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.status === 401) {
        console.log('❌ Token expired during update, redirecting to login');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('token');
        router.push('/auth/login');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSuccess(content.profileUpdateSuccess);
        setProfile(data.user);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordSection(false);
        
        // Clear password visibility states when passwords are cleared
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } else {
        setError(data.message || content.profileUpdateError);
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      setError(content.systemError);
    } finally {
      setSaving(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const tierColors = {
      'Free': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'Premium': 'bg-purple-100 text-purple-800'
    };
    return tierColors[tier as keyof typeof tierColors] || 'bg-gray-100 text-gray-800';
  };

  const getTierName = (tier: string) => {
    const tierNames = {
      'Free': content.freeTier,
      'Medium': content.mediumTier,
      'Popular': content.popularTier,
      'Premium': content.premiumTier
    };
    return tierNames[tier as keyof typeof tierNames] || tier;
  };

  const getLoginMethodDisplay = (method: string) => {
    const methodNames = {
      'email': content.emailLogin,
      'google': content.googleLogin,
      'linkedin': content.linkedinLogin
    };
    return methodNames[method as keyof typeof methodNames] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">{content.loadingProfile}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <StandardHeader />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{profile?.name}</h2>
                <p className="text-blue-100">{profile?.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierBadge(profile?.tier || 'Free')}`}>
                    {getTierName(profile?.tier || 'Free')}
                  </span>
                  {profile?.loginMethod === 'linkedin' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {content.linkedinLogin} {siteLanguage === 'azerbaijani' ? 'hesabı' : 'account'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {success}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.fullName}
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={content.fullNamePlaceholder}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onInvalid={(e) => {
                      (e.target as HTMLInputElement).setCustomValidity(content.validationNameRequired);
                    }}
                    onInput={(e) => {
                      (e.target as HTMLInputElement).setCustomValidity('');
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {content.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={content.emailPlaceholder}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onInvalid={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.validity.valueMissing) {
                        target.setCustomValidity(content.validationEmailRequired);
                      } else if (target.validity.typeMismatch) {
                        target.setCustomValidity(content.validationEmailInvalid);
                      }
                    }}
                    onInput={(e) => {
                      (e.target as HTMLInputElement).setCustomValidity('');
                    }}
                  />
                </div>
              </div>

              {/* Account Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{content.accountInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.tier}
                    </label>
                    <div className={`inline-flex px-4 py-2 rounded-lg text-sm font-medium ${getTierBadge(profile?.tier || 'Free')}`}>
                      {getTierName(profile?.tier || 'Free')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.loginMethod}
                    </label>
                    <div className="flex items-center space-x-2">
                      {profile?.loginMethod === 'linkedin' ? (
                        <>
                          <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span className="text-sm text-gray-600">{getLoginMethodDisplay('linkedin')}</span>
                          {profile?.linkedinUsername && (
                            <span className="text-sm text-gray-400">(@{profile.linkedinUsername})</span>
                          )}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-sm text-gray-600">{getLoginMethodDisplay('email')} {siteLanguage === 'azerbaijani' ? 'və Şifrə' : siteLanguage === 'english' ? 'and Password' : 'и Пароль'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Section - Only for email users */}
              {profile?.loginMethod !== 'linkedin' && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{content.passwordSection}</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newState = !showPasswordSection;
                        setShowPasswordSection(newState);
                        
                        // Şifrə bölməsi bağlanarkən və ya açılarkən sahələri təmizlə
                        setFormData({
                          ...formData,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        
                        // Şifrə görünürlük state-lərini də sıfırla
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showPasswordSection ? content.cancel : content.changePassword}
                    </button>
                  </div>

                  {showPasswordSection && (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          {content.currentPassword}
                        </label>
                        <div className="relative">
                          <input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={content.currentPasswordPlaceholder}
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            title={showCurrentPassword ? content.hidePassword : content.showPassword}
                          >
                            {showCurrentPassword ? (
                              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            {content.newPassword}
                          </label>
                          <div className="relative">
                            <input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder={content.newPasswordPlaceholder}
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              title={showNewPassword ? content.hidePassword : content.showPassword}
                            >
                              {showNewPassword ? (
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            {content.confirmPassword}
                          </label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                              placeholder={content.confirmPasswordPlaceholder}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              title={showConfirmPassword ? content.hidePassword : content.showPassword}
                            >
                              {showConfirmPassword ? (
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Statistics */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {siteLanguage === 'azerbaijani' ? 'Hesab Statistikaları' : 
                   siteLanguage === 'english' ? 'Account Statistics' : 
                   'Статистика аккаунта'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{(profile as any)?.cvCount || 0}</div>
                    <div className="text-sm text-gray-600">{content.createdCVs}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(
                        siteLanguage === 'azerbaijani' ? 'az-AZ' : 
                        siteLanguage === 'english' ? 'en-US' : 
                        'ru-RU'
                      ) : '—'}
                    </div>
                    <div className="text-sm text-gray-600">{content.joinDate}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString(
                        siteLanguage === 'azerbaijani' ? 'az-AZ' : 
                        siteLanguage === 'english' ? 'en-US' : 
                        'ru-RU'
                      ) : '—'}
                    </div>
                    <div className="text-sm text-gray-600">{content.lastLogin}</div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  {content.cancel}
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {content.saving}
                    </>
                  ) : (
                    content.saveChanges
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
