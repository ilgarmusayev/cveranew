'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
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
        headingSize: number;
        subheadingSize: number;
        bodySize: number;
        smallSize: number;
        headingWeight: number;
        subheadingWeight: number;
        bodyWeight: number;
        smallWeight: number;
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
            'May': 'May', 'İyn': 'Jun', 'İyl': 'Jul', 'Avq': 'Aug',
            'Sen': 'Sep', 'Okt': 'Oct', 'Noy': 'Nov', 'Dek': 'Dec',
            'Yanvar': 'January', 'Fevral': 'February', 'Mart': 'March', 'Aprel': 'April',
            'İyun': 'June', 'İyul': 'July', 'Avqust': 'August', 'Sentyabr': 'September',
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
            experience: 'İş Deneyimi',
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
        if (nodeString.includes('Xülasə') || nodeString.includes('Özət') || nodeString.includes('summary')) return 120;
        if (nodeString.includes('İş Təcrübəsi') || nodeString.includes('experience')) return 200;
        if (nodeString.includes('Təhsil') || nodeString.includes('education')) return 140;
        if (nodeString.includes('Bacarıqlar') || nodeString.includes('skills')) return 100;
        if (nodeString.includes('Dillər') || nodeString.includes('languages')) return 80;
        if (nodeString.includes('Layihələr') || nodeString.includes('projects')) return 120;
        if (nodeString.includes('Sertifikatlar') || nodeString.includes('certifications')) return 80;
        if (nodeString.includes('Könüllü') || nodeString.includes('volunteer')) return 80;
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

// Sortable Item Component for DND Kit
interface SortableItemProps {
    id: string;
    children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes}
            {...listeners}
            className={`
                relative group cursor-grab active:cursor-grabbing
                ${isDragging 
                    ? 'shadow-2xl border-2 border-blue-500 bg-blue-50 rounded-lg scale-105 rotate-1' 
                    : 'hover:shadow-lg hover:border-2 hover:border-blue-300 hover:bg-blue-50/50 hover:scale-[1.02]'
                }
                transition-all duration-200 ease-in-out
                border border-transparent rounded-md
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-100/20 before:to-transparent
                before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
            `}
            title="Bütün hissəni sürükləyin"
        >
            {/* Drag indicator icon - appears on hover */}
            <div 
                className="absolute -left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                style={{ userSelect: 'none' }}
            >
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </div>
            </div>
            
            {/* Hover instruction */}
            <div 
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-300 text-white px-3 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
                style={{ userSelect: 'none' }}
            >
                Sürükləyərək yerdəyişmə edin
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-300 text-white"></div>
            </div>
            
            {/* Visual drag lines when dragging */}
            {isDragging && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-0 top-1/4 w-1 h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="absolute right-0 top-1/4 w-1 h-1/2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
            )}
            
            {/* Content with padding for drag space */}
            <div 
                className={`
                    ${isDragging ? 'transform rotate-0' : ''}
                    transition-transform duration-200
                    pl-2 pr-2 py-1
                `}
                style={{ userSelect: isDragging ? 'none' : 'auto' }}
            >
                {children}
            </div>
        </div>
    );
};

// Basic Template Component with DND Kit
const BasicTemplate: React.FC<{ data: CVData; sectionOrder: string[]; onSectionReorder: (newOrder: string[]) => void }> = ({ data, sectionOrder, onSectionReorder }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    const [isDragActive, setIsDragActive] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Minimum 8px movement to start drag
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
                                            <h3 className="font-semibold text-gray-900 text-sm">{edu.degree}</h3>
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
                                        {(project.startDate || project.endDate) && (
                                            <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2">
                                                {project.startDate && project.endDate ? 
                                                    `${formatDate(project.startDate, data.cvLanguage)} - ${project.current ? getCurrentText(data.cvLanguage) : formatDate(project.endDate, data.cvLanguage)}` :
                                                    formatDate(project.startDate || project.endDate || '', data.cvLanguage)
                                                }
                                            </span>
                                        )}
                                    </div>
                                    {project.description && (
                                        <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(project.description)}</div>
                                    )}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <p className="text-blue-600 text-xs mt-1">Texnologiyalar: {project.technologies.join(', ')}</p>
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
                    <div className={`space-y-4 transition-all duration-300 ${isDragActive ? 'opacity-95 bg-gradient-to-br from-transparent via-blue-50/30 to-transparent' : ''}`}>
                        {sectionOrder.map((sectionType) => {
                            const sectionContent = renderSection(sectionType);
                            if (!sectionContent) return null;
                            
                            return (
                                <SortableItem key={sectionType} id={sectionType}>
                                    {sectionContent}
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            {/* Custom Sections */}
            {customSections.length > 0 && (
                customSections.map((section) => (
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
                                            Texnologiyalar: {item.technologies.join(', ')}
                                        </p>
                                    )}
                                    {item.url && (
                                        <p className="text-gray-600 text-xs mt-1">URL: {item.url}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// Modern Template Component (Drag-Drop will be added later)
const ModernTemplate: React.FC<{ data: CVData; sectionOrder: string[]; onSectionReorder: (newOrder: string[]) => void }> = ({ data, sectionOrder, onSectionReorder }) => {
    return (
        <div className="w-full h-full bg-white flex items-center justify-center">
            <div className="text-center p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Modern Template</h2>
                <p className="text-gray-600 mb-4">Drag-and-drop funksionallığı yalnız Basic Template-də mövcuddur.</p>
                <p className="text-sm text-blue-600">Basic Template seçin və section-ları sürükləyərək yenidən təşkil edin.</p>
            </div>
        </div>
    );
};

// ATS-Friendly Professional Template Component with Drag and Drop
const ATSFriendlyTemplate: React.FC<{ data: CVData; sectionOrder: string[]; onSectionReorder: (newOrder: string[]) => void }> = ({ data, sectionOrder, onSectionReorder }) => {
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
                                        {(project.startDate || project.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {project.startDate && project.endDate ? (
                                                    project.current ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage)}` : `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
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
const ProfessionalTemplate: React.FC<{ data: CVData; sectionOrder: string[]; onSectionReorder: (newOrder: string[]) => void }> = ({ data, sectionOrder, onSectionReorder }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    
    const [activeId, setActiveId] = useState<string | null>(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
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
                                        {(project.startDate || project.endDate) && (
                                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap ml-2">
                                                {project.startDate && project.endDate ? (
                                                    project.current ? `${formatDate(project.startDate, data.cvLanguage)} - ${getCurrentText(data.cvLanguage).toLowerCase()}` : `${formatDate(project.startDate, data.cvLanguage)} - ${formatDate(project.endDate, data.cvLanguage)}`
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
                                    {customSection.description || ''}
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
                            <SortableItem key={sectionType} id={sectionType}>
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
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12,
        headingWeight: 700,
        subheadingWeight: 600,
        bodyWeight: 400,
        smallWeight: 400
    }
}: CVPreviewProps) {
    const templateId = template || cv.templateId || 'basic';
    const [scale, setScale] = React.useState(1.0);
    
    // Default section order
    const defaultSectionOrder = [
        'summary',
        'experience', 
        'education',
        'skills',
        'languages',
        'projects',
        'certifications',
        'volunteer'
    ];
    
    // Initialize section order from CV data or use default
    const [sectionOrder, setSectionOrder] = useState(() => {
        // Check if CV data has a saved section order
        if (cv.data.sectionOrder && Array.isArray(cv.data.sectionOrder) && cv.data.sectionOrder.length > 0) {
            console.log('Using saved section order:', cv.data.sectionOrder);
            return cv.data.sectionOrder as string[];
        }
        console.log('Using default section order:', defaultSectionOrder);
        return defaultSectionOrder;
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
        
        // Notify parent component if handler exists
        onSectionReorder?.(newOrder);
        
        // If there's a CV update handler, use it for persistence
        if (onUpdate) {
            onUpdate(updatedCv);
        } else {
            console.log('No onUpdate handler found, section order will be saved when CV is saved manually');
        }
    };
    
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
        };
        
        // Set initial scale
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
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
            return <ATSFriendlyTemplate data={cv.data} sectionOrder={sectionOrder} onSectionReorder={handleSectionReorder} />;
        }
        
        // Modern templates  
        if (normalizedTemplate.includes('modern') || 
            normalizedTemplate.includes('creative') ||
            normalizedTemplate === 'tech-professional' ||
            normalizedTemplate === 'designer-pro') {
            return <ModernTemplate data={cv.data} sectionOrder={sectionOrder} onSectionReorder={handleSectionReorder} />;
        }
        
        // Professional/Executive templates
        if (normalizedTemplate.includes('professional') ||
            normalizedTemplate.includes('elegant') ||
            normalizedTemplate.includes('executive') ||
            normalizedTemplate.includes('luxury') ||
            normalizedTemplate.includes('premium') ||
            normalizedTemplate === 'medium') {
            return <ProfessionalTemplate data={cv.data} sectionOrder={sectionOrder} onSectionReorder={handleSectionReorder} />;
        }
        
        // Basic/Simple templates (default)
        return <BasicTemplate data={cv.data} sectionOrder={sectionOrder} onSectionReorder={handleSectionReorder} />;
    };

    return (
        <div 
            className="cv-preview border border-gray-300"
            style={{
                width: '210mm',
                height: '297mm', // Fixed A4 height
                margin: '0',
                overflow: 'auto', // Enable scroll when content exceeds A4 height
                position: 'relative',
                background: 'white',
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
                borderRadius: '8px',
                boxShadow: scale >= 0.8 
                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                // Set CSS Variables for font management
                ['--cv-font-family' as any]: fontSettings.fontFamily,
                ['--cv-heading-size' as any]: `${fontSettings.headingSize}px`,
                ['--cv-subheading-size' as any]: `${fontSettings.subheadingSize}px`,
                ['--cv-body-size' as any]: `${fontSettings.bodySize}px`,
                ['--cv-small-size' as any]: `${fontSettings.smallSize}px`,
                ['--cv-heading-weight' as any]: fontSettings.headingWeight,
                ['--cv-subheading-weight' as any]: fontSettings.subheadingWeight,
                ['--cv-body-weight' as any]: fontSettings.bodyWeight,
                ['--cv-small-weight' as any]: fontSettings.smallWeight,
                lineHeight: '1.5'
            } as React.CSSProperties}
        >
            {renderTemplate()}
        </div>
    );
}

// Export individual templates for direct use if needed
export { BasicTemplate, ModernTemplate, ProfessionalTemplate, ATSFriendlyTemplate };