'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SectionStyle {
  width: number;
  height: number;
  fontSize: number;
  padding: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily: string;
  lineHeight: number;
  letterSpacing: number;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

interface CVSection {
  id: string;
  type: string;
  title: string;
  content: any;
  style: SectionStyle;
  order: number;
  isVisible: boolean;
}

interface NativeSectionEditorProps {
  sections: CVSection[];
  onSectionsChange: (sections: CVSection[]) => void;
  gridSize?: number;
  minSectionWidth?: number;
  minSectionHeight?: number;
  maxSectionWidth?: number;
  maxSectionHeight?: number;
}

const DEFAULT_STYLE: SectionStyle = {
  width: 100,
  height: 200,
  fontSize: 14,
  padding: 16,
  fontWeight: 'normal',
  fontFamily: 'Inter, system-ui, sans-serif',
  lineHeight: 1.5,
  letterSpacing: 0,
  backgroundColor: '#ffffff',
  textColor: '#374151',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e5e7eb'
};

export default function NativeSectionEditor({
  sections,
  onSectionsChange,
  gridSize = 8,
  minSectionWidth = 200,
  minSectionHeight = 100,
  maxSectionWidth = 800,
  maxSectionHeight = 600
}: NativeSectionEditorProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced drag start with better visual feedback
  const handleDragStart = useCallback((e: React.DragEvent, sectionId: string) => {
    console.log('🚀 Drag başladı:', sectionId);
    setDraggedSection(sectionId);
    setIsReordering(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);

    // Daha sadə drag image - əvvəlki mürəkkəb kod problemə səbəb ola bilər
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';

    console.log('✅ Drag məlumatları təyin edildi');
  }, []);

  // Enhanced drag over with better drop zone detection
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Enhanced drag enter
  const handleDragEnter = useCallback((e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 Drag enter:', sectionId, 'dragged:', draggedSection);
    if (draggedSection && draggedSection !== sectionId) {
      setDragOverSection(sectionId);
    }
  }, [draggedSection]);

  // Enhanced drop with immediate state update
  const handleDrop = useCallback((e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎪 Drop hadisəsi:', { draggedSection, targetSectionId });

    if (!draggedSection || draggedSection === targetSectionId) {
      console.log('❌ Drop ləğv edildi: eyni bölmə və ya boş drag');
      setDraggedSection(null);
      setDragOverSection(null);
      setIsReordering(false);
      return;
    }

    const draggedIndex = sections.findIndex(s => s.id === draggedSection);
    const targetIndex = sections.findIndex(s => s.id === targetSectionId);

    console.log('📊 İndekslər:', { draggedIndex, targetIndex, sectionsLength: sections.length });

    if (draggedIndex === -1 || targetIndex === -1) {
      console.error('❌ Bölmə tapılmadı');
      setDraggedSection(null);
      setDragOverSection(null);
      setIsReordering(false);
      return;
    }

    // CRITICAL FIX: Create new array and update order immediately
    const newSections = [...sections];
    const [draggedItem] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, draggedItem);

    // Update order property for all sections
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      order: index
    }));

    console.log('✅ Yeni sıralama yaradıldı:', updatedSections.map(s => ({ id: s.id, order: s.order })));

    // IMMEDIATE: Clear drag states first
    setDraggedSection(null);
    setDragOverSection(null);

    // IMMEDIATE: Call parent callback to update state immediately
    onSectionsChange(updatedSections);

    // DELAYED: Handle save and cleanup after UI updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsReordering(false);
      // Save to localStorage as backup
      localStorage.setItem('native_section_order', JSON.stringify(updatedSections));
      console.log('✅ Native section order saxlanıldı localStorage-da');
    }, 100);

  }, [draggedSection, sections, onSectionsChange]);

  // Enhanced drag end with proper cleanup
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    console.log('🏁 Drag bitdi');
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';

    setDraggedSection(null);
    setDragOverSection(null);
    if (!timeoutRef.current) {
      setIsReordering(false);
    }
  }, []);

  // Enhanced drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSection(null);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('native_section_order');
    if (savedOrder && sections.length === 0) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
          onSectionsChange(parsedOrder);
        }
      } catch (error) {
        console.warn('Native section order yüklənə bilmədi:', error);
      }
    }
  }, [sections.length, onSectionsChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update section style property
  const updateSectionStyle = useCallback((sectionId: string, property: keyof SectionStyle, value: any) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            style: {
              ...section.style,
              [property]: value
            }
          }
        : section
    );

    onSectionsChange(updatedSections);
  }, [sections, onSectionsChange]);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId: string) => {
    const updatedSections = sections.map(section =>
      section.id === sectionId
        ? { ...section, isVisible: !section.isVisible }
        : section
    );

    onSectionsChange(updatedSections);
  }, [sections, onSectionsChange]);

  // Render style panel
  const renderStylePanel = () => {
    if (!selectedSection) return null;

    const section = sections.find(s => s.id === selectedSection);
    if (!section) return null;

    return (
      <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Style Panel</h3>
          <button
            onClick={() => setShowStylePanel(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close style panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section: {section.title}</label>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
            <input
              type="range"
              min="8"
              max="24"
              value={section.style.fontSize}
              onChange={(e) => updateSectionStyle(section.id, 'fontSize', Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8px</span>
              <span>{section.style.fontSize}px</span>
              <span>24px</span>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={section.style.textColor}
                onChange={(e) => updateSectionStyle(section.id, 'textColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
              <input
                type="color"
                value={section.style.backgroundColor}
                onChange={(e) => updateSectionStyle(section.id, 'backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Visible</label>
            <button
              onClick={() => toggleSectionVisibility(section.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                section.isVisible ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-label={`Toggle ${section.title} visibility`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  section.isVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full bg-gray-50 p-4">
      {/* Reordering indicator */}
      {isReordering && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Bölmələr yeniden təşkil edilir...
        </div>
      )}

      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${gridSize}px ${gridSize}px`
        }}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Visual Section Editor</h2>
          <span className="text-sm text-gray-500">
            {sections.filter(s => s.isVisible).length} of {sections.length} sections visible
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showStylePanel
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Style Panel
          </button>

          <div className="text-xs text-gray-500">
            Grid: {gridSize}px
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <div className="space-y-4 min-h-96">
        {sections.map((section) => {
          const isDragged = draggedSection === section.id;
          const isDragOver = dragOverSection === section.id && draggedSection !== section.id;

          return (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, section.id)}
              onDrop={(e) => handleDrop(e, section.id)}
              onDragEnd={handleDragEnd}
              onDragLeave={handleDragLeave}
              className={`relative group transition-all duration-200 ${
                isDragged ? 'opacity-50 transform rotate-1 scale-105 z-20' : ''
              } ${!section.isVisible ? 'opacity-50' : ''} ${
                isDragOver ? 'transform translate-y-2 bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
              }`}
              style={{
                width: `${section.style.width}%`,
                minHeight: `${section.style.height}px`
              }}
              onClick={() => {
                setSelectedSection(section.id);
                setShowStylePanel(true);
              }}
            >
              {/* Section content */}
              <div
                className="w-full h-full relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-move"
                style={{
                  backgroundColor: section.style.backgroundColor,
                  color: section.style.textColor,
                  fontSize: `${section.style.fontSize}px`,
                  fontFamily: section.style.fontFamily,
                  fontWeight: section.style.fontWeight,
                  lineHeight: section.style.lineHeight,
                  letterSpacing: `${section.style.letterSpacing}px`,
                  padding: `${section.style.padding}px`,
                  borderRadius: `${section.style.borderRadius}px`,
                  borderWidth: `${section.style.borderWidth}px`,
                  borderColor: section.style.borderColor,
                  borderStyle: 'solid'
                }}
              >
                {/* Enhanced drag indicator */}
                <div className="absolute top-2 left-2 p-1 bg-gray-800 bg-opacity-75 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Section title and content */}
                <div className="h-full flex flex-col">
                  <h3 className="font-semibold mb-2 text-lg">{section.title}</h3>
                  <div className="flex-1 overflow-hidden">
                    {typeof section.content === 'string' ? (
                      <p className="text-sm leading-relaxed">{section.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {Array.isArray(section.content) ?
                          `${section.content.length} items` :
                          'Section content'
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Visibility indicator */}
                {!section.isVisible && (
                  <div className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded text-xs">
                    Hidden
                  </div>
                )}

                {/* Selection indicator */}
                {selectedSection === section.id && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none" />
                )}

                {/* Drop zone indicator */}
                {isDragOver && (
                  <div className="absolute inset-0 bg-blue-100 bg-opacity-75 border-2 border-blue-400 border-dashed rounded flex items-center justify-center">
                    <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-medium">
                      Buraya burax
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Style panel */}
      {showStylePanel && renderStylePanel()}

      {/* Enhanced instructions */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-600 max-w-xs">
        <div className="font-medium mb-2 text-gray-800">Necə istifadə etmək olar:</div>
        <div className="space-y-1">
          <div>• Bölmələri sürüyərək yeniden təşkil edin</div>
          <div>• Seçmək və stilləndirmək üçün klikləyin</div>
          <div>• Fərdiləşdirmək üçün stil panelindən istifadə edin</div>
          <div>• Dəyişikliklər avtomatik saxlanılır</div>
        </div>
      </div>
    </div>
  );
}
