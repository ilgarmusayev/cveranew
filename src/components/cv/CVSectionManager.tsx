'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SectionConfig {
    id: string;
    name: string;
    displayName: string;
    isVisible: boolean;
    order: number;
    hasData: boolean;
    icon: string;
}

interface SectionManagerProps {
    cvData: any;
    onSectionOrderChange: (sections: SectionConfig[]) => void;
    language?: string;
}

const DEFAULT_SECTIONS = [
    { id: 'personalInfo', name: 'personalInfo', displayName: 'Şəxsi Məlumatlar', icon: '👤', alwaysVisible: true },
    { id: 'summary', name: 'summary', displayName: 'Özət', icon: '📝', alwaysVisible: false },
    { id: 'experience', name: 'experience', displayName: 'İş Təcrübəsi', icon: '💼', alwaysVisible: false },
    { id: 'education', name: 'education', displayName: 'Təhsil', icon: '🎓', alwaysVisible: false },
    { id: 'skills', name: 'skills', displayName: 'Bacarıqlar', icon: '⚡', alwaysVisible: false },
    { id: 'projects', name: 'projects', displayName: 'Layihələr', icon: '🚀', alwaysVisible: false },
    { id: 'certifications', name: 'certifications', displayName: 'Sertifikatlar', icon: '🏆', alwaysVisible: false },
    { id: 'languages', name: 'languages', displayName: 'Dillər', icon: '🌍', alwaysVisible: false },
    { id: 'volunteerExperience', name: 'volunteerExperience', displayName: 'Könüllü İş', icon: '❤️', alwaysVisible: false }
];

export default function CVSectionManager({ cvData, onSectionOrderChange, language = 'az' }: SectionManagerProps) {
    const [sections, setSections] = useState<SectionConfig[]>([]);
    const [draggedItem, setDraggedItem] = useState<number | null>(null);
    const [dragOverItem, setDragOverItem] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Hydration fix for SSR
    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if section has data
    const hasData = (sectionId: string): boolean => {
        if (sectionId === 'personalInfo') return true;
        if (sectionId === 'summary') return !!cvData?.personalInfo?.summary;

        const sectionData = cvData?.[sectionId];
        if (Array.isArray(sectionData)) {
            return sectionData.length > 0;
        }
        return !!sectionData;
    };

    // Initialize sections from CV data
    useEffect(() => {
        if (!mounted) return;

        const currentSectionOrder = cvData?.sectionOrder || [];

        const initializedSections = DEFAULT_SECTIONS.map((defaultSection, index) => {
            const existingConfig = currentSectionOrder.find((s: any) => s.id === defaultSection.id);

            return {
                id: defaultSection.id,
                name: defaultSection.name,
                displayName: defaultSection.displayName,
                isVisible: existingConfig?.isVisible ?? (hasData(defaultSection.id) || defaultSection.alwaysVisible),
                order: existingConfig?.order ?? index,
                hasData: hasData(defaultSection.id),
                icon: defaultSection.icon
            };
        });

        initializedSections.sort((a, b) => a.order - b.order);
        setSections(initializedSections);
    }, [cvData, mounted]);

    // Professional drag and drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        setDraggedItem(index);
        setIsDragging(true);
        dragCounter.current = 0;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', '');

        // Professional drag image
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const dragImage = target.cloneNode(true) as HTMLElement;
        dragImage.style.transform = 'rotate(3deg) scale(1.05)';
        dragImage.style.opacity = '0.9';
        dragImage.style.boxShadow = '0 25px 50px rgba(0,0,0,0.25)';
        dragImage.style.borderRadius = '12px';
        dragImage.style.border = '2px solid #3B82F6';
        dragImage.style.background = 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, rect.width / 2, rect.height / 2);

        setTimeout(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.stopPropagation();
        setIsDragging(false);

        if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
            const newSections = [...sections];
            const draggedSection = newSections[draggedItem];

            newSections.splice(draggedItem, 1);
            newSections.splice(dragOverItem, 0, draggedSection);

            const updatedSections = newSections.map((section, index) => ({
                ...section,
                order: index
            }));

            setSections(updatedSections);
            onSectionOrderChange(updatedSections);
        }

        setDraggedItem(null);
        setDragOverItem(null);
        dragCounter.current = 0;
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (draggedItem !== null && draggedItem !== index) {
            setDragOverItem(index);
        }
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;

        if (draggedItem !== null && draggedItem !== index) {
            setDragOverItem(index);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;

        if (dragCounter.current === 0) {
            setDragOverItem(null);
        }
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setDragOverItem(null);
    };

    const toggleSectionVisibility = (sectionId: string) => {
        const updatedSections = sections.map(section =>
            section.id === sectionId
                ? { ...section, isVisible: !section.isVisible }
                : section
        );

        setSections(updatedSections);
        onSectionOrderChange(updatedSections);
    };

    if (!mounted) {
        return (
            <div className="w-full animate-pulse">
                <div className="space-y-3 p-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-gray-200 rounded-xl h-20"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full relative bg-gray-900"
            style={{
                position: 'relative',
                zIndex: 10,
                isolation: 'isolate'
            }}
        >
            {/* Header with better positioning */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-b border-gray-700 p-4 mb-4 rounded-t-xl" style={{ zIndex: 20 }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                            ⚡
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Bölmə Sıralaması</h3>
                            <p className="text-sm text-gray-300">Bölmələri sürükləyərək yenidən sıralayın</p>
                        </div>
                    </div>
                    {isDragging && (
                        <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4h2v2H4V4zm0 5h2v2H4V9zm0 5h2v2H4v-2zm5-10h2v2H9V4zm0 5h2v2H9V9zm0 5h2v2H9v-2zm5-10h2v2h-2V4zm0 5h2v2h-2V9zm0 5h2v2h-2v-2z"/>
                            </svg>
                            <span className="text-sm font-medium">Sürüklənir...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable content area */}
            <div
                className="space-y-3 px-4 pb-4 max-h-[70vh] overflow-y-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 #F1F5F9'
                }}
            >
                {sections.map((section, index) => (
                    <div
                        key={section.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`border-2 rounded-xl p-4 transition-all duration-300 select-none ${
                            draggedItem === index
                                ? 'opacity-50 transform scale-110 shadow-2xl z-50 border-blue-400 bg-gray-700'
                                : 'shadow-lg border-gray-600 hover:shadow-xl hover:border-blue-400 hover:scale-[1.02] cursor-grab active:cursor-grabbing bg-gray-800'
                        } ${
                            dragOverItem === index && draggedItem !== index
                                ? 'border-2 border-dashed border-green-400 bg-gray-700 transform scale-105 shadow-lg'
                                : ''
                        } ${
                            !section.isVisible ? 'opacity-60 bg-gray-800' : ''
                        }`}
                        style={{
                            position: 'relative',
                            userSelect: 'none',
                            WebkitUserSelect: 'none',
                            touchAction: 'none',
                            zIndex: draggedItem === index ? 1000 : 1
                        }}
                    >
                        {/* Drop indicator */}
                        {dragOverItem === index && draggedItem !== index && (
                            <div className="absolute inset-0 border-2 border-dashed border-green-400 rounded-xl bg-green-50 bg-opacity-50 flex items-center justify-center pointer-events-none">
                                <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
                                    🎯 Buraya bırakın
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                {/* Professional drag handle */}
                                <div className="flex items-center space-x-3 flex-shrink-0 group">
                                    <div className="w-8 h-12 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-all shadow-md group-hover:shadow-lg"
                                         style={{
                                             background: '#0d2438',
                                             color: 'white'
                                         }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.background = '#1e3a52';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.background = '#0d2438';
                                         }}>
                                        <svg className="w-4 h-4 text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M4 4h2v2H4V4zm0 5h2v2H4V9zm0 5h2v2H4v-2zm5-10h2v2H9V4zm0 5h2v2H9V9zm0 5h2v2H9v-2zm5-10h2v2h-2V4zm0 5h2v2h-2V9zm0 5h2v2h-2v-2z"/>
                                        </svg>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg transform group-hover:scale-110 transition-transform">
                                        {section.icon}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center shadow-lg">
                                        {section.order + 1}
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-lg truncate mb-1">
                                        {section.displayName}
                                    </div>
                                    <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        section.hasData
                            ? 'bg-green-900 text-green-200 border border-green-600 shadow-sm'
                            : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {section.hasData ? '✅ Məlumat var' : '⭕ Boş'}
                    </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                                            section.isVisible
                                                ? 'bg-blue-900 text-blue-200 border border-blue-600 shadow-sm'
                                                : 'bg-red-900 text-red-200 border border-red-600'
                                        }`}>
                      {section.isVisible ? '👁️ Görünür' : '🚫 Gizli'}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 flex-shrink-0">
                                {section.id !== 'personalInfo' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            toggleSectionVisibility(section.id);
                                        }}
                                        className={`px-4 py-2 text-sm rounded-xl transition-all font-semibold border-2 transform hover:scale-105 active:scale-95 shadow-md ${
                                            section.isVisible
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border-red-300 hover:border-red-400 hover:shadow-lg'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200 border-green-300 hover:border-green-400 hover:shadow-lg'
                                        }`}
                                    >
                                        {section.isVisible ? '🚫 Gizlə' : '✅ Göstər'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enhanced help section */}
            <div className="mt-4 mx-4 p-4 bg-gradient-to-r from-gray-800 to-gray-700 border-2 border-gray-600 rounded-xl">
                <div className="text-sm text-gray-300">
                    <div className="flex items-center gap-2 font-bold mb-3 text-blue-400">
                        <span className="text-lg">💡</span>
                        <span>{language === 'en' ? 'How to use:' : 'Necə istifadə edilir:'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-start gap-2">
                            <span className="text-blue-400 text-base">🖱️</span>
                            <span><strong>{language === 'en' ? 'Dragging:' : 'Sürükləmə:'}</strong> {language === 'en' ? 'Hold left handle and drag' : 'Sol handleni tutub sürükləyin'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-400 text-base">👁️</span>
                            <span><strong>{language === 'en' ? 'Visibility:' : 'Görünürlük:'}</strong> {language === 'en' ? 'Show/Hide buttons' : 'Göstər/Gizlə düymələri'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-purple-400 text-base">🎯</span>
                            <span><strong>{language === 'en' ? 'Positioning:' : 'Yerləşdirmə:'}</strong> {language === 'en' ? 'Drop in green area' : 'Yaşıl sahəyə bırakın'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-orange-400 text-base">📱</span>
                            <span><strong>{language === 'en' ? 'Mobile:' : 'Mobil:'}</strong> {language === 'en' ? 'Touch and drag' : 'Toxunaraq sürükləyin'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}