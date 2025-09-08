import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { CVData, PersonalInfo, Experience, Education, Skill, Language, Project, Certification, VolunteerExperience } from '@/types/cv';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import { CVTranslationPanel } from '@/components/translation/CVTranslationPanel';
import { CVLanguage } from '@/lib/cvLanguage';
// Import section components
import PersonalInfoSection from './sections/PersonalInfoSection';
import ExperienceSection from './sections/ExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import LanguagesSection from './sections/LanguagesSection';
import ProjectsSection from './sections/ProjectsSection';
import CertificationsSection from './sections/CertificationsSection';
import VolunteerExperienceSection from './sections/VolunteerExperienceSection';
import ElaveSections from './sections/ElaveSections';

// Import preview components
import CVPreview, { getSectionName } from './CVPreview';

// Import template selector
import TemplateSelector from './TemplateSelector';
import { ApiClient } from '@/lib/api';

// Create API client instance
const apiClient = new ApiClient();

interface CVDataType {
    personalInfo: PersonalInfo;
    experience: Experience[];
    education: Education[];
    skills: Skill[];
    languages: Language[];
    projects: Project[];
    certifications: Certification[];
    volunteerExperience: VolunteerExperience[];
    publications: any[];
    honorsAwards: any[];
    testScores: any[];
    recommendations: any[];
    courses: any[];
    customSections: any[];
    sectionOrder?: any[];
    cvLanguage: CVLanguage;
    sectionNames?: Record<string, string>;
}

interface CVEditorData {
    id?: string;
    title: string;
    templateId: string;
    data: CVDataType;
}

interface CVEditorState {
    id?: string;
    title: string;
    templateId: string;
    personalInfo: PersonalInfo;
    experience: Experience[];
    education: Education[];
    skills: Skill[];
    languages: Language[];
    projects: Project[];
    certifications: Certification[];
    volunteerExperience: VolunteerExperience[];
    publications: any[];
    honorsAwards: any[];
    testScores: any[];
    recommendations: any[];
    courses: any[];
    customSections: any[];
    sectionOrder: any[];
    cvLanguage: CVLanguage;
    sectionNames?: Record<string, string>;
}

interface CVEditorProps {
    cvId?: string;
    onSave: (cv: CVEditorData) => void;
    onCancel: () => void;
    initialData?: any;
    userTier?: string;
}

// Default CV data
const getDefaultCVData = (): Omit<CVEditorState, 'id' | 'title' | 'templateId'> => ({
    personalInfo: {
        firstName: '',
        lastName: '',
        fullName: '',
        email: '',
        phone: '',
        website: '',
        linkedin: '',
        location: '',
        summary: ''
    },
    experience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    certifications: [],
    volunteerExperience: [],
    publications: [],
    honorsAwards: [],
    testScores: [],
    recommendations: [],
    courses: [],
    customSections: [],
    sectionOrder: [],
    cvLanguage: 'azerbaijani'
});

// Sections configuration
const getSections = (language: CVLanguage, translatedSectionNames?: Record<string, string>) => {
    const defaultSections = {
        english: [
            { id: 'personal', label: 'Personal Information', icon: '👤' },
            { id: 'experience', label: 'Work Experience', icon: '💼' },
            { id: 'education', label: 'Education', icon: '🎓' },
            { id: 'skills', label: 'Skills', icon: '🛠️' },
            { id: 'languages', label: 'Languages', icon: '🌍' },
            { id: 'projects', label: 'Projects', icon: '🚀' },
            { id: 'certifications', label: 'Certifications', icon: '🏆' },
            { id: 'volunteer', label: 'Volunteer Experience', icon: '❤️' },
            { id: 'customSections', label: 'Custom Sections', icon: '📝' },
            { id: 'template', label: 'Template Selection', icon: '🎨' }
        ],
        azerbaijani: [
            { id: 'personal', label: 'Şəxsi Məlumatlar', icon: '👤' },
            { id: 'experience', label: 'İş Təcrübəsi', icon: '💼' },
            { id: 'education', label: 'Təhsil', icon: '🎓' },
            { id: 'skills', label: 'Bacarıqlar', icon: '🛠️' },
            { id: 'languages', label: 'Dillər', icon: '🌍' },
            { id: 'projects', label: 'Layihələr', icon: '🚀' },
            { id: 'certifications', label: 'Sertifikatlar', icon: '🏆' },
            { id: 'volunteer', label: 'Könüllü Təcrübə', icon: '❤️' },
            { id: 'customSections', label: 'Əlavə Bölmələr', icon: '📝' },
            { id: 'template', label: 'Şablon Seçimi', icon: '🎨' }
        ]
    };

    const sections = defaultSections[language] || defaultSections.azerbaijani;
    
    // If we have translated section names, use them
    if (translatedSectionNames) {
        // Map section IDs to API section keys
        const sectionIdMapping: Record<string, string> = {
            'personal': 'personalInfo',
            'experience': 'experience',
            'education': 'education',
            'skills': 'skills',
            'languages': 'languages',
            'projects': 'projects',
            'certifications': 'certifications',
            'volunteer': 'volunteerExperience',
            'template': 'template'
        };

        const updatedSections = sections.map(section => {
            const apiKey = sectionIdMapping[section.id];
            const translatedLabel = apiKey && translatedSectionNames[apiKey];
            
            return {
                ...section,
                label: translatedLabel || section.label
            };
        });
        
        return updatedSections;
    }
    
    return sections;
};

const getSectionDescription = (sectionId: string, language: CVLanguage) => {
    const descriptions: Record<CVLanguage, Record<string, string>> = {
        english: {
            personal: 'Provide your basic contact and personal details.',
            experience: 'Detail your professional work history.',
            education: 'List your academic qualifications and degrees.',
            skills: 'Showcase your technical and soft skills.',
            languages: 'Indicate your proficiency in different languages.',
            projects: 'Highlight significant projects you have worked on.',
            certifications: 'Add any relevant certifications you have earned.',
            volunteer: 'Describe your volunteer contributions.',
            customSections: 'Add custom sections to highlight unique aspects of your profile.',
            template: 'Choose a template that best fits your style.'
        },
        azerbaijani: {
            personal: 'Əsas əlaqə və şəxsi məlumatlarınızı daxil edin.',
            experience: 'Peşəkar iş təcrübənizi ətraflı təsvir edin.',
            education: 'Akademik kvalifikasiyalarınızı və dərəcələrinizi sadalayın.',
            skills: 'Texniki və yumşaq bacarıqlarınızı nümayiş etdirin.',
            languages: 'Müxtəlif dillərdəki bilik səviyyənizi göstərin.',
            projects: 'Üzərində işlədiyiniz əhəmiyyətli layihələri qeyd edin.',
            certifications: 'Qazandığınız müvafiq sertifikatları əlavə edin.',
            volunteer: 'Könüllü fəaliyyətinizi təsvir edin.',
            customSections: 'Profilinizin unikal tərəflərini vurğulamaq üçün xüsusi bölmələr əlavə edin.',
            template: 'Stilinizi ən yaxşı əks etdirən şablonu seçin.'
        }
    };
    return descriptions[language][sectionId] || '';
};

export default function CVEditor({ cvId, onSave, onCancel, initialData, userTier }: CVEditorProps) {
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
    
    // Initialize CV state
    const [cv, setCv] = useState<CVEditorState>(() => {
        if (initialData) {
            // Check if initialData has a 'data' property (API format)
            const cvData = initialData.data || initialData;
            
            const result = {
                id: initialData.id || cvId,
                title: initialData.title || 'Yeni CV',
                templateId: initialData.templateId || 'basic',
                personalInfo: cvData.personalInfo || getDefaultCVData().personalInfo,
                experience: cvData.experience || [],
                education: cvData.education || [],
                skills: cvData.skills || [],
                languages: cvData.languages || [],
                projects: cvData.projects || [],
                certifications: cvData.certifications || [],
                volunteerExperience: cvData.volunteerExperience || [],
                publications: cvData.publications || [],
                honorsAwards: cvData.honorsAwards || [],
                testScores: cvData.testScores || [],
                recommendations: cvData.recommendations || [],
                courses: cvData.courses || [],
                customSections: cvData.customSections || [],
                sectionOrder: cvData.sectionOrder && cvData.sectionOrder.length > 0 ? cvData.sectionOrder : defaultSectionOrder,
                cvLanguage: cvData.cvLanguage || 'azerbaijani'
            };

            return result;
        }
        
        // Create new CV with default data
        const defaultData = getDefaultCVData();
        return {
            id: cvId,
            title: 'Yeni CV',
            templateId: 'basic',
            ...defaultData,
            sectionOrder: defaultSectionOrder
        };
    });

    // UI state
    const [activeSection, setActiveSection] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showTranslationPanel, setShowTranslationPanel] = useState(false);
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [fontSettings, setFontSettings] = useState(() => {
        // Load font settings from initialData if available
        if (initialData?.data?.fontSettings) {
            console.log('🎨 Font CVEditor: Loading font settings from database:', initialData.data.fontSettings);
            return {
                fontFamily: initialData.data.fontSettings.fontFamily || 'Arial, sans-serif',
                nameSize: initialData.data.fontSettings.nameSize || 24,
                titleSize: initialData.data.fontSettings.titleSize || 16,
                headingSize: initialData.data.fontSettings.headingSize || 18,
                subheadingSize: initialData.data.fontSettings.subheadingSize || 16,
                bodySize: initialData.data.fontSettings.bodySize || 14,
                smallSize: initialData.data.fontSettings.smallSize || 12,
                headingWeight: initialData.data.fontSettings.headingWeight || 700,
                subheadingWeight: initialData.data.fontSettings.subheadingWeight || 600,
                bodyWeight: initialData.data.fontSettings.bodyWeight || 400,
                smallWeight: initialData.data.fontSettings.smallWeight || 400,
                sectionSpacing: initialData.data.fontSettings.sectionSpacing || 8
            };
        }
        
        console.log('🎨 Font CVEditor: Using default font settings');
        return {
            fontFamily: 'Arial, sans-serif',
            nameSize: 24,         // İsim üçün
            titleSize: 16,        // Başlıq üçün
            headingSize: 18,      // Başlıqlar üçün
            subheadingSize: 16,   // Alt başlıqlar üçün  
            bodySize: 14,         // Əsas mətn üçün
            smallSize: 12,        // Kiçik mətn üçün
            headingWeight: 700,   // Başlıq qalınlığı
            subheadingWeight: 600, // Alt başlıq qalınlığı
            bodyWeight: 400,      // Əsas mətn qalınlığı
            smallWeight: 400,     // Kiçik mətn qalınlığı
            sectionSpacing: 8    // Bölmələr arası məsafə (px)
        };
    });
    
    // Auto-save states - hybrid system (debounced + periodic)
    const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [periodicSaveTimer, setPeriodicSaveTimer] = useState<NodeJS.Timeout | null>(null);
    const [lastSavedHash, setLastSavedHash] = useState<string>('');
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now());

    // Mobile states for section reordering
    const [isMobile, setIsMobile] = useState(false);
    const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);

    // ATS Template Left Column Order State
    const [leftColumnOrder, setLeftColumnOrder] = useState<string[]>(['skills', 'languages', 'certifications']);
    
    // Check if current template is ATS or Aurora or Vertex
    const isATSTemplate = cv.templateId?.toLowerCase().includes('ats') || 
                         cv.templateId?.toLowerCase().includes('resume-ats') || 
                         cv.templateId?.toLowerCase().includes('clean') ||
                         cv.templateId?.toLowerCase().includes('minimal-professional') ||
                         cv.templateId?.toLowerCase().includes('aurora') ||
                         cv.templateId?.toLowerCase().includes('vertex');

    // Mobile section reorder hook - Define sectionOrder first
    const sectionOrder = cv.sectionOrder || [
        'summary', 'experience', 'education', 'skills', 
        'languages', 'projects', 'certifications', 'volunteer', 'customSections'
    ];

    // Function to get actual visible sections count
    const getVisibleSectionsCount = useCallback(() => {
        let count = 0;
        
        if (cv.personalInfo?.summary?.trim()) count++; // summary
        if (cv.experience && cv.experience.length > 0) count++; // experience
        if (cv.education && cv.education.length > 0) count++; // education
        
        // For ATS template, don't count skills/languages/certifications as they're in left panel
        if (!isATSTemplate) {
            if (cv.skills && cv.skills.length > 0) count++; // skills
            if (cv.languages && cv.languages.length > 0) count++; // languages
            if (cv.certifications && cv.certifications.length > 0) count++; // certifications
        }
        
        if (cv.projects && cv.projects.length > 0) count++; // projects
        if (cv.volunteerExperience && cv.volunteerExperience.length > 0) count++; // volunteer
        if (cv.customSections && cv.customSections.length > 0) count++; // customSections
        
        return count;
    }, [cv, isATSTemplate]);

    // Function to get visible sections order
    const getVisibleSections = useCallback(() => {
        const visibleSections: string[] = [];
        
        sectionOrder.forEach(section => {
            switch (section) {
                case 'summary':
                    if (cv.personalInfo?.summary?.trim()) visibleSections.push(section);
                    break;
                case 'experience':
                    if (cv.experience && cv.experience.length > 0) visibleSections.push(section);
                    break;
                case 'education':
                    if (cv.education && cv.education.length > 0) visibleSections.push(section);
                    break;
                case 'skills':
                    // For ATS template, skills are in left panel, don't count in main order
                    if (!isATSTemplate && cv.skills && cv.skills.length > 0) visibleSections.push(section);
                    break;
                case 'languages':
                    // For ATS template, languages are in left panel, don't count in main order
                    if (!isATSTemplate && cv.languages && cv.languages.length > 0) visibleSections.push(section);
                    break;
                case 'projects':
                    if (cv.projects && cv.projects.length > 0) visibleSections.push(section);
                    break;
                case 'certifications':
                    // For ATS template, certifications are in left panel, don't count in main order
                    if (!isATSTemplate && cv.certifications && cv.certifications.length > 0) visibleSections.push(section);
                    break;
                case 'volunteer':
                    if (cv.volunteerExperience && cv.volunteerExperience.length > 0) visibleSections.push(section);
                    break;
                case 'customSections':
                    if (cv.customSections && cv.customSections.length > 0) visibleSections.push(section);
                    break;
            }
        });
        
        return visibleSections;
    }, [cv, sectionOrder, isATSTemplate]);
    
    // Define mobile section movement function that will use direct CV state updates
    const moveSection = useCallback((activeSection: string, direction: 'up' | 'down') => {
        if (!activeSection) {
            console.log('❌ No active section to move');
            return;
        }
        
        console.log('📱 CVEditor Moving section:', { activeSection, direction, currentOrder: sectionOrder });
        console.log('🔍 CustomSections check:', { 
            hasCustomSections: cv.customSections?.length > 0,
            customSectionsLength: cv.customSections?.length,
            isActiveSectionCustom: activeSection === 'customSections'
        });
        
        const currentIndex = sectionOrder.indexOf(activeSection);
        if (currentIndex === -1) {
            console.log('❌ Section not found in order:', activeSection, 'Available sections:', sectionOrder);
            return;
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < sectionOrder.length) {
            const newOrder = [...sectionOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            
            console.log('✅ CVEditor updating CV with new section order:', newOrder);
            console.log('🔄 Moving from position', currentIndex, 'to position', newIndex);
            console.log('📋 Section order before:', sectionOrder);
            console.log('📋 Section order after:', newOrder);
            
            setCv(prevCv => ({
                ...prevCv,
                sectionOrder: newOrder
            }));
            setIsDirty(true);
            
            // Provide haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            console.log('❌ Cannot move section - out of bounds:', { currentIndex, newIndex, sectionOrderLength: sectionOrder.length });
        }
    }, [sectionOrder, setCv, setIsDirty]);

    // Move function for left panel sections (ATS template)
    const moveLeftSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
        console.log('📱 CVEditor Moving left section:', { sectionId, direction, currentOrder: leftColumnOrder });
        
        const currentIndex = leftColumnOrder.indexOf(sectionId);
        if (currentIndex === -1) {
            console.log('❌ Left section not found in order:', sectionId);
            return;
        }
        
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (newIndex >= 0 && newIndex < leftColumnOrder.length) {
            const newOrder = [...leftColumnOrder];
            [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
            
            console.log('✅ CVEditor updating left column order:', newOrder);
            setLeftColumnOrder(newOrder);
            setIsDirty(true);
            
            // Provide haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }, [leftColumnOrder, setIsDirty]);

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Simple hash function for performance - much faster than JSON.stringify
    const generateDataHash = useCallback((data: any) => {
        const str = `${data.personalInfo?.fullName || ''}|${data.personalInfo?.email || ''}|${data.personalInfo?.summary || ''}|${data.experience?.length || 0}|${data.education?.length || 0}|${data.skills?.length || 0}|${data.languages?.length || 0}|${data.projects?.length || 0}|${data.certifications?.length || 0}|${data.volunteerExperience?.length || 0}|${data.customSections?.length || 0}`;
        return str;
    }, []);

    // Mark as dirty when data changes
    useEffect(() => {
        const currentHash = generateDataHash(cv);
        
        if (!lastSavedHash) {
            setLastSavedHash(currentHash);
        } else if (currentHash !== lastSavedHash) {
            setIsDirty(true);
        }
    }, [cv.personalInfo, cv.experience, cv.education, cv.skills, cv.languages, cv.projects, cv.certifications, cv.volunteerExperience, cv.customSections, generateDataHash, lastSavedHash]);

    // Debounced auto-save - triggers 1 second after last change
    useEffect(() => {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }

        if (cv.id && isDirty && !saving) {
            const timer = setTimeout(() => {
                handleAutoSave('debounced');
            }, 1000); // Very fast response - 1 second

            setAutoSaveTimer(timer);
        }

        return () => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
        };
    }, [isDirty, cv.id, saving]);

    // Periodic backup save - every 15 seconds regardless
    useEffect(() => {
        if (!cv.id) return;

        const timer = setInterval(() => {
            const timeSinceLastSave = Date.now() - lastSaveTime;
            if (timeSinceLastSave >= 14000 && isDirty && !saving) { // 14 seconds to be safe
                handleAutoSave('periodic');
            }
        }, 15000); // Check every 15 seconds

        setPeriodicSaveTimer(timer);

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [cv.id, lastSaveTime, isDirty, saving]);

    // Auto save function - hybrid system with performance optimization
    const handleAutoSave = useCallback(async (trigger: 'debounced' | 'periodic' = 'debounced') => {
        if (!cv.id || saving || !isDirty) return;

        try {
            // Update states before saving
            const currentHash = generateDataHash(cv);
            setLastSavedHash(currentHash);
            setIsDirty(false);
            setLastSaveTime(Date.now());

            const cvData: CVEditorData = {
                id: cv.id,
                title: cv.title || 'Untitled CV',
                templateId: cv.templateId,
                data: {
                    personalInfo: cv.personalInfo,
                    experience: cv.experience,
                    education: cv.education,
                    skills: cv.skills,
                    languages: cv.languages,
                    projects: cv.projects,
                    certifications: cv.certifications,
                    volunteerExperience: cv.volunteerExperience,
                    publications: cv.publications,
                    honorsAwards: cv.honorsAwards,
                    testScores: cv.testScores,
                    recommendations: cv.recommendations,
                    courses: cv.courses,
                    customSections: cv.customSections,
                    sectionOrder: cv.sectionOrder,
                    cvLanguage: cv.cvLanguage
                }
            };

            await apiClient.put(`/api/cv/${cv.id}`, {
                title: cvData.title,
                templateId: cvData.templateId,
                cv_data: cvData.data
            });
            
            // Silent auto-save with trigger info
            console.log(`✅ CV auto-saved (${trigger}) at ${new Date().toLocaleTimeString()}`);
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
            // Reset states on error so it can retry
            setIsDirty(true);
        }
    }, [cv, saving, isDirty, generateDataHash]);

    // Notification hooks
    const { showSuccess, showError, showWarning } = useNotification();

   const updateCVData = (section: keyof CVEditorState, data: any) => {
        console.log('📝 CVEditor updateCVData called:', {
            section,
            dataType: typeof data,
            dataLength: Array.isArray(data) ? data.length : 'not array',
            data: section === 'customSections' ? data : 'other section'
        });
        setCv(prev => ({
            ...prev,
            [section]: data
        }));
    };

      const handleSave = useCallback(async () => {
        setSaving(true);
        
        try {
            const cvData: CVEditorData = {
                id: cv.id,
                title: cv.title || 'Adsız CV',
                templateId: cv.templateId,
                data: {
                    personalInfo: cv.personalInfo,
                    experience: cv.experience,
                    education: cv.education,
                    skills: cv.skills,
                    languages: cv.languages,
                    projects: cv.projects,
                    certifications: cv.certifications,
                    volunteerExperience: cv.volunteerExperience,
                    publications: cv.publications,
                    honorsAwards: cv.honorsAwards,
                    testScores: cv.testScores,
                    recommendations: cv.recommendations,
                    courses: cv.courses,
                    customSections: cv.customSections,
                    sectionOrder: cv.sectionOrder,
                    cvLanguage: cv.cvLanguage
                }
            };

            const payload = {
                title: cvData.title,
                templateId: cvData.templateId,
                cv_data: cvData.data,
                fontSettings: fontSettings // CRITICAL: Save font settings to database
            };
            
            console.log('🎨 CVEditor Save Payload:', {
                fontSettings: payload.fontSettings,
                templateId: payload.templateId
            });

            if (cv.id) {
                await apiClient.put(`/api/cv/${cv.id}`, payload);
                showSuccess('CV uğurla yeniləndi');
            } else {
                const response = await apiClient.post('/api/cv', payload);
                const newCV = response.data;
                setCv(prev => ({ ...prev, id: newCV.id }));
                showSuccess('CV uğurla yaradıldı');
                // Yeni yaranan CV-ni ana komponentə ötürürük.
                cvData.id = newCV.id;
            }
            
            // DÜZGÜN YANAŞMA: Ana komponentə xəbər veririk.
            onSave(cvData);

        } catch (error) {
            console.error('❌ Save error:', error);
            showError('CV saxlanılarkən xəta baş verdi');
        } finally {
            setSaving(false);
        }
    }, [cv, onSave, showSuccess, showError]); // cv obyekti burada hələ də asılılıqdır, amma əsas buglar həll edilib.

    // 🚀 SENIOR DEV: CVEditor-dən birbaşa PDF export
    const handleDirectPDFExport = useCallback(async () => {
        if (!cv.id) return;

        try {
            setSaving(true);
            
            // CVPreview elementini tap
            const cvPreviewElement = document.querySelector('.cv-preview');
            if (!cvPreviewElement) {
                console.error('CVPreview elementi tapılmadı');
                showError('CV preview hazır deyil');
                return;
            }

            // 🎯 Font settings convert - useSimpleFontSettings → export format
            const exportFontSettings = {
                fontFamily: fontSettings.fontFamily,
                nameSize: fontSettings.titleSize,      // Şəxsi ad üçün (ən böyük)
                titleSize: fontSettings.headingSize,    // İş vəzifəsi üçün
                headingSize: fontSettings.headingSize,  // Bölmə başlıqları
                subheadingSize: fontSettings.bodySize,  // Alt başlıqlar
                bodySize: fontSettings.bodySize,        // Əsas mətn
                smallSize: fontSettings.smallSize,      // Kiçik mətn
                headingWeight: 700,                     // Bold
                subheadingWeight: 600,                  // Semi-bold
                bodyWeight: 400,                        // Normal
                smallWeight: 400,                       // Normal
                sectionSpacing: 8                       // Bölmə arası məsafə
            };

            console.log('🚀 CVEditor PDF Export - Font Settings:', exportFontSettings);

            // CVPreview-in tam HTML content-ini al
            const cvHTML = cvPreviewElement.outerHTML;
            
            // CSS-ləri də al
            const styles = Array.from(document.styleSheets)
                .map(sheet => {
                    try {
                        return Array.from(sheet.cssRules)
                            .map(rule => rule.cssText)
                            .join('\n');
                    } catch (e) {
                        return '';
                    }
                })
                .join('\n');

            // API çağırısı
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`/api/cv/export/${cv.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    format: 'pdf',
                    templateId: cv.templateId,
                    data: {
                        personalInfo: cv.personalInfo,
                        experience: cv.experience,
                        education: cv.education,
                        skills: cv.skills,
                        languages: cv.languages,
                        projects: cv.projects,
                        certifications: cv.certifications,
                        volunteerExperience: cv.volunteerExperience,
                        customSections: cv.customSections,
                        sectionOrder: cv.sectionOrder,
                        cvLanguage: cv.cvLanguage
                    },
                    fontSettings: exportFontSettings,
                    htmlContent: cvHTML,
                    cssContent: styles
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('PDF export xətası:', response.status, errorData);
                showError(`PDF export xətası: ${response.status}`);
                return;
            }

            // PDF faylını download et
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${cv.title || 'CV'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showSuccess('PDF uğurla yükləndi');
            console.log('✅ PDF export uğurlu oldu');

        } catch (error) {
            console.error('PDF export xətası:', error);
            showError('PDF export zamanı xəta baş verdi');
        } finally {
            setSaving(false);
        }
    }, [cv, fontSettings, showSuccess, showError]);


    // Get sections for current language with memoization
    const allSections = useMemo(() => {
        return getSections(cv.cvLanguage, cv.sectionNames || {});
    }, [cv.cvLanguage, cv.sectionNames]);
    
    const mainSections = useMemo(() => {
        return allSections.filter(s => s.id !== 'template');
    }, [allSections]);
    
    const templateSection = useMemo(() => {
        return allSections.find(s => s.id === 'template');
    }, [allSections]);

    // Custom section select handler to prevent left panel sections from showing selection UI
    const handleMobileSectionSelect = useCallback((sectionId: string | null) => {
        console.log('📱 CVEditor handleMobileSectionSelect:', { 
            sectionId, 
            isCustomSections: sectionId === 'customSections',
            currentActiveMobileSection: activeMobileSection
        });
        
        // Check if this is a left panel section (ATS template)
        const leftPanelSections = ['leftSkills', 'leftLanguages', 'leftCertifications'];
        
        if (sectionId && leftPanelSections.includes(sectionId)) {
            // For left panel sections, show drag instruction instead of selection
            console.log('🚫 Left panel section selected - showing drag instruction instead of selection UI');
            
            // Show a temporary notification instead of selection UI
            showWarning('Sol panel bölməsi - Sürükləyərək yerdəyişmə edin');
            
            // Don't set activeMobileSection for left panel sections
            return;
        }
        
        // For regular sections, use normal selection behavior
        setActiveMobileSection(sectionId);
        console.log('✅ CVEditor setActiveMobileSection to:', sectionId);
    }, [showWarning, activeMobileSection]);

    // Render preview based on template
    const renderPreview = () => {
        const previewData = {
            ...cv,
            data: {
                personalInfo: {
                    ...cv.personalInfo,
                    name: cv.personalInfo.fullName
                },
                experience: cv.experience,
                education: cv.education,
                skills: cv.skills,
                languages: cv.languages,
                projects: cv.projects,
                certifications: cv.certifications,
                volunteerExperience: cv.volunteerExperience,
                publications: cv.publications,
                honorsAwards: cv.honorsAwards,
                testScores: cv.testScores,
                recommendations: cv.recommendations,
                courses: cv.courses,
                customSections: cv.customSections,
                cvLanguage: cv.cvLanguage,
                sectionOrder: cv.sectionOrder,
                sectionNames: cv.sectionNames // Section names də əlavə edildi
            } as any
        };

        console.log('🎨 CVEditor renderPreview fontSettings:', fontSettings);

        return (
            <CVPreview 
                cv={previewData} 
                template={cv.templateId} 
                fontSettings={fontSettings}
                activeSection={activeMobileSection}
                onSectionSelect={handleMobileSectionSelect}
                onSectionReorder={(newOrder: string[]) => {
                    console.log('📋 Section reorder from CVPreview:', newOrder);
                    setCv(prevCv => ({
                        ...prevCv,
                        sectionOrder: newOrder
                    }));
                    setIsDirty(true);
                }}
                onUpdate={(updatedCv) => {
                    console.log('CV updated from preview:', updatedCv);
                    // Update the CV data with the new section order
                    if (updatedCv.data.sectionOrder) {
                        setCv(prevCv => ({
                            ...prevCv,
                            sectionOrder: updatedCv.data.sectionOrder
                        }));
                        setIsDirty(true);
                    }
                }}
            />
        );
    };

    // Render section content
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'personal':
                return (
                        <PersonalInfoSection
                            data={cv.personalInfo as any}
                            onChange={(data: any) => updateCVData('personalInfo', data)}
                            userTier={userTier || 'Premium'} // Default to Premium for testing
                            cvData={cv} // Pass full CV data for AI context
                            cvId={cv.id}
                            cvLanguage={cv.cvLanguage}
                        />
                );

            case 'experience':
                return (
                    <ExperienceSection
                        data={cv.experience as any}
                        onChange={(data: any) => updateCVData('experience', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'education':
                return (
                    <EducationSection
                        data={cv.education}
                        onChange={(data: any) => updateCVData('education', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'skills':
                return (
                    <SkillsSection
                        data={cv.skills}
                        onChange={(data: any) => updateCVData('skills', data)}
                        userTier={userTier || 'Premium'} // Default to Premium for testing
                        cvData={cv} // Pass full CV data for AI context
                        cvId={cv.id}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'languages':
                return (
                    <LanguagesSection
                        data={cv.languages}
                        onChange={(data: any) => updateCVData('languages', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'projects':
                return (
                    <ProjectsSection
                        data={cv.projects as any}
                        onChange={(data: any) => updateCVData('projects', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'certifications':
                return (
                    <CertificationsSection
                        data={cv.certifications}
                        onChange={(data: any) => updateCVData('certifications', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'volunteer':
                return (
                    <VolunteerExperienceSection
                        data={cv.volunteerExperience}
                        onChange={(data: any) => updateCVData('volunteerExperience', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'customSections':
                return (
                    <ElaveSections
                        data={cv.customSections}
                        onChange={(data: any) => updateCVData('customSections', data)}
                        userTier={userTier}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'template':
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">
                            {cv.cvLanguage === 'english' ? 'Template Selection' : 'Şablon Seçimi'}
                        </h3>
                        <TemplateSelector
                            selectedTemplateId={cv.templateId}
                            onTemplateSelect={(templateId: string) => setCv(prev => ({ ...prev, templateId }))}
                            userTier={userTier || 'premium'}
                            cvLanguage={cv.cvLanguage}
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-500">
                            {cv.cvLanguage === 'english' ? 'Select a section' : 'Bölmə seçin'}
                        </p>
                    </div>
                );
        }
    };

        return (
        <div className="min-h-screen bg-gray-50">
        
            
            {/* CV Editor Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200  top-16 z-[0]">
                <div className="max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-16">
                        
                        {/* Left side - Title */}
                        <div className="flex items-center min-w-0">
                            <div className="ml-2 sm:ml-4 min-w-0">
                                <input
                                    type="text"
                                    value={cv.title}
                                    onChange={(e) => setCv(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder={cv.cvLanguage === 'english' ? 'CV Title' : 'CV başlığı'}
                                    className="text-base sm:text-lg font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-28 sm:w-48 md:w-auto truncate"
                                />
                            </div>
                            
                            {/* Desktop AI & Font Buttons - Hidden on mobile */}
                            <div className="hidden lg:flex items-center">
                                {/* AI Translate Button */}
                                <button
                                    onClick={() => {
                                        console.log('AI Translate clicked');
                                        setShowTranslationPanel(true);
                                    }}
                                    className="ml-3 flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 border border-white/20"
                                    title={cv.cvLanguage === 'english' ? 'Translate with AI' : 'AI ilə tərcümə et'}
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    {cv.cvLanguage === 'english' ? 'AI Translate' : 'AI Tərcümə'}
                                </button>

                                {/* Simple Font Button */}
                                <button
                                    onClick={() => setShowFontPanel(true)}
                                    className="ml-2 flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-200 border border-white/20"
                                    title={cv.cvLanguage === 'english' ? 'Font settings' : 'Font tənzimləmələri'}
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    {cv.cvLanguage === 'english' ? 'Font Manager' : 'Font İdarə'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Right side - Actions & Status */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            {/* Status - hidden on small screens */}
                            <div className="hidden md:flex items-center space-x-3">
                                {saving && (
                                    <span className="text-xs text-blue-600 animate-pulse">
                                        {cv.cvLanguage === 'english' ? 'Saving...' : 'Yadda saxlanılır...'}
                                    </span>
                                )}
                                {success && (
                                    <span className="text-xs text-green-600">
                                        ✓ {cv.cvLanguage === 'english' ? 'Saved' : 'Yadda saxlanıldı'}
                                    </span>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            {cv.id && (
                                <>
                                    {/* 🚀 SENIOR DEV: Birbaşa PDF Export Button */}
                                    <button
                                        onClick={handleDirectPDFExport}
                                        disabled={saving}
                                        className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={cv.cvLanguage === 'english' ? 'Download PDF' : 'PDF Yüklə'}
                                    >
                                        {saving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c-.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                        )}
                                        <span className="hidden sm:inline ml-2">
                                            {cv.cvLanguage === 'english' ? 'PDF' : 'PDF'}
                                        </span>
                                    </button>

                                    {/* Export Page Button */}
                                    <button
                                        onClick={() => {
                                            // Font settings-ləri həm export həm də persistent storage-ə saxla
                                            const fontSettingsJSON = JSON.stringify(fontSettings);
                                            localStorage.setItem('exportFontSettings', fontSettingsJSON);
                                            localStorage.setItem('currentFontSettings', fontSettingsJSON);
                                            console.log('🚀 CVEditor: Font settings export page üçün hazırlandı:', fontSettings);
                                            window.open(`/cv/export/${cv.id}`, '_blank');
                                        }}
                                        className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 transition-colors"
                                        aria-label={cv.cvLanguage === 'english' ? 'Export Page' : 'Export Səhifəsi'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                        <span className="hidden sm:inline ml-2">
                                            {cv.cvLanguage === 'english' ? 'Export' : 'Export'}
                                        </span>
                                    </button>
                                </>
                            )}
                            
                            <button
                                onClick={onCancel}
                                className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-gray-700 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label={cv.cvLanguage === 'english' ? 'Go Back' : 'Geri qayıdın'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                <span className="hidden sm:inline ml-2">
                                    {cv.cvLanguage === 'english' ? 'Go Back' : 'Geri qayıdın'}
                                </span>
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                {saving ? '...' : <>
                                    <span className="hidden sm:inline">
                                        {cv.cvLanguage === 'english' ? 'Save' : 'Yadda Saxlayın'}
                                    </span>
                                    <span className="sm:hidden">
                                        {cv.cvLanguage === 'english' ? 'Save' : 'Saxla'}
                                    </span>
                                </>}
                            </button>
                        </div>
                    </div>

                    {/* Mobile AI & Font Tools Panel - Only shown on mobile */}
                    <div className="lg:hidden border-t border-gray-100 py-3">
                        <div className="flex items-center justify-center gap-3">
                            {/* AI Translate Button */}
                            <button
                                onClick={() => {
                                    console.log('AI Translate clicked');
                                    setShowTranslationPanel(true);
                                }}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 shadow-md"
                                title={cv.cvLanguage === 'english' ? 'Translate with AI' : 'AI ilə tərcümə et'}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                {cv.cvLanguage === 'english' ? 'AI Translate' : 'AI Tərcümə'}
                            </button>

                            {/* Font Manager Button */}
                            <button
                                onClick={() => setShowFontPanel(true)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-200 shadow-md"
                                title={cv.cvLanguage === 'english' ? 'Font settings' : 'Font tənzimləmələri'}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                {cv.cvLanguage === 'english' ? 'Font Manager' : 'Font İdarə'}
                            </button>

                            {/* Mobile Status Indicator */}
                            <div className="md:hidden flex items-center ml-auto">
                                {saving && (
                                    <div className="flex items-center text-xs text-blue-600">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                        {cv.cvLanguage === 'english' ? 'Saving...' : 'Saxlanır...'}
                                    </div>
                                )}
                                {success && (
                                    <span className="text-xs text-green-600 flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {cv.cvLanguage === 'english' ? 'Saved' : 'Saxlanıldı'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Content */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col xl:flex-row gap-8">
                    {/* Left Panel - Sections */}
                    <div className="xl:w-2/5 xl:max-w-xl">
                        {/* Section Navigation */}
                        <div className="mb-8">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 px-2">
                                    {cv.cvLanguage === 'english' ? 'CV Sections' : 'CV Bölmələri'}
                                </h3>
                                
                                {/* Scrollable Main Sections */}
                                <div className="space-y-1 max-h-[250px] overflow-y-auto pr-2">
                                    {mainSections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                                                activeSection === section.id
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <span className={`text-lg transition-transform duration-200 ${activeSection === section.id ? 'scale-110' : ''}`}>{section.icon}</span>
                                            <span className="flex-1">{section.label}</span>
                                            {activeSection === section.id && (
                                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Separator and Template Section */}
                                {templateSection && (
                                    <>
                                        <div className="my-3 h-px bg-gray-200"></div>
                                        <div className="space-y-1">
                                            <button
                                                key={templateSection.id}
                                                onClick={() => setActiveSection(templateSection.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                                                    activeSection === templateSection.id
                                                        ? 'bg-indigo-600 text-white shadow-lg'
                                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                            >
                                                <span className={`text-lg transition-transform duration-200 ${activeSection === templateSection.id ? 'scale-110' : ''}`}>{templateSection.icon}</span>
                                                <span className="flex-1">{templateSection.label}</span>
                                                {activeSection === templateSection.id && (
                                                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

    
    
                        {/* Form Content */}
<div className="bg-white rounded-xl border border-gray-200 shadow-sm">
    {/* Section Header */}
    <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-2xl">
                {allSections.find(s => s.id === activeSection)?.icon}
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">
                    {allSections.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {getSectionDescription(activeSection, cv.cvLanguage)}
                </p>
            </div>
        </div>
    </div>
    
    <div className="p-6 bg-slate-50/50">
        {/* Error/Success Messages */}
        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )}

        {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
            </div>
        )}
  {/* Section Content */}
        {renderSectionContent()}
    </div>
</div>
                    </div>

             

                    {/* Right Panel - Preview */}
                    <div className="xl:w-3/5">
                        <div className="sticky top-24">
                            {/* Preview Header */}
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>{cv.cvLanguage === 'english' ? 'Preview' : 'Önizləmə'}</span>
                                </h3>
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        A4 Format
                                    </span>
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full capitalize">
                                        {cv.templateId.replace('-', ' ')}
                                    </span>
                                </div>
                            </div>

                    {/* A4 Preview Container */}
<div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 transition-all duration-300 overflow-hidden">
    {/* Desktop: Vertical scrolling enabled for long CVs */}
    <div className="hidden lg:block h-[calc(100vh-12rem)] p-4 sm:p-8 flex justify-center items-start border border-white overflow-y-auto">
        <div 
            className="bg-white rounded-xl border border-white shadow-2xl shadow-slate-300/60 transition-transform duration-300 mb-8"
        >
            {renderPreview()}
        </div>
    </div>
    
    {/* Mobile: Yenidən düzəldilmiş scroll və ölçü sistemi */}
    <div className="block lg:hidden">
        <div className="h-[calc(100vh-12rem)] overflow-auto bg-gray-100 p-4">
            <div className="min-h-full flex items-start justify-start">
                <div
                    style={{
                        width: '210mm',
                        height: '297mm',
                        maxHeight: 'calc(100vh - 12rem)',
                        maxWidth: 'calc(100vw - 2rem)',
                        transform: 'scale(1.5)',
                        transformOrigin: 'top left',
                        marginTop: '1rem',
                        marginBottom: '1rem',
                        marginLeft: '0'
                    }}
                >
                    
                    {renderPreview()}
                </div>
            </div>
        </div>

        {/* Mobile External Section Reorder Buttons - Below Preview */}
        {isMobile && activeMobileSection && (
            <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="max-w-lg mx-auto">
                    {/* Selected Section Info */}
                    <div className="text-center mb-4">
                        <div className="text-sm text-gray-600 mb-1">Seçilmiş Bölmə:</div>
                        <div className="text-lg font-semibold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                            {getSectionName(activeMobileSection, cv.cvLanguage, cv.sectionNames, cv)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Cari sıra: {getVisibleSections().indexOf(activeMobileSection) + 1} / {getVisibleSectionsCount()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-3">
                        {/* Move Up Button */}
                        <button
                            onClick={() => {
                                console.log('🔼 Move up clicked for:', activeMobileSection);
                                moveSection(activeMobileSection, 'up');
                                // Provide immediate haptic feedback
                                if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                }
                            }}
                            disabled={getVisibleSections().indexOf(activeMobileSection) === 0}
                            className={`
                                flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform
                                ${getVisibleSections().indexOf(activeMobileSection) === 0
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-95 active:bg-blue-800'
                                }
                            `}
                            style={{ 
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4l-8 8h6v8h4v-8h6l-8-8z"/>
                            </svg>
                            Yuxarı
                        </button>

                        {/* Move Down Button */}
                        <button
                            onClick={() => {
                                console.log('🔽 Move down clicked for:', activeMobileSection);
                                moveSection(activeMobileSection, 'down');
                                // Provide immediate haptic feedback
                                if (navigator.vibrate) {
                                    navigator.vibrate(50);
                                }
                            }}
                            disabled={getVisibleSections().indexOf(activeMobileSection) === getVisibleSections().length - 1}
                            className={`
                                flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform
                                ${getVisibleSections().indexOf(activeMobileSection) === getVisibleSections().length - 1
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-95 active:bg-blue-800'
                                }
                            `}
                            style={{ 
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 20l8-8h-6V4H8v8H2l8 8z"/>
                            </svg>
                            Aşağı
                        </button>

                        {/* Close Selection Button */}
                        <button
                            onClick={() => setActiveMobileSection(null)}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200 transform hover:shadow-lg active:scale-95"
                            style={{ 
                                touchAction: 'manipulation',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            Bağla
                        </button>
                    </div>

                    {/* Helper Text */}
                    <div className="text-center text-xs text-gray-500 mt-3">
                        📱 CV bölməsinin yerini dəyişmək üçün yuxarı və ya aşağı düymələrini istifadə edin
                    </div>
                </div>
            </div>
        )}

        {/* Mobile instruction when no section selected */}
        {isMobile && !activeMobileSection && (
            <div className="bg-blue-50 border-t border-blue-200 p-4">
                <div className="text-center">
                    <div className="text-sm text-blue-700 font-medium">
                        📋 Sırasını dəyişmək istədiyiniz bölməni seçin
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        CV-də istənilən bölməyə toxunaraq seçə bilərsiniz
                    </div>
                </div>
            </div>
        )}

      
    </div>
</div>
</div>
                    </div>
                </div>
            </div>
        
        {showTranslationPanel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                    <div className="p-3 sm:p-4 lg:p-6">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                {cv.cvLanguage === 'english' ? 'AI Translation Panel' : 'AI Tərcümə Paneli'}
                            </h2>
                              <button
              onClick={() => setShowTranslationPanel(false)}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors duration-200 group"
              
            >
              <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
                            
                            
                          
                        </div>
                        <CVTranslationPanel
                            cvData={cv}
                            currentLanguage={cv.cvLanguage as CVLanguage}
                            onCVUpdate={(updatedCV) => {
                                console.log('🔄 CVEditor: Receiving translated CV:', updatedCV);
                                console.log('📝 CVEditor: New language:', updatedCV.cvLanguage);
                                console.log('🏷️ CVEditor: Section names:', updatedCV.sectionNames);
                                
                                // Update CV state with translated content INCLUDING section names
                                setCv(prevCV => ({
                                    ...prevCV,
                                    ...updatedCV,
                                    sectionNames: updatedCV.sectionNames || {}
                                }));
                                
                                console.log('🔧 CVEditor: Updated CV state with section names');
                                
                                // Force re-render by updating active section
                                setActiveSection(prev => {
                                    // If current section exists in new section names, keep it
                                    // Otherwise switch to first available section
                                    const sections = getSections(updatedCV.cvLanguage as CVLanguage, updatedCV.sectionNames || {});
                                    console.log('📋 CVEditor: Generated sections with new names:', sections);
                                    return sections.find(s => s.id === prev)?.id || sections[0]?.id || prev;
                                });
                                
                                setShowTranslationPanel(false);
                                
                                console.log('✅ CVEditor: CV state updated with translation and section names');
                            }}
                            onLanguageChange={(language) => {
                                console.log('🌐 CVEditor: Language changed to:', language);
                                setCv(prev => ({ ...prev, cvLanguage: language as any }));
                            }}
                            onClose={() => setShowTranslationPanel(false)}
                            userTier={userTier}
                        />
                    </div>
                </div>
            </div>
        )}

        {/* Font Manager Panel - Fully Responsive & Professional */}
        {showFontPanel && (
            <div 
                className="fixed inset-0 z-[999999] 
                           /* Mobile: Centered with proper padding */
                           flex items-center justify-center p-4
                           /* Desktop: Left-aligned positioning */
                           lg:items-center lg:justify-start lg:pl-8"
                onClick={() => setShowFontPanel(false)}
            >
                <div 
                    className="bg-white shadow-2xl w-full relative z-[1000000] 
                               /* Mobile: Full-width with controlled height */
                               max-w-lg max-h-[90vh] flex flex-col rounded-xl
                               /* Desktop: Sidebar-style positioning */
                               lg:max-w-sm lg:w-96 lg:max-h-[85vh] lg:rounded-lg
                               /* Enhanced visual effects */
                               ring-1 ring-black/5 border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Professional Header */}
                    <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                {cv.cvLanguage === 'english' ? 'Font Manager' : 'Font İdarə'}
                            </h2>
                            <button
                                onClick={() => setShowFontPanel(false)}
                                className="flex items-center justify-center w-9 h-9 
                                         bg-white hover:bg-gray-100 rounded-full shadow-sm border border-gray-200
                                         text-gray-500 hover:text-gray-700 transition-all duration-200
                                         hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={cv.cvLanguage === 'english' ? 'Close' : 'Bağla'}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Mobile-First Scrollable Content */}
                    <div className="flex-1 overflow-y-auto 
                                   /* Mobile: Compact padding for more content space */
                                   p-3 pb-6
                                   /* Tablet & Desktop: More spacious */
                                   sm:p-6 sm:pb-8
                                   /* Vertical spacing between elements */
                                   space-y-3 sm:space-y-4
                                   /* Enhanced mobile scrolling performance */
                                   scroll-smooth touch-pan-y overscroll-contain
                                   /* Better scroll momentum on iOS */
                                   -webkit-overflow-scrolling-touch
                                   /* Custom scrollbar styling */
                                   scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
                                   /* Ensure scrollable area takes full available height */
                                   min-h-0
                                   ">
                        {/* Font Family */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                {cv.cvLanguage === 'english' ? 'Font Family' : 'Font Ailəsi'}
                            </label>
                            <select
                                value={fontSettings.fontFamily}
                                onChange={(e) => setFontSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Arial, sans-serif">Arial</option>
                                    <option value="Georgia, serif">Georgia</option>
                                    <option value="Verdana, sans-serif">Verdana</option>
                                    <option value="Times New Roman, serif">Times New Roman</option>
                                </select>
                            </div>

                            {/* Heading Size */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 text-center">
                                    {cv.cvLanguage === 'english' ? 'Heading Size' : 'Başlıq Ölçüsü'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, headingSize: Math.max(16, prev.headingSize - 1) }))}
                                        disabled={fontSettings.headingSize <= 16}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.headingSize}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, headingSize: Math.min(24, prev.headingSize + 1) }))}
                                        disabled={fontSettings.headingSize >= 24}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Subheading Size */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 text-center">
                                    {cv.cvLanguage === 'english' ? 'Subheading Size' : 'Alt Başlıq Ölçüsü'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, subheadingSize: Math.max(14, prev.subheadingSize - 1) }))}
                                        disabled={fontSettings.subheadingSize <= 14}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.subheadingSize}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, subheadingSize: Math.min(20, prev.subheadingSize + 1) }))}
                                        disabled={fontSettings.subheadingSize >= 20}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Body Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Body Text Size' : 'Əsas Mətn Ölçüsü'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, bodySize: Math.max(10, prev.bodySize - 1) }))}
                                        disabled={fontSettings.bodySize <= 10}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.bodySize}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, bodySize: Math.min(18, prev.bodySize + 1) }))}
                                        disabled={fontSettings.bodySize >= 18}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Small Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Small Text Size' : 'Kiçik Mətn Ölçüsü'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, smallSize: Math.max(8, prev.smallSize - 1) }))}
                                        disabled={fontSettings.smallSize <= 8}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.smallSize}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, smallSize: Math.min(14, prev.smallSize + 1) }))}
                                        disabled={fontSettings.smallSize >= 14}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Heading Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Heading Weight' : 'Başlıq Qalınlığı'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, headingWeight: Math.max(400, prev.headingWeight - 100) }))}
                                        disabled={fontSettings.headingWeight <= 400}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.headingWeight}</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, headingWeight: Math.min(900, prev.headingWeight + 100) }))}
                                        disabled={fontSettings.headingWeight >= 900}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Subheading Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Subheading Weight' : 'Alt Başlıq Qalınlığı'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, subheadingWeight: Math.max(400, prev.subheadingWeight - 100) }))}
                                        disabled={fontSettings.subheadingWeight <= 400}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.subheadingWeight}</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, subheadingWeight: Math.min(800, prev.subheadingWeight + 100) }))}
                                        disabled={fontSettings.subheadingWeight >= 800}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Small Weight */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Small Text Weight' : 'Kiçik Mətn Qalınlığı'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, smallWeight: Math.max(300, prev.smallWeight - 100) }))}
                                        disabled={fontSettings.smallWeight <= 300}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.smallWeight}</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, smallWeight: Math.min(600, prev.smallWeight + 100) }))}
                                        disabled={fontSettings.smallWeight >= 600}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Section Spacing Control */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {cv.cvLanguage === 'english' ? 'Section Spacing' : 'Bölmələr Arası Məsafə'}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, sectionSpacing: Math.max(4, prev.sectionSpacing - 2) }))}
                                        disabled={fontSettings.sectionSpacing <= 4}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.sectionSpacing}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, sectionSpacing: Math.min(32, prev.sectionSpacing + 2) }))}
                                        disabled={fontSettings.sectionSpacing >= 32}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                        </div>

                    {/* Professional Action Buttons */}
                    <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 
                                   border-t border-gray-200 px-5 py-4
                                   flex flex-col sm:flex-row justify-center 
                                   space-y-3 sm:space-y-0 sm:space-x-3">
                        <button
                            onClick={() => {
                                setFontSettings({
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
                                });
                            }}
                            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-gray-700 
                                     bg-white border-2 border-gray-300 rounded-lg 
                                     hover:bg-gray-50 hover:border-gray-400 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                     transition-all duration-200 shadow-sm"
                        >
                            {cv.cvLanguage === 'english' ? 'Reset' : 'Sıfırla'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}