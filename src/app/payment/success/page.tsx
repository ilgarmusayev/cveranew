'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchCurrentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionCreated, setSubscriptionCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  useEffect(() => {
    const createSubscription = async () => {
      try {
        // Get payment info from URL params
        const tier = searchParams.get('tier');
        const paymentId = searchParams.get('payment_id');
        const amount = searchParams.get('amount');

        console.log('🎯 Payment success params:', { tier, paymentId, amount });

        if (!tier || !paymentId) {
          throw new Error('Ödəniş məlumatları tapılmadı');
        }

        // Validate tier for premium subscriptions
        if (tier !== 'Populyar' && tier !== 'Premium' && tier !== 'Medium' && tier !== 'Pro' && tier !== 'Business') {
          throw new Error('Keçersiz abunəlik növü');
        }

        // First, check if subscription already exists (maybe webhook already created it)
        const checkResponse = await apiClient.get('/api/user/subscription');
        
        if (checkResponse.data.success && checkResponse.data.subscription) {
          const existingSub = checkResponse.data.subscription;
          
          // If subscription exists and matches the tier, use it
          if (existingSub.tier === tier && existingSub.status === 'active') {
            console.log('✅ Subscription already exists from webhook:', existingSub);
            setSubscriptionCreated(true);
            setSubscriptionInfo(existingSub);
            
            // 🔄 CRITICAL: Refresh user data even if subscription exists
            console.log('🔄 Refreshing user data after finding existing subscription...');
            await fetchCurrentUser();
            return;
          }
        }

        // If no existing subscription or different tier, create new one
        const response = await apiClient.post('/api/subscription/create', {
          tier,
          paymentId: paymentId, // This is actually orderId from the URL
          amount: amount ? parseFloat(amount) : 0
        });

        console.log('✅ Subscription creation response:', response.data);

        if (response.data.success) {
          setSubscriptionCreated(true);
          setSubscriptionInfo(response.data.subscription);
          
          // 🔄 CRITICAL: Refresh user data to update tier in auth context
          console.log('🔄 Refreshing user data after subscription creation...');
          await fetchCurrentUser();
        } else {
          throw new Error(response.data.error || 'Abunəlik yaradıla bilmədi');
        }

      } catch (error) {
        console.error('❌ Subscription creation error:', error);
        setError(error instanceof Error ? error.message : 'Bilinməyən xəta');
      } finally {
        setLoading(false);
      }
    };

    createSubscription();
  }, [searchParams, fetchCurrentUser]);

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Ödəniş yoxlanılır...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {loading ? (
            <div>
              <div className="w-16 h-16 mx-auto mb-6 animate-pulse bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Abunəlik yaradılır...</h1>
              <p className="text-gray-600">Zəhmət olmasa gözləyin</p>
            </div>
          ) : error ? (
            <div>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-900 mb-4">Xəta baş verdi</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Geri qayıt
              </button>
            </div>
          ) : subscriptionCreated ? (
            <div>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-900 mb-4">Ödəniş uğurlu!</h1>
              <p className="text-gray-600 mb-6">
                <span className="font-semibold text-blue-600">{subscriptionInfo?.tier}</span> abunəliyiniz uğurla yaradıldı.
              </p>
              
              {subscriptionInfo?.expiresAt && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-blue-800">
                    📅 Abunəliyin bitməsinə: <span className="font-semibold">
                      {(() => {
                        const expiresAt = new Date(subscriptionInfo.expiresAt);
                        const now = new Date();
                        const diffDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return `${diffDays} gün`;
                      })()}
                    </span> qalıb
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✅ Premium xüsusiyyətlərə çıxışınız açıldı</p>
                  <p>✅ Limitsiz CV yaratma imkanı</p>
                  <p>✅ AI köməkçi xüsusiyyətləri</p>
                  <p>✅ Bütün şablonlara çıxış</p>
                </div>
                
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Dashboard-a davam et
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
