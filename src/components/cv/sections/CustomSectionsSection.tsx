'use client';

import { useState } from 'react';
import { CustomSection, CustomSectionItem } from '@/types/cv';

interface CustomSectionsSectionProps {
  data: CustomSection[];
  onChange: (data: CustomSection[]) => void;
  userTier?: string;
}

function CustomSectionsSection({ data, onChange, userTier = 'Free' }: CustomSectionsSectionProps) {
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Yeni section əlavə et
  const addSection = () => {
    const newSection: CustomSection = {
      id: crypto.randomUUID(),
      title: 'Yeni Bölmə',
      items: []
    };
    onChange([...data, newSection]);
    setExpandedSectionId(newSection.id);
  };

  // Section sil
  const removeSection = (sectionId: string) => {
    onChange(data.filter(section => section.id !== sectionId));
  };

  // Section başlığını yenilə
  const updateSectionTitle = (sectionId: string, title: string) => {
    const updated = data.map(section =>
      section.id === sectionId ? { ...section, title } : section
    );
    onChange(updated);
  };

  // Yeni item əlavə et
  const addItem = (sectionId: string) => {
    const newItem: CustomSectionItem = {
      id: crypto.randomUUID(),
      title: 'Yeni Element',
      description: ''
    };
    const updated = data.map(section =>
      section.id === sectionId
        ? { ...section, items: [...section.items, newItem] }
        : section
    );
    onChange(updated);
    setExpandedItemId(newItem.id);
  };

  // Item sil
  const removeItem = (sectionId: string, itemId: string) => {
    const updated = data.map(section =>
      section.id === sectionId
        ? { ...section, items: section.items.filter(item => item.id !== itemId) }
        : section
    );
    onChange(updated);
  };

  // Item yenilə
  const updateItem = (sectionId: string, itemId: string, field: keyof CustomSectionItem, value: string) => {
    const updated = data.map(section =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId ? { ...item, [field]: value } : item
            )
          }
        : section
    );
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Əlavə Bölmələr</h3>
          <p className="text-sm text-gray-600">CV-nizə xüsusi bölmələr əlavə edin</p>
        </div>
        <button
          onClick={addSection}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Bölmə
        </button>
      </div>

      {/* Sections */}
      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Əlavə bölmə yoxdur</h3>
          <p className="text-gray-600 mb-4">CV-nizə xüsusi bölmələr əlavə etmək üçün "Yeni Bölmə" düyməsini basın</p>
          <button
            onClick={addSection}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Bölməni Əlavə Et
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Section Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="w-full text-lg font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                      placeholder="Bölmə başlığı"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addItem(section.id)}
                      className="flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Element
                    </button>
                    <button
                      onClick={() => setExpandedSectionId(expandedSectionId === section.id ? null : section.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedSectionId === section.id ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Items */}
              {expandedSectionId === section.id && (
                <div className="p-4">
                  {section.items.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <p className="text-gray-600 mb-3">Bu bölmədə hələ element yoxdur</p>
                      <button
                        onClick={() => addItem(section.id)}
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        İlk Elementi Əlavə Et
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {section.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          {/* Item Header */}
                          <div className="flex items-center justify-between mb-3">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItem(section.id, item.id, 'title', e.target.value)}
                              className="flex-1 font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0"
                              placeholder="Element başlığı"
                            />
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${expandedItemId === item.id ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeItem(section.id, item.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6m0 0l6-6m-6 6L6 6" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Item Description */}
                          {expandedItemId === item.id && (
                            <div>
                              <textarea
                                value={item.description || ''}
                                onChange={(e) => updateItem(section.id, item.id, 'description', e.target.value)}
                                placeholder="Bu element haqqında təfərrüatlı məlumat yazın..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={4}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSectionsSection;