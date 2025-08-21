'use client';

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { CustomSection } from '@/types/cv';
import { useCustomSections, CUSTOM_SECTION_TEMPLATES } from '@/utils/customSectionManager';

interface CustomSectionManagerComponentProps {
  data: CustomSection[];
  onChange: (data: CustomSection[]) => void;
  userTier?: string;
}

export default function CustomSectionManagerComponent({
  data,
  onChange,
  userTier = 'Free'
}: CustomSectionManagerComponentProps) {
  const { showSuccess, showError, showWarning } = useNotification();

  const {
    filteredSections,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    validateAll,
    exportSections,
    importSections,
    getStats,
    setSections
  } = useCustomSections(data);

  const [showTemplates, setShowTemplates] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sync with parent component
  useEffect(() => {
    const handleChange = (sections: CustomSection[]) => {
      onChange(sections);
    };

    // Subscribe to changes
    setSections(data);
  }, [data, onChange, setSections]);

  const handleValidateAll = () => {
    const errors = validateAll();
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleExport = () => {
    const exportData = exportSections();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-custom-sections-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const result = importSections(importData);
    if (result.errors.length > 0) {
      showError('İmport xətaları:\n' + result.errors.join('\n'));
    } else {
      showSuccess(`${result.sections.length} bölmə uğurla import edildi!`);
      setShowImportModal(false);
      setImportData('');
      onChange(data.concat(result.sections));
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  const addItemToSection = (sectionId: string) => {
    const section = filteredSections.find((s: CustomSection) => s.id === sectionId);
    const newItem = {
      id: `custom-item-${Date.now()}`,
      title: '',
      description: '',
      ...(section?.type === 'timeline' && { date: '' }),
      ...(section?.type === 'detailed' && { url: '', location: '' }),
      priority: section?.items?.length || 0,
      isVisible: true
    };

    updateSection(sectionId, {
      items: [...(section?.items || []), newItem]
    });
    setExpandedItemId(newItem.id);
  };

  const updateItem = (sectionId: string, itemId: string, updates: any) => {
    const section = filteredSections.find((s: CustomSection) => s.id === sectionId);
    if (!section) return;

    const updatedItems = section.items?.map((item: any) =>
      item.id === itemId ? { ...item, ...updates } : item
    ) || [];

    updateSection(sectionId, { items: updatedItems });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    const section = filteredSections.find((s: CustomSection) => s.id === sectionId);
    if (!section) return;

    const updatedItems = section.items?.filter((item: any) => item.id !== itemId) || [];
    updateSection(sectionId, { items: updatedItems });
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Əlavə Bölmələr</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📊 {stats.totalSections} bölmə</span>
              <span>📝 {stats.totalItems} element</span>
              <span>👁 {stats.visibleSections} görünür</span>
              <span>📈 Orta {stats.averageItemsPerSection} element/bölmə</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="text"
              placeholder="Bölmələrdə axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="all">📦 Bütün növlər</option>
              <option value="simple">📝 Sadə</option>
              <option value="detailed">📋 Ətraflı</option>
              <option value="timeline">⏰ Tarix xətti</option>
            </select>

            {/* Action Buttons */}
            <button
              onClick={handleValidateAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Yoxla
            </button>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              📤 İxrac
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              📥 İmport
            </button>

            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Yeni Bölmə
            </button>
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">⚠ Tapılan Xətalar:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(validationErrors).map(([sectionId, error]) => {
                const section = filteredSections.find((s: CustomSection) => s.id === sectionId);
                return (
                  <li key={sectionId}>
                    <strong>{section?.title || 'Naməlum bölmə'}:</strong> {error}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">🎨 Bölmə Şablonu Seçin</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {CUSTOM_SECTION_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const sectionId = addSection(template);
                    setShowTemplates(false);
                    setExpandedSectionId(sectionId);
                  }}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group h-full"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </span>
                    <h4 className="font-semibold text-gray-900 text-sm">{template.title}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.examples.slice(0, 2).map((example, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {example}
                      </span>
                    ))}
                    {template.examples.length > 2 && (
                      <span className="text-xs text-gray-500">+{template.examples.length - 2}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t pt-6">
              <button
                onClick={() => {
                  const sectionId = addSection();
                  setShowTemplates(false);
                  setExpandedSectionId(sectionId);
                }}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group"
              >
                <span className="text-4xl mb-3 block group-hover:scale-110 transition-transform">🛠</span>
                <span className="font-semibold text-gray-900 block mb-2">Boş Bölmə Yarat</span>
                <p className="text-sm text-gray-600">Sıfırdan öz dizaynınızı yaradın</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">📥 Bölmələri İmport Et</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Fayl Seç
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              <div className="text-center text-gray-500">və ya</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  JSON Data Daxil Et
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  rows={10}
                  placeholder="JSON formatında bölmə məlumatlarını buraya yapışdırın..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İmport et
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections List */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎯</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {searchQuery || typeFilter !== 'all' ? 'Heç bir nəticə tapılmadı' : 'İlk Bölmənizi Yaradın'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            {searchQuery || typeFilter !== 'all'
              ? 'Axtarış və ya filtr şərtlərinizi dəyişdirməyi cəhd edin'
              : 'CV-nizə unikal xüsusiyyətlər əlavə etmək üçün öz bölmələrinizi yaradın'
            }
          </p>
          {!searchQuery && typeFilter === 'all' && (
            <button
              onClick={() => setShowTemplates(true)}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-3 text-lg font-semibold"
            >
              <span>🚀</span>
              Bölmə Yaratmağa Başla
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section: CustomSection, sectionIndex: number) => (
            <div
              key={section.id}
              className={`border rounded-xl p-6 bg-white shadow-sm transition-all hover:shadow-md ${
                validationErrors[section.id] 
                  ? 'border-red-300 bg-red-50' 
                  : section.isVisible === false
                  ? 'border-gray-200 bg-gray-50 opacity-75'
                  : 'border-gray-200'
              }`}
            >
              {/* Section content would continue here... */}
              {/* This would include all the section editing interface */}
              {/* from the previous EnhancedCustomSectionsSection component */}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-lg">{section.icon || '📝'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {section.title || 'Yeni Bölmə'}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        {section.type || 'simple'}
                      </span>
                      {section.isVisible === false && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          Gizli
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {section.items?.length || 0} element
                      {section.description && ` • ${section.description}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSection(section.id, { isVisible: !section.isVisible })}
                    className={`p-3 rounded-lg transition-colors ${
                      section.isVisible !== false 
                        ? 'text-green-600 hover:bg-green-100' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={section.isVisible !== false ? 'Gizlə' : 'Göstər'}
                  >
                    {section.isVisible !== false ? '👁' : '👁‍🗨'}
                  </button>

                  <button
                    onClick={() => duplicateSection(section.id)}
                    className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Kopyala"
                  >
                    📋
                  </button>

                  <button
                    onClick={() => setExpandedSectionId(
                      expandedSectionId === section.id ? null : section.id
                    )}
                    className="p-3 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Redaktə et"
                  >
                    {expandedSectionId === section.id ? '🔽' : '▶️'}
                  </button>

                  <button
                    onClick={() => removeSection(section.id)}
                    className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Quick preview when collapsed */}
              {expandedSectionId !== section.id && section.items && section.items.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {section.items.slice(0, 6).map((item) => (
                      <span
                        key={item.id}
                        className="text-sm bg-gradient-to-r from-blue-50 to-green-50 text-gray-700 px-3 py-1 rounded-full border border-gray-200"
                      >
                        {item.title}
                      </span>
                    ))}
                    {section.items.length > 6 && (
                      <span className="text-sm text-gray-500 px-3 py-1">
                        +{section.items.length - 6} daha...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed editing interface would go here when expanded */}
              {expandedSectionId === section.id && (
                <div className="border-t pt-6">
                  <div className="text-center py-8 text-gray-500">
                    <p>Redaktə interfeysi burada olacaq...</p>
                    <p className="text-sm mt-2">
                      Bu hissə əvvəlki EnhancedCustomSectionsSection komponentindən gətiriləcək
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
