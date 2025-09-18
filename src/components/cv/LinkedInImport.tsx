'use client';

import { useState } from 'react';
import { useAuth, getUserTier } from '@/lib/auth';

interface LinkedInData {
  sessionId?: string;
  redirectUrl?: string;
  personalInfo?: {
    name: string;
    email: string;
    phone?: string;
    linkedin: string;
    summary?: string;
    professionalSummary?: string; // AI-generated professional summary for paid users
    website?: string;
    headline?: string;
  };
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
    jobType?: string;
    skills?: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    activities?: string;
    grade?: string;
  }>;
  skills?: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  }>;
  languages?: Array<{
    name: string;
    proficiency: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    startDate: string;
    endDate?: string;
    skills?: string;
    url?: string;
  }>;
}

interface LinkedInImportProps {
  onImport: (data: any) => void;
  onCancel: () => void;
  cvLanguage?: 'azerbaijani' | 'english';
}

export default function LinkedInImport({ onImport, onCancel, cvLanguage = 'azerbaijani' }: LinkedInImportProps) {
  // LinkedIn HTML SCRAPER - API YOXDUR 
  // Puppeteer istifadə edərək HTML səhifəsindən məlumatları çəkirik
  // Bütün məlumatlar real-time olaraq LinkedIn səhifəsindən alınır
  
  const { user } = useAuth();
  const userTier = user ? getUserTier(user) : 'Free';
  
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedData, setImportedData] = useState<LinkedInData | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [showAiSummary, setShowAiSummary] = useState(false);

  // Check if user can access AI features - all paid tiers except Free/Pulsuz
  const canUseAiFeatures = userTier && !['Free', 'Pulsuz', 'free', 'pulsuz'].includes(userTier);

  const handleImport = async () => {
    if (!url.trim()) {
      setError('LinkedIn URL daxil edin');
      return;
    }

    if (!url.includes('linkedin.com')) {
      setError('Düzgün LinkedIn URL daxil edin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/import/linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setImportedData(data.data);
        setError('');
        console.log('✅ HTML Scraper ilə LinkedIn məlumatları import edildi:', data.data);
      } else {
        const errorMsg = data.error || 'HTML scraping zamanı xəta baş verdi';
        setError(errorMsg);
        console.error('❌ HTML Scraper xətası:', errorMsg);
      }
    } catch (error: any) {
      console.error('💥 HTML Scraper şəbəkə xətası:', error);
      setError('Şəbəkə xətası: ' + (error.message || 'HTML scraping zamanı xəta baş verdi'));
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = () => {
    if (importedData) {
      onImport(importedData);
    }
  };

  // AI Professional Summary Generation for Populyar/Premium users
  const generateAiSummary = async () => {
    if (!importedData || !canUseAiFeatures) return;

    // ❌ Skills olmayan CV-lər üçün AI summary yaradılmamalıdır
    const hasSkills = importedData.skills && Array.isArray(importedData.skills) && importedData.skills.length > 0;
    
    if (!hasSkills) {
      setError(cvLanguage === 'english' ? 
        'Please add skills first' :
        'Bacarıq əlavə edin'
      );
      return;
    }

    setAiSummaryLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profileData: {
            name: importedData.personalInfo?.name,
            headline: importedData.personalInfo?.headline,
            about: importedData.personalInfo?.summary,
            experience: importedData.experience,
            education: importedData.education,
            skills: importedData.skills
          },
          cvLanguage: cvLanguage
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update imported data with AI-generated summary
        setImportedData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              name: prev.personalInfo?.name || '',
              email: prev.personalInfo?.email || '',
              linkedin: prev.personalInfo?.linkedin || '',
              professionalSummary: data.data.professionalSummary
            }
          };
        });
        setShowAiSummary(true);
        console.log(`✅ AI Professional Summary generated (${cvLanguage})`);
      } else {
        // Skills yoxlaması və xüsusi mesaj
        if (data.requiresSkills) {
          setError(cvLanguage === 'english' ? 
            'Please add skills first' :
            'Bacarıq əlavə edin'
          );
        } else {
          setError(cvLanguage === 'english' ? 
            'AI Summary generation error: ' + (data.error || 'Unknown error') :
            'AI Summary generasiya xətası: ' + (data.error || 'Bilinməyən xəta')
          );
        }
      }
    } catch (error: any) {
      console.error('💥 AI Summary xətası:', error);
      setError(cvLanguage === 'english' ? 
        'AI Summary error: ' + (error.message || 'Network error') :
        'AI Summary xətası: ' + (error.message || 'Şəbəkə xətası')
      );
    } finally {
      setAiSummaryLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50/95 via-blue-50/95 to-indigo-100/95 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 sm:-top-40 -right-20 sm:-right-40 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-br from-blue-200/20 to-indigo-200/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 sm:-left-48 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-tr from-purple-200/15 to-pink-200/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 sm:bottom-20 right-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-bl from-emerald-200/15 to-teal-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 max-w-full sm:max-w-2xl lg:max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl sm:rounded-2xl flex items-center justify-center">
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">LinkedIn HTML Scraper 🌐</h2>
              <p className="text-sm sm:text-base text-gray-600">HTML scraping ilə professional məlumatlarınızı avtomatik köçürün</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center group self-end sm:self-auto"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!importedData ? (
          <div className="space-y-6 sm:space-y-8">
            {/* URL Input Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <label className="block text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                  LinkedIn Profil URL 🔗
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="linkedin.com/in/username və ya www.linkedin.com/in/username"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base sm:text-lg"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Import...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-sm sm:text-base">Import Et</span>
                      </div>
                    )}
                  </button>
                </div>
                {error && (
                  <div className="mt-3 sm:mt-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-4 sm:w-5 h-4 sm:h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm sm:text-base break-words">{error}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="w-full">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">HTML Scraping Qaydaları 🌐</h3>
                  <ul className="text-blue-700 space-y-1.5 sm:space-y-2 text-sm sm:text-base">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span><strong>API YOXDUR</strong> - Puppeteer HTML scraper istifadə edir</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>LinkedIn profilinizin <strong>public</strong> olması məcburidir</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>URL formatı: <code className="bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm break-all">https://www.linkedin.com/in/username</code></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Headless browser <strong>real-time</strong> scraping</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Bot detection bypass və optimizasiya</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 p-3 sm:p-4 text-center">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">HTML Scraping</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Puppeteer ilə real-time data</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 p-3 sm:p-4 text-center">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Sürətli Proses</h4>
                <p className="text-gray-600 text-xs sm:text-sm">Headless browser ilə sürətli</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 p-3 sm:p-4 text-center sm:col-span-2 lg:col-span-1">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">No API Limits</h4>
                <p className="text-gray-600 text-xs sm:text-sm">API limiti yoxdur, direct scraping</p>
              </div>
            </div>
          </div>
        ) : (
          // Import results display
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-green-800">HTML Scraping Uğurlu! ✅</h3>
                  <p className="text-sm sm:text-base text-green-600">LinkedIn profiliniz HTML scraper ilə uğurla import edildi</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Import Edilən Məlumatlar 📊</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Şəxsi Məlumatlar
                  </h5>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600">Ad:</span>
                      <span className="font-medium break-words">{importedData.personalInfo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                      <span className="text-gray-600">E-poçt:</span>
                      <span className="font-medium break-all">{importedData.personalInfo?.email || 'N/A'}</span>
                    </div>
                    {importedData.personalInfo?.headline && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Başlıq:</span>
                        <p className="font-medium mt-1 text-xs sm:text-sm break-words">{importedData.personalInfo.headline}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Statistika
                  </h5>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">İş Təcrübəsi:</span>
                      <span className="font-medium">{importedData.experience?.length || 0} ədəd</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Təhsil:</span>
                      <span className="font-medium">{importedData.education?.length || 0} ədəd</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bacarıqlar:</span>
                      <span className="font-medium">{importedData.skills?.length || 0} ədəd</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Professional Summary Section - Populyar/Premium Feature */}
              {canUseAiFeatures && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50 p-4 sm:p-6 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Professional Summary
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        {userTier}
                      </span>
                    </h5>
                    {/* ❌ Skills olmayan halda AI Summary düyməsi göstərilməsin */}
                    {!showAiSummary && importedData.skills && importedData.skills.length > 0 && (
                      <button
                        onClick={generateAiSummary}
                        disabled={aiSummaryLoading}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 font-medium text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiSummaryLoading ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generasiya edilir...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>AI Summary Yarat</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Skills olmayan halda bilgilendirici mesaj */}
                    {!showAiSummary && (!importedData.skills || importedData.skills.length === 0) && (
                      <div className="text-sm text-gray-500 italic">
                        Ai ilə peşəkar xülasə üçün bacarıqlar bölməsi lazımdır
                      </div>
                    )}
                  </div>

                  {showAiSummary && importedData.personalInfo?.professionalSummary ? (
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {importedData.personalInfo.professionalSummary}
                      </p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>🤖 AI Generated</span>
                          <span>📝 CV Ready</span>
                          <span>🇬🇧 English</span>
                        </div>
                        <button
                          onClick={() => setShowAiSummary(false)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          Yenidən Yarat
                        </button>
                      </div>
                    </div>
                  ) : !showAiSummary && !aiSummaryLoading && (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">AI Professional Summary hazır deyil</p>
                      <p className="text-xs text-gray-500">Yuxarıdakı düyməni basaraq CV üçün professional summary generasiya edin</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upgrade Notice for Free Users */}
              {!canUseAiFeatures && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 p-4 sm:p-6 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-semibold text-amber-800 text-sm sm:text-base">AI Professional Summary</h5>
                        <p className="text-amber-700 text-xs sm:text-sm">Populyar və ya Premium plan ilə AI-powered CV summary</p>
                      </div>
                    </div>
                    <a 
                      href="/pricing" 
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 font-medium text-sm"
                    >
                      Upgrade Et
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setImportedData(null)}
                className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium text-sm sm:text-base order-2 sm:order-1"
              >
                Yenidən Cəhd Et
              </button>
              <button
                onClick={confirmImport}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base order-1 sm:order-2"
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>CV-yə Import Et</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
