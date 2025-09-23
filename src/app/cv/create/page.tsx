'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useNotification } from '@/components/ui/Toast';
import LinkedInAutoImport from '@/components/LinkedInAutoImport';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { getLoadingMessages } from '@/components/ui/Loading';

function CreateCVContent() {
  const [selectedMethod, setSelectedMethod] = useState<'linkedin' | 'manual' | null>(null);
  const [importedData, setImportedData] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    // Check if coming from dashboard with imported data
    const importType = searchParams.get('import');
    const dataParam = searchParams.get('data');

    if (importType === 'linkedin' && dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam));
        setImportedData(parsedData);
        setSelectedMethod('linkedin');
        // Redirect to CV editor with imported data
        router.push(`/cv/edit/new?import=linkedin&data=${encodeURIComponent(JSON.stringify(parsedData))}`);
      } catch (error) {
        console.error('Import data parse error:', error);
      }
    }
  }, [user, loading, router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">{loadingMessages.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLinkedInImport = async (data: any) => {
    try {
      console.log('LinkedIn data received:', data);
      setImportedData(data);

      // Store data temporarily and redirect to CV editor
      sessionStorage.setItem('linkedinImportData', JSON.stringify(data));
      router.push('/cv/edit/new?source=linkedin');

    } catch (error) {
      console.error('LinkedIn import xətası:', error);
      showError(`LinkedIn import xətası: ${error instanceof Error ? error.message : 'Naməlum xəta'}`);
      setSelectedMethod(null);
    }
  };

  const handleManualCreate = () => {
    router.push('/cv/edit/new');
  };

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Yeni CV Yaradın
              <span className="block text-xl font-normal text-gray-600 mt-2">Hansı üsulu seçirsiniz?</span>
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>

          {/* Method Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* LinkedIn Import Option */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-300"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">LinkedIn Import</h3>
                    <p className="text-blue-100">Sürətli və avtomatik</p>
                  </div>
                </div>

                <p className="text-lg text-blue-50 mb-8 leading-relaxed">
                  LinkedIn profilinizi bir kliklə import edin. Bütün məlumatlarınız avtomatik doldurulacaq və siz yalnız son düzəlişlər edə bilərsiniz.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-blue-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Avtomatik məlumat doldurma
                  </div>
                  <div className="flex items-center text-blue-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    İş təcrübəsi və təhsil
                  </div>
                  <div className="flex items-center text-blue-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Bacarıqlar və kompetensiyalar
                  </div>
                  <div className="flex items-center text-blue-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Təhlükəsiz və sürətli
                  </div>
                </div>

                <LinkedInAutoImport
                  onImportSuccess={handleLinkedInImport}
                  onImportError={(error) => {
                    console.error('LinkedIn import xətası:', error);
                    showError(`LinkedIn import xətası: ${error}`);
                  }}
                  className="w-full"
                >
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-4 hover:bg-white/30 transition-all duration-300 cursor-pointer group/btn">
                    <div className="flex items-center justify-center">
                      <span className="text-lg font-semibold">LinkedIn Import Et</span>
                      <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </LinkedInAutoImport>
              </div>
            </div>

            {/* Manual Creation Option */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden group cursor-pointer transform hover:scale-105 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-300"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 group-hover:scale-110 transition-transform duration-300"></div>

              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Əl ilə Yaratma</h3>
                    <p className="text-purple-100">Tam nəzarət</p>
                  </div>
                </div>

                <p className="text-lg text-purple-50 mb-8 leading-relaxed">
                  Bütün məlumatları əl ilə daxil edin və CV-ni istədiyiniz kimi fərdiləşdirin. Tam nəzarət sizin əlinizdədir.
                </p>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center text-purple-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Tam fərdiləşdirmə imkanı
                  </div>
                  <div className="flex items-center text-purple-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Detallı məlumat əlavə etmə
                  </div>
                  <div className="flex items-center text-purple-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Addım-addım rehbərlik
                  </div>
                  <div className="flex items-center text-purple-100">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI köməkliyi ilə
                  </div>
                </div>

                <button
                  onClick={handleManualCreate}
                  className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-4 hover:bg-white/30 transition-all duration-300 group/btn"
                >
                  <div className="flex items-center justify-center">
                    <span className="text-lg font-semibold">Əl ilə Yaratmağa Başla</span>
                    <svg className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Köməyə ehtiyacınız var?</h3>
              <p className="text-gray-600 mb-6">
                Hansı üsulu seçəcəyinizi bilmirsiniz? Aşağıdakı məsləhətlər sizə kömək edə bilər.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-left p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">LinkedIn Import seçin əgər:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• LinkedIn profiliniz aktual və tamdır</li>
                    <li>• Sürətli nəticə istəyirsiniz</li>
                    <li>• Əsas məlumatlarınız LinkedIn-də mövcuddur</li>
                  </ul>
                </div>

                <div className="text-left p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-2">Əl ilə yaratma seçin əgər:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Tam nəzarət istəyirsiniz</li>
                    <li>• Xüsusi məlumatlar əlavə etmək istəyirsiniz</li>
                    <li>• LinkedIn profiliniz yoxdur və ya natamam</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default function CreateCVPage() {
  return (
    <Suspense fallback={null}>
      <CreateCVContent />
    </Suspense>
  );
}
