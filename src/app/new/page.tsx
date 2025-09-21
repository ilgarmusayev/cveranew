'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface Template {
  id: string;
  name: string;
  tier: string;
  hasAccess?: boolean;
}

export default function NewCVPage() {
  const { user } = useAuth();
  const { siteLanguage } = useSiteLanguage();
  const router = useRouter();
  
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
      templateLabel: 'CV Şablonu',
      loadingTemplates: '⏳ Yüklənir...',
      
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
      loginRequiredError: 'Giriş tələb olunur',
      cvNotCreated: 'CV yaradılmadı',
      createError: 'CV yaradılanda xəta:',
      unknownError: 'Naməlum xəta',
      
      // Console messages
      templatesLoadError: 'Templates yüklənərkən xəta:',
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
      nextStep3: 'Template-i istədiyiniz zaman dəyişə bilərsiniz',
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
      templateLabel: 'CV Template',
      loadingTemplates: '⏳ Loading...',
      
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
      loginRequiredError: 'Login required',
      cvNotCreated: 'CV not created',
      createError: 'Error creating CV:',
      unknownError: 'Unknown error',
      
      // Console messages
      templatesLoadError: 'Error loading templates:',
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
      nextStep3: 'You can change the template at any time',
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
      templateLabel: 'Шаблон резюме',
      loadingTemplates: '⏳ Загрузка...',
      
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
      loginRequiredError: 'Требуется вход',
      cvNotCreated: 'Резюме не создано',
      createError: 'Ошибка при создании резюме:',
      unknownError: 'Неизвестная ошибка',
      
      // Console messages
      templatesLoadError: 'Ошибка загрузки шаблонов:',
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
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    templateId: '', // Will be set when templates load
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
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [error, setError] = useState('');

  // Load templates and LinkedIn data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadTemplates(),
        loadLinkedInData()
      ]);
    };

    if (user) {
      loadInitialData();
    }
  }, [user]);

  // Load available templates
  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);

        // Set default template to first accessible one
        const accessibleTemplate = data.templates.find((t: Template) => t.hasAccess !== false);
        if (accessibleTemplate && !formData.templateId) {
          setFormData(prev => ({
            ...prev,
            templateId: accessibleTemplate.id
          }));
        }
      }
    } catch (error) {
      console.error(content.templatesLoadError, error);
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
          templateId: formData.templateId,
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
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{content.templateLabel}</span>
                  </span>
                </label>
                <select
                  id="templateId"
                  value={formData.templateId}
                  onChange={(e) => handleInputChange('templateId', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em'
                  }}
                  disabled={loading || templatesLoading}
                >
                  {templatesLoading ? (
                    <option value="">{content.loadingTemplates}</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        📄 {template.name} ({template.tier})
                      </option>
                    ))
                  )}
                </select>
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
