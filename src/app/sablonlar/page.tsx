'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface Template {
  id: string;
  name: string;
  tier: string;
  description: string;
  description_en?: string; // İngilis dili açıqlaması (optional)
  previewUrl: string;
  hasAccess: boolean;
  requiresUpgrade: boolean;
  accessTier: string;
}

export default function SablonlarPage() {
  const { siteLanguage } = useSiteLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  // Site language mətnləri
  const labels = {
    azerbaijani: {
      pageTitle: 'CV Şablonları',
      pageSubtitle: 'Professional CV-nizi yaratmaq üçün ən uyğun şablonu seçin. Müxtəlif sahələr və təcrübə səviyyələri üçün nəzərdə tutulmuş şablonlar.',
      errorTemplateLoading: 'Şablonlar yüklənərkən xəta baş verdi',
      errorTemplateFormat: 'Şablonlar formatı yanlışdır',
      errorDefaultMessage: 'Şablonlar yüklənərkən xəta baş verdi.',
      alertLoginRequired: 'Şablonu istifadə etmək üçün giriş etməlisiniz',
      alertUpgradeRequired: 'Bu şablon üçün abunəliyi yeniləmək lazımdır',
      categoryAll: 'Hamısı',
      categoryFree: 'Pulsuz',
      categoryPopular: 'Populyar',
      categoryPremium: 'Premium',
      tierFree: 'Pulsuz',
      tierPopular: 'Populyar',
      tierPremium: 'Premium',
      errorTitle: 'Xəta',
      retryButton: 'Yenidən cəhd edin',
      freeUsage: 'Pulsuz istifadə',
      popularSubscription: 'Populyar abunəlik',
      premiumSubscription: 'Premium abunəlik',
      preview: 'Önizləmə',
      selectTemplate: 'Şablonu seçin',
      useTemplate: 'İstifadə edin',
      closePreview: 'Bağlayın',
      upgradeForAccess: 'Kiliddə',
      noPreviewAvailable: 'Önizləmə mövcud deyil',
      packageRequirement: 'Paket tələbi',
      closeModal: 'Bağlayın',
      useThisTemplate: 'Bu şablonu istifadə edin',
      upgradeSubscription: 'Abunəliyi yeniləyin',
      largePreview: 'böyük önizləmə',
      noTemplatesFound: 'Şablon tapılmadı',
      noTemplatesInCategory: 'Seçilmiş kateqoriyada heç bir şablon mövcud deyil.',
      // Template preview modal mətnləri
      features: 'Xüsusiyyətlər',
      featureProfessionalDesign: 'Professional dizayn',
      featureATSCompatible: 'ATS uyğun format',
      featurePrintOptimized: 'Çap üçün optimizasiya edilmiş',
      featurePremiumFunctions: 'Premium funksiyalar',
      description: 'Təsvir',
      // Template açıqlamaları
      templateDescriptions: {
        'Modern': 'Müasir və çağdaş dizayn ilə professional CV şablonu',
        'Classic': 'Klassik və rəsmi görünüş ilə ənənəvi CV şablonu',
        'Creative': 'Yaradıcı sahələr üçün fərqli və cəlbedici CV şablonu', 
        'Minimalist': 'Sadə və təmiz görünüş ilə minimalist CV şablonu',
        'Professional': 'İş axtaranlar üçün professional və etibarlı CV şablonu',
        'Executive': 'Rəhbər mövqelər üçün nəzərdə tutulmuş premium CV şablonu',
        'Technical': 'Texniki sahələr üçün xüsusi hazırlanmış CV şablonu',
        'Academic': 'Akademik karyera üçün təhsil və araşdırma yönümlü CV şablonu',
        'Simple': 'Anlaşılan və sadə strukturlu CV şablonu',
        'Elegant': 'Zərif və estetik görünüşlü CV şablonu',
        'Corporate': 'Korporativ mühit üçün rəsmi CV şablonu',
        'Fresh': 'Təzə və dinamik görünüşlü CV şablonu'
      },
      defaultTemplateDescription: 'Professional CV şablonu'
    },
    english: {
      pageTitle: 'CV Templates',
      pageSubtitle: 'Choose the most suitable template to create your professional CV. Templates designed for various fields and experience levels.',
      errorTemplateLoading: 'Error occurred while loading templates',
      errorTemplateFormat: 'Template format is incorrect',
      errorDefaultMessage: 'Error occurred while loading templates.',
      alertLoginRequired: 'You must log in to use the template',
      alertUpgradeRequired: 'Subscription upgrade required for this template',
      categoryAll: 'All',
      categoryFree: 'Free',
      categoryPopular: 'Popular',
      categoryPremium: 'Premium',
      tierFree: 'Free',
      tierPopular: 'Popular',
      tierPremium: 'Premium',
      errorTitle: 'Error',
      retryButton: 'Try again',
      freeUsage: 'Free usage',
      popularSubscription: 'Popular subscription',
      premiumSubscription: 'Premium subscription',
      preview: 'Preview',
      selectTemplate: 'Select template',
      useTemplate: 'Use template',
      closePreview: 'Close',
      upgradeForAccess: 'Locked',
      noPreviewAvailable: 'Preview not available',
      packageRequirement: 'Package requirement',
      closeModal: 'Close',
      useThisTemplate: 'Use this template',
      upgradeSubscription: 'Upgrade subscription',
      largePreview: 'large preview',
      noTemplatesFound: 'No templates found',
      noTemplatesInCategory: 'No templates available in the selected category.',
      // Template preview modal texts
      features: 'Features',
      featureProfessionalDesign: 'Professional design',
      featureATSCompatible: 'ATS compatible format',
      featurePrintOptimized: 'Print optimized',
      featurePremiumFunctions: 'Premium features',
      description: 'Description',
      // Template descriptions
      templateDescriptions: {
        'Modern': 'Professional CV template with modern and contemporary design',
        'Classic': 'Traditional CV template with classic and formal appearance',
        'Creative': 'Distinctive and attractive CV template for creative fields',
        'Minimalist': 'Minimalist CV template with simple and clean appearance',
        'Professional': 'Professional and reliable CV template for job seekers',
        'Executive': 'Premium CV template designed for executive positions',
        'Technical': 'Specially prepared CV template for technical fields',
        'Academic': 'Education and research oriented CV template for academic career',
        'Simple': 'Understandable and simple structured CV template',
        'Elegant': 'Elegant and aesthetic looking CV template',
        'Corporate': 'Formal CV template for corporate environment',
        'Fresh': 'Fresh and dynamic looking CV template'
      },
      defaultTemplateDescription: 'Professional CV template'
    },
    russian: {
      pageTitle: 'Шаблоны резюме',
      pageSubtitle: 'Выберите наиболее подходящий шаблон для создания вашего профессионального резюме. Шаблоны разработаны для различных областей и уровней опыта.',
      errorTemplateLoading: 'Произошла ошибка при загрузке шаблонов',
      errorTemplateFormat: 'Неверный формат шаблона',
      errorDefaultMessage: 'Произошла ошибка при загрузке шаблонов.',
      alertLoginRequired: 'Вы должны войти в систему, чтобы использовать шаблон',
      alertUpgradeRequired: 'Требуется обновление подписки для этого шаблона',
      categoryAll: 'Все',
      categoryFree: 'Бесплатно',
      categoryPopular: 'Популярные',
      categoryPremium: 'Премиум',
      tierFree: 'Бесплатно',
      tierPopular: 'Популярные',
      tierPremium: 'Премиум',
      errorTitle: 'Ошибка',
      retryButton: 'Попробовать снова',
      freeUsage: 'Бесплатное использование',
      popularSubscription: 'Популярная подписка',
      premiumSubscription: 'Премиум подписка',
      preview: 'Предварительный просмотр',
      selectTemplate: 'Выбрать шаблон',
      useTemplate: 'Использовать шаблон',
      closePreview: 'Закрыть',
      upgradeForAccess: 'Заблокировано',
      noPreviewAvailable: 'Предварительный просмотр недоступен',
      packageRequirement: 'Требование пакета',
      closeModal: 'Закрыть',
      useThisTemplate: 'Использовать этот шаблон',
      upgradeSubscription: 'Обновить подписку',
      largePreview: 'большой предварительный просмотр',
      noTemplatesFound: 'Шаблоны не найдены',
      noTemplatesInCategory: 'В выбранной категории нет доступных шаблонов.',
      features: 'Особенности',
      featureProfessionalDesign: 'Профессиональный дизайн',
      featureATSCompatible: 'ATS совместимый формат',
      featurePrintOptimized: 'Оптимизировано для печати',
      featurePremiumFunctions: 'Премиум функции',
      description: 'Описание',
      templateDescriptions: {
        'Modern': 'Профессиональный шаблон резюме с современным и актуальным дизайном',
        'Classic': 'Традиционный шаблон резюме с классическим и формальным видом',
        'Creative': 'Отличительный и привлекательный шаблон резюме для творческих областей',
        'Minimalist': 'Минималистский шаблон резюме с простым и чистым видом',
        'Professional': 'Профессиональный и надежный шаблон резюме для соискателей',
        'Executive': 'Премиум шаблон резюме, разработанный для руководящих должностей',
        'Technical': 'Специально подготовленный шаблон резюме для технических областей',
        'Academic': 'Шаблон резюме, ориентированный на образование и исследования для академической карьеры',
        'Simple': 'Понятный и простой структурированный шаблон резюме',
        'Elegant': 'Элегантный и эстетичный шаблон резюме',
        'Corporate': 'Формальный шаблон резюме для корпоративной среды',
        'Fresh': 'Свежий и динамичный шаблон резюме'
      },
      defaultTemplateDescription: 'Профессиональный шаблон резюме'
    }
  };

  const content = labels[siteLanguage];

  // Template açıqlamasını site language-ə görə seçən funksiya
  const getTemplateDescription = (template: Template): string => {
    console.log('getTemplateDescription called:', {
      siteLanguage,
      templateName: template.name,
      description: template.description,
      description_en: template.description_en
    });
    
    let finalDescription: string;
    
    if (siteLanguage === 'azerbaijani') {
      // Azərbaycan dili üçün description (əsas) və ya description_en (fallback)
      finalDescription = template.description || template.description_en || '';
    } else {
      // İngilis dili üçün description_en (əsas) və ya description (fallback)
      finalDescription = template.description_en || template.description || '';
    }
    
    // Əgər SQL-dən açıqlama gəlməyibsə, template adına görə açıqlama tapaq
    if (!finalDescription || finalDescription.trim() === '') {
      const templateKey = Object.keys(content.templateDescriptions).find(key => 
        template.name.toLowerCase().includes(key.toLowerCase())
      );
      
      if (templateKey && templateKey in content.templateDescriptions) {
        finalDescription = (content.templateDescriptions as any)[templateKey];
      } else {
        finalDescription = content.defaultTemplateDescription;
      }
    }
    
    console.log('Final description:', finalDescription);
    return finalDescription;
  };

  useEffect(() => {
    loadTemplates();
  }, [siteLanguage]); // siteLanguage dəyişəndə template-ləri yenidən yüklə

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-site-language': siteLanguage // Site language header əlavə edək
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/templates', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(content.errorTemplateLoading);
      }

      const data = await response.json();
      const templateList = data.templates || data;
      
      if (Array.isArray(templateList)) {
        // Template data-sını eləcə set edək, getTemplateDescription funksiyası düzgün description seçəcək
        setTemplates(templateList);
      } else {
        console.error('Unexpected templates response format:', data);
        setError(content.errorTemplateFormat);
      }
    } catch (err) {
      console.error('Template loading error:', err);
      const errorMessage = err instanceof Error ? err.message : content.errorDefaultMessage;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory === 'all') return true;
    return template.tier.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleTemplateSelect = (template: Template) => {
    if (!user) {
      alert(content.alertLoginRequired);
      router.push('/login');
      return;
    }

    if (!template.hasAccess) {
      alert(content.alertUpgradeRequired);
      router.push('/pricing');
      return;
    }

    // İstifadəçini CV yaratma səhifəsinə yönləndir
    router.push(`/create-cv?template=${template.id}`);
  };

  const handlePreviewClick = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewTemplate(null);
  };

  const handleUseTemplate = () => {
    if (previewTemplate) {
      setShowPreviewModal(false);
      handleTemplateSelect(previewTemplate);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Free': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'Free': return content.tierFree;
      case 'Medium': return content.tierPopular;
      case 'Premium': return content.tierPremium;
      default: return content.tierFree;
    }
  };

  const categories = [
    { id: 'all', name: content.categoryAll, count: templates.length },
    { id: 'free', name: content.categoryFree, count: templates.filter(t => t.tier === 'Free').length },
    { id: 'medium', name: content.categoryPopular, count: templates.filter(t => t.tier === 'Medium').length },
    { id: 'premium', name: content.categoryPremium, count: templates.filter(t => t.tier === 'Premium').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StandardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.pageTitle}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {content.pageSubtitle}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{content.errorTitle}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadTemplates}
                    className="bg-red-100 px-3 py-1 rounded text-red-800 text-sm hover:bg-red-200"
                  >
                    {content.retryButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{getTemplateDescription(template)}</p>
                
                {/* Features */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-gray-500">
                    {template.tier === 'Free' && `🆓 ${content.freeUsage}`}
                    {template.tier === 'Medium' && `💎 ${content.popularSubscription}`}
                    {template.tier === 'Premium' && `⭐ ${content.premiumSubscription}`}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Main Button - Preview and Select */}
                  <button
                    onClick={(e) => handlePreviewClick(template, e)}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {content.preview}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{content.noTemplatesFound}</h3>
            <p className="mt-2 text-gray-500">{content.noTemplatesInCategory}</p>
          </div>
        )}

    
      </main>

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{previewTemplate.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getTierColor(previewTemplate.tier)}`}>
                    {getTierLabel(previewTemplate.tier)}
                  </span>
                  {!previewTemplate.hasAccess && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      {content.upgradeForAccess}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row max-h-[calc(95vh-200px)]">
              {/* Preview Image */}
              <div className="lg:w-2/3 p-6 bg-gray-50 flex items-center justify-center overflow-auto">
                {previewTemplate.previewUrl ? (
                  <div className="w-full max-w-2xl">
                    <img
                      src={previewTemplate.previewUrl}
                      alt={`${previewTemplate.name} ${content.largePreview}`}
                      className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
                      style={{ maxHeight: '70vh' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/templates/default-preview.jpg';
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-4 text-lg text-gray-500">{content.noPreviewAvailable}</p>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="lg:w-1/3 p-6 border-l border-gray-200">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{content.description}</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {previewTemplate.description || 'Bu şablon professional CV yaratmaq üçün hazırlanmışdır.'}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">{content.features}</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {content.featureProfessionalDesign}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {content.featureATSCompatible}
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {content.featurePrintOptimized}
                      </li>
                      {previewTemplate.tier !== 'Free' && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          {content.featurePremiumFunctions}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Tier Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">{content.packageRequirement}</div>
                      <div className={`text-lg font-semibold ${
                        previewTemplate.tier === 'Free' ? 'text-green-600' :
                        previewTemplate.tier === 'Medium' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {previewTemplate.tier === 'Free' && `🆓 ${content.freeUsage}`}
                        {previewTemplate.tier === 'Medium' && `💎 ${content.popularSubscription}`}
                        {previewTemplate.tier === 'Premium' && `⭐ ${content.premiumSubscription}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-4 justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                {content.closeModal}
              </button>
              <button
                onClick={handleUseTemplate}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  previewTemplate.hasAccess
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                }`}
              >
                {previewTemplate.hasAccess ? content.useThisTemplate : content.upgradeSubscription}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
