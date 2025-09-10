'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/Loading';

interface CV {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  cv_data?: any;
}

export default function CVManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchCVs();
    }
  }, [user, authLoading, router]);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/cvs');
      setCvs(response.data || []);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      setError('CV-lər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    // Check if user has permission to delete CVs
    if (!canDeleteCV()) {
      alert('CV silmə funksiyası yalnız Premium istifadəçilər üçün mövcuddur. Premium plana keçmək üçün profil səhifənizə daxil olun.');
      return;
    }

    if (!confirm('Bu CV-ni silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/cv/${cvId}`);
      setCvs(cvs.filter(cv => cv.id !== cvId));
    } catch (error: any) {
      console.error('Error deleting CV:', error);
      
      // Handle specific error codes
      if (error?.response?.status === 403) {
        alert('CV silmə funksiyası yalnız Premium istifadəçilər üçün mövcuddur. Premium plana keçmək üçün profil səhifənizə daxil olun.');
      } else {
        setError('CV silinərkən xəta baş verdi');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTemplateDisplayName = (templateId: string) => {
    const templates: Record<string, string> = {
      'basic': 'Əsas',
      'professional': 'Peşəkar',
      'modern': 'Modern',
      'creative': 'Yaradıcı',
      'traditional': 'Ənənəvi',
      'medium': 'Orta',
      'professional-complex': 'Mürəkkəb Peşəkar'
    };
    return templates[templateId] || templateId;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CV-lərim</h1>
              <p className="text-gray-600 mt-2">CV-lərinizi idarə edin və redaktə edin</p>
            </div>
            <Link
              href="/cv/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni CV Yarat
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* CVs Grid */}
        {cvs.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Hələ CV yaratmamısınız</h3>
            <p className="text-gray-600 mb-6">İlk CV-nizi yaratmaq üçün aşağıdakı düyməyə basın</p>
            <Link
              href="/cv/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              İlk CV-mi Yarat
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cvs.map((cv) => (
              <div key={cv.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {cv.title || 'Başlıqsız CV'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getTemplateDisplayName(cv.templateId)} şablonu
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
                      </svg>
                      Yaradılma: {formatDate(cv.createdAt)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Yenilənmə: {formatDate(cv.updatedAt)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/cv/edit/${cv.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
                    >
                      Redaktə Et
                    </Link>
                    <Link
                      href={`/cv/preview/${cv.id}`}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
                    >
                      Önizləmə
                    </Link>
                    <button
                      onClick={() => handleDeleteCV(cv.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        canDeleteCV()
                          ? 'bg-red-100 hover:bg-red-200 text-red-600'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                      title={canDeleteCV() 
                        ? "CV-ni sil" 
                        : "CV silmə Premium istifadəçilər üçün mövcuddur"
                      }
                      disabled={!canDeleteCV()}
                    >
                      {canDeleteCV() ? 'Sil' : 'Sil 🔒'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sürətli Əməliyyatlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/cv/create"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Yeni CV</h4>
                <p className="text-sm text-gray-600">Sıfırdan CV yarat</p>
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Dashboard</h4>
                <p className="text-sm text-gray-600">Ana səhifəyə qayıt</p>
              </div>
            </Link>

            <Link
              href="/templates"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Şablonlar</h4>
                <p className="text-sm text-gray-600">CV şablonlarına bax</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
