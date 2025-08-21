'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

export default function LinkedInImportPage() {
  // All hooks must be at the top level - before any conditional returns
  const { user } = useAuth();
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle redirect for non-authenticated users
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, router]);

  const extractUsernameFromUrl = (url: string): string | null => {
    try {
      // Handle different LinkedIn URL formats - fixed regex escaping
      const patterns = [
        /linkedin\.com\/in\/([^/?]+)/,
        /linkedin\.com\/pub\/[^/]+\/[^/]+\/[^/]+\/([^/?]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return match[1];
        }
      }
      
      // If it's just a username without URL
      if (!url.includes('linkedin.com') && url.trim()) {
        return url.trim();
      }
      
      return null;
    } catch (error) {
      return null;
    }
  };

  const handleImport = async () => {
    if (!linkedinUrl.trim()) {
      setError('LinkedIn linkinizi daxil edin');
      return;
    }

    const username = extractUsernameFromUrl(linkedinUrl);
    if (!username) {
      setError('Düzgün LinkedIn URL formatı daxil edin. Məsələn: https://www.linkedin.com/in/mikayilzeynalabdinov/');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Giriş tələb olunur');
        setLoading(false);
        return;
      }

      console.log('🔍 LinkedIn import: Username:', username);

      const response = await fetch('/api/import/linkedin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'LinkedIn import xətası');
        setLoading(false);
        return;
      }

      if (result.success && result.cvId) {
        console.log('✅ LinkedIn CV uğurla yaradıldı:', result.cvId);
        
        // Redirect to edit the created CV
        router.push(`/cv/edit/${result.cvId}`);
      } else {
        setError(result.error || 'CV yaradılmadı');
      }

    } catch (error) {
      console.error('❌ LinkedIn import xətası:', error);
      setError(`LinkedIn idxal xətası: ${error instanceof Error ? error.message : 'Naməlum xəta'}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Giriş tələb olunur...</p>
          <p className="text-sm text-gray-500 mt-2">Giriş səhifəsinə yönləndirilirsiz...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">LinkedIn-dən İdxal</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                LinkedIn profilinizi avtomatik olaraq idxal edin və bir neçə saniyədə peşəkar CV yaradın
              </p>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Sürətli İdxal</h3>
                <p className="text-sm text-gray-600">Bir neçə saniyədə bütün məlumatlarınız idxal edilir</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Dəqiq Məlumat</h3>
                <p className="text-sm text-gray-600">Bütün iş təcrübəsi və təhsil məlumatları dəqiq şəkildə idxal edilir</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Təhlükəsiz</h3>
                <p className="text-sm text-gray-600">Məlumatlarınız təhlükəsiz şəkildə işlənir və qorunur</p>
              </div>
            </div>

            {/* Import Form */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">LinkedIn Profilinizi İdxal Edin</h2>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/musayevcreate/"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Tam LinkedIn URL-ni daxil edin. Məsələn: <code>https://www.linkedin.com/in/musayevcreate/</code>  .
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleImport}
                    disabled={loading || !linkedinUrl.trim()}
                    className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İdxal edilir...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>LinkedIn profilimi idxal et</span>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-8 bg-blue-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Necə işləyir?</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>LinkedIn profilinizin URL-ni daxil edin</li>
                  <li>Sistemimiz LinkedIn profilinizi təhlükəsiz şəkildə oxuyacaq</li>
                  <li>Bütün məlumatlar avtomatik olaraq CV formatında tərtib ediləcək</li>
                  <li>Yaradılan CV-ni redaktə edə və fərdiləşdirə bilərsiniz</li>
                </ol>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
