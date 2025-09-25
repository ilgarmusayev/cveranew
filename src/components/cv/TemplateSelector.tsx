'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';

interface Template {
  id: string;
  name: string;
  tier: 'Free' | 'Medium' | 'Premium';
  preview_url: string;
  hasAccess: boolean;
}

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  userTier?: string;
  cvLanguage?: 'english' | 'azerbaijani';
}

export default function TemplateSelector({ selectedTemplateId, onTemplateSelect, userTier = 'Free', cvLanguage = 'azerbaijani' }: TemplateSelectorProps) {
  const { siteLanguage } = useSiteLanguage();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const router = useRouter();

  // Translation labels
  const labels = {
    azerbaijani: {
      selectTemplate: 'Şablon Seç',
      chooseTemplate: 'CV-niz üçün uyğun şablonu seçin',
      locked: 'Kiliddə',
      selected: 'Seçildi',
      preview: 'Önizləmə',
      noTemplatesFound: 'Şablon tapılmadı',
      close: 'Bağla',
      selectThisTemplate: 'Bu Şablonu Seç',
      upgradeSubscription: 'Abunəliyi Yenilə',
      templateLocked: 'Şablon Kiliddə',
      upgradeToUse: 'Bu şablonu istifadə etmək üçün abunəliyinizi yeniləyin.',
      cancel: 'Ləğv et',
      upgrade: 'Yenilə',
      previewNotAvailable: 'Önizləmə mövcud deyil',
      previewImageFailed: 'Önizləmə şəkli yüklənmədi',
      templateLoadError: 'Şablonlar yüklənərkən xəta baş verdi.',
      templateFormatError: 'Şablonlar formatı yanlışdır',
      tiers: {
        Free: 'Pulsuz',
        Medium: 'Orta', 
        Premium: 'Premium'
      },
      tierDescriptions: {
        Free: 'Pulsuz - Əsas şablonlar',
        Medium: 'Orta - Daha çox xüsusiyyətlər',
        Premium: 'Premium - Ən yaxşı şablonlar'
      }
    },
    english: {
      selectTemplate: 'Select Template',
      chooseTemplate: 'Choose a suitable template for your CV',
      locked: 'Locked',
      selected: 'Selected',
      preview: 'Preview',
      noTemplatesFound: 'No templates found',
      close: 'Close',
      selectThisTemplate: 'Select This Template',
      upgradeSubscription: 'Upgrade Subscription',
      templateLocked: 'Template Locked',
      upgradeToUse: 'Upgrade your subscription to use this template.',
      cancel: 'Cancel',
      upgrade: 'Upgrade',
      previewNotAvailable: 'Preview not available',
      previewImageFailed: 'Preview image failed to load',
      templateLoadError: 'Error occurred while loading templates.',
      templateFormatError: 'Template format is incorrect',
      tiers: {
        Free: 'Free',
        Medium: 'Medium',
        Premium: 'Premium'
      },
      tierDescriptions: {
        Free: 'Free - Basic templates',
        Medium: 'Medium - More features',
        Premium: 'Premium - Best templates'
      }
    },
    russian: {
      selectTemplate: 'Выбрать шаблон',
      chooseTemplate: 'Выберите подходящий шаблон для вашего резюме',
      locked: 'Заблокировано',
      selected: '',
      preview: 'Предпросмотр',
      noTemplatesFound: 'Шаблоны не найдены',
      close: 'Закрыть',
      selectThisTemplate: 'Выбрать этот шаблон',
      upgradeSubscription: 'Обновить подписку',
      templateLocked: 'Шаблон заблокирован',
      upgradeToUse: 'Обновите подписку, чтобы использовать этот шаблон.',
      cancel: 'Отмена',
      upgrade: 'Обновить',
      previewNotAvailable: 'Предпросмотр недоступен',
      previewImageFailed: 'Не удалось загрузить изображение предпросмотра',
      templateLoadError: 'Произошла ошибка при загрузке шаблонов.',
      templateFormatError: 'Неправильный формат шаблонов',
      tiers: {
        Free: 'Бесплатно',
        Medium: 'Средний',
        Premium: 'Премиум'
      },
      tierDescriptions: {
        Free: 'Бесплатно - Базовые шаблоны',
        Medium: 'Средний - Больше возможностей',
        Premium: 'Премиум - Лучшие шаблоны'
      }
    }
  };

  const content = labels[siteLanguage] || labels.azerbaijani;

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
      const templateList = apiData.templates || apiData;
      if (Array.isArray(templateList)) {
        setTemplates(templateList);
      } else {
        console.error('Unexpected templates response format:', result);
        setError('Template format error');
      }
    } catch (err) {
      console.error('Template loading error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Template loading error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    if (!template.hasAccess) {
      setShowUpgradeModal(true);
      return;
    }
    onTemplateSelect(template.id);
  };

  const handlePreviewClick = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
    setShowPreviewModal(true);
  };

  const handleUpgrade = () => {
    router.push('/dashboard?tab=subscription');
  };

  const tierColors = {
    Free: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    Premium: 'bg-purple-100 text-purple-800 border-purple-200'
  };



  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error === 'Template format error' ? content.templateFormatError : 
                         error === 'Template loading error' ? content.templateLoadError : error;
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-red-600 text-sm">{errorMessage}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {content.selectTemplate}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {content.chooseTemplate}
          </p>
        </div>

        <div className="p-4 space-y-3">
          {Array.isArray(templates) && templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-lg border-2 p-3 transition-all relative ${
                selectedTemplateId === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : template.hasAccess
                  ? 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  : 'border-gray-200 opacity-60 hover:border-gray-300'
              }`}
            >
              {!template.hasAccess && (
                <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="bg-white rounded-full p-2 shadow-md">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleTemplateClick(template)}
                >
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded border ${tierColors[template.tier]}`}>
                      {content.tiers[template.tier]}
                    </span>
                    {!template.hasAccess && (
                      <span className="text-red-600 text-xs">
                        🔒 {content.locked}
                      </span>
                    )}
                    {selectedTemplateId === template.id && template.hasAccess && (
                      <span className="text-blue-600 text-sm">
                        ✓ {content.selected}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="ml-3 flex items-center gap-2">
                  {/* Preview Button */}
                  <button
                    onClick={(e) => handlePreviewClick(template, e)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border transition-colors"
                  >
                    👁️ {content.preview}
                  </button>
                  
                  {template.preview_url && (
                    <div className="relative">
                      <Image
                        src={template.preview_url}
                        alt={`${template.name} preview`}
                        width={48}
                        height={64}
                        className="object-cover rounded border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!Array.isArray(templates) || templates.length === 0) && !loading && (
          <div className="p-4 text-center text-gray-500">
            <p>{content.noTemplatesFound}</p>
          </div>
        )}

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span>
              <span>{content.tierDescriptions.Free}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
              <span>{content.tierDescriptions.Medium}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></span>
              <span>{content.tierDescriptions.Premium}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewTemplate.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded border ${tierColors[previewTemplate.tier]}`}>
                    {content.tiers[previewTemplate.tier]}
                  </span>
                  {!previewTemplate.hasAccess && (
                    <span className="text-red-600 text-xs">
                      🔒 {content.locked}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {previewTemplate.preview_url ? (
                <div className="text-center">
                  <Image
                    src={previewTemplate.preview_url}
                    alt={`${previewTemplate.name} preview`}
                    width={600}
                    height={800}
                    className="mx-auto object-contain border border-gray-200 rounded shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="text-gray-500 py-20">${content.previewImageFailed}</div>`;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-gray-500 py-20">
                  {content.previewNotAvailable}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {content.close}
                </button>
                {previewTemplate.hasAccess ? (
                  <button
                    onClick={() => {
                      onTemplateSelect(previewTemplate.id);
                      setShowPreviewModal(false);
                    }}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {content.selectThisTemplate}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowPreviewModal(false);
                      setShowUpgradeModal(true);
                    }}
                    className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    🔓 {content.upgradeSubscription}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {content.templateLocked}
            </h3>
            <p className="text-gray-600 mb-6">
              {content.upgradeToUse}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {content.cancel}
              </button>
              <button
                onClick={handleUpgrade}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {content.upgrade}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
