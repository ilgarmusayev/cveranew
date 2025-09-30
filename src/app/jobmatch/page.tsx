'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface CV {
  id: string;
  title: string;
  cv_data: any;
  createdAt: string;
}

interface AnalysisResult {
  overallScore: number;
  matchingPoints: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export default function JobMatchPage() {
  const { siteLanguage } = useSiteLanguage();
  const { user } = useAuth();
  const router = useRouter();
  
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  // Multilingual content
  const labels = {
    azerbaijani: {
      pageTitle: 'İş Uyğunluq Analizi',
      pageSubtitle: 'CV-nizin iş elanına uyğunluğunu AI ilə analiz edin və peşəkar tövsiyələr alın',
      loginRequired: 'Giriş tələb olunur...',
      redirecting: 'Giriş səhifəsinə yönləndirilirsiz...',
      selectCV: 'CV Seçin',
      selectCVPlaceholder: 'Analiz ediləcək CV-ni seçin',
      noCVsFound: 'Heç bir CV tapılmadı. Əvvəlcə CV yaradın.',
      jobTitle: 'İş Elanının Başlığı',
      jobTitlePlaceholder: 'Məsələn: Frontend Developer, Marketing Manager, Data Analyst',
      jobDescription: 'İş Elanının Təsviri',
      jobDescriptionPlaceholder: 'İş elanının tam mətnini bura yapışdırın...',
      analyzeButton: 'Uyğunluq Analizi Edin',
      analyzing: 'Analiz edilir...',
      overallMatch: 'Ümumi Uyğunluq Faizi',
      matchingPoints: 'Uyğunluq Məqamları',
      improvementAreas: 'İnkişaf Ehtiyacı Olan Sahələr',
      recommendations: 'Tövsiyələr',
      errorEmptyFields: 'Bütün sahələri doldurun',
      errorAnalysis: 'Analiz zamanı xəta baş verdi',
      features: 'Xüsusiyyətlər',
      aiAnalysis: 'AI Analizi',
      aiAnalysisDesc: 'Qabaqcıl AI ilə detallı uyğunluq analizi',
      careerAdvice: 'Karyera Məsləhəti',
      careerAdviceDesc: 'Peşəkar karyera inkişafı tövsiyələri',
      realTimeResults: 'Canlı Nəticələr',
      realTimeResultsDesc: 'Dərhal analiz nəticələri və geri bildirim'
    },
    english: {
      pageTitle: 'Job Match Analysis',
      pageSubtitle: 'Analyze your CV compatibility with job listings using AI and get professional recommendations',
      loginRequired: 'Login required...',
      redirecting: 'Redirecting to login page...',
      selectCV: 'Select CV',
      selectCVPlaceholder: 'Choose CV to analyze',
      noCVsFound: 'No CVs found. Please create a CV first.',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'e.g., Frontend Developer, Marketing Manager, Data Analyst',
      jobDescription: 'Job Description',
      jobDescriptionPlaceholder: 'Paste the complete job listing text here...',
      analyzeButton: 'Analyze Match',
      analyzing: 'Analyzing...',
      overallMatch: 'Overall Match Percentage',
      matchingPoints: 'Matching Points',
      improvementAreas: 'Areas for Improvement',
      recommendations: 'Recommendations',
      errorEmptyFields: 'Please fill in all fields',
      errorAnalysis: 'Error occurred during analysis',
      features: 'Features',
      aiAnalysis: 'AI Analysis',
      aiAnalysisDesc: 'Detailed compatibility analysis with advanced AI',
      careerAdvice: 'Career Advice',
      careerAdviceDesc: 'Professional career development recommendations',
      realTimeResults: 'Real-time Results',
      realTimeResultsDesc: 'Instant analysis results and feedback'
    },
    russian: {
      pageTitle: 'Анализ соответствия вакансии',
      pageSubtitle: 'Анализируйте совместимость вашего резюме с вакансиями с помощью ИИ и получайте профессиональные рекомендации',
      loginRequired: 'Требуется вход...',
      redirecting: 'Перенаправление на страницу входа...',
      selectCV: 'Выберите резюме',
      selectCVPlaceholder: 'Выберите резюме для анализа',
      noCVsFound: 'Резюме не найдено. Сначала создайте резюме.',
      jobTitle: 'Название вакансии',
      jobTitlePlaceholder: 'например: Frontend Developer, Marketing Manager, Data Analyst',
      jobDescription: 'Описание вакансии',
      jobDescriptionPlaceholder: 'Вставьте полный текст вакансии сюда...',
      analyzeButton: 'Анализировать соответствие',
      analyzing: 'Анализ...',
      overallMatch: 'Общий процент соответствия',
      matchingPoints: 'Точки соответствия',
      improvementAreas: 'Области для улучшения',
      recommendations: 'Рекомендации',
      errorEmptyFields: 'Заполните все поля',
      errorAnalysis: 'Произошла ошибка во время анализа',
      features: 'Особенности',
      aiAnalysis: 'ИИ Анализ',
      aiAnalysisDesc: 'Детальный анализ совместимости с продвинутым ИИ',
      careerAdvice: 'Карьерные советы',
      careerAdviceDesc: 'Профессиональные рекомендации по развитию карьеры',
      realTimeResults: 'Результаты в реальном времени',
      realTimeResultsDesc: 'Мгновенные результаты анализа и обратная связь'
    }
  };

  const content = labels[siteLanguage];

  // Handle redirect for non-authenticated users
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, router]);

  // Fetch user's CVs
  useEffect(() => {
    const fetchCVs = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/cv', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCvs(data.cvs || []);
        }
      } catch (error) {
        console.error('Error fetching CVs:', error);
      }
    };

    fetchCVs();
  }, [user]);

  const handleAnalyze = async () => {
    if (!selectedCV || !jobTitle.trim() || !jobDescription.trim()) {
      setError(content.errorEmptyFields);
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/job-match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cvId: selectedCV,
          jobTitle: jobTitle.trim(),
          jobDescription: jobDescription.trim(),
          language: siteLanguage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || content.errorAnalysis);
        return;
      }

      setAnalysisResult(result.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      setError(content.errorAnalysis);
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
          <p className="text-gray-600">{content.loginRequired}</p>
          <p className="text-sm text-gray-500 mt-2">{content.redirecting}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.pageTitle}</h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                {content.pageSubtitle}
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
                <h3 className="font-semibold text-gray-900 mb-2">{content.aiAnalysis}</h3>
                <p className="text-sm text-gray-600">{content.aiAnalysisDesc}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{content.careerAdvice}</h3>
                <p className="text-sm text-gray-600">{content.careerAdviceDesc}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{content.realTimeResults}</h3>
                <p className="text-sm text-gray-600">{content.realTimeResultsDesc}</p>
              </div>
            </div>

            {/* Analysis Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{content.pageTitle}</h2>

                <div className="space-y-6">
                  {/* CV Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.selectCV}
                    </label>
                    <select
                      value={selectedCV}
                      onChange={(e) => setSelectedCV(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    >
                      <option value="">{content.selectCVPlaceholder}</option>
                      {cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.title} - {new Date(cv.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    {cvs.length === 0 && (
                      <p className="mt-2 text-sm text-gray-500">{content.noCVsFound}</p>
                    )}
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.jobTitle}
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder={content.jobTitlePlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                  </div>

                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {content.jobDescription}
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder={content.jobDescriptionPlaceholder}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 resize-none"
                      disabled={loading}
                    />
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
                    onClick={handleAnalyze}
                    disabled={loading || !selectedCV || !jobTitle.trim() || !jobDescription.trim()}
                    className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {content.analyzing}
                      </div>
                    ) : (
                      content.analyzeButton
                    )}
                  </button>
                </div>
              </div>

              {/* Results Section */}
              <div className="bg-gray-50 rounded-2xl p-8">
                {analysisResult ? (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center bg-white rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.overallMatch}</h3>
                      <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${analysisResult.overallScore * 2.51} 251`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl font-bold text-blue-600">{analysisResult.overallScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Matching Points */}
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.matchingPoints}</h3>
                      <ul className="space-y-2">
                        {analysisResult.matchingPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Improvement Areas */}
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.improvementAreas}</h3>
                      <ul className="space-y-2">
                        {analysisResult.improvementAreas.map((area, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.recommendations}</h3>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">
                      {siteLanguage === 'azerbaijani' && 'Analiz nəticələri burada görünəcək'}
                      {siteLanguage === 'english' && 'Analysis results will appear here'}
                      {siteLanguage === 'russian' && 'Результаты анализа появятся здесь'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}