'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { getLoadingMessages } from '@/components/ui/Loading';

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tier = searchParams.get('tier') || 'Bilinməyən';
  const error = searchParams.get('error') || 'Ödəniş prosesi dayandırıldı';

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-red-900 mb-4">Ödəniş uğursuz</h1>
          
          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-blue-600">{tier}</span> abunəliyi üçün ödəniş tamamlana bilmədi.
          </p>
          
          <p className="text-red-600 mb-8">{error}</p>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-yellow-800 font-semibold mb-2">Nəyə diqqət etməlisiniz:</h3>
              <ul className="text-sm text-yellow-700 space-y-1 text-left">
                <li>• Kart məlumatlarınızın düzgünlüyünü yoxlayın</li>
                <li>• Kartda kifayət qədər məbləğ olduğunu təmin edin</li>
                <li>• İnternet bağlantınızı yoxlayın</li>
                <li>• Bir neçə dəqiqə sonra yenidən cəhd edin</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Yenidən cəhd et
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Dashboard-a qayıt
              </button>
            </div>
            
            <div className="text-sm text-gray-500 mt-6">
              <p>Problem davam edərsə, bizimlə əlaqə saxlayın:</p>
              <p className="text-blue-600">support@cvera.az</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// Localized loading component for Suspense
function LoadingFallback() {
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      {loadingMessages.loading}
    </div>
  );
}

export default function PaymentFailPageWrapper() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailContent />
    </Suspense>
  );
}
