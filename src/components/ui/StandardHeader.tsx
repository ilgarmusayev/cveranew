'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { useState, useEffect, useCallback } from 'react';

export default function StandardHeader() {
  const { user, logout, fetchCurrentUser } = useAuth();
  const { siteLanguage, setSiteLanguage, getLanguageDisplay } = useSiteLanguage();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [userTier, setUserTier] = useState<string>('Free');
  const [tierLoading, setTierLoading] = useState(false);

  // State for subscription details
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Function to fetch latest user tier information
  const refreshUserTier = useCallback(async () => {
    if (!user) return;

    setTierLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/user/limits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        const newTier = userData.tier || 'Free';
        setUserTier(newTier);

        // Store subscription details for expiration dates
        setSubscriptionDetails(userData);

        // Also update the main user context if tier changed
        if (user.tier !== newTier) {
          await fetchCurrentUser();
        }
      }
    } catch (error) {
      console.error('Error refreshing user tier:', error);
    } finally {
      setTierLoading(false);
    }
  }, [user, fetchCurrentUser]);

  // Set initial tier from user object
  useEffect(() => {
    if (user?.tier) {
      setUserTier(user.tier);
    }
  }, [user?.tier]);

  // Auto-refresh tier every 30 seconds when profile menu is open
  useEffect(() => {
    if (!isProfileMenuOpen || !user) return;

    // Immediate refresh when menu opens
    refreshUserTier();

    // Set up interval for periodic refresh
    const interval = setInterval(refreshUserTier, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isProfileMenuOpen, user, refreshUserTier]);

  // Listen for storage events to refresh tier when subscription changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscriptionUpdated' || e.key === 'tierUpdated') {
        refreshUserTier();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUserTier]);

  // Handle clicks outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const languageMenu = document.querySelector('[data-language-menu]');
      const profileMenu = document.querySelector('[data-profile-menu]');
      
      if (languageMenu && !languageMenu.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
      
      if (profileMenu && !profileMenu.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Header mətnləri
  const labels = {
    azerbaijani: {
      dashboard: 'İdarəetmə Paneli',
      newCV: 'Yeni CV',
      templates: 'Şablonlar',
      pricing: 'Qiymətlər',
      profile: 'Profil',
      profileEdit: 'Profil Redaktəsi',
      profileEditDesc: 'Şəxsi məlumatlarınızı dəyişin',
      welcome: 'Xoş gəlmisiniz',
      logout: 'Çıxış',
      login: 'Giriş',
      register: 'Qeydiyyat',
      myCVs: 'CV-lərim',
      linkedinImport: 'LinkedIn İdxal',
      user: 'İstifadəçi',
      loadingUser: 'Yüklənir...',
      selectLanguage: 'Dil seçin',
      signOutAccount: 'Hesabdan çıxış edin',
      signOut: 'Hesabdan çıxın'
    },
    english: {
      dashboard: 'Dashboard',
      newCV: 'New CV',
      templates: 'Templates',
      pricing: 'Pricing',
      profile: 'Profile',
      profileEdit: 'Edit Profile',
      profileEditDesc: 'Change your personal information',
      welcome: 'Welcome',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      myCVs: 'My CVs',
      linkedinImport: 'LinkedIn Import',
      user: 'User',
      loadingUser: 'Loading...',
      selectLanguage: 'Select Language',
      signOutAccount: 'Sign out of your account',
      signOut: 'Sign out'
    },
    russian: {
      dashboard: 'Панель',
      newCV: 'Новое резюме',
      templates: 'Шаблоны',
      pricing: 'Тарифы',
      profile: 'Профиль',
      profileEdit: 'Редактировать профиль',
      profileEditDesc: 'Изменить личную информацию',
      welcome: 'Добро пожаловать',
      logout: 'Выход',
      login: 'Вход',
      register: 'Регистрация',
      myCVs: 'Мои резюме',
      linkedinImport: 'Импорт LinkedIn',
      user: 'Пользователь',
      loadingUser: 'Загружается...',
      selectLanguage: 'Выберите язык',
      signOutAccount: 'Выйти из аккаунта',
      signOut: 'Выйти'
    }
  };

  const content = labels[siteLanguage];

  const handleLogout = async () => {
    try {
      console.log('🚪 StandardHeader: Logout butonuna basıldı');
      console.log('🚪 StandardHeader: Logout funksiyasını çağırıram...');

      logout(); // Remove await - logout function handles everything internally

      console.log('🚪 StandardHeader: Logout funksiyası çağırıldı');
      // Remove any additional redirects - logout() already handles redirection
    } catch (error) {
      console.error('❌ StandardHeader: Logout error:', error);
      // Fallback redirect only if logout completely fails
      window.location.href = '/auth/login';
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  const toggleLanguageMenu = () => {
    console.log('🌐 Language menu toggled. Current state:', isLanguageMenuOpen);
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
  };

  const closeLanguageMenu = () => {
    setIsLanguageMenuOpen(false);
  };

  const handleLanguageChange = (language: string) => {
    console.log('🔄 Language changed to:', language);
    setSiteLanguage(language as any);
    setIsLanguageMenuOpen(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileMenuOpen]);

  // Close mobile menu with ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen || isProfileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isMobileMenuOpen, isProfileMenuOpen]);

  // Function to get display name for tier
  const getTierDisplayName = (tier: string) => {
    const tierNames: { [key: string]: string } = {
      'Free': 'Pulsuz',
      'Pro': 'Populyar',
      'Premium': 'Premium',
      'Medium': 'Populyar', // Legacy support
      'Orta': 'Populyar'    // Legacy support
    };
    return tierNames[tier] || tier;
  };

  // Function to get tier badge color
  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'Free':
        return 'bg-gray-100 text-gray-800';
      case 'Pro':
      case 'Medium':
      case 'Orta':
        return 'bg-blue-100 text-blue-800';
      case 'Premium':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format expiration date
  const formatExpirationDate = (dateString: string) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return 'Bitib';
      } else if (diffDays === 0) {
        return 'Bu gün bitir';
      } else if (diffDays === 1) {
        return '1 gün qalıb';
      } else if (diffDays <= 30) {
        return `${diffDays} gün qalıb`;
      } else {
        return date.toLocaleDateString('az-AZ', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (error) {
      return null;
    }
  };

  // Function to get subscription expiration info
  const getSubscriptionExpiration = () => {
    if (!subscriptionDetails || userTier === 'Free') return null;

    // Check if user has active subscription
    const activeSubscription = subscriptionDetails.subscriptions?.find(
      (sub: any) => sub.status === 'active' && sub.tier === userTier
    );

    if (activeSubscription?.expiresAt) {
      return formatExpirationDate(activeSubscription.expiresAt);
    }

    // Fallback: check subscription end date from user data
    if (subscriptionDetails.subscriptionEndDate) {
      return formatExpirationDate(subscriptionDetails.subscriptionEndDate);
    }

    return null;
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 top-0 z-[100000] shadow-lg">
      {/* Enhanced responsive container with better edge spacing */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex justify-between items-center h-16 sm:h-18 md:h-20">
          {/* Logo - Fixed sizing */}
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/cveralogo-2.png"
              alt="CVera Logo"
              className="h-8 sm:h-9 md:h-10 w-auto"
              style={{ maxWidth: '140px', height: 'auto' }}
            />
          </Link>

          {/* Navigation Menu - Better responsive spacing */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            <Link href="/dashboard" className="text-white/90 hover:text-white font-medium transition-colors text-sm lg:text-base">
              {content.dashboard}
            </Link>
            <Link href="/cv-list" className="text-white/90 hover:text-white font-medium transition-colors text-sm lg:text-base">
              {content.myCVs}
            </Link>
            <Link href="/linkedin-import" className="text-white/90 hover:text-white font-medium transition-colors text-sm lg:text-base">
              {content.linkedinImport}
            </Link>
            <Link href="/templates" className="text-white/90 hover:text-white font-medium transition-colors text-sm lg:text-base">
              {content.templates}
            </Link>
            <Link href="/pricing" className="text-white/90 hover:text-white font-medium transition-colors text-sm lg:text-base">
              {content.pricing}
            </Link>
          </nav>

          {/* User Info & Profile Dropdown - Enhanced responsive design */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Language Dropdown - positioned before profile */}
            <div className="relative" data-language-menu>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 Language button clicked');
                  toggleLanguageMenu();
                }}
                className="flex items-center px-3 py-2 text-xs lg:text-sm font-medium text-white bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all duration-200"
                title="Dili dəyişdir / Change language / Изменить язык"
              >
                <span className="mr-1 lg:mr-2 text-sm">
                  {getLanguageDisplay(siteLanguage).flag}
                </span>
                <span className="hidden sm:inline">
                  {getLanguageDisplay(siteLanguage).code}
                </span>
            
                <svg 
                  className={`w-3 h-3 ml-1 transition-transform duration-200 ${isLanguageMenuOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Language Dropdown Menu */}
              {isLanguageMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-2xl border-2 border-red-500 py-1 z-[9999]">
                  <div className="px-3 py-2 text-xs text-red-600 font-bold border-b border-gray-100">
                   {content.selectLanguage}
                  </div>
                  
                  {(['azerbaijani', 'english', 'russian'] as const).map((lang) => {
                    const langData = getLanguageDisplay(lang);
                    return (
                      <button
                        key={lang}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🌐 Language option clicked:', lang);
                          handleLanguageChange(lang);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                          siteLanguage === lang ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-lg">{langData.flag}</span>
                        <div className="flex-1">
                          <div className="font-medium">{langData.name}</div>
                          <div className="text-xs text-gray-500">{langData.code}</div>
                        </div>
                        {siteLanguage === lang && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Dropdown - Desktop */}
            <div className="hidden lg:block relative" data-profile-menu>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 xl:space-x-3 bg-white/10 backdrop-blur-sm px-3 xl:px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                <div className="w-7 h-7 xl:w-8 xl:h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                  <span className="text-white text-xs xl:text-sm font-medium">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-sm xl:text-base">
                  <p className="font-medium text-white">{content.welcome}!</p>
                  <p className="text-blue-100 -mt-1 text-xs xl:text-sm">
                    {user?.name === 'Loading...' || user?.name === 'Yüklənir...' || user?.name === 'Загружается...' 
                      ? content.loadingUser 
                      : (user?.name || user?.email || content.user)
                    }
                  </p>
                </div>
                <svg
                  className={`w-3 h-3 xl:w-4 xl:h-4 text-white/70 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Desktop Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-3 z-50 overflow-hidden">
                  {/* User Info in Dropdown */}
                  <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-lg font-bold">
                          {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {user?.name === 'Loading...' || user?.name === 'Yüklənir...' || user?.name === 'Загружается...' 
                            ? content.loadingUser 
                            : (user?.name || content.user)
                          }
                        </p>
                        <p className="text-gray-500 text-xs">{user?.email}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTierBadgeColor(userTier)}`}>
                            {getTierDisplayName(userTier)}
                          </span>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Profile Edit Link */}
                    <Link
                      href="/profile/edit"
                      onClick={closeProfileMenu}
                      className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{content.profileEdit}</p>
                        <p className="text-xs text-gray-500">{content.profileEditDesc}</p>
                      </div>
                    </Link>


                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Logout Button in Dropdown */}
                    <button
                      onClick={() => {
                        console.log('🔴 LOGOUT FROM DROPDOWN - TEST');
                        closeProfileMenu();
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 bg-blue-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center mr-3 transition-colors">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-black text-left">{content.logout}</p>
                        <p className="text-xs text-gray-500">{content.signOutAccount}</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile/Tablet Profile Button - Simplified for smaller screens */}
            <div className="lg:hidden relative" data-profile-menu>



            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full bg-gradient-to-r from-blue-600 to-blue-700 border-t border-blue-500/50 shadow-xl">
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Navigation Links */}

              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="block py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                {content.dashboard}
              </Link>
              <Link
                href="/cv-list"
                onClick={closeMobileMenu}
                className="block py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                {content.myCVs}
              </Link>
              <Link
                href="/linkedin-import"
                onClick={closeMobileMenu}
                className="block py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                {content.linkedinImport}
              </Link>
              <Link
                href="/templates"
                onClick={closeMobileMenu}
                className="block py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                {content.templates}
              </Link>
              <Link
                href="/pricing"
                onClick={closeMobileMenu}
                className="block py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg font-medium transition-all"
              >
                {content.pricing}
              </Link>

              {/* Mobile User Profile */}
              <div className="border-t border-white/20 pt-3 mt-3">
                <Link
                  href="/profile/edit"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-3 py-3 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                    <span className="text-white text-sm font-medium">
                      {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{content.profile}</p>
                    <p className="text-blue-100 text-xs">
                      {user?.name === 'Loading...' || user?.name === 'Yüklənir...' || user?.name === 'Загружается...' 
                        ? content.loadingUser 
                        : (user?.name || user?.email || content.user)
                      }
                    </p>
                  </div>
                </Link>

                {/* Mobile Logout Button */}
                <button
                  onClick={() => {
                    console.log('🔴 MOBILE LOGOUT CLICKED - TEST');
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="flex items-center space-x-3 py-3 px-4 text-white hover:text-white hover:bg-blue-500/10 rounded-lg transition-all w-full mt-2"
                >
                  <div className="w-8 h-8 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-400/30">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-left text-white text-sm">{content.logout}</p>
                    <p className="text-gray-300 text-xs">{content.signOut}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
