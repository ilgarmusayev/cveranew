'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { generateStructuredData, organizationData, templateProductData, generateBreadcrumbData } from '@/lib/structured-data';
import { useAuth } from '@/lib/auth'; // Import useAuth hook
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

// Content for 3 languages
const templatesContent = {
  azerbaijani: {
    title: 'CV Şablonları',
    subtitle: 'Peşəkar CV yaratmaq üçün müxtəlif şablonlar arasından seçim edin',
    categories: {
      all: 'Hamısı',
      free: 'Pulsuz',
      medium: 'Populyar',
      premium: 'Premium'
    },
    loading: 'Şablonlar yüklənir...',
    error: 'Xəta baş verdi',
    retry: 'Yenidən cəhd et',
    preview: 'Önizləmə',
    use: 'İstifadə Et',
    defaultDescription: 'Professional CV şablonu',
    actionButtons: {
      free: 'Pulsuz İstifadə Et',
      medium: 'Populyar Plan ilə İstifadə Et',
      premium: 'Premium ilə İstifadə Et'
    },
    tiers: {
      medium: 'Populyar',
      premium: 'Premium'
    },
    features: {
      responsive: 'Mobil uyğun',
      modern: 'Modern dizayn',
      customizable: 'Fərdiləşdirilə bilir',
      ats: 'ATS uyğun',
      professional: 'Peşəkar görünüş',
      export: 'PDF ixrac',
      sections: 'Çox bölmə',
      colors: 'Rəng seçimləri'
    },
    breadcrumb: {
      home: 'Ana Səhifə',
      templates: 'Şablonlar'
    },
    close: 'Bağla',
    featuresTitle: 'Xüsusiyyətləri:',
    previewNotAvailable: 'Önizləmə mövcud deyil'
  },
  english: {
    title: 'CV Templates',
    subtitle: 'Choose from various templates to create your professional CV',
    categories: {
      all: 'All',
      free: 'Free',
      medium: 'Popular',
      premium: 'Premium'
    },
    loading: 'Loading templates...',
    error: 'An error occurred',
    retry: 'Try again',
    preview: 'Preview',
    use: 'Use Template',
    defaultDescription: 'Professional CV template',
    actionButtons: {
      free: 'Use for Free',
      medium: 'Use with Popular Plan',
      premium: 'Use with Premium'
    },
    tiers: {
      medium: 'Popular',
      premium: 'Premium'
    },
    features: {
      responsive: 'Mobile responsive',
      modern: 'Modern design',
      customizable: 'Customizable',
      ats: 'ATS compatible',
      professional: 'Professional look',
      export: 'PDF export',
      sections: 'Multiple sections',
      colors: 'Color options'
    },
    breadcrumb: {
      home: 'Home',
      templates: 'Templates'
    },
    close: 'Close',
    featuresTitle: 'Features:',
    previewNotAvailable: 'Preview not available'
  },
  russian: {
    title: 'Шаблоны Резюме',
    subtitle: 'Выберите из различных шаблонов для создания профессионального резюме',
    categories: {
      all: 'Все',
      free: 'Бесплатно',
      medium: 'Средний',
      premium: 'Премиум'
    },
    loading: 'Загрузка шаблонов...',
    error: 'Произошла ошибка',
    retry: 'Попробовать снова',
    preview: 'Предпросмотр',
    use: 'Использовать',
    defaultDescription: 'Профессиональный шаблон резюме',
    actionButtons: {
      free: 'Использовать бесплатно',
      medium: 'Использовать со средним планом',
      premium: 'Использовать с премиум'
    },
    tiers: {
      medium: 'Средний',
      premium: 'Премиум'
    },
    features: {
      responsive: 'Адаптивный дизайн',
      modern: 'Современный дизайн',
      customizable: 'Настраиваемый',
      ats: 'ATS совместимый',
      professional: 'Профессиональный вид',
      export: 'Экспорт в PDF',
      sections: 'Множество разделов',
      colors: 'Варианты цветов'
    },
    breadcrumb: {
      home: 'Главная',
      templates: 'Шаблоны'
    },
    close: 'Закрыть',
    featuresTitle: 'Функции:',
    previewNotAvailable: 'Предварительный просмотр недоступен'
  }
};

interface Template {
  id: string;
  name: string;
  tier: 'Free' | 'Medium' | 'Premium';
  previewUrl: string;
  description?: string;
  hasAccess?: boolean;
  requiresUpgrade?: boolean;
}

interface TemplateApiResponse {
  templates: Template[];
  userTier: string;
  limits: any;
}

export default function TemplatesPage() {
  const { siteLanguage } = useSiteLanguage();
  const content = templatesContent[siteLanguage];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const router = useRouter();

  // Use authentication hook
  const { user, loading: authLoading, isInitialized } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isInitialized && !authLoading) {
      if (!user) {
        console.log('🚫 İstifadəçi giriş etməyib - login səhifəsinə yönləndirilir');
        router.push('/auth/login?redirect=/templates');
        return;
      }
      console.log('✅ İstifadəçi təsdiqləndi - templates yüklənir');
    }
  }, [user, authLoading, isInitialized, router]);

  // Add structured data for templates page
  useEffect(() => {
    const addStructuredData = (data: any, type: string, id: string) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.innerHTML = generateStructuredData({ type: type as any, data });
      script.id = id;

      // Remove existing script if it exists
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(script);
    };

    // Add organization data
    addStructuredData(organizationData, 'Organization', 'structured-data-organization');

    // Add breadcrumb data
    const breadcrumbData = generateBreadcrumbData([
      { name: content.breadcrumb.home, url: 'https://cvera.net' },
      { name: content.breadcrumb.templates, url: 'https://cvera.net/templates' }
    ]);
    addStructuredData(breadcrumbData, 'BreadcrumbList', 'structured-data-breadcrumb');

    // Add product catalog data for templates
    addStructuredData(templateProductData, 'Product', 'structured-data-templates-product');

    // Cleanup function
    return () => {
      ['structured-data-organization', 'structured-data-breadcrumb', 'structured-data-templates-product'].forEach(id => {
        const script = document.getElementById(id);
        if (script) script.remove();
      });
    };
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      if (!response.ok) {
        setError('Templates yüklənərkən xəta baş verdi');
        return;
      }

      const data: TemplateApiResponse = await response.json();
      setTemplates(data.templates);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Template loading error:', error);
      setError('Templates yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Authentication kontrolü
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user, loadTemplates]);

  useEffect(() => {
    AOS.init({
      duration: 600,
      offset: 100,
      easing: 'ease-out-cubic',
      once: true,
    });
  }, []);

  // Authentication kontrolü devam ediyorsa loading göster
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <StandardHeader />
        <div className="w-full max-w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-16 xl:px-20 2xl:px-24 py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{content.loading}</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Kullanıcı authenticated değilse bu component render edilmeyecek
  // çünkü zaten login sayfasına yönlendirilmiş olacak
  if (!user) {
    return null;
  }

  const filteredTemplates = selectedCategory === 'all'
    ? templates 
    : templates.filter(template => template.tier === selectedCategory);

  const getTemplateFeatures = (template: Template): string[] => {
    const baseFeatures = [content.features.ats, content.features.professional, content.features.export];
    
    if (template.tier === 'Free') {
      return [...baseFeatures, content.features.responsive];
    } else if (template.tier === 'Medium') {
      return [...baseFeatures, content.features.customizable, content.features.sections];
    } else {
      return [...baseFeatures, content.features.modern, content.features.colors, content.features.professional];
    }
  };

  const handleTemplateSelect = (template: Template) => {
    if (!user) {
      alert('Şablonu istifadə etmək üçün giriş etməlisiniz');
      router.push('/auth/login?redirect=/templates');
      return;
    }

    if (!template.hasAccess) {
      alert('Bu şablon üçün abunəliyi yeniləmək lazımdır');
      router.push('/pricing');
      return;
    }

    // İstifadəçini CV yaratma səhifəsinə yönləndir
    router.push(`/new?template=${template.id}`);
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

  // Main content with responsive container
  return (
    <div className="min-h-screen bg-white">
      <StandardHeader />

      {/* Main Content with Enhanced Responsive Container - Premium Edge Spacing */}
      <div className="w-full max-w-full mx-auto px-6 sm:px-8 md:px-12 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {content.title.split(' ')[0]} <span className="text-blue-600">{content.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-12">
          {[
            { id: 'all', label: content.categories.all },
            { id: 'Free', label: content.categories.free },
            { id: 'Medium', label: content.categories.medium },
            { id: 'Premium', label: content.categories.premium }
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{content.loading}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadTemplates}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {content.retry}
            </button>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredTemplates.map((template, index) => (
              <div
                key={template.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                {/* Template Image */}
                <div className="relative overflow-hidden bg-gray-100">
                  <OptimizedImage
                    src={template.previewUrl}
                    alt={template.name}
                    width={400}
                    height={256}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    {template.tier === 'Premium' && (
                      <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Premium
                      </span>
                    )}
                    {template.tier === 'Medium' && (
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {content.tiers.medium}
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  {hoveredTemplate === template.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="flex space-x-3">
                        <button 
                          onClick={(e) => handlePreviewClick(template, e)}
                          className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                          {content.preview}
                        </button>
                        <button
                          onClick={() => handleTemplateSelect(template)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          {content.use}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description || content.defaultDescription}</p>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {getTemplateFeatures(template).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                      template.tier === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700'
                        : template.tier === 'Medium'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {template.tier === 'Premium' ? content.actionButtons.premium :
                     template.tier === 'Medium' ? content.actionButtons.medium :
                     content.actionButtons.free}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl w-full h-full sm:max-w-6xl sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">{previewTemplate.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                    previewTemplate.tier === 'Premium' 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500'
                      : previewTemplate.tier === 'Medium'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {previewTemplate.tier === 'Medium' ? content.tiers.medium : 
                     previewTemplate.tier === 'Premium' ? content.tiers.premium : 
                     content.categories.free}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClosePreview}
                className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              {/* Preview Image Section */}
              <div className="flex-1 lg:w-2/3 bg-gray-50 p-2 sm:p-4 min-h-0 flex items-center justify-center">
                {previewTemplate.previewUrl ? (
                  <OptimizedImage
                    src={previewTemplate.previewUrl}
                    alt={`${previewTemplate.name} ${content.preview}`}
                    width={600}
                    height={800}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-lg border border-gray-200"
                  />
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">{content.previewNotAvailable}</p>
                  </div>
                )}
              </div>

              {/* Template Info Sidebar */}
              <div className="lg:w-1/3 w-full bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col">
                <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{previewTemplate.name}</h4>
                  <p className="text-gray-600 mb-4 text-xs sm:text-sm leading-relaxed">{previewTemplate.description || content.defaultDescription}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 mb-2 text-xs sm:text-sm">{content.featuresTitle}</h5>
                    <div className="space-y-2">
                      {getTemplateFeatures(previewTemplate).map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 space-y-2">
                  <button
                    onClick={handleUseTemplate}
                    className={`w-full py-2 text-xs sm:text-sm rounded-lg font-medium transition-all duration-300 ${
                      previewTemplate.tier === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700'
                        : previewTemplate.tier === 'Medium'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {content.use}
                  </button>
                  <button
                    onClick={handleClosePreview}
                    className="w-full py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    {content.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
