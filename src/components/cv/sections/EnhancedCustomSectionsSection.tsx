'use client';

import { useState, useMemo } from 'react';
import { CustomSection, CustomSectionItem } from '@/types/cv';

// Utility function to safely render HTML content
const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div[^>]*>/gi, '')
        .replace(/<\/h[1-6]>/gi, '\n')
        .replace(/<h[1-6][^>]*>/gi, '')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ul[^>]*>/gi, '')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();
};

// Predefined section templates
const SECTION_TEMPLATES = [
  {
    title: 'Hobbi və Maraqlar',
    description: 'Şəxsi maraq sahələriniz və hobbilər',
    type: 'simple' as const,
    icon: '🎨',
    examples: ['Rəsm çəkmək', 'Kitab oxumaq', 'İdman', 'Musiqi']
  },
  {
    title: 'Mükafatlar və Təltiflər',
    description: 'Aldığınız mükafatlar və tanınma',
    type: 'detailed' as const,
    icon: '🏆',
    examples: ['İlin Ən Yaxşı İşçisi', 'Akademik Üstünlük Mükafatı']
  },
  {
    title: 'Kurslar və Təlimlər',
    description: 'Əlavə kurslar və təlim proqramları',
    type: 'timeline' as const,
    icon: '📚',
    examples: ['Python Proqramlaşdırma', 'Liderlik Təlimi']
  },
  {
    title: 'Yayımlar və Məqalələr',
    description: 'Yazdığınız məqalələr və tədqiqatlar',
    type: 'detailed' as const,
    icon: '📝',
    examples: ['Texniki məqalə', 'Tədqiqat işi']
  },
  {
    title: 'Sosial Fəaliyyət',
    description: 'İctimai fəaliyyət və könüllü işlər',
    type: 'timeline' as const,
    icon: '🤝',
    examples: ['Xeyriyyə təşkilatında könüllü', 'İcma layihələri']
  },
  {
    title: 'Referanslar',
    description: 'İş referansları və tövsiyələr',
    type: 'detailed' as const,
    icon: '👥',
    examples: ['Sabiq rəhbər', 'Həmkar tövsiyəsi']
  },
  {
    title: 'Texniki Bacarıqlar',
    description: 'Proqram və texnologiyalar',
    type: 'simple' as const,
    icon: '💻',
    examples: ['JavaScript', 'React', 'Node.js', 'Python']
  },
  {
    title: 'Dillər',
    description: 'Bildiyiniz xarici dillər',
    type: 'detailed' as const,
    icon: '🌍',
    examples: ['İngilis dili - İrəliləmiş', 'Türk dili - Ana dil']
  }
];

interface EnhancedCustomSectionsProps {
  data: CustomSection[];
  onChange: (data: CustomSection[]) => void;
  userTier?: string;
}

export default function EnhancedCustomSectionsSection({
  data,
  onChange,
  userTier = 'Free'
}: EnhancedCustomSectionsProps) {
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [sectionFilter, setSectionFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Validation function
  const validateSection = (section: CustomSection): string[] => {
    const errors: string[] = [];
    if (!section.title?.trim()) {
      errors.push('Bölmə başlığı tələb olunur');
    }
    if (section.items?.length === 0) {
      errors.push('Ən azı bir element əlavə edin');
    }
    section.items?.forEach((item, index) => {
      if (!item.title?.trim()) {
        errors.push(`Element ${index + 1}: Başlıq tələb olunur`);
      }
    });
    return errors;
  };

  // Filter and sort sections
  const filteredSections = useMemo(() => {
    let filtered = data;

    if (sectionFilter === 'visible') {
      filtered = data.filter(section => section.isVisible !== false);
    } else if (sectionFilter === 'hidden') {
      filtered = data.filter(section => section.isVisible === false);
    }

    return filtered.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }, [data, sectionFilter]);

  const addSection = (template?: typeof SECTION_TEMPLATES[0]) => {
    const newSection: CustomSection = {
      id: `custom-section-${Date.now()}`,
      title: template?.title || '',
      description: template?.description || '',
      items: [],
      type: template?.type || 'simple',
      isVisible: true,
      priority: data.length + 1
    };

    // Add sample items if template is provided
    if (template?.examples) {
      newSection.items = template.examples.map((example, index) => ({
        id: `custom-item-${Date.now()}-${index}`,
        title: example,
        description: ''
      }));
    }

    onChange([newSection, ...data]);
    setExpandedSectionId(newSection.id);
    setShowTemplates(false);
  };

  const updateSection = (sectionId: string, updates: Partial<CustomSection>) => {
    const updated = data.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    onChange(updated);

    // Clear validation errors for this section
    if (validationErrors[sectionId]) {
      const newErrors = { ...validationErrors };
      delete newErrors[sectionId];
      setValidationErrors(newErrors);
    }
  };

  const removeSection = (sectionId: string) => {
    onChange(data.filter(section => section.id !== sectionId));
    const newErrors = { ...validationErrors };
    delete newErrors[sectionId];
    setValidationErrors(newErrors);
  };

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = data.find(section => section.id === sectionId);
    if (!sectionToDuplicate) return;

    const duplicated: CustomSection = {
      ...sectionToDuplicate,
      id: `custom-section-${Date.now()}`,
      title: `${sectionToDuplicate.title} (Kopya)`,
      priority: data.length + 1,
      items: sectionToDuplicate.items?.map((item, index) => ({
        ...item,
        id: `custom-item-${Date.now()}-${index}`
      })) || []
    };

    onChange([...data, duplicated]);
  };

  const addItemToSection = (sectionId: string) => {
    const section = data.find(s => s.id === sectionId);
    const newItem: CustomSectionItem = {
      id: `custom-item-${Date.now()}`,
      title: '',
      description: '',
      ...(section?.type === 'timeline' && { date: '' }),
      ...(section?.type === 'detailed' && { url: '', location: '' })
    };

    const updated = data.map(section =>
      section.id === sectionId
        ? { ...section, items: [newItem, ...(section.items || [])] }
        : section
    );
    onChange(updated);
    setExpandedItemId(newItem.id);
  };

  const updateItem = (sectionId: string, itemId: string, updates: Partial<CustomSectionItem>) => {
    const updated = data.map(section =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items?.map(item =>
              item.id === itemId ? { ...item, ...updates } : item
            ) || []
          }
        : section
    );
    onChange(updated);
  };

  const removeItem = (sectionId: string, itemId: string) => {
    const updated = data.map(section =>
      section.id === sectionId
        ? { ...section, items: section.items?.filter(item => item.id !== itemId) || [] }
        : section
    );
    onChange(updated);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const index = data.findIndex(section => section.id === sectionId);
    if (direction === 'up' && index > 0) {
      const updated = [...data];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      onChange(updated);
    } else if (direction === 'down' && index < data.length - 1) {
      const updated = [...data];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    }
  };

  // Item-i köçür
  const moveItem = (sectionId: string, itemId: string, direction: 'up' | 'down') => {
    const updated = data.map(section => {
      if (section.id === sectionId) {
        const itemIndex = section.items.findIndex(item => item.id === itemId);
        if (direction === 'up' && itemIndex > 0) {
          const updatedItems = [...section.items];
          [updatedItems[itemIndex], updatedItems[itemIndex - 1]] = [updatedItems[itemIndex - 1], updatedItems[itemIndex]];
          return { ...section, items: updatedItems };
        } else if (direction === 'down' && itemIndex < section.items.length - 1) {
          const updatedItems = [...section.items];
          [updatedItems[itemIndex], updatedItems[itemIndex + 1]] = [updatedItems[itemIndex + 1], updatedItems[itemIndex]];
          return { ...section, items: updatedItems };
        }
      }
      return section;
    });
    onChange(updated);
  };

  const validateAllSections = () => {
    const errors: Record<string, string> = {};
    data.forEach(section => {
      const sectionErrors = validateSection(section);
      if (sectionErrors.length > 0) {
        errors[section.id] = sectionErrors.join(', ');
      }
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const exportSections = () => {
    const exportData = {
      sections: data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-custom-sections.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = SECTION_TEMPLATES.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Əlavə Bölmələr</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {data.length} bölmə
          </span>
          {Object.keys(validationErrors).length > 0 && (
            <span className="text-sm text-red-500 bg-red-100 px-2 py-1 rounded-full">
              ⚠ {Object.keys(validationErrors).length} xəta
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'visible', 'hidden'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSectionFilter(filter)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sectionFilter === filter
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter === 'all' ? 'Hamısı' : filter === 'visible' ? 'Görünər' : 'Gizli'}
              </button>
            ))}
          </div>

          {data.length > 0 && (
            <>
              <button
                onClick={validateAllSections}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Yoxla
              </button>
              <button
                onClick={exportSections}
                className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                İxrac Et
              </button>
            </>
          )}
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Yeni Bölmə
          </button>
        </div>
      </div>

      {/* Template Selection Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Bölmə Şablonu Seçin</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <input
                type="text"
                placeholder="Şablon axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => addSection(template)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </span>
                    <h4 className="font-medium text-gray-900">{template.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.examples.slice(0, 3).map((example, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {example}
                      </span>
                    ))}
                    {template.examples.length > 3 && (
                      <span className="text-xs text-gray-500">+{template.examples.length - 3}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t pt-6">
              <button
                onClick={() => addSection()}
                className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center group"
              >
                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">➕</span>
                <span className="font-medium text-gray-900 block mb-2">Boş Bölmə Yarat</span>
                <p className="text-sm text-gray-600">Sıfırdan özünüz dizayn edin</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center  mb-6">
            <span className="text-3xl">📝</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-3">Öz Bölmələrinizi Yaradın</h3>
          <p className="text-gray-600 mb-6 max-w-lg ">
            CV-nizə xüsusi bölmələr əlavə edin: hobbi, sertifikatlar, mükafatlar,
            fəaliyyət sahələri və digər məlumatları daxil edin
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-3 text-lg"
          >
            <span>🚀</span>
            İlk bölməni yaradın
          </button>
        </div>
      ) : (
        // Sections List
        <div className="space-y-6">
          {filteredSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className={`border rounded-xl p-6 bg-white shadow-sm transition-all ${
                validationErrors[section.id] 
                  ? 'border-red-300 bg-red-50' 
                  : section.isVisible === false
                  ? 'border-gray-200 bg-gray-50 opacity-75'
                  : 'border-gray-200 hover:shadow-md'
              }`}
            >
              {/* Validation Errors */}
              {validationErrors[section.id] && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center gap-2">
                    <span>⚠</span>
                    {validationErrors[section.id]}
                  </p>
                </div>
              )}

              {/* Section Header */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-medium text-green-700">#{sectionIndex + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.title || 'Yeni Bölmə'}
                      </h3>
                      {section.type !== 'simple' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {section.type}
                        </span>
                      )}
                    </div>

                    {/* Description - right after the title */}
                    {section.description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 px-3 py-2 rounded-lg border-l-2 border-green-300">
                          {stripHtmlTags(section.description)}
                        </p>
                      </div>
                    )}

                    {/* Element count */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">
                        {section.items?.length || 0} element
                      </span>
                      {section.isVisible === false && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Gizli
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveSection(section.id, 'up')}
                    disabled={data.indexOf(section) === 0}
                    className={`p-1 rounded transition-colors ${
                      data.indexOf(section) === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Yuxarı"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveSection(section.id, 'down')}
                    disabled={data.indexOf(section) === data.length - 1}
                    className={`p-1 rounded transition-colors ${
                      data.indexOf(section) === data.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title="Aşağı"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Edit and remove buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedSectionId(
                      expandedSectionId === section.id ? null : section.id
                    )}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedSectionId === section.id ? 'Bağlayın' : 'Redaktə edin'}
                  </button>
                  <button
                    onClick={() => removeSection(section.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    Silin
                  </button>
                </div>
              </div>

              {/* Section Content Preview (when collapsed) */}
              {expandedSectionId !== section.id && section.items && section.items.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {section.items.slice(0, 4).map((item) => (
                      <span
                        key={item.id}
                        className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                      >
                        {item.title}
                      </span>
                    ))}
                    {section.items.length > 4 && (
                      <span className="text-sm text-gray-500 px-3 py-1">
                        +{section.items.length - 4} daha...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Section Editing Interface */}
              {expandedSectionId === section.id && (
                <div className="space-y-6 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bölmə Başlığı <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        placeholder="Bölmə başlığını daxil edin..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          <span>Bölmə Növü</span>
                        </span>
                      </label>
                      <select
                        value={section.type || 'simple'}
                        onChange={(e) => updateSection(section.id, { type: e.target.value as any })}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em'
                        }}
                      >
                        <option value="simple">📝 Sadə Siyahı</option>
                        <option value="detailed">📋 Ətraflı Məlumat</option>
                        <option value="timeline">⏰ Tarix Xətti</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qısa Açıqlama
                    </label>
                    <textarea
                      value={section.description || ''}
                      onChange={(e) => updateSection(section.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      rows={2}
                      placeholder="Bu bölmə haqqında qısa açıqlama yazın..."
                    />
                  </div>

                  {/* Section Items Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-medium text-gray-900">Bölmə Elementləri</h4>
                      <button
                        onClick={() => addItemToSection(section.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <span>+</span>
                        Element Əlavə Edin
                      </button>
                    </div>

                    {(!section.items || section.items.length === 0) ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center  mb-3">
                          <span className="text-gray-400">📄</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-3">
                          Bu bölməyə hələ element əlavə edilməyib
                        </p>
                        <button
                          onClick={() => addItemToSection(section.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          İlk elementi əlavə edin
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                                  #{itemIndex + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {item.title || 'Yeni Element'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Move buttons for items */}
                                <button
                                  onClick={() => moveItem(section.id, item.id, 'up')}
                                  disabled={itemIndex === 0}
                                  className={`p-1 rounded transition-colors ${
                                    itemIndex === 0
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="Yuxarı"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => moveItem(section.id, item.id, 'down')}
                                  disabled={itemIndex === section.items.length - 1}
                                  className={`p-1 rounded transition-colors ${
                                    itemIndex === section.items.length - 1
                                      ? 'text-gray-300 cursor-not-allowed'
                                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="Aşağı"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => setExpandedItemId(
                                    expandedItemId === item.id ? null : item.id
                                  )}
                                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                                >
                                  {expandedItemId === item.id ? 'Bağlayın' : 'Redaktə edin'}
                                </button>
                                <button
                                  onClick={() => removeItem(section.id, item.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors text-sm"
                                >
                                  Silin
                                </button>
                              </div>
                            </div>

                            {/* Item Editing Fields */}
                            {expandedItemId === item.id && (
                              <div className="space-y-3 border-t pt-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Başlıq <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title || ''}
                                      onChange={(e) => updateItem(section.id, item.id, { title: e.target.value })}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                                      placeholder="Element başlığı..."
                                    />
                                  </div>

                                  {section.type === 'timeline' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tarix
                                      </label>
                                      <input
                                        type="text"
                                        value={item.date || ''}
                                        onChange={(e) => updateItem(section.id, item.id, { date: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="Məs: 2023, Yanvar 2023"
                                      />
                                    </div>
                                  )}

                                  {section.type === 'detailed' && (
                                    <>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          Yer/Təşkilat
                                        </label>
                                        <input
                                          type="text"
                                          value={item.location || ''}
                                          onChange={(e) => updateItem(section.id, item.id, { location: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                                          placeholder="Məkan, təşkilat..."
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                          URL/Link
                                        </label>
                                        <input
                                          type="url"
                                          value={item.url || ''}
                                          onChange={(e) => updateItem(section.id, item.id, { url: e.target.value })}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                                          placeholder="https://..."
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Açıqlama
                                  </label>
                                  <textarea
                                    value={item.description || ''}
                                    onChange={(e) => updateItem(section.id, item.id, { description: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none"
                                    rows={3}
                                    placeholder="Element haqqında ətrafl�� məlumat yazın..."
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
