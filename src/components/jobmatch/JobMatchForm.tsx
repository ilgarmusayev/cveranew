'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Target, Briefcase, MapPin, Clock, DollarSign, Users, Star } from 'lucide-react';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface CV {
  id: number;
  title: string;
  data?: {
    personalInfo: {
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      phone: string;
      address: string;
      jobTitle?: string;
      position?: string;
      profession?: string;
    };
    professionalSummary: string;
    workExperience: Array<{
      jobTitle: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    skills: string[];
  };
}

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  matchPercentage: number;
  description: string;
  requirements: string[];
  benefits: string[];
  improvementAreas?: string[]; // AI analysis - areas needing improvement
}

interface JobMatchFormProps {
  onBack: () => void;
}

export default function JobMatchForm({ onBack }: JobMatchFormProps) {
  const { siteLanguage } = useSiteLanguage();
  
  // 🔍 DEBUG: Monitor siteLanguage changes
  useEffect(() => {
    console.log('🔄 JobMatchForm: siteLanguage dəyişdi:', siteLanguage);
  }, [siteLanguage]);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([]);
  const [searchError, setSearchError] = useState('');
  
  // Analysis language - independent from site language
  const [analysisLanguage, setAnalysisLanguage] = useState<'az' | 'en' | 'ru'>('az');
  
  // Form data
  const [formData, setFormData] = useState({
    jobTitle: '',
    location: '',
    jobType: 'full-time', // full-time, part-time, contract, remote
    salaryRange: '',
    experienceLevel: 'mid', // entry, mid, senior
    industryPreference: '',
    additionalFilters: ''
  });

  const content = {
    azerbaijani: {
      title: 'İş Uyğunluğu Analizi',
      steps: ['CV Seçimi', 'Axtarış Parametrləri', 'Uyğun İşlər'],
      selectCv: 'CV Seçin',
      noCvs: 'Heç bir CV tapılmadı',
      loadingCvs: 'CV-lər yüklənir...',
      searchParams: 'Axtarış Parametrləri',
      jobTitle: 'İş adı/sahə',
      location: 'Məkan',
      jobType: 'İş növü',
      salaryRange: 'Maaş aralığı',
      experienceLevel: 'Təcrübə səviyyəsi',
      industryPreference: 'Sənaye seçimi',
      additionalFilters: 'Əlavə filtrlər',
      fullTime: 'Tam vaxt',
      partTime: 'Part-time',
      contract: 'Müqavilə',
      remote: 'Uzaqdan',
      entry: 'Giriş səviyyəsi',
      mid: 'Orta səviyyə',
      senior: 'Senior səviyyə',
      searchJobs: 'İş Axtarışına Başla',
      searching: 'Axtarış davam edir...',
      matchResults: 'Uyğunluq Nəticələri',
      matchPercentage: 'Uyğunluq faizi',
      jobDetails: 'İş təfərrüatları',
      requirements: 'Tələblər',
      benefits: 'Müzayidələr',
      applyNow: 'İndi müraciət et',
      next: 'Növbəti',
      previous: 'Əvvəlki',
      optionalNote: '* Bu sahələr məcburi deyil, lakin doldurulması axtarış nəticələrini yaxşılaşdıracaq.',
      aiAnalysis: 'AI sizin CV-nizi analiz edərək ən uyğun iş imkanlarını tapacaq və uyğunluq faizini göstərəcək.',
      analysisLanguageLabel: 'Analiz Dili',
      analysisLanguageHint: 'AI cavabları hansı dildə olsun?'
    },
    english: {
      title: 'Job Match Analysis',
      steps: ['CV Selection', 'Search Parameters', 'Matching Jobs'],
      selectCv: 'Select CV',
      noCvs: 'No CVs found',
      loadingCvs: 'Loading CVs...',
      searchParams: 'Search Parameters',
      jobTitle: 'Job title/field',
      location: 'Location',
      jobType: 'Job type',
      salaryRange: 'Salary range',
      experienceLevel: 'Experience level',
      industryPreference: 'Industry preference',
      additionalFilters: 'Additional filters',
      fullTime: 'Full-time',
      partTime: 'Part-time',
      contract: 'Contract',
      remote: 'Remote',
      entry: 'Entry level',
      mid: 'Mid level',
      senior: 'Senior level',
      searchJobs: 'Start Job Search',
      searching: 'Searching...',
      matchResults: 'Match Results',
      matchPercentage: 'Match percentage',
      jobDetails: 'Job details',
      requirements: 'Requirements',
      benefits: 'Benefits',
      applyNow: 'Apply now',
      next: 'Next',
      previous: 'Previous',
      optionalNote: '* These fields are optional, but filling them will improve search results.',
      aiAnalysis: 'AI will analyze your CV to find the most suitable job opportunities and show match percentages.',
      analysisLanguageLabel: 'Analysis Language',
      analysisLanguageHint: 'In which language should AI responses be?'
    },
    russian: {
      title: 'Анализ соответствия вакансий',
      steps: ['Выбор CV', 'Параметры поиска', 'Подходящие вакансии'],
      selectCv: 'Выберите CV',
      noCvs: 'CV не найдены',
      loadingCvs: 'Загружаются CV...',
      searchParams: 'Параметры поиска',
      jobTitle: 'Название должности/сфера',
      location: 'Местоположение',
      jobType: 'Тип работы',
      salaryRange: 'Диапазон зарплаты',
      experienceLevel: 'Уровень опыта',
      industryPreference: 'Предпочтения по отрасли',
      additionalFilters: 'Дополнительные фильтры',
      fullTime: 'Полный рабочий день',
      partTime: 'Частичная занятость',
      contract: 'Контракт',
      remote: 'Удаленно',
      entry: 'Начальный уровень',
      mid: 'Средний уровень',
      senior: 'Старший уровень',
      searchJobs: 'Начать поиск работы',
      searching: 'Поиск...',
      matchResults: 'Результаты соответствия',
      matchPercentage: 'Процент соответствия',
      jobDetails: 'Детали вакансии',
      requirements: 'Требования',
      benefits: 'Преимущества',
      applyNow: 'Подать заявку',
      next: 'Далее',
      previous: 'Назад',
      optionalNote: '* Эти поля необязательны, но их заполнение улучшит результаты поиска.',
      aiAnalysis: 'ИИ проанализирует ваше CV, чтобы найти наиболее подходящие вакансии и показать процент соответствия.',
      analysisLanguageLabel: 'Язык анализа',
      analysisLanguageHint: 'На каком языке должны быть ответы ИИ?'
    }
  };

  const currentContent = content[siteLanguage] || content.azerbaijani;

  // Helper function to get full name
  const getFullName = (personalInfo: any) => {
    if (!personalInfo) return '';
    
    // Try fullName first
    if (personalInfo.fullName && personalInfo.fullName.trim()) {
      return personalInfo.fullName.trim();
    }
    
    // Fallback to firstName + lastName
    const firstName = personalInfo.firstName || '';
    const lastName = personalInfo.lastName || '';
    return `${firstName} ${lastName}`.trim();
  };

  // Fetch CVs on component mount
  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    setLoading(true);
    try {
      console.log('🔍 Job Match: CV-ləri yükləyirəm...');
      
      // Check authentication
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ Job Match: Token yoxdur, login səhifəsinə yönləndirəcəm');
        window.location.href = '/auth/login';
        return;
      }
      
      const response = await fetch('/api/cv', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📊 Job Match: API cavabı:', response.status);
      
      if (response.status === 401) {
        console.log('❌ Job Match: Token köhnədir, login səhifəsinə yönləndirəcəm');
        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Job Match: CV məlumatları:', data);
        setCvs(data.cvs || []);
        console.log('✅ Job Match: CV sayı:', data.cvs?.length || 0);
      } else {
        console.error('❌ Job Match: API xətası:', response.status);
      }
    } catch (error) {
      console.error('❌ Job Match: Xəta baş verdi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const searchJobs = async () => {
    if (!selectedCV) {
      setSearchError(siteLanguage === 'azerbaijani' 
        ? 'CV seçilməyib. Əvvəlcə CV seçin.'
        : siteLanguage === 'english'
        ? 'No CV selected. Please select a CV first.'
        : 'CV не выбрано. Сначала выберите CV.');
      return;
    }
    
    setSearchLoading(true);
    setSearchError('');
    
    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setSearchError(siteLanguage === 'azerbaijani' 
          ? 'İcazə tapılmadı. Yenidən daxil olun.'
          : siteLanguage === 'english'
          ? 'Authorization not found. Please log in again.'
          : 'Авторизация не найдена. Пожалуйста, войдите снова.');
        return;
      }

      // Map site language to API language code
      const languageMap: Record<string, string> = {
        'azerbaijani': 'az',
        'english': 'en',
        'russian': 'ru'
      };
      
      // Use analysisLanguage directly instead of siteLanguage
      const apiLanguage = analysisLanguage; // Already in 'az', 'en', 'ru' format

      // 🔍 DEBUG: Check analysis language
      console.log('🌐 Site Language:', siteLanguage);
      console.log('� Analysis Language (user selected):', analysisLanguage);
      console.log('🔤 API Language Code:', apiLanguage);

      // Build job description from form data with site language support
      const jobDescriptionLabels = {
        azerbaijani: {
          jobType: 'İş Növü',
          location: 'Yer',
          experienceLevel: 'Təcrübə Səviyyəsi',
          salaryRange: 'Maaş Aralığı',
          industry: 'Sənaye',
          additionalFilters: 'Əlavə Filtrlər',
          notSpecified: 'Göstərilməyib',
          none: 'Yoxdur'
        },
        english: {
          jobType: 'Job Type',
          location: 'Location',
          experienceLevel: 'Experience Level',
          salaryRange: 'Salary Range',
          industry: 'Industry',
          additionalFilters: 'Additional Filters',
          notSpecified: 'Not specified',
          none: 'None'
        },
        russian: {
          jobType: 'Тип работы',
          location: 'Местоположение',
          experienceLevel: 'Уровень опыта',
          salaryRange: 'Зарплата',
          industry: 'Индустрия',
          additionalFilters: 'Дополнительные фильтры',
          notSpecified: 'Не указано',
          none: 'Нет'
        }
      };

      const labels = jobDescriptionLabels[siteLanguage as keyof typeof jobDescriptionLabels] || jobDescriptionLabels.azerbaijani;

      // Map form values to display text based on site language
      const jobTypeMap: Record<string, Record<string, string>> = {
        'full-time': { azerbaijani: 'Tam vaxt', english: 'Full-time', russian: 'Полный рабочий день' },
        'part-time': { azerbaijani: 'Yarım vaxt', english: 'Part-time', russian: 'Неполный рабочий день' },
        'contract': { azerbaijani: 'Müqavilə', english: 'Contract', russian: 'Контракт' },
        'remote': { azerbaijani: 'Uzaqdan', english: 'Remote', russian: 'Удаленная работа' }
      };

      const experienceLevelMap: Record<string, Record<string, string>> = {
        'entry': { azerbaijani: 'Başlanğıc', english: 'Entry Level', russian: 'Начальный' },
        'mid': { azerbaijani: 'Orta', english: 'Mid Level', russian: 'Средний' },
        'senior': { azerbaijani: 'Yüksək', english: 'Senior Level', russian: 'Высокий' }
      };

      const jobTypeDisplay = jobTypeMap[formData.jobType]?.[siteLanguage] || formData.jobType;
      const experienceLevelDisplay = experienceLevelMap[formData.experienceLevel]?.[siteLanguage] || formData.experienceLevel;

      const jobDescriptionText = `
${labels.jobType}: ${jobTypeDisplay}
${labels.location}: ${formData.location || labels.notSpecified}
${labels.experienceLevel}: ${experienceLevelDisplay}
${labels.salaryRange}: ${formData.salaryRange || labels.notSpecified}
${labels.industry}: ${formData.industryPreference || labels.notSpecified}
${labels.additionalFilters}: ${formData.additionalFilters || labels.none}
      `.trim();

      // 🔍 DEBUG: Log job description being sent
      console.log('📝 Job Description:', jobDescriptionText);

      // Call real Job Match API with site language
      console.log('🚀 Sending API request with language:', apiLanguage);
      const response = await fetch('/api/job-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cvId: selectedCV,
          jobTitle: formData.jobTitle,
          jobDescription: jobDescriptionText,
          language: apiLanguage // Pass site language to API
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API xətası');
      }

      const data = await response.json();
      
      // 🔍 DEBUG: Check API response
      console.log('✅ API Response:', data);
      console.log('📊 Analysis data:', data.analysis);
      
      if (data.success && data.analysis) {
        // Convert API response to JobMatch format
        const jobMatch: JobMatch = {
          id: '1',
          title: formData.jobTitle,
          company: formData.industryPreference || siteLanguage === 'azerbaijani' 
            ? 'Müəssisə məlumatı yoxdur' 
            : siteLanguage === 'english'
            ? 'Company information not available'
            : 'Информация о компании недоступна',
          location: formData.location || siteLanguage === 'azerbaijani' 
            ? 'Məkan göstərilməyib' 
            : siteLanguage === 'english'
            ? 'Location not specified'
            : 'Местоположение не указано',
          type: formData.jobType,
          salary: formData.salaryRange || siteLanguage === 'azerbaijani' 
            ? 'Maaş göstərilməyib' 
            : siteLanguage === 'english'
            ? 'Salary not specified'
            : 'Зарплата не указана',
          matchPercentage: data.analysis.overallScore,
          description: siteLanguage === 'azerbaijani' 
            ? 'AI tərəfindən analiz edilmiş iş uyğunluğu' 
            : siteLanguage === 'english'
            ? 'AI-analyzed job compatibility'
            : 'Совместимость с работой, проанализированная ИИ',
          requirements: data.analysis.matchingPoints || [],
          benefits: data.analysis.recommendations || [],
          improvementAreas: data.analysis.improvementAreas || []
        };

        setJobMatches([jobMatch]);
        setCurrentStep(3);
      } else {
        throw new Error('Analiz cavabı tapılmadı');
      }
      
    } catch (error) {
      console.error('Error searching jobs:', error);
      setSearchError(siteLanguage === 'azerbaijani' 
        ? `Axtarış zamanı xəta baş verdi: ${error instanceof Error ? error.message : 'Naməlum xəta'}`
        : siteLanguage === 'english'
        ? `An error occurred during search: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `Произошла ошибка при поиске: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setSearchLoading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Check if CVs are available */}
      {cvs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{currentContent.noCvs}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {siteLanguage === 'azerbaijani' 
                ? 'İş axtarışı üçün əvvəlcə CV yaratmalısınız.'
                : siteLanguage === 'english'
                ? 'You need to create a CV first to search for jobs.'
                : 'Сначала вам нужно создать CV для поиска работы.'
              }
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {siteLanguage === 'azerbaijani' 
                ? 'Dashboard-a qayıt'
                : siteLanguage === 'english'
                ? 'Go to Dashboard'
                : 'Перейти в дашборд'
              }
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentContent.searchParams}
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  {currentContent.aiAnalysis}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Analysis Language Selector - NEW */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.analysisLanguageLabel}
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setAnalysisLanguage('az')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    analysisLanguage === 'az'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  Azərbaycan
                </button>
                <button
                  onClick={() => setAnalysisLanguage('en')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    analysisLanguage === 'en'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setAnalysisLanguage('ru')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-200 ${
                    analysisLanguage === 'ru'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
                  }`}
                >
                  Русский
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{currentContent.analysisLanguageHint}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.jobTitle}
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="Software Developer, Designer, Manager..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.location}
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Baku, Remote, Worldwide..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.jobType}
              </label>
              <select
                value={formData.jobType}
                onChange={(e) => handleInputChange('jobType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full-time">{currentContent.fullTime}</option>
                <option value="part-time">{currentContent.partTime}</option>
                <option value="contract">{currentContent.contract}</option>
                <option value="remote">{currentContent.remote}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.experienceLevel}
              </label>
              <select
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="entry">{currentContent.entry}</option>
                <option value="mid">{currentContent.mid}</option>
                <option value="senior">{currentContent.senior}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.salaryRange}
              </label>
              <input
                type="text"
                value={formData.salaryRange}
                onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                placeholder="1000-2000 AZN, $50k-80k..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentContent.industryPreference}
              </label>
              <input
                type="text"
                value={formData.industryPreference}
                onChange={(e) => handleInputChange('industryPreference', e.target.value)}
                placeholder="Technology, Finance, Healthcare..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {currentContent.additionalFilters}
            </label>
            <textarea
              value={formData.additionalFilters}
              onChange={(e) => handleInputChange('additionalFilters', e.target.value)}
              rows={3}
              placeholder="Remote work required, specific technologies, company size..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="border-t pt-8">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentContent.searchJobs}
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                {currentContent.aiAnalysis}
              </p>
              <button
                onClick={searchJobs}
                disabled={searchLoading}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {searchLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{currentContent.searching}</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>{currentContent.searchJobs}</span>
                  </>
                )}
              </button>
              
              {/* Search Error Message */}
              {searchError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{searchError}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              {currentContent.optionalNote}
            </p>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {currentContent.matchResults}
        </h2>
        <p className="text-gray-600">
          {siteLanguage === 'azerbaijani' 
            ? `${jobMatches.length} uyğun iş tapıldı`
            : siteLanguage === 'english'
            ? `Found ${jobMatches.length} matching jobs`
            : `Найдено ${jobMatches.length} подходящих вакансий`
          }
        </p>
      </div>

      <div className="space-y-6">
        {jobMatches.map((job) => (
          <div
            key={job.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {job.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Briefcase className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{job.salary}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  job.matchPercentage >= 90 ? 'bg-green-100 text-green-800' :
                  job.matchPercentage >= 75 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {job.matchPercentage}% {currentContent.matchPercentage}
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(job.matchPercentage / 20)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-2">
              {job.description}
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {siteLanguage === 'azerbaijani' 
                    ? 'Uyğun Məqamlar' 
                    : siteLanguage === 'english'
                    ? 'Matching Points'
                    : 'Совпадающие моменты'
                  }
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
              
              {job.improvementAreas && job.improvementAreas.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {siteLanguage === 'azerbaijani' 
                      ? 'İnkişaf Sahələri' 
                      : siteLanguage === 'english'
                      ? 'Improvement Areas'
                      : 'Области улучшения'
                    }
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {job.improvementAreas.map((area, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-md"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {siteLanguage === 'azerbaijani' 
                    ? 'Tövsiyələr' 
                    : siteLanguage === 'english'
                    ? 'Recommendations'
                    : 'Рекомендации'
                  }
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {currentContent.applyNow}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-center text-white">
                    {currentContent.title}
                  </h1>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-4">
                {[1, 2].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-12 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        step <= currentStep
                          ? 'bg-white text-green-600'
                          : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {step}
                    </div>
                    {step < 2 && (
                      <div
                        className={`w-16 h-1 mx-2 transition-colors ${
                          step < currentStep ? 'bg-white' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <div className="flex space-x-8 text-sm">
                {currentContent.steps.map((stepName, index) => (
                  <span
                    key={index}
                    className={`transition-opacity ${
                      index + 1 <= currentStep ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    {stepName}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {currentStep === 2 && (
            <div className="border-t bg-gray-50 px-8 py-4 flex justify-between">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>{currentContent.previous}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}