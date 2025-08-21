// Custom Sections Utility Functions
import { useState, useMemo } from 'react';
import { CustomSection, CustomSectionItem } from '@/types/cv';

export class CustomSectionManager {
  // Validation functions
  static validateSection(section: CustomSection): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!section.title?.trim()) {
      errors.push('Bölmə başlığı tələb olunur');
    }

    if (section.title && section.title.length > 100) {
      errors.push('Bölmə başlığı 100 simvoldan çox ola bilməz');
    }

    if (!section.items || section.items.length === 0) {
      errors.push('Ən azı bir element əlavə edin');
    }

    section.items?.forEach((item, index) => {
      const itemErrors = this.validateItem(item);
      if (itemErrors.length > 0) {
        errors.push(`Element ${index + 1}: ${itemErrors.join(', ')}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateItem(item: CustomSectionItem): string[] {
    const errors: string[] = [];

    if (!item.title?.trim()) {
      errors.push('Başlıq tələb olunur');
    }

    if (item.title && item.title.length > 200) {
      errors.push('Başlıq 200 simvoldan çox ola bilməz');
    }

    if (item.url && !this.isValidUrl(item.url)) {
      errors.push('Düzgün URL formatı daxil edin');
    }

    return errors;
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Sorting functions
  static sortSectionsByPriority(sections: CustomSection[]): CustomSection[] {
    return sections.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  static sortItemsByPriority(items: CustomSectionItem[]): CustomSectionItem[] {
    return items.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  // Search and filter functions
  static searchSections(sections: CustomSection[], query: string): CustomSection[] {
    const lowerQuery = query.toLowerCase();
    return sections.filter(section =>
      section.title?.toLowerCase().includes(lowerQuery) ||
      section.description?.toLowerCase().includes(lowerQuery) ||
      section.items?.some(item =>
        item.title?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      )
    );
  }

  static filterSectionsByType(sections: CustomSection[], type: string): CustomSection[] {
    if (type === 'all') return sections;
    return sections.filter(section => section.type === type);
  }

  static filterVisibleSections(sections: CustomSection[]): CustomSection[] {
    return sections.filter(section => section.isVisible !== false);
  }

  // Import/Export functions
  static exportSections(sections: CustomSection[]): string {
    const exportData = {
      sections,
      exportDate: new Date().toISOString(),
      version: '1.0',
      metadata: {
        totalSections: sections.length,
        totalItems: sections.reduce((sum, section) => sum + (section.items?.length || 0), 0)
      }
    };
    return JSON.stringify(exportData, null, 2);
  }

  static importSections(jsonData: string): { sections: CustomSection[]; errors: string[] } {
    try {
      const data = JSON.parse(jsonData);
      const errors: string[] = [];

      if (!data.sections || !Array.isArray(data.sections)) {
        return { sections: [], errors: ['Yanlış fayl formatı'] };
      }

      const sections = data.sections.map((section: any, index: number) => {
        // Regenerate IDs to avoid conflicts
        const newSection: CustomSection = {
          ...section,
          id: `imported-section-${Date.now()}-${index}`,
          items: section.items?.map((item: any, itemIndex: number) => ({
            ...item,
            id: `imported-item-${Date.now()}-${index}-${itemIndex}`
          })) || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const validation = this.validateSection(newSection);
        if (!validation.isValid) {
          errors.push(`Bölmə ${index + 1}: ${validation.errors.join(', ')}`);
        }

        return newSection;
      });

      return { sections, errors };
    } catch (error) {
      return { sections: [], errors: ['Fayl oxuna bilmədi'] };
    }
  }

  // Template functions
  static createSectionFromTemplate(template: {
    title: string;
    description: string;
    type: 'simple' | 'detailed' | 'timeline';
    icon: string;
    examples: string[];
  }): CustomSection {
    const now = new Date().toISOString();
    return {
      id: `custom-section-${Date.now()}`,
      title: template.title,
      description: template.description,
      type: template.type,
      icon: template.icon,
      isVisible: true,
      priority: 0,
      createdAt: now,
      updatedAt: now,
      items: template.examples.map((example, index) => ({
        id: `custom-item-${Date.now()}-${index}`,
        title: example,
        description: '',
        priority: index,
        isVisible: true
      }))
    };
  }

  // Duplicate functions
  static duplicateSection(section: CustomSection): CustomSection {
    const now = new Date().toISOString();
    return {
      ...section,
      id: `custom-section-${Date.now()}`,
      title: `${section.title} (Kopya)`,
      createdAt: now,
      updatedAt: now,
      items: section.items?.map((item, index) => ({
        ...item,
        id: `custom-item-${Date.now()}-${index}`
      })) || []
    };
  }

  static duplicateItem(item: CustomSectionItem): CustomSectionItem {
    return {
      ...item,
      id: `custom-item-${Date.now()}`,
      title: `${item.title} (Kopya)`
    };
  }

  // Analytics functions
  static getSectionStats(sections: CustomSection[]) {
    const totalSections = sections.length;
    const visibleSections = sections.filter(s => s.isVisible !== false).length;
    const totalItems = sections.reduce((sum, section) => sum + (section.items?.length || 0), 0);
    const sectionsByType = sections.reduce((acc, section) => {
      const type = section.type || 'simple';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSections,
      visibleSections,
      hiddenSections: totalSections - visibleSections,
      totalItems,
      averageItemsPerSection: totalSections > 0 ? Math.round(totalItems / totalSections) : 0,
      sectionsByType
    };
  }

  // Bulk operations
  static updateAllSectionsPriority(sections: CustomSection[]): CustomSection[] {
    return sections.map((section, index) => ({
      ...section,
      priority: index + 1,
      updatedAt: new Date().toISOString()
    }));
  }

  static toggleAllSectionsVisibility(sections: CustomSection[], visible: boolean): CustomSection[] {
    return sections.map(section => ({
      ...section,
      isVisible: visible,
      updatedAt: new Date().toISOString()
    }));
  }
}

// Predefined section templates for easy creation
export const CUSTOM_SECTION_TEMPLATES = [
  {
    title: 'Hobbi və Maraqlar',
    description: 'Şəxsi maraq sahələriniz və hobbilər',
    type: 'simple' as const,
    icon: '🎨',
    examples: ['Rəsm çəkmək', 'Kitab oxumaq', 'İdman', 'Musiqi', 'Səyahət']
  },
  {
    title: 'Mükafatlar və Təltiflər',
    description: 'Aldığınız mükafatlar və tanınma',
    type: 'detailed' as const,
    icon: '🏆',
    examples: ['İlin Ən Yaxşı İşçisi', 'Akademik Üstünlük Mükafatı', 'İnnovasiya Mükafatı']
  },
  {
    title: 'Kurslar və Təlimlər',
    description: 'Əlavə kurslar və təlim proqramları',
    type: 'timeline' as const,
    icon: '📚',
    examples: ['Python Proqramlaşdırma Kursu', 'Liderlik Təlimi', 'Digital Marketing']
  },
  {
    title: 'Yayımlar və Məqalələr',
    description: 'Yazdığınız məqalələr və tədqiqatlar',
    type: 'detailed' as const,
    icon: '📝',
    examples: ['Texniki məqalə', 'Tədqiqat işi', 'Blog yazısı']
  },
  {
    title: 'Sosial Fəaliyyət',
    description: 'İctimai fəaliyyət və könüllü işlər',
    type: 'timeline' as const,
    icon: '🤝',
    examples: ['Xeyriyyə təşkilatında könüllü', 'İcma layihələri', 'Təhsil proqramları']
  },
  {
    title: 'Referanslar',
    description: 'İş referansları və tövsiyələr',
    type: 'detailed' as const,
    icon: '👥',
    examples: ['Sabiq rəhbər tövsiyəsi', 'Həmkar tövsiyəsi', 'Müştəri rəyi']
  },
  {
    title: 'Texniki Bacarıqlar',
    description: 'Proqram və texnologiyalar',
    type: 'simple' as const,
    icon: '💻',
    examples: ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL']
  },
  {
    title: 'Portfolio Layihələri',
    description: 'Şəxsi və peşəkar layihələr',
    type: 'detailed' as const,
    icon: '💼',
    examples: ['E-ticarət veb saytı', 'Mobil tətbiq', 'Data analiz layihəsi']
  },
  {
    title: 'Sertifikatlar',
    description: 'Peşəkar sertifikatlar və lisenziyalar',
    type: 'timeline' as const,
    icon: '📜',
    examples: ['AWS Certified', 'Google Analytics Certified', 'PMP Sertifikatı']
  },
  {
    title: 'Konferans və Təqdimatlar',
    description: 'İştirak etdiyiniz və təqdim etdiyiniz tədbirlər',
    type: 'timeline' as const,
    icon: '🎤',
    examples: ['Texnologiya konferansı', 'Workshop təqdimatı', 'Webinar']
  }
];

// Custom hooks for section management
export const useCustomSections = (initialSections: CustomSection[] = []) => {
  const [sections, setSections] = useState<CustomSection[]>(initialSections);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredSections = useMemo(() => {
    let filtered = sections;

    if (searchQuery) {
      filtered = CustomSectionManager.searchSections(filtered, searchQuery);
    }

    if (typeFilter !== 'all') {
      filtered = CustomSectionManager.filterSectionsByType(filtered, typeFilter);
    }

    return CustomSectionManager.sortSectionsByPriority(filtered);
  }, [sections, searchQuery, typeFilter]);

  const addSection = (template?: typeof CUSTOM_SECTION_TEMPLATES[0]) => {
    const newSection = template
      ? CustomSectionManager.createSectionFromTemplate(template)
      : {
          id: `custom-section-${Date.now()}`,
          title: '',
          description: '',
          items: [],
          type: 'simple' as const,
          isVisible: true,
          priority: sections.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

    setSections(prev => [...prev, newSection]);
    return newSection.id;
  };

  const updateSection = (sectionId: string, updates: Partial<CustomSection>) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, ...updates, updatedAt: new Date().toISOString() }
        : section
    ));
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const duplicated = CustomSectionManager.duplicateSection(section);
      setSections(prev => [...prev, duplicated]);
      return duplicated.id;
    }
  };

  const validateAll = () => {
    const errors: Record<string, string> = {};
    sections.forEach(section => {
      const validation = CustomSectionManager.validateSection(section);
      if (!validation.isValid) {
        errors[section.id] = validation.errors.join(', ');
      }
    });
    return errors;
  };

  const exportSections = () => {
    return CustomSectionManager.exportSections(sections);
  };

  const importSections = (jsonData: string) => {
    const result = CustomSectionManager.importSections(jsonData);
    if (result.sections.length > 0) {
      setSections(prev => [...prev, ...result.sections]);
    }
    return result;
  };

  const getStats = () => {
    return CustomSectionManager.getSectionStats(sections);
  };

  return {
    sections,
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
  };
};

export default CustomSectionManager;
