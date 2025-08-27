'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CVData, PersonalInfo, Experience, Education, Skill, Language, Project, Certification, VolunteerExperience, CustomSection, CustomSectionItem } from '@/types/cv';
import '@/styles/cv-fonts.css';

interface CVPreviewProps {
    cv: {
        id?: string;
        templateId?: string;
        data: CVData;
    };
    template?: string;
    onSectionReorder?: (newOrder: string[]) => void;
    onUpdate?: (updatedCv: any) => void;
    fontSettings?: {
        fontFamily: string;
        nameSize: number;
        titleSize: number;
        headingSize: number;
        subheadingSize: number;
        bodySize: number;
        smallSize: number;
        headingWeight: number;
        subheadingWeight: number;
        bodyWeight: number;
        smallWeight: number;
        sectionSpacing: number;
    };
}

// Utility functions
const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    // Remove HTML tags and decode HTML entities
    return html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/&#39;/g, "'") // Replace &#39; with '
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim(); // Remove leading/trailing whitespace
};

// Function to render HTML content safely
const renderHtmlContent = (htmlContent: string) => {
    if (!htmlContent) return null;
    return (
        <div
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            className="prose prose-xs max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:mb-2 [&>h2]:mb-2 [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4"
        />
    );
};

const getFullName = (personalInfo: PersonalInfo): string => {
    if (personalInfo.fullName) return personalInfo.fullName;
    if (personalInfo.firstName && personalInfo.lastName) {
        return `${personalInfo.firstName} ${personalInfo.lastName}`;
    }
    return personalInfo.firstName || personalInfo.lastName || '';
};

// Language level translation based on CV language
const getLanguageLevel = (level: string, cvLanguage?: string): string => {
    const levelTranslations: Record<string, Record<string, string>> = {
        az: {
            Basic: 'Əsas',
            Conversational: 'Danışıq',
            Professional: 'Professional',
            Native: 'Ana dili'
        },
        en: {
            Basic: 'Basic',
            Conversational: 'Conversational',
            Professional: 'Professional',
            Native: 'Native'
        },
        tr: {
            Basic: 'Temel',
            Conversational: 'Konuşma',
            Professional: 'Profesyonel',
            Native: 'Ana Dil'
        }
    };

    const language = cvLanguage?.toLowerCase() || 'az';
    const languageKey = language.includes('en') ? 'en' :
                        language.includes('tr') ? 'tr' : 'az';

    return levelTranslations[languageKey]?.[level] || level;
};

// Date formatting based on CV language
const formatDate = (dateString: string, cvLanguage?: string): string => {
    if (!dateString) return '';

    const language = cvLanguage?.toLowerCase() || 'az';
    const isEnglish = language.includes('en');

    // Handle different date formats
    let formattedDate = dateString.trim();

    // Convert YYYY-MM format to proper display
    if (/^\d{4}-\d{2}$/.test(formattedDate)) {
        const [year, month] = formattedDate.split('-');
        const monthNum = parseInt(month);

        const monthNames = isEnglish ?
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] :
            ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];

        if (monthNum >= 1 && monthNum <= 12) {
            formattedDate = `${monthNames[monthNum - 1]} ${year}`;
        }
    }

    // Month name translations for existing formatted dates
    const monthTranslations: Record<string, Record<string, string>> = {
        az: {
            'Jan': 'Yan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Apr',
            'May': 'May', 'Jun': 'İyn', 'Jul': 'İyl', 'Aug': 'Avq',
            'Sep': 'Sen', 'Oct': 'Okt', 'Nov': 'Noy', 'Dec': 'Dek',
            'January': 'Yanvar', 'February': 'Fevral', 'March': 'Mart', 'April': 'Aprel',
            'June': 'İyun', 'July': 'İyul', 'August': 'Avqust', 'September': 'Sentyabr',
            'October': 'Oktyabr', 'November': 'Noyabr', 'December': 'Dekabr'
        },
        en: {
            'Yan': 'Jan', 'Fev': 'Feb', 'Mar': 'Mar', 'Apr': 'Apr',
            'May': 'May', 'Iyn': 'Jun', 'Iyl': 'Jul', 'Avq': 'Aug',
            'Sen': 'Sep', 'Okt': 'Oct', 'Noy': 'Nov', 'Dek': 'Dec',
            'Yanvar': 'January', 'Fevral': 'February', 'Mart': 'March', 'Aprel': 'April',
            'Iyun': 'June', 'Iyul': 'July', 'Avqust': 'August', 'Sentyabr': 'September',
            'Oktyabr': 'October', 'Noyabr': 'November', 'Dekabr': 'December'
        }
    };

    const languageKey = isEnglish ? 'en' : 'az';

    // Replace month names based on language
    if (monthTranslations[languageKey]) {
        Object.entries(monthTranslations[languageKey]).forEach(([original, translated]) => {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            formattedDate = formattedDate.replace(regex, translated);
        });
    }

    return formattedDate;
};

// Get "Current" text based on language
const getCurrentText = (cvLanguage?: string): string => {
    const language = cvLanguage?.toLowerCase() || 'az';

    if (language.includes('en')) {
        return 'Present';
    } else if (language.includes('tr')) {
        return 'Devam ediyor';
    } else {
        return 'Davam edir';
    }
};

// Dynamic section name mapping based on language
const getSectionName = (sectionKey: string, cvLanguage?: string, customSectionNames?: Record<string, string>): string => {
    // If custom section names exist (from translation), use them
    if (customSectionNames && customSectionNames[sectionKey]) {
        return customSectionNames[sectionKey];
    }

    // Default section names based on language
    const sectionNames: Record<string, Record<string, string>> = {
        az: {
            summary: 'Xülasə',
            professionalSummary: 'Peşəkar Xülasə',
            experience: 'İş Təcrübəsi',
            professionalExperience: 'Peşəkar Təcrübə',
            education: 'Təhsil',
            skills: 'Bacarıqlar',
            technicalSkills: 'Texniki Bacarıqlar',
            softSkills: 'Şəxsi Bacarıqlar',
            coreCompetencies: 'Əsas Bacarıqlar',
            languages: 'Dillər',
            projects: 'Layihələr',
            keyProjects: 'Əsas Layihələr',
            certifications: 'Sertifikatlar',
            volunteerExperience: 'Könüllü Təcrübə',
            volunteerWork: 'Könüllü İş'
        },
        en: {
            summary: 'Summary',
            professionalSummary: 'Professional Summary',
            experience: 'Work Experience',
            professionalExperience: 'Professional Experience',
            education: 'Education',
            skills: 'Skills',
            technicalSkills: 'Technical Skills',
            softSkills: 'Soft Skills',
            coreCompetencies: 'Core Competencies',
            languages: 'Languages',
            projects: 'Projects',
            keyProjects: 'Key Projects',
            certifications: 'Certifications',
            volunteerExperience: 'Volunteer Experience',
            volunteerWork: 'Volunteer Work'
        },
        tr: {
            summary: 'Özet',
            professionalSummary: 'Profesyonel Özet',
            experience: 'Is Deneyimi',
            professionalExperience: 'Profesyonel Deneyim',
            education: 'Eğitim',
            skills: 'Yetenekler',
            technicalSkills: 'Teknik Yetenekler',
            softSkills: 'Kişisel Yetenekler',
            coreCompetencies: 'Temel Yetkinlikler',
            languages: 'Diller',
            projects: 'Projeler',
            keyProjects: 'Anahtar Projeler',
            certifications: 'Sertifikalar',
            volunteerExperience: 'Gönüllü Deneyim',
            volunteerWork: 'Gönüllü Çalışma'
        }
    };

    // Determine language (default to Azerbaijani)
    const language = cvLanguage?.toLowerCase() || 'az';
    const languageKey = language.includes('en') ? 'en' :
                        language.includes('tr') ? 'tr' : 'az';

    return sectionNames[languageKey]?.[sectionKey] || sectionNames['az'][sectionKey] || sectionKey;
};

// Utility function to split content into A4 pages
const splitContentToPages = (sections: React.ReactNode[], pageHeightPx: number = 1122) => {
    const pages: React.ReactNode[][] = [];
    let currentPage: React.ReactNode[] = [];
    let currentHeight = 0;

    // Virtual height measurement for sections
    const measureHeight = (node: React.ReactNode): number => {
        if (!node) return 0;
        if (typeof node === 'string') return 40;
        if (Array.isArray(node)) return node.length * 180;

        // Estimate heights based on section type
        const nodeString = String(node);
        if (nodeString.includes('Xülasə') || nodeString.includes('Özet') || nodeString.includes('Summary')) return 120;
        if (nodeString.includes('İş Təcrübəsi') || nodeString.includes('Is Deneyimi') || nodeString.includes('Work Experience')) return 200;
        if (nodeString.includes('Təhsil') || nodeString.includes('Eğitim') || nodeString.includes('Education')) return 140;
        if (nodeString.includes('Bacarıqlar') || nodeString.includes('Yetenekler') || nodeString.includes('Skills')) return 100;
        if (nodeString.includes('Dillər') || nodeString.includes('Diller') || nodeString.includes('Languages')) return 80;
        if (nodeString.includes('Layihələr') || nodeString.includes('Projeler') || nodeString.includes('Projects')) return 120;
        if (nodeString.includes('Sertifikatlar') || nodeString.includes('Sertifikalar') || nodeString.includes('Certifications')) return 80;
        if (nodeString.includes('Könüllü') || nodeString.includes('Gönüllü') || nodeString.includes('Volunteer')) return 80;
        return 100;
    };

    for (const section of sections) {
        if (Array.isArray(section)) {
            for (const item of section) {
                const h = measureHeight(item);
                if (currentHeight + h > pageHeightPx && currentPage.length > 0) {
                    pages.push(currentPage);
                    currentPage = [item];
                    currentHeight = h;
                } else {
                    currentPage.push(item);
                    currentHeight += h;
                }
            }
            continue;
        }

        if (section && (section as any).props && Array.isArray((section as any).props.children)) {
            for (const child of (section as any).props.children) {
                const h = measureHeight(child);
                if (currentHeight + h > pageHeightPx && currentPage.length > 0) {
                    pages.push(currentPage);
                    currentPage = [child];
                    currentHeight = h;
                } else {
                    currentPage.push(child);
                    currentHeight += h;
                }
            }
            continue;
        }

        const h = measureHeight(section);
        if (currentHeight + h > pageHeightPx && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [section];
            currentHeight = h;
        } else {
            currentPage.push(section);
            currentHeight += h;
        }
    }

    if (currentPage.length > 0) pages.push(currentPage);
    return pages.length > 0 ? pages : [[<div key="empty">Məlumat yoxdur</div>]];
};

// Enhanced Responsive Item Component - Complete Rewrite
interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    showDragInstruction?: boolean;
    dragIconPosition?: 'left' | 'right';
    sectionOrder: string[];
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSetActiveSection?: (sectionId: string | null) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
    id, 
    children, 
    showDragInstruction = true, 
    dragIconPosition = 'left',
    sectionOrder,
    onSectionReorder,
    activeSection,
    onSetActiveSection
}) => {
    // State management for responsive behavior
    const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [isInteracting, setIsInteracting] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [lastTouchTime, setLastTouchTime] = useState(0);
    
    // Refs for touch tracking
    const touchStartPos = useRef({ x: 0, y: 0 });
    const interactionTimer = useRef<NodeJS.Timeout | null>(null);
    
    // Check if this section is currently selected
    const isActive = activeSection === id;
    
    // Enhanced device detection with better breakpoints
    useEffect(() => {
        const detectDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isPortrait = height > width;
            
            // Determine device type based on comprehensive criteria
            if (width < 768 || (hasTouch && width < 1024 && isPortrait)) {
                setDeviceType('mobile');
            } else if (width < 1024 || (hasTouch && width < 1280)) {
                setDeviceType('tablet');
            } else {
                setDeviceType('desktop');
            }
            
            console.log('Device detected:', {
                width,
                height,
                hasTouch,
                isPortrait,
                deviceType: width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
            });
        };
        
        detectDevice();
        
        // Listen for resize and orientation changes
        const handleResize = () => {
            clearTimeout(interactionTimer.current!);
            detectDevice();
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
            if (interactionTimer.current) clearTimeout(interactionTimer.current);
        };
    }, []);

    // Auto-deactivate section after inactivity (mobile/tablet only)
    useEffect(() => {
        if ((deviceType === 'mobile' || deviceType === 'tablet') && isActive && !isInteracting) {
            if (interactionTimer.current) clearTimeout(interactionTimer.current);
            
            const timeout = deviceType === 'mobile' ? 6000 : 8000; // Different timeouts for mobile vs tablet
            
            interactionTimer.current = setTimeout(() => {
                if (onSetActiveSection) {
                    onSetActiveSection(null);
                }
            }, timeout);
            
            return () => {
                if (interactionTimer.current) clearTimeout(interactionTimer.current);
            };
        }
        
        return () => {
            if (interactionTimer.current) clearTimeout(interactionTimer.current);
        };
    }, [isActive, isInteracting, deviceType, onSetActiveSection]);

    // DND Kit setup (for desktop only)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id,
        disabled: deviceType !== 'desktop' // Disable DND on mobile/tablet
    });

    const dndStyle: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 9999 : 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
    };

    // Get current section index and navigation state
    const currentIndex = sectionOrder.indexOf(id);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === sectionOrder.length - 1;

    // Enhanced section reordering function
    const reorderSection = (direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex < 0 || newIndex >= sectionOrder.length) return;
        
        setIsReordering(true);
        
        const newOrder = [...sectionOrder];
        [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
        
        onSectionReorder(newOrder);
        
        // Haptic feedback for supported devices
        if (navigator.vibrate) {
            navigator.vibrate(40);
        }
        
        console.log(`✅ Section moved ${direction}:`, { id, from: currentIndex, to: newIndex });
        
        // Reset reordering state
        setTimeout(() => setIsReordering(false), 300);
    };

    // Enhanced touch event handlers for mobile/tablet
    const handleTouchStart = (e: React.TouchEvent) => {
        if (deviceType === 'desktop') return;
        
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        setLastTouchTime(Date.now());
        setIsInteracting(true);
        
        // Clear any existing timers
        if (interactionTimer.current) {
            clearTimeout(interactionTimer.current);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (deviceType === 'desktop') return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
        
        // If significant movement detected, cancel interaction
        if (deltaX > 10 || deltaY > 10) {
            setIsInteracting(false);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (deviceType === 'desktop' || !onSetActiveSection) return;
        
        const touchDuration = Date.now() - lastTouchTime;
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
        
        // Only register as tap if it's quick and minimal movement
        const isTap = touchDuration < 400 && deltaX < 15 && deltaY < 15;
        
        if (isTap) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle active state
            onSetActiveSection(isActive ? null : id);
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            
            console.log('📱 Section tapped:', { id, wasActive: isActive, nowActive: !isActive });
        }
        
        setIsInteracting(false);
    };

    // Handle mouse click for desktop
    const handleClick = (e: React.MouseEvent) => {
        if (deviceType !== 'desktop' || !onSetActiveSection) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // On desktop, clicking toggles active state (for testing)
        onSetActiveSection(isActive ? null : id);
    };

    // Responsive styles based on device type
    const getContainerStyles = () => {
        const baseStyles = "relative transition-all duration-300 ease-out rounded-lg";
        
        switch (deviceType) {
            case 'mobile':
                return `${baseStyles} 
                    ${isActive ? 'bg-blue-50 border-2 border-blue-500 shadow-lg scale-[1.02] ring-2 ring-blue-200' : 'hover:bg-gray-50'} 
                    ${isReordering ? 'animate-pulse bg-green-50 border-green-400' : ''}
                    py-4 px-3 my-2 cursor-pointer touch-manipulation
                    min-h-[70px]`;
                    
            case 'tablet':
                return `${baseStyles}
                    ${isActive ? 'bg-blue-50 border-2 border-blue-500 shadow-xl scale-[1.03] ring-2 ring-blue-200' : 'hover:bg-gray-50'} 
                    ${isReordering ? 'animate-pulse bg-green-50 border-green-400' : ''}
                    py-5 px-4 my-3 cursor-pointer touch-manipulation
                    min-h-[80px]`;
                    
            case 'desktop':
                return `${baseStyles}
                    ${isDragging ? 'shadow-2xl border-2 border-blue-500 bg-blue-50 scale-105 rotate-1 z-[9999]' : 'hover:shadow-lg hover:border-2 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.01]'}
                    ${isActive ? 'bg-blue-50 border-2 border-blue-500 shadow-lg' : ''}
                    py-3 px-2 my-1 cursor-grab active:cursor-grabbing
                    group`;
                    
            default:
                return baseStyles;
        }
    };

    return (
        <div
            ref={setNodeRef}
            {...(deviceType === 'desktop' ? { ...attributes, ...listeners } : {})}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={getContainerStyles()}
            title={deviceType === 'desktop' ? "Sürükləyərək yerdəyişmə edin" : "Seçmək üçün toxunun"}
            style={{
                ...dndStyle,
                touchAction: deviceType === 'desktop' ? 'none' : 'pan-y',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                position: 'relative',
                overflow: 'visible'
            }}
        >
            {/* Mobile/Tablet Controls - Modern floating buttons */}
            {(deviceType === 'mobile' || deviceType === 'tablet') && isActive && (
                <div className="absolute -left-14 sm:-left-16 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-[99999]">
                    {/* Up Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            reorderSection('up');
                        }}
                        disabled={isFirst}
                        className={`
                            w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                            text-white font-bold shadow-lg transition-all duration-200
                            ${isFirst 
                                ? 'bg-gray-400 opacity-50 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:scale-110 hover:shadow-xl'
                            }
                            border-2 border-white ring-2 ring-blue-200
                        `}
                        style={{ 
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        <span className="text-lg leading-none">↑</span>
                    </button>
                    
                    {/* Down Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            reorderSection('down');
                        }}
                        disabled={isLast}
                        className={`
                            w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                            text-white font-bold shadow-lg transition-all duration-200
                            ${isLast 
                                ? 'bg-gray-400 opacity-50 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:scale-110 hover:shadow-xl'
                            }
                            border-2 border-white ring-2 ring-blue-200
                        `}
                        style={{ 
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        <span className="text-lg leading-none">↓</span>
                    </button>
                </div>
            )}

            {/* Active indicator for mobile/tablet */}
            {(deviceType === 'mobile' || deviceType === 'tablet') && isActive && (
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-[99998]">
                    <div className="w-5 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-l-lg shadow-lg animate-pulse"></div>
                </div>
            )}

            {/* Desktop drag handle */}
            {deviceType === 'desktop' && (
                <div className={`absolute ${dragIconPosition === 'right' ? '-right-3' : '-left-3'} top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200`}>
                    <div className="bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-xl hover:bg-blue-700 transition-colors border-2 border-white">
                        <span className="text-xs">⋮⋮</span>
                    </div>
                </div>
            )}

            {/* Desktop hover instruction */}
            {deviceType === 'desktop' && showDragInstruction && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg z-[99999]">
                    Sürükləyərək yerdəyişmə edin
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                </div>
            )}

            {/* Content wrapper */}
            <div className={`${deviceType === 'desktop' && isDragging ? 'pointer-events-none' : ''}`}>
                {children}
            </div>
        </div>
    );
};

// Basic Template Component with DND Kit
const BasicTemplate: React.FC<{
    data: CVData;
    sectionOrder: string[];
    onSectionReorder: (newOrder: string[]) => void;
    cv: any;
    onUpdate?: (updatedCv: any) => void;
    activeSection?: string | null;
    setActiveSection?: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ data, sectionOrder, onSectionReorder, cv, onUpdate, activeSection, setActiveSection }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum 8px movement to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Slightly longer delay for mobile to prevent accidental drags
                tolerance: 15, // More tolerance for better touch experience
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setIsDragActive(true);
        setActiveId(event.active.id as string);
        console.log('=== DRAG STARTED ===');
        console.log('Device type:', 'ontouchstart' in window ? 'Touch Device' : 'Mouse Device');
        console.log('Active element:', event.active.id);
        // Add subtle body class for global styling if needed
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragActive(false);
        setActiveId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== DRAG ENDED WITH DND KIT ===');
        console.log('Active:', active.id);
        console.log('Over:', over?.id);

        if (over && active.id !== over.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over.id as string);

            console.log('Old index:', oldIndex, 'New index:', newIndex);

            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            console.log('New order:', newOrder);

            onSectionReorder(newOrder);
        }
    };

    // Section render functions
    const renderSection = (sectionType: string) => {
        console.log('Rendering section:', sectionType, 'data available:', {
            experience: experience.length,
            education: education.length,
            skills: skills.length,
            summary: !!personalInfo.summary
        });

        switch (sectionType) {
            case 'summary':
                return personalInfo.summary ? (
                    <div className="mb-4 cv-section">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="text-gray-700 leading-relaxed text-xs">
                            {renderHtmlContent(personalInfo.summary)}
                        </div>
                    </div>
                ) : null;

            case 'experience':
                console.log('Experience data in renderSection:', experience);
                return experience && experience.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {experience.map((exp) => (
                                <div key={exp.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{exp.position}</h3>
                                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                            {formatDate(exp.startDate || '', data.cvLanguage)} - {exp.current ? getCurrentText(data.cvLanguage) : formatDate(exp.endDate || '', data.cvLanguage)}
                                        </span>
                                    </div>
                                    <p className="text-blue-600 font-medium text-xs">{exp.company}</p>
                                    {exp.description && (
                                        <div className="text-gray-700 text-xs mt-1 leading-relaxed">
                                            {renderHtmlContent(exp.description)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'education':
                return education && education.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('education', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {education.map((edu) => (
                                <div key={edu.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {edu.degree && <h3 className="font-semibold text-gray-900 text-sm">{edu.degree}</h3>}
                                            <p className="text-blue-600 font-medium text-xs">{edu.institution}</p>
                                            {(edu.field || edu.gpa) && (
                                                <p className="text-gray-600 text-xs">
                                                    {[edu.field, edu.gpa && `${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}`].filter(Boolean).join(' - ')}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                            {formatDate(edu.startDate || '', data.cvLanguage)} - {edu.current ? getCurrentText(data.cvLanguage) : formatDate(edu.endDate || '', data.cvLanguage)}
                                        </span>
                                    </div>
                                    {edu.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(edu.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'skills':
                return skills && skills.length > 0 ? (
                    <div className="mb-4">
                        {/* Hard Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'hard').map((skill) => (
                                        <div key={skill.id} className="border-l-2 border-blue-200 pl-2">
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'soft').map((skill) => (
                                        <div key={skill.id} className="border-l-2 border-blue-200 pl-2">
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* General Skills */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill) => (
                                        <div key={skill.id} className="border-l-2 border-blue-200 pl-2">
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null;

            case 'languages':
                return languages && languages.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className={languages.length <= 2 ? "space-y-1" : "grid grid-cols-4 gap-x-2 gap-y-1"}>
                            {languages.map((lang) => (
                                <div key={lang.id} className="text-xs text-gray-700 break-words">
                                    {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'projects':
                return projects && projects.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {projects.map((project) => (
                                <div key={project.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        {project.url ? (
                                            <a
                                                href={project.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-semibold text-gray-900 text-sm underline hover:text-blue-600 transition-colors cursor-pointer"
                                            >
                                                {project.name}
                                            </a>
                                        ) : (
                                            <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                                        )}
                                        {(project.startDate || project.endDate || project.current) && (
                                            <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                                {project.current ? (
                                                    project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : getCurrentText(data.cvLanguage)
                                                ) : project.startDate && project.endDate ? (
                                                    `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate(project.startDate || project.endDate || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {project.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(project.description)}</div>
                                    )}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <p className="text-blue-600 text-xs mt-1">{data.cvLanguage === 'azerbaijani' ? 'Texnologiyalar' : 'Technologies'}: {project.technologies.join(', ')}</p>
                                    )}
                                    {project.github && (
                                        <p className="text-gray-600 text-xs mt-1">GitHub: {project.github}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'certifications':
                return certifications && certifications.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert) => (
                                <div key={cert.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-gray-900 text-sm underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                                            )}
                                            <p className="text-blue-600 font-medium text-xs">{cert.issuer}</p>
                                        </div>
                                        {cert.date && (
                                            <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                                {formatDate(cert.date, data.cvLanguage)}
                                            </span>
                                        )}
                                    </div>
                                    {cert.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(cert.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'volunteer':
                return volunteerExperience && volunteerExperience.length > 0 ? (
                    <div className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {volunteerExperience.map((vol) => (
                                <div key={vol.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{vol.role}</h3>
                                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                            {formatDate(vol.startDate || '', data.cvLanguage)} - {vol.current ? getCurrentText(data.cvLanguage) : formatDate(vol.endDate || '', data.cvLanguage)}
                                        </span>
                                    </div>
                                    <p className="text-blue-600 font-medium text-xs">{vol.organization}</p>
                                    {vol.description && (
                                        <div className="text-gray-700 text-xs mt-1 leading-relaxed">
                                            {renderHtmlContent(vol.description)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'customSections':
                return customSections && customSections.length > 0 ? (
                    <div className="mb-4">
                        {customSections.map((section) => (
                            <div key={section.id} className="mb-4">
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {section.title}
                                </h2>
                                <div className="space-y-2">
                                    {section.items.map((item) => (
                                        <div key={item.id} className="border-l-2 border-blue-200 pl-3">
                                            <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                                            {item.subtitle && (
                                                <p className="text-blue-600 font-medium text-xs">{item.subtitle}</p>
                                            )}
                                            {item.description && (
                                                <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(item.description)}</div>
                                            )}
                                            {item.technologies && item.technologies.length > 0 && (
                                                <p className="text-blue-600 text-xs mt-1">
                                                    {data.cvLanguage === 'azerbaijani' ? 'Texnologiyalar' : 'Technologies'}: {item.technologies.join(', ')}
                                                </p>
                                            )}
                                            {item.url && (
                                                <p className="text-gray-600 text-xs mt-1">URL: {item.url}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div
            className={`
                w-full h-full bg-white text-gray-900 font-sans
                ${isDragActive ? 'drag-mode' : ''}
            `}
            style={{
                padding: '15mm 12mm'
            }}
        >


            {/* Header */}
            <div className="mb-4 border-b-2 border-blue-600 pb-3 cv-section avoid-break">
                <div className="flex items-start gap-4">
                    {/* Profile Image */}
                    {personalInfo.profileImage && (
                        <div className="flex-shrink-0">
                            <img
                                src={personalInfo.profileImage}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover border-2 border-blue-600"
                            />
                        </div>
                    )}

                    {/* Name and Contact Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-blue-600 mb-2">
                            {getFullName(personalInfo)}
                        </h1>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            {personalInfo.email && (
                                <span className="flex items-center gap-1">
                                    📧 {personalInfo.email}
                                </span>
                            )}
                            {personalInfo.phone && (
                                <span className="flex items-center gap-1">
                                    📱 {personalInfo.phone}
                                </span>
                            )}
                            {personalInfo.location && (
                                <span className="flex items-center gap-1">
                                    📍 {personalInfo.location}
                                </span>
                            )}
                            {personalInfo.linkedin && (
                                <span className="flex items-center gap-1">
                                    🔗 {personalInfo.linkedin}
                                </span>
                            )}
                            {personalInfo.website && (
                                <span className="flex items-center gap-1">
                                    🌐 {personalInfo.website}
                                </span>
                            )}
                            {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                                personalInfo.additionalLinks.map((link) => (
                                    <span key={link.id} className="flex items-center gap-1">
                                        📎 {link.label}: {link.value}
                                    </span>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Draggable Sections */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sectionOrder}
                    strategy={verticalListSortingStrategy}
                >
                    <div 
                        className={`transition-all duration-300 ${isDragActive ? 'opacity-95 bg-gradient-to-br from-transparent via-blue-50/30 to-transparent' : ''}`}
                        style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--cv-section-spacing, 16px)'
                        }}
                    >
                        {sectionOrder.map((sectionType) => {
                            const sectionContent = renderSection(sectionType);
                            if (!sectionContent) return null;

                            return (
                                <SortableItem 
                                    key={sectionType} 
                                    id={sectionType}
                                    showDragInstruction={!isMobile}
                                    dragIconPosition="left"
                                    sectionOrder={sectionOrder}
                                    onSectionReorder={onSectionReorder}
                                    activeSection={activeSection}
                                    onSetActiveSection={setActiveSection}
                                >
                                    {sectionContent}
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

// Modern Template Component with Drag and Drop
const ModernTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    setActiveSection?: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, setActiveSection }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Enhanced mobile device detection for ModernTemplate
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isPortrait = height > width;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Comprehensive mobile/tablet detection
            const isMobileDevice = width < 1024 || (isTouchDevice && width < 1200) || 
                                 (isPortrait && width < 768);
            
            setIsMobile(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Reduced delay for better mobile experience
                tolerance: 12, // Increased tolerance for touch precision
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setIsDragActive(true);
        setActiveId(event.active.id as string);
        console.log('=== MODERN TEMPLATE DRAG STARTED ===');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragActive(false);
        setActiveId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== MODERN TEMPLATE DRAG ENDED ===');
        console.log('Active:', active.id);
        console.log('Over:', over?.id);

        if (over && active.id !== over.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over.id as string);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
                onSectionReorder(newOrder);
                console.log('✅ Modern template section reordered:', newOrder);
            }
        }
    };

    const renderModernSection = (sectionType: string) => {
        switch (sectionType) {
            case 'personalInfo':
                return (
                    <SortableItem 
                        key="personalInfo" 
                        id="personalInfo"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        {/* Personal Info */}
                        <div className="text-center pb-6 border-b-2 border-blue-500 mb-6">
                            {personalInfo.profileImage && (
                                <div className="mb-4">
                                    <img
                                        src={personalInfo.profileImage}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-blue-500"
                                    />
                                </div>
                            )}
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {personalInfo.firstName} {personalInfo.lastName}
                            </h1>
                            {(personalInfo as any).title && (
                                <p className="text-lg text-blue-600 font-medium mb-3">{(personalInfo as any).title}</p>
                            )}

                            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                                {personalInfo.email && (
                                    <span className="flex items-center">
                                        <span className="w-4 h-4 mr-1">📧</span>
                                        {personalInfo.email}
                                    </span>
                                )}
                                {personalInfo.phone && (
                                    <span className="flex items-center">
                                        <span className="w-4 h-4 mr-1">📱</span>
                                        {personalInfo.phone}
                                    </span>
                                )}
                                {personalInfo.location && (
                                    <span className="flex items-center">
                                        <span className="w-4 h-4 mr-1">📍</span>
                                        {personalInfo.location}
                                    </span>
                                )}
                                {personalInfo.website && (
                                    <span className="flex items-center">
                                        <span className="w-4 h-4 mr-1">🌐</span>
                                        {personalInfo.website}
                                    </span>
                                )}
                            </div>

                            {personalInfo.summary && (
                                <div className="mt-4 text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
                                    {renderHtmlContent(personalInfo.summary)}
                                </div>
                            )}
                        </div>
                    </SortableItem>
                );

            case 'experience':
                return experience.length > 0 ? (
                    <SortableItem 
                        key="experience" 
                        id="experience"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">💼</span>
                                {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-4">
                                {experience.map((exp) => (
                                    <div key={exp.id} className="border-l-4 border-blue-400 pl-4 bg-gray-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg">{exp.position}</h3>
                                                <p className="text-blue-600 font-medium">{exp.company}</p>
                                                {(exp as any).location && (
                                                    <p className="text-gray-600 text-sm">📍 {(exp as any).location}</p>
                                                )}
                                            </div>
                                            {(exp.startDate || exp.endDate) && (
                                                <div className="bg-blue-100 px-3 py-1 rounded-full text-sm text-blue-700 font-medium ml-4">
                                                    {exp.startDate && exp.endDate ? (
                                                        exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}`
                                                    ) : (
                                                        formatDate((exp.startDate || exp.endDate) || '', data.cvLanguage)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {exp.description && (
                                            <div className="text-gray-700 mt-2">{renderHtmlContent(exp.description)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'education':
                return education.length > 0 ? (
                    <SortableItem 
                        key="education" 
                        id="education"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🎓</span>
                                {getSectionName('education', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-4">
                                {education.map((edu) => (
                                    <div key={edu.id} className="border-l-4 border-green-400 pl-4 bg-green-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                {edu.degree && <h3 className="font-bold text-gray-900">{edu.degree}</h3>}
                                                <p className="text-green-600 font-medium">{edu.institution}</p>
                                                {(edu.field || edu.gpa) && (
                                                    <p className="text-gray-600 text-sm">
                                                        {[edu.field, edu.gpa && `${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}`].filter(Boolean).join(' - ')}
                                                    </p>
                                                )}
                                            </div>
                                            {(edu.startDate || edu.endDate) && (
                                                <div className="bg-green-100 px-3 py-1 rounded-full text-sm text-green-700 font-medium ml-4">
                                                    {edu.startDate && edu.endDate ? (
                                                        edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}`
                                                    ) : (
                                                        formatDate((edu.startDate || edu.endDate) || '', data.cvLanguage)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {edu.description && (
                                            <div className="text-gray-700 mt-2">{renderHtmlContent(edu.description)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'skills':
                return skills.length > 0 ? (
                    <SortableItem 
                        key="skills" 
                        id="skills"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🚀</span>
                                {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {skills.map((skill) => (
                                    <div key={skill.id} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-gray-900">{skill.name}</span>
                                            {skill.level && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                    {skill.level}
                                                </span>
                                            )}
                                        </div>
                                        {skill.description && (
                                            <p className="text-gray-600 text-sm">{skill.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'projects':
                return projects.length > 0 ? (
                    <SortableItem 
                        key="projects" 
                        id="projects"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🚀</span>
                                {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-4">
                                {projects.map((project) => (
                                    <div key={project.id} className="border-l-4 border-orange-400 pl-4 bg-orange-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{project.name}</h3>
                                                {project.description && (
                                                    <div className="text-gray-700 mt-1">{renderHtmlContent(project.description)}</div>
                                                )}
                                                {project.technologies && project.technologies.length > 0 && (
                                                    <div className="mt-2">
                                                        <div className="flex flex-wrap gap-1">
                                                            {project.technologies.map((tech, index) => (
                                                                <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {project.url && (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm hover:bg-orange-200 ml-4"
                                                >
                                                    🔗 Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'languages':
                return languages.length > 0 ? (
                    <SortableItem 
                        key="languages" 
                        id="languages"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🌍</span>
                                {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {languages.map((lang) => (
                                    <div key={lang.id} className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                                        <div className="font-medium text-gray-900">{lang.language}</div>
                                        <div className="text-red-600 text-sm">{lang.level}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'certifications':
                return certifications.length > 0 ? (
                    <SortableItem 
                        key="certifications" 
                        id="certifications"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🏆</span>
                                {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-3">
                                {certifications.map((cert) => (
                                    <div key={cert.id} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{cert.name}</h3>
                                                {cert.issuer && (
                                                    <p className="text-yellow-600 text-sm">{cert.issuer}</p>
                                                )}
                                                {cert.description && (
                                                    <p className="text-gray-600 text-sm mt-1">{cert.description}</p>
                                                )}
                                            </div>
                                            {cert.date && (
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs ml-4">
                                                    {formatDate(cert.date, data.cvLanguage)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'volunteerExperience':
                return volunteerExperience.length > 0 ? (
                    <SortableItem 
                        key="volunteerExperience" 
                        id="volunteerExperience"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">❤️</span>
                                {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-4">
                                {volunteerExperience.map((vol) => (
                                    <div key={vol.id} className="border-l-4 border-pink-400 pl-4 bg-pink-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{vol.role}</h3>
                                                <p className="text-pink-600 font-medium">{vol.organization}</p>
                                            </div>
                                            {(vol.startDate || vol.endDate) && (
                                                <div className="bg-pink-100 px-3 py-1 rounded-full text-sm text-pink-700 font-medium ml-4">
                                                    {vol.startDate && vol.endDate ? (
                                                        vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}`
                                                    ) : (
                                                        formatDate((vol.startDate || vol.endDate) || '', data.cvLanguage)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {vol.description && (
                                            <div className="text-gray-700 mt-2">{renderHtmlContent(vol.description)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'customSections':
                return customSections.length > 0 ? (
                    <SortableItem 
                        key="customSections" 
                        id="customSections"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={setActiveSection}
                    >
                        <div className="mb-6">
                            {customSections.map((section) => (
                                <div key={section.id} className="mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                        <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">✨</span>
                                        {section.title}
                                    </h2>
                                    <div className="space-y-4">
                                        {section.items.map((item) => (
                                            <div key={item.id} className="border-l-4 border-indigo-400 pl-4 bg-indigo-50 p-4 rounded-r-lg">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900">{item.title}</h3>
                                                        {item.subtitle && (
                                                            <p className="text-indigo-600 font-medium">{item.subtitle}</p>
                                                        )}
                                                        {item.description && (
                                                            <div className="text-gray-700 mt-1">{renderHtmlContent(item.description)}</div>
                                                        )}
                                                        {item.technologies && item.technologies.length > 0 && (
                                                            <div className="mt-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {item.technologies.map((tech, index) => (
                                                                        <span key={index} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                                                                            {tech}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.url && (
                                                        <a
                                                            href={item.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 ml-4"
                                                        >
                                                            🔗 Link
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SortableItem>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="w-full h-full bg-white text-gray-900" style={{ padding: '20mm 15mm' }}>
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    {sectionOrder.map((sectionType) => renderModernSection(sectionType)).filter(Boolean)}
                </SortableContext>
            </div>

            <DragOverlay style={{ zIndex: 99999 }}>
                {activeId ? (
                    <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 opacity-90 rotate-2 scale-105 shadow-lg" style={{ zIndex: 99999 }}>
                        <div className="text-gray-700 font-medium">📦 {activeId} section</div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

// ATS-Friendly Professional Template Component with Drag and Drop
const ATSFriendlyTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    setActiveSection?: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, setActiveSection }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    return (
        <div className="w-full h-full bg-white text-gray-900 font-sans flex">
            {/* Left Column - Contact & Skills */}
            <div className="w-2/5 bg-gray-50 border-r border-gray-200" style={{ padding: '15mm 12mm' }}>
                {/* Profile Image */}
                {personalInfo.profileImage && (
                    <div className="mb-6 cv-section avoid-break">
                        <div className="flex justify-center">
                            <img
                                src={personalInfo.profileImage}
                                alt="Profile"
                                className="w-28 h-28 rounded-full object-cover border-4 border-gray-300 shadow-md"
                            />
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                <div className="mb-6 cv-section avoid-break">
                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                        Əlaqə
                    </h2>
                    <div className="space-y-2 text-xs">
                        {personalInfo.email && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">Email:</span>
                                <span className="text-gray-900">{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">Phone:</span>
                                <span className="text-gray-900">{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">Address:</span>
                                <span className="text-gray-900">{personalInfo.location}</span>
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-start gap-3">
                                <span className="font-medium text-gray-600 min-w-[40px]">LinkedIn:</span>
                                <span className="text-gray-900 break-all">{personalInfo.linkedin}</span>
                            </div>
                        )}
                        {personalInfo.website && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">Website:</span>
                                <span className="text-gray-900 break-all">{personalInfo.website}</span>
                            </div>
                        )}
                        {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                            personalInfo.additionalLinks.map((link) => (
                                <div key={link.id} className="flex items-start gap-2">
                                    <span className="font-medium text-gray-600 min-w-[40px]">{link.label}:</span>
                                    <span className="text-gray-900 break-all">{link.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                    <div className="mb-6">
                        {/* Hard Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'hard').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-xs font-medium text-gray-900">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-700 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'soft').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-xs font-medium text-gray-900">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-700 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* General Skills */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                                    {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-xs font-medium text-gray-900">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-700 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className={languages.length <= 2 ? "space-y-1" : "grid grid-cols-4 gap-x-2 gap-y-1"}>
                            {languages.map((lang) => (
                                <div key={lang.id} className="text-xs text-gray-700 break-words">
                                    {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                            {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert) => (
                                <div key={cert.id}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-gray-900 underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="text-xs font-medium text-gray-900">{cert.name}</h3>
                                            )}
                                            <p className="text-xs text-gray-600">{cert.issuer}</p>
                                            {cert.description && (
                                                <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(cert.description)}</div>
                                            )}
                                        </div>
                                        {cert.date && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {formatDate(cert.date, data.cvLanguage)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column - Main Content */}
            <div className="flex-1" style={{ padding: '15mm 12mm' }}>
                {/* Header - Name */}
                <div className="mb-6 cv-section avoid-break">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                        {getFullName(personalInfo)}
                    </h1>
                    {/* Professional title or summary preview */}
                    {personalInfo.summary && (
                        <div className="border-b border-gray-200 pb-4">
                            <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                                {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="text-gray-700 leading-relaxed text-xs">
                                {renderHtmlContent(personalInfo.summary)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Professional Experience */}
                {experience.length > 0 && (
                    <div className="mb-6 cv-section">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-200 pb-1">
                            {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-4">
                            {experience.map((exp) => (
                                <div key={exp.id} className="avoid-break">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{exp.position}</h3>
                                            <p className="text-xs font-medium text-gray-700">{exp.company}</p>
                                        </div>
                                        {(exp.startDate || exp.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {exp.startDate && exp.endDate ? (
                                                    exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((exp.startDate || exp.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-700 text-xs leading-relaxed">
                                            {renderHtmlContent(exp.description)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <div className="mb-6 cv-section">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-200 pb-1">
                            {getSectionName('education', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {education.map((edu) => (
                                <div key={edu.id} className="avoid-break">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{edu.degree}</h3>
                                            <p className="text-xs font-medium text-gray-700">{edu.institution}</p>
                                            {(edu.field || edu.gpa) && (
                                                <p className="text-xs text-gray-600">
                                                    {[edu.field, edu.gpa && `${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}`].filter(Boolean).join(' - ')}
                                                </p>
                                            )}
                                        </div>
                                        {(edu.startDate || edu.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {edu.startDate && edu.endDate ? (
                                                    edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((edu.startDate || edu.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {edu.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(edu.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Projects */}
                {projects.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-200 pb-1">
                            {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <div key={project.id}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-bold text-gray-900 underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="text-sm font-bold text-gray-900">{project.name}</h3>
                                            )}
                                            {project.description && (
                                                <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(project.description)}</div>
                                            )}
                                            {project.technologies && project.technologies.length > 0 && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-medium">Technologies:</span> {project.technologies.join(', ')}
                                                </p>
                                            )}
                                            {project.github && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    <span className="font-medium">GitHub:</span> {project.github}
                                                </p>
                                            )}
                                        </div>
                                        {(project.startDate || project.endDate || project.current) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {project.current ? (
                                                    project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : getCurrentText(data.cvLanguage)
                                                ) : project.startDate && project.endDate ? (
                                                    `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((project.startDate || project.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Volunteer Experience */}
                {volunteerExperience.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-200 pb-1">
                            {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {volunteerExperience.map((vol) => (
                                <div key={vol.id}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{vol.role}</h3>
                                            <p className="text-xs font-medium text-gray-700">{vol.organization}</p>
                                        </div>
                                        {(vol.startDate || vol.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {vol.startDate && vol.endDate ? (
                                                    vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((vol.startDate || vol.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {vol.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(vol.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Custom Sections */}
                {customSections.length > 0 && customSections
                    .sort((a, b) => (a.order || 999) - (b.order || 999))
                    .map((section) => (
                        <div key={section.id} className="mb-6">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b border-gray-200 pb-1">
                                {section.title}
                            </h2>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.id}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                {item.title && (
                                                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                                                )}
                                                {item.subtitle && (
                                                    <p className="text-xs font-medium text-gray-700">{item.subtitle}</p>
                                                )}
                                            </div>
                                            {item.date && (
                                                <span className="text-xs text-gray-600 ml-2">{item.date}</span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <div className="text-gray-700 text-xs mt-1 leading-relaxed">
                                                {renderHtmlContent(item.description)}
                                            </div>
                                        )}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.tags.map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {item.url && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                <span className="font-medium">URL:</span> {item.url}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                }

                {/* Bottom margin for professional standards */}
                <div className="mt-8"></div>
            </div>
        </div>
    );
};

// Professional Template Component with Drag and Drop
const ProfessionalTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    setActiveSection?: React.Dispatch<React.SetStateAction<string | null>>;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, setActiveSection }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Enhanced mobile device detection for ProfessionalTemplate
    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isPortrait = height > width;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Comprehensive mobile/tablet detection
            const isMobileDevice = width < 1024 || (isTouchDevice && width < 1200) || 
                                 (isPortrait && width < 768);
            
            setIsMobile(isMobileDevice);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        window.addEventListener('orientationchange', checkMobile);
        
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('orientationchange', checkMobile);
        };
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100, // Reduced delay for better mobile experience
                tolerance: 12, // Increased tolerance for touch precision
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over.id as string);

            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            onSectionReorder(newOrder);
        }

        setActiveId(null);
    };

    const renderProfessionalSection = (sectionType: string) => {
        switch (sectionType) {
            case 'summary':
                return personalInfo.summary ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-2 uppercase tracking-wide">
                            {getSectionName('professionalSummary', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="text-gray-700 leading-relaxed text-justify text-xs">
                            {renderHtmlContent(personalInfo.summary)}
                        </div>
                    </div>
                ) : null;

            case 'experience':
                return experience.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('professionalExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-4">
                            {experience.map((exp) => (
                                <div key={exp.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{exp.position}</h3>
                                            <p className="text-gray-700 font-semibold italic text-xs">{exp.company}</p>
                                        </div>
                                        {(exp.startDate || exp.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {exp.startDate && exp.endDate ? (
                                                    exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((exp.startDate || exp.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-700 leading-relaxed text-justify text-xs">
                                            {renderHtmlContent(exp.description)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'education':
                return education.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('education', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {education.map((edu) => (
                                <div key={edu.id}>
                                    <div className="flex justify-between items-baseline">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{edu.degree}</h3>
                                            <p className="text-gray-700 font-semibold text-xs">{edu.institution}</p>
                                            {(edu.field || edu.gpa) && (
                                                <p className="text-gray-600 italic text-xs">
                                                    {[edu.field, edu.gpa && `${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}`].filter(Boolean).join(' - ')}
                                                </p>
                                            )}
                                        </div>
                                        {(edu.startDate || edu.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {edu.startDate && edu.endDate ? (
                                                    edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage).toLowerCase()}` : `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((edu.startDate || edu.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {edu.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(edu.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'skills':
                return skills.length > 0 ? (
                    <div className="mb-6">
                        {/* Hard Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'hard').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed pl-2 border-l-2 border-gray-200">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => skill.type === 'soft').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed pl-2 border-l-2 border-gray-200">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Default skills */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                    {getSectionName('coreCompetencies', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill) => (
                                        <div key={skill.id}>
                                            <div className="mb-1">
                                                <span className="text-gray-700 text-xs font-medium">{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed pl-2 border-l-2 border-gray-200">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : null;

            case 'languages':
                return languages.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-1">
                            {languages.map((lang) => (
                                <div key={lang.id} className="text-xs text-gray-700">
                                    {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'projects':
                return projects.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('keyProjects', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {projects.map((project) => (
                                <div key={project.id}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-900 text-sm underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-bold text-gray-900 text-sm">{project.name}</h3>
                                            )}
                                            {project.description && (
                                                <div className="text-gray-700 text-xs mt-1 leading-relaxed">
                                                    {renderHtmlContent(project.description)}
                                                </div>
                                            )}
                                        </div>
                                        {(project.startDate || project.endDate || project.current) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {project.current ? (
                                                    project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage).toLowerCase()}` : getCurrentText(data.cvLanguage).toLowerCase()
                                                ) : project.startDate && project.endDate ? (
                                                    `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((project.startDate || project.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'certifications':
                return certifications.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert) => (
                                <div key={cert.id} className="border-l-2 border-gray-300 pl-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-gray-900 text-sm underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                                            )}
                                            <p className="text-gray-600 font-medium text-xs">{cert.issuer}</p>
                                        </div>
                                        {cert.date && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {formatDate(cert.date, data.cvLanguage)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'volunteer':
                return volunteerExperience.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {volunteerExperience.map((vol) => (
                                <div key={vol.id}>
                                    <div className="flex justify-between items-baseline">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{vol.role}</h3>
                                            <p className="text-gray-700 font-semibold text-xs">{vol.organization}</p>
                                        </div>
                                        {(vol.startDate || vol.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {vol.startDate && vol.endDate ? (
                                                    vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage).toLowerCase()}` : `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((vol.startDate || vol.endDate) || '', data.cvLanguage)
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    {vol.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(vol.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            default:
                if (sectionType.startsWith('custom-')) {
                    const customSection = customSections.find(cs => `custom-${cs.id}` === sectionType);
                    if (customSection) {
                        return (
                            <div className="mb-6">
                                <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                    {customSection.title}
                                </h2>
                                <div className="text-gray-700 text-xs leading-relaxed">
                                    {customSection.items.map(item => (
                                        <div key={item.id} className="mb-2">
                                            {item.title && <h3 className="font-bold">{item.title}</h3>}
                                            {item.subtitle && <p className="italic">{item.subtitle}</p>}
                                            {item.description && <div>{renderHtmlContent(item.description)}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    }
                }
                return null;
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="w-full h-full bg-white text-gray-900 font-serif" style={{ padding: '15mm 12mm' }}>
                {/* Header - Not draggable */}
                <div className="text-center mb-4 border-b-2 border-gray-300 pb-3">
                    {personalInfo.profileImage && (
                        <div className="flex justify-center mb-4">
                            <img
                                src={personalInfo.profileImage}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-400 shadow-lg"
                            />
                        </div>
                    )}

                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {getFullName(personalInfo)}
                    </h1>
                    <div className="flex justify-center gap-4 text-xs text-gray-600 flex-wrap">
                        {personalInfo.email && <span>{personalInfo.email}</span>}
                        {personalInfo.phone && <span>{personalInfo.phone}</span>}
                        {personalInfo.location && <span>{personalInfo.location}</span>}
                        {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
                        {personalInfo.website && <span>{personalInfo.website}</span>}
                        {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                            personalInfo.additionalLinks.map((link) => (
                                <span key={link.id}>{link.label}: {link.value}</span>
                            ))
                        )}
                    </div>
                </div>

                {/* Draggable Sections */}
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    {sectionOrder.map((sectionType) => {
                        const sectionContent = renderProfessionalSection(sectionType);

                        if (!sectionContent) return null;

                        return (
                            <SortableItem 
                                key={sectionType} 
                                id={sectionType}
                                sectionOrder={sectionOrder}
                                onSectionReorder={onSectionReorder}
                            >
                                {sectionContent}
                            </SortableItem>
                        );
                    })}
                </SortableContext>
            </div>
        </DndContext>
    );
};

// Main CVPreview Component
export default function CVPreview({
    cv,
    template,
    onSectionReorder,
    onUpdate,
    fontSettings = {
        fontFamily: 'Arial, sans-serif',
        nameSize: 24,
        titleSize: 16,
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12,
        headingWeight: 700,
        subheadingWeight: 600,
        bodyWeight: 400,
        smallWeight: 400,
        sectionSpacing: 16
    }
}: CVPreviewProps) {
    const templateId = template || cv.templateId || 'basic';
    const [scale, setScale] = React.useState(1.0);
    
    // Mobile section selection state
    const [activeSection, setActiveSection] = React.useState<string | null>(null);
    
    // Mobile swipe states
    const [isMobile, setIsMobile] = React.useState(false);
    const [touchStartX, setTouchStartX] = React.useState(0);
    const [touchStartY, setTouchStartY] = React.useState(0);
    const [currentTranslateX, setCurrentTranslateX] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);

    // Debug: Check what custom sections data we have
    console.log('=== CV PREVIEW DEBUG ===');
    console.log('CV Data:', cv.data);
    console.log('Custom Sections:', cv.data.customSections);
    console.log('Custom Sections Length:', cv.data.customSections?.length);
    console.log('Template ID:', templateId);

    // Default section order
    const defaultSectionOrder = [
        'summary',
        'experience',
        'education',
        'skills',
        'languages',
        'projects',
        'certifications',
        'volunteer',
        'customSections'
    ];

    // Initialize section order from CV data or use default
    const [sectionOrder, setSectionOrder] = useState(() => {
        // Check if CV data has a saved section order
        if (cv.data.sectionOrder && Array.isArray(cv.data.sectionOrder) && cv.data.sectionOrder.length > 0) {
            console.log('Using saved section order:', cv.data.sectionOrder);
            let order = cv.data.sectionOrder as string[];

            // If customSections exist but are not in the saved order, add them
            if (cv.data.customSections && cv.data.customSections.length > 0 && !order.includes('customSections')) {
                order = [...order, 'customSections'];
                console.log('Added customSections to saved order:', order);
            }

            return order;
        }

        // Use default order, but check if we need to include customSections
        let order = [...defaultSectionOrder];
        if (cv.data.customSections && cv.data.customSections.length > 0 && !order.includes('customSections')) {
            // customSections is already in defaultSectionOrder now, but just in case
            console.log('Custom sections exist in data:', cv.data.customSections.length);
        }

        console.log('Using default section order:', order);
        return order;
    });

    // Handle drag end
    const handleSectionReorder = (newOrder: string[]) => {
        console.log('=== MAIN HANDLE SECTION REORDER ===');
        console.log('New order:', newOrder);
        console.log('Old order:', sectionOrder);

        setSectionOrder(newOrder);

        // Update CV data with new section order for persistence
        const updatedCv = {
            ...cv,
            data: {
                ...cv.data,
                sectionOrder: newOrder
            }
        };

        // Notify parent component if handler exists - pass the updated CV
        if (onSectionReorder) {
            onSectionReorder(newOrder);
        }

        // Always update the parent with new CV data
        if (onUpdate) {
            onUpdate(updatedCv);
            console.log('✅ Section order updated in parent component');
        } else {
            console.log('⚠️ No onUpdate handler found, section order changes won\'t persist');
        }
    };

    // Enhanced responsive scale for all device types
    const getResponsiveScale = () => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isPortrait = height > width;

            // Mobile: Enhanced scaling system for all mobile devices
            if (width < 1024) {
                // Different scaling for different mobile sizes
                if (width <= 375) {
                    // Small phones (iPhone SE, older Android)
                    const scale = Math.min(0.75, (width - 32) / (210 * 3.779));
                    return Math.max(0.35, scale);
                } else if (width <= 414) {
                    // Medium phones (iPhone 12/13/14, most Android)
                    const scale = Math.min(0.85, (width - 40) / (210 * 3.779));
                    return Math.max(0.4, scale);
                } else if (width <= 768) {
                    // Large phones and small tablets
                    const scale = Math.min(0.95, (width - 48) / (210 * 3.779));
                    return Math.max(0.5, scale);
                } else {
                    // Large tablets in portrait
                    const scale = Math.min(1.0, (width - 64) / (210 * 3.779));
                    return Math.max(0.6, scale);
                }
            }

            // Tablet landscape mode
            if (width >= 1024 && width < 1280 && !isPortrait) {
                return 0.8;
            }

            // Desktop: Enhanced scaling
            if (width < 1280) return 0.8;     // Small desktop
            if (width < 1536) return 0.9;     // Medium desktop

            // Large desktop: A4 optimal fit
            const containerHeight = height - 160; // navbar və padding
            const a4Height = 297 * 3.779; // A4 height in pixels
            const maxScale = Math.min(1.3, containerHeight / a4Height);

            return Math.max(1.0, maxScale);
        }
        return 1.0; // SSR default
    };

    React.useEffect(() => {
        const handleResize = () => {
            setScale(getResponsiveScale());
            
            // Enhanced mobile detection for main component
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isPortrait = height > width;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Comprehensive mobile/tablet detection
            const isMobileDevice = width < 1024 || (isTouchDevice && width < 1200) || 
                                 (isPortrait && width < 768);
            
            setIsMobile(isMobileDevice);
        };

        // Set initial scale and mobile state
        handleResize();

        // Add event listeners for better device detection
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Mobile touch handlers - Prevent horizontal scrolling
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isMobile) return;
        
        const touch = e.touches[0];
        setTouchStartX(touch.clientX);
        setTouchStartY(touch.clientY);
        setIsDragging(false); // Don't set dragging immediately
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isMobile) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Prevent any horizontal movement - only allow vertical scroll
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault(); // Block horizontal scroll completely
        }
        
        // Reset any horizontal translation
        setCurrentTranslateX(0);
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        
        setIsDragging(false);
        setCurrentTranslateX(0); // Always reset to 0
    };

    // Template selection logic
    const renderTemplate = () => {
        // Normalize template ID for better matching
        const normalizedTemplate = templateId.toLowerCase();

        // ATS-Friendly Template
        if (normalizedTemplate.includes('ats') ||
            normalizedTemplate === 'ats-friendly' ||
            normalizedTemplate === 'resume-ats' ||
            normalizedTemplate.includes('clean') ||
            normalizedTemplate.includes('minimal-professional')) {
            return <ATSFriendlyTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                setActiveSection={setActiveSection} 
            />;
        }

        // Modern templates  
        if (normalizedTemplate.includes('modern') ||
            normalizedTemplate.includes('creative') ||
            normalizedTemplate === 'tech-professional' ||
            normalizedTemplate === 'designer-pro') {
            return <ModernTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                setActiveSection={setActiveSection} 
            />;
        }

        // Professional/Executive templates
        if (normalizedTemplate.includes('professional') ||
            normalizedTemplate.includes('elegant') ||
            normalizedTemplate.includes('executive') ||
            normalizedTemplate.includes('luxury') ||
            normalizedTemplate.includes('premium') ||
            normalizedTemplate === 'medium') {
            return <ProfessionalTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                setActiveSection={setActiveSection} 
            />;
        }

        // Basic/Simple templates (default)
        return <BasicTemplate
            data={cv.data}
            sectionOrder={sectionOrder}
            onSectionReorder={handleSectionReorder}
            cv={cv}
            onUpdate={onUpdate}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
        />;
    };

    return (
        <>
            {/* Mobile Debug Info - Only on mobile */}
            {isMobile && (
                <div 
                    className="fixed top-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-[100001] max-w-xs"
                    style={{
                        position: 'fixed',
                        zIndex: 100001,
                        fontSize: '10px',
                        lineHeight: '1.2'
                    }}
                >
                   
                </div>
            )}
            
            <div
                className="cv-preview border border-gray-300"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    width: '210mm',
                    height: '297mm', // Fixed A4 height
                    margin: '0',
                    overflow: 'auto', // Enable scroll when content exceeds A4 height
                    position: 'relative',
                    background: 'white',
                    transformOrigin: 'top left',
                    transform: `scale(${scale})`,
                    borderRadius: isMobile ? '4px' : '8px', // Smaller radius on mobile
                    boxShadow: scale >= 0.8
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                        : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    // Enhanced CSS Variables for font management
                    ['--cv-font-family' as any]: fontSettings.fontFamily,
                    ['--cv-name-size' as any]: `${fontSettings.nameSize}px`,
                    ['--cv-title-size' as any]: `${fontSettings.titleSize}px`,
                    ['--cv-heading-size' as any]: `${fontSettings.headingSize}px`,
                    ['--cv-subheading-size' as any]: `${fontSettings.subheadingSize}px`,
                    ['--cv-body-size' as any]: `${fontSettings.bodySize}px`,
                    ['--cv-small-size' as any]: `${fontSettings.smallSize}px`,
                    ['--cv-heading-weight' as any]: fontSettings.headingWeight,
                    ['--cv-subheading-weight' as any]: fontSettings.subheadingWeight,
                    ['--cv-body-weight' as any]: fontSettings.bodyWeight,
                    ['--cv-small-weight' as any]: fontSettings.smallWeight,
                    ['--cv-section-spacing' as any]: `${fontSettings.sectionSpacing}px`,
                    lineHeight: '1.5',
                    // Enhanced touch optimization for all mobile devices
                    touchAction: 'pan-y',
                    overscrollBehavior: 'contain',
                    overflowX: 'hidden', // Always prevent horizontal scroll
                    overflowY: 'auto', // Allow vertical scroll
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    // Cross-browser touch optimization
                    WebkitOverflowScrolling: 'touch',
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    KhtmlUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    userSelect: 'none',
                    // Performance optimization
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                }}
            >
                {renderTemplate()}
            </div>
        </>
    );
}
