'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, useAuth } from '@/lib/auth';
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
  const [cvs, setCvs] = useState<CV[]>([]);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  // Use user prop to display user info if needed
  console.log('Dashboard user:', user?.email);

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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            İdarəetmə Paneli
            <span className="block text-2xl font-normal text-gray-600 mt-2">Peşəkar CV-lərinizi idarə edin</span>
          </h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-600">
            <div className="flex items-center justify-between min-h-[100px]">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-2">Abunəlik</p>
                <p className="text-2xl font-bold text-blue-900">
                  {loading || !userLimits ? '...' : (() => {
                    const tier = userLimits?.tier;
                    if (tier === 'Free') return 'Pulsuz';
                    if (tier === 'Medium' || tier === 'Pro') return 'Populyar';
                    if (tier === 'Premium' || tier === 'Business') return 'Premium';
                    return 'Pulsuz';
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
                          return '⏰ Abunəlik bitib';
                        } else if (diffDays === 0) {
                          return '⚠️ Bu gün bitir';
                        } else if (diffDays === 1) {
                          return '📅 1 gün qalıb';
                        } else if (diffDays <= 30) {
                          return `📅 ${diffDays} gün qalıb`;
                        } else {
                          return `📅 ${diffDays} gün qalıb`;
                        }
                      } catch (error) {
                        console.error('🗓️ Date calculation error:', error);
                        return '❌ Tarix xətası';
                      }
                    })()}
                  </p>
                )}
                {/* Show message for free users or users without subscription */}
                {!loading && (!userLimits?.subscription?.expiresAt || userLimits?.tier === 'Free') && (
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Premium abunəlik yoxdur
                  </p>
                )}
              </div>
              <div className="flex items-center justify-center ml-6">
                <button
                  onClick={() => router.push('/pricing')}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Yenilə
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-600">
            <div className="flex items-center justify-between min-h-[100px]">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  {loading || !userLimits ? 'Limit' : (
                    userLimits?.limits.limitType === 'total' ? 'Ümumi Limit' :
                    userLimits?.limits.limitType === 'daily' ? 'Günlük Limit' :
                    'Limit'
                  )}
                </p>
                <p className="text-2xl font-bold text-blue-900 mb-2">
                  {loading || !userLimits ? '...' : (
                    userLimits?.limits.limitType === 'total'
                      ? (() => {
                          // For free plan (total limit), show only remaining count
                          if (userLimits?.tier === 'Free') {
                            return `${userLimits?.usage.remainingLimit}`;
                          }
                          // For other plans, keep the old format
                          return `${userLimits?.usage.remainingLimit}/${userLimits?.limits.cvCount}`;
                        })()
                      : userLimits?.limits.limitType === 'daily'
                        ? `${userLimits?.usage.remainingLimit}/${userLimits?.limits.dailyLimit}`
                        : '∞'
                  )}
                </p>
                <p className="text-xs text-gray-600">
                  {loading || !userLimits ? '...' : (
                    userLimits?.limits.limitType === 'total' ? 'CV yaratma limiti' :
                    userLimits?.limits.limitType === 'daily' ? 'Bu gün qalan' :
                    'Limitsiz istifadə'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* LinkedIn Import Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">LinkedIn İdxal</h3>
                <p className="text-gray-600 mt-1">Avtomatik profil İdxalı</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              LinkedIn profilinizi bir kliklə idxal edin və avtomatik olaraq CV yaradın. Sürətli və təhlükəsiz!
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Avtomatik məlumat doldurma
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                İş təcrübəsi və təhsil
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bacarıqlar və kompetensiyalar
              </div>
            </div>

            {/* Replace the LinkedInAutoImport component with direct implementation */}
            <button
              onClick={() => router.push('/linkedin-import')}
              className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 border-2 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">LinkedIn profilinizi idxal edin</span>
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
                <h3 className="text-2xl font-bold text-gray-900">Əl ilə Yaratma</h3>
                <p className="text-gray-600 mt-1">Sıfırdan CV yaradın</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Bütün məlumatları əl ilə daxil edərək peşəkar CV yaradın. Tam nəzarət sizin əlinizdədir!
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tam fərdiləşdirmə imkanı
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Detallı məlumat əlavə etmə
              </div>
              <div className="flex items-center text-gray-700">
                <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI köməkliyi ilə
              </div>
            </div>

            <button
              onClick={() => router.push('/new')}
              className="w-full bg-blue-600 text-white border-2 rounded-xl px-6 py-4 font-medium hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-all duration-200"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">Yeni CV yaratmağa başla</span>
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
              <h2 className="text-2xl font-bold text-gray-900">Mövcud CV-lər</h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {cvs.length} CV
                </div>
                <Link
                  href="/cv-list"
                  className="text-blue-600 font-medium text-sm flex items-center"
                >
                  Hamısını gör
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
                      Redaktə et →
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
                  Bütün CV-ləri gör ({cvs.length})
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
