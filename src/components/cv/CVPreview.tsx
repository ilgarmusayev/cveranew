'use client';

import React, { useState, useEffect } from 'react';
import '@/styles/cv-fonts.css';
import '@/styles/cv-fonts.css';

interface PersonalInfo {
    fullName?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    website?: string;
    linkedin?: string;
    location?: string;
    summary?: string;
    profileImage?: string;
    additionalLinks?: AdditionalLink[];
}

interface AdditionalLink {
    id: string;
    label: string;
    value: string;
    type: 'url' | 'text' | 'email' | 'phone';
}

interface Experience {
    id: string;
    company: string;
    position: string;
    description: string;
}

interface Education {
    id: string;
    institution: string;
    degree: string;
    field?: string;
    gpa?: string;
    description?: string;
}

interface Skill {
    id: string;
    name: string;
    level: string;
    type?: 'hard' | 'soft';
    category?: string;
    description?: string; // For Gemini AI content
}

interface Language {
    id: string;
    language: string;
    level: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    github?: string;
    current?: boolean;
}

interface Certification {
    id: string;
    name: string;
    issuer: string;
    description?: string;
    url?: string;
}

interface VolunteerExperience {
    id: string;
    organization: string;
    role: string;
    cause?: string;
    description?: string;
}

interface CustomSection {
    id: string;
    title: string;
    items: CustomSectionItem[];
    order?: number;
}

interface CustomSectionItem {
    id: string;
    title?: string;
    subtitle?: string;
    description?: string;
    url?: string;
    date?: string;
    location?: string;
    tags?: string[];
}

interface CVData {
    personalInfo: PersonalInfo;
    experience?: Experience[];
    education?: Education[];
    skills?: Skill[];
    languages?: Language[];
    projects?: Project[];
    certifications?: Certification[];
    volunteerExperience?: VolunteerExperience[];
    customSections?: CustomSection[];
    cvLanguage?: string;
    sectionNames?: Record<string, string>;
}

interface CVPreviewProps {
    cv: {
        id?: string;
        templateId?: string;
        data: CVData;
    };
    template?: string;
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
    if (personalInfo.name) return personalInfo.name;
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

// Basic Template Component
const BasicTemplate: React.FC<{ data: CVData }> = ({ data }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    
    return (
        <div 
            className="w-full h-full bg-white text-gray-900 font-sans" 
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

            {/* Summary */}
            {personalInfo.summary && (
                <div className="mb-4 cv-section">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="text-gray-700 text-xs leading-relaxed">
                        {renderHtmlContent(personalInfo.summary)}
                    </div>
                </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
                <div className="mb-4 cv-section">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-3">
                        {experience.map((exp) => (
                            <div key={exp.id} className="border-l-2 border-blue-200 pl-3 avoid-break">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{exp.position}</h3>
                                </div>
                                <p className="text-blue-600 font-medium mb-1 text-xs">{exp.company}</p>
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
                <div className="mb-4 cv-section">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('education', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-2">
                        {education.map((edu) => (
                            <div key={edu.id} className="border-l-2 border-blue-200 pl-3 avoid-break">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{edu.degree}</h3>
                                </div>
                                <p className="text-blue-600 font-medium text-xs">{edu.institution}</p>
                                {(edu.field || edu.gpa) && (
                                    <p className="text-gray-600 text-xs">
                                        {edu.field && edu.gpa ? `${edu.field} - ${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}` :
                                         edu.field ? edu.field :
                                         edu.gpa ? `${data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: ${edu.gpa}` : ''}
                                    </p>
                                )}
                                {edu.description && (
                                    <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(edu.description)}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills - Hard və Soft ayrı-ayrı */}
            {skills.length > 0 && (
                <div className="mb-4 cv-section">
                    {/* Hard Skills */}
                    {skills.filter(skill => skill.type === 'hard').length > 0 && (
                        <div className="mb-3 avoid-break">
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
                        <div className="mb-3">
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

                    {/* Tip göstərilməyən skills (geriyə uyğunluq üçün) */}
                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                        <div className="mb-3">
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
            )}

            {/* Languages */}
            {languages.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="grid grid-cols-2 gap-1">
                        {languages.map((lang) => (
                            <div key={lang.id} className="flex justify-between items-center">
                                <span className="text-gray-700 text-xs">{lang.language}</span>
                                <span className="text-xs text-blue-600 font-medium">{getLanguageLevel(lang.level, data.cvLanguage)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-2">
                        {projects.map((project) => (
                            <div key={project.id} className="border-l-2 border-blue-200 pl-3">
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
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-2">
                        {certifications.map((cert) => (
                            <div key={cert.id} className="border-l-2 border-blue-200 pl-3">
                                <div className="flex justify-between items-start">
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
                                </div>
                                <p className="text-blue-600 font-medium text-xs">{cert.issuer}</p>
                                {cert.description && (
                                    <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(cert.description)}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Volunteer Experience */}
            {volunteerExperience.length > 0 && (
                <div className="mb-4">
                    <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                        {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-2">
                        {volunteerExperience.map((vol) => (
                            <div key={vol.id} className="border-l-2 border-blue-200 pl-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-900 text-sm">{vol.role}</h3>
                                    <span className="text-xs text-gray-500">
                                    </span>
                                </div>
                                <p className="text-blue-600 font-medium text-xs">{vol.organization}</p>
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
                    <div key={section.id} className="mb-4">
                        <h2 className="text-base font-semibold text-blue-600 mb-2 border-b border-gray-300 pb-1">
                            {section.title}
                        </h2>
                        <div className="space-y-2">
                            {section.items.map((item) => (
                                <div key={item.id} className="border-l-2 border-blue-200 pl-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex-1">
                                            {item.title && (
                                                <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                                            )}
                                            {item.subtitle && (
                                                <p className="text-blue-600 font-medium text-xs">{item.subtitle}</p>
                                            )}
                                            {item.location && (
                                                <p className="text-gray-600 text-xs">{item.location}</p>
                                            )}
                                        </div>
                                        {item.date && (
                                            <span className="text-xs text-gray-500">{item.date}</span>
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
                                                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {item.url && (
                                        <p className="text-blue-600 text-xs mt-1">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {item.url}
                                            </a>
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
    );
};

// Modern Template Component
const ModernTemplate: React.FC<{ data: CVData }> = ({ data }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    
    return (
        <div className="w-full h-full bg-white text-gray-900 font-sans flex">
            {/* Left Sidebar */}
            <div className="w-1/3 bg-gray-800 text-white" style={{ padding: '12mm 8mm' }}>
                {/* Profile */}
                <div className="mb-4 cv-section avoid-break">
                    {/* Profile Image */}
                    {personalInfo.profileImage && (
                        <div className="flex justify-center mb-4">
                            <img 
                                src={personalInfo.profileImage} 
                                alt="Profile" 
                                className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400"
                            />
                        </div>
                    )}
                    
                    <h1 className="text-xl font-bold mb-2 text-center">
                        {getFullName(personalInfo)}
                    </h1>
                    <div className="space-y-2 text-xs">
                        {personalInfo.email && (
                            <div className="flex items-center gap-2">
                                <span>📧</span> {personalInfo.email}
                            </div>
                        )}
                        {personalInfo.phone && (
                            <div className="flex items-center gap-2">
                                <span>📱</span> {personalInfo.phone}
                            </div>
                        )}
                        {personalInfo.location && (
                            <div className="flex items-center gap-2">
                                <span>📍</span> {personalInfo.location}
                            </div>
                        )}
                        {personalInfo.linkedin && (
                            <div className="flex items-center gap-2">
                                <span>🔗</span> {personalInfo.linkedin}
                            </div>
                        )}
                        {personalInfo.website && (
                            <div className="flex items-center gap-2">
                                <span>🌐</span> {personalInfo.website}
                            </div>
                        )}
                        {personalInfo.additionalLinks && personalInfo.additionalLinks.length > 0 && (
                            personalInfo.additionalLinks.map((link) => (
                                <div key={link.id} className="flex items-center gap-2">
                                    <span>📎</span> {link.label}: {link.value}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Skills - Hard və Soft ayrı-ayrı */}
                {skills.length > 0 && (
                    <div className="mb-6">
                        {/* Hard Skills */}
                        {skills.filter(skill => skill.type === 'hard').length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-sm font-semibold mb-3 text-yellow-400">
                                    {getSectionName('technicalSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-3">
                                    {skills.filter(skill => skill.type === 'hard').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="text-xs mb-1">
                                                <span>{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-300 text-xs leading-relaxed">
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
                                <h2 className="text-sm font-semibold mb-3 text-yellow-400">
                                    {getSectionName('softSkills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-3">
                                    {skills.filter(skill => skill.type === 'soft').map((skill) => (
                                        <div key={skill.id}>
                                            <div className="text-xs mb-1">
                                                <span>{skill.name}</span>
                                            </div>
                                            {skill.description && (
                                                <div className="text-gray-300 text-xs leading-relaxed">
                                                    {renderHtmlContent(skill.description)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tip göstərilməyən skills (geriyə uyğunluq üçün) */}
                        {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-sm font-semibold mb-3 text-yellow-400">
                                    {getSectionName('skills', data.cvLanguage, data.sectionNames)}
                                </h2>
                                <div className="space-y-2">
                                    {skills.filter(skill => !skill.type || (skill.type !== 'hard' && skill.type !== 'soft')).map((skill) => (
                                        <div key={skill.id}>
                                            <div className="text-xs mb-1">
                                                <span>{skill.name}</span>
                                            </div>
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
                        <h2 className="text-sm font-semibold mb-3 text-yellow-400">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-1">
                            {languages.map((lang) => (
                                <div key={lang.id} className="flex justify-between text-xs">
                                    <span>{lang.language}</span>
                                    <span>{getLanguageLevel(lang.level, data.cvLanguage)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold mb-3 text-yellow-400">
                            {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-2">
                            {certifications.map((cert) => (
                                <div key={cert.id}>
                                    {cert.url ? (
                                        <a 
                                            href={cert.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs font-semibold underline hover:text-yellow-400 transition-colors cursor-pointer"
                                        >
                                            {cert.name}
                                        </a>
                                    ) : (
                                        <h3 className="text-xs font-semibold">{cert.name}</h3>
                                    )}
                                    <p className="text-xs text-gray-300">{cert.issuer}</p>
                                    {cert.description && (
                                        <div className="text-gray-300 text-xs mt-1">{renderHtmlContent(cert.description)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Content */}
            <div className="flex-1" style={{ padding: '12mm 10mm' }}>
                {/* Summary */}
                {personalInfo.summary && (
                    <div className="mb-4 cv-section">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">
                            {getSectionName('summary', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="text-gray-700 leading-relaxed text-xs">
                            {renderHtmlContent(personalInfo.summary)}
                        </div>
                    </div>
                )}

                {/* Experience */}
                {experience.length > 0 && (
                    <div className="mb-6 cv-section">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">
                            {getSectionName('experience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-4">
                            {experience.map((exp) => (
                                <div key={exp.id} className="avoid-break">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{exp.position}</h3>
                                            <p className="text-gray-600 font-medium text-xs">{exp.company}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        </span>
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
                        <h2 className="text-lg font-bold text-gray-800 mb-3">
                            {getSectionName('education', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {education.map((edu) => (
                                <div key={edu.id} className="avoid-break">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{edu.degree}</h3>
                                            <p className="text-gray-600 font-medium text-xs">{edu.institution}</p>
                                            {edu.field && <p className="text-gray-500 text-xs">{edu.field}</p>}
                                            {edu.gpa && <p className="text-gray-500 text-xs">{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</p>}
                                        </div>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        </span>
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
                        <h2 className="text-lg font-bold text-gray-800 mb-3">
                            {getSectionName('projects', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {projects.map((project) => (
                                <div key={project.id}>
                                    {project.url ? (
                                        <a 
                                            href={project.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-gray-900 underline hover:text-blue-600 transition-colors cursor-pointer"
                                        >
                                            {project.name}
                                        </a>
                                    ) : (
                                        <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
                                    )}
                                    {project.description && (
                                        <div className="text-gray-700 text-xs mt-1 mb-2">{renderHtmlContent(project.description)}</div>
                                    )}
                                    {project.technologies && project.technologies.length > 0 && (
                                        <p className="text-gray-600 text-xs">
                                            <span className="font-medium">Texnologiyalar:</span> {project.technologies.join(', ')}
                                        </p>
                                    )}
                                    {project.github && (
                                        <p className="text-gray-600 text-xs">GitHub: {project.github}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Volunteer Experience */}
                {volunteerExperience.length > 0 && (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3">
                            {getSectionName('volunteerExperience', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-3">
                            {volunteerExperience.map((vol) => (
                                <div key={vol.id}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-sm font-semibold text-gray-900">{vol.role}</h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-xs mb-1">{vol.organization}</p>
                                    {vol.description && (
                                        <div className="text-gray-700 text-xs leading-relaxed">
                                            {renderHtmlContent(vol.description)}
                                        </div>
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
                            <h2 className="text-lg font-bold text-gray-800 mb-3">
                                {section.title}
                            </h2>
                            <div className="space-y-3">
                                {section.items.map((item) => (
                                    <div key={item.id}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                {item.title && (
                                                    <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                                                )}
                                                {item.subtitle && (
                                                    <p className="text-gray-600 font-medium text-xs">{item.subtitle}</p>
                                                )}
                                                {item.location && (
                                                    <p className="text-gray-500 text-xs">{item.location}</p>
                                                )}
                                            </div>
                                            {item.date && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {item.date}
                                                </span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <div className="text-gray-700 text-xs leading-relaxed">
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
                                            <p className="text-gray-600 text-xs mt-1">
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                    {item.url}
                                                </a>
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

// ATS-Friendly Professional Template Component
const ATSFriendlyTemplate: React.FC<{ data: CVData }> = ({ data }) => {
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
                        <div className="space-y-1">
                            {languages.map((lang) => (
                                <div key={lang.id} className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-900">{lang.language}</span>
                                    <span className="text-xs text-gray-600">{getLanguageLevel(lang.level, data.cvLanguage)}</span>
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
                                            {edu.field && <p className="text-xs text-gray-600">{edu.field}</p>}
                                            {edu.gpa && <p className="text-xs text-gray-600">{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</p>}
                                        </div>
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

// Professional Template Component
const ProfessionalTemplate: React.FC<{ data: CVData }> = ({ data }) => {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [], customSections = [] } = data;
    
    return (
        <div className="w-full h-full bg-white text-gray-900 font-serif" style={{ padding: '15mm 12mm' }}>
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-gray-300 pb-3">
                {/* Profile Image */}
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

            {/* Summary */}
            {personalInfo.summary && (
                <div className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 mb-2 uppercase tracking-wide">
                        {getSectionName('professionalSummary', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="text-gray-700 leading-relaxed text-justify text-xs">
                        {renderHtmlContent(personalInfo.summary)}
                    </div>
                </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
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
                                    <span className="text-xs text-gray-600 font-medium">
                                    </span>
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
            )}

            {/* Education */}
            {education.length > 0 && (
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
                                        {edu.field && <p className="text-gray-600 italic text-xs">{edu.field}</p>}
                                        {edu.gpa && <p className="text-gray-600 text-xs">{data.cvLanguage === 'english' ? 'GPA' : 'ÜOMG'}: {edu.gpa}</p>}
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">
                                    </span>
                                </div>
                                {edu.description && (
                                    <div className="text-gray-700 text-xs mt-1">{renderHtmlContent(edu.description)}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills & Languages Side by Side */}
            <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Skills - Hard və Soft ayrı-ayrı */}
                {skills.length > 0 && (
                    <div>
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

                        {/* Tip göstərilməyən skills (geriyə uyğunluq üçün) */}
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
                )}

                {/* Languages */}
                {languages.length > 0 && (
                    <div>
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {getSectionName('languages', data.cvLanguage, data.sectionNames)}
                        </h2>
                        <div className="space-y-1">
                            {languages.map((lang) => (
                                <div key={lang.id} className="flex justify-between">
                                    <span className="text-gray-700 text-xs">{lang.language}</span>
                                    <span className="text-gray-600 font-medium text-xs">{getLanguageLevel(lang.level, data.cvLanguage)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Additional Sections */}
            {(projects.length > 0 || certifications.length > 0) && (
                <div className="grid grid-cols-1 gap-6">
                    {/* Projects */}
                    {projects.length > 0 && (
                        <div>
                            <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                {getSectionName('keyProjects', data.cvLanguage, data.sectionNames)}
                            </h2>
                                <div className="space-y-2">
                                {projects.map((project) => (
                                    <div key={project.id}>
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
                                            <div className="text-gray-700 text-xs">{renderHtmlContent(project.description)}</div>
                                        )}
                                        {project.technologies && project.technologies.length > 0 && (
                                            <p className="text-gray-600 text-xs italic">
                                             {project.technologies.join(', ')}
                                            </p>
                                        )}
                                        {project.github && (
                                            <p className="text-gray-600 text-xs">GitHub: {project.github}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certifications */}
                    {certifications.length > 0 && (
                        <div>
                            <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                {getSectionName('certifications', data.cvLanguage, data.sectionNames)}
                            </h2>
                            <div className="space-y-1">
                                {certifications.map((cert) => (
                                    <div key={cert.id} className="flex justify-between">
                                        <div>
                                            {cert.url ? (
                                                <a 
                                                    href={cert.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="font-semibold text-gray-900 text-xs underline hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {cert.name}
                                                </a>
                                            ) : (
                                                <span className="font-semibold text-gray-900 text-xs">{cert.name}</span>
                                            )}
                                            <span className="text-gray-700 text-xs"> - {cert.issuer}</span>
                                            {cert.description && (
                                                <div className="text-gray-600 text-xs mt-1">{renderHtmlContent(cert.description)}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Volunteer Experience */}
            {volunteerExperience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-base font-bold text-gray-800 mb-2 uppercase tracking-wide">
                        {getSectionName('volunteerWork', data.cvLanguage, data.sectionNames)}
                    </h2>
                    <div className="space-y-3">
                        {volunteerExperience.map((vol) => (
                            <div key={vol.id}>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 text-sm">{vol.role}</h3>
                                </div>
                                <p className="text-gray-700 text-xs mb-1">{vol.organization}</p>
                                {vol.description && (
                                    <div className="text-gray-700 leading-relaxed text-justify text-xs">
                                        {renderHtmlContent(vol.description)}
                                    </div>
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
                        <h2 className="text-base font-bold text-gray-800 mb-3 uppercase tracking-wide">
                            {section.title}
                        </h2>
                        <div className="space-y-3">
                            {section.items.map((item) => (
                                <div key={item.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <div className="flex-1">
                                            {item.title && (
                                                <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                                            )}
                                            {item.subtitle && (
                                                <p className="text-gray-700 font-semibold italic text-xs">{item.subtitle}</p>
                                            )}
                                            {item.location && (
                                                <p className="text-gray-600 italic text-xs">{item.location}</p>
                                            )}
                                        </div>
                                        {item.date && (
                                            <span className="text-xs text-gray-600 font-medium">{item.date}</span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <div className="text-gray-700 leading-relaxed text-justify text-xs">
                                            {renderHtmlContent(item.description)}
                                        </div>
                                    )}
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.tags.map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {item.url && (
                                        <p className="text-gray-600 text-xs mt-1">
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {item.url}
                                            </a>
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
    );
};

// Main CVPreview Component
export default function CVPreview({ 
    cv, 
    template, 
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
            return <ATSFriendlyTemplate data={cv.data} />;
        }
        
        // Modern templates
        if (normalizedTemplate.includes('modern') || 
            normalizedTemplate.includes('creative') ||
            normalizedTemplate === 'tech-professional' ||
            normalizedTemplate === 'designer-pro') {
            return <ModernTemplate data={cv.data} />;
        }
        
        // Professional/Executive templates
        if (normalizedTemplate.includes('professional') ||
            normalizedTemplate.includes('elegant') ||
            normalizedTemplate.includes('executive') ||
            normalizedTemplate.includes('luxury') ||
            normalizedTemplate.includes('premium') ||
            normalizedTemplate === 'medium') {
            return <ProfessionalTemplate data={cv.data} />;
        }
        
        // Basic/Simple templates (default)
        return <BasicTemplate data={cv.data} />;
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