'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import CVEditor from '@/components/cv/CVEditor';
import CVDataLoader from '@/components/cv/CVData';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useLocalizedMessages } from '@/utils/errorMessages';
import { CVData } from '@/types/cv';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { getLoadingMessages } from '@/components/ui/Loading';

export default function EditCVPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const { siteLanguage } = useSiteLanguage();
  const loadingMessages = getLoadingMessages(siteLanguage);
  const { getErrorMessage } = useLocalizedMessages();
  const [error, setError] = useState('');

  const cvId = params.id as string;
  const isNewCV = cvId === 'new';
  const importType = searchParams.get('import');
  const sessionId = searchParams.get('session');
  const dataParam = searchParams.get('data');
  
  // State for session-based import data
  const [sessionImportData, setSessionImportData] = useState(null);
  
  // Process imported data from URL or session
  let linkedInData = null;
  if (sessionImportData) {
    linkedInData = sessionImportData;
  } else if (dataParam) {
    try {
      linkedInData = JSON.parse(decodeURIComponent(dataParam));
    } catch (e) {
      console.error('Failed to parse LinkedIn data from URL:', e);
    }
  }

  // Extract user tier from user.tier field first, then subscriptions
  const getUserTier = () => {
    // First check the user's tier field directly
    if (user?.tier && user.tier !== 'Free') {
      console.log('Using direct user tier:', user.tier);
      return user.tier;
    }

    // Fall back to subscription-based tier detection
    if (!user?.subscriptions || user.subscriptions.length === 0) {
      console.log('No subscriptions found, using Free tier');
      return 'Free';
    }

    // Find the most recent active subscription
    const activeSubscription = user.subscriptions
      .filter(sub => sub.status === 'active')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

    const subscriptionTier = activeSubscription?.tier || 'Free';
    console.log('Using subscription tier:', subscriptionTier);
    return subscriptionTier;
  };

  // Debug logging
  console.log('Edit page debug:', {
    importType,
    sessionId,
    dataParam: dataParam ? 'present' : 'null',
    hasSessionData: !!sessionImportData,
    linkedInData: linkedInData ? 'present' : 'null',
    linkedInDataSample: linkedInData ? JSON.stringify(linkedInData).substring(0, 200) : 'null',
    userTier: getUserTier()
  });

  useEffect(() => {
    console.log('Edit page useEffect:', { 
      user: !!user, 
      authLoading, 
      cvId, 
      isNewCV 
    });
    
    if (!authLoading && !user) {
      console.log('No user, redirecting to home');
      router.push('/');
      return;
    }

    // Initialize data for new CV
    if (isNewCV && user) {
      console.log('New CV detected, setting loading to false');
      setLoading(false);
    }
    
    // For existing CV, CVEditor will handle loading
    if (!isNewCV && user) {
      console.log('Existing CV detected, setting loading to false');
      setLoading(false);
    }
  }, [user, authLoading, router, isNewCV, cvId]);

  // Load session import data if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      const loadSessionData = async () => {
        try {
          console.log('Loading session data for sessionId:', sessionId);
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`/api/import/session?session=${sessionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('Session API response:', result);
            if (result.success && result.data) {
              console.log('Session data loaded successfully:', result.data);
              setSessionImportData(result.data);
            } else {
              console.error('Session data load failed:', result.error);
              setError(getErrorMessage('loadingError'));
            }
          } else {
            console.error('Session response not ok:', response.status);
            setError(getErrorMessage('loadingError'));
          }
        } catch (error) {
          console.error('Failed to load session import data:', error);
          setError(getErrorMessage('loadingError'));
        }
      };
      
      loadSessionData();
    }
  }, [sessionId]);

  const handleSave = async (cvData: any) => {
    try {
      console.log('Edit page: CV saved successfully by CVEditor:', cvData);
      
      // CVEditor already handles the save operation, we just refresh the page to update data
      // Instead of redirecting to dashboard, refresh the current page
      window.location.reload();
    } catch (err) {
      console.error('Edit page: CV save error:', err);
      setError(getErrorMessage('cvSaveError'));
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{loadingMessages.cvLoading}</h3>
            <p className="text-gray-600">{loadingMessages.pleaseWait}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-200/50 p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{getErrorMessage('genericError')}</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              Dashboard'a Qayıt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-48 w-80 h-80 bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-bl from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
        </div>


        {/* Main Content */}
        <div className="relative z-10">
          {isNewCV ? (
            <CVEditor
              cvId={undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              initialData={linkedInData} // For new CVs, use LinkedIn data if available
              userTier={getUserTier()}
            />
          ) : (
            <CVDataLoader
              cvId={cvId}
              onSave={handleSave}
              onCancel={handleCancel}
              userTier={getUserTier()}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
