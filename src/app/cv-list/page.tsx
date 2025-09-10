'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/components/ui/Toast';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface CV {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
}

export default function CVListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; cvId: string; title: string }>({
    show: false,
    cvId: '',
    title: ''
  });
  const { showSuccess, showError, showWarning } = useNotification();

  // Check if user can delete CVs based on tier
  const canDeleteCV = () => {
    if (!user) return false;
    
    // Only Premium users can delete CVs
    const userTier = user.tier?.toLowerCase() || 'free';
    const hasActiveSubscription = user.subscriptions?.some(sub => 
      sub.status === 'active' && sub.tier.toLowerCase() === 'premium'
    );
    
    return userTier === 'premium' || hasActiveSubscription;
  };

  const fetchCVs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 CV List: CV-ləri yükləyirəm...');

      const response = await apiClient.get('/api/cv');

      console.log('📥 CV List: API cavabı:', response.data);

      let cvsArray = [];
      if (response.data && response.data.cvs) {
        cvsArray = response.data.cvs;
      } else if (Array.isArray(response.data)) {
        cvsArray = response.data;
      }

      console.log('📋 CV List: CV sayı:', cvsArray.length);
      setCvs(cvsArray);
    } catch (error: any) {
      console.error('❌ CV List xətası:', error);

      if (error.response?.status === 401) {
        localStorage.removeItem('accessToken');
        router.push('/auth/login');
      } else {
        setError('CV-lər yüklənərkən xəta baş verdi');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      fetchCVs();
    }
  }, [user, authLoading, router, fetchCVs]);

  const handleEdit = (cvId: string) => {
    router.push(`/cv/edit/${cvId}`);
  };

  const handleDelete = async (cvId: string, title: string) => {
    // Check if user has permission to delete CVs
    if (!canDeleteCV()) {
      showWarning(
        'CV silmə funksiyası yalnız Premium istifadəçilər üçün mövcuddur. Premium plana keçmək üçün profil səhifənizə daxil olun.',
        'Premium Funksiya'
      );
      return;
    }

    setDeleteModal({
      show: true,
      cvId,
      title
    });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/api/cv/${deleteModal.cvId}`);
      setDeleteModal({ show: false, cvId: '', title: '' });
      await fetchCVs(); // Reload the list
      showSuccess('CV uğurla silindi');
    } catch (error: any) {
      console.error('❌ CV silmə xətası:', error);
      
      // Handle specific error codes
      if (error?.response?.status === 403) {
        showWarning(
          'CV silmə funksiyası yalnız Premium istifadəçilər üçün mövcuddur. Premium plana keçmək üçün profil səhifənizə daxil olun.',
          'Premium Funksiya'
        );
      } else {
        showError('CV silinərkən xəta baş verdi');
      }
      
      setDeleteModal({ show: false, cvId: '', title: '' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="app-background flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 backdrop-blur-sm border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <StandardHeader />
      <div className="app-background">
        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className=" rounded-3xl p-8 lg:p-12">
            {/* Title */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">CV-lərim</h1>
              <p className="text-xl text-gray-600">Bütün CV-lərinizi görün və idarə edin</p>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-blue-50 rounded-2xl  shadow-lg  p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Cəmi CV-lər</h3>
                  <p className="text-3xl font-bold text-blue-600">{cvs.length}</p>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* CV List */}
            {cvs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 gap-6">
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    className="bg-gray-50   shadow-lg  rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300 group"
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
                            <span className="truncate">Yaradılıb: {new Date(cv.createdAt).toLocaleDateString('az-AZ')}</span>
                          </p>
                          <p className="flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="truncate">Yenilənib: {new Date(cv.updatedAt).toLocaleDateString('az-AZ')}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <button
                        onClick={() => handleEdit(cv.id)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm"
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Redaktə et
                        </div>
                      </button>

                      <button
                        onClick={() => handleDelete(cv.id, cv.title)}
                        className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                          canDeleteCV()
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                        title={canDeleteCV() 
                          ? "CV-ni sil" 
                          : "CV silmə Premium istifadəçilər üçün mövcuddur"
                        }
                        disabled={!canDeleteCV()}
                      >
                        <div className="relative">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {!canDeleteCV() && (
                            <div className="absolute -top-1 -right-1 w-3 h-3">
                              <span className="text-xs">🔒</span>
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Hələ CV yaradılmayıb</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  İlk CV-nizi yaratmaq üçün aşağıdakı düymə ilə başlaya bilərsiniz.
                </p>
                <div className="space-y-4">
                  <Link
                    href="/linkedin-import"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium mr-4"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn Import
                  </Link>
                  <Link
                    href="/new"
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Əl ilə Yarat
                  </Link>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="mt-8 text-center ">
              <button
                onClick={fetchCVs}
                disabled={loading}
                className="px-6 py-3  shadow-lg bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? (
                  <div className="flex items-center ">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Yenilənir...
                  </div>
                ) : (
                  <div className="flex  items-center ">
                    <svg className="w-4 h-4 mr-2 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    CV-ləri yenilə
                  </div>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Silmək üçün təsdiq edin</h3>
            <p className="text-sm text-gray-600 mb-4">
              "{deleteModal.title}" CV-ni silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün olmayacaq.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setDeleteModal({ show: false, cvId: '', title: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
              >
                İmtina et
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
              >
                Bəli, sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
