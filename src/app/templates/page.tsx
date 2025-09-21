'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AOS from 'aos';
import 'aos/dist/aos.css';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { generateStructuredData, organizationData, templateProductData, generateBreadcrumbData } from '@/lib/structured-data';
import { useAuth } from '@/lib/auth'; // Import useAuth hook
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      { name: 'Ana Səhifə', url: 'https://cvera.net' },
      { name: 'Şablonlar', url: 'https://cvera.net/templates' }
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
              <p className="mt-4 text-gray-600">Yüklənir...</p>
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
    const baseFeatures = ['ATS Uyğun', 'Professional Dizayn', 'PDF İxrac'];
    
    if (template.tier === 'Free') {
      return [...baseFeatures, 'Əsas Xüsusiyyətlər'];
    } else if (template.tier === 'Medium') {
      return [...baseFeatures, 'Çox Dilli Dəstək', 'Daha Çox Şablon'];
    } else {
      return [...baseFeatures, 'Premium Dizayn', 'Limitsiz İstifadə', 'Prioritet Dəstək'];
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
            CV <span className="text-blue-600">Şablonları</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Peşəkar dizaynlı şablonlar arasından seçin və CV-nizi fərdiləşdirin
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-12">
          {[
            { id: 'all', label: 'Hamısı' },
            { id: 'Free', label: 'Pulsuz' },
            { id: 'Medium', label: 'Orta' },
            { id: 'Premium', label: 'Premium' }
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
              <p className="mt-4 text-gray-600">Şablonlar yüklənir...</p>
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
              Yenidən cəhd et
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
                        Orta
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  {hoveredTemplate === template.id && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="flex space-x-3">
                        <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                          Önizləmə
                        </button>
                        <Link
                          href="/auth/register"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          İstifadə Et
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description || 'Professional CV şablonu'}</p>

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
                  <Link
                    href="/auth/register"
                    className={`w-full block text-center py-3 rounded-lg font-medium transition-all duration-300 ${
                      template.tier === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700'
                        : template.tier === 'Medium'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {template.tier === 'Premium' ? 'Premium ilə İstifadə Et' :
                     template.tier === 'Medium' ? 'Orta Plan ilə İstifadə Et' :
                     'Pulsuz İstifadə Et'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
