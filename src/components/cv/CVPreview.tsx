'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CVData, PersonalInfo, Experience, Education, Skill, Language, Project, Certification, VolunteerExperience, CustomSection, CustomSectionItem } from '@/types/cv';
import '@/styles/cv-fonts.css';
import '@/styles/page-breaks.css';
import PageBreakIndicator, { usePageBreaks } from './PageBreakIndicator';

interface CVPreviewProps {
    cv: {
        id?: string;
        templateId?: string;
        data: CVData;
    };
    template?: string;
    onSectionReorder?: (newOrder: string[]) => void;
    onUpdate?: (updatedCv: any) => void;
    // Mobile section selection props
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
    // Left panel section reordering (for ATS template)
    onLeftSectionReorder?: (activeSection: string, direction: 'up' | 'down') => void;
    leftColumnOrder?: string[];
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
const renderHtmlContent = (htmlContent: string, isDarkBackground = false, cvLanguage?: string) => {
    if (!htmlContent) return null;
    
    let processedContent = htmlContent;
    
    // Replace capital İ with I for English language
    const language = cvLanguage?.toLowerCase() || 'az';
    if (language.includes('en')) {
        processedContent = processedContent.replace(/İ/g, 'I');
    }
    
    return (
        <div
            dangerouslySetInnerHTML={{ __html: processedContent }}
            className={`prose prose-xs max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:mb-2 [&>h2]:mb-2 [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 ${
                isDarkBackground 
                    ? '[&>*]:text-blue-100 [&>p]:text-blue-100 [&>div]:text-blue-100 [&>span]:text-blue-100 [&>strong]:text-white [&>em]:text-blue-200 [&>li]:text-blue-100' 
                    : ''
            }`}
        />
    );
};

const getFullName = (personalInfo: PersonalInfo, cvLanguage?: string): string => {
    let fullName = '';
    
    if (personalInfo.fullName) {
        fullName = personalInfo.fullName;
    } else if (personalInfo.firstName && personalInfo.lastName) {
        fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
    } else {
        fullName = personalInfo.firstName || personalInfo.lastName || '';
    }

    // Replace capital İ with I for English language
    const language = cvLanguage?.toLowerCase() || 'az';
    if (language.includes('en')) {
        fullName = fullName.replace(/İ/g, 'I');
    }

    return fullName;
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

    let translatedLevel = levelTranslations[languageKey]?.[level] || level;
    
    // Replace capital İ with I for English language
    if (languageKey === 'en') {
        translatedLevel = translatedLevel.replace(/İ/g, 'I');
    }

    return translatedLevel;
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

    // Replace capital İ with I for English language
    if (isEnglish) {
        formattedDate = formattedDate.replace(/İ/g, 'I');
    }

    return formattedDate;
};

// Get "Current" text based on language
const getCurrentText = (cvLanguage?: string): string => {
    const language = cvLanguage?.toLowerCase() || 'az';

    let currentText = '';
    if (language.includes('en')) {
        currentText = 'Present';
    } else if (language.includes('tr')) {
        currentText = 'Devam ediyor';
    } else {
        currentText = 'Davam edir';
    }

    // Replace capital İ with I for English language
    if (language.includes('en')) {
        currentText = currentText.replace(/İ/g, 'I');
    }

    return currentText;
};

// Dynamic section name mapping based on language
const getSectionName = (sectionKey: string, cvLanguage?: string, customSectionNames?: Record<string, string>, cvData?: any): string => {
    // If custom section names exist (from translation), use them
    if (customSectionNames && customSectionNames[sectionKey]) {
        return customSectionNames[sectionKey];
    }

    // Handle custom sections - get the first custom section's title if this is 'customSections'
    if (sectionKey === 'customSections' && cvData?.customSections && cvData.customSections.length > 0) {
        // Return the first custom section's title as representative name
        const firstCustomSection = cvData.customSections[0];
        if (firstCustomSection && firstCustomSection.title) {
            let title = firstCustomSection.title;
            // Replace capital İ with I for English language
            const language = cvLanguage?.toLowerCase() || 'az';
            if (language.includes('en')) {
                title = title.replace(/İ/g, 'I');
            }
            return title;
        }
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
            keyProjects: 'Projects',
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
            softSkills: 'Kisisel Yetenekler',
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

    let sectionName = sectionNames[languageKey]?.[sectionKey] || sectionNames['az'][sectionKey] || sectionKey;
    
    // Replace capital İ with I for English language
    if (languageKey === 'en') {
        sectionName = sectionName.replace(/İ/g, 'I');
    }

    return sectionName;
};

// Helper function to properly uppercase section names for English
const getUppercaseSectionName = (sectionKey: string, cvLanguage?: string, customSectionNames?: Record<string, string>, cvData?: any): string => {
    const sectionName = getSectionName(sectionKey, cvLanguage, customSectionNames, cvData);
    
    // For English, manually uppercase to handle İ -> I conversion
    if (cvLanguage?.toLowerCase().includes('en')) {
        return sectionName.replace(/İ/g, 'I').toUpperCase();
    }
    
    return sectionName;
};

// Helper function to extract LinkedIn username from URL
const getLinkedInDisplay = (linkedinInput: string): { displayText: string; url: string } => {
    if (!linkedinInput) return { displayText: '', url: '' };
    
    // If it's already a full URL, extract username
    if (linkedinInput.includes('linkedin.com/in/')) {
        const match = linkedinInput.match(/linkedin\.com\/in\/([^\/\?]+)/);
        if (match) {
            const username = match[1];
            return {
                displayText: `${username}`,
                url: linkedinInput
            };
        }
    }
    
    // If it's just a username (with or without @)
    const cleanUsername = linkedinInput.replace('@', '');
    if (!linkedinInput.includes('http')) {
        return {
            displayText: `${cleanUsername}`,
            url: `https://www.linkedin.com/in/${cleanUsername}/`
        };
    }
    
    // Fallback: display as is
    return {
        displayText: linkedinInput,
        url: linkedinInput.includes('http') ? linkedinInput : `https://www.linkedin.com/in/${linkedinInput}/`
    };
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

// Special SortableItem for Left Panel - mobile drag enabled
interface LeftPanelSortableItemProps {
    id: string;
    children: React.ReactNode;
    showDragInstruction?: boolean;
    dragIconPosition?: 'left' | 'right';
    sectionOrder: string[];
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSetActiveSection?: (sectionId: string | null) => void;
    alwaysShowDragHandle?: boolean;
    isDropTarget?: boolean;
}

const LeftPanelSortableItem: React.FC<LeftPanelSortableItemProps> = ({ 
    id, 
    children, 
    showDragInstruction = true, 
    dragIconPosition = 'right',
    sectionOrder,
    onSectionReorder,
    activeSection,
    onSetActiveSection,
    alwaysShowDragHandle = true,
    isDropTarget = false
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const autoDeactivateTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Check if this section is active
    const isActive = activeSection === id;
    
    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-deactivate section after 10 seconds of inactivity (mobile only)
    useEffect(() => {
        if (isMobile && isActive) {
            // Clear existing timer
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
            }
            
            // Set new timer
            const timer = setTimeout(() => {
                if (onSetActiveSection) {
                    onSetActiveSection(null);
                }
            }, 10000); // 10 seconds
            
            autoDeactivateTimerRef.current = timer;
            
            return () => {
                if (timer) {
                    clearTimeout(timer);
                }
            };
        }
        
        // Cleanup timer when section becomes inactive
        return () => {
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
                autoDeactivateTimerRef.current = null;
            }
        };
    }, [isActive, isMobile, onSetActiveSection]);

    // LEFT PANEL: Enable drag & drop for both mobile and desktop
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id,
        disabled: false // Enable drag for both mobile and desktop
    });

    const style: React.CSSProperties = {
        transition,
        zIndex: isDragging ? 9999 : 'auto',
        touchAction: 'none', // Let DnD handle touch
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        pointerEvents: isDragging ? 'none' : 'auto',
    };

    // Mobile click for selection when not dragging
    const handleMobileClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (isMobile && onSetActiveSection && !isDragging) {
            e.preventDefault();
            e.stopPropagation();
            
            // Clear any existing auto-deactivate timer
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
                autoDeactivateTimerRef.current = null;
            }
            
            // Toggle active state
            onSetActiveSection(isActive ? null : id);
        }
    };

    // Touch feedback
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isMobile) {
            setIsPressed(true);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isMobile) {
            setIsPressed(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={isMobile ? handleMobileClick : undefined}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`
                relative group
                cursor-grab active:cursor-grabbing
                ${isDragging
                    ? 'border-2 border-blue-500 bg-blue-50/20'
                    : 'hover:border-2 hover:border-blue-300 hover:shadow-sm'
                }
                ${isActive && isMobile ? 'bg-blue-50/30 border-blue-400' : ''}
                ${isPressed && isMobile ? 'bg-blue-800/20' : ''}
                ${isDropTarget ? 'bg-blue-700/30 border-2 border-white border-dashed' : ''}
                transition-all duration-200 ease-out
                border-2 border-transparent
                rounded-lg
                ${isMobile ? 'touch-manipulation' : 'touch-manipulation'}
                select-none
                ${isMobile ? 'min-h-[60px]' : ''}
            `}
            title={isMobile ? "Sol panel - sürükləyin və ya toxunun" : "Sol panel hissəni sürükləyin"}
        >
            {/* Drop Indicator Text */}
            {isDropTarget && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-800/90 rounded-lg z-50">
                    <div className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-bold shadow-lg border-2 border-blue-600">
                        ↓ Bura Buraxın ↓
                    </div>
                </div>
            )}
            {/* Desktop & Mobile Drag Handle - Only show on hover since left panels don't get selected */}
            <div
                className={`absolute ${dragIconPosition === 'right' ? '-right-3' : '-left-3'} top-1/2 transform -translate-y-1/2
                            opacity-0 group-hover:opacity-70 hover:opacity-100 transition-all duration-200`}
                style={{ userSelect: 'none', zIndex: 99999 }}
            >
                <div className={`bg-blue-200 hover:bg-blue-100 text-blue-900 rounded-full ${isMobile ? 'w-8 h-8' : 'w-6 h-6'} flex items-center justify-center shadow-sm transition-colors border border-blue-300`}>
                    <span className={`${isMobile ? 'text-sm' : 'text-xs'}`}>≡</span>
                </div>
            </div>

            {/* Desktop & Mobile instruction */}
            {showDragInstruction && (
                <div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-800 text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
                    style={{ userSelect: 'none', zIndex: 99999 }}
                >
                    Sol panel - sürükləyin
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-800"></div>
                </div>
            )}

            {/* Visual drag lines when dragging */}
            {isDragging && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 99998 }}>
                    <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-blue-300 rounded-full animate-pulse"></div>
                    <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-blue-300 rounded-full animate-pulse"></div>
                </div>
            )}

            {/* Content - centered layout for symmetric positioning */}
            <div
                className="transition-transform duration-200"
                style={{ 
                    userSelect: isDragging ? 'none' : 'auto',
                    paddingLeft: '0px',  // Removed left padding for contact section symmetry
                    paddingRight: '0px'  // Removed right padding for contact section symmetry
                }}
            >
                {children}
            </div>
        </div>
    );
};

// Responsive Item Component - DND for Desktop, Buttons for Mobile
interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    showDragInstruction?: boolean;
    dragIconPosition?: 'left' | 'right';
    sectionOrder: string[];
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSetActiveSection?: (sectionId: string | null) => void;
    alwaysShowDragHandle?: boolean; // New prop for left panel sections
    isDropTarget?: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
    id, 
    children, 
    showDragInstruction = true, 
    dragIconPosition = 'left',
    sectionOrder,
    onSectionReorder,
    activeSection,
    onSetActiveSection,
    alwaysShowDragHandle = false,
    isDropTarget = false
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const autoDeactivateTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    // Check if this section is active
    const isActive = activeSection === id;
    
    // Detect mobile on mount
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-deactivate section after 10 seconds of inactivity (mobile only)
    useEffect(() => {
        if (isMobile && isActive) {
            // Clear existing timer
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
            }
            
            // Set new timer
            const timer = setTimeout(() => {
                if (onSetActiveSection) {
                    onSetActiveSection(null);
                }
            }, 10000); // 10 seconds
            
            autoDeactivateTimerRef.current = timer;
            
            return () => {
                if (timer) {
                    clearTimeout(timer);
                }
            };
        }
        
        // Cleanup timer when section becomes inactive
        return () => {
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
                autoDeactivateTimerRef.current = null;
            }
        };
    }, [isActive, isMobile, onSetActiveSection]);

    // Mobil üçün drag & drop yox, sadəcə desktop üçün
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id,
        disabled: isMobile // Mobil üçün drag & drop söndürülüb
    });

    const style: React.CSSProperties = {
        transition: 'none', // Disable all transition effects
        transform: 'none', // Disable all transform effects for clean experience
        zIndex: isDragging ? 9999 : 'auto',
        touchAction: isMobile ? 'manipulation' : 'none', // Mobil üçün normal touch
        userSelect: isMobile ? 'auto' : 'none',
        WebkitUserSelect: isMobile ? 'auto' : 'none',
        WebkitTouchCallout: isMobile ? 'default' : 'none',
        pointerEvents: isDragging ? 'none' : 'auto',
    };

    // Mobil üçün sadəcə section seçimi
    const handleMobileClick = (e: React.MouseEvent | React.TouchEvent) => {
        if (isMobile && onSetActiveSection) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📱 SortableItem mobile click:', { 
                id, 
                isActive, 
                willActivate: !isActive,
                isCustomSections: id === 'customSections'
            });
            
            // Clear any existing auto-deactivate timer
            if (autoDeactivateTimerRef.current) {
                clearTimeout(autoDeactivateTimerRef.current);
                autoDeactivateTimerRef.current = null;
            }
            
            // Toggle active state
            onSetActiveSection(isActive ? null : id);
        }
    };

    // Mobil üçün sadə touch feedback
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isMobile) {
            setIsPressed(true);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isMobile) {
            setIsPressed(false);
        }
    };

    return (
        <div
            ref={isMobile ? undefined : setNodeRef} // Mobil üçün ref yox
            style={style}
            {...(isMobile ? {} : attributes)} // Mobil üçün attributes yox
            {...(isMobile ? {} : listeners)} // Mobil üçün listeners yox
            onClick={isMobile ? handleMobileClick : undefined} // Mobil üçün sadəcə click
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`
                relative group
                ${isMobile ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
                ${isDragging && !isMobile
                    ? 'border-2 border-blue-500 bg-blue-50/20 m-0 p-0'
                    : 'hover:shadow-sm hover:border hover:border-blue-300 hover:bg-blue-50/10 hover:m-0 hover:p-0'
                }
                ${isActive && isMobile ? 'bg-blue-50/70 shadow-xl border-blue-400 m-0 p-0' : ''}
                ${isPressed && isMobile ? 'bg-blue-100/50 m-0 p-0' : ''}
                ${isDropTarget ? 'bg-blue-200/50 border-2 border-blue-400 border-dashed m-0 p-0' : ''}
                transition-all duration-200 ease-out
                rounded-lg border-2 border-transparent m-0
                ${isMobile ? 'touch-manipulation' : 'touch-manipulation'}
                select-none
                ${isMobile ? 'min-h-[80px]' : ''}
            `}
            title={isMobile ? "Hissəni seçmək üçün toxunun" : "Bütün hissəni sürükləyin"}
        >
            {/* Drop Indicator Text */}
            {isDropTarget && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-200/90 rounded-lg z-50">
                    <div className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg border border-blue-500">
                        ↓ Bura Buraxın ↓
                    </div>
                </div>
            )}

            {/* Desktop Drag Handle - Show based on alwaysShowDragHandle or hover */}
            {!isMobile && (
                <div
                    className={`absolute ${dragIconPosition === 'right' ? '-right-3' : '-left-3'} top-1/2 transform -translate-y-1/2
                                ${alwaysShowDragHandle 
                                    ? 'opacity-70 hover:opacity-100' 
                                    : 'opacity-0 group-hover:opacity-100'
                                } transition-all duration-200`}
                    style={{ userSelect: 'none', zIndex: 99999 }}
                >
                    <div className={`bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors border border-white ${alwaysShowDragHandle ? 'ring-1 ring-blue-200' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                        </svg>
                    </div>
                </div>
            )}

            {/* Desktop Hover instruction */}
            {!isMobile && showDragInstruction && (
                <div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-600 text-gray-100 px-3 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
                    style={{ userSelect: 'none', zIndex: 99999 }}
                >
                    Sürükləyərək yerdəyişmə edin
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600"></div>
                </div>
            )}

            {/* Visual drag lines when dragging (desktop only) */}
            {isDragging && !isMobile && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 99998 }}>
                    <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            )}

            {/* Content wrapper */}
            <div
                className={`
                    transition-transform duration-200
                    ${dragIconPosition === 'right' ? 'pr-8' : 'pr-2'}
                    ${id === 'summary' ? 'py-0' : ''}
                `}
                style={{ userSelect: isDragging && !isMobile ? 'none' : 'auto' }}
            >
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
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, cv, onUpdate, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
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
        // Mobil üçün drag & drop söndürülüb
        if (isMobile) {
            return;
        }
        
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
        setDropTargetId(null);
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

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setDropTargetId(over ? over.id as string : null);
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
                    <div className="cv-section" style={{ marginTop: 0, marginBottom: 0, paddingBottom: 0 }}>
                        <h2 className="text-base font-semibold text-blue-600 my-0 border-b border-gray-300 pb-1">
                            {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="text-gray-700 leading-relaxed text-xs mt-1 mb-0" style={{ marginBottom: 0, paddingBottom: 0 }}>
                            {renderHtmlContent(personalInfo.summary, false, data.cvLanguage)}
                        </div>
                    </div>
                ) : null;

            case 'experience':
                console.log('Experience data in renderSection:', experience);
                return experience && experience.length > 0 ? (
                    <div>
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {experience.map((exp) => (
                                <div key={exp.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{exp.position}</h3>
                                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                            {exp.startDate ? (
                                                exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                formatDate(exp.startDate, data.cvLanguage)
                                            ) : exp.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : exp.endDate ? (
                                                formatDate(exp.endDate, data.cvLanguage)
                                            ) : ''}
                                        </span>
                                    </div>
                                    <p className="text-blue-600 font-medium text-xs">{exp.company}</p>
                                    {exp.description && (
                                        <div className="text-gray-700 text-xs mt-1 leading-relaxed">
                                            {renderHtmlContent(exp.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'education':
                return education && education.length > 0 ? (
                    <div>
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
                                            {edu.startDate ? (
                                                edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                formatDate(edu.startDate, data.cvLanguage)
                                            ) : edu.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : edu.endDate ? (
                                                formatDate(edu.endDate, data.cvLanguage)
                                            ) : ''}
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
                // Filter out empty skills (no skill name)
                const validSkills = skills?.filter(skill => skill.name && skill.name.trim() !== '') || [];
                return validSkills.length > 0 ? (
                    <div>
                        {/* Hard Skills */}
                        {validSkills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div >
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {validSkills.filter(skill => skill.type === 'hard').map((skill) => (
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
                        {validSkills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div >
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {validSkills.filter(skill => skill.type === 'soft').map((skill) => (
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
                        {validSkills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div >
                                <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                                    {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {validSkills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill) => (
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
                // Filter out empty languages (no language name)
                const validLanguages = languages?.filter(lang => lang.language && lang.language.trim() !== '') || [];
                return validLanguages.length > 0 ? (
                    <div>
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className={validLanguages.length <= 2 ? "space-y-1" : "grid grid-cols-4 gap-x-2 gap-y-1"}>
                            {validLanguages.map((lang) => (
                                <div key={lang.id} className="text-xs text-gray-700 break-words">
                                    {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'projects':
                return projects && projects.length > 0 ? (
                    <div >
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
                                        <div className="text-xs text-gray-600 mt-1">
                                            GitHub:{' '}
                                            <a
                                                href={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer break-all"
                                            >
                                                {project.github}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null;

            case 'certifications':
                return certifications && certifications.length > 0 ? (
                    <div >
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
                    <div >
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {volunteerExperience.map((vol) => (
                                <div key={vol.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm">{vol.role}</h3>
                                        <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                            {vol.startDate ? (
                                                vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                formatDate(vol.startDate, data.cvLanguage)
                                            ) : vol.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : vol.endDate ? (
                                                formatDate(vol.endDate, data.cvLanguage)
                                            ) : ''}
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
                    <div >
                        {customSections.map((section) => (
                            <div key={section.id} >
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
                                                <div className="text-xs mt-1">
                                                    <a
                                                        href={item.url?.startsWith('http') ? item.url : `https://${item.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer break-all"
                                                    >
                                                        {item.url}
                                                    </a>
                                                </div>
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
                padding: '20mm'
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
                            {getFullName(personalInfo, data.cvLanguage)}
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
                                    🔗 <a
                                        href={getLinkedInDisplay(personalInfo.linkedin).url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer underline"
                                    >
                                        {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                    </a>
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
                onDragOver={handleDragOver}
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
                            gap: 'var(--cv-section-spacing, 8px)'
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
                                    onSetActiveSection={onSectionSelect}
                                    isDropTarget={dropTargetId === sectionType}
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
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    // Mobil yoxlaması aradan qaldırıldı - hər zaman desktop versiyası göstərilir
    const [isMobile, setIsMobile] = useState(false);

    // Mobile device detection removed - always use desktop version
    /* useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); */

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
        // Mobil üçün drag & drop söndürülüb
        if (isMobile) {
            return;
        }
        
        setIsDragActive(true);
        setActiveId(event.active.id as string);
        console.log('=== MODERN TEMPLATE DRAG STARTED ===');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragActive(false);
        setActiveId(null);
        setDropTargetId(null);
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

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setDropTargetId(over ? over.id as string : null);
    };

    const renderModernSection = (sectionType: string) => {
        switch (sectionType) {
            case 'summary':
                return personalInfo.summary ? (
                    <SortableItem 
                        key="summary" 
                        id="summary"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">📝</span>
                                {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                                <div className="text-gray-700 leading-relaxed">
                                    {renderHtmlContent(personalInfo.summary)}
                                </div>
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'personalInfo':
                return (
                    <SortableItem 
                        key="personalInfo" 
                        id="personalInfo"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                    >
                        {/* Personal Info */}
                        <div className="text-center pb-6 border-b-2 border-blue-500 mb-6">
                            {personalInfo.profileImage && (
                                <div >
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
                        onSetActiveSection={onSectionSelect}
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
                                                    {exp.startDate ? (
                                                        exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                        formatDate(exp.startDate, data.cvLanguage)
                                                    ) : exp.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : exp.endDate ? (
                                                        formatDate(exp.endDate, data.cvLanguage)
                                                    ) : ''}
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
                        onSetActiveSection={onSectionSelect}
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
                                                    {edu.startDate ? (
                                                        edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                        formatDate(edu.startDate, data.cvLanguage)
                                                    ) : edu.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : edu.endDate ? (
                                                        formatDate(edu.endDate, data.cvLanguage)
                                                    ) : ''}
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
                // Filter out empty skills (no skill name)
                const validSkillsCreative = skills?.filter(skill => skill.name && skill.name.trim() !== '') || [];
                return validSkillsCreative.length > 0 ? (
                    <SortableItem 
                        key="skills" 
                        id="skills"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🚀</span>
                                {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {validSkillsCreative.map((skill) => (
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
                        onSetActiveSection={onSectionSelect}
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
                                                    className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm hover:bg-orange-50 ml-4"
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
                // Filter out empty languages (no language name)
                const validLanguagesCreative = languages?.filter(lang => lang.language && lang.language.trim() !== '') || [];
                return validLanguagesCreative.length > 0 ? (
                    <SortableItem 
                        key="languages" 
                        id="languages"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">🌍</span>
                                {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {validLanguagesCreative.map((lang) => (
                                    <div key={lang.id} className="bg-red-50 rounded-lg p-3 text-center border border-red-200 flex flex-col justify-between h-20">
                                        <div className="font-medium text-gray-900 flex-1 flex items-center justify-center">{lang.language}</div>
                                        <div className="text-red-600 text-sm flex-1 flex items-center justify-center">{lang.level}</div>
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
                        onSetActiveSection={onSectionSelect}
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
                        onSetActiveSection={onSectionSelect}
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

            case 'volunteer':
                // Map 'volunteer' to 'volunteerExperience' for compatibility
                return volunteerExperience.length > 0 ? (
                    <SortableItem 
                        key="volunteer" 
                        id="volunteer"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                    >
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">❤️</span>
                                {getSectionName('volunteer', data.cvLanguage, data.sectionNames)}
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
                        onSetActiveSection={onSectionSelect}
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
                                                            href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-50 ml-4"
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
            <div className="w-full h-full bg-white text-gray-900" style={{ padding: '20mm' }}>
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cv-section-spacing, 32px)' }}>
                        {sectionOrder.map((sectionType) => renderModernSection(sectionType)).filter(Boolean)}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

// ATS-Friendly Professional Template Component with Drag and Drop
// ATS-Friendly Professional Template Component with Drag and Drop
const ATSFriendlyTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
    onLeftSectionReorder?: (activeSection: string, direction: 'up' | 'down') => void;
    leftColumnOrder?: string[];
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect, onLeftSectionReorder, leftColumnOrder: externalLeftColumnOrder }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    // Separate state for left column drag
    const [isLeftDragActive, setIsLeftDragActive] = useState(false);
    const [leftActiveId, setLeftActiveId] = useState<string | null>(null);
    const [leftDropTargetId, setLeftDropTargetId] = useState<string | null>(null);
    

    // Force update state for real-time left panel updates
    const [, forceAtlasUpdate] = useState(0);
    const triggerAtlasUpdate = () => forceAtlasUpdate(prev => prev + 1);
    // Left column section order state - use external if provided
    const [internalLeftColumnOrder, setInternalLeftColumnOrder] = useState(['leftContact', 'leftSkills', 'leftLanguages', 'leftCertifications']);
    const leftColumnOrder = externalLeftColumnOrder || internalLeftColumnOrder;
    const setLeftColumnOrder = externalLeftColumnOrder ? () => {} : setInternalLeftColumnOrder;

    // Calculate available left column sections - only show sections with valid content
    const getAvailableLeftSections = () => {
        const availableSections = [];
        
        // Always add contact section (it always has some content - at least the header)
        availableSections.push('leftContact');
        
        // Only add education if there are valid education entries
        const validEducation = education.filter(edu => edu.degree && edu.degree.trim() !== '');
        if (validEducation.length > 0) {
            availableSections.push('leftEducation');
        }
        
        // Only add skills if there are valid skills (with names)
        const validSkills = skills.filter(skill => skill.name && skill.name.trim() !== '');
        if (validSkills.length > 0) {
            availableSections.push('leftSkills');
        }
        
        // Only add languages if there are valid languages (with language names)
        const validLanguages = languages.filter(lang => lang.language && lang.language.trim() !== '');
        if (validLanguages.length > 0) {
            availableSections.push('leftLanguages');
        }
        
        // Only add certifications if there are valid certifications (with names)
        const validCertifications = certifications.filter(cert => cert.name && cert.name.trim() !== '');
        if (validCertifications.length > 0) {
            availableSections.push('leftCertifications');
        }
        
        console.log('🔍 ATSFriendlyTemplate Debug - Data check:');
        console.log('- Contact section: always available');
        console.log('- Valid Education:', validEducation.length, 'Raw Education:', education.length);
        console.log('- Education Data:', education);
        console.log('- Valid Skills:', validSkills.length, 'Raw Skills:', skills.length);
        console.log('- Skills Data:', skills);
        console.log('- Valid Languages:', validLanguages.length, 'Raw Languages:', languages.length);
        console.log('- Languages raw data:', languages);
        console.log('- Valid Certifications:', validCertifications.length, 'Raw Certifications:', certifications.length);
        console.log('- Certifications Data:', certifications);
        console.log('- Available left sections:', availableSections);
        return availableSections;
    };

    const availableLeftSections = useMemo(() => {
        console.log('🔄 ATSFriendlyTemplate useMemo recalculating with:', { 
            education: education.length, 
            skills: skills.length, 
            languages: languages.length, 
            certifications: certifications.length,
            timestamp: Date.now()
        });
        const sections = getAvailableLeftSections();
        console.log('✅ Calculated sections:', sections);
        return sections;
    }, [education, skills, languages, certifications, getAvailableLeftSections]);
    
    // Filter leftColumnOrder to only include sections that actually exist
    const filteredLeftColumnOrder = useMemo(() => leftColumnOrder.filter(sectionId => availableLeftSections.includes(sectionId)), [leftColumnOrder, availableLeftSections]);
    
    // Update leftColumnOrder if it doesn't match available sections
    useEffect(() => {
        const currentFiltered = leftColumnOrder.filter(sectionId => availableLeftSections.includes(sectionId));
        if (currentFiltered.length !== leftColumnOrder.length || !currentFiltered.every((section, index) => section === leftColumnOrder[index])) {
            setLeftColumnOrder(currentFiltered);
        }
    }, [availableLeftSections, leftColumnOrder, education, skills, languages, certifications]);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Real-time left panel updates for Atlas template
    useEffect(() => {
        console.log('🔄 Atlas template left panel real-time update triggered');
        // Force re-render when data changes
        const leftSectionsUpdated = getAvailableLeftSections();
        console.log('📋 Available left sections updated:', leftSectionsUpdated);
        triggerAtlasUpdate(); // Force component update
    }, [data.education, data.skills, data.languages, data.certifications]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum 8px movement to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 50, // Reduced delay for better mobile response
                tolerance: 8, // Reduced tolerance for more precise touch
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Separate sensors for left column to avoid conflicts - mobile enabled
    const leftColumnSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Very responsive for left column
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Longer delay for mobile to allow selection vs drag
                tolerance: 8, // Better touch precision for left column sections
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        // Mobil üçün drag & drop söndürülüb
        if (isMobile) {
            return;
        }
        
        setIsDragActive(true);
        setActiveId(event.active.id as string);
        console.log('=== ATS TEMPLATE DRAG STARTED ===');
        console.log('Device type:', 'ontouchstart' in window ? 'Touch Device' : 'Mouse Device');
        console.log('Active element:', event.active.id);
        // Add subtle body class for global styling if needed
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    // Separate drag handlers for left column
    const handleLeftDragStart = (event: DragStartEvent) => {
        setIsLeftDragActive(true);
        setLeftActiveId(event.active.id as string);
        console.log('=== LEFT COLUMN DRAG STARTED ===');
        console.log('Device type:', 'ontouchstart' in window ? 'Touch Device' : 'Mouse Device');
        console.log('Is Mobile:', isMobile);
        console.log('Window width:', window.innerWidth);
        console.log('Active left element:', event.active.id);
        console.log('Current leftColumnOrder:', leftColumnOrder);
        console.log('✅ LEFT PANEL MOBILE DRAG ENABLED!');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const handleLeftDragEnd = (event: DragEndEvent) => {
        setIsLeftDragActive(false);
        setLeftActiveId(null);
        setLeftDropTargetId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== LEFT COLUMN DRAG ENDED ===');
        console.log('Active:', active.id);
        console.log('Over:', over?.id);
        console.log('Current leftColumnOrder:', leftColumnOrder);
        console.log('External callback available:', !!onLeftSectionReorder);

        if (over && active.id !== over.id) {
            const oldIndex = filteredLeftColumnOrder.indexOf(active.id as string);
            const newIndex = filteredLeftColumnOrder.indexOf(over.id as string);

            console.log('Left column - Old index:', oldIndex, 'New index:', newIndex);
            console.log('Left column array before move:', filteredLeftColumnOrder);

            if (oldIndex !== -1 && newIndex !== -1) {
                // If external callback is available, use it
                if (onLeftSectionReorder) {
                    console.log('🔄 Using external left section reorder callback for drag');
                    const direction = newIndex < oldIndex ? 'up' : 'down';
                    onLeftSectionReorder(active.id as string, direction);
                } else {
                    // Fallback to internal state
                    const newOrder = arrayMove(filteredLeftColumnOrder, oldIndex, newIndex);
                    console.log('✅ New left column order (internal):', newOrder);
                    setLeftColumnOrder(newOrder);
                }
                
                // Haptic feedback for mobile
                if (navigator.vibrate) {
                    navigator.vibrate(100); // Stronger vibration for success
                }
            } else {
                console.log('❌ Invalid indices for left column reorder');
                console.log('❌ filteredLeftColumnOrder:', filteredLeftColumnOrder);
                console.log('❌ active.id:', active.id, 'over.id:', over.id);
            }
        }
    };

    const handleLeftDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setLeftDropTargetId(over ? over.id as string : null);
    };

    // Function to move sections for mobile left column
    const moveLeftSection = (activeSection: string, direction: 'up' | 'down') => {
        // Use external callback if provided (from CVEditor)
        if (onLeftSectionReorder) {
            console.log('🔄 Using external left section reorder callback');
            onLeftSectionReorder(activeSection, direction);
            return;
        }
        
        // Fallback to internal logic
        // Recalculate available sections in real time
        const currentAvailableLeftSections = [];
        if (skills && skills.length > 0) currentAvailableLeftSections.push('leftSkills');
        if (languages && languages.length > 0) currentAvailableLeftSections.push('leftLanguages');
        if (certifications && certifications.length > 0) currentAvailableLeftSections.push('leftCertifications');
        
        if (!activeSection || !currentAvailableLeftSections.includes(activeSection)) {
            console.log('❌ No valid left section to move:', activeSection);
            console.log('❌ Available sections:', currentAvailableLeftSections);
            return;
        }
        
        console.log('📱 Moving left section:', { activeSection, direction, currentOrder: filteredLeftColumnOrder });
        console.log('📱 Available sections for move:', currentAvailableLeftSections);
        
        const currentIndex = filteredLeftColumnOrder.indexOf(activeSection);
        if (currentIndex === -1) {
            console.log('❌ Left section not found in order:', activeSection);
            return;
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < filteredLeftColumnOrder.length) {
            const newOrder = [...filteredLeftColumnOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            
            console.log('✅ New left column order:', newOrder);
            setLeftColumnOrder(newOrder);
            
            // Provide haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            console.log('❌ Cannot move left section - out of bounds:', { currentIndex, newIndex, orderLength: filteredLeftColumnOrder.length });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragActive(false);
        setActiveId(null);
        setDropTargetId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== ATS TEMPLATE DRAG ENDED ===');
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

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setDropTargetId(over ? over.id as string : null);
    };

    // Section render functions for draggable content
    const renderATSSection = (sectionType: string) => {
        console.log('Rendering ATS section:', sectionType);

        switch (sectionType) {
            case 'summary':
                return personalInfo.summary ? (
                    <SortableItem 
                        key="summary" 
                        id="summary"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'summary'}
                    >
                        <div className="cv-section" style={{ marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}>
                            <h2 className="text-sm font-bold text-gray-900 tracking-wide my-0" style={{ textTransform: data.cvLanguage?.includes('en') ? 'none' : 'uppercase' }}>
                                {getUppercaseSectionName('summary', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="text-gray-700 leading-none text-xs mt-1 mb-0" style={{ margin: 0, padding: 0 }}>
                                {renderHtmlContent(personalInfo.summary)}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'experience':
                return experience && experience.length > 0 ? (
                    <SortableItem 
                        key="experience" 
                        id="experience"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'experience'}
                    >
                        <div className="cv-section" style={{ marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}>
                            <h2 className="text-sm font-bold text-gray-900 tracking-wide border-b border-gray-200 pb-1 my-0" style={{ textTransform: data.cvLanguage?.includes('en') ? 'none' : 'uppercase' }}>
                                {getUppercaseSectionName('experience', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-2 mt-1 mb-0" style={{ margin: 0, padding: 0 }}>
                                {experience.map((exp) => (
                                    <div key={exp.id} className="avoid-break">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{exp.position}</h3>
                                                <p className="text-xs font-medium text-gray-700">{exp.company}</p>
                                            </div>
                                            {(exp.startDate || exp.endDate) && (
                                                <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                    {exp.startDate ? (
                                                        exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                        formatDate(exp.startDate, data.cvLanguage)
                                                    ) : exp.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : exp.endDate ? (
                                                        formatDate(exp.endDate, data.cvLanguage)
                                                    ) : ''}
                                                </span>
                                            )}
                                        </div>
                                        {exp.description && (
                                            <div className="text-gray-700 text-xs leading-none mb-0" style={{ margin: 0, padding: 0 }}>
                                                {renderHtmlContent(exp.description)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'education':
                return education && education.length > 0 ? (
                    <SortableItem 
                        key="education" 
                        id="education"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'education'}
                    >
                        <div className="cv-section" style={{ marginTop: 0, marginBottom: 0, paddingTop: 0,paddingBottom: 0 }}>
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1 my-0">
                                {getSectionName('education', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="mt-1 mb-0" style={{ margin: 0, padding: 0 }}>
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
                                                    {edu.startDate ? (
                                                        edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                        formatDate(edu.startDate, data.cvLanguage)
                                                    ) : edu.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : edu.endDate ? (
                                                        formatDate(edu.endDate, data.cvLanguage)
                                                    ) : ''}
                                                </span>
                                            )}
                                        </div>
                                        {edu.description && (
                                            <div className="text-gray-700 text-xs mt-1 mb-0" style={{ margin: 0, padding: 0 }}>{renderHtmlContent(edu.description)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'projects':
                return projects && projects.length > 0 ? (
                    <SortableItem 
                        key="projects" 
                        id="projects"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'projects'}
                    >
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
                                {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="">
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
                                                        <span className="font-medium">
                                                            {data.cvLanguage?.includes('en') ? 'Technologies:' : 
                                                             data.cvLanguage?.includes('tr') ? 'Teknolojiler:' : 'Texnologiyalar:'}
                                                        </span> {project.technologies.join(', ')}
                                                    </p>
                                                )}
                                                {project.github && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        <span className="font-medium">GitHub:</span>{' '}
                                                        <a
                                                            href={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-900 hover:text-blue-600 underline hover:no-underline transition-colors cursor-pointer break-all"
                                                        >
                                                            {project.github}
                                                        </a>
                                                    </div>
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
                    </SortableItem>
                ) : null;

            case 'volunteer':
                return volunteerExperience && volunteerExperience.length > 0 ? (
                    <SortableItem 
                        key="volunteer" 
                        id="volunteer"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'volunteer'}
                    >
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
                                {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="">
                                {volunteerExperience.map((vol) => (
                                    <div key={vol.id}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">{vol.role}</h3>
                                                <p className="text-xs font-medium text-gray-700">{vol.organization}</p>
                                            </div>
                                            {(vol.startDate || vol.endDate) && (
                                                <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                    {vol.startDate ? (
                                                        vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                        formatDate(vol.startDate, data.cvLanguage)
                                                    ) : vol.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : vol.endDate ? (
                                                        formatDate(vol.endDate, data.cvLanguage)
                                                    ) : ''}
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
                    </SortableItem>
                ) : null;

            case 'customSections':
                return customSections && customSections.length > 0 ? (
                    <SortableItem 
                        key="customSections" 
                        id="customSections"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'customSections'}
                    >
                        <div>
                            {customSections
                                .sort((a, b) => (a.order || 999) - (b.order || 999))
                                .map((section) => (
                                    <div key={section.id} >
                                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
                                            {section.title}
                                        </h2>
                                        <div className="">
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
                                                        <div className="text-gray-700 text-xs leading-none">
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
                                                        <div className="text-xs mt-1">
                                                            <a
                                                                href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer break-all"
                                                            >
                                                                {item.url}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </SortableItem>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div
            className={`
                w-full h-full bg-white text-gray-900 font-sans flex min-h-screen
                ${isDragActive || isLeftDragActive ? 'drag-mode' : ''}
            `}
        >
            {/* Left Column - Contact & Skills */}
            <div 
                className="w-2/5 bg-blue-900 text-white border-r border-blue-800" 
                style={{ 
                    padding: '12mm 12mm 15mm 12mm', /* üst: 12mm, sağ: 12mm, alt: 15mm, sol: 12mm - reduced top padding */
                    touchAction: 'none', // Force DnD kit control
                    userSelect: 'none',
                    minHeight: '297mm' // A4 uzunluğu - 297mm
                }}
                onTouchStart={(e) => {
                    if (isMobile) {
                        console.log('🟡 Left panel touch start detected');
                    }
                }}
            >
                {/* Profile Image */}
                {personalInfo.profileImage && (
                    <div className="cv-section avoid-break">
                        <div className="flex justify-center">
                            <img
                                src={personalInfo.profileImage}
                                alt="Profile"
                                className="w-28 h-28 rounded-full object-cover border-4 border-blue-300 shadow-md"
                            />
                        </div>
                    </div>
                )}

                {/* Contact Information */}
                <div className="cv-section avoid-break">
                    <h2 className="text-sm font-bold text-white tracking-wide border-b border-blue-300 pb-1 uppercase">
                        {data.cvLanguage === 'english' ? 'CONTACT' : 'ƏLAQƏ'}
                    </h2>
                    <div className="space-y-2 text-xs">
                        {personalInfo.email && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-blue-200 min-w-[40px]">
                                    {data.cvLanguage === 'english' ? 'Email:' : 'E-poçt:'}
                                </span>
                                <span className="text-white">{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-blue-200 min-w-[40px]">
                                    {data.cvLanguage === 'english' ? 'Phone:' : 'Telefon:'}
                                </span>
                                <span className="text-white">{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-blue-200 min-w-[40px]">
                                    {data.cvLanguage?.includes('en') ? 'Address:' : 
                                     data.cvLanguage?.includes('tr') ? 'Adres:' : 'Ünvan:'}
                                </span>
                                <span className="text-white">{personalInfo.location}</span>
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-start gap-3">
                                <span className="font-medium text-blue-200 min-w-[40px]">LinkedIn:</span>
                                <a
                                    href={getLinkedInDisplay(personalInfo.linkedin).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white break-all hover:text-blue-200 transition-colors cursor-pointer underline"
                                >
                                    {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                </a>
                            </div>
                        )}
                        {personalInfo.website && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-blue-200 min-w-[40px]">
                                    {data.cvLanguage === 'english' ? 'Website:' : 'Sayt:'}
                                </span>
                                <span className="text-white break-all">{personalInfo.website}</span>
                            </div>
                        )}
                        {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                            personalInfo.additionalLinks.map((link) => (
                                <div key={link.id} className="flex items-start gap-2">
                                    <span className="font-medium text-blue-200 min-w-[40px]">{link.label}:</span>
                                    <span className="text-white break-all">{link.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Left Column Draggable Sections */}
                <DndContext
                    sensors={leftColumnSensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleLeftDragStart}
                    onDragEnd={handleLeftDragEnd}
                    onDragOver={handleLeftDragOver}
                >
                    <SortableContext
                        items={filteredLeftColumnOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div 
                            className="transition-all duration-300"
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px' // Changed from 24px to 12px for tighter spacing
                            }}
                        >
                            {/* Render sections based on filteredLeftColumnOrder */}
                            {(() => {
                                console.log('🔍 ATS Left Panel Debug:', {
                                    filteredLeftColumnOrder,
                                    skillsCount: skills.length,
                                    languagesCount: languages.length,
                                    certificationsCount: certifications.length,
                                    availableLeftSections
                                });
                                return null;
                            })()}
                            
                         
                            
                            {filteredLeftColumnOrder.map((sectionId) => {
                                console.log('🔄 Rendering left section:', sectionId);
                                switch (sectionId) {
                                    case 'leftSkills':
                                        console.log('🎯 Rendering leftSkills, skills.length:', skills.length);
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftSkills-${skills.length}`} 
                                                id="leftSkills"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Skills SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftSkills'}
                                            >
                                                <div>
                                                    <>
                                                        {/* Hard Skills */}
                                                        {skills.filter(skill => skill.type === 'hard' && skill.name && skill.name.trim() !== '').length > 0 && (
                                                            <div>
                                                                <h2 className="text-sm font-bold text-white tracking-wide border-b border-blue-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                    {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('technicalSkills', data.cvLanguage, data.sectionNames) : getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                                                </h2>
                                                                <div className="space-y-2">
                                                                    {skills.filter(skill => skill.type === 'hard' && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                        <div key={skill.id}>
                                                                            <div className="mb-1">
                                                                                <span className="text-xs font-medium text-white">{skill.name}</span>
                                                                            </div>
                                                                            {skill.description && (
                                                                                <div className="text-blue-100 text-xs leading-none">
                                                                                    {renderHtmlContent(skill.description, true)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Soft Skills */}
                                                        {skills.filter(skill => skill.type === 'soft' && skill.name && skill.name.trim() !== '').length > 0 && (
                                                            <div>
                                                                <h2 className="text-sm font-bold text-white tracking-wide border-b border-blue-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                    {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('softSkills', data.cvLanguage, data.sectionNames) : getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                                                </h2>
                                                                <div className="space-y-2">
                                                                    {skills.filter(skill => skill.type === 'soft' && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                        <div key={skill.id}>
                                                                            <div className="mb-1">
                                                                                <span className="text-xs font-medium text-white">{skill.name}</span>
                                                                            </div>
                                                                            {skill.description && (
                                                                                <div className="text-blue-100 text-xs leading-none">
                                                                                    {renderHtmlContent(skill.description, true)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* General Skills */}
                                                        {skills.filter(skill => (!skill.type || (skill.type !== 'hard' && skill.type !== 'soft')) && skill.name && skill.name.trim() !== '').length > 0 && (
                                                            <div>
                                                                <h2 className="text-sm font-bold text-white tracking-wide border-b border-blue-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                    {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('skills', data.cvLanguage, data.sectionNames) : getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                                                </h2>
                                                                <div className="space-y-2">
                                                                    {skills.filter(skill => (!skill.type || (skill.type !== 'hard' && skill.type !== 'soft')) && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                        <div key={skill.id}>
                                                                            <div className="mb-1">
                                                                                <span className="text-xs font-medium text-white">{skill.name}</span>
                                                                            </div>
                                                                            {skill.description && (
                                                                                <div className="text-blue-100 text-xs leading-none">
                                                                                    {renderHtmlContent(skill.description, true)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    case 'leftLanguages':
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftLanguages-${languages.length}`} 
                                                id="leftLanguages"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Languages SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftLanguages'}
                                            >
                                                <div>
                                                    <h2 className="text-sm font-bold text-white tracking-wide border-b border-blue-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                        {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('languages', data.cvLanguage, data.sectionNames) : getSectionName('languages', data.cvLanguage, data.sectionNames)}
                                                    </h2>
                                                    {languages.filter(lang => lang.language && lang.language.trim() !== '').length > 0 && (
                                                        <div className="">
                                                            {languages.filter(lang => lang.language && lang.language.trim() !== '').map((lang) => (
                                                                <div key={lang.id} className="text-xs text-white break-words">
                                                                    {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    case 'leftCertifications':
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftCertifications-${certifications.length}`} 
                                                id="leftCertifications"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Certifications SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftCertifications'}
                                            >
                                                <div>
                                                    {certifications.filter(cert => cert.name && cert.name.trim() !== '').length > 0 && (
                                                        <>
                                                            <h2 className="text-sm font-bold text-gray-800 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('certifications', data.cvLanguage, data.sectionNames) : getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                                                            </h2>
                                                            <div className="space-y-2">
                                                                {certifications.filter(cert => cert.name && cert.name.trim() !== '').map((cert) => (
                                                                    <div key={cert.id}>
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                {cert.url ? (
                                                                                    <a
                                                                                        href={cert.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs font-medium text-gray-800 underline hover:text-gray-600 transition-colors cursor-pointer"
                                                                                    >
                                                                                        {cert.name}
                                                                                    </a>
                                                                                ) : (
                                                                                    <h3 className="text-xs font-medium text-gray-800">{cert.name}</h3>
                                                                                )}
                                                                                <p className="text-xs text-gray-600">{cert.issuer}</p>
                                                                                {cert.description && (
                                                                                    <div className="text-gray-600 text-xs mt-1">{renderHtmlContent(cert.description, true)}</div>
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
                                                        </>
                                                    )}
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Right Column - Main Content with Draggable Sections */}
            <div className="flex-1" style={{ padding: '12mm 10mm 15mm 8mm' /* üst: 12mm, sağ: 10mm, alt: 15mm, sol: 8mm - reduced right padding */ }}>
                {/* Header - Name */}
                <div className="cv-section avoid-break" style={{ marginBottom: '8px' }}>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                        {getFullName(personalInfo, data.cvLanguage)}
                    </h1>
                </div>

                {/* Draggable Sections */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={(event) => {
                        setIsDragActive(false);
                        setActiveId(null);
                        setDropTargetId(null);
                        document.body.style.userSelect = '';
                        document.body.style.cursor = '';

                        const { active, over } = event;

                        console.log('=== ATS RIGHT COLUMN DRAG ENDED ===');
                        console.log('Active:', active.id);
                        console.log('Over:', over?.id);

                        if (over && active.id !== over.id) {
                            const oldIndex = sectionOrder.indexOf(active.id as string);
                            const newIndex = sectionOrder.indexOf(over.id as string);

                            console.log('Old index:', oldIndex, 'New index:', newIndex);

                            if (oldIndex !== -1 && newIndex !== -1) {
                                const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
                                console.log('New right column order:', newOrder);
                                onSectionReorder(newOrder);
                            }
                        }
                    }}
                    onDragOver={handleDragOver}
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
                                gap: 'var(--cv-section-spacing, 18px)'
                            }}
                        >
                            {sectionOrder.map((sectionType) => {
                                const sectionContent = renderATSSection(sectionType);
                                if (!sectionContent) return null;
                                return sectionContent;
                            })}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Bottom margin for professional standards */}
                <div className="mt-8"></div>
            </div>

            {/* Mobile Section Controls moved to CVEditor - this section removed */}
        </div>
    );
};

// Lumen Template Component - Clean, Bright & Clear Visual Design (ATS-Based with White Left Panel)
const LumenTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
    onLeftSectionReorder?: (activeSection: string, direction: 'up' | 'down') => void;
    leftColumnOrder?: string[];
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect, onLeftSectionReorder, leftColumnOrder: externalLeftColumnOrder }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);

    // Force update state for real-time left panel updates
    const [, forceLumenUpdate] = useState(0);
    const triggerLumenUpdate = () => forceLumenUpdate(prev => prev + 1);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropTargetId, setDropTargetId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    // Separate state for left column drag
    const [isLeftDragActive, setIsLeftDragActive] = useState(false);
    const [leftActiveId, setLeftActiveId] = useState<string | null>(null);
    const [leftDropTargetId, setLeftDropTargetId] = useState<string | null>(null);
    
    // Left column section order state - use external if provided
    const [internalLeftColumnOrder, setInternalLeftColumnOrder] = useState(['leftSkills', 'leftLanguages', 'leftCertifications']);
    const leftColumnOrder = externalLeftColumnOrder || internalLeftColumnOrder;
    const setLeftColumnOrder = externalLeftColumnOrder ? () => {} : setInternalLeftColumnOrder;

    // Calculate available left column sections - only show sections with valid content
    const getAvailableLeftSections = () => {
        const availableSections = [];
        
        // Only add education if there are valid education entries
        const validEducation = education.filter(edu => edu.degree && edu.degree.trim() !== '');
        if (validEducation.length > 0) {
            availableSections.push('leftEducation');
        }
        
        // Only add skills if there are valid skills (with names)
        const validSkills = skills.filter(skill => skill.name && skill.name.trim() !== '');
        if (validSkills.length > 0) {
            availableSections.push('leftSkills');
        }
        
        // Only add languages if there are valid languages (with language names)
        const validLanguages = languages.filter(lang => lang.language && lang.language.trim() !== '');
        if (validLanguages.length > 0) {
            availableSections.push('leftLanguages');
        }
        
        // Only add certifications if there are valid certifications (with names)
        const validCertifications = certifications.filter(cert => cert.name && cert.name.trim() !== '');
        if (validCertifications.length > 0) {
            availableSections.push('leftCertifications');
        }
        
        console.log('🔍 LumenTemplate Debug - Data check:');
        console.log('- Valid Education:', validEducation.length, 'Raw Education:', education.length);
        console.log('- Education Data:', education);
        console.log('- Valid Skills:', validSkills.length, 'Raw Skills:', skills.length);
        console.log('- Skills Data:', skills);
        console.log('- Valid Languages:', validLanguages.length, 'Raw Languages:', languages.length);
        console.log('- Languages Data:', languages);
        console.log('- Valid Certifications:', validCertifications.length, 'Raw Certifications:', certifications.length);
        console.log('- Certifications Data:', certifications);
        console.log('- Available left sections:', availableSections);
        return availableSections;
    };

    const availableLeftSections = useMemo(() => {
        console.log('🔄 LumenTemplate useMemo recalculating with:', { 
            education: education.length, 
            skills: skills.length, 
            languages: languages.length, 
            certifications: certifications.length,
            timestamp: Date.now()
        });
        const sections = getAvailableLeftSections();
        console.log('✅ Calculated sections:', sections);
        return sections;
    }, [education, skills, languages, certifications, getAvailableLeftSections]);
    
    // Filter leftColumnOrder to only include sections that actually exist
    const filteredLeftColumnOrder = useMemo(() => leftColumnOrder.filter(sectionId => availableLeftSections.includes(sectionId)), [leftColumnOrder, availableLeftSections]);
    
    // Update leftColumnOrder if it doesn't match available sections
    useEffect(() => {
        const currentFiltered = leftColumnOrder.filter(sectionId => availableLeftSections.includes(sectionId));
        if (currentFiltered.length !== leftColumnOrder.length || !currentFiltered.every((section, index) => section === leftColumnOrder[index])) {
            setLeftColumnOrder(currentFiltered);
        }
    }, [availableLeftSections, leftColumnOrder, skills, languages, certifications]);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Real-time left panel updates for Lumen template
    useEffect(() => {
        console.log('🔄 Lumen template left panel real-time update triggered');
        // Force re-render when data changes
        const leftSectionsUpdated = getAvailableLeftSections();
        console.log('📋 Available left sections updated:', leftSectionsUpdated);
        triggerLumenUpdate(); // Force component update
    }, [data.education, data.skills, data.languages, data.certifications]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum 8px movement to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 50, // Reduced delay for better mobile response
                tolerance: 8, // Reduced tolerance for more precise touch
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Separate sensors for left column to avoid conflicts - mobile enabled
    const leftColumnSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Very responsive for left column
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Longer delay for mobile to allow selection vs drag
                tolerance: 8, // Better touch precision for left column sections
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        // Mobil üçün drag & drop söndürülüb
        if (isMobile) {
            return;
        }
        
        setIsDragActive(true);
        setActiveId(event.active.id as string);
        console.log('=== LUMEN TEMPLATE DRAG STARTED ===');
        console.log('Device type:', 'ontouchstart' in window ? 'Touch Device' : 'Mouse Device');
        console.log('Active element:', event.active.id);
        // Add subtle body class for global styling if needed
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    // Separate drag handlers for left column
    const handleLeftDragStart = (event: DragStartEvent) => {
        setIsLeftDragActive(true);
        setLeftActiveId(event.active.id as string);
        console.log('=== LUMEN LEFT COLUMN DRAG STARTED ===');
        console.log('Device type:', 'ontouchstart' in window ? 'Touch Device' : 'Mouse Device');
        console.log('Is Mobile:', isMobile);
        console.log('Window width:', window.innerWidth);
        console.log('Active left element:', event.active.id);
        console.log('Current leftColumnOrder:', leftColumnOrder);
        console.log('✅ LUMEN LEFT PANEL MOBILE DRAG ENABLED!');
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    const handleLeftDragEnd = (event: DragEndEvent) => {
        setIsLeftDragActive(false);
        setLeftActiveId(null);
        setLeftDropTargetId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== LUMEN LEFT COLUMN DRAG ENDED ===');
        console.log('Active:', active.id);
        console.log('Over:', over?.id);
        console.log('Current leftColumnOrder:', leftColumnOrder);
        console.log('External callback available:', !!onLeftSectionReorder);

        if (over && active.id !== over.id) {
            const oldIndex = filteredLeftColumnOrder.indexOf(active.id as string);
            const newIndex = filteredLeftColumnOrder.indexOf(over.id as string);

            console.log('Left column - Old index:', oldIndex, 'New index:', newIndex);
            console.log('Left column array before move:', filteredLeftColumnOrder);

            if (oldIndex !== -1 && newIndex !== -1) {
                // If external callback is available, use it
                if (onLeftSectionReorder) {
                    console.log('🔄 Using external left section reorder callback for drag');
                    const direction = newIndex < oldIndex ? 'up' : 'down';
                    onLeftSectionReorder(active.id as string, direction);
                } else {
                    // Fallback to internal state
                    const newOrder = arrayMove(filteredLeftColumnOrder, oldIndex, newIndex);
                    console.log('✅ New left column order (internal):', newOrder);
                    setLeftColumnOrder(newOrder);
                }
                
                // Haptic feedback for mobile
                if (navigator.vibrate) {
                    navigator.vibrate(100); // Stronger vibration for success
                }
            } else {
                console.log('❌ Invalid indices for left column reorder');
                console.log('❌ filteredLeftColumnOrder:', filteredLeftColumnOrder);
                console.log('❌ active.id:', active.id, 'over.id:', over.id);
            }
        }
    };

    const handleLeftDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setLeftDropTargetId(over ? over.id as string : null);
    };

    // Function to move sections for mobile left column
    const moveLeftSection = (activeSection: string, direction: 'up' | 'down') => {
        // Use external callback if provided (from CVEditor)
        if (onLeftSectionReorder) {
            console.log('🔄 Using external left section reorder callback');
            onLeftSectionReorder(activeSection, direction);
            return;
        }
        
        // Fallback to internal logic
        // Recalculate available sections in real time
        const currentAvailableLeftSections = [];
        if (skills && skills.length > 0) currentAvailableLeftSections.push('leftSkills');
        if (languages && languages.length > 0) currentAvailableLeftSections.push('leftLanguages');
        if (certifications && certifications.length > 0) currentAvailableLeftSections.push('leftCertifications');
        
        if (!activeSection || !currentAvailableLeftSections.includes(activeSection)) {
            console.log('❌ No valid left section to move:', activeSection);
            console.log('❌ Available sections:', currentAvailableLeftSections);
            return;
        }
        
        console.log('📱 Moving left section:', { activeSection, direction, currentOrder: filteredLeftColumnOrder });
        console.log('📱 Available sections for move:', currentAvailableLeftSections);
        
        const currentIndex = filteredLeftColumnOrder.indexOf(activeSection);
        if (currentIndex === -1) {
            console.log('❌ Left section not found in order:', activeSection);
            return;
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < filteredLeftColumnOrder.length) {
            const newOrder = [...filteredLeftColumnOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            
            console.log('✅ New left column order:', newOrder);
            setLeftColumnOrder(newOrder);
            
            // Provide haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            console.log('❌ Cannot move left section - out of bounds:', { currentIndex, newIndex, orderLength: filteredLeftColumnOrder.length });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDragActive(false);
        setActiveId(null);
        setDropTargetId(null);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        const { active, over } = event;

        console.log('=== LUMEN TEMPLATE DRAG ENDED ===');
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

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setDropTargetId(over ? over.id as string : null);
    };

    // Section render functions for draggable content - same as ATS but with white left panel styling
    const renderLumenSection = (sectionType: string) => {
        console.log('Rendering Lumen section:', sectionType);

        switch (sectionType) {
            case 'summary':
                return personalInfo.summary ? (
                    <SortableItem 
                        key="summary" 
                        id="summary"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'summary'}
                    >
                        <div className="cv-section">
                            <h2 className="text-sm font-bold text-gray-900 mb-2 tracking-wide" style={{ textTransform: data.cvLanguage?.includes('en') ? 'none' : 'uppercase' }}>
                                {getUppercaseSectionName('summary', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="text-gray-700 leading-relaxed text-xs">
                                {renderHtmlContent(personalInfo.summary)}
                            </div>
                        </div>
                    </SortableItem>
                ) : null;

            case 'experience':
                return experience && experience.length > 0 ? (
                    <SortableItem 
                        key="experience" 
                        id="experience"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'experience'}
                    >
                        <div className="mb-6 cv-section">
                            <h2 className="text-sm font-bold text-gray-900 mb-4 tracking-wide border-b border-gray-200 pb-1" style={{ textTransform: data.cvLanguage?.includes('en') ? 'none' : 'uppercase' }}>
                                {getUppercaseSectionName('experience', data.cvLanguage, data.sectionNames)}
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
                                                    {exp.startDate ? (
                                                        exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                        formatDate(exp.startDate, data.cvLanguage)
                                                    ) : exp.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : exp.endDate ? (
                                                        formatDate(exp.endDate, data.cvLanguage)
                                                    ) : ''}
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
                    </SortableItem>
                ) : null;

            case 'education':
                return education && education.length > 0 ? (
                    <SortableItem 
                        key="education" 
                        id="education"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'education'}
                    >
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
                                                    {edu.startDate ? (
                                                        edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                        formatDate(edu.startDate, data.cvLanguage)
                                                    ) : edu.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : edu.endDate ? (
                                                        formatDate(edu.endDate, data.cvLanguage)
                                                    ) : ''}
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
                    </SortableItem>
                ) : null;

            case 'projects':
                return projects && projects.length > 0 ? (
                    <SortableItem 
                        key="projects" 
                        id="projects"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'projects'}
                    >
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
                                                        <span className="font-medium">
                                                            {data.cvLanguage?.includes('en') ? 'Technologies:' : 
                                                             data.cvLanguage?.includes('tr') ? 'Teknolojiler:' : 'Texnologiyalar:'}
                                                        </span> {project.technologies.join(', ')}
                                                    </p>
                                                )}
                                                {project.github && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        <span className="font-medium">GitHub:</span>{' '}
                                                        <a
                                                            href={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-900 hover:text-blue-600 underline hover:no-underline transition-colors cursor-pointer break-all"
                                                        >
                                                            {project.github}
                                                        </a>
                                                    </div>
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
                    </SortableItem>
                ) : null;

            case 'volunteer':
                return volunteerExperience && volunteerExperience.length > 0 ? (
                    <SortableItem 
                        key="volunteer" 
                        id="volunteer"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'volunteer'}
                    >
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
                                                    {vol.startDate ? (
                                                        vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                        formatDate(vol.startDate, data.cvLanguage)
                                                    ) : vol.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : vol.endDate ? (
                                                        formatDate(vol.endDate, data.cvLanguage)
                                                    ) : ''}
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
                    </SortableItem>
                ) : null;

            case 'customSections':
                return customSections && customSections.length > 0 ? (
                    <SortableItem 
                        key="customSections" 
                        id="customSections"
                        sectionOrder={sectionOrder}
                        onSectionReorder={onSectionReorder}
                        activeSection={activeSection}
                        onSetActiveSection={onSectionSelect}
                        isDropTarget={dropTargetId === 'customSections'}
                    >
                        <div className="mb-6">
                            {customSections
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
                                                        <div className="text-xs mt-1">
                                                            <a
                                                                href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer break-all"
                                                            >
                                                                {item.url}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </SortableItem>
                ) : null;

            default:
                return null;
        }
    };

    return (
        <div
            className={`
                w-full h-full bg-white text-gray-900 font-sans flex min-h-screen
                ${isDragActive || isLeftDragActive ? 'drag-mode' : ''}
            `}
        >
            {/* Left Column - Contact & Skills with WHITE Background */}
            <div 
                className="w-2/5 bg-white text-gray-800 border-r-2 border-gray-300" 
                style={{ 
                    padding: '20mm 10mm 20mm 20mm', /* üst: 20mm, sağ: 10mm, alt: 20mm, sol: 20mm */
                    touchAction: 'none', // Force DnD kit control
                    userSelect: 'none',
                    minHeight: '297mm' // A4 uzunluğu - 297mm
                }}
                onTouchStart={(e) => {
                    if (isMobile) {
                        console.log('🟡 Lumen left panel touch start detected');
                    }
                }}
            >
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
                    <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.includes('en') ? 'none' : 'uppercase' }}>
                        {data.cvLanguage?.includes('en') ? 'CONTACT' : 
                         data.cvLanguage?.includes('tr') ? 'ILETISIM' : 'ƏLAQƏ'}
                    </h2>
                    <div className="space-y-2 text-xs">
                        {personalInfo.email && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">
                                    {data.cvLanguage?.includes('en') ? 'Email:' : 
                                     data.cvLanguage?.includes('tr') ? 'E-posta:' : 'E-poçt:'}
                                </span>
                                <span className="text-gray-800">{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">
                                    {data.cvLanguage === 'english' ? 'Phone:' : 'Telefon:'}
                                </span>
                                <span className="text-gray-800">{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">
                                    {data.cvLanguage?.includes('en') ? 'Address:' : 
                                     data.cvLanguage?.includes('tr') ? 'Adres:' : 'Ünvan:'}
                                </span>
                                <span className="text-gray-800">{personalInfo.location}</span>
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-start gap-3">
                                <span className="font-medium text-gray-600 min-w-[40px]">LinkedIn:</span>
                                <a
                                    href={getLinkedInDisplay(personalInfo.linkedin).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-800 break-all hover:text-blue-600 transition-colors cursor-pointer underline"
                                >
                                    {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                </a>
                            </div>
                        )}
                        {personalInfo.website && (
                            <div className="flex items-start gap-2">
                                <span className="font-medium text-gray-600 min-w-[40px]">
                                    {data.cvLanguage === 'english' ? 'Website:' : 'Sayt:'}
                                </span>
                                <span className="text-gray-800 break-all">{personalInfo.website}</span>
                            </div>
                        )}
                        {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                            personalInfo.additionalLinks.map((link) => (
                                <div key={link.id} className="flex items-start gap-2">
                                    <span className="font-medium text-gray-600 min-w-[40px]">{link.label}:</span>
                                    <span className="text-gray-800 break-all">{link.value}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Left Column Draggable Sections */}
                <DndContext
                    sensors={leftColumnSensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleLeftDragStart}
                    onDragEnd={handleLeftDragEnd}
                    onDragOver={handleLeftDragOver}
                >
                    <SortableContext
                        items={filteredLeftColumnOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div 
                            className={`transition-all duration-300 ${isLeftDragActive ? 'opacity-95 bg-gradient-to-br from-transparent via-gray-50/30 to-transparent' : ''}`}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}
                        >
                            {/* Render sections based on filteredLeftColumnOrder */}
                            {(() => {
                                console.log('🔍 Lumen Left Panel Debug:', {
                                    filteredLeftColumnOrder,
                                    skillsCount: skills.length,
                                    languagesCount: languages.length,
                                    certificationsCount: certifications.length,
                                    availableLeftSections
                                });
                                return null;
                            })()}
                            
                  
                            {filteredLeftColumnOrder.map((sectionId) => {
                                console.log('🔄 Rendering left section:', sectionId);
                                switch (sectionId) {
                                    case 'leftSkills':
                                        console.log('🎯 Rendering leftSkills, skills.length:', skills.length);
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftSkills-${skills.length}`} 
                                                id="leftSkills"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Skills SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftSkills'}
                                            >
                                                <div className="mb-6">
                                                    {/* Hard Skills */}
                                                    {skills.filter(skill => skill.type === 'hard' && skill.name && skill.name.trim() !== '').length > 0 && (
                                                        <div >
                                                            <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('skills', data.cvLanguage, data.sectionNames) : getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                                            </h2>
                                                            <div className="space-y-2">
                                                                {skills.filter(skill => skill.type === 'hard' && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                    <div key={skill.id} className="text-xs text-gray-700 break-words">
                                                                        • {skill.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Soft Skills */}
                                                    {skills.filter(skill => skill.type === 'soft' && skill.name && skill.name.trim() !== '').length > 0 && (
                                                        <div >
                                                            <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                                            </h2>
                                                            <div className="space-y-2">
                                                                {skills.filter(skill => skill.type === 'soft' && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                    <div key={skill.id} className="text-xs text-gray-700 break-words">
                                                                        • {skill.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* General Skills */}
                                                    {skills.filter(skill => (!skill.type || (skill.type !== 'hard' && skill.type !== 'soft')) && skill.name && skill.name.trim() !== '').length > 0 && (
                                                        <div >
                                                            <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('skills', data.cvLanguage, data.sectionNames) : getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                                            </h2>
                                                            <div className="space-y-2">
                                                                {skills.filter(skill => (!skill.type || (skill.type !== 'hard' && skill.type !== 'soft')) && skill.name && skill.name.trim() !== '').map((skill) => (
                                                                    <div key={skill.id} className="text-xs text-gray-700 break-words">
                                                                        • {skill.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    case 'leftLanguages':
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftLanguages-${languages.length}`} 
                                                id="leftLanguages"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Languages SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftLanguages'}
                                            >
                                                <div className="mb-6">
                                                    {languages.filter(lang => lang.language && lang.language.trim() !== '').length > 0 ? (
                                                        <>
                                                            <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                                {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('languages', data.cvLanguage, data.sectionNames) : getSectionName('languages', data.cvLanguage, data.sectionNames)}
                                                            </h2>
                                                            <div className="space-y-1">
                                                                {languages.filter(lang => lang.language && lang.language.trim() !== '').map((lang) => (
                                                                    <div key={lang.id} className="text-xs text-gray-700 break-words">
                                                                        {lang.language} ({getLanguageLevel(lang.level, data.cvLanguage)})
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    case 'leftCertifications':
                                        return (
                                            <LeftPanelSortableItem 
                                                key={`leftCertifications-${certifications.length}`} 
                                                id="leftCertifications"
                                                sectionOrder={filteredLeftColumnOrder}
                                                onSectionReorder={() => {
                                                    console.log('🔧 Left Certifications SortableItem callback called (should be handled by DndContext)');
                                                    // Empty - let DndContext handle this
                                                }}
                                                activeSection={activeSection}
                                                onSetActiveSection={onSectionSelect}
                                                showDragInstruction={true}
                                                dragIconPosition="right"
                                                alwaysShowDragHandle={true}
                                                isDropTarget={leftDropTargetId === 'leftCertifications'}
                                            >
                                                <div className="mb-6">
                                                    <h2 className="text-sm font-bold text-gray-800 mb-3 tracking-wide border-b border-gray-300 pb-1" style={{ textTransform: data.cvLanguage?.toLowerCase().includes('en') ? 'none' : 'uppercase' }}>
                                                        {data.cvLanguage?.toLowerCase().includes('en') ? getUppercaseSectionName('certifications', data.cvLanguage, data.sectionNames) : getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                                                    </h2>
                                                    {certifications.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {certifications.map((cert) => (
                                                                <div key={cert.id}>
                                                                    <div className="text-xs text-gray-800 font-medium">{cert.name}</div>
                                                                    <div className="text-xs text-gray-600">{cert.issuer}</div>
                                                                    {cert.date && (
                                                                        <div className="text-xs text-gray-500">{formatDate(cert.date, data.cvLanguage)}</div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <div className="text-gray-500 text-xs">
                                                                {data.cvLanguage?.includes('en') ? 'No certifications added yet' : 
                                                                 data.cvLanguage?.includes('tr') ? 'Henüz sertifika eklenmedi' : 'Hələ sertifikat əlavə edilməyib'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </LeftPanelSortableItem>
                                        );

                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>

            {/* Right Column - Main Content with Draggable Sections */}
            <div className="flex-1" style={{ padding: '20mm 20mm 20mm 10mm' /* üst: 20mm, sağ: 20mm, alt: 20mm, sol: 10mm */ }}>
                {/* Header - Name */}
                <div className="mb-6 cv-section avoid-break">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                        {getFullName(personalInfo, data.cvLanguage)}
                    </h1>
                </div>

                {/* Draggable Sections */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={(event) => {
                        setIsDragActive(false);
                        setActiveId(null);
                        setDropTargetId(null);
                        document.body.style.userSelect = '';
                        document.body.style.cursor = '';

                        const { active, over } = event;

                        console.log('=== LUMEN RIGHT COLUMN DRAG ENDED ===');
                        console.log('Active:', active.id);
                        console.log('Over:', over?.id);

                        if (over && active.id !== over.id) {
                            const oldIndex = sectionOrder.indexOf(active.id as string);
                            const newIndex = sectionOrder.indexOf(over.id as string);

                            console.log('Old index:', oldIndex, 'New index:', newIndex);

                            if (oldIndex !== -1 && newIndex !== -1) {
                                const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
                                console.log('New right column order:', newOrder);
                                onSectionReorder(newOrder);
                            }
                        }
                    }}
                    onDragOver={handleDragOver}
                >
                    <SortableContext
                        items={sectionOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div 
                            className={`transition-all duration-300 ${isDragActive ? 'opacity-95 bg-gradient-to-br from-transparent via-gray-50/30 to-transparent' : ''}`}
                            style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--cv-section-spacing, 24px)'
                            }}
                        >
                            {sectionOrder.map((sectionType) => {
                                const sectionContent = renderLumenSection(sectionType);
                                if (!sectionContent) return null;
                                return sectionContent;
                            })}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Bottom margin for professional standards */}
                <div className="mt-8"></div>
            </div>

            {/* Mobile Section Controls moved to CVEditor - this section removed */}
        </div>
    );
};

// Vertex Template Component - Technology & Innovation Focused ATS-Friendly Design
const VertexTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    const [activeId, setActiveId] = useState<string | null>(null);
    // Mobil yoxlaması aradan qaldırıldı - hər zaman desktop versiyası göstərilir
    const [isMobile, setIsMobile] = useState(false);

    // Mobile device detection removed - always use desktop version
    /* useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); */

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 15,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle section selection for mobile
    const handleSectionClick = (sectionId: string) => {
        if (isMobile && onSectionSelect) {
            const newValue = sectionId === activeSection ? null : sectionId;
            onSectionSelect(newValue);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        
        if (active.id !== over?.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over?.id as string);
            
            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            onSectionReorder(newOrder);
        }
    };

    // Helper component for section header with tech styling
    const SectionHeader: React.FC<{ title: string; sectionId: string }> = ({ title, sectionId }) => (
        <div 
            className={`mb-6 ${isMobile && activeSection === sectionId ? 'ring-2 ring-gray-500 rounded' : ''}`}
            onClick={() => handleSectionClick(sectionId)}
        >
            <div className="relative">
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest mb-6 relative">
                    <span className="bg-white pr-8">{title}</span>
                </h2>
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-400 -z-10"></div>
            </div>
        </div>
    );

    // Generate section components based on order
    const generateSection = (sectionId: string) => {
        switch (sectionId) {
            case 'summary':
                if (!personalInfo.summary) return null;
                return (
                    <div key="summary">
                        <SectionHeader title={getSectionName('summary', data.cvLanguage, data.sectionNames)} sectionId="summary" />
                        <div className="border-l-4 border-gray-900 pl-8 py-4 mb-2">
                            <div className="text-gray-700 leading-relaxed text-base">
                                {renderHtmlContent(personalInfo.summary, false, data.cvLanguage)}
                            </div>
                        </div>
                    </div>
                );

            case 'experience':
                if (!experience.length) return null;
                return (
                    <div key="experience">
                        <SectionHeader title={getSectionName('experience', data.cvLanguage, data.sectionNames)} sectionId="experience" />
                        <div className="space-y-6">
                            {experience.map((exp, index) => (
                                <div key={exp.id || index} className="relative">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* Date Column - Fixed Width */}
                                        <div className="col-span-3">
                                            {(exp.startDate || exp.endDate) && (
                                                <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                    {exp.startDate ? (
                                                        exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                        formatDate(exp.startDate, data.cvLanguage)
                                                    ) : exp.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : exp.endDate ? (
                                                        formatDate(exp.endDate, data.cvLanguage)
                                                    ) : ''}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="col-span-9">
                                            <div className="border-l-4 border-gray-300 pl-6">
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">{exp.position}</h3>
                                                <h4 className="font-semibold text-gray-700 text-base mb-3">{exp.company}</h4>
                                                {exp.description && (
                                                    <div className="text-gray-600 text-sm leading-relaxed">
                                                        {renderHtmlContent(exp.description, false, data.cvLanguage)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'education':
                if (!education.length) return null;
                return (
                    <div key="education">
                        <SectionHeader title={getSectionName('education', data.cvLanguage, data.sectionNames)} sectionId="education" />
                        <div className="space-y-6">
                            {education.map((edu, index) => (
                                <div key={edu.id || index} className="relative">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* Date Column - Fixed Width */}
                                        <div className="col-span-3">
                                            {(edu.startDate || edu.endDate) && (
                                                <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                    {edu.startDate ? (
                                                        edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                        formatDate(edu.startDate, data.cvLanguage)
                                                    ) : edu.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : edu.endDate ? (
                                                        formatDate(edu.endDate, data.cvLanguage)
                                                    ) : ''}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="col-span-9">
                                            <div className="border-l-4 border-gray-300 pl-6">
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">{edu.degree}</h3>
                                                <h4 className="font-semibold text-gray-700 text-base mb-3">{edu.institution}</h4>
                                                {(edu.field || edu.gpa) && (
                                                    <div className="text-sm text-gray-600 mb-3 font-mono bg-gray-50 p-3 rounded border">
                                                        {edu.field && <div className="mb-1">{edu.field}</div>}
                                                        {edu.gpa && <div>{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</div>}
                                                    </div>
                                                )}
                                                {edu.description && (
                                                    <div className="text-gray-600 text-sm leading-relaxed">
                                                        {renderHtmlContent(edu.description, false, data.cvLanguage)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'skills':
                if (!skills.length) return null;
                return (
                    <div key="skills">
                        <SectionHeader title={getSectionName('skills', data.cvLanguage, data.sectionNames)} sectionId="skills" />
                        
                        {/* Technical Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {skills.filter(skill => skill.type === 'hard').map((skill, index) => (
                                        <div key={skill.id || index} className="bg-gray-100 border border-gray-300 px-4 py-3 text-center rounded">
                                            <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h3>
                                <div className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 border rounded">
                                    {skills.filter(skill => skill.type === 'soft').map(skill => skill.name).join(' • ')}
                                </div>
                            </div>
                        )}

                        {/* Core Competencies */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                                    {getSectionName('coreCompetencies', data.cvLanguage, data.sectionNames)}
                                </h3>
                                <div className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 border rounded">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map(skill => skill.name).join(' • ')}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'projects':
                if (!projects.length) return null;
                return (
                    <div key="projects">
                        <SectionHeader title={getSectionName('projects', data.cvLanguage, data.sectionNames)} sectionId="projects" />
                        <div className="space-y-6">
                            {projects.map((project, index) => (
                                <div key={project.id || index} className="border-2 border-gray-300 p-6 rounded">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* Date Column - Fixed Width */}
                                        <div className="col-span-3">
                                            {(project.startDate || project.endDate || project.current) && (
                                                <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                    {project.current ? (
                                                        project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : getCurrentText(data.cvLanguage)
                                                    ) : project.startDate && project.endDate ? (
                                                        `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                                    ) : (
                                                        formatDate((project.startDate || project.endDate) || '', data.cvLanguage)
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="col-span-9">
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-900 text-lg underline hover:no-underline mb-3 block"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-bold text-gray-900 text-lg mb-3">{project.name}</h3>
                                            )}
                                            
                                            {project.description && (
                                                <div className="text-gray-600 text-sm leading-relaxed mb-4">
                                                    {renderHtmlContent(project.description, false, data.cvLanguage)}
                                                </div>
                                            )}
                                            
                                            {project.technologies && project.technologies.length > 0 && (
                                                <div>
                                                    <div className="text-xs text-gray-600 font-mono uppercase tracking-wider mb-3">
                                                        {data.cvLanguage?.includes('en') ? 'Technologies' : 
                                                         data.cvLanguage?.includes('tr') ? 'Teknolojiler' : 'Texnologiyalar'}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.technologies.map((tech, i) => (
                                                            <span key={i} className="bg-gray-200 border border-gray-400 px-3 py-2 text-xs font-mono rounded">
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'languages':
                if (!languages.length) return null;
                return (
                    <div key="languages">
                        <SectionHeader title={getSectionName('languages', data.cvLanguage, data.sectionNames)} sectionId="languages" />
                        <div className="grid grid-cols-3 gap-4">
                            {languages.map((lang, index) => (
                                <div key={lang.id || index} className="border border-gray-300 p-4 bg-gray-50 rounded">
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <span className="font-semibold text-gray-800 text-base">{lang.language}</span>
                                        <span className="text-xs text-gray-600 font-mono bg-gray-200 px-3 py-1 rounded">
                                            {getLanguageLevel(lang.level, data.cvLanguage)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'certifications':
                if (!certifications.length) return null;
                return (
                    <div key="certifications">
                        <SectionHeader title={getSectionName('certifications', data.cvLanguage, data.sectionNames)} sectionId="certifications" />
                        <div className="space-y-6">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="border border-gray-300 p-6 rounded">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* Date Column */}
                                        <div className="col-span-3">
                                            {cert.date && (
                                                <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                    {formatDate(cert.date, data.cvLanguage)}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="col-span-9">
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-900 text-lg underline hover:no-underline mb-2 block"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">{cert.name}</h3>
                                            )}
                                            <p className="text-base text-gray-700 font-medium mb-3">{cert.issuer}</p>
                                            {cert.description && (
                                                <div className="text-gray-600 text-sm leading-relaxed">
                                                    {renderHtmlContent(cert.description, false, data.cvLanguage)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'volunteer':
                if (!volunteerExperience.length) return null;
                return (
                    <div key="volunteer">
                        <SectionHeader title={getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)} sectionId="volunteer" />
                        <div className="space-y-6">
                            {volunteerExperience.map((vol, index) => (
                                <div key={vol.id || index} className="relative">
                                    <div className="grid grid-cols-12 gap-6">
                                        {/* Date Column */}
                                        <div className="col-span-3">
                                            {(vol.startDate || vol.endDate) && (
                                                <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                    {vol.startDate ? (
                                                        vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                        vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                        formatDate(vol.startDate, data.cvLanguage)
                                                    ) : vol.current ? (
                                                        getCurrentText(data.cvLanguage)
                                                    ) : vol.endDate ? (
                                                        formatDate(vol.endDate, data.cvLanguage)
                                                    ) : ''}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Column */}
                                        <div className="col-span-9">
                                            <div className="border-l-4 border-gray-300 pl-6">
                                                <h3 className="font-bold text-gray-900 text-lg mb-2">{vol.role}</h3>
                                                <h4 className="font-semibold text-gray-700 text-base mb-3">{vol.organization}</h4>
                                                {vol.description && (
                                                    <div className="text-gray-600 text-sm leading-relaxed">
                                                        {renderHtmlContent(vol.description, false, data.cvLanguage)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'customSections':
                if (!customSections.length) return null;
                return (
                    <div key="customSections">
                        {customSections.map((customSection, sectionIndex) => (
                            <div key={customSection.id || sectionIndex} className={sectionIndex > 0 ? "mt-10" : ""}>
                                <SectionHeader title={customSection.title} sectionId={`custom-${customSection.id}`} />
                                <div className="space-y-6">
                                    {customSection.items.map((item, index) => (
                                        <div key={item.id || index} className="border border-gray-300 p-6 rounded">
                                            <div className="grid grid-cols-12 gap-6">
                                                {/* Date Column */}
                                                <div className="col-span-3">
                                                    {item.date && (
                                                        <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                            {formatDate(item.date, data.cvLanguage)}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Content Column */}
                                                <div className="col-span-9">
                                                    {item.title && (
                                                        <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                                                    )}
                                                    {item.subtitle && (
                                                        <p className="font-medium text-gray-700 text-base mb-3">{item.subtitle}</p>
                                                    )}
                                                    {item.description && (
                                                        <div className="text-gray-600 text-sm leading-relaxed">
                                                            {renderHtmlContent(item.description, false, data.cvLanguage)}
                                                        </div>
                                                    )}
                                                    {item.url && (
                                                        <div className="mt-3">
                                                            <a
                                                                href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-sm font-medium break-all"
                                                            >
                                                                {item.url}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                // Handle individual custom sections
                if (sectionId.startsWith('custom-')) {
                    const customSectionId = sectionId.replace('custom-', '');
                    const customSection = customSections.find(section => section.id === customSectionId);
                    if (!customSection || !customSection.items.length) return null;

                    return (
                        <div key={sectionId}>
                            <SectionHeader title={customSection.title} sectionId={sectionId} />
                            <div className="space-y-6">
                                {customSection.items.map((item, index) => (
                                    <div key={item.id || index} className="border border-gray-300 p-6 rounded">
                                        <div className="grid grid-cols-12 gap-6">
                                            {/* Date Column */}
                                            <div className="col-span-3">
                                                {item.date && (
                                                    <div className="text-xs text-gray-600 font-mono bg-gray-100 px-4 py-3 rounded border text-center h-fit">
                                                        {formatDate(item.date, data.cvLanguage)}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Content Column */}
                                            <div className="col-span-9">
                                                {item.title && (
                                                    <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                                                )}
                                                {item.subtitle && (
                                                    <p className="font-medium text-gray-700 text-base mb-3">{item.subtitle}</p>
                                                )}
                                                {item.description && (
                                                    <div className="text-gray-600 text-sm leading-relaxed">
                                                        {renderHtmlContent(item.description, false, data.cvLanguage)}
                                                    </div>
                                                )}
                                                {item.url && (
                                                    <div className="mt-3">
                                                        <a
                                                            href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-sm font-medium break-all"
                                                        >
                                                            {item.url}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
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
            <div className="cv-template vertex-template bg-white min-h-[297mm]" style={{ 
                fontFamily: 'var(--cv-font-family, "Courier New", monospace)',
                padding: '20mm',
                lineHeight: '1.5',
                letterSpacing: '0.01em'
            }}>
                {/* Header Section - Tech Professional Style with Perfect Symmetry */}
                <div className="mb-16 pb-12 border-b-2 border-gray-900">
                    {/* Name & Title - Centered */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center">
                            <div className="bg-gray-900 text-white px-10 py-4 text-xl font-mono uppercase tracking-widest shadow-lg">
                                {getFullName(personalInfo, data.cvLanguage)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Contact Information - Perfect Symmetric Grid */}
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-2 gap-16">
                            {/* Left Column */}
                            <div className="space-y-5">
                                {personalInfo.email && (
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                                        <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">
                                            {data.cvLanguage === 'english' ? 'Email' : 'E-poçt'}
                                        </span>
                                        <span className="text-sm text-gray-900 font-mono flex-1 text-right">{personalInfo.email}</span>
                                    </div>
                                )}
                                {personalInfo.phone && (
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                                        <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">
                                            {data.cvLanguage === 'english' ? 'Phone' : 'Telefon'}
                                        </span>
                                        <span className="text-sm text-gray-900 font-mono flex-1 text-right">{personalInfo.phone}</span>
                                    </div>
                                )}
                                {personalInfo.website && (
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                                        <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">
                                            {data.cvLanguage === 'english' ? 'Website' : 'Sayt'}
                                        </span>
                                        <span className="text-sm text-gray-900 font-mono flex-1 text-right truncate">{personalInfo.website}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Right Column */}
                            <div className="space-y-5">
                                {personalInfo.location && (
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                                        <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">
                                            {data.cvLanguage === 'english' ? 'Location' : 'Ünvan'}
                                        </span>
                                        <span className="text-sm text-gray-900 font-mono flex-1 text-right">{personalInfo.location}</span>
                                    </div>
                                )}
                                {personalInfo.linkedin && (
                                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                                        <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">LinkedIn</span>
                                        <a
                                            href={getLinkedInDisplay(personalInfo.linkedin).url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-gray-900 font-mono hover:underline flex-1 text-right truncate"
                                        >
                                            {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                        </a>
                                    </div>
                                )}
                                {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                                    personalInfo.additionalLinks.slice(0, 1).map((link) => (
                                        <div key={link.id} className="flex items-center justify-between border-b border-gray-300 pb-4">
                                            <span className="text-xs uppercase tracking-wider text-gray-600 font-mono w-24 font-semibold">{link.label}</span>
                                            <span className="text-sm text-gray-900 font-mono flex-1 text-right truncate">{link.value}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Draggable Sections with Professional Spacing */}
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div 
                        className={`transition-all duration-300 ${activeId ? 'opacity-95' : ''}`}
                        style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--cv-section-spacing, 24px)'
                        }}
                    >
                        {sectionOrder.map((sectionId) => {
                            const section = generateSection(sectionId);
                            if (!section) return null;

                            return (
                                <SortableItem 
                                    key={sectionId} 
                                    id={sectionId}
                                    showDragInstruction={!isMobile}
                                    dragIconPosition="left"
                                    sectionOrder={sectionOrder}
                                    onSectionReorder={onSectionReorder}
                                    activeSection={activeSection}
                                    onSetActiveSection={onSectionSelect}
                                    isDropTarget={false}
                                >
                                    {section}
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

// Horizon Template Component - Wide, Open Style for Creative Fields
const HorizonTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    const [activeId, setActiveId] = useState<string | null>(null);
    // Mobil yoxlaması aradan qaldırıldı - hər zaman desktop versiyası göstərilir
    const [isMobile, setIsMobile] = useState(false);

    // Mobile device detection removed - always use desktop version
    /* useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); */

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 15,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle section selection for mobile
    const handleSectionClick = (sectionId: string) => {
        if (isMobile && onSectionSelect) {
            const newValue = sectionId === activeSection ? null : sectionId;
            onSectionSelect(newValue);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        
        if (active.id !== over?.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over?.id as string);
            
            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            onSectionReorder(newOrder);
        }
    };

    // Helper component for section header
    const SectionHeader: React.FC<{ title: string; sectionId: string }> = ({ title, sectionId }) => (
        <div 
            className={`mb-6 ${isMobile && activeSection === sectionId ? 'ring-2 ring-gray-400 rounded' : ''}`}
            onClick={() => handleSectionClick(sectionId)}
        >
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wider mb-4 pb-2 border-b border-gray-300">
                {title}
            </h2>
        </div>
    );

    // Generate section components based on order
    const generateSection = (sectionId: string) => {
        switch (sectionId) {
            case 'summary':
                if (!personalInfo.summary) return null;
                return (
                    <div key="summary">
                        <SectionHeader title={getSectionName('summary', data.cvLanguage, data.sectionNames)} sectionId="summary" />
                        <div className="text-gray-700 leading-relaxed text-base mb-2">
                            {renderHtmlContent(personalInfo.summary, false, data.cvLanguage)}
                        </div>
                    </div>
                );

            case 'experience':
                if (!experience.length) return null;
                return (
                    <div key="experience">
                        <SectionHeader title={getSectionName('experience', data.cvLanguage, data.sectionNames)} sectionId="experience" />
                        <div className="space-y-6">
                            {experience.map((exp, index) => (
                                <div key={exp.id || index} >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-lg">{exp.position}</h3>
                                            <h4 className="text-gray-600 text-base font-medium">{exp.company}</h4>
                                        </div>
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            {exp.startDate ? (
                                                exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                formatDate(exp.startDate, data.cvLanguage)
                                            ) : exp.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : exp.endDate ? (
                                                formatDate(exp.endDate, data.cvLanguage)
                                            ) : ''}
                                        </div>
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-600 text-sm leading-relaxed pl-4 border-l-2 border-gray-200">
                                            {renderHtmlContent(exp.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'education':
                if (!education.length) return null;
                return (
                    <div key="education">
                        <SectionHeader title={getSectionName('education', data.cvLanguage, data.sectionNames)} sectionId="education" />
                        <div className="space-y-4">
                            {education.map((edu, index) => (
                                <div key={edu.id || index} >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-base">{edu.degree}</h3>
                                            <h4 className="text-gray-600 text-sm">{edu.institution}</h4>
                                        </div>
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            {edu.startDate ? (
                                                edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                formatDate(edu.startDate, data.cvLanguage)
                                            ) : edu.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : edu.endDate ? (
                                                formatDate(edu.endDate, data.cvLanguage)
                                            ) : ''}
                                        </div>
                                    </div>
                                    {(edu.field || edu.gpa) && (
                                        <div className="text-sm text-gray-500 mb-2">
                                            {edu.field && <span>{edu.field}</span>}
                                            {edu.field && edu.gpa && <span className="mx-2">|</span>}
                                            {edu.gpa && <span>{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</span>}
                                        </div>
                                    )}
                                    {edu.description && (
                                        <div className="text-gray-600 text-sm leading-relaxed">
                                            {renderHtmlContent(edu.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'skills':
                if (!skills.length) return null;
                return (
                    <div key="skills">
                        <SectionHeader title={getSectionName('skills', data.cvLanguage, data.sectionNames)} sectionId="skills" />
                        
                        {/* Technical Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {skills.filter(skill => skill.type === 'hard').map((skill, index) => (
                                        <span key={skill.id || index} className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {skills.filter(skill => skill.type === 'soft').map((skill, index) => (
                                        <span key={skill.id || index} className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded border">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Core Competencies */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-2">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill, index) => (
                                        <span key={skill.id || index} className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'projects':
                if (!projects.length) return null;
                return (
                    <div key="projects">
                        <SectionHeader title={getSectionName('projects', data.cvLanguage, data.sectionNames)} sectionId="projects" />
                        <div className="space-y-6">
                            {projects.map((project, index) => (
                                <div key={project.id || index} >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-800 text-lg underline hover:no-underline"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-bold text-gray-800 text-lg">{project.name}</h3>
                                            )}
                                        </div>
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            {project.current ? (
                                                project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : getCurrentText(data.cvLanguage)
                                            ) : project.startDate && project.endDate ? (
                                                `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                            ) : (
                                                formatDate((project.startDate || project.endDate) || '', data.cvLanguage)
                                            )}
                                        </div>
                                    </div>
                                    
                                    {project.description && (
                                        <div className="text-gray-600 text-sm leading-relaxed mb-3">
                                            {renderHtmlContent(project.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                    
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {project.technologies.map((tech, i) => (
                                                <span key={i} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'languages':
                if (!languages.length) return null;
                return (
                    <div key="languages">
                        <SectionHeader title={getSectionName('languages', data.cvLanguage, data.sectionNames)} sectionId="languages" />
                        <div className="grid grid-cols-2 gap-4">
                            {languages.map((lang, index) => (
                                <div key={lang.id || index} className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">{lang.language}</span>
                                    <span className="text-sm text-gray-500">
                                        {getLanguageLevel(lang.level, data.cvLanguage)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'certifications':
                if (!certifications.length) return null;
                return (
                    <div key="certifications">
                        <SectionHeader title={getSectionName('certifications', data.cvLanguage, data.sectionNames)} sectionId="certifications" />
                        <div className="space-y-4">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold text-gray-800 text-base underline hover:no-underline"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-bold text-gray-800 text-base">{cert.name}</h3>
                                            )}
                                            <p className="text-gray-600 text-sm">{cert.issuer}</p>
                                        </div>
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            {cert.date && formatDate(cert.date, data.cvLanguage)}
                                        </div>
                                    </div>
                                    {cert.description && (
                                        <div className="text-gray-600 text-sm leading-relaxed">
                                            {renderHtmlContent(cert.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'volunteer':
                if (!volunteerExperience.length) return null;
                return (
                    <div key="volunteer">
                        <SectionHeader title={getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)} sectionId="volunteer" />
                        <div className="space-y-6">
                            {volunteerExperience.map((vol, index) => (
                                <div key={vol.id || index} >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-base">{vol.role}</h3>
                                            <h4 className="text-gray-600 text-sm">{vol.organization}</h4>
                                        </div>
                                        <div className="text-right text-sm text-gray-500 ml-4">
                                            {vol.startDate ? (
                                                vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                formatDate(vol.startDate, data.cvLanguage)
                                            ) : vol.current ? (
                                                getCurrentText(data.cvLanguage)
                                            ) : vol.endDate ? (
                                                formatDate(vol.endDate, data.cvLanguage)
                                            ) : ''}
                                        </div>
                                    </div>
                                    {vol.description && (
                                        <div className="text-gray-600 text-sm leading-relaxed">
                                            {renderHtmlContent(vol.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

                            case 'customSections':
                if (!customSections.length) return null;
                return (
                    <div key="customSections">
                        {customSections.map((customSection, sectionIndex) => (
                            <div key={customSection.id || sectionIndex} className={sectionIndex > 0 ? "mt-10" : ""}>
                                <SectionHeader title={customSection.title} sectionId={`custom-${customSection.id}`} />
                                <div className="space-y-4">
                                    {customSection.items.map((item, index) => (
                                        <div key={item.id || index} >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex-1">
                                                    {item.title && (
                                                        <h3 className="font-bold text-gray-800 text-base">{item.title}</h3>
                                                    )}
                                                    {item.subtitle && (
                                                        <p className="text-gray-600 text-sm">{item.subtitle}</p>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm text-gray-500 ml-4">
                                                    {item.date && formatDate(item.date, data.cvLanguage)}
                                                </div>
                                            </div>
                                            {item.description && (
                                                <div className="text-gray-600 text-sm leading-relaxed">
                                                    {renderHtmlContent(item.description, false, data.cvLanguage)}
                                                </div>
                                            )}
                                            {item.url && (
                                                <div className="mt-2">
                                                    <a
                                                        href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-sm break-all"
                                                    >
                                                        {item.url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                // Handle individual custom sections
                if (sectionId.startsWith('custom-')) {
                    const customSectionId = sectionId.replace('custom-', '');
                    const customSection = customSections.find(section => section.id === customSectionId);
                    if (!customSection || !customSection.items.length) return null;

                    return (
                        <div key={sectionId}>
                            <SectionHeader title={customSection.title} sectionId={sectionId} />
                            <div className="space-y-4">
                                {customSection.items.map((item, index) => (
                                    <div key={item.id || index} >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                {item.title && (
                                                    <h3 className="font-bold text-gray-800 text-base">{item.title}</h3>
                                                )}
                                                {item.subtitle && (
                                                    <p className="text-gray-600 text-sm">{item.subtitle}</p>
                                                )}
                                            </div>
                                            <div className="text-right text-sm text-gray-500 ml-4">
                                                {item.date && formatDate(item.date, data.cvLanguage)}
                                            </div>
                                        </div>
                                        {item.description && (
                                            <div className="text-gray-600 text-sm leading-relaxed">
                                                {renderHtmlContent(item.description, false, data.cvLanguage)}
                                            </div>
                                        )}
                                        {item.url && (
                                            <div className="mt-2">
                                                <a
                                                    href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-sm break-all"
                                                >
                                                    {item.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
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
            <div className="cv-template horizon-template bg-white min-h-[297mm]" style={{ 
                fontFamily: 'var(--cv-font-family, "Arial", sans-serif)',
                padding: '20mm',
                lineHeight: '1.6',
                letterSpacing: '0.02em'
            }}>
                {/* Header Section - Wide, Open Style */}
                <div className="mb-12 text-center">
                    {/* Name */}
                    <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-widest mb-6" style={{ letterSpacing: '0.3em' }}>
                        {getFullName(personalInfo, data.cvLanguage)}
                    </h1>
                    
                    {/* Contact Information - Single Row Layout */}
                    <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 mb-8">
                        {personalInfo.phone && (
                            <div className="flex items-center gap-2">
                                <span>📞</span>
                                <span>{personalInfo.phone}</span>
                            </div>
                        )}
                        {personalInfo.email && (
                            <div className="flex items-center gap-2">
                                <span>✉</span>
                                <span>{personalInfo.email}</span>
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{personalInfo.location}</span>
                            </div>
                        )}
                        {personalInfo.website && (
                            <div className="flex items-center gap-2">
                                <span>🌐</span>
                                <span>{personalInfo.website}</span>
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-center gap-2">
                                <span>💼</span>
                                <a
                                    href={getLinkedInDisplay(personalInfo.linkedin).url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                >
                                    {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                </a>
                            </div>
                        )}
                    </div>
                    
                    {/* Divider Line */}
                    <div className="w-full h-px bg-gray-300 mb-8"></div>
                </div>

                {/* Main Content - Two Column Layout for Creative Fields */}
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div 
                        className={`transition-all duration-300 ${activeId ? 'opacity-95' : ''}`}
                        style={{ 
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: isMobile ? '2rem' : '3rem',
                            alignItems: 'start'
                        }}
                    >
                        {/* Smart section distribution for balanced layout */}
                        {(() => {
                            // Filter available sections (only those with content)
                            const availableSections = sectionOrder.filter(sectionId => {
                                const section = generateSection(sectionId);
                                return section !== null;
                            });

                            console.log('🎨 Horizon Template - Available sections:', availableSections);

                            // For mobile: show all sections in single column
                            if (isMobile) {
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cv-section-spacing, 24px)' }}>
                                        {availableSections.map((sectionId) => {
                                            const section = generateSection(sectionId);
                                            if (!section) return null;

                                            return (
                                                <SortableItem 
                                                    key={sectionId} 
                                                    id={sectionId}
                                                    showDragInstruction={!isMobile}
                                                    dragIconPosition="left"
                                                    sectionOrder={sectionOrder}
                                                    onSectionReorder={onSectionReorder}
                                                    activeSection={activeSection}
                                                    onSetActiveSection={onSectionSelect}
                                                    isDropTarget={false}
                                                >
                                                    {section}
                                                </SortableItem>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            // For desktop: smart distribution
                            const totalSections = availableSections.length;
                            const leftCount = Math.ceil(totalSections / 2); // Left column gets one more if odd number
                            const rightCount = totalSections - leftCount;

                            const leftSections = availableSections.slice(0, leftCount);
                            const rightSections = availableSections.slice(leftCount);

                            console.log(`🎨 Horizon Layout Distribution:`, {
                                total: totalSections,
                                left: leftCount,
                                right: rightCount,
                                leftSections,
                                rightSections
                            });

                            return (
                                <>
                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cv-section-spacing, 24px)' }}>
                                        {leftSections.map((sectionId) => {
                                            const section = generateSection(sectionId);
                                            if (!section) return null;

                                            return (
                                                <SortableItem 
                                                    key={sectionId} 
                                                    id={sectionId}
                                                    showDragInstruction={!isMobile}
                                                    dragIconPosition="left"
                                                    sectionOrder={sectionOrder}
                                                    onSectionReorder={onSectionReorder}
                                                    activeSection={activeSection}
                                                    onSetActiveSection={onSectionSelect}
                                                    isDropTarget={false}
                                                >
                                                    {section}
                                                </SortableItem>
                                            );
                                        })}
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cv-section-spacing, 24px)' }}>
                                        {rightSections.map((sectionId) => {
                                            const section = generateSection(sectionId);
                                            if (!section) return null;

                                            return (
                                                <SortableItem 
                                                    key={sectionId} 
                                                    id={sectionId}
                                                    showDragInstruction={!isMobile}
                                                    dragIconPosition="left"
                                                    sectionOrder={sectionOrder}
                                                    onSectionReorder={onSectionReorder}
                                                    activeSection={activeSection}
                                                    onSetActiveSection={onSectionSelect}
                                                    isDropTarget={false}
                                                >
                                                    {section}
                                                </SortableItem>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

// Aurora Template Component - Modern Minimal ATS-Friendly Design
const AuroraTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    const [activeId, setActiveId] = useState<string | null>(null);
    // Mobil yoxlaması aradan qaldırıldı - hər zaman desktop versiyası göstərilir
    const [isMobile, setIsMobile] = useState(false);

    // Mobile device detection removed - always use desktop version
    /* useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []); */

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 15,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle section selection for mobile
    const handleSectionClick = (sectionId: string) => {
        if (isMobile && onSectionSelect) {
            const newValue = sectionId === activeSection ? null : sectionId;
            onSectionSelect(newValue);
        }
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        
        if (active.id !== over?.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over?.id as string);
            
            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            onSectionReorder(newOrder);
        }
    };

    // Helper component for section header
    const SectionHeader: React.FC<{ title: string; sectionId: string }> = ({ title, sectionId }) => (
        <div 
            className={`mb-3 ${isMobile && activeSection === sectionId ? 'ring-2 ring-gray-400 rounded' : ''}`}
            onClick={() => handleSectionClick(sectionId)}
        >
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
                {title}
            </h2>
        </div>
    );

    // Generate section components based on order
    const generateSection = (sectionId: string) => {
        switch (sectionId) {
            case 'summary':
                if (!personalInfo.summary) return null;
                return (
                    <div key="summary">
                        <SectionHeader title={getSectionName('summary', data.cvLanguage, data.sectionNames)} sectionId="summary" />
                        <div className="text-gray-700 leading-relaxed text-sm">
                            {renderHtmlContent(personalInfo.summary, false, data.cvLanguage)}
                        </div>
                    </div>
                );

            case 'experience':
                if (!experience.length) return null;
                return (
                    <div key="experience">
                        <SectionHeader title={getSectionName('experience', data.cvLanguage, data.sectionNames)} sectionId="experience" />
                        <div className="space-y-3">
                            {experience.map((exp, index) => (
                                <div key={exp.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-sm">{exp.position}</h3>
                                            <p className="font-medium text-gray-700 text-xs mt-0.5">{exp.company}</p>
                                        </div>
                                        {(exp.startDate || exp.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right ml-4 flex-shrink-0">
                                                {exp.startDate ? (
                                                    exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                    formatDate(exp.startDate, data.cvLanguage)
                                                ) : exp.current ? (
                                                    getCurrentText(data.cvLanguage)
                                                ) : exp.endDate ? (
                                                    formatDate(exp.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                            {renderHtmlContent(exp.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'education':
                if (!education.length) return null;
                return (
                    <div key="education">
                        <SectionHeader title={getSectionName('education', data.cvLanguage, data.sectionNames)} sectionId="education" />
                        <div className="space-y-3">
                            {education.map((edu, index) => (
                                <div key={edu.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-sm">{edu.degree}</h3>
                                            <p className="font-medium text-gray-700 text-xs mt-0.5">{edu.institution}</p>
                                            {(edu.field || edu.gpa) && (
                                                <div className="text-xs text-gray-600 mt-1">
                                                    {edu.field && <span>{edu.field}</span>}
                                                    {edu.field && edu.gpa && <span className="mx-1">•</span>}
                                                    {edu.gpa && <span>{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</span>}
                                                </div>
                                            )}
                                        </div>
                                        {(edu.startDate || edu.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right ml-4 flex-shrink-0">
                                                {edu.startDate ? (
                                                    edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                    formatDate(edu.startDate, data.cvLanguage)
                                                ) : edu.current ? (
                                                    getCurrentText(data.cvLanguage)
                                                ) : edu.endDate ? (
                                                    formatDate(edu.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {edu.description && (
                                        <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                            {renderHtmlContent(edu.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'skills':
                if (!skills.length) return null;
                return (
                    <div key="skills">
                        <SectionHeader title={getSectionName('skills', data.cvLanguage, data.sectionNames)} sectionId="skills" />
                        
                        {/* Hard Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">{getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}</h3>
                                <div className="text-sm text-gray-700">
                                    {skills.filter(skill => skill.type === 'hard').map(skill => skill.name).join(' • ')}
                                </div>
                            </div>
                        )}

                        {/* Soft Skills */}
                        {skills.filter(skill => skill.type === 'soft').length > 0 && (
                            <div className="mb-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">{getSectionName('softSkills', data.cvLanguage, data.sectionNames)}</h3>
                                <div className="text-sm text-gray-700">
                                    {skills.filter(skill => skill.type === 'soft').map(skill => skill.name).join(' • ')}
                                </div>
                            </div>
                        )}

                        {/* Default/Other Skills */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-3">
                                <h3 className="text-sm font-semibold text-gray-800 mb-2">{getSectionName('coreCompetencies', data.cvLanguage, data.sectionNames)}</h3>
                                <div className="text-sm text-gray-700">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map(skill => skill.name).join(' • ')}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'projects':
                if (!projects.length) return null;
                return (
                    <div key="projects">
                        <SectionHeader title={getSectionName('projects', data.cvLanguage, data.sectionNames)} sectionId="projects" />
                        <div className="space-y-3">
                            {projects.map((project, index) => (
                                <div key={project.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-gray-900 text-sm underline hover:no-underline"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-sm">{project.name}</h3>
                                            )}
                                        </div>
                                        {(project.startDate || project.endDate || project.current) && (
                                            <div className="text-xs text-gray-600 font-medium text-right ml-4 flex-shrink-0">
                                                {project.current ? (
                                                    project.startDate ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : getCurrentText(data.cvLanguage)
                                                ) : project.startDate && project.endDate ? (
                                                    `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
                                                ) : (
                                                    formatDate((project.startDate || project.endDate) || '', data.cvLanguage)
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {project.description && (
                                        <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                            {renderHtmlContent(project.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            <span className="font-medium">
                                                {data.cvLanguage?.includes('en') ? 'Technologies: ' : 
                                                 data.cvLanguage?.includes('tr') ? 'Teknolojiler: ' : 'Texnologiyalar: '}
                                            </span>
                                            {project.technologies.join(' • ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'languages':
                if (!languages.length) return null;
                return (
                    <div key="languages">
                        <SectionHeader title={getSectionName('languages', data.cvLanguage, data.sectionNames)} sectionId="languages" />
                        <div className="grid grid-cols-2 gap-3">
                            {languages.map((lang, index) => (
                                <div key={lang.id || index} className="text-sm">
                                    <span className="font-medium text-gray-800">{lang.language}</span>
                                    <span className="text-gray-600 ml-2">({getLanguageLevel(lang.level, data.cvLanguage)})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'certifications':
                if (!certifications.length) return null;
                return (
                    <div key="certifications">
                        <SectionHeader title={getSectionName('certifications', data.cvLanguage, data.sectionNames)} sectionId="certifications" />
                        <div className="space-y-3">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-gray-900 text-sm underline hover:no-underline"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-sm">{cert.name}</h3>
                                            )}
                                            <p className="text-xs text-gray-700 mt-0.5">{cert.issuer}</p>
                                        </div>
                                        {cert.date && (
                                            <div className="text-xs text-gray-600 font-medium text-right ml-4 flex-shrink-0">
                                                {formatDate(cert.date, data.cvLanguage)}
                                            </div>
                                        )}
                                    </div>
                                    {cert.description && (
                                        <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                            {renderHtmlContent(cert.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'volunteer':
                if (!volunteerExperience.length) return null;
                return (
                    <div key="volunteer">
                        <SectionHeader title={getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)} sectionId="volunteer" />
                        <div className="space-y-3">
                            {volunteerExperience.map((vol, index) => (
                                <div key={vol.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-sm">{vol.role}</h3>
                                            <p className="font-medium text-gray-700 text-xs mt-0.5">{vol.organization}</p>
                                        </div>
                                        {(vol.startDate || vol.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right ml-4 flex-shrink-0">
                                                {vol.startDate ? (
                                                    vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                    formatDate(vol.startDate, data.cvLanguage)
                                                ) : vol.current ? (
                                                    getCurrentText(data.cvLanguage)
                                                ) : vol.endDate ? (
                                                    formatDate(vol.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {vol.description && (
                                        <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                            {renderHtmlContent(vol.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'customSections':
                if (!customSections.length) return null;
                return (
                    <div key="customSections">
                        {customSections.map((customSection, sectionIndex) => (
                            <div key={customSection.id || sectionIndex} className="mb-4">
                                <SectionHeader title={customSection.title} sectionId={`custom-${customSection.id}`} />
                                <div className="space-y-3">
                                    {customSection.items.map((item, index) => (
                                        <div key={item.id || index} className="border-b border-gray-100 last:border-b-0 pb-2">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex-1">
                                                    {item.title && (
                                                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                                                    )}
                                                    {item.subtitle && (
                                                        <p className="font-medium text-gray-700 text-xs mt-0.5">{item.subtitle}</p>
                                                    )}
                                                </div>
                                                {item.date && (
                                                    <span className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                        {formatDate(item.date, data.cvLanguage)}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <div className="text-gray-600 text-xs leading-relaxed text-left mt-2">
                                                    {renderHtmlContent(item.description, false, data.cvLanguage)}
                                                </div>
                                            )}
                                            {item.url && (
                                                <div className="mt-2">
                                                    <a
                                                        href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-xs break-all"
                                                    >
                                                        {item.url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                // Handle individual custom sections
                if (sectionId.startsWith('custom-')) {
                    const customSectionId = sectionId.replace('custom-', '');
                    const customSection = customSections.find(section => section.id === customSectionId);
                    if (!customSection || !customSection.items.length) return null;

                    return (
                        <div key={sectionId}>
                            <SectionHeader title={customSection.title} sectionId={sectionId} />
                            <div className="space-y-3">
                                {customSection.items.map((item, index) => (
                                    <div key={item.id || index} className="border-b border-gray-100 last:border-b-0 pb-3">
                                        {item.title && (
                                            <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                                        )}
                                        {item.subtitle && (
                                            <p className="font-medium text-gray-700 text-sm mb-1">{item.subtitle}</p>
                                        )}
                                        {item.date && (
                                            <p className="text-xs text-gray-600 font-medium mb-2">
                                                {formatDate(item.date, data.cvLanguage)}
                                            </p>
                                        )}
                                        {item.description && (
                                            <div className="text-gray-600 text-sm leading-relaxed">
                                                {renderHtmlContent(item.description, false, data.cvLanguage)}
                                            </div>
                                        )}
                                        {item.url && (
                                            <div className="mt-2">
                                                <a
                                                    href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-sm break-all"
                                                >
                                                    {item.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
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
            <div className="cv-template aurora-template bg-white min-h-[297mm]" style={{ 
                fontFamily: 'var(--cv-font-family, "Arial", sans-serif)',
                padding: '20mm'
            }}>
                {/* Header Section - Clean and Professional */}
                <div className="mb-6 pb-4 border-b-2 border-gray-900">
                    <div className="text-center">
                        {/* Name */}
                        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-wide">
                            {getFullName(personalInfo, data.cvLanguage)}
                        </h1>
                        
                        {/* Contact Information - Split into two lines */}
                        <div className="text-center space-y-1 text-sm text-gray-700">
                            {(() => {
                                // First line: email, phone, location
                                const firstLineItems = [];
                                if (personalInfo.email) firstLineItems.push(personalInfo.email);
                                if (personalInfo.phone) firstLineItems.push(personalInfo.phone);
                                if (personalInfo.location) firstLineItems.push(personalInfo.location);
                                
                                // Second line: linkedin, website
                                const secondLineItems = [];
                                if (personalInfo.linkedin) secondLineItems.push(getLinkedInDisplay(personalInfo.linkedin).displayText);
                                if (personalInfo.website) secondLineItems.push(personalInfo.website);
                                
                                return (
                                    <>
                                        {firstLineItems.length > 0 && (
                                            <div className="flex flex-wrap justify-center items-center gap-2">
                                                {firstLineItems.map((item, index) => (
                                                    <React.Fragment key={`first-${index}`}>
                                                        <span>{item}</span>
                                                        {index < firstLineItems.length - 1 && (
                                                            <span className="text-gray-500">•</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                        {secondLineItems.length > 0 && (
                                            <div className="flex flex-wrap justify-center items-center gap-2">
                                                {secondLineItems.map((item, index) => (
                                                    <React.Fragment key={`second-${index}`}>
                                                        <span>{item}</span>
                                                        {index < secondLineItems.length - 1 && (
                                                            <span className="text-gray-500">•</span>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Main Content - Draggable Sections */}
                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div 
                        className={`transition-all duration-300 ${activeId ? 'opacity-95' : ''}`}
                        style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        {sectionOrder.map((sectionId) => {
                            const section = generateSection(sectionId);
                            if (!section) return null;

                            return (
                                <SortableItem 
                                    key={sectionId} 
                                    id={sectionId}
                                    showDragInstruction={!isMobile}
                                    dragIconPosition="left"
                                    sectionOrder={sectionOrder}
                                    onSectionReorder={onSectionReorder}
                                    activeSection={activeSection}
                                    onSetActiveSection={onSectionSelect}
                                    isDropTarget={false}
                                >
                                    {section}
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>
            </div>
        </DndContext>
    );
};

// Exclusive Template Component - Professional and Modern
const ExclusiveTemplate: React.FC<{ 
    data: CVData; 
    sectionOrder: string[]; 
    onSectionReorder: (newOrder: string[]) => void;
    activeSection?: string | null;
    onSectionSelect?: (sectionId: string | null) => void;
}> = ({ data, sectionOrder, onSectionReorder, activeSection, onSectionSelect }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;

    const [activeId, setActiveId] = useState<string | null>(null);
    // Mobil yoxlaması aradan qaldırıldı - hər zaman desktop versiyası göstərilir
    const isMobile = false; // window.innerWidth <= 768;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 15,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle section selection for mobile - disabled for consistent desktop experience
    const handleSectionClick = (sectionId: string) => {
        // Mobile section selection disabled - always use desktop version
        /* if (isMobile && onSectionSelect) {
            const newValue = sectionId === activeSection ? null : sectionId;
            onSectionSelect(newValue);
        } */
    };

    // Drag and drop handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        
        if (active.id !== over?.id) {
            const oldIndex = sectionOrder.indexOf(active.id as string);
            const newIndex = sectionOrder.indexOf(over?.id as string);
            
            const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
            onSectionReorder(newOrder);
        }
    };

    // Helper component for section header - mobile interactions disabled
    const SectionHeader: React.FC<{ title: string; icon?: string; sectionId: string }> = ({ title, icon, sectionId }) => (
        <div className="mb-2">
            <h2 className="text-sm font-bold text-gray-800 border-b-2 border-blue-600 pb-1">
                {title}
            </h2>
        </div>
    );

    // Generate section components based on order
    const generateSection = (sectionId: string) => {
        switch (sectionId) {
            case 'summary':
                if (!personalInfo.summary) return null;
                return (
                    <div key="summary" >
                        <SectionHeader title={getSectionName('summary', data.cvLanguage, data.sectionNames)} icon="📝" sectionId="summary" />
                        <div className="text-gray-700 leading-relaxed text-sm text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                            {renderHtmlContent(personalInfo.summary, false, data.cvLanguage)}
                        </div>
                    </div>
                );

            case 'experience':
                if (!experience.length) return null;
                return (
                    <div key="experience" >
                        <SectionHeader title={getSectionName('experience', data.cvLanguage, data.sectionNames)} icon="💼" sectionId="experience" />
                        <div className="space-y-2">
                            {experience.map((exp, index) => (
                                <div key={exp.id || index} className="pb-1">
                                    <div className="flex flex-row items-start justify-between gap-3 mb-1">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-gray-800">{exp.position}</h3>
                                            <h4 className="font-medium text-blue-600 text-xs mt-0.5">{exp.company}</h4>
                                        </div>
                                        {(exp.startDate || exp.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                {exp.startDate ? (
                                                    exp.current ? `${formatDate(exp.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    exp.endDate ? `${formatDate(exp.startDate, data.cvLanguage)} - ${formatDate(exp.endDate, data.cvLanguage)}` :
                                                    formatDate(exp.startDate, data.cvLanguage)
                                                ) : exp.endDate ? (
                                                    formatDate(exp.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {exp.description && (
                                        <div className="text-gray-700 leading-relaxed text-xs text-left mt-1" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                            {renderHtmlContent(exp.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'education':
                if (!education.length) return null;
                return (
                    <div key="education" >
                        <SectionHeader title={getSectionName('education', data.cvLanguage, data.sectionNames)} icon="🎓" sectionId="education" />
                        <div className="space-y-3">
                            {education.map((edu, index) => (
                                <div key={edu.id || index} className="pb-2">
                                    <div className="flex flex-row items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-gray-800">{edu.degree}</h3>
                                            <h4 className="font-medium text-blue-600 text-xs mt-1">{edu.institution}</h4>
                                            {(edu.field || edu.gpa) && (
                                                <div className="text-xs text-gray-700 mt-1">
                                                    {edu.field && <span className="italic">{edu.field}</span>}
                                                    {edu.field && edu.gpa && <span className="mx-2">•</span>}
                                                    {edu.gpa && <span><strong>{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}:</strong> {edu.gpa}</span>}
                                                </div>
                                            )}
                                        </div>
                                        {(edu.startDate || edu.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                {edu.startDate ? (
                                                    edu.current ? `${formatDate(edu.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    edu.endDate ? `${formatDate(edu.startDate, data.cvLanguage)} - ${formatDate(edu.endDate, data.cvLanguage)}` :
                                                    formatDate(edu.startDate, data.cvLanguage)
                                                ) : edu.endDate ? (
                                                    formatDate(edu.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {edu.description && (
                                        <div className="text-gray-700 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                            {renderHtmlContent(edu.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'skills':
                if (!skills.length) return null;
                
                const hardSkills = skills.filter(skill => skill.type === 'hard');
                const softSkills = [
                    ...skills.filter(skill => skill.type === 'soft'),
                    ...skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft'))
                ];
                
                return (
                    <div key="skills">
                        {/* Technical Skills as main section */}
                        {hardSkills.length > 0 && (
                            <div className="mb-3">
                                <SectionHeader 
                                    title={data.cvLanguage?.includes('en') ? 'Technical Skills' : 
                                           data.cvLanguage?.includes('tr') ? 'Teknik Beceriler' : 'Texniki Bacarıqlar'} 
                                    icon="⚙️" 
                                    sectionId="technical-skills" 
                                />
                                <div className="flex flex-wrap gap-1">
                                    {hardSkills.map((skill, index) => (
                                        <span key={skill.id || index} className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Soft Skills as main section */}
                        {softSkills.length > 0 && (
                            <div className="mb-3">
                                <SectionHeader 
                                    title={data.cvLanguage?.includes('en') ? 'Soft Skills' : 
                                           data.cvLanguage?.includes('tr') ? 'Kişisel Beceriler' : 'Şəxsi Bacarıqlar'} 
                                    icon="🤝" 
                                    sectionId="soft-skills" 
                                />
                                <div className="flex flex-wrap gap-1">
                                    {softSkills.map((skill, index) => (
                                        <span key={skill.id || index} className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'projects':
                if (!projects.length) return null;
                return (
                    <div key="projects" >
                        <SectionHeader title={getSectionName('projects', data.cvLanguage, data.sectionNames)} icon="🚀" sectionId="projects" />
                        <div className="space-y-3">
                            {projects.map((project, index) => (
                                <div key={project.id || index} className="pb-2">
                                    <div className="flex flex-row items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            {project.url ? (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-sm text-gray-900 hover:text-gray-700 underline transition-colors"
                                                >
                                                    {project.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-sm text-gray-800">{project.name}</h3>
                                            )}
                                        </div>
                                        {(project.startDate || project.endDate || project.current) && (
                                            <span className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
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
                                    {project.description && (
                                        <div className="text-gray-700 mb-2 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                            {renderHtmlContent(project.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <p className="text-xs text-gray-600 mb-1">
                                            <span className="font-medium text-gray-800">
                                                {data.cvLanguage?.includes('en') ? 'Technologies:' : 
                                                 data.cvLanguage?.includes('tr') ? 'Teknolojiler:' : 'Texnologiyalar:'}
                                            </span>{' '}
                                            {project.technologies.join(', ')}
                                        </p>
                                    )}
                                    {project.github && (
                                        <div className="text-xs text-gray-600">
                                            <span className="font-medium">GitHub:</span>{' '}
                                            <a
                                                href={project.github.startsWith('http') ? project.github : `https://github.com/${project.github}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer break-all"
                                            >
                                                {project.github}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'languages':
                if (!languages.length) return null;
                return (
                    <div key="languages" >
                        <SectionHeader title={getSectionName('languages', data.cvLanguage, data.sectionNames)} icon="🌍" sectionId="languages" />
                        <div className="grid grid-cols-2 gap-2">
                            {languages.map((lang, index) => (
                                <div key={lang.id || index} className="bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-800 text-xs">{lang.language}</span>
                                        <span className="bg-gray-200 text-gray-800 px-2 py-0.5 text-xs font-medium rounded">
                                            {getLanguageLevel(lang.level, data.cvLanguage)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'certifications':
                if (!certifications.length) return null;
                return (
                    <div key="certifications" >
                        <SectionHeader title={getSectionName('certifications', data.cvLanguage, data.sectionNames)} icon="🏆" sectionId="certifications" />
                        <div className="space-y-3">
                            {certifications.map((cert, index) => (
                                <div key={cert.id || index} className="pb-2">
                                    <div className="flex flex-row items-start justify-between gap-3 mb-1">
                                        <div className="flex-1">
                                            {cert.url ? (
                                                <a
                                                    href={cert.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-sm text-gray-800 hover:text-blue-600 underline transition-colors"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <h3 className="font-semibold text-sm text-gray-800">{cert.name}</h3>
                                            )}
                                            <p className="text-blue-600 font-medium text-xs mt-1">{cert.issuer}</p>
                                        </div>
                                        {cert.date && (
                                            <span className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                {formatDate(cert.date, data.cvLanguage)}
                                            </span>
                                        )}
                                    </div>
                                    {cert.description && (
                                        <div className="text-gray-700 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                            {renderHtmlContent(cert.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'volunteer':
                if (!volunteerExperience.length) return null;
                return (
                    <div key="volunteer" >
                        <SectionHeader title={getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)} icon="🤝" sectionId="volunteer" />
                        <div className="space-y-3">
                            {volunteerExperience.map((vol, index) => (
                                <div key={vol.id || index}>
                                    <div className="flex flex-row items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-gray-800">{vol.role}</h3>
                                            <h4 className="font-medium text-blue-600 text-xs mt-1">{vol.organization}</h4>
                                        </div>
                                        {(vol.startDate || vol.endDate) && (
                                            <div className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                {vol.startDate ? (
                                                    vol.current ? `${formatDate(vol.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : 
                                                    vol.endDate ? `${formatDate(vol.startDate, data.cvLanguage)} - ${formatDate(vol.endDate, data.cvLanguage)}` :
                                                    formatDate(vol.startDate, data.cvLanguage)
                                                ) : vol.endDate ? (
                                                    formatDate(vol.endDate, data.cvLanguage)
                                                ) : ''}
                                            </div>
                                        )}
                                    </div>
                                    {vol.description && (
                                        <div className="text-gray-700 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                            {renderHtmlContent(vol.description, false, data.cvLanguage)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'customSections':
                if (!customSections.length) return null;
                return (
                    <div key="customSections" >
                        {customSections.map((customSection, sectionIndex) => (
                            <div key={customSection.id || sectionIndex} >
                                <SectionHeader title={customSection.title} icon="📋" sectionId={`custom-${customSection.id}`} />
                                <div className="space-y-3">
                                    {customSection.items.map((item, index) => (
                                        <div key={item.id || index} className="pb-2">
                                            <div className="flex flex-row items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    {item.title && (
                                                        <h3 className="font-semibold text-sm text-gray-800">{item.title}</h3>
                                                    )}
                                                    {item.subtitle && (
                                                        <h4 className="font-medium text-blue-600 text-xs mt-1">{item.subtitle}</h4>
                                                    )}
                                                </div>
                                                {item.date && (
                                                    <span className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                        {formatDate(item.date, data.cvLanguage)}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <div className="text-gray-700 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                                    {renderHtmlContent(item.description, false, data.cvLanguage)}
                                                </div>
                                            )}
                                            {item.url && (
                                                <div className="mt-2">
                                                    <a
                                                        href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-xs break-all"
                                                    >
                                                        {item.url}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );

            default:
                // Handle individual custom sections
                if (sectionId.startsWith('custom-')) {
                    const customSectionId = sectionId.replace('custom-', '');
                    const customSection = customSections.find(section => section.id === customSectionId);
                    if (!customSection || !customSection.items.length) return null;

                    return (
                        <div key={sectionId} >
                            <SectionHeader title={customSection.title} icon="📋" sectionId={sectionId} />
                            <div className="space-y-3">
                                {customSection.items.map((item, index) => (
                                    <div key={item.id || index} className="pb-2">
                                        <div className="flex flex-row items-start justify-between gap-3 mb-2">
                                            <div className="flex-1">
                                                {item.title && (
                                                    <h3 className="font-semibold text-sm text-gray-800">{item.title}</h3>
                                                )}
                                                {item.subtitle && (
                                                    <h4 className="font-medium text-blue-600 text-xs mt-1">{item.subtitle}</h4>
                                                )}
                                            </div>
                                            {item.date && (
                                                <span className="text-xs text-gray-600 font-medium text-right flex-shrink-0">
                                                    {formatDate(item.date, data.cvLanguage)}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <div className="text-gray-700 leading-relaxed text-xs text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                                                {renderHtmlContent(item.description, false, data.cvLanguage)}
                                            </div>
                                        )}
                                        {item.url && (
                                            <div className="mt-2">
                                                <a
                                                    href={(item.url)?.startsWith('http') ? (item.url) : `https://${(item.url)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors cursor-pointer text-xs break-all"
                                                >
                                                    {item.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
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
            <div className="cv-template exclusive-template bg-white min-h-[297mm]" style={{ fontFamily: 'var(--cv-font-family, "Inter", sans-serif)', padding: '20mm' }}>
                {/* Header Section - Enhanced Professional Design */}
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex flex-row gap-6 items-center">
                                {/* Profile Image */}
                                {personalInfo.profileImage && (
                                    <div className="flex justify-start flex-shrink-0">
                                        <div className="relative">
                                            <img
                                                src={personalInfo.profileImage}
                                                alt="Profile"
                                                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg"
                                            />
                                            <div className="absolute inset-0 rounded-full border-2 border-blue-600 opacity-20"></div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex-1 text-left">
                                    {/* Name with enhanced styling */}
                                    <h1 className="text-2xl font-bold mb-3 tracking-wide text-gray-900">
                                        {getFullName(personalInfo, data.cvLanguage)}
                                    </h1>
                                </div>
                            </div>
                            
                            {/* Contact Information Grid - Enhanced */}
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <div className="grid grid-cols-3 gap-4">
                                    {personalInfo.email && (
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-blue-600 uppercase font-bold mb-1">
                                                <p>
                                                    {data.cvLanguage?.includes('en') ? 'Email' : 
                                                     data.cvLanguage?.includes('tr') ? 'E-posta' : 'E-poçt'}
                                                </p>
                                            </div>
                                            <p className="text-gray-800 font-medium text-sm">{personalInfo.email}</p>
                                        </div>
                                    )}
                                    
                                    {personalInfo.phone && (
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-blue-600 uppercase font-bold mb-1">
                                                <p>
                                                    {data.cvLanguage?.includes('en') ? 'Phone' : 
                                                     data.cvLanguage?.includes('tr') ? 'Telefon' : 'Telefon'}
                                                </p>
                                            </div>
                                            <p className="text-gray-800 font-medium text-sm">{personalInfo.phone}</p>
                                        </div>
                                    )}
                                    
                                    {personalInfo.location && (
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-blue-600 uppercase font-bold mb-1">
                                                <p>
                                                    {data.cvLanguage?.includes('en') ? 'Location' : 
                                                     data.cvLanguage?.includes('tr') ? 'Lokasyon' : 'Ünvan'}
                                                </p>
                                            </div>
                                            <p className="text-gray-800 font-medium text-sm">{personalInfo.location}</p>
                                        </div>
                                    )}
                                    
                                    {personalInfo.linkedin && (
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-blue-600 uppercase font-bold mb-1">
                                                <p>LinkedIn</p>
                                            </div>
                                            <a
                                                href={getLinkedInDisplay(personalInfo.linkedin).url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-800 font-medium text-sm hover:text-blue-600 underline"
                                            >
                                                {getLinkedInDisplay(personalInfo.linkedin).displayText}
                                            </a>
                                        </div>
                                    )}
                                    
                                    {personalInfo.website && (
                                        <div className="bg-white p-3 rounded-md shadow-sm">
                                            <div className="text-blue-600 uppercase font-bold mb-1">
                                                <p>
                                                    {data.cvLanguage?.includes('en') ? 'Website' : 
                                                     data.cvLanguage?.includes('tr') ? 'Web Sitesi' : 'Veb-sayt'}
                                                </p>
                                            </div>
                                            <p className="text-gray-800 font-medium text-sm break-all">{personalInfo.website}</p>
                                        </div>
                                    )}
                                    
                                    {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                                        personalInfo.additionalLinks.slice(0, 1).map((link) => (
                                            <div key={link.id} className="bg-white p-3 rounded-md shadow-sm">
                                                <div className="text-blue-600 uppercase font-bold mb-1">
                                                    <p>{link.label}</p>
                                                </div>
                                                <p className="text-gray-800 font-medium text-sm break-all">{link.value}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                    <div 
                        style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--cv-section-spacing, 12px)'
                        }}
                    >
                        {sectionOrder.map((sectionId) => {
                            const section = generateSection(sectionId);
                            if (!section) return null;

                            return (
                                <SortableItem 
                                    key={sectionId} 
                                    id={sectionId}
                                    showDragInstruction={!isMobile}
                                    dragIconPosition="left"
                                    sectionOrder={sectionOrder}
                                    onSectionReorder={onSectionReorder}
                                    activeSection={activeSection}
                                    onSetActiveSection={onSectionSelect}
                                    isDropTarget={false}
                                >
                                    {section}
                                </SortableItem>
                            );
                        })}
                    </div>
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
    activeSection: externalActiveSection,
    onSectionSelect: externalOnSectionSelect,
    onLeftSectionReorder,
    leftColumnOrder: externalLeftColumnOrder,
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
    
    // Mobile swipe states
    const [isMobile, setIsMobile] = React.useState(false);
    const [touchStartX, setTouchStartX] = React.useState(0);
    const [touchStartY, setTouchStartY] = React.useState(0);
    const [currentTranslateX, setCurrentTranslateX] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    
    // Mobile states - use external props if provided, otherwise internal state
    const [internalActiveSection, setInternalActiveSection] = React.useState<string | null>(null);
    const activeSection = externalActiveSection !== undefined ? externalActiveSection : internalActiveSection;
    const setActiveSection = externalOnSectionSelect || setInternalActiveSection;

    // Debug: Check what custom sections data we have
    console.log('=== CV PREVIEW DEBUG ===');
    console.log('CV Data:', cv.data);
    console.log('Custom Sections:', cv.data.customSections);

    // Force re-render when cv.data changes (real-time updates)
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [prevDataHash, setPrevDataHash] = React.useState('');
    
    React.useEffect(() => {
        // Create hash of critical data for deep comparison
        const currentHash = JSON.stringify({
            skills: cv.data.skills?.map(s => ({ name: s.name, type: s.type })) || [],
            languages: cv.data.languages?.map(l => ({ language: l.language, level: l.level })) || [],
            certifications: cv.data.certifications?.map(c => ({ name: c.name, organization: c.issuer })) || [],
            education: cv.data.education?.map(e => ({ degree: e.degree, institution: e.institution })) || []
        });
        
        if (currentHash !== prevDataHash) {
            console.log('🔄 CV Data hash changed - forcing full re-render');
            console.log('📊 Skills:', cv.data.skills?.length || 0);
            console.log('🌐 Languages:', cv.data.languages?.length || 0);
            console.log('📜 Certifications:', cv.data.certifications?.length || 0);
            console.log('🎓 Education:', cv.data.education?.length || 0);
            setPrevDataHash(currentHash);
            forceUpdate();
        }
    }, [cv.data.skills, cv.data.languages, cv.data.certifications, cv.data.education, prevDataHash]);
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

    // Get section order from CV data (don't use local state)
    const getSectionOrderFromCV = () => {
        // Check if CV data has a saved section order
        if (cv.data.sectionOrder && Array.isArray(cv.data.sectionOrder) && cv.data.sectionOrder.length > 0) {
            console.log('Using saved section order from CV:', cv.data.sectionOrder);
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
    };

    // Get current section order (no local state)
    const sectionOrder = getSectionOrderFromCV();
    console.log('📊 CVPreview sectionOrder from CV:', sectionOrder);

    // Handle section reorder with optimized callbacks
    const handleSectionReorder = React.useCallback((newOrder: string[]) => {
        console.log('=== MAIN HANDLE SECTION REORDER ===');
        console.log('New order:', newOrder);
        console.log('Old order:', sectionOrder);

        // Don't use local setSectionOrder - let parent manage the state

        // Update CV data with new section order for persistence
        const updatedCv = {
            ...cv,
            data: {
                ...cv.data,
                sectionOrder: newOrder
            }
        };

        // Notify parent component if handler exists - pass the new order
        if (onSectionReorder) {
            console.log('📋 Calling parent onSectionReorder with:', newOrder);
            onSectionReorder(newOrder);
        }

        // Always update the parent with new CV data
        if (onUpdate) {
            console.log('📋 Calling parent onUpdate with CV:', updatedCv);
            onUpdate(updatedCv);
            console.log('✅ Section order updated in parent component');
        } else {
            console.log('⚠️ No onUpdate handler found, section order changes won\'t persist');
        }
    }, [cv, onSectionReorder, onUpdate, sectionOrder]);

    const handleSectionSelect = React.useCallback((sectionId: string | null) => {
        if (isMobile) {
            const newValue = sectionId === activeSection ? null : sectionId;
            setActiveSection(newValue);
        }
    }, [isMobile, activeSection, setActiveSection]);

    // Get responsive scale based on screen size
    const getResponsiveScale = () => {
        if (typeof window !== 'undefined') {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Mobile: Sadə və effektiv scale sistemi
            if (width < 1024) {
                // Mobile ekran eni əsasında optimal scale
                const mobileScale = Math.min(0.9, (width - 64) / (210 * 3.779)); // 64px padding üçün
                return Math.max(0.4, mobileScale); // Minimum 0.4, maksimum 0.9
            }

            // Desktop: User-ın mövcud setup-ını saxlayırıq
            if (width < 1280) return 0.8;     // Small desktop
            if (width < 1536) return 0.9;     // Medium desktop

            // Large desktop: A4 tam görünməsi üçün screen height-ə əsasən
            const containerHeight = height - 160; // navbar və padding üçün yer
            const a4Height = 297 * 3.779; // 297mm to pixels (rough conversion)
            const maxScale = Math.min(1.3, containerHeight / a4Height);

            return Math.max(1.0, maxScale);   // Minimum 1.0, maksimum container-ə sığacaq qədər
        }
        return 1.0; // default for SSR - real size
    };

    React.useEffect(() => {
        const handleResize = () => {
            setScale(getResponsiveScale());
            setIsMobile(window.innerWidth < 1024);
        };

        // Set initial scale and mobile state
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mobile touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!isMobile) return;
        
        const touch = e.touches[0];
        setTouchStartX(touch.clientX);
        setTouchStartY(touch.clientY);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isMobile || !isDragging) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Only allow horizontal scrolling if horizontal movement is greater than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            setCurrentTranslateX(deltaX);
        }
    };

    const handleTouchEnd = () => {
        if (!isMobile) return;
        
        setIsDragging(false);
        
        // Reset position with smooth animation
        setTimeout(() => {
            setCurrentTranslateX(0);
        }, 100);
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
                key={`atlas-${cv.data.skills?.length || 0}-${cv.data.languages?.length || 0}-${cv.data.certifications?.length || 0}-${cv.data.education?.length || 0}`}
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
                onLeftSectionReorder={onLeftSectionReorder}
                leftColumnOrder={externalLeftColumnOrder}
            />;
        }

        // Aurora Template - Modern Minimal ATS-Friendly
        if (normalizedTemplate.includes('aurora') ||
            normalizedTemplate === 'aurora') {
            return <AuroraTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
            />;
        }

        // Vertex Template - Technology & Innovation Focused
        if (normalizedTemplate.includes('vertex') ||
            normalizedTemplate === 'vertex') {
            return <VertexTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
            />;
        }

        // Horizon Template - Wide Open Style for Creative Fields
        if (normalizedTemplate.includes('horizon') ||
            normalizedTemplate === 'horizon') {
            return <HorizonTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
            />;
        }

        // Lumen Template - Clean, Bright & Clear Visual Design (ATS-Based with White Left Panel)
        if (normalizedTemplate.includes('lumen') ||
            normalizedTemplate === 'lumen') {
            return <LumenTemplate 
                key={`lumen-${cv.data.skills?.length || 0}-${cv.data.languages?.length || 0}-${cv.data.certifications?.length || 0}-${cv.data.education?.length || 0}`}
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
                onLeftSectionReorder={onLeftSectionReorder}
                leftColumnOrder={externalLeftColumnOrder}
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
                onSectionSelect={handleSectionSelect}
            />;
        }

        // Exclusive templates
        if (normalizedTemplate.includes('exclusive') ||
            normalizedTemplate === 'exclusive') {
            return <ExclusiveTemplate 
                data={cv.data} 
                sectionOrder={sectionOrder} 
                onSectionReorder={handleSectionReorder}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
            />;
        }

        // Professional/Executive templates - use BasicTemplate instead
        if (normalizedTemplate.includes('professional') ||
            normalizedTemplate.includes('elegant') ||
            normalizedTemplate.includes('executive') ||
            normalizedTemplate.includes('luxury') ||
            normalizedTemplate.includes('premium') ||
            normalizedTemplate === 'medium') {
            return <BasicTemplate
                data={cv.data}
                sectionOrder={sectionOrder}
                onSectionReorder={handleSectionReorder}
                cv={cv}
                onUpdate={onUpdate}
                activeSection={activeSection}
                onSectionSelect={handleSectionSelect}
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
            onSectionSelect={handleSectionSelect}
        />;
    };

    return (
        <div 
            className="relative"
            style={{
                width: isMobile ? '100%' : '210mm',
                height: isMobile ? '100%' : 'auto', // Desktop: auto height for long CVs
                maxWidth: '210mm', // CV eni ilə limitli
                minHeight: '297mm', // Minimum A4 hündürlüyü
                overflow: isMobile ? 'hidden' : 'visible', // Desktop: allow content to overflow container
                background: 'transparent',
            }}
        >
            {/* CV Preview Container with Page Break Indicators */}
            <PageBreakIndicator
                showIndicators={!isMobile} // Only show on desktop
                pageHeight={297} // A4 height in mm
                pageWidth={210} // A4 width in mm
                marginTop={15}
                marginBottom={15}
                marginLeft={15}
                marginRight={15}
                className="cv-preview-with-breaks"
            >
                <div
                    id="cv-preview-element"
                    className="cv-preview"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={(e) => {
                        // Stop propagation to prevent closing external buttons
                        e.stopPropagation();
                    }}
                    style={{
                        width: '210mm',
                        height: isMobile ? 'fit-content' : 'auto', // Desktop: auto height for long content
                        minHeight: '297mm', // Minimum A4 hündürlüyü
                        maxWidth: '210mm', // CV enindən artıq olmaz
                        maxHeight: isMobile ? 'none' : 'none', // Desktop: no height limit for long CVs
                        margin: '0',
                        overflow: isMobile ? 'auto' : 'visible', // Desktop: allow content to be visible
                        position: 'relative',
                        background: 'white',
                        transformOrigin: 'top left',
                        transform: `scale(${scale}) translateX(${isMobile ? currentTranslateX : 0}px)`,
                        boxSizing: 'border-box',
                        // Set CSS Variables for font management
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
                    ['--cv-section-margin-top' as any]: `${fontSettings.sectionSpacing}px`,
                    ['--cv-section-margin-bottom' as any]: `${fontSettings.sectionSpacing}px`,
                    lineHeight: '1.5',
                    // Enhanced mobile touch optimization for smooth scroll
                    touchAction: isMobile ? 'pan-x pan-y pinch-zoom' : 'pan-y',
                    overscrollBehavior: isMobile ? 'none' : 'contain',
                    WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
                    scrollBehavior: 'smooth',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                } as React.CSSProperties}
                >
                    {renderTemplate()}
                </div>
            </PageBreakIndicator>
        </div>
    );
}

// Export individual templates for direct use if needed
export { BasicTemplate, ModernTemplate, ATSFriendlyTemplate, ExclusiveTemplate, AuroraTemplate, VertexTemplate, HorizonTemplate, LumenTemplate };

// Export mobile helper functions for external use
export const useMobileSectionReorder = (sectionOrder: string[], onSectionReorder: (newOrder: string[]) => void) => {
    console.log('🔧 useMobileSectionReorder initialized with:', { sectionOrder, hasCallback: !!onSectionReorder });
    
    const moveSection = React.useCallback((activeSection: string, direction: 'up' | 'down') => {
        if (!activeSection) {
            console.log('❌ No active section to move');
            return;
        }
        
        console.log('📱 useMobileSectionReorder Moving section:', { activeSection, direction, currentOrder: sectionOrder });
        
        const currentIndex = sectionOrder.indexOf(activeSection);
        if (currentIndex === -1) {
            console.log('❌ Section not found in order:', activeSection);
            return;
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < sectionOrder.length) {
            const newOrder = [...sectionOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            
            console.log('✅ useMobileSectionReorder calling callback with new order:', newOrder);
            onSectionReorder(newOrder);
            
            // Provide haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            console.log('❌ Cannot move section - out of bounds:', { currentIndex, newIndex, sectionOrderLength: sectionOrder.length });
        }
    }, [sectionOrder, onSectionReorder]);

    return { moveSection };
};

// Export getSectionName utility for external use
export { getSectionName };