'use client';

import React, { useState } from 'react';
import { canAccessTemplate, canPreviewTemplates, getUpgradeSuggestions, getTierDisplayName } from '@/lib/tier-permissions';
import { useNotification } from '@/components/ui/Toast';

interface Template {
  id: string;
  name: string;
  tier: 'free' | 'medium' | 'premium';
  previewUrl: string;
  description?: string;
}

interface TemplateAccessControlProps {
  templates: Template[];
  userTier: string;
  onSelectTemplate: (templateId: string) => void;
  onUpgrade: () => void;
}

export default function TemplateAccessControl({
  templates,
  userTier,
  onSelectTemplate,
  onUpgrade
}: TemplateAccessControlProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { showWarning, showInfo } = useNotification();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'free': return 'Pulsuz';
      case 'medium': return 'Orta';
      case 'premium': return 'Premium';
      default: return 'Pulsuz';
    }
  };

  const handleTemplateSelect = (template: Template) => {
    const canAccess = canAccessTemplate(userTier, template.tier);

    if (canAccess) {
      onSelectTemplate(template.id);
    } else {
      // Show upgrade suggestion via toast and modal
      const suggestion = getUpgradeSuggestions(userTier, template.tier === 'premium' ? 'premium-templates' : 'medium-templates');

      setSelectedTemplate(template);
      setShowUpgradeModal(true);
      showWarning(suggestion.message);
    }
  };

  const handleUpgradeConfirm = () => {
    setShowUpgradeModal(false);
    onUpgrade();
    showInfo('Qiymətlər səhifəsinə yönləndirilirsiniz...');
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">CV Şablonları</h2>
        <p className="text-gray-600">
          Sizin cari paketiniz: <span className="font-semibold text-blue-600">{getTierDisplayName(userTier)}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Bütün şablonların önizləməsini görə bilərsiniz, lakin yalnız paketinizə uyğun olanları istifadə edə bilərsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {templates.map((template) => {
          const canAccess = canAccessTemplate(userTier, template.tier);
          const canPreview = canPreviewTemplates(userTier);

          return (
            <div
              key={template.id}
              className={`relative bg-white rounded-lg shadow-md border-2 transition-all duration-200 hover:shadow-lg ${
                canAccess 
                  ? 'border-gray-200 hover:border-blue-300 cursor-pointer' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Template Preview */}
              <div className="relative">
                <img
                  src={template.previewUrl}
                  alt={template.name}
                  className={`w-full h-64 object-cover rounded-t-lg ${
                    !canAccess ? 'opacity-75' : ''
                  }`}
                />

                {/* Tier Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(template.tier)}`}>
                    {getTierLabel(template.tier)}
                  </span>
                </div>

                {/* Lock Overlay for Restricted Templates */}
                {!canAccess && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 rounded-t-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <p className="text-sm font-medium">Paket yeniləməsi tələb olunur</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateSelect(template);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      canAccess
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    }`}
                  >
                    {canAccess ? 'İstifadə et' : 'Yükselt'}
                  </button>

                  {canPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Open preview modal
                        window.open(template.previewUrl, '_blank');
                      }}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade Notice */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Daha çox şablona ehtiyacınız var?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Paketinizi yeniləyərək bütün premium şablonlara və AI xüsusiyyətlərinə çıxış əldə edin.</p>
            </div>
            <div className="mt-3">
              <button
                onClick={onUpgrade}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Paketləri görün
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Paket Yeniləməsi Tələb Olunur
            </h3>
            <p className="text-gray-600 mb-6">
              Bu şablonu istifadə etmək üçün paketinizi yeniləmək lazımdır. Qiymətlər səhifəsinə keçmək istəyirsiniz?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Ləğv et
              </button>
              <button
                onClick={handleUpgradeConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Qiymətlərə bax
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
