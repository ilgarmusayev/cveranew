'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import StandardHeader from '@/components/ui/StandardHeader';
import Footer from '@/components/Footer';

interface Template {
  id: string;
  name: string;
  tier: string;
  description: string;
  previewUrl: string;
  hasAccess: boolean;
  requiresUpgrade: boolean;
  accessTier: string;
}

export default function SablonlarPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/templates', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Şablonlar yüklənərkən xəta baş verdi');
      }

      const data = await response.json();
      const templateList = data.templates || data;
      
      if (Array.isArray(templateList)) {
        setTemplates(templateList);
      } else {
        console.error('Unexpected templates response format:', data);
        setError('Şablonlar formatı yanlışdır');
      }
    } catch (err) {
      console.error('Template loading error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Şablonlar yüklənərkən xəta baş verdi.';
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
      alert('Şablonu istifadə etmək üçün giriş etməlisiniz');
      router.push('/login');
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
      case 'Free': return 'Pulsuz';
      case 'Medium': return 'Populyar';
      case 'Premium': return 'Premium';
      default: return 'Pulsuz';
    }
  };

  const categories = [
    { id: 'all', name: 'Hamısı', count: templates.length },
    { id: 'free', name: 'Pulsuz', count: templates.filter(t => t.tier === 'Free').length },
    { id: 'medium', name: 'Populyar', count: templates.filter(t => t.tier === 'Medium').length },
    { id: 'premium', name: 'Premium', count: templates.filter(t => t.tier === 'Premium').length }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">CV Şablonları</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional CV-nizi yaratmaq üçün ən uyğun şablonu seçin. Müxtəlif sahələr və təcrübə səviyyələri üçün nəzərdə tutulmuş şablonlar.
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
                <h3 className="text-sm font-medium text-red-800">Xəta</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadTemplates}
                    className="bg-red-100 px-3 py-1 rounded text-red-800 text-sm hover:bg-red-200"
                  >
                    Yenidən cəhd et
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
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                
                {/* Features */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-gray-500">
                    {template.tier === 'Free' && '🆓 Pulsuz istifadə'}
                    {template.tier === 'Medium' && '💎 Populyar abunəlik'}
                    {template.tier === 'Premium' && '⭐ Premium abunəlik'}
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
                    Bu şablona bax
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">Şablon tapılmadı</h3>
            <p className="mt-2 text-gray-500">Seçilmiş kateqoriyada heç bir şablon mövcud deyil.</p>
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
                      Kiliddə
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
                      alt={`${previewTemplate.name} böyük önizləmə`}
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
                    <p className="mt-4 text-lg text-gray-500">Önizləmə mövcud deyil</p>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="lg:w-1/3 p-6 border-l border-gray-200">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Təsvir</h4>
                    <p className="text-gray-600 leading-relaxed">
                      {previewTemplate.description || 'Bu şablon professional CV yaratmaq üçün hazırlanmışdır.'}
                    </p>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Xüsusiyyətlər</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Professional dizayn
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ATS uyğun format
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Çap üçün optimizasiya edilmiş
                      </li>
                      {previewTemplate.tier !== 'Free' && (
                        <li className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          Premium funksiyalar
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Tier Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">Paket tələbi</div>
                      <div className={`text-lg font-semibold ${
                        previewTemplate.tier === 'Free' ? 'text-green-600' :
                        previewTemplate.tier === 'Medium' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {previewTemplate.tier === 'Free' && '🆓 Pulsuz istifadə'}
                        {previewTemplate.tier === 'Medium' && '💎 Populyar abunəlik'}
                        {previewTemplate.tier === 'Premium' && '⭐ Premium abunəlik'}
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
                Bağla
              </button>
              <button
                onClick={handleUseTemplate}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  previewTemplate.hasAccess
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                    : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg'
                }`}
              >
                {previewTemplate.hasAccess ? 'Bu şablonu istifadə et' : 'Abunəliyi yenilə'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
