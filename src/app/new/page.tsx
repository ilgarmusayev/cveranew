'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

// Template interface
interface Template {
  id: string;
  name: string;
  tier: string;
  previewUrl?: string;
  description: string;
  description_en?: string;
}

// NewCV component that uses searchParams
function NewCVContent() {
  const { user } = useAuth();
  const { siteLanguage } = useSiteLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Template state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templatesLoading, setTemplatesLoading] = useState(true);
  
  // Site language mətnləri
  const content = {
    azerbaijani: {
      // Page title and description
      pageTitle: 'Yeni CV Yaradın',
      pageDescription: 'Əsas məlumatları daxil edib CV yaratdıqdan sonra yaradılan CV-nizi tam redaktə edə bilərsiniz',
      
      // Auth messages
      loginRequired: 'Giriş tələb olunur...',
      
      // Form fields
      cvTitleLabel: 'CV Başlığı *',
      cvTitlePlaceholder: 'məsələn: Frontend Developer CV',
      
      // Template selection
      templateSectionTitle: 'CV Şablonu *',
      templateSectionDescription: 'CV-nizin görünüşünü müəyyən edəcək şablon seçin',
      templateLoadingText: 'Şablonlar yüklənir...',
      templateSelectPlaceholder: 'Şablon seçin',
      
      // Template tiers
      tiers: {
        Free: 'Pulsuz',
        Medium: 'Populyar',
        Premium: 'Premium'
      },
      
      // Personal info section
      personalInfoTitle: 'Şəxsi Məlumatlar',
      firstNameLabel: 'Ad',
      firstNamePlaceholder: 'Adınız',
      lastNameLabel: 'Soyad',
      lastNamePlaceholder: 'Soyadınız',
      emailLabel: 'Email',
      emailPlaceholder: 'numune@cvera.net',
      phoneLabel: 'Telefon',
      phonePlaceholder: '+994 XX XXX XX XX',
      summaryLabel: 'Qısa Məlumat',
      summaryPlaceholder: 'Özünüz haqqında qısa məlumat...',
      
      // Buttons
      cancelButton: 'Ləğv et',
      createButton: 'CV yaradın və redaktəyə başlayın',
      creatingButton: 'Yaradılır...',
      
      // Error messages
      titleRequired: 'CV başlığı tələb olunur',
      templateRequired: 'Template seçimi tələb olunur',
      loginRequiredError: 'Giriş tələb olunur',
      cvNotCreated: 'CV yaradılmadı',
      createError: 'CV yaradılanda xəta:',
      unknownError: 'Naməlum xəta',
      
      // Console messages

      linkedinDataLoaded: '📥 LinkedIn məlumatları yükləndi:',
      linkedinAutoFilled: '✅ LinkedIn məlumatları avtomatik dolduruldu',
      linkedinNotFound: 'LinkedIn məlumatları tapılmadı və ya yüklənmədi',
      linkedinLoadError: 'LinkedIn məlumatları yüklənərkən xəta:',
      sendingData: '📤 Göndərilən məlumatlar:',
      structuredData: '📤 Strukturlanmış CV məlumatları:',
      apiResponse: '📥 API cavabı:',
      cvCreated: '✅ Yeni CV yaradıldı:',
      cvCreateError: '❌ CV yaratma xətası:',
      
      // Next steps section
      nextStepsTitle: 'Növbəti addımlar',
      nextStep1: 'CV yaradıldıqdan sonra redaktə səhifəsinə yönləndiriləcəksiniz',
      nextStep2: 'İş təcrübəsi, təhsil və bacarıqlarınızı əlavə edə bilərsiniz',

      nextStep4: 'CV-ni PDF formatında yükləyə bilərsiniz',
    },
    english: {
      // Page title and description
      pageTitle: 'Create New CV',
      pageDescription: 'Enter basic information and after creating the CV, you can fully edit your created CV',
      
      // Auth messages
      loginRequired: 'Login required...',
      
      // Form fields
      cvTitleLabel: 'CV Title *',
      cvTitlePlaceholder: 'e.g.: Frontend Developer CV',
      
      // Template selection
      templateSectionTitle: 'CV Template *',
      templateSectionDescription: 'Choose a template that will determine the appearance of your CV',
      templateLoadingText: 'Loading templates...',
      templateSelectPlaceholder: 'Select template',
      
      // Template tiers
      tiers: {
        Free: 'Free',
        Medium: 'Popular',
        Premium: 'Premium'
      },
      
      // Personal info section
      personalInfoTitle: 'Personal Information',
      firstNameLabel: 'First Name',
      firstNamePlaceholder: 'Your first name',
      lastNameLabel: 'Last Name',
      lastNamePlaceholder: 'Your last name',
      emailLabel: 'Email',
      emailPlaceholder: 'example@cvera.net',
      phoneLabel: 'Phone',
      phonePlaceholder: '+1 XXX XXX XXXX',
      summaryLabel: 'Summary',
      summaryPlaceholder: 'Brief information about yourself...',
      
      // Buttons
      cancelButton: 'Cancel',
      createButton: 'Create CV and start editing',
      creatingButton: 'Creating...',
      
      // Error messages
      titleRequired: 'CV title is required',
      templateRequired: 'Template selection is required',
      loginRequiredError: 'Login required',
      cvNotCreated: 'CV not created',
      createError: 'Error creating CV:',
      unknownError: 'Unknown error',
      
      // Console messages

      linkedinDataLoaded: '📥 LinkedIn data loaded:',
      linkedinAutoFilled: '✅ LinkedIn data auto-filled',
      linkedinNotFound: 'LinkedIn data not found or not loaded',
      linkedinLoadError: 'Error loading LinkedIn data:',
      sendingData: '📤 Sending data:',
      structuredData: '📤 Structured CV data:',
      apiResponse: '📥 API response:',
      cvCreated: '✅ New CV created:',
      cvCreateError: '❌ CV creation error:',
      
      // Next steps section
      nextStepsTitle: 'Next Steps',
      nextStep1: 'After creating the CV, you will be redirected to the edit page',
      nextStep2: 'You can add work experience, education and skills',

      nextStep4: 'You can download the CV in PDF format',
    },
    russian: {
      // Page title and description
      pageTitle: 'Создать новое резюме',
      pageDescription: 'Введите основную информацию, и после создания резюме вы сможете полностью редактировать ваше созданное резюме',
      
      // Auth messages
      loginRequired: 'Требуется вход...',
      
      // Form fields
      cvTitleLabel: 'Название резюме *',
      cvTitlePlaceholder: 'например: Резюме Frontend разработчика',
      
      // Template selection
      templateSectionTitle: 'Шаблон резюме *',
      templateSectionDescription: 'Выберите шаблон, который определит внешний вид вашего резюме',
      templateLoadingText: 'Загрузка шаблонов...',
      templateSelectPlaceholder: 'Выберите шаблон',
      
      // Template tiers
      tiers: {
        Free: 'Бесплатно',
        Medium: 'Популярный',
        Premium: 'Премиум'
      },
      
      // Personal info section
      personalInfoTitle: 'Личная информация',
      firstNameLabel: 'Имя',
      firstNamePlaceholder: 'Ваше имя',
      lastNameLabel: 'Фамилия',
      lastNamePlaceholder: 'Ваша фамилия',
      emailLabel: 'Email',
      emailPlaceholder: 'example@cvera.net',
      phoneLabel: 'Телефон',
      phonePlaceholder: '+7 XXX XXX XXXX',
      summaryLabel: 'Краткая информация',
      summaryPlaceholder: 'Краткая информация о себе...',
      
      // Buttons
      cancelButton: 'Отмена',
      createButton: 'Создать резюме и начать редактирование',
      creatingButton: 'Создание...',
      
      // Error messages
      titleRequired: 'Название резюме обязательно',
      templateRequired: 'Выбор шаблона обязателен',
      loginRequiredError: 'Требуется вход',
      cvNotCreated: 'Резюме не создано',
      createError: 'Ошибка при создании резюме:',
      unknownError: 'Неизвестная ошибка',
      
      // Console messages

      linkedinDataLoaded: '📥 Данные LinkedIn загружены:',
      linkedinAutoFilled: '✅ Данные LinkedIn автоматически заполнены',
      linkedinNotFound: 'Данные LinkedIn не найдены или не загружены',
      linkedinLoadError: 'Ошибка загрузки данных LinkedIn:',
      sendingData: '📤 Отправка данных:',
      structuredData: '📤 Структурированные данные резюме:',
      apiResponse: '📥 Ответ API:',
      cvCreated: '✅ Новое резюме создано:',
      cvCreateError: '❌ Ошибка создания резюме:',
      
      // Next steps section
      nextStepsTitle: 'Следующие шаги',
      nextStep1: 'После создания резюме вы будете перенаправлены на страницу редактирования',
      nextStep2: 'Вы можете добавить опыт работы, образование и навыки',
      nextStep3: 'Вы можете изменить шаблон в любое время',
      nextStep4: 'Вы можете скачать резюме в формате PDF',
    }
  }[siteLanguage];
  
  const [formData, setFormData] = useState({
    title: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      summary: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load LinkedIn data on component mount
  useEffect(() => {
    if (user) {
      loadLinkedInData();
    }
  }, [user]);

  // Load templates function - SQL-dən template məlumatları
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      console.log('🎨 Loading templates from database...');
      
      const response = await fetch('/api/templates', {
        headers: {
          'x-site-language': siteLanguage
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Templates API response:', data);
        
        // API { templates: [...], userTier: '...', limits: {...} } formatında cavab verir
        const templateList = data.templates || data;
        
        if (Array.isArray(templateList) && templateList.length > 0) {
          setTemplates(templateList);
          
          // URL-dən template parameter-i yoxla
          const templateFromUrl = searchParams.get('template');
          
          if (templateFromUrl) {
            // URL-dən gələn template ID-nin mövcud olub-olmadığını yoxla
            const foundTemplate = templateList.find(t => t.id === templateFromUrl);
            if (foundTemplate) {
              setSelectedTemplateId(templateFromUrl);
              console.log('🎯 Template selected from URL:', foundTemplate.name);
            } else {
              // URL template mövcud deyilsə, ilk template-i seç
              setSelectedTemplateId(templateList[0].id);
              console.log('⚠️ Template from URL not found, using default:', templateList[0].name);
            }
          } else {
            // URL parameter yoxdursa, ilk template-i default seç
            setSelectedTemplateId(templateList[0].id);
            console.log('🎯 Default template selected:', templateList[0].name);
          }
          
          console.log('📊 Total templates loaded:', templateList.length);
        } else {
          console.error('❌ No templates found in database');
          setTemplates([]);
        }
      } else {
        console.error('❌ Template loading failed from database');
        setTemplates([]);
      }
    } catch (error) {
      console.error('❌ Template loading error:', error);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Load LinkedIn data if available
  const loadLinkedInData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/linkedin-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const linkedinData = await response.json();
        console.log(content.linkedinDataLoaded, linkedinData);

        // Auto-populate form with LinkedIn data
        if (linkedinData.profile) {
          const profile = linkedinData.profile;

          setFormData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              firstName: profile.firstName || prev.personalInfo.firstName,
              lastName: profile.lastName || prev.personalInfo.lastName,
              email: profile.emailAddress || prev.personalInfo.email,
              summary: profile.summary || prev.personalInfo.summary,
              // LinkedIn phone and address might be in different format
              phone: profile.phoneNumbers?.[0]?.number || prev.personalInfo.phone,
              address: profile.location?.name || prev.personalInfo.address
            }
          }));

          console.log(content.linkedinAutoFilled);
        }
      } else {
        console.log(content.linkedinNotFound);
      }
    } catch (error) {
      console.error(content.linkedinLoadError, error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'title' || field === 'templateId') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          [field]: value
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError(content.titleRequired);
      return;
    }

    if (!selectedTemplateId) {
      setError(content.templateRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError(content.loginRequiredError);
        setLoading(false);
        return;
      }

      console.log(content.sendingData, formData);

      // Properly structure the CV data with fullName field
      const cvData = {
        personalInfo: {
          fullName: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`.trim() || 'Adsız İstifadəçi',
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
          website: '',
          linkedin: '',
          summary: formData.personalInfo.summary
        },
        experience: [],
        education: [],
        skills: [],
        languages: [],
        projects: [],
        certifications: [],
        volunteerExperience: []
      };

      console.log(content.structuredData, cvData);

      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          templateId: selectedTemplateId,
          cv_data: cvData
        })
      });

      const result = await response.json();
      console.log(content.apiResponse, result);

      if (!response.ok) {
        setError(result.error || content.cvNotCreated);
        return;
      }

      if (result.success && result.cvId) {
        console.log(content.cvCreated, result.cvId);

        // Redirect to edit the created CV
        router.push(`/cv/edit/${result.cvId}`);
      } else {
        setError(result.error || content.cvNotCreated);
      }

    } catch (error) {
      console.error(content.cvCreateError, error);
      setError(`${content.createError} ${error instanceof Error ? error.message : content.unknownError}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
          <p className="text-gray-600 text-center">{content.loginRequired}</p>
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
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.pageTitle}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {content.pageDescription}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              {/* CV Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  {content.cvTitleLabel}
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder={content.cvTitlePlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                  required
                />
              </div>

              {/* Template Selection */}
              <div>
                <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                  {content.templateSectionTitle}
                </label>
                <p className="text-sm text-gray-600 mb-3">{content.templateSectionDescription}</p>
                
                {templatesLoading ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                    {content.templateLoadingText}
                  </div>
                ) : (
                  <select
                    id="template"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    required
                  >
                    <option value="">{content.templateSelectPlaceholder}</option>
                    {Array.isArray(templates) && templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {content.tiers[template.tier as keyof typeof content.tiers] || template.tier}
                      </option>
                    ))}
                  </select>
                )}

              </div>

              {/* Personal Info Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.personalInfoTitle}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      {content.firstNameLabel}
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.personalInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder={content.firstNamePlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      {content.lastNameLabel}
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.personalInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder={content.lastNamePlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {content.emailLabel}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={content.emailPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {content.phoneLabel}
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={content.phonePlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>


                <div className="mt-4">
                  <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                    {content.summaryLabel}
                  </label>
                  <textarea
                    id="summary"
                    value={formData.personalInfo.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder={content.summaryPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Error State */}
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

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {content.cancelButton}
                </Link>

                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 font-medium text-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {content.creatingButton}
                    </div>
                  ) : (
                    content.createButton
                  )}
                </button>
              </div>
            </form>

            {/* Info Section */}
            <div className="mt-12 bg-blue-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">{content.nextStepsTitle}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>{content.nextStep1}</li>
                <li>{content.nextStep2}</li>
                <li>{content.nextStep3}</li>
                <li>{content.nextStep4}</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

// Loading component for Suspense fallback
function NewCVPageLoading() {
  return (
    <>
      <StandardHeader />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                <div className="w-10 h-10 bg-gray-300 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded max-w-2xl mx-auto animate-pulse"></div>
            </div>
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="mt-4 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

// Main export component with Suspense boundary
export default function NewCVPage() {
  return (
    <Suspense fallback={<NewCVPageLoading />}>
      <NewCVContent />
    </Suspense>
  );
}
