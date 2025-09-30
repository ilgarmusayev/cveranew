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
      createCV: 'CV Yaradın',
      createCVDescription: 'LinkedIn idxal və ya sıfırdan yaratma',
      newCVCard: 'Yeni CV Yaradın',
      newCVCardSubtitle: 'LinkedIn və ya manual seçimi',
      newCVCardDescription: 'LinkedIn profilinizdən avtomatik idxal və ya sıfırdan manual yaratma arasında seçim edin.',
      newCVCardFeature1: 'Sİ istifadəsi',
      newCVCardFeature2: 'Peşəkar şablonlar',
      newCVCardFeature3: 'Sürətli yaratma',
      newCVCardButton: 'CV Yaratmağa Başla',
      linkedinImport: 'LinkedIn İdxal',
      autoProfileImport: 'Avtomatik profil İdxalı',
      linkedinImportButton: 'LinkedIn profilinizi idxal edin',
      linkedinDescription: 'LinkedIn profilinizi bir kliklə idxal edin və avtomatik olaraq CV yaradın!',
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
      motivationLetter: 'Motivasiya Məktubu',
      createMotivationLetter: 'Motivasiya məktubu yaradın',
      motivationLetterDescription: 'CV-nizə əsaslanan peşəkar motivasiya məktubu yaradın. Müraciətinizi gücləndin!',
      targetedContent: 'Hədəflənmiş məzmun',
      personalizedApproach: 'Şəxsiləşdirilmiş yanaşma',
      academicProfessional: 'Akademik və peşəkar',
      startCreatingML: 'Motivasiya məktubu yaradın',
      jobMatch: 'İş Uyğunluq Analizi',
      createJobMatch: 'CV-ni iş elanı ilə müqayisə edin',
      jobMatchDescription: 'AI ilə CV-nizin iş elanlarına uyğunluğunu analiz edin və peşəkar tövsiyələr alın!',
      compatibilityAnalysis: 'Uyğunluq analizi',
      improvementTips: 'İnkişaf tövsiyələri',
      careerGuidance: 'Karyera bələdçiliyi',
      startJobMatch: 'İş analizi et',
      cvChecker: 'CV Yoxlayıcı',
      createCVChecker: 'CV peşəkarlığınızı yoxlayın',
      cvCheckerDescription: 'AI ilə CV-nizin peşəkarlığını analiz edin və çatışmayan elementləri öyrənin!',
      professionalAnalysis: 'Peşəkar analiz',
      missingElements: 'Çatışmayan elementlər',
      improvementTipsShort: 'İnkişaf məsləhətləri',
      startCVChecker: 'CV-ni yoxla',
      elevatorPitch: '30 Saniyəlik Pitch',
      createElevatorPitch: 'Elevator Pitch yaradın',
      elevatorPitchDescription: 'CV-nizə əsaslanan 30 saniyəlik güclü təqdimat hazırlayın. Özünüzü təsirli şəkildə təqdim edin!',
      impactfulPresentation: 'Təsirli təqdimat',
      quickIntroduction: 'Sürətli tanıtım',
      speechPractice: 'Danışıq məşqi',
      startCreatingEP: 'Elevator Pitch yaradın',
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
      createCV: 'Create CV',
      createCVDescription: 'LinkedIn import or create from scratch',
      newCVCard: 'Create New CV',
      newCVCardSubtitle: 'LinkedIn or manual option',
      newCVCardDescription: 'Choose between automatic LinkedIn import or manual creation from scratch.',
      newCVCardFeature1: 'AI usage',
      newCVCardFeature2: 'Professional templates',
      newCVCardFeature3: 'Quick creation',
      newCVCardButton: 'Start Creating CV',
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
      motivationLetter: 'Motivation Letter',
      createMotivationLetter: 'Create motivation letter',
      motivationLetterDescription: 'Create a professional motivation letter based on your CV. Strengthen your application!',
      targetedContent: 'Targeted content',
      personalizedApproach: 'Personalized approach',
      academicProfessional: 'Academic & professional',
      startCreatingML: 'Create motivation letter',
      jobMatch: 'Job Match Analysis',
      createJobMatch: 'Compare CV with job listings',
      jobMatchDescription: 'Analyze your CV compatibility with job positions using AI and get professional recommendations!',
      compatibilityAnalysis: 'Compatibility analysis',
      improvementTips: 'Improvement tips',
      careerGuidance: 'Career guidance',
      startJobMatch: 'Analyze job match',
      cvChecker: 'CV Checker',
      createCVChecker: 'Check your CV professionalism',
      cvCheckerDescription: 'Analyze your CV professionalism with AI and learn what elements are missing!',
      professionalAnalysis: 'Professional analysis',
      missingElements: 'Missing elements',
      improvementTipsShort: 'Improvement tips',
      startCVChecker: 'Check CV',
      elevatorPitch: '30-Second Pitch',
      createElevatorPitch: 'Create elevator pitch',
      elevatorPitchDescription: 'Prepare a powerful 30-second presentation based on your CV. Present yourself impressively!',
      impactfulPresentation: 'Impactful presentation',
      quickIntroduction: 'Quick introduction',
      speechPractice: 'Speech practice',
      startCreatingEP: 'Create elevator pitch',
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
      createCV: 'Создать CV',
      createCVDescription: 'Импорт LinkedIn или создание с нуля',
      newCVCard: 'Создать новое CV',
      newCVCardSubtitle: 'LinkedIn или ручной вариант',
      newCVCardDescription: 'Выберите между автоматическим импортом LinkedIn или ручным созданием с нуля.',
      newCVCardFeature1: 'Использование ИИ',
      newCVCardFeature2: 'Профессиональные шаблоны',
      newCVCardFeature3: 'Быстрое создание',
      newCVCardButton: 'Начать создание CV',
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
      motivationLetter: 'Мотивационное письмо',
      createMotivationLetter: 'Создать мотивационное письмо',
      motivationLetterDescription: 'Создайте профессиональное мотивационное письмо на основе вашего резюме. Усильте свою заявку!',
      targetedContent: 'Целевой контент',
      personalizedApproach: 'Персонализированный подход',
      academicProfessional: 'Академический и профессиональный',
      startCreatingML: 'Создать мотивационное письмо',
      jobMatch: 'Анализ соответствия работе',
      createJobMatch: 'Сравнить резюме с вакансиями',
      jobMatchDescription: 'Анализируйте совместимость вашего резюме с вакансиями с помощью ИИ и получайте профессиональные рекомендации!',
      compatibilityAnalysis: 'Анализ совместимости',
      improvementTips: 'Советы по улучшению',
      careerGuidance: 'Карьерное руководство',
      startJobMatch: 'Анализировать соответствие',
      cvChecker: 'Проверка резюме',
      createCVChecker: 'Проверьте профессионализм резюме',
      cvCheckerDescription: 'Анализируйте профессионализм вашего резюме с помощью ИИ и узнайте, каких элементов не хватает!',
      professionalAnalysis: 'Профессиональный анализ',
      missingElements: 'Отсутствующие элементы',
      improvementTipsShort: 'Советы по улучшению',
      startCVChecker: 'Проверить резюме',
      elevatorPitch: '30-секундная презентация',
      createElevatorPitch: 'Создать elevator pitch',
      elevatorPitchDescription: 'Подготовьте мощную 30-секундную презентацию на основе вашего резюме. Представьте себя впечатляюще!',
      impactfulPresentation: 'Впечатляющая презентация',
      quickIntroduction: 'Быстрое знакомство',
      speechPractice: 'Практика речи',
      startCreatingEP: 'Создать elevator pitch',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* New CV Creation Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{content.newCVCard}</h3>
                <p className="text-gray-600 text-sm mt-1">{content.newCVCardSubtitle}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {content.newCVCardDescription}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.newCVCardFeature1}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.newCVCardFeature2}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.newCVCardFeature3}
              </div>
            </div>

            <button
              onClick={() => router.push('/create')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-4 py-3 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">{content.newCVCardButton}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Cover Letter Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{content.coverLetter}</h3>
                <p className="text-gray-600 text-sm mt-1">{content.createCoverLetter}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {content.coverLetterDescription}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.personalizedContent}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.professionalFormat}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.quickGeneration}
              </div>
            </div>

            <button
              onClick={() => router.push('/coverletter')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-4 py-3 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">{content.startCreatingCL}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Motivation Letter Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{content.motivationLetter}</h3>
                <p className="text-gray-600 text-sm mt-1">{content.createMotivationLetter}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {content.motivationLetterDescription}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.targetedContent}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.personalizedApproach}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.academicProfessional}
              </div>
            </div>

            <button
              onClick={() => router.push('/motivationletter')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-4 py-3 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">{content.startCreatingML}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Job Match Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{content.jobMatch}</h3>
                <p className="text-gray-600 text-sm mt-1">{content.createJobMatch}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {content.jobMatchDescription}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.compatibilityAnalysis}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.improvementTips}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.careerGuidance}
              </div>
            </div>

            <button
              onClick={() => router.push('/jobmatch')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-4 py-3 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">{content.startJobMatch}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Elevator Pitch Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{content.elevatorPitch}</h3>
                <p className="text-gray-600 text-sm mt-1">{content.createElevatorPitch}</p>
              </div>
            </div>

            <p className="text-gray-700 text-sm mb-4 leading-relaxed">
              {content.elevatorPitchDescription}
            </p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.impactfulPresentation}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.quickIntroduction}
              </div>
              <div className="flex items-center text-gray-700 text-sm">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {content.speechPractice}
              </div>
            </div>

            <button
              onClick={() => router.push('/30sec')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-4 py-3 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-sm">{content.startCreatingEP}</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
