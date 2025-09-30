'use client';

import { useState, useEffect, useContext } from 'react';
import { useAuth } from '@/lib/auth';
import { SiteLanguageContext } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface CV {
  id: string;
  title: string;
  created_at: string;
}

interface CheckResult {
  overallScore: number;
  strongPoints: string[];
  missingElements: string[];
  improvements: string[];
  professionalTips: string[];
}

export default function CVChecker() {
  const { user } = useAuth();
  const context = useContext(SiteLanguageContext);
  
  if (!context) {
    throw new Error('CVChecker must be used within a SiteLanguageProvider');
  }
  
  const { siteLanguage } = context;
  const [cvs, setCVs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [loadingCVs, setLoadingCVs] = useState(true);

  // Multi-language content
  const content = {
    azerbaijani: {
      title: 'CV Yoxlayıcı',
      subtitle: 'AI ilə CV-nizin peşəkarlığını yoxlayın və inkişaf etdirin',
      selectCV: 'CV seçin',
      selectCVPlaceholder: 'Analiz etmək istədiyiniz CV-ni seçin',
      checkButton: 'CV-ni Yoxla',
      checking: 'Yoxlanılır...',
      overallScore: 'Ümumi Xal',
      strongPoints: 'Güclü Tərəflər',
      missingElements: 'Çatışmayan Elementlər',
      improvements: 'İnkişaf Sahələri',
      professionalTips: 'Peşəkar Məsləhətlər',
      noStrongPoints: 'Güclü tərəf tapılmadı',
      noMissingElements: 'Çatışmayan element yoxdur',
      noImprovements: 'İnkişaf təklifi yoxdur',
      noProfessionalTips: 'Peşəkar məsləhət yoxdur',
      errorEmptyFields: 'Zəhmət olmasa CV seçin',
      errorCheck: 'CV yoxlanılarkən xəta baş verdi',
      loadingCVs: 'CV-lər yüklənir...',
      noCVs: 'Hələ CV-niz yoxdur. Yeni CV yaradın.'
    },
    english: {
      title: 'CV Checker',
      subtitle: 'Check and improve your CV professionalism with AI',
      selectCV: 'Select CV',
      selectCVPlaceholder: 'Choose the CV you want to analyze',
      checkButton: 'Check CV',
      checking: 'Checking...',
      overallScore: 'Overall Score',
      strongPoints: 'Strong Points',
      missingElements: 'Missing Elements',
      improvements: 'Areas for Improvement',
      professionalTips: 'Professional Tips',
      noStrongPoints: 'No strong points found',
      noMissingElements: 'No missing elements',
      noImprovements: 'No improvement suggestions',
      noProfessionalTips: 'No professional tips',
      errorEmptyFields: 'Please select a CV',
      errorCheck: 'Error occurred while checking CV',
      loadingCVs: 'Loading CVs...',
      noCVs: 'You don\'t have any CVs yet. Create a new CV.'
    },
    russian: {
      title: 'Проверка резюме',
      subtitle: 'Проверьте и улучшите профессионализм вашего резюме с помощью ИИ',
      selectCV: 'Выберите резюме',
      selectCVPlaceholder: 'Выберите резюме для анализа',
      checkButton: 'Проверить резюме',
      checking: 'Проверяется...',
      overallScore: 'Общий балл',
      strongPoints: 'Сильные стороны',
      missingElements: 'Отсутствующие элементы',
      improvements: 'Области для улучшения',
      professionalTips: 'Профессиональные советы',
      noStrongPoints: 'Сильные стороны не найдены',
      noMissingElements: 'Отсутствующих элементов нет',
      noImprovements: 'Нет предложений по улучшению',
      noProfessionalTips: 'Нет профессиональных советов',
      errorEmptyFields: 'Пожалуйста, выберите резюме',
      errorCheck: 'Ошибка при проверке резюме',
      loadingCVs: 'Загрузка резюме...',
      noCVs: 'У вас пока нет резюме. Создайте новое резюме.'
    }
  };

  const labels = content[siteLanguage] || content.azerbaijani;

  // Fetch user's CVs
  useEffect(() => {
    if (!user) {
      setLoadingCVs(false);
      return;
    }

    const fetchCVs = async () => {
      setLoadingCVs(true);
      try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('/api/cvs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();
        
        if (response.ok) {
          // API direkt array qaytarır, wrapper object deyil
          const cvsArray = Array.isArray(result) ? result : (result.cvs || []);
          setCVs(cvsArray);
        }
      } catch (error) {
        console.error('Error fetching CVs:', error);
      } finally {
        setLoadingCVs(false);
      }
    };

    fetchCVs();
  }, [user]);

  const handleCheck = async () => {
    if (!selectedCV) {
      setError(labels.errorEmptyFields);
      return;
    }

    setLoading(true);
    setError('');
    setCheckResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Map site language to API language
      const apiLanguage = siteLanguage === 'azerbaijani' ? 'az' : 
                         siteLanguage === 'english' ? 'en' : 'ru';
      
      const response = await fetch('/api/cv-checker', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cvId: selectedCV,
          language: apiLanguage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || labels.errorCheck);
        return;
      }

      setCheckResult(result.analysis);
    } catch (error) {
      console.error('Check error:', error);
      setError(labels.errorCheck);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {labels.title}
            </h1>
            <p className="text-gray-600 text-lg">
              {labels.subtitle}
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            {/* CV Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {labels.selectCV}
              </label>
              
              {loadingCVs ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg">{labels.loadingCVs}</p>
                </div>
              ) : cvs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg">{labels.noCVs}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto bg-blue-50/30 rounded-lg border border-blue-100 p-2">
                    {cvs.map((cv) => (
                      <div
                        key={cv.id}
                        onClick={() => setSelectedCV(cv.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 mb-2 last:mb-0 ${
                          selectedCV === cv.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${
                              selectedCV === cv.id ? 'text-white' : 'text-gray-900'
                            }`}>
                              {cv.title}
                            </h4>
                            <p className={`text-xs mt-1 ${
                              selectedCV === cv.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {(() => {
                                try {
                                  const date = new Date(cv.created_at);
                                  if (isNaN(date.getTime())) {
                                    return siteLanguage === 'english' ? 'Date unavailable' :
                                           siteLanguage === 'russian' ? 'Дата недоступна' :
                                           'Tarix əlçatan deyil';
                                  }
                                  return date.toLocaleDateString(
                                    siteLanguage === 'english' ? 'en-US' :
                                    siteLanguage === 'russian' ? 'ru-RU' : 'az-AZ',
                                    { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    }
                                  );
                                } catch (error) {
                                  return siteLanguage === 'english' ? 'Date error' :
                                         siteLanguage === 'russian' ? 'Ошибка даты' :
                                         'Tarix xətası';
                                }
                              })()}
                            </p>
                          </div>
                          <div className={`ml-3 ${
                            selectedCV === cv.id ? 'text-white' : 'text-blue-600'
                          }`}>
                            {selectedCV === cv.id ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {cvs.length > 4 && (
                    <p className="text-xs text-blue-600 text-center">
                      {siteLanguage === 'english' ? 'Scroll to see more CVs' :
                       siteLanguage === 'russian' ? 'Прокрутите, чтобы увидеть больше резюме' :
                       'Daha çox CV görmək üçün sürüşdürün'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Check Button */}
            <button
              onClick={handleCheck}
              disabled={loading || !selectedCV}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? labels.checking : labels.checkButton}
            </button>
          </div>

          {/* Results */}
          {checkResult && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className={`bg-white rounded-lg shadow-lg p-6 ${getScoreBgColor(checkResult.overallScore)}`}>
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {labels.overallScore}
                  </h2>
                  <div className={`text-4xl font-bold ${getScoreColor(checkResult.overallScore)}`}>
                    {checkResult.overallScore}/100
                  </div>
                </div>
              </div>

              {/* Strong Points */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {labels.strongPoints}
                </h3>
                {checkResult.strongPoints.length > 0 ? (
                  <ul className="space-y-2">
                    {checkResult.strongPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">{labels.noStrongPoints}</p>
                )}
              </div>

              {/* Missing Elements */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {labels.missingElements}
                </h3>
                {checkResult.missingElements.length > 0 ? (
                  <ul className="space-y-2">
                    {checkResult.missingElements.map((element, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">✗</span>
                        <span className="text-gray-700">{element}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">{labels.noMissingElements}</p>
                )}
              </div>

              {/* Improvements */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {labels.improvements}
                </h3>
                {checkResult.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {checkResult.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">⚠</span>
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">{labels.noImprovements}</p>
                )}
              </div>

              {/* Professional Tips */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {labels.professionalTips}
                </h3>
                {checkResult.professionalTips.length > 0 ? (
                  <ul className="space-y-2">
                    {checkResult.professionalTips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">💡</span>
                        <span className="text-gray-700">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic">{labels.noProfessionalTips}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}