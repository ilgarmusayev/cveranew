'use client';

import { useState, useEffect } from 'react';

// Element types for custom sections
type ElementType = 'text' | 'list' | 'heading' | 'dateRange' | 'achievement' | 'skill' | 'link';

interface CustomElement {
  id: string;
  type: ElementType;
  content: string;
  subContent?: string; // For date ranges, links, etc.
  items?: string[]; // For lists
}

interface CustomSection {
  id: string;
  title: string;
  elements: CustomElement[];
  isExpanded?: boolean;
}

// CVPreview compatible format
interface CVPreviewCustomSection {
  id: string;
  title: string;
  items: {
    id: string;
    title?: string;
    subtitle?: string;
    description?: string;
    url?: string;
    date?: string;
    location?: string;
    tags?: string[];
  }[];
  order?: number;
}

interface ElaveSectionsProps {
  data?: CustomSection[];
  onChange?: (data: CVPreviewCustomSection[]) => void;
  userTier?: string;
}

const elementTypes = [
  { type: 'text' as ElementType, label: 'Mətn', icon: '📝', description: 'Adi mətn bloku' },
  { type: 'list' as ElementType, label: 'Siyahı', icon: '📋', description: 'Nöqtəli siyahı' },
  { type: 'heading' as ElementType, label: 'Alt Başlıq', icon: '🏷️', description: 'Bölmə daxili başlıq' },
  { type: 'dateRange' as ElementType, label: 'Tarix Aralığı', icon: '📅', description: 'Başlanğıc və bitiş tarixi' },
  { type: 'achievement' as ElementType, label: 'Nailiyyət', icon: '🏆', description: 'Xüsusi nailiyyət və ya məqam' },
  { type: 'skill' as ElementType, label: 'Bacarıq', icon: '⭐', description: 'Bacarıq və səviyyə' },
  { type: 'link' as ElementType, label: 'Keçid', icon: '🔗', description: 'Xarici keçid və ya URL' }
];

// Convert internal format to CVPreview compatible format
const convertToCVPreviewFormat = (sections: CustomSection[]): CVPreviewCustomSection[] => {
  return sections.map((section, index) => ({
    id: section.id,
    title: section.title,
    order: index,
    items: section.elements.map(element => {
      const baseItem = {
        id: element.id,
      };

      switch (element.type) {
        case 'text':
          return {
            ...baseItem,
            description: element.content
          };
        case 'heading':
          return {
            ...baseItem,
            title: element.content
          };
        case 'dateRange':
          return {
            ...baseItem,
            title: element.content,
            date: element.subContent
          };
        case 'achievement':
          return {
            ...baseItem,
            title: element.content,
            description: element.subContent
          };
        case 'skill':
          return {
            ...baseItem,
            title: element.content,
            subtitle: element.subContent
          };
        case 'link':
          return {
            ...baseItem,
            title: element.content,
            url: element.subContent
          };
        case 'list':
          return {
            ...baseItem,
            description: element.items?.filter(item => item.trim()).join('\n• ') || '',
            tags: element.items?.filter(item => item.trim()) || []
          };
        default:
          return {
            ...baseItem,
            description: element.content
          };
      }
    })
  }));
};

export default function ElaveSections({ data = [], onChange, userTier = 'Free' }: ElaveSectionsProps) {
  // Convert from CVPreview format to internal format for initial data
  const convertFromCVPreviewFormat = (cvPreviewSections: any[]): CustomSection[] => {
    if (!Array.isArray(cvPreviewSections)) return [];
    
    return cvPreviewSections.map(section => ({
      id: section.id,
      title: section.title,
      isExpanded: false,
      elements: (section.items || []).map((item: any) => {
        // Determine element type based on item properties
        let elementType: ElementType = 'text';
        let content = '';
        let subContent = '';
        let items: string[] = [];

        if (item.url) {
          elementType = 'link';
          content = item.title || '';
          subContent = item.url;
        } else if (item.date) {
          elementType = 'dateRange';
          content = item.title || '';
          subContent = item.date;
        } else if (item.tags && item.tags.length > 0) {
          elementType = 'list';
          content = item.title || '';
          items = item.tags;
        } else if (item.title && item.subtitle) {
          elementType = 'skill';
          content = item.title;
          subContent = item.subtitle;
        } else if (item.title && item.description) {
          elementType = 'achievement';
          content = item.title;
          subContent = item.description;
        } else if (item.title && !item.description) {
          elementType = 'heading';
          content = item.title;
        } else {
          elementType = 'text';
          content = item.description || item.title || '';
        }

        return {
          id: item.id || Date.now().toString() + Math.random(),
          type: elementType,
          content,
          subContent,
          items: items.length > 0 ? items : undefined
        };
      })
    }));
  };

  const [sections, setSections] = useState<CustomSection[]>(() => {
    return convertFromCVPreviewFormat(data);
  });

  // Update parent when sections change, converting to CVPreview format
  useEffect(() => {
    const cvPreviewFormat = convertToCVPreviewFormat(sections);
    onChange?.(cvPreviewFormat);
  }, [sections]); // Remove onChange from dependencies to avoid infinite loop

  const addSection = () => {
    const newSection: CustomSection = {
      id: Date.now().toString(),
      title: 'Yeni Bölmə',
      elements: [],
      isExpanded: true
    };
    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, title } : section
    ));
  };

  const toggleSection = (sectionId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, isExpanded: !section.isExpanded } : section
    ));
  };

  const addElement = (sectionId: string, elementType: ElementType) => {
    const newElement: CustomElement = {
      id: Date.now().toString(),
      type: elementType,
      content: '',
      ...(elementType === 'list' && { items: [''] }),
      ...(elementType === 'dateRange' && { subContent: '' })
    };

    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, elements: [...section.elements, newElement] }
        : section
    ));
  };

  const removeElement = (sectionId: string, elementId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, elements: section.elements.filter(el => el.id !== elementId) }
        : section
    ));
  };

  const updateElement = (sectionId: string, elementId: string, updates: Partial<CustomElement>) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            elements: section.elements.map(el =>
              el.id === elementId ? { ...el, ...updates } : el
            )
          }
        : section
    ));
  };

  const addListItem = (sectionId: string, elementId: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            elements: section.elements.map(el =>
              el.id === elementId && el.type === 'list'
                ? { ...el, items: [...(el.items || []), ''] }
                : el
            )
          }
        : section
    ));
  };

  const updateListItem = (sectionId: string, elementId: string, itemIndex: number, value: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            elements: section.elements.map(el =>
              el.id === elementId && el.type === 'list'
                ? {
                    ...el,
                    items: el.items?.map((item, idx) => idx === itemIndex ? value : item) || []
                  }
                : el
            )
          }
        : section
    ));
  };

  const removeListItem = (sectionId: string, elementId: string, itemIndex: number) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? {
            ...section,
            elements: section.elements.map(el =>
              el.id === elementId && el.type === 'list'
                ? {
                    ...el,
                    items: el.items?.filter((_, idx) => idx !== itemIndex) || []
                  }
                : el
            )
          }
        : section
    ));
  };

  const renderElement = (sectionId: string, element: CustomElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📝 Mətn
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <textarea
              value={element.content}
              onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
              placeholder="Mətn daxil edin..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        );

      case 'list':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📋 Siyahı
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {element.items?.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateListItem(sectionId, element.id, index, e.target.value)}
                    placeholder={`Siyahı elementi ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => removeListItem(sectionId, element.id, index)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => addListItem(sectionId, element.id)}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
              >
                + Element əlavə et
              </button>
            </div>
          </div>
        );

      case 'heading':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🏷️ Alt Başlıq
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={element.content}
              onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
              placeholder="Başlıq mətni"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            />
          </div>
        );

      case 'dateRange':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📅 Tarix Aralığı
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder="Başlanğıc tarixi"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={element.subContent || ''}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                placeholder="Bitiş tarixi"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🏆 Nailiyyət
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              value={element.content}
              onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
              placeholder="Nailiyyət başlığı"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2 font-medium"
            />
            <textarea
              value={element.subContent || ''}
              onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
              placeholder="Nailiyyət təfərrüatları"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        );

      case 'skill':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                ⭐ Bacarıq
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder="Bacarıq adı"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={element.subContent || 'Başlanğıc'}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Başlanğıc">Başlanğıc</option>
                <option value="Orta">Orta</option>
                <option value="Yüksək">Yüksək</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
        );

      case 'link':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🔗 Keçid
              </span>
              <button
                onClick={() => removeElement(sectionId, element.id)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder="Keçid başlığı"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="url"
                value={element.subContent || ''}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                placeholder="https://example.com"
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Əlavə Bölmələr</h3>
          <p className="text-sm text-gray-600">CV-nizə xüsusi bölmələr və elementlər əlavə edin</p>
        </div>
        <button
          onClick={addSection}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Bölmə Əlavə Et
        </button>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Hələ əlavə bölmə yoxdur</h3>
          <p className="text-gray-600 mb-4">CV-nizə xüsusi bölmələr əlavə etmək üçün "Bölmə Əlavə Et" düyməsini basın</p>
          <button
            onClick={addSection}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk Bölməni Əlavə Et
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 flex-1">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${section.isExpanded ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                    className="text-lg font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 flex-1"
                    placeholder="Bölmə başlığı"
                  />
                </div>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-2 text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Section Content */}
              {section.isExpanded && (
                <div className="p-4">
                  <div className="space-y-4">
                    {/* Elements */}
                    {section.elements.map((element) => renderElement(section.id, element))}

                    {/* Add Element Buttons */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Element əlavə et:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {elementTypes.map((type) => (
                          <button
                            key={type.type}
                            onClick={() => addElement(section.id, type.type)}
                            className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                            title={type.description}
                          >
                            <span className="text-lg mb-1">{type.icon}</span>
                            <span className="text-xs font-medium text-gray-700">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
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
