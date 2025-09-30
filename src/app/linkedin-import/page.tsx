'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

export default function LinkedInImportPage() {
  // All hooks must be at the top level - before any conditional returns
  const { siteLanguage } = useSiteLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<'scrapingdog' | 'brightdata'>('brightdata');

  // Site language mətnləri
  const labels = {
    azerbaijani: {
      pageTitle: 'LinkedIn-dən İdxal',
      pageSubtitle: 'LinkedIn profilinizi avtomatik olaraq idxal edin və bir neçə saniyədə peşəkar CV yaradın',
      loginRequired: 'Giriş tələb olunur...',
      redirecting: 'Giriş səhifəsinə yönləndirilirsiz...',
      features: 'Xüsusiyyətlər',
      automaticImport: 'Avtomatik İdxal',
      automaticImportDesc: 'Profil məlumatlarınız avtomatik olaraq çıxarılır',
      professionalCV: 'Peşəkar CV',
      professionalCVDesc: 'Müasir dizayn və formatlarda CV yaradın',
      secureData: 'Təhlükəsiz Məlumatlar',
      secureDataDesc: 'Məlumatlarınız təhlükəsiz şəkildə işlənir',
      howItWorks: 'Necə İşləyir?',
      step1: 'LinkedIn Linkinizi Daxil Edin',
      step1Desc: 'Profil linkinizi aşağıdakı sahəyə daxil edin',
      step2: 'Avtomatik İdxal',
      step2Desc: 'Sistem məlumatlarınızı avtomatik olaraq çıxarır',
      step3: 'CV Yaradın',
      step3Desc: 'Hazır məlumatlarınızla CV-nizi tənzimləyin',
      enterLinkedInURL: 'LinkedIn profil linkinizi daxil edin',
      placeholder: 'https://www.linkedin.com/in/sizin-profiliniz',
      importButton: 'LinkedIn-dən İdxal Edin',
      importing: 'İdxal olunur...',
      exampleFormats: 'Düzgün formatlar:',
      errorEmptyURL: 'LinkedIn URL-ni daxil edin',
      errorInvalidFormat: 'Düzgün LinkedIn URL formatı daxil edin. Məsələn: https://www.linkedin.com/in/ilgarmusayev/',
      errorLoginRequired: 'Giriş tələb olunur',
      errorImport: 'İdxal zamanı xəta baş verdi',
      successMessage: 'LinkedIn CV uğurla yaradıldı',
      linkedinURLLabel: 'LinkedIn URL',
      helpInstruction: 'Tam LinkedIn URL-ni daxil edin. Məsələn:',
      howItWorksTitle: 'Necə işləyir?',
      step1Instruction: 'LinkedIn profilinizin URL-ni daxil edin',
      step2Instruction: 'Sistemimiz LinkedIn profilinizi təhlükəsiz şəkildə oxuyacaq',
      step3Instruction: 'Bütün məlumatlar avtomatik olaraq CV formatında tərtib ediləcək',
      step4Instruction: 'Yaradılan CV-ni redaktə edə və fərdiləşdirə bilərsiniz',
      errorCVNotCreated: 'CV yaradılmadı',
      errorLinkedInImport: 'İdxal zamanı xəta baş verdi',
      errorUnknown: 'Naməlum xəta baş verdi',
      providerSelection: 'İdxal Üsulunu Seçin',
      scrapingdogProvider: 'Alternativ',
      brightdataProvider: 'Əsas',
      scrapingdogDescription: 'Təxminən 0.5-1 dəqiqə',
      brightdataDescription: 'Təxminən 1-1.5 dəqiqə',
      fastImport: 'Sürətli İdxal',
      fastImportDesc: 'Bir neçə saniyədə bütün məlumatlarınız idxal edilir',
      accurateData: 'Dəqiq Məlumat',
      accurateDataDesc: 'Bütün iş təcrübəsi və təhsil məlumatları dəqiq şəkildə idxal edilir',
      secure: 'Təhlükəsiz',
      secureDesc: 'Məlumatlarınız təhlükəsiz şəkildə işlənir və qorunur'
    },
    english: {
      pageTitle: 'LinkedIn Import',
      pageSubtitle: 'Automatically import your LinkedIn profile and create a professional CV in seconds',
      loginRequired: 'Login required...',
      redirecting: 'Redirecting to login page...',
      features: 'Features',
      automaticImport: 'Automatic Import',
      automaticImportDesc: 'Your profile data is automatically extracted',
      professionalCV: 'Professional CV',
      professionalCVDesc: 'Create CV with modern design and formats',
      secureData: 'Secure Data',
      secureDataDesc: 'Your data is processed securely',
      howItWorks: 'How It Works?',
      step1: 'Enter Your LinkedIn Link',
      step1Desc: 'Paste your profile link in the field below',
      step2: 'Automatic Import',
      step2Desc: 'System automatically extracts your information',
      step3: 'Create CV',
      step3Desc: 'Customize your CV with the imported data',
      enterLinkedInURL: 'Enter your LinkedIn profile URL',
      placeholder: 'https://www.linkedin.com/in/your-profile',
      importButton: 'Import from LinkedIn',
      importing: 'Importing...',
      exampleFormats: 'Valid formats:',
      errorEmptyURL: 'Please enter your LinkedIn URL',
      errorInvalidFormat: 'Please enter a valid LinkedIn URL format. Example: https://www.linkedin.com/in/mikayilzeynalabdinov/',
      errorLoginRequired: 'Login required',
      errorImport: 'Import error occurred',
      successMessage: 'LinkedIn CV successfully created',
      linkedinURLLabel: 'LinkedIn URL',
      helpInstruction: 'Enter the complete LinkedIn URL. For example:',
      howItWorksTitle: 'How does it work?',
      step1Instruction: 'Enter your LinkedIn profile URL',
      step2Instruction: 'Our system will securely read your LinkedIn profile',
      step3Instruction: 'All information will be automatically organized in CV format',
      step4Instruction: 'You can edit and customize the created CV',
      errorCVNotCreated: 'CV was not created',
      errorLinkedInImport: 'Import error occurred',
      errorUnknown: 'Unknown error occurred',
      providerSelection: 'Choose Import Method',
      scrapingdogProvider: 'Alternative',
      brightdataProvider: 'Primary',
      scrapingdogDescription: 'Approximately 0.5-1 minute',
      brightdataDescription: 'Approximately 1-1.5 minutes',
      fastImport: 'Fast Import',
      fastImportDesc: 'All your information is imported in seconds',
      accurateData: 'Accurate Data',
      accurateDataDesc: 'All work experience and education information is imported accurately',
      secure: 'Secure',
      secureDesc: 'Your data is processed and protected securely'
    },
    russian: {
      pageTitle: 'Импорт LinkedIn',
      pageSubtitle: 'Автоматически импортируйте свой профиль LinkedIn и создайте профессиональное резюме за секунды',
      loginRequired: 'Требуется вход...',
      redirecting: 'Перенаправление на страницу входа...',
      features: 'Особенности',
      automaticImport: 'Автоматический импорт',
      automaticImportDesc: 'Данные вашего профиля извлекаются автоматически',
      professionalCV: 'Профессиональное резюме',
      professionalCVDesc: 'Создавайте резюме с современным дизайном и форматами',
      secureData: 'Безопасные данные',
      secureDataDesc: 'Ваши данные обрабатываются безопасно',
      howItWorks: 'Как это работает?',
      step1: 'Введите ссылку на LinkedIn',
      step1Desc: 'Вставьте ссылку на ваш профиль в поле ниже',
      step2: 'Автоматический импорт',
      step2Desc: 'Система автоматически извлекает вашу информацию',
      step3: 'Создать резюме',
      step3Desc: 'Настройте ваше резюме с импортированными данными',
      enterLinkedInURL: 'Введите URL вашего профиля LinkedIn',
      placeholder: 'https://www.linkedin.com/in/ваш-профиль',
      importButton: 'Импортировать из LinkedIn',
      importing: 'Импорт...',
      exampleFormats: 'Правильные форматы:',
      errorEmptyURL: 'Пожалуйста, введите URL LinkedIn',
      errorInvalidFormat: 'Пожалуйста, введите правильный формат URL LinkedIn. Пример: https://www.linkedin.com/in/ilgarmusayev/',
      errorLoginRequired: 'Требуется вход',
      errorImport: 'Произошла ошибка импорта',
      successMessage: 'Резюме LinkedIn успешно создано',
      linkedinURLLabel: 'URL LinkedIn',
      helpInstruction: 'Введите полный URL LinkedIn. Например:',
      howItWorksTitle: 'Как это работает?',
      step1Instruction: 'Введите URL вашего профиля LinkedIn',
      step2Instruction: 'Наша система безопасно прочитает ваш профиль LinkedIn',
      step3Instruction: 'Вся информация будет автоматически организована в формате резюме',
      step4Instruction: 'Вы можете редактировать и настраивать созданное резюме',
      errorCVNotCreated: 'Резюме не было создано',
      errorLinkedInImport: 'Произошла ошибка импорта',
      errorUnknown: 'Произошла неизвестная ошибка',
      providerSelection: 'Выберите метод импорта',
      scrapingdogProvider: 'Альтернативный',
      brightdataProvider: 'Основной',
      scrapingdogDescription: 'Примерно 0.5-1 минута',
      brightdataDescription: 'Примерно 1-1.5 минуты',
      fastImport: 'Быстрый импорт',
      fastImportDesc: 'Вся ваша информация импортируется за секунды',
      accurateData: 'Точные данные',
      accurateDataDesc: 'Вся информация об опыте работы и образовании импортируется точно',
      secure: 'Безопасно',
      secureDesc: 'Ваши данные обрабатываются и защищаются безопасно'
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
      setError(content.errorEmptyURL);
      return;
    }

    const username = extractUsernameFromUrl(linkedinUrl);
    if (!username) {
      setError(content.errorInvalidFormat);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError(content.errorLoginRequired);
        setLoading(false);
        return;
      }

      console.log(`🔍 LinkedIn import via ${provider}: Username:`, username);

      // Select endpoint based on provider
      const endpoint = provider === 'brightdata' 
        ? '/api/import/linkedin-brightdata' 
        : '/api/import/linkedin';

      const response = await fetch(endpoint, {
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
        setError(result.error || content.errorImport);
        setLoading(false);
        return;
      }

      if (result.success && (result.cvId || result.data?.cvId)) {
        const cvId = result.cvId || result.data?.cvId;
        console.log(`✅ LinkedIn CV successfully created via ${provider}:`, cvId);
        console.log('📊 Full result:', result);
        
        // Redirect to edit the created CV
        router.push(`/cv/edit/${cvId}`);
      } else {
        console.log('❌ CV ID not found in response:', result);
        setError(result.error || content.errorCVNotCreated);
      }

    } catch (error) {
      console.error('❌ LinkedIn import error:', error);
      setError(content.errorLinkedInImport);
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            {/* Title Section */}
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.pageTitle}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
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
                <h3 className="font-semibold text-gray-900 mb-2">{content.fastImport}</h3>
                <p className="text-sm text-gray-600">{content.fastImportDesc}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{content.accurateData}</h3>
                <p className="text-sm text-gray-600">{content.accurateDataDesc}</p>
              </div>

              <div className="text-center p-6 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{content.secure}</h3>
                <p className="text-sm text-gray-600">{content.secureDesc}</p>
              </div>
            </div>

            {/* Import Form */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{content.enterLinkedInURL}</h2>

                <div className="space-y-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {content.providerSelection}
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div 
                        onClick={() => setProvider('brightdata')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          provider === 'brightdata' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                            provider === 'brightdata' 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {provider === 'brightdata' && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {content.brightdataProvider}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {content.brightdataDescription}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div 
                        onClick={() => setProvider('scrapingdog')}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          provider === 'scrapingdog' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                            provider === 'scrapingdog' 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {provider === 'scrapingdog' && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {content.scrapingdogProvider}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {content.scrapingdogDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      {content.linkedinURLLabel}
                    </label>
                    <input
                      type="text"
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder={content.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {content.helpInstruction} <code>https://www.linkedin.com/in/ilgarmusayev/</code>  .
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
                        {content.importing}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>{content.importButton}</span>
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
                <h3 className="font-semibold text-gray-900 mb-3">{content.howItWorksTitle}</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>{content.step1Instruction}</li>
                  <li>{content.step2Instruction}</li>
                  <li>{content.step3Instruction}</li>
                  <li>{content.step4Instruction}</li>
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
