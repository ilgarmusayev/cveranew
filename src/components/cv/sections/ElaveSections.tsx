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
  cvLanguage?: 'english' | 'azerbaijani';
}

// Translation helper function
const getTranslation = (cvLanguage: 'english' | 'azerbaijani', key: string): any => {
  const translations = {
    english: {
      sectionTitle: 'Additional Sections',
      sectionDescription: 'Add custom sections and elements to your CV',
      addSection: 'Add Section',
      addSectionMobile: '+',
      noSectionsTitle: 'No additional sections yet',
      noSectionsDescription: 'Click "Add Section" to add custom sections to your CV',
      addFirstSection: 'Add First Section',
      newSectionPlaceholder: 'Enter new section name...',
      addElement: 'Add element:',
      listItemAdd: '+ Add Item',
      text: 'Text',
      list: 'List',
      heading: 'Subheading',
      achievement: 'Achievement',
      link: 'Link',
      dateRange: 'Date Range',
      skill: 'Skill',
      textPlaceholder: 'Enter text...',
      listItemPlaceholder: 'List item',
      headingPlaceholder: 'Heading text',
      startDatePlaceholder: 'Start date',
      endDatePlaceholder: 'End date',
      achievementTitlePlaceholder: 'Achievement title',
      achievementDetailsPlaceholder: 'Achievement details',
      skillNamePlaceholder: 'Skill name',
      linkTitlePlaceholder: 'Link title',
      linkUrlPlaceholder: 'https://example.com',
      skillLevels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert'
      }
    },
    azerbaijani: {
      sectionTitle: 'Əlavə Bölmələr',
      sectionDescription: 'CV-nizə xüsusi bölmələr və elementlər əlavə edin',
      addSection: 'Bölmə Əlavə Et',
      addSectionMobile: '+',
      noSectionsTitle: 'Hələ əlavə bölmə yoxdur',
      noSectionsDescription: 'CV-nizə xüsusi bölmələr əlavə etmək üçün "Bölmə Əlavə Et" düyməsini basın',
      addFirstSection: 'İlk Bölməni Əlavə Et',
      newSectionPlaceholder: 'Yeni bölmə adı yazın...',
      addElement: 'Element əlavə et:',
      listItemAdd: '+ Element əlavə et',
      text: 'Mətn',
      list: 'Siyahı',
      heading: 'Alt Başlıq',
      achievement: 'Nailiyyət',
      link: 'Keçid',
      dateRange: 'Tarix Aralığı',
      skill: 'Bacarıq',
      textPlaceholder: 'Mətn daxil edin...',
      listItemPlaceholder: 'Siyahı elementi',
      headingPlaceholder: 'Başlıq mətni',
      startDatePlaceholder: 'Başlanğıc tarixi',
      endDatePlaceholder: 'Bitiş tarixi',
      achievementTitlePlaceholder: 'Nailiyyət başlığı',
      achievementDetailsPlaceholder: 'Nailiyyət təfərrüatları',
      skillNamePlaceholder: 'Bacarıq adı',
      linkTitlePlaceholder: 'Keçid başlığı',
      linkUrlPlaceholder: 'https://example.com',
      skillLevels: {
        beginner: 'Başlanğıc',
        intermediate: 'Orta',
        advanced: 'Yüksək',
        expert: 'Expert'
      }
    }
  } as const;
  
  return (translations[cvLanguage] as any)[key] || (translations['azerbaijani'] as any)[key];
};

const getElementTypes = (cvLanguage: 'english' | 'azerbaijani') => [
  { 
    type: 'text' as ElementType, 
    label: getTranslation(cvLanguage, 'text'), 
    icon: '📝', 
    description: cvLanguage === 'english' ? 'Plain text block' : 'Adi mətn bloku' 
  },
  { 
    type: 'list' as ElementType, 
    label: getTranslation(cvLanguage, 'list'), 
    icon: '📋', 
    description: cvLanguage === 'english' ? 'Bullet point list' : 'Nöqtəli siyahı' 
  },
  { 
    type: 'heading' as ElementType, 
    label: getTranslation(cvLanguage, 'heading'), 
    icon: '🏷️', 
    description: cvLanguage === 'english' ? 'Section heading' : 'Bölmə daxili başlıq' 
  },
  { 
    type: 'achievement' as ElementType, 
    label: getTranslation(cvLanguage, 'achievement'), 
    icon: '🏆', 
    description: cvLanguage === 'english' ? 'Special achievement or milestone' : 'Xüsusi nailiyyət və ya məqam' 
  },
  { 
    type: 'link' as ElementType, 
    label: getTranslation(cvLanguage, 'link'), 
    icon: '🔗', 
    description: cvLanguage === 'english' ? 'External link or URL' : 'Xarici keçid və ya URL' 
  }
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
            description: element.items?.filter(item => item.trim()).map(item => `• ${item}`).join('<br>') || ''
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

export default function ElaveSections({ data = [], onChange, userTier = 'Free', cvLanguage = 'azerbaijani' }: ElaveSectionsProps) {
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
    console.log('🔄 ElaveSections onChange triggered:', {
      sectionsLength: sections.length,
      cvPreviewFormatLength: cvPreviewFormat.length,
      cvPreviewFormat: cvPreviewFormat,
      hasOnChange: !!onChange
    });
    onChange?.(cvPreviewFormat);
  }, [sections]); // Remove onChange from dependencies to avoid infinite loop

  const addSection = () => {
    console.log('🆕 Adding new section in ElaveSections');
    const newSection: CustomSection = {
      id: Date.now().toString(),
      title: '',
      elements: [],
      isExpanded: true
    };
    console.log('🆕 New section created:', newSection);
    setSections(prev => {
      const newSections = [...prev, newSection];
      console.log('🆕 Updated sections:', newSections);
      return newSections;
    });
  };

  const addOrganizationsSection = () => {
    console.log('🏢 Adding Organizations template section');
    const organizationsSection: CustomSection = {
      id: Date.now().toString(),
      title: cvLanguage === 'english' ? 'Organizations' : 'Təşkilatlar',
      elements: [
        {
          id: `org-${Date.now()}-1`,
          type: 'heading',
          content: cvLanguage === 'english' ? 'Organization Name' : 'Təşkilat Adı'
        },
        {
          id: `org-${Date.now()}-2`,
          type: 'text',
          content: cvLanguage === 'english' ? 'Position/Role' : 'Vəzifə/Rol'
        },
        {
          id: `org-${Date.now()}-3`,
          type: 'dateRange',
          content: cvLanguage === 'english' ? 'Duration' : 'Müddət',
          subContent: cvLanguage === 'english' ? '2020 - Present' : '2020 - Hazırda'
        },
        {
          id: `org-${Date.now()}-4`,
          type: 'text',
          content: cvLanguage === 'english' 
            ? 'Brief description of your role and responsibilities in the organization' 
            : 'Təşkilatdakı rolunuz və məsuliyyətlərinizin qısa təsviri'
        }
      ],
      isExpanded: true
    };
    console.log('🏢 Organizations section created:', organizationsSection);
    setSections(prev => {
      const newSections = [...prev, organizationsSection];
      console.log('🏢 Updated sections with organizations:', newSections);
      return newSections;
    });
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
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📝 {getTranslation(cvLanguage, 'text')}
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
              placeholder={getTranslation(cvLanguage, 'textPlaceholder')}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[60px] sm:min-h-[80px]"
              rows={3}
            />
          </div>
        );

      case 'list':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📋 {getTranslation(cvLanguage, 'list')}
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
                    placeholder={`${getTranslation(cvLanguage, 'listItemPlaceholder')} ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                  />
                  <button
                    onClick={() => removeListItem(sectionId, element.id, index)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => addListItem(sectionId, element.id)}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors text-sm"
              >
                {getTranslation(cvLanguage, 'listItemAdd')}
              </button>
            </div>
          </div>
        );

      case 'heading':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🏷️ {getTranslation(cvLanguage, 'heading')}
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
              placeholder={getTranslation(cvLanguage, 'headingPlaceholder')}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-sm sm:text-base"
            />
          </div>
        );

      case 'dateRange':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                📅 {getTranslation(cvLanguage, 'dateRange')}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder={getTranslation(cvLanguage, 'startDatePlaceholder')}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="text"
                value={element.subContent || ''}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                placeholder={getTranslation(cvLanguage, 'endDatePlaceholder')}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
          </div>
        );

      case 'achievement':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🏆 {getTranslation(cvLanguage, 'achievement')}
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
              placeholder={getTranslation(cvLanguage, 'achievementTitlePlaceholder')}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2 font-medium text-sm sm:text-base"
            />
            <textarea
              value={element.subContent || ''}
              onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
              placeholder={getTranslation(cvLanguage, 'achievementDetailsPlaceholder')}
              className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={2}
            />
          </div>
        );

      case 'skill':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                ⭐ {getTranslation(cvLanguage, 'skill')}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder={getTranslation(cvLanguage, 'skillNamePlaceholder')}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <select
                value={element.subContent || getTranslation(cvLanguage, 'skillLevels').beginner}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              >
                <option value={getTranslation(cvLanguage, 'skillLevels').beginner}>{getTranslation(cvLanguage, 'skillLevels').beginner}</option>
                <option value={getTranslation(cvLanguage, 'skillLevels').intermediate}>{getTranslation(cvLanguage, 'skillLevels').intermediate}</option>
                <option value={getTranslation(cvLanguage, 'skillLevels').advanced}>{getTranslation(cvLanguage, 'skillLevels').advanced}</option>
                <option value={getTranslation(cvLanguage, 'skillLevels').expert}>{getTranslation(cvLanguage, 'skillLevels').expert}</option>
              </select>
            </div>
          </div>
        );

      case 'link':
        return (
          <div key={element.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center">
                🔗 {getTranslation(cvLanguage, 'link')}
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
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <input
                type="text"
                value={element.content}
                onChange={(e) => updateElement(sectionId, element.id, { content: e.target.value })}
                placeholder={getTranslation(cvLanguage, 'linkTitlePlaceholder')}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="url"
                value={element.subContent || ''}
                onChange={(e) => updateElement(sectionId, element.id, { subContent: e.target.value })}
                placeholder={getTranslation(cvLanguage, 'linkUrlPlaceholder')}
                className="p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base break-all"
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{getTranslation(cvLanguage, 'sectionTitle')}</h3>
          <p className="text-xs sm:text-sm text-gray-600 break-words">{getTranslation(cvLanguage, 'sectionDescription')}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={addOrganizationsSection}
            className="flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm"
            title={cvLanguage === 'english' ? 'Add Organizations Template' : 'Təşkilatlar Şablonu Əlavə Et'}
          >
            <span className="mr-1 sm:mr-2">🏢</span>
            <span className="hidden sm:inline">
              {cvLanguage === 'english' ? 'Organizations' : 'Təşkilatlar'}
            </span>
          </button>
          <button
            onClick={addSection}
            className="flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-2 sm:mr-2 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline text-sm">
              {getTranslation(cvLanguage, 'addSection')}
            </span>
            <span className="sm:hidden text-sm">
              {getTranslation(cvLanguage, 'addSectionMobile')}
            </span>
          </button>
        </div>
      </div>

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{getTranslation(cvLanguage, 'noSectionsTitle')}</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-4 break-words">{getTranslation(cvLanguage, 'noSectionsDescription')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={addOrganizationsSection}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <span className="mr-2">🏢</span>
              {cvLanguage === 'english' ? 'Add Organizations' : 'Təşkilatlar Əlavə Et'}
            </button>
            <button
              onClick={addSection}
              className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              {getTranslation(cvLanguage, 'addFirstSection')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Section Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
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
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0 group">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 bg-transparent border-none p-1 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:bg-blue-50 rounded-md transition-all flex-1 min-w-0 hover:bg-gray-50"
                      placeholder={getTranslation(cvLanguage, 'newSectionPlaceholder')}
                    />
                    <svg 
                      className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-1.5 sm:p-2 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Section Content */}
              {section.isExpanded && (
                <div className="p-3 sm:p-4">
                  <div className="space-y-4">
                    {/* Elements */}
                    {section.elements.map((element) => renderElement(section.id, element))}

                    {/* Add Element Buttons */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-3">{getTranslation(cvLanguage, 'addElement')}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {getElementTypes(cvLanguage).map((type) => (
                          <button
                            key={type.type}
                            onClick={() => addElement(section.id, type.type)}
                            className="flex flex-col items-center p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 min-h-[45px] sm:min-h-[60px] justify-center text-center"
                            title={type.description}
                          >
                            <span className="text-sm sm:text-lg mb-1 flex-shrink-0">{type.icon}</span>
                            <span className="text-xs font-medium text-gray-700 leading-tight truncate w-full px-1">{type.label}</span>
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
