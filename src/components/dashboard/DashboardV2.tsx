'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface CV {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface UserLimits {
  tier: string;
  limits: {
    cvCount: number;
    templatesAccess: string[];
    dailyLimit: number | null;
    aiFeatures: boolean;
    limitType: string;
  };
  usage: {
    cvCount: number;
    dailyUsage: number;
    hasReachedLimit: boolean;
    remainingLimit: number;
  };
  subscription: any | null;
}

interface DashboardV2Props {
  user: User;
  onEditCV: (cvId: string) => void;
}

export default function DashboardV2({ user, onEditCV }: DashboardV2Props) {
  const { siteLanguage } = useSiteLanguage();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { logout, fetchCurrentUser } = useAuth();

  // Dashboard mətnləri
  const labels = {
    azerbaijani: {
      dashboardTitle: 'İdarəetmə Paneli',
      manageCVs: 'Peşəkar CV-lərinizi idarə edin',
      refresh: 'Yeniləyin',
      refreshing: 'Yenilənir...',
      refreshData: 'Məlumatları yeniləyin',
      subscription: 'Abunəlik',
      free: 'Pulsuz',
      pro: 'Populyar',
      premium: 'Premium',
      upgrade: 'Yeniləyin',
      limit: 'Limit',
      totalLimit: 'Ümumi Limit',
      dailyLimit: 'Günlük Limit',
      totalRemaining: 'Ümumi qalan',
      dailyRemaining: 'Bu gün qalan',
      unlimitedUsage: 'Limitsiz istifadə',
      linkedinImport: 'LinkedIn İdxal',
      autoProfileImport: 'Avtomatik profil İdxalı',
      linkedinImportButton: 'LinkedIn profilinizi idxal edin',
      linkedinDescription: 'LinkedIn profilinizi bir kliklə idxal edin və avtomatik olaraq CV yaradın. Sürətli və təhlükəsiz!',
      autoDataFill: 'Avtomatik məlumat doldurma',
      workExperience: 'İş təcrübəsi və təhsil',
      skillsCompetencies: 'Bacarıqlar və kompetensiyalar',
      manualCV: 'Yeni CV',
      createFromScratch: 'Sıfırdan CV yaradın',
      manualDescription: 'Bütün məlumatları əl ilə daxil edərək peşəkar CV yaradın. Tam nəzarət sizin əlinizdədir!',
      fullControl: 'Tam nəzarət',
      professionalDesign: 'Peşəkar dizayn',
      customizable: 'Özəlləşdirə bilən',
      startCreating: 'Yeni CV yaratmağa başlayın',
      coverLetter: 'Cover Letter',
      createCoverLetter: 'Cover Letter yaradın',
      coverLetterDescription: 'CV-nizə əsaslanan peşəkar cover letter yaradın. İş müraciətinizi gücləndirin!',
      personalizedContent: 'Şəxsiləşdirilmiş məzmun',
      professionalFormat: 'Peşəkar format',
      quickGeneration: 'Sürətli yaradılma',
      startCreatingCL: 'Cover Letter yaradın',
      myCVs: 'CV-lər',
      created: 'Yaradılıb',
      lastUpdated: 'Son yenilənmə',
      edit: 'Redaktə edin',
      viewAll: 'Bütün CV-ləri görün',
      dateError: 'Tarix xətası',
      noPremiumSubscription: 'Premium abunəlik yoxdur',
      daysRemaining: 'gün qalıb',
      noCVs: 'Hələ CV yaratmamısınız',
      createFirstCV: 'İlk CV-nizi yaratmaq üçün yuxarıdakı seçimlərdən birini seçin.',
      viewMore: 'Daha çox CV görün',
      subscriptionExpired: '⏰ Abunəlik bitib',
      expiresOnDay: '⚠️ Bu gün bitir'
    },
    english: {
      dashboardTitle: 'Dashboard',
      manageCVs: 'Manage your professional CVs',
      refresh: 'Refresh',
      refreshing: 'Refreshing...',
      refreshData: 'Refresh data',
      subscription: 'Subscription',
      free: 'Free',
      pro: 'Pro',
      premium: 'Premium',
      upgrade: 'Upgrade',
      limit: 'Limit',
      totalLimit: 'Total Limit',
      dailyLimit: 'Daily Limit',
      totalRemaining: 'Total remaining',
      dailyRemaining: 'Remaining today',
      unlimitedUsage: 'Unlimited usage',
      linkedinImport: 'LinkedIn Import',
      autoProfileImport: 'Automatic profile import',
      linkedinImportButton: 'Import your LinkedIn profile',
      linkedinDescription: 'Import your LinkedIn profile with one click and automatically create a CV. Fast and secure!',
      autoDataFill: 'Automatic data filling',
      workExperience: 'Work experience and education',
      skillsCompetencies: 'Skills and competencies',
      manualCV: 'New CV',
      createFromScratch: 'Create CV from scratch',
      manualDescription: 'Create a professional CV by manually entering all data. Full control is in your hands!',
      fullControl: 'Full control',
      professionalDesign: 'Professional design',
      customizable: 'Customizable',
      coverLetter: 'Cover Letter',
      createCoverLetter: 'Create cover letter',
      coverLetterDescription: 'Create a professional cover letter based on your CV. Strengthen your job application!',
      personalizedContent: 'Personalized content',
      professionalFormat: 'Professional format',
      quickGeneration: 'Quick generation',
      startCreatingCL: 'Create cover letter',
      startCreating: 'Start creating new CV',
      myCVs: 'My CVs',
      created: 'Created',
      lastUpdated: 'Last updated',
      edit: 'Edit',
      viewAll: 'View all CVs',
      dateError: 'Date error',
      noPremiumSubscription: 'No premium subscription',
      daysRemaining: 'days remaining',
      noCVs: 'You haven\'t created any CVs yet',
      createFirstCV: 'Choose one of the options above to create your first CV.',
      viewMore: 'View more CVs',
      subscriptionExpired: '⏰ Subscription expired',
      expiresOnDay: '⚠️ Expires today'
    },
    russian: {
      dashboardTitle: 'Панель управления',
      manageCVs: 'Управляйте своими профессиональными резюме',
      refresh: 'Обновить',
      refreshing: 'Обновление...',
      refreshData: 'Обновить данные',
      subscription: 'Подписка',
      free: 'Бесплатно',
      pro: 'Про',
      premium: 'Премиум',
      upgrade: 'Улучшить',
      limit: 'Лимит',
      totalLimit: 'Общий лимит',
      dailyLimit: 'Дневной лимит',
      totalRemaining: 'Всего осталось',
      dailyRemaining: 'Осталось сегодня',
      unlimitedUsage: 'Безлимитное использование',
      linkedinImport: 'Импорт LinkedIn',
      autoProfileImport: 'Автоматический импорт профиля',
      linkedinImportButton: 'Импортировать ваш профиль LinkedIn',
      linkedinDescription: 'Импортируйте свой профиль LinkedIn одним кликом и автоматически создайте резюме. Быстро и безопасно!',
      autoDataFill: 'Автоматическое заполнение данных',
      workExperience: 'Опыт работы и образование',
      skillsCompetencies: 'Навыки и компетенции',
      manualCV: 'Новое резюме',
      createFromScratch: 'Создать резюме с нуля',
      manualDescription: 'Создайте профессиональное резюме, вручную введя все данные. Полный контроль в ваших руках!',
      fullControl: 'Полный контроль',
      professionalDesign: 'Профессиональный дизайн',
      customizable: 'Настраиваемый',
      coverLetter: 'Cover Letter',
      createCoverLetter: 'Создать сопроводительное письмо',
      coverLetterDescription: 'Создайте профессиональное сопроводительное письмо на основе вашего резюме. Усильте свою заявку на работу!',
      personalizedContent: 'Персонализированный контент',
      professionalFormat: 'Профессиональный формат',
      quickGeneration: 'Быстрое создание',
      startCreatingCL: 'Создать сопроводительное письмо',
      startCreating: 'Начать создание нового резюме',
      myCVs: 'Мои резюме',
      created: 'Создано',
      lastUpdated: 'Последнее обновление',
      edit: 'Редактировать',
      viewAll: 'Посмотреть все резюме',
      dateError: 'Ошибка даты',
      noPremiumSubscription: 'Нет премиум подписки',
      daysRemaining: 'дней осталось',
      noCVs: 'Вы еще не создали ни одного резюме',
      createFirstCV: 'Выберите один из вариантов выше, чтобы создать свое первое резюме.',
      viewMore: 'Посмотреть больше резюме',
      subscriptionExpired: '⏰ Подписка истекла',
      expiresOnDay: '⚠️ Истекает сегодня'
    }
  };

  const content = labels[siteLanguage];

  // Use user prop to display user info if needed
  console.log('Dashboard user:', user?.email, 'tier:', user?.tier);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Dashboard: CV-ləri yükləyirəm...');

      // Check if token exists
      const token = localStorage.getItem('accessToken');
      console.log('🔍 Dashboard: Token mövcudluğu:', token ? 'VAR' : 'YOXDUR');

      if (!token) {
        console.log('❌ Dashboard: Token yoxdur, login səhifəsinə yönləndirəcəm');
        router.push('/auth/login');
        return;
      }

      console.log('📡 Dashboard: API sorğusu göndərilir...');

      try {
        const [cvsResponse, limitsResponse] = await Promise.all([
          apiClient.get('/api/cv'),
          apiClient.get('/api/user/limits')
        ]);

        console.log('📥 Dashboard: CV API tam cavabı:', cvsResponse);
        console.log('📥 Dashboard: Limits API cavabı:', limitsResponse);

        // Handle different response formats
        let cvsArray = [];
        if (cvsResponse.data && cvsResponse.data.cvs) {
          cvsArray = cvsResponse.data.cvs;
        } else if (Array.isArray(cvsResponse.data)) {
          cvsArray = cvsResponse.data;
        } else {
          console.log('⚠️ Dashboard: Gözlənilməz CV response formatı');
          cvsArray = [];
        }

        console.log('📥 Dashboard: Çıxarılan CV sayı:', cvsArray.length);
        setCvs(cvsArray);

        console.log('📥 Dashboard: Limits data:', limitsResponse.data);
        setUserLimits(limitsResponse.data);

      } catch (apiError) {
        console.error('❌ Dashboard API Error:', apiError);

        // Handle specific API errors
        if (apiError instanceof Error) {
          if (apiError.message.includes('401') || apiError.message.includes('Autentifikasiya')) {
            console.log('🔐 Dashboard: Authentication error, redirecting to login');
            router.push('/auth/login');
            return;
          } else if (apiError.message.includes('Server error')) {
            console.log('🔥 Dashboard: Server error detected, setting fallback data');
            // Set fallback data to prevent complete failure
            setUserLimits({
              tier: 'Free',
              limits: {
                cvCount: 2,
                templatesAccess: ['Basic'],
                dailyLimit: 0,
                aiFeatures: false,
                limitType: 'total'
              },
              usage: {
                cvCount: 0,
                dailyUsage: 0,
                hasReachedLimit: false,
                remainingLimit: 2
              },
              subscription: null
            });
            setCvs([]);
          }
        }

        // Don't throw the error, just log it and continue with fallback data
        console.log('📱 Dashboard: Continuing with fallback data due to API error');
      }

    } catch (error: unknown) {
      console.error('❌ Dashboard general error:', error);
      // Set fallback data even for general errors
      setUserLimits({
        tier: 'Free',
        limits: {
          cvCount: 2,
          templatesAccess: ['Basic'],
          dailyLimit: 0,
          aiFeatures: false,
          limitType: 'total'
        },
        usage: {
          cvCount: 0,
          dailyUsage: 0,
          hasReachedLimit: false,
          remainingLimit: 2
        },
        subscription: null
      });
      setCvs([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Manual refresh function to update user data and dashboard
  const handleRefreshUserData = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Manual refresh: Updating user data...');
      
      // Refresh user data in auth context first
      await fetchCurrentUser();
      
      // Then refresh dashboard data
      await fetchDashboardData();
      
      console.log('✅ Manual refresh: Complete');
    } catch (error) {
      console.error('❌ Manual refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);

      // Set timeout to 1 second as requested
      setTimeout(() => {
        logout();
      }, 1000);

    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect only if logout completely fails
      window.location.href = '/auth/login';
    } finally {
      // Clear loading after 1.5 seconds to ensure logout completes
      setTimeout(() => {
        setLogoutLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen">
      <StandardHeader />

      {/* Main Content with Enhanced Responsive Container - Even Better Edge Spacing */}
      <div className="w-full max-w-full mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 lg:py-16">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {content.dashboardTitle}
            </h1>
           
          </div>
          <span className="block text-2xl font-normal text-gray-600 mt-2">{content.manageCVs}</span>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mt-4"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-600">
            <div className="flex items-center justify-between min-h-[100px]">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-2">{content.subscription}</p>
                <p className="text-2xl font-bold text-blue-900">
                  {loading || !userLimits ? '...' : (() => {
                    const tier = userLimits?.tier;
                    if (tier === 'Free') return content.free;
                    if (tier === 'Medium' || tier === 'Pro') return content.pro;
                    if (tier === 'Premium' || tier === 'Business') return content.premium;
                    return content.free;
                  })()}
                </p>
                {/* Subscription Expiration Info - Enhanced Display */}
                {!loading && userLimits?.subscription?.expiresAt && userLimits?.tier !== 'Free' && (
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    {(() => {
                      try {
                        const expiresAt = new Date(userLimits.subscription.expiresAt);
                        const now = new Date();

                        console.log('🗓️ Subscription expires at:', expiresAt);
                        console.log('🗓️ Current time:', now);
                        console.log('🗓️ Raw subscription data:', userLimits.subscription);

                        // Make sure we're comparing at the same time (end of day vs start of day)
                        const expiresDate = new Date(expiresAt.getFullYear(), expiresAt.getMonth(), expiresAt.getDate());
                        const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                        const diffTime = expiresDate.getTime() - nowDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        console.log('🗓️ Days difference:', diffDays);

                        if (diffDays < 0) {
                          return content.subscriptionExpired;
                        } else if (diffDays === 0) {
                          return content.expiresOnDay;
                        } else if (diffDays === 1) {
                          return `📅 1 ${content.daysRemaining}`;
                        } else if (diffDays <= 30) {
                          return `📅 ${diffDays} ${content.daysRemaining}`;
                        } else {
                          return `📅 ${diffDays} ${content.daysRemaining}`;
                        }
                      } catch (error) {
                        console.error('🗓️ Date calculation error:', error);
                        return `❌ ${content.dateError}`;
                      }
                    })()}
                  </p>
                )}
                {/* Show message for free users or users without subscription */}
                {!loading && (!userLimits?.subscription?.expiresAt || userLimits?.tier === 'Free') && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 {content.noPremiumSubscription}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center ml-6">
                <button
                  onClick={() => router.push('/pricing')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {content.upgrade}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-600">
            <div className="flex items-center justify-between min-h-[100px]">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  {loading || !userLimits ? content.limit : (
                    userLimits?.limits.limitType === 'total' ? content.totalLimit :
                    userLimits?.limits.limitType === 'daily' ? content.dailyLimit :
                    content.limit
                  )}
                </p>
                <p className="text-2xl font-bold text-blue-900 mb-2">
                  {loading || !userLimits ? '...' : (
                    userLimits?.limits.limitType === 'total'
                      ? (() => {
                          // For free plan (total limit), show current/total format
                          if (userLimits?.tier === 'Free' || userLimits?.tier === 'Pulsuz') {
                            return `${userLimits?.usage.cvCount}/${userLimits?.limits.cvCount}`;
                          }
                          // For other plans, keep the old format
                          return `${userLimits?.usage.remainingLimit}/${userLimits?.limits.cvCount}`;
                        })()
                      : userLimits?.limits.limitType === 'daily'
                        ? `${userLimits?.usage.dailyUsage}/${userLimits?.limits.dailyLimit}`
                        : '∞'
                  )}
                </p>
                <p className="text-xs text-gray-600">
                  {loading || !userLimits ? '...' : (
                    userLimits?.limits.limitType === 'total' ? content.totalRemaining :
                    userLimits?.limits.limitType === 'daily' ? content.dailyRemaining :
                    content.unlimitedUsage
                  )}
                </p>
              </div>
              <div className="flex items-center justify-center ml-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* LinkedIn Import Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{content.linkedinImport}</h3>
                <p className="text-gray-600 mt-1">{content.autoProfileImport}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {content.linkedinDescription}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.autoDataFill}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.workExperience}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.skillsCompetencies}
              </div>
            </div>

            {/* Replace the LinkedInAutoImport component with direct implementation */}
            <button
              onClick={() => router.push('/linkedin-import')}
              className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 border-2 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">{content.linkedinImportButton}</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Manual CV Creation Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{content.manualCV}</h3>
                <p className="text-gray-600 mt-1">{content.createFromScratch}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {content.manualDescription}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.fullControl}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.professionalDesign}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.customizable}
              </div>
            </div>

            <button
              onClick={() => router.push('/new')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-6 py-4 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">{content.startCreating}</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Cover Letter Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{content.coverLetter}</h3>
                <p className="text-gray-600 mt-1">{content.createCoverLetter}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              {content.coverLetterDescription}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.personalizedContent}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.professionalFormat}
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.quickGeneration}
              </div>
            </div>

            <button
              onClick={() => router.push('/coverletter')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-6 py-4 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">{content.startCreatingCL}</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Existing CVs Section */}
        {cvs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{content.myCVs}</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {cvs.length} CV
                </div>
                <Link
                  href="/cv-list"
                  className="text-blue-600 font-medium text-sm flex items-center"
                >
                  {content.viewAll}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cvs.slice(0, 3).map((cv) => (
                <div
                  key={cv.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                  onClick={() => onEditCV(cv.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate max-w-full overflow-hidden whitespace-nowrap">
                        {cv.title}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-4 8v2m0-2v2m0-2h8a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h8z" />
                          </svg>
                          <span className="truncate">{new Date(cv.createdAt).toLocaleDateString('az-AZ')}</span>
                        </p>
                        <p className="flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="truncate">{new Date(cv.updatedAt).toLocaleDateString('az-AZ')}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">CV</span>
                    <span className="text-xs text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                      {content.edit} →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {cvs.length > 3 && (
              <div className="mt-8 text-center">
                <Link
                  href="/cv-list"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
                >
                  {content.viewAll} ({cvs.length})
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
