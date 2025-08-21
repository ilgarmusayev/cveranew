'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  tier: 'Free' | 'Medium' | 'Premium';
  preview_url?: string; // API-dən backward compatibility üçün
  previewUrl?: string;  // Database field
  description?: string;
  hasAccess?: boolean;  // API-dən gələn access info
  requiresUpgrade?: boolean;
}

interface TemplateGalleryProps {
  onTemplateSelect: (template: Template) => void;
  onClose: () => void;
  currentUserTier?: 'Free' | 'Medium' | 'Premium';
}

export default function TemplateGallery({ onTemplateSelect, onClose, currentUserTier = 'Free' }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState<'all' | 'Free' | 'Medium' | 'Premium'>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedLockedTemplate, setSelectedLockedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await apiClient.get('/api/templates');

      // API client returns { data, status } structure
      // API data format: { templates: [...], userTier, limits } or [...templates]
      const apiData = result.data;
      const templateData = apiData.templates || apiData;
      setTemplates(Array.isArray(templateData) ? templateData : []);
    } catch (err) {
      console.error('Template loading error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Şablonlar yüklənərkən xəta baş verdi.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => 
    selectedTier === 'all' || template.tier === selectedTier
  );

  // Əsas məqsəd: BÜTÜN template-lar göstərilməlidir, tier fərq etməz
  // Yalnız seçilmiş tab-a görə filtrlənir, access səviyyəsinə görə deyil
  // Free istifadəçilər Premium template-ların preview-ını görə bilərlər

  // Check if user has access to template
  const hasTemplateAccess = (template: Template) => {
    // Əgər API-dən hasAccess məlumatı gəlirsə, onu istifadə et
    if (typeof template.hasAccess === 'boolean') {
      return template.hasAccess;
    }
    
    // Yoxsa öz logic-imizi istifadə et
    if (template.tier === 'Free') return true;
    if (template.tier === 'Medium' && ['Medium', 'Premium'].includes(currentUserTier)) return true;
    if (template.tier === 'Premium' && currentUserTier === 'Premium') return true;
    return false;
  };

  const handleTemplateSelect = (template: Template) => {
    if (hasTemplateAccess(template)) {
      onTemplateSelect(template);
    } else {
      setSelectedLockedTemplate(template);
      setShowUpgradeModal(true);
    }
  };

  const handleUpgrade = () => {
    // Redirect to subscription page
    window.location.href = '/dashboard?tab=subscription';
  };

  const tierColors = {
    Free: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    Premium: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  const tierLabels = {
    Free: 'Pulsuz',
    Medium: 'Orta',
    Premium: 'Premium'
  };

  const tierDescriptions = {
    Free: 'Əsas şablonlar - hamı üçün əlçatan',
    Medium: 'Daha professional görünüş və xüsusiyyətlər',
    Premium: 'Ən yaxşı şablonlar və ekskluziv dizaynlar'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Şablon Qalereya</h2>
              <p className="text-blue-100 mt-1">
                CV-niz üçün ən uyğun şablonu seçin
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setSelectedTier('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedTier === 'all'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hamısı ({templates.length})
            </button>
            {['Free', 'Medium', 'Premium'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier as typeof selectedTier)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  selectedTier === tier
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tierLabels[tier as keyof typeof tierLabels]} ({templates.filter(t => t.tier === tier).length})
              </button>
            ))}
          </div>

          {/* Current Tier Info */}
          {selectedTier !== 'all' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                {tierLabels[selectedTier]}
              </h3>
              <p className="text-sm text-gray-600">
                {tierDescriptions[selectedTier]}
              </p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium">Xəta baş verdi</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={loadTemplates}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yenidən cəhd et
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="group cursor-pointer">
                  <div 
                    onClick={() => handleTemplateSelect(template)}
                    className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden relative"
                  >
                    <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                      {(template.preview_url || template.previewUrl) ? (
                        <Image
                          src={template.preview_url || template.previewUrl || ''}
                          alt={`${template.name} preview`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Premium Lock Overlay */}
                      {!hasTemplateAccess(template) && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="bg-white bg-opacity-20 rounded-full p-3 mx-auto mb-3">
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium mb-1">Premium Şablon</p>
                            <p className="text-xs opacity-90">
                              {template.tier === 'Medium' ? 'Orta' : 'Premium'} abunəlik tələb olunur
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover overlay for accessible templates */}
                      {hasTemplateAccess(template) && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium">
                              Seç
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded border ${tierColors[template.tier]}`}>
                          {tierLabels[template.tier]}
                        </span>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {template.tier === 'Free' && '🆓 Pulsuz'}
                          {template.tier === 'Medium' && '💎 Orta abunəlik'}
                          {template.tier === 'Premium' && '⭐ Premium abunəlik'}
                        </div>
                        {hasTemplateAccess(template) ? (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Seç →
                          </button>
                        ) : (
                          <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                            🔓 Kilidi Aç →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">Bu kateqoriyada şablon tapılmadı</p>
              <p className="text-sm mt-2">Başqa kateqoriyaya baxın</p>
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              {currentUserTier === 'Free' ? 'Daha çox şablon istəyirsiniz?' : 
               currentUserTier === 'Medium' ? 'Premium şablonlara çıxış əldə edin!' :
               'Premium istifadəçisiniz - bütün şablonlara çıxışınız var!'}
            </div>
            {currentUserTier !== 'Premium' && (
              <button 
                onClick={handleUpgrade}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Abunəliyi yüksəldin →
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      {showUpgradeModal && selectedLockedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Şablon Kiliddə
              </h3>
              <p className="text-gray-600 mb-4">
                "<strong>{selectedLockedTemplate.name}</strong>" şablonu {tierLabels[selectedLockedTemplate.tier]} abunəlik tələb edir.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  {tierLabels[selectedLockedTemplate.tier]} Planın Faydaları:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedLockedTemplate.tier === 'Medium' && (
                    <>
                      <li>• Professional şablonlara çıxış</li>
                      <li>• Daha çox export seçimləri</li>
                      <li>• LinkedIn import xüsusiyyəti</li>
                    </>
                  )}
                  {selectedLockedTemplate.tier === 'Premium' && (
                    <>
                      <li>• Bütün premium şablonlara çıxış</li>
                      <li>• AI powered CV təklifləri</li>
                      <li>• Sınırsız export və download</li>
                      <li>• Premium dəstək</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setSelectedLockedTemplate(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Yenilə
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
