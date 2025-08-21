'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface PromoCodeSectionProps {
  userTier: string;
  onTierUpdate: () => void;
}

export default function PromoCodeSection({ userTier, onTierUpdate }: PromoCodeSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
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
      setPromoMessage('Promokod istifadə etmək üçün giriş etməlisiniz');
      return;
    }

    if (!promoCode.trim()) {
      setPromoMessage('Promokod daxil edin');
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
        body: JSON.stringify({ promoCode: promoCode.trim() })
      });

      const validateData = await validateResponse.json();
      console.log('✅ Validation response:', validateData);

      // Check validation result
      if (!validateData.success) {
        console.log('❌ Validation failed:', validateData.message);
        setPromoMessage(validateData.message || 'Promokod etibarsızdır');
        setPromoLoading(false);
        return;
      }

      // Additional validation for tier level
      if (validateData.promoCode?.tier && !canUsePromoTier(validateData.promoCode.tier)) {
        const errorMsg = `${validateData.promoCode.tier} promokodu istifadə edə bilməzsiniz. Siz artıq ${userTier} və ya daha yüksək paketdəsiniz.`;
        console.log('❌ Tier validation failed:', errorMsg);
        setPromoMessage(errorMsg);
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
        body: JSON.stringify({ promoCode: promoCode.trim() })
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
        setPromoMessage(applyData.message || 'Promokod tətbiq edilərkən xəta baş verdi');
      }
    } catch (error) {
      console.error('💥 Promo code error:', error);
      setPromoMessage('Promokod tətbiq edilərkən xəta baş verdi');
    } finally {
      setPromoLoading(false);
    }
  };

  // Show current tier information
  const getCurrentTierDisplay = () => {
    const tierDisplayNames = {
      'Free': 'Pulsuz',
      'Medium': 'Orta',
      'Premium': 'Premium',
      'Pro': 'Populyar'
    };
    return tierDisplayNames[userTier as keyof typeof tierDisplayNames] || userTier;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Current tier display */}
      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
        <p className="text-blue-800 text-sm sm:text-base">
          <span className="font-medium">Cari paketiniz:</span> {getCurrentTierDisplay()}
        </p>
        {userTier !== 'Free' && (
          <p className="text-blue-600 text-xs sm:text-sm mt-1">
            Yalnız daha yüksək paketlər üçün promokod istifadə edə bilərsiniz
          </p>
        )}
      </div>

      {/* Input and Button - Stack on mobile, side by side on larger screens */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Promokod daxil edin"
          className="flex-1 px-3 py-3 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono text-base sm:text-lg transition-all duration-200"
          disabled={promoLoading}
        />
        <button
          onClick={applyPromoCode}
          disabled={promoLoading || !promoCode.trim() || !user || (promoValidation && !promoValidation.valid)}
          className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-fit whitespace-nowrap"
        >
          {promoLoading ? 'Tətbiq edilir...' : 'Tətbiq et'}
        </button>
      </div>

      {!user && (
        <div className="text-center px-4">
          <p className="text-orange-600 text-sm sm:text-base">
            Promokod istifadə etmək üçün{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-blue-600 hover:text-blue-700 font-medium underline transition-colors"
            >
              giriş edin
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
          promoMessage.includes('uğurla') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="break-words">{promoMessage}</div>
          {promoMessage.includes('uğurla') && (
            <div className="mt-2 text-xs sm:text-sm opacity-75">
              2 saniyə sonra dashboard-a yönləndiriləcəksiniz...
            </div>
          )}
        </div>
      )}

      {/* Sample Promo Codes for Testing - Improved responsive grid */}
      <div className=" rounded-lg">

        <p className="text-xs text-gray-500 mt-2 sm:mt-3 leading-relaxed">
          * Yalnız cari paketinizdən yüksək paketlər üçün kodlar işləyir
        </p>
      </div>
    </div>
  );
}
