'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface PromoCodeSectionProps {
  userTier: string;
  onTierUpdate: () => void;
}

export default function PromoCodeSection({ userTier, onTierUpdate }: PromoCodeSectionProps) {
  const { user } = useAuth();
  const { siteLanguage } = useSiteLanguage();
  const router = useRouter();
  
  // Site language mətnləri
  const labels = {
    azerbaijani: {
      promoPlaceholder: 'Promo kodunuzu daxil edin',
      applyButton: 'Tətbiq et',
      applying: 'Tətbiq edilir...',
      loginRequired: 'Promo kod istifadə etmək üçün giriş etməlisiniz',
      emptyCode: 'Zəhmət olmasa promo kod daxil edin',
      invalidCode: 'Bu promo kod mövcud deyil və ya istifadə olunub',
      alreadyUsed: 'Bu promo kodu artıq istifadə etmisiniz',
      alreadyHigherTier: 'Hal-hazırda daha yüksək paketiniz var',
      upgradeSuccess: 'Tebrikler! Paketiniz uğurla yeniləndi:',
      errorOccurred: 'Xəta baş verdi. Yenidən cəhd edin.',
      monthAccess: 'ay giriş',
      unlimitedAccess: 'Limitsiz giriş',
      freeTier: 'Pulsuz',
      mediumTier: 'Orta',
      premiumTier: 'Premium',
      currentPackage: 'Cari paketiniz:',
      higherPackageOnly: 'Yalnız daha yüksək paketlər üçün promokod istifadə edə bilərsiniz',
      loginPrompt: 'giriş edin',
      redirectMessage: 'saniyə sonra dashboard-a yönləndiriləcəksiniz...',
      successPrefix: 'uğurla',
      notePrefix: '* Yalnız cari paketinizdən yüksək paketlər üçün kodlar işləyir'
    },
    english: {
      promoPlaceholder: 'Enter your promo code',
      applyButton: 'Apply',
      applying: 'Applying...',
      loginRequired: 'You must log in to use a promo code',
      emptyCode: 'Please enter a promo code',
      invalidCode: 'This promo code is invalid or has been used',
      alreadyUsed: 'You have already used this promo code',
      alreadyHigherTier: 'You already have a higher tier package',
      upgradeSuccess: 'Congratulations! Your package has been successfully upgraded:',
      errorOccurred: 'An error occurred. Please try again.',
      monthAccess: 'month access',
      unlimitedAccess: 'Unlimited access',
      freeTier: 'Free',
      mediumTier: 'Medium',
      premiumTier: 'Premium',
      currentPackage: 'Current package:',
      higherPackageOnly: 'You can only use promo codes for higher packages',
      loginPrompt: 'login',
      redirectMessage: 'seconds you will be redirected to dashboard...',
      successPrefix: 'successfully',
      notePrefix: '* Only codes for packages higher than your current package work'
    },
    russian: {
      promoPlaceholder: 'Введите промокод',
      applyButton: 'Применить',
      applying: 'Применяется...',
      loginRequired: 'Для использования промокода необходимо войти в систему',
      emptyCode: 'Пожалуйста, введите промокод',
      invalidCode: 'Этот промокод недействителен или уже использован',
      alreadyUsed: 'Вы уже использовали этот промокод',
      alreadyHigherTier: 'У вас уже есть пакет более высокого уровня',
      upgradeSuccess: 'Поздравляем! Ваш пакет успешно обновлен:',
      errorOccurred: 'Произошла ошибка. Попробуйте еще раз.',
      monthAccess: 'месяц доступа',
      unlimitedAccess: 'Неограниченный доступ',
      freeTier: 'Бесплатный',
      mediumTier: 'Средний',
      premiumTier: 'Премиум',
      currentPackage: 'Ваш текущий пакет:',
      higherPackageOnly: 'Вы можете использовать промокоды только для пакетов более высокого уровня',
      loginPrompt: 'войти',
      redirectMessage: 'секунд вы будете перенаправлены на панель...',
      successPrefix: 'успешно',
      notePrefix: '* Работают только коды для пакетов выше вашего текущего пакета'
    }
  };

  const content = labels[siteLanguage];

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoValidation, setPromoValidation] = useState<any>(null);

  // Helper function to get tier level for comparison
  const getTierLevel = (tier: string) => {
    const levels = {
      'Free': 0, 'Medium': 1, 'Premium': 2, 'Pro': 1,
      'Pulsuz': 0, 'Orta': 1  // Azərbaycanca adlar
    };
    return levels[tier as keyof typeof levels] || 0;
  };

  // Helper function to check if user can use a promo code
  const canUsePromoTier = (promoTier: string) => {
    const currentLevel = getTierLevel(userTier);
    const promoLevel = getTierLevel(promoTier);

    // Special case: Pro users can use Premium promo codes
    if (userTier === 'Pro' && promoTier === 'Premium') {
      return true;
    }

    return promoLevel > currentLevel;
  };

  const validatePromoCode = async () => {
    // Remove real-time validation - only validate when applying
    return;
  };

  const applyPromoCode = async () => {
    console.log('🔍 Starting promo code application process');

    if (!user) {
      setPromoMessage(content.loginRequired);
      return;
    }

    if (!promoCode.trim()) {
      setPromoMessage(content.emptyCode);
      return;
    }

    setPromoLoading(true);
    setPromoMessage('');
    setPromoValidation(null); // Clear any previous validation

    try {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Token exists:', !!token);

      // First validate the promo code
      console.log('🔍 Validating promo code:', promoCode.trim());
      const validateResponse = await fetch('/api/promo-code/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          promoCode: promoCode.trim(),
          language: siteLanguage
        })
      });

      const validateData = await validateResponse.json();
      console.log('✅ Validation response:', validateData);

      // Check validation result
      if (!validateData.success) {
        console.log('❌ Validation failed:', validateData.message);
        setPromoMessage(validateData.message || content.invalidCode);
        setPromoLoading(false);
        return;
      }

      // Additional validation for tier level
      if (validateData.promoCode?.tier && !canUsePromoTier(validateData.promoCode.tier)) {
        console.log('❌ Tier validation failed');
        setPromoMessage(content.alreadyHigherTier);
        setPromoLoading(false);
        return;
      }

      // If validation passed, apply the promo code
      console.log('🚀 Applying promo code...');
      const applyResponse = await fetch('/api/promo-code/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          promoCode: promoCode.trim(),
          language: siteLanguage
        })
      });

      const applyData = await applyResponse.json();
      console.log('📦 Apply response:', applyData);

      if (applyResponse.ok && applyData.success) {
        console.log('✅ Promo code applied successfully!');
        setPromoMessage(applyData.message);
        setPromoCode('');
        setPromoValidation(null);

        // Trigger tier update notification for other components
        console.log('🔄 Triggering tier update...');
        localStorage.setItem('tierUpdated', Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'tierUpdated',
          newValue: Date.now().toString()
        }));

        // Update the tier in parent component
        console.log('🔄 Calling onTierUpdate callback...');
        onTierUpdate();

        // Redirect to dashboard after successful application
        console.log('🏠 Redirecting to dashboard in 2 seconds...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        console.log('❌ Apply failed:', applyData.message);
        setPromoMessage(applyData.message || content.errorOccurred);
      }
    } catch (error) {
      console.error('💥 Promo code error:', error);
      setPromoMessage(content.errorOccurred);
    } finally {
      setPromoLoading(false);
    }
  };

  // Show current tier information
  const getCurrentTierDisplay = () => {
    const tierDisplayNames = {
      azerbaijani: {
        'Free': 'Pulsuz',
        'Medium': 'Orta', 
        'Premium': 'Premium',
        'Pro': 'Populyar'
      },
      english: {
        'Free': 'Free',
        'Medium': 'Medium',
        'Premium': 'Premium', 
        'Pro': 'Popular'
      },
      russian: {
        'Free': 'Бесплатный',
        'Medium': 'Средний',
        'Premium': 'Премиум',
        'Pro': 'Популярный'
      }
    };
    
    return tierDisplayNames[siteLanguage][userTier as keyof typeof tierDisplayNames.azerbaijani] || userTier;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current tier display */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
        <p className="text-blue-800 text-sm sm:text-base">
          <span className="font-medium">{content.currentPackage}</span> {getCurrentTierDisplay()}
        </p>
        {userTier !== 'Free' && (
          <p className="text-blue-600 text-xs sm:text-sm mt-1">
            {content.higherPackageOnly}
          </p>
        )}
      </div>

      {/* Input and Button - Stack on mobile, side by side on larger screens */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder={content.promoPlaceholder}
          className="flex-1 px-3 py-3 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono text-base sm:text-lg transition-all duration-200"
          disabled={promoLoading}
        />
        <button
          onClick={applyPromoCode}
          disabled={promoLoading || !promoCode.trim() || !user || (promoValidation && !promoValidation.valid)}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-fit whitespace-nowrap"
        >
          {promoLoading ? content.applying : content.applyButton}
        </button>
      </div>

      {!user && (
        <div className="text-center px-4">
          <p className="text-orange-600 text-sm sm:text-base">
            {content.loginRequired}{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors"
            >
              {content.loginPrompt}
            </button>
          </p>
        </div>
      )}

      {/* Promo Code Validation Message */}
      {promoValidation && (
        <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
          promoValidation.valid 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-start sm:items-center">
            {promoValidation.valid ? (
              <svg className="w-5 h-5 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="break-words">{promoValidation.message}</span>
          </div>
          {promoValidation.valid && promoValidation.tier && (
            <div className="mt-2 font-medium text-sm sm:text-base">
              📦 Paket: {promoValidation.tier}
            </div>
          )}
        </div>
      )}

      {/* Application Result Message */}
      {promoMessage && (
        <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
          promoMessage.includes(content.successPrefix) 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="break-words">{promoMessage}</div>
          {promoMessage.includes(content.successPrefix) && (
            <div className="mt-2 text-xs sm:text-sm opacity-75">
              2 {content.redirectMessage}
            </div>
          )}
        </div>
      )}

      {/* Sample Promo Codes for Testing - Improved responsive grid */}
      <div className=" rounded-lg">
        <p className="text-xs text-gray-500 mt-2 sm:mt-3 leading-relaxed">
          {content.notePrefix}
        </p>
      </div>
    </div>
  );
}
