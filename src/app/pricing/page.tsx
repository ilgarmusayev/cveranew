'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import PromoCodeSection from '@/components/PromoCodeSection'; // Import the PromoCodeSection component
import { generateStructuredData, organizationData, generateBreadcrumbData } from '@/lib/structured-data';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export default function PricingPage() {
  const { siteLanguage } = useSiteLanguage();
  const router = useRouter();
  
  // Site language mətnləri
  const labels = {
    azerbaijani: {
      pageTitle: 'Qiymətlər',
      pageSubtitle: 'CV yaratmaq üçün ən uyğun planınızı seçin',
      planFree: 'Pulsuz',
      planPopular: 'Populyar',
      planPremium: 'Premium',
      popularBadge: 'Populyar',
      pricePerMonth: '/ay',
      startNow: 'İndi başlayın',
      currentPlan: 'Hazırki plan',
      choosePlan: 'Planı seçin',
      // Free plan features
      freeCVLimit: 'Ümumi 2 CV yaratma',
      freeTemplates: 'Pulsuz şablonlar (Basic və Resumonk Bold)',
      freePDFOnly: 'Yalnız PDF formatında yükləmə',
      linkedinImport: 'LinkedIn profilindən idxal',
      emailSupport: 'E-poçt dəstəyi',
      // Popular plan features
      popularCVLimit: 'Gündə 5 CV yaratma',
      popularTemplates: 'Pulsuz və Populyar səviyyə şablonlar',
      pdfFormats: 'PDF formatında yükləmə',
      onlineSupport: 'Saytda texniki dəstək',
      aiCVImprovement: 'AI ilə CV təkmilləşdirmə',
      professionalCollection: 'Professional şablon kolleksiyası',
      prioritySupport: 'Prioritet dəstək xidməti',
      // Premium plan features
      unlimitedCV: 'Limitsiz CV yaratma',
      allTemplates: 'Bütün şablonlar (Premium daxil)',
      // Error messages
      errorTitle: 'Xəta',
      loadingMessage: 'Yüklənir...',
      // Cancel subscription
      cancelSubscription: 'Abunəliyi ləğv et',
      cancelLoading: 'Ləğv edilir...',
      cancelConfirmMessage: 'Abunəliyi ləğv etmək istədiyinizə əminsiniz?',
      cancelSuccess: 'Abunəlik uğurla ləğv edildi',
      cancelError: 'Abunəlik ləğv edilərkən xəta baş verdi',
      // SEO mətnləri
      pageDescription: 'CVERA-da ən uyğun planı seçin. Pulsuz, Populyar və Premium planlar ilə professional CV yaradın. AI dəstəyi, premium şablonlar və daha çox imkanlar.',
      bestChoice: 'Ən Yaxşı Seçim',
      // Promo code mətnləri
      promoTitle: 'Promokod istifadə edin',
      promoDescription: 'Keçərli promokodunuz varsa, aşağıdakı sahəyə daxil edərək premium paketləri pulsuz əldə edə bilərsiniz',
      // Subscription məlumatları
      currentSubscription: 'Cari Abunəlik:',
      subscriptionCanceled: '⚠️ Abunəlik ləğv edilib və yuxarıdakı tarixdə bitəcək'
    },
    english: {
      pageTitle: 'Pricing',
      pageSubtitle: 'Choose the most suitable plan to create your CV',
      planFree: 'Free',
      planPopular: 'Popular',
      planPremium: 'Premium',
      popularBadge: 'Popular',
      pricePerMonth: '/month',
      startNow: 'Get Started',
      currentPlan: 'Current Plan',
      choosePlan: 'Choose Plan',
      // Free plan features
      freeCVLimit: 'Create up to 2 CVs total',
      freeTemplates: 'Free templates (Basic and Resumonk Bold)',
      freePDFOnly: 'PDF format download only',
      linkedinImport: 'LinkedIn profile import',
      emailSupport: 'Email support',
      // Popular plan features
      popularCVLimit: 'Create 5 CVs per day',
      popularTemplates: 'Free and Popular tier templates',
      pdfFormats: 'PDF format downloads',
      onlineSupport: 'Online technical support',
      aiCVImprovement: 'AI CV enhancement',
      professionalCollection: 'Professional template collection',
      prioritySupport: 'Priority support service',
      // Premium plan features
      unlimitedCV: 'Unlimited CV creation',
      allTemplates: 'All templates (including Premium)',
      // Error messages
      errorTitle: 'Error',
      loadingMessage: 'Loading...',
      // Cancel subscription
      cancelSubscription: 'Cancel subscription',
      cancelLoading: 'Canceling...',
      cancelConfirmMessage: 'Are you sure you want to cancel your subscription?',
      cancelSuccess: 'Subscription successfully canceled',
      cancelError: 'Error occurred while canceling subscription',
      // SEO texts
      pageDescription: 'Choose the most suitable plan at CVERA. Create professional CVs with Free, Popular and Premium plans. AI support, premium templates and more features.',
      bestChoice: 'Best Choice',
      // Promo code texts
      promoTitle: 'Use promo code',
      promoDescription: 'If you have a valid promo code, enter it below to get premium packages for free',
      // Subscription information
      currentSubscription: 'Current Subscription:',
      subscriptionCanceled: '⚠️ Subscription has been canceled and will end on the above date'
    },
    russian: {
      pageTitle: 'Тарифы',
      pageSubtitle: 'Выберите наиболее подходящий план для создания резюме',
      planFree: 'Бесплатный',
      planPopular: 'Популярный',
      planPremium: 'Премиум',
      popularBadge: 'Популярный',
      pricePerMonth: '/месяц',
      startNow: 'Начать',
      currentPlan: 'Текущий план',
      choosePlan: 'Выбрать план',
      // Free plan features
      freeCVLimit: 'Создать до 2 резюме всего',
      freeTemplates: 'Бесплатные шаблоны (Basic и Resumonk Bold)',
      freePDFOnly: 'Только скачивание в формате PDF',
      linkedinImport: 'Импорт профиля LinkedIn',
      emailSupport: 'Поддержка по электронной почте',
      // Popular plan features
      popularCVLimit: 'Создавать 5 резюме в день',
      popularTemplates: 'Шаблоны бесплатного и популярного уровня',
      pdfFormats: 'Скачивание в формате PDF',
      onlineSupport: 'Онлайн техническая поддержка',
      aiCVImprovement: 'Улучшение резюме с помощью ИИ',
      professionalCollection: 'Коллекция профессиональных шаблонов',
      prioritySupport: 'Приоритетная служба поддержки',
      // Premium plan features
      unlimitedCV: 'Неограниченное создание резюме',
      allTemplates: 'Все шаблоны (включая Премиум)',
      // Error messages
      errorTitle: 'Ошибка',
      loadingMessage: 'Загрузка...',
      // Cancel subscription
      cancelSubscription: 'Отменить подписку',
      cancelLoading: 'Отмена...',
      cancelConfirmMessage: 'Вы уверены, что хотите отменить подписку?',
      cancelSuccess: 'Подписка успешно отменена',
      cancelError: 'Произошла ошибка при отмене подписки',
      // SEO texts
      pageDescription: 'Выберите наиболее подходящий план в CVERA. Создавайте профессиональные резюме с планами Бесплатный, Популярный и Премиум. Поддержка ИИ, премиум шаблоны и больше возможностей.',
      bestChoice: 'Лучший выбор',
      // Promo code texts
      promoTitle: 'Использовать промокод',
      promoDescription: 'Если у вас есть действительный промокод, введите его ниже, чтобы получить премиум пакеты бесплатно',
      // Subscription information
      currentSubscription: 'Текущая подписка:',
      subscriptionCanceled: '⚠️ Подписка была отменена и закончится в указанную дату'
    }
  };

  const content = labels[siteLanguage];

  // Site language-ə görə pricing planları
  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: content.planFree,
      price: 0.00,
      features: [
        content.freeCVLimit,
        content.freeTemplates,
        content.freePDFOnly,
        content.linkedinImport,
        content.emailSupport,
      ]
    },
    {
      id: 'pro',
      name: content.planPopular,
      price: 2.99,
      features: [
        content.popularCVLimit,
        content.popularTemplates,
        content.pdfFormats,
        content.onlineSupport,
        content.linkedinImport,
        content.aiCVImprovement,
        content.professionalCollection,
        content.prioritySupport
      ],
      popular: true
    },
    {
      id: 'premium',
      name: content.planPremium,
      price: 4.99,
      features: [
        content.unlimitedCV,
        content.allTemplates,
        content.pdfFormats,
        content.onlineSupport,
        content.linkedinImport,
        content.aiCVImprovement,
        content.professionalCollection,
        content.prioritySupport
      ]
    }
  ];

  const [loading, setLoading] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('Free');
  const [error, setError] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  // Add structured data for pricing page
  useEffect(() => {
    const addStructuredData = (data: any, type: string, id: string) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = generateStructuredData({ type: type as any, data });
      script.id = id;

      // Remove existing script if it exists
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(script);
    };

    // Add organization data
    addStructuredData(organizationData, 'Organization', 'structured-data-organization');

    // Add breadcrumb data
    const breadcrumbData = generateBreadcrumbData([
      { name: siteLanguage === 'azerbaijani' ? 'Ana Səhifə' : 'Home', url: 'https://cvera.net' },
      { name: content.pageTitle, url: 'https://cvera.net/pricing' }
    ]);
    addStructuredData(breadcrumbData, 'BreadcrumbList', 'structured-data-breadcrumb');

    // Add service offers structured data
    const serviceOffersData = {
      name: siteLanguage === 'azerbaijani' ? "CVERA CV Yaratma Xidmətləri" : "CVERA CV Creation Services",
      description: siteLanguage === 'azerbaijani' 
        ? "AI əsaslı peşəkar CV yaratma xidmətləri - Pulsuz, Populyar və Premium planlar"
        : "AI-powered professional CV creation services - Free, Popular and Premium plans",
      provider: {
        "@type": "Organization",
        name: "CVERA",
        url: "https://cvera.net"
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: siteLanguage === 'azerbaijani' ? "CV Yaratma Planları" : "CV Creation Plans",
        itemListElement: plans.map(plan => ({
          "@type": "Offer",
          name: `${plan.name} ${siteLanguage === 'azerbaijani' ? 'Plan' : 'Plan'}`,
          description: `${plan.name} plan - ${plan.features.join(', ')}`,
          price: plan.price.toString(),
          priceCurrency: "AZN",
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "CVERA"
          },
          itemOffered: {
            "@type": "Service",
            name: `${siteLanguage === 'azerbaijani' ? 'CV Yaratma' : 'CV Creation'} - ${plan.name} Plan`,
            description: plan.features.join(', ')
          }
        }))
      },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "4.99", // Updated pricing
        priceCurrency: "AZN",
        availability: "https://schema.org/InStock",
        offerCount: plans.length.toString()
      }
    };
    addStructuredData(serviceOffersData, 'Service', 'structured-data-pricing-service');

    // Cleanup function
    return () => {
      ['structured-data-organization', 'structured-data-breadcrumb', 'structured-data-pricing-service'].forEach(id => {
        const script = document.getElementById(id);
        if (script) script.remove();
      });
    };
  }, [siteLanguage, plans]); // siteLanguage dəyişəndə structured data yenilənsin

  const loadUserInfo = useCallback(async (force = false) => {
    if (!force) setUserLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUserTier('Free');
        return;
      }

      console.log('🔍 Pricing: Loading user info...');
      // Use the same API that auth context uses for consistency
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('📥 Pricing: User data from /api/users/me:', userData);

        // Get the user's current tier from database
        const tier = userData.tier || 'Free';
        console.log('🎯 Pricing: Setting userTier to:', tier);
        setUserTier(tier);

        // Set subscription details if available
        if (userData.subscriptions && userData.subscriptions.length > 0) {
          const activeSub = userData.subscriptions[0];
          setSubscriptionDetails({
            status: activeSub.status,
            expiresAt: activeSub.expiresAt,
            tier: activeSub.tier
          });
        } else {
          setSubscriptionDetails(null);
        }
      } else {
        console.log('❌ Pricing: API response not ok, setting Free tier');
        setUserTier('Free');
      }
    } catch (error) {
      console.error('❌ Pricing: Error loading user info:', error);
      setUserTier('Free');
    } finally {
      if (!force) setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserInfo();
    
    // Check if coming from payment success - refresh user data
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('success') || urlParams.has('payment_success')) {
      console.log('🎉 Pricing: Detected payment success, refreshing user data...');
      setTimeout(() => {
        loadUserInfo(true); // Force refresh
      }, 1000);
    }
  }, [loadUserInfo]);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;

    setLoading(planId);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Plan tipini API-nin gözlədiyi formata çevir
      let apiPlanType = plan.name;
      if (plan.id === 'pro') {
        apiPlanType = 'Pro'; // Pro paketini göndər
      } else if (plan.id === 'premium') {
        apiPlanType = 'Premium'; // Zaten doğru
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planType: apiPlanType,
          amount: plan.price
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else {
        setError(data.message || 'Ödəniş yaradıla bilmədi');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Ödəniş zamanı xəta baş verdi');
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setCancelMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCancelMessage(data.message);
        loadUserInfo(); // Reload user info to update the tier
      } else {
        setCancelMessage(data.message || 'Ləğv edilərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setCancelMessage('Ləğv edilərkən xəta baş verdi');
    } finally {
      setCancelLoading(false);
    }
  };

  const getTierLevel = (tier: string) => {
    const levels = {
      Free: 0, Medium: 1, Premium: 2, Pro: 1, // Fix: Pro should map to level 1 (medium plan)
      Pulsuz: 0, Orta: 1  // Azərbaycanca adlar
    };
    return levels[tier as keyof typeof levels] || 0;
  };

  const getCurrentPlanId = (userTier: string) => {
    const tierToPlanId: { [key: string]: string } = {
      'Free': 'free',
      'Medium': 'pro',  // Legacy Medium maps to new pro plan
      'Pro': 'pro',     // Pro maps to pro plan
      'Premium': 'premium',
      'Pulsuz': 'free',
      'Orta': 'pro'     // Legacy Orta maps to new pro plan
    };
    return tierToPlanId[userTier] || 'free';
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

    if (subscriptionDetails.currentPeriodEnd) {
      return formatExpirationDate(subscriptionDetails.currentPeriodEnd);
    }

    return null;
  };

  // Function to get tier display name
  const getTierDisplayName = (tier: string) => {
    const tierNames = {
      azerbaijani: {
        'Free': 'Pulsuz',
        'Pro': 'Populyar',
        'Premium': 'Premium',
        'Medium': 'Populyar', // Legacy support
        'Orta': 'Populyar'    // Legacy support
      },
      english: {
        'Free': 'Free',
        'Pro': 'Popular',
        'Premium': 'Premium',
        'Medium': 'Popular', // Legacy support
        'Orta': 'Popular'    // Legacy support
      },
      russian: {
        'Free': 'Бесплатный',
        'Pro': 'Популярный',
        'Premium': 'Премиум',
        'Medium': 'Популярный', // Legacy support
        'Orta': 'Популярный'    // Legacy support
      }
    };
    
    return tierNames[siteLanguage][tier as keyof typeof tierNames.azerbaijani] || tier;
  };

  const currentUserPlanId = getCurrentPlanId(userTier);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <StandardHeader />

        {/* Main Content with Enhanced Responsive Container - Premium Edge Spacing */}
        <div className="w-full max-w-full mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 lg:py-16">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              {content.pageTitle}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {content.pageSubtitle}
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto mt-8 sm:mt-6 items-stretch">
            {plans.map((plan, index) => {
                const isCurrentPlan = plan.id === currentUserPlanId;
                return (
                <div
                    key={plan.id}
                    className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 mt-6 sm:mt-4 p-6 sm:p-8 flex flex-col ${
                        isCurrentPlan
                            ? 'border-green-500 ring-4 ring-green-100 bg-green-50'
                            : plan.popular
                            ? 'border-blue-500 ring-4 ring-blue-100'
                            : 'border-gray-200 hover:border-blue-300'
                    }`}
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                      <div className="absolute -top-4 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-green-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    {content.currentPlan}
                  </span>
                      </div>
                  )}

                  {/* Popular Badge */}
                  {plan.popular && !isCurrentPlan && (
                      <div className="absolute -top-4 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-blue-600 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                    {content.bestChoice}
                  </span>
                      </div>
                  )}
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="flex items-center justify-center mb-4">
      <span className="text-4xl font-bold text-gray-900">
        {plan.price === 0 ? `₼${plan.price}.00` : `₼${plan.price}`}
      </span>
                        {plan.price > 0 && (
                            <span className="text-gray-600 ml-2">{content.pricePerMonth}</span>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 flex-grow">
                      {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                          </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8">
                    {isCurrentPlan ? (
                      // Show cancel subscription button for paid users, active status for free users
                      userTier === 'Free' ? (
                        <div className="w-full py-4 px-6 rounded-xl font-medium bg-green-100 text-green-800 text-center border-2 border-green-200">
                          <div className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {content.currentPlan}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={cancelLoading}
                          className="w-full py-4 px-6 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-red-600"
                        >
                          {cancelLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              {content.cancelLoading}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {content.cancelSubscription}
                            </div>
                          )}
                        </button>
                      )
                    ) : (
                      <button
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={loading === plan.id}
                          className={ ` w-full py-4 px-6 rounded-xl font-medium transition-all duration-200 ${
                              plan.popular
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading === plan.id ? (
                            <div className="flex items-center justify-center ">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                              <span className="ml-2">{content.loadingMessage}</span>
                            </div>
                        ) : plan.price === 0 ? (
                            content.startNow
                        ) : (
                            content.choosePlan
                        )}
                      </button>
                    )}
                    </div>
                </div>
                );
            })}
          </div>
        </div>

        {/* Subscription Expiration Info Section */}
        {userTier !== 'Free' && getSubscriptionExpiration() && (
          <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 mt-12">
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-blue-200 shadow-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {content.currentSubscription} {getTierDisplayName(userTier)}
                  </h3>
                  <p className="text-lg text-blue-700 font-semibold">
                    📅 {getSubscriptionExpiration()}
                  </p>
                </div>
              </div>

              {subscriptionDetails?.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
                  <p className="text-yellow-800 text-sm font-medium">
                    {content.subscriptionCanceled}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promo Code Section */}
        <div className="max-w-2xl mx-auto mt-16 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content.promoTitle}
            </h2>
            <p className="text-gray-600">
              {content.promoDescription}
            </p>
          </div>

          <PromoCodeSection userTier={userTier} onTierUpdate={loadUserInfo} />

        </div>
<br/>
      <br/>


        <Footer />
      </div>
  );
}
