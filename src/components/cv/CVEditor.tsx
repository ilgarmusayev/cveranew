import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { CVData, PersonalInfo, Experience, Education, Skill, Language, Project, Certification, VolunteerExperience } from '@/types/cv';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Header from '@/components/Header';
import { CVTranslationPanel } from '@/components/translation/CVTranslationPanel';
import { CVLanguage } from '@/lib/cvLanguage';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { useLocalizedMessages } from '@/utils/errorMessages';
import { useUndoRedoState } from '@/hooks/useUndoRedoState';
// Import section components
import PersonalInfoSection from './sections/PersonalInfoSection';
import ExperienceSection from './sections/ExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import LanguagesSection from './sections/LanguagesSection';
import ProjectsSection from './sections/ProjectsSection';
import CertificationsSection from './sections/CertificationsSection';
import VolunteerExperienceSection from './sections/VolunteerExperienceSection';
import OrganizationsSection from './sections/OrganizationsSection';
import PublicationsSection from './sections/PublicationsSection';
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
    organizations: any[];
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
    organizations: any[];
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
    organizations: [],
    customSections: [],
    sectionOrder: [],
    cvLanguage: 'azerbaijani'
});

// Sections configuration
const getSections = (uiLanguage: 'english' | 'azerbaijani' | 'russian', translatedSectionNames?: Record<string, string>, useTranslatedNames: boolean = false) => {
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
            { id: 'organizations', label: 'Organizations', icon: '🏢' },
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
            { id: 'organizations', label: 'Təşkilatlar', icon: '🏢' },
            { id: 'customSections', label: 'Əlavə Bölmələr', icon: '📝' },
            { id: 'template', label: 'Şablon Seçimi', icon: '🎨' }
        ],
        russian: [
            { id: 'personal', label: 'Личная информация', icon: '👤' },
            { id: 'experience', label: 'Опыт работы', icon: '💼' },
            { id: 'education', label: 'Образование', icon: '🎓' },
            { id: 'skills', label: 'Навыки', icon: '🛠️' },
            { id: 'languages', label: 'Языки', icon: '🌍' },
            { id: 'projects', label: 'Проекты', icon: '🚀' },
            { id: 'certifications', label: 'Сертификаты', icon: '🏆' },
            { id: 'volunteer', label: 'Волонтерский опыт', icon: '❤️' },
            { id: 'organizations', label: 'Организации', icon: '🏢' },
            { id: 'customSections', label: 'Дополнительные разделы', icon: '📝' },
            { id: 'template', label: 'Выбор шаблона', icon: '🎨' }
        ]
    };

    const sections = defaultSections[uiLanguage] || defaultSections.azerbaijani;
    
    // Only use translated section names if explicitly requested (NOT for UI language changes)
    if (useTranslatedNames && translatedSectionNames) {
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
            'template': 'template',
            'publications': 'publications',
            'honorsAwards': 'honorsAwards',
            'courses': 'courses',
            'testScores': 'testScores',
            'organizations': 'organizations'
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

const getSectionDescription = (sectionId: string, uiLanguage: 'english' | 'azerbaijani' | 'russian') => {
    const descriptions: Record<'english' | 'azerbaijani' | 'russian', Record<string, string>> = {
        english: {
            personal: 'Provide your basic contact and personal details.',
            experience: 'Detail your professional work history.',
            education: 'List your academic qualifications and degrees.',
            skills: 'Showcase your technical and soft skills.',
            languages: 'Indicate your proficiency in different languages.',
            projects: 'Highlight significant projects you have worked on.',
            certifications: 'Add any relevant certifications you have earned.',
            volunteer: 'Describe your volunteer contributions.',
            organizations: 'List organizations you are a member of or hold positions in.',
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
            organizations: 'Üzvü olduğunuz və ya vəzifə tutduğunuz təşkilatları sadalayın.',
            customSections: 'Profilinizin unikal tərəflərini vurğulamaq üçün xüsusi bölmələr əlavə edin.',
            template: 'Stilinizi ən yaxşı əks etdirən şablonu seçin.'
        },
        russian: {
            personal: 'Укажите основную контактную и личную информацию.',
            experience: 'Детально опишите свою профессиональную трудовую историю.',
            education: 'Перечислите ваши академические квалификации и степени.',
            skills: 'Покажите ваши технические и мягкие навыки.',
            languages: 'Укажите ваш уровень владения различными языками.',
            projects: 'Выделите значимые проекты, над которыми вы работали.',
            certifications: 'Добавьте соответствующие сертификаты, которые вы получили.',
            volunteer: 'Опишите ваш волонтерский вклад.',
            organizations: 'Перечислите организации, членом которых вы являетесь или занимаете должности.',
            customSections: 'Добавьте пользовательские разделы, чтобы выделить уникальные аспекты вашего профиля.',
            template: 'Выберите шаблон, который лучше всего подходит вашему стилю.'
        }
    };
    return descriptions[uiLanguage][sectionId] || '';
};

export default function CVEditor({ cvId, onSave, onCancel, initialData, userTier }: CVEditorProps) {
    const { siteLanguage } = useSiteLanguage();
    
    // CVEditor labels
    const labels = {
        azerbaijani: {
            templateSelection: 'Şablon Seçimi',
            selectSection: 'Bölmə seçin',
            cvTitle: 'CV başlığı',
            translateWithAI: 'AI ilə tərcümə et',
            aiTranslate: 'AI Tərcümə',
            fontSettings: 'Font tənzimləmələri',
            fontManager: 'Font İdarə',

            saving: 'Yadda saxlanılır...',
            saved: 'Yadda saxlanıldı',
            downloadPDF: 'Yükləyin',
            pdf: 'PDF Yükləyin',
            goBack: 'Geri qayıdın',
            save: 'Yadda Saxlayın',
            saveShort: 'Saxlayın',
            cvSections: 'CV Bölmələri',
            preview: 'Önizləmə',
            aiTranslationPanel: 'AI Tərcümə Paneli',
            close: 'Bağla',
            headingSize: 'Başlıq Ölçüsü',
            savingShort: 'Saxlanır...',
            savedShort: 'Saxlanıldı',
            subheadingSize: 'Alt Başlıq Ölçüsü',
            bodyTextSize: 'Əsas Mətn Ölçüsü',
            smallTextSize: 'Kiçik Mətn Ölçüsü',
            headingWeight: 'Başlıq Qalınlığı',
            subheadingWeight: 'Alt Başlıq Qalınlığı',
            smallTextWeight: 'Kiçik Mətn Qalınlığı',
            sectionSpacing: 'Bölmələr Arası Məsafə',
            reset: 'Sıfırla',
            jobMatchTip: 'İşə Uyğunluq Tövsiyəsi:',
            jobMatchText: 'CV-nizin vakansiyaya uyğunluğunu yoxlamaq üçün buraya klikləyin',
            jobMatchLink: '/jobmatch',
            languageTip: 'Dil Tövsiyəsi:',
            languageText: 'CV-nizin dilinin vakansiyanın dili ilə uyğun olduğundan əmin olun və AI tərcümədən istifadə edin.',
            selectedSection: 'Seçilmiş Bölmə:'
        },
        english: {
            templateSelection: 'Template Selection',
            selectSection: 'Select a section',
            cvTitle: 'CV Title',
            translateWithAI: 'Translate with AI',
            aiTranslate: 'AI Translate',
            fontSettings: 'Font settings',
            fontManager: 'Font Manager',

            saving: 'Saving...',
            saved: 'Saved',
            downloadPDF: 'Download',
            pdf: 'PDF',
            goBack: 'Go Back',
            save: 'Save',
            saveShort: 'Save',
            cvSections: 'CV Sections',
            preview: 'Preview',
            aiTranslationPanel: 'AI Translation Panel',
            close: 'Close',
            headingSize: 'Heading Size',
            savingShort: 'Saving...',
            savedShort: 'Saved',
            subheadingSize: 'Subheading Size',
            bodyTextSize: 'Body Text Size',
            smallTextSize: 'Small Text Size',
            headingWeight: 'Heading Weight',
            subheadingWeight: 'Subheading Weight',
            smallTextWeight: 'Small Text Weight',
            sectionSpacing: 'Section Spacing',
            reset: 'Reset',
            jobMatchTip: 'Job Match Recommendation:',
            jobMatchText: 'Click here to check your CV compatibility with job postings',
            jobMatchLink: '/jobmatch',
            languageTip: 'Language Recommendation:',
            languageText: 'Ensure your CV language matches the job posting language and use AI translation when needed.',
            selectedSection: 'Selected Section:'
        },
        russian: {
            templateSelection: 'Выбор шаблона',
            selectSection: 'Выберите раздел',
            cvTitle: 'Название резюме',
            translateWithAI: 'Перевести с помощью ИИ',
            aiTranslate: 'ИИ Перевод',
            fontSettings: 'Настройки шрифта',
            fontManager: 'Менеджер шрифтов',

            saving: 'Сохранение...',
            saved: 'Сохранено',
            downloadPDF: 'Скачать',
            pdf: 'PDF',
            goBack: 'Назад',
            save: 'Сохранить',
            saveShort: 'Сохранить',
            cvSections: 'Разделы резюме',
            preview: 'Предпросмотр',
            aiTranslationPanel: 'Панель перевода ИИ',
            close: 'Закрыть',
            headingSize: 'Размер заголовка',
            savingShort: 'Сохранение...',
            savedShort: 'Сохранено',
            subheadingSize: 'Размер подзаголовка',
            bodyTextSize: 'Размер основного текста',
            smallTextSize: 'Размер мелкого текста',
            headingWeight: 'Толщина заголовка',
            subheadingWeight: 'Толщина подзаголовка',
            smallTextWeight: 'Толщина мелкого текста',
            sectionSpacing: 'Расстояние между разделами',
            reset: 'Сбросить',
            jobMatchTip: 'Рекомендация по соответствию работе:',
            jobMatchText: 'Нажмите здесь, чтобы проверить совместимость вашего резюме с вакансиями',
            jobMatchLink: '/jobmatch',
            languageTip: 'Языковая рекомендация:',
            languageText: 'Убедитесь, что язык резюме соответствует языку вакансии, и используйте ИИ-перевод при необходимости.',
            selectedSection: 'Выбранный раздел:'
        }
    };

    const content = labels[siteLanguage];
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
        'publications',
        'honorsAwards',
        'courses',
        'testScores',
        'organizations',
        'customSections'
    ];
    
    // Initialize CV state
    const [cv, setCv] = useState<CVEditorState>(() => {
        if (initialData) {
            // Check if initialData has a 'data' property (API format)
            const cvData = initialData.data || initialData;
            
            console.log('🔍 CVEditor loading CV with initialData:', {
                hasInitialData: !!initialData,
                hasPublications: !!cvData.publications,
                publicationsCount: cvData.publications?.length || 0,
                publications: cvData.publications,
                fullCvData: cvData
            });
            
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
                organizations: cvData.organizations || [],
                customSections: cvData.customSections || [],
                sectionOrder: cvData.sectionOrder && cvData.sectionOrder.length > 0 ? cvData.sectionOrder : defaultSectionOrder,
                cvLanguage: cvData.cvLanguage || 'azerbaijani',
                sectionNames: cvData.sectionNames || {}
            };

            console.log('✅ CVEditor initialized CV state with publications:', result.publications);
            return result;
        }
        
        // Create new CV with default data
        const defaultData = getDefaultCVData();
        return {
            id: cvId,
            title: 'Yeni CV',
            templateId: 'basic',
            ...defaultData,
            sectionOrder: defaultSectionOrder,
            sectionNames: {}
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
        // Load font settings from initialData if available (but exclude fontFamily - always use Azerbaijani fonts)
        if (initialData?.data?.fontSettings) {
            console.log('🎨 Font CVEditor: Loading font settings from database (enforcing Noto Sans Azerbaijani):', initialData.data.fontSettings);
            return {
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
        
        console.log('🎨 Font CVEditor: Using default font settings with Noto Sans Azerbaijani');
        return {
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
            sectionSpacing: 8     // Bölmələr arası məsafə (px)
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
    
    // AI Assistant Modal State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    
    // Check if current template is ATS or Aurora or Vertex
    const isAtlasTemplate = cv.templateId?.toLowerCase().includes('ats') || 
                         cv.templateId?.toLowerCase().includes('atlas') || 
                         cv.templateId?.toLowerCase().includes('clean') ||
                         cv.templateId?.toLowerCase().includes('minimal-professional') ||
                         cv.templateId?.toLowerCase().includes('aurora') ||
                         cv.templateId?.toLowerCase().includes('vertex');

    // Section order with undo/redo support
    const {
        state: sectionOrder,
        saveState: saveSectionOrderState,
        undo: undoSectionOrder,
        redo: redoSectionOrder,
        canUndo: canUndoSectionOrder,
        canRedo: canRedoSectionOrder
    } = useUndoRedoState<string[]>(cv.sectionOrder || defaultSectionOrder);

    // Sync sectionOrder state with CV state when CV changes
    useEffect(() => {
        const currentSectionOrder = cv.sectionOrder || defaultSectionOrder;
        if (JSON.stringify(currentSectionOrder) !== JSON.stringify(sectionOrder)) {
            // Update the undo/redo state when CV is loaded or changed externally
            saveSectionOrderState(currentSectionOrder);
        }
    }, [cv.sectionOrder]);

    // Keyboard handler for section order undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if not typing in an input field
            const target = e.target as HTMLElement;
            const isInputField = target.tagName === 'INPUT' || 
                               target.tagName === 'TEXTAREA' || 
                               target.contentEditable === 'true' ||
                               target.closest('[contenteditable="true"]');
            
            if (!isInputField && (e.ctrlKey || e.metaKey)) {
                if (e.key === 'z' && !e.shiftKey && canUndoSectionOrder) {
                    e.preventDefault();
                    undoSectionOrder();
                    // The state will be updated by the undo function, we'll sync it in the next effect
                } else if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedoSectionOrder) {
                    e.preventDefault();
                    redoSectionOrder();
                    // The state will be updated by the redo function, we'll sync it in the next effect
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [canUndoSectionOrder, canRedoSectionOrder, undoSectionOrder, redoSectionOrder]);

    // Sync CV state when sectionOrder changes from undo/redo (but avoid infinite loop)
    const previousSectionOrderRef = useRef<string[]>(sectionOrder);
    useEffect(() => {
        if (JSON.stringify(previousSectionOrderRef.current) !== JSON.stringify(sectionOrder)) {
            setCv(prevCv => ({
                ...prevCv,
                sectionOrder: sectionOrder
            }));
            setIsDirty(true);
            previousSectionOrderRef.current = sectionOrder;
        }
    }, [sectionOrder]);

    // Function to get actual visible sections count
    const getVisibleSectionsCount = useCallback(() => {
        let count = 0;
        
        if (cv.personalInfo?.summary?.trim()) count++; // summary
        if (cv.experience && cv.experience.length > 0) count++; // experience
        if (cv.education && cv.education.length > 0) count++; // education
        
        // For Atlas template, don't count skills/languages/certifications as they're in left panel
        if (!isAtlasTemplate) {
            if (cv.skills && cv.skills.length > 0) count++; // skills
            if (cv.languages && cv.languages.length > 0) count++; // languages
            if (cv.certifications && cv.certifications.length > 0) count++; // certifications
        }
        
        if (cv.projects && cv.projects.length > 0) count++; // projects
        if (cv.volunteerExperience && cv.volunteerExperience.length > 0) count++; // volunteer
        if (cv.publications && cv.publications.length > 0) count++; // publications
        if (cv.honorsAwards && cv.honorsAwards.length > 0) count++; // honors & awards
        if (cv.courses && cv.courses.length > 0) count++; // courses
        if (cv.testScores && cv.testScores.length > 0) count++; // test scores
        if (cv.organizations && cv.organizations.length > 0) count++; // organizations
        if (cv.customSections && cv.customSections.length > 0) count++; // customSections
        
        return count;
    }, [cv, isAtlasTemplate]);

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
                    // For Atlas template, skills are in left panel, don't count in main order
                    if (!isAtlasTemplate && cv.skills && cv.skills.length > 0) visibleSections.push(section);
                    break;
                case 'languages':
                    // For Atlas template, languages are in left panel, don't count in main order
                    if (!isAtlasTemplate && cv.languages && cv.languages.length > 0) visibleSections.push(section);
                    break;
                case 'projects':
                    if (cv.projects && cv.projects.length > 0) visibleSections.push(section);
                    break;
                case 'certifications':
                    // For Atlas template, certifications are in left panel, don't count in main order
                    if (!isAtlasTemplate && cv.certifications && cv.certifications.length > 0) visibleSections.push(section);
                    break;
                case 'volunteer':
                    if (cv.volunteerExperience && cv.volunteerExperience.length > 0) visibleSections.push(section);
                    break;
                case 'publications':
                    if (cv.publications && cv.publications.length > 0) visibleSections.push(section);
                    break;
                case 'honorsAwards':
                    if (cv.honorsAwards && cv.honorsAwards.length > 0) visibleSections.push(section);
                    break;
                case 'courses':
                    if (cv.courses && cv.courses.length > 0) visibleSections.push(section);
                    break;
                case 'testScores':
                    if (cv.testScores && cv.testScores.length > 0) visibleSections.push(section);
                    break;
                case 'organizations':
                    if (cv.organizations && cv.organizations.length > 0) visibleSections.push(section);
                    break;
                case 'customSections':
                    if (cv.customSections && cv.customSections.length > 0) visibleSections.push(section);
                    break;
            }
        });
        
        return visibleSections;
    }, [cv, sectionOrder, isAtlasTemplate]);
    
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

    // Move function for left panel sections (Atlas template)
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
                    organizations: cv.organizations,
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
    const { getErrorMessage, getSuccessMessage } = useLocalizedMessages();

   const updateCVData = (section: keyof CVEditorState, data: any) => {
        console.log('📝 CVEditor updateCVData called:', {
            section,
            dataType: typeof data,
            dataLength: Array.isArray(data) ? data.length : 'not array',
            data: section === 'publications' ? data : 'not publications'
        });
        
        // Publications üçün əlavə debug
        if (section === 'publications') {
            console.log('📚 Publications data updated:', data);
        }
        
        setCv(prev => ({
            ...prev,
            [section]: data
        }));
        
        // isDirty set et ki save edilsin
        setIsDirty(true);
    };



      const handleSave = useCallback(async () => {
        setSaving(true);
        
        try {
            console.log('💾 Starting CV save with publications:', cv.publications);
            
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
                    organizations: cv.organizations,
                    customSections: cv.customSections,
                    sectionOrder: cv.sectionOrder,
                    cvLanguage: cv.cvLanguage
                }
            };

            console.log('📚 Publications being saved:', cvData.data.publications);

            const payload = {
                title: cvData.title,
                templateId: cvData.templateId,
                cv_data: cvData.data,
                fontSettings: fontSettings // CRITICAL: Save font settings to database
            };
            
            console.log('🎨 CVEditor Save Payload:', {
                fontSettings: payload.fontSettings,
                templateId: payload.templateId,
                publications_count: payload.cv_data.publications?.length || 0
            });

            if (cv.id) {
                await apiClient.put(`/api/cv/${cv.id}`, payload);
                showSuccess(getSuccessMessage('cvUpdateSuccess'));
            } else {
                const response = await apiClient.post('/api/cv', payload);
                const newCV = response.data;
                setCv(prev => ({ ...prev, id: newCV.id }));
                showSuccess(getSuccessMessage('cvCreateSuccess'));
                // Yeni yaranan CV-ni ana komponentə ötürürük.
                cvData.id = newCV.id;
            }
            
            // DÜZGÜN YANAŞMA: Ana komponentə xəbər veririk.
            onSave(cvData);

        } catch (error) {
            console.error('❌ Save error:', error);
            showError(getErrorMessage('cvSaveError'));
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
                showError(getErrorMessage('cvExportError'));
                return;
            }

            // 🚫 PDF Export zamanı page break indikatorlarını gizlət
            const pageBreakElements = document.querySelectorAll(`
                .page-break-indicator,
                .page-break-preview,
                .page-number,
                .page-number-indicator,
                .page-break-line,
                .page-break-label,
                [class*="page-break"],
                [data-page-break]
            `);
            
            const originalStyles: { element: Element; display: string; visibility: string }[] = [];
            
            // Page break elementlərini gizlət və original style-ları saxla
            pageBreakElements.forEach(element => {
                if (element instanceof HTMLElement) {
                    originalStyles.push({
                        element,
                        display: element.style.display,
                        visibility: element.style.visibility
                    });
                    element.style.display = 'none';
                    element.style.visibility = 'hidden';
                }
            });

            // 🎯 Font settings convert - useSimpleFontSettings → export format (fontFamily enforced server-side)
            const exportFontSettings = {
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
            
            // CSS-ləri də al və page break indikatorlarını gizlədən CSS əlavə et
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
                .join('\n') + `
                
                /* 🚫 CVEditor PDF Export - Page Break İndikatorlarını Gizlət */
                .page-break-indicator,
                .page-break-preview,
                .page-number,
                .page-number-indicator,
                .page-break-line,
                .page-break-label,
                [class*="page-break"],
                [data-page-break] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    background: none !important;
                }
                
                @media print {
                    .page-break-indicator,
                    .page-break-preview,
                    .page-number,
                    .page-number-indicator {
                        display: none !important;
                    }
                }
            `;

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
                showError(getErrorMessage('pdfExportError'));
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

            showSuccess(getSuccessMessage('genericSuccess'));
            console.log('✅ PDF export uğurlu oldu');

        } catch (error) {
            console.error('PDF export xətası:', error);
            showError(getErrorMessage('pdfExportError'));
        } finally {
            setSaving(false);
        }
    }, [cv, fontSettings, showSuccess, showError]);


    // Get sections for current language with memoization
    const allSections = useMemo(() => {
        return getSections(siteLanguage, cv.sectionNames || {}, false);
    }, [siteLanguage, cv.sectionNames]);
    
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
        
        // Check if this is a left panel section (Atlas template)
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

    // AI Analysis Function
    const handleAiAnalysis = useCallback(async () => {
        setIsAiAnalyzing(true);
        setIsAiModalOpen(true);
        
        try {
            // Prepare CV data for analysis
            const cvText = `
PERSONAL INFO:
Name: ${cv.personalInfo.firstName} ${cv.personalInfo.lastName}
Email: ${cv.personalInfo.email}
Phone: ${cv.personalInfo.phone}
Location: ${cv.personalInfo.location || cv.personalInfo.address || ''}
Summary: ${cv.personalInfo.summary}

EXPERIENCE:
${cv.experience.map(exp => `
- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})
  ${exp.description}
`).join('')}

EDUCATION:
${cv.education.map(edu => `
- ${edu.degree} at ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})
  ${edu.description || ''}
`).join('')}

SKILLS:
${cv.skills.map(skill => `${skill.name} (${skill.level})`).join(', ')}

LANGUAGES:
${cv.languages.map(lang => `${lang.language} (${lang.level})`).join(', ')}

PROJECTS:
${cv.projects.map(proj => `
- ${proj.name}: ${proj.description}
  Technologies: ${proj.technologies?.join(', ')}
`).join('')}
            `.trim();

            const response = await fetch('/api/ai/analyze-cv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cvText,
                    language: cv.cvLanguage || 'az', // CV dili: az/en/ru
                    personalInfo: cv.personalInfo,
                    experience: cv.experience,
                    education: cv.education,
                    skills: cv.skills,
                    languages: cv.languages,
                    projects: cv.projects
                }),
            });

            if (!response.ok) {
                throw new Error('AI analysis failed');
            }

            const result = await response.json();
            console.log('🤖 AI Response:', result);
            console.log('📋 AI Suggestions:', result.suggestions);
            console.log('🔍 Skills suggestions:', result.suggestions?.filter((s: any) => s.type === 'skills'));
            setAiSuggestions(result.suggestions || []);
            
        } catch (error) {
            console.error('AI Analysis Error:', error);
            showError('AI analizi zamanı xəta baş verdi');
            setIsAiModalOpen(false);
        } finally {
            setIsAiAnalyzing(false);
        }
    }, [cv, showError]);

    // Apply AI Suggestion Function
    const applyAiSuggestion = useCallback((suggestion: any) => {
        try {
            console.log('🔧 Applying AI suggestion:', suggestion);
            const { type, field, newValue, sectionIndex } = suggestion;
            console.log('📋 Type:', type, 'Field:', field, 'Value:', newValue);
            
            setCv(prevCv => {
                const newCv = { ...prevCv };
                
                switch (type) {
                    case 'personalInfo':
                    case 'summary':
                        newCv.personalInfo = {
                            ...newCv.personalInfo,
                            [field]: newValue
                        };
                        break;
                    case 'experience':
                        if (sectionIndex !== undefined && newCv.experience[sectionIndex]) {
                            newCv.experience[sectionIndex] = {
                                ...newCv.experience[sectionIndex],
                                [field]: newValue
                            };
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni iş təcrübəsi əlavə etmək - ID avtomatik əlavə et
                            const newExperience = {
                                id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ...newValue
                            };
                            newCv.experience = [...newCv.experience, newExperience];
                        }
                        break;
                    case 'education':
                        if (sectionIndex !== undefined && newCv.education[sectionIndex]) {
                            newCv.education[sectionIndex] = {
                                ...newCv.education[sectionIndex],
                                [field]: newValue
                            };
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni təhsil əlavə etmək - ID avtomatik əlavə et
                            const newEducation = {
                                id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ...newValue
                            };
                            newCv.education = [...newCv.education, newEducation];
                        }
                        break;
                    case 'skills':
                        console.log('🎯 Skills case - field:', field, 'sectionIndex:', sectionIndex);
                        console.log('🎯 newValue:', newValue);
                        console.log('🎯 Current skills:', newCv.skills);
                        
                        if (field && sectionIndex !== undefined && newCv.skills[sectionIndex]) {
                            // Konkret skill-i yeniləmək
                            console.log('✏️ Updating existing skill at index:', sectionIndex);
                            newCv.skills[sectionIndex] = {
                                ...newCv.skills[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            // Bütün skills array-ini əvəz etmək
                            console.log('🔄 Replacing entire skills array');
                            newCv.skills = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni skill əlavə etmək - ID avtomatik əlavə et
                            console.log('➕ Adding new skill:', newValue);
                            const newSkill = {
                                id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ...newValue
                            };
                            console.log('✅ New skill with ID:', newSkill);
                            newCv.skills = [...newCv.skills, newSkill];
                            console.log('📦 Updated skills array:', newCv.skills);
                        } else {
                            console.error('⚠️ Skills case - no condition matched!');
                        }
                        break;
                    case 'languages':
                        if (sectionIndex !== undefined && newCv.languages[sectionIndex]) {
                            newCv.languages[sectionIndex] = {
                                ...newCv.languages[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.languages = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni dil əlavə etmək - ID avtomatik əlavə et
                            const newLanguage = {
                                id: `language-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ...newValue
                            };
                            newCv.languages = [...newCv.languages, newLanguage];
                        }
                        break;
                    case 'projects':
                        if (sectionIndex !== undefined && newCv.projects[sectionIndex]) {
                            newCv.projects[sectionIndex] = {
                                ...newCv.projects[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.projects = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni layihə əlavə etmək - ID avtomatik əlavə et
                            const newProject = {
                                id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                ...newValue
                            };
                            newCv.projects = [...newCv.projects, newProject];
                        }
                        break;
                    case 'certifications':
                        if (sectionIndex !== undefined && newCv.certifications[sectionIndex]) {
                            newCv.certifications[sectionIndex] = {
                                ...newCv.certifications[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.certifications = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni sertifikat əlavə etmək
                            newCv.certifications = [...newCv.certifications, newValue];
                        }
                        break;
                    case 'volunteerExperience':
                        if (sectionIndex !== undefined && newCv.volunteerExperience[sectionIndex]) {
                            newCv.volunteerExperience[sectionIndex] = {
                                ...newCv.volunteerExperience[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.volunteerExperience = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni könüllü təcrübə əlavə etmək
                            newCv.volunteerExperience = [...newCv.volunteerExperience, newValue];
                        }
                        break;
                    case 'publications':
                        if (sectionIndex !== undefined && newCv.publications[sectionIndex]) {
                            newCv.publications[sectionIndex] = {
                                ...newCv.publications[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.publications = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni nəşr əlavə etmək
                            newCv.publications = [...newCv.publications, newValue];
                        }
                        break;
                    case 'honorsAwards':
                        if (sectionIndex !== undefined && newCv.honorsAwards[sectionIndex]) {
                            newCv.honorsAwards[sectionIndex] = {
                                ...newCv.honorsAwards[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.honorsAwards = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni mükafat əlavə etmək
                            newCv.honorsAwards = [...newCv.honorsAwards, newValue];
                        }
                        break;
                    case 'courses':
                        if (sectionIndex !== undefined && newCv.courses[sectionIndex]) {
                            newCv.courses[sectionIndex] = {
                                ...newCv.courses[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.courses = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni kurs əlavə etmək
                            newCv.courses = [...newCv.courses, newValue];
                        }
                        break;
                    case 'testScores':
                        if (sectionIndex !== undefined && newCv.testScores[sectionIndex]) {
                            newCv.testScores[sectionIndex] = {
                                ...newCv.testScores[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.testScores = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni test nəticəsi əlavə etmək
                            newCv.testScores = [...newCv.testScores, newValue];
                        }
                        break;
                    case 'organizations':
                        if (sectionIndex !== undefined && newCv.organizations[sectionIndex]) {
                            newCv.organizations[sectionIndex] = {
                                ...newCv.organizations[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.organizations = newValue;
                        } else if (field === 'add' && typeof newValue === 'object' && !Array.isArray(newValue)) {
                            // Yeni təşkilat əlavə etmək
                            newCv.organizations = [...newCv.organizations, newValue];
                        }
                        break;
                    case 'customSections':
                        if (sectionIndex !== undefined && newCv.customSections[sectionIndex]) {
                            newCv.customSections[sectionIndex] = {
                                ...newCv.customSections[sectionIndex],
                                [field]: newValue
                            };
                        } else if (Array.isArray(newValue)) {
                            newCv.customSections = newValue;
                        }
                        break;
                    default:
                        console.warn('Unknown suggestion type:', type);
                }
                
                return newCv;
            });
            
            setIsDirty(true);
            showSuccess('Təklif tətbiq edildi');
            
            // Remove applied suggestion from list
            setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
            
        } catch (error) {
            console.error('Error applying suggestion:', error);
            showError('Təklifi tətbiq etmək mümkün olmadı');
        }
    }, [setCv, setIsDirty, showSuccess, showError]);

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
                organizations: cv.organizations,
                customSections: cv.customSections,
                cvLanguage: cv.cvLanguage,
                sectionOrder: cv.sectionOrder,
                sectionNames: cv.sectionNames // Section names də əlavə edildi
            } as any
        };

        console.log('🎨 CVEditor renderPreview fontSettings:', fontSettings);

        return (
            <>
                {/* Job Match Recommendation */}
                <Link href={content.jobMatchLink} className="block mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-md hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center gap-1 sm:gap-1.5 shadow-sm">
                        <div className="flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <span className="text-green-800 font-medium text-[10px] sm:text-xs leading-tight">🎯 {content.jobMatchTip} </span>
                            <span className="text-green-700 underline text-[10px] sm:text-xs leading-tight">{content.jobMatchText}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </Link>

                {/* Language Recommendation */}
                <div className="mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md flex items-center gap-1 sm:gap-1.5 shadow-sm">
                    <div className="flex-shrink-0">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <span className="text-blue-800 font-medium text-[10px] sm:text-xs leading-tight">🌐 {content.languageTip} </span>
                        <span className="text-blue-700 text-[10px] sm:text-xs leading-tight">{content.languageText}</span>
                    </div>
                </div>

                <CVPreview 
                cv={previewData} 
                template={cv.templateId} 
                fontSettings={fontSettings}
                activeSection={activeMobileSection}
                onSectionSelect={handleMobileSectionSelect}
                onSectionReorder={(newOrder: string[]) => {
                    console.log('📋 Section reorder from CVPreview:', newOrder);
                    // Save current state for undo
                    saveSectionOrderState(sectionOrder);
                    // Update both local undo/redo state and CV state
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
            </>
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

            case 'organizations':
                return (
                    <OrganizationsSection
                        data={cv.organizations}
                        onChange={(data: any) => updateCVData('organizations', data)}
                        cvLanguage={cv.cvLanguage}
                    />
                );

            case 'publications':
                return (
                    <PublicationsSection
                        data={cv.publications}
                        onChange={(data: any) => updateCVData('publications', data)}
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
                            {content.templateSelection}
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
                            {content.selectSection}
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
                                    placeholder={content.cvTitle}
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
                                    title={content.translateWithAI}
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                    </svg>
                                    {content.aiTranslate}
                                </button>

                                {/* Simple Font Button */}
                                <button
                                    onClick={() => setShowFontPanel(true)}
                                    className="ml-2 flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-200 border border-white/20"
                                    title={content.fontSettings}
                                >
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                    {content.fontManager}
                                </button>


                            </div>
                        </div>
                        
                        {/* Right side - Actions & Status */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            {/* Status - hidden on small screens */}
                            <div className="hidden md:flex items-center space-x-3">
                                {saving && (
                                    <span className="text-xs text-blue-600 animate-pulse">
                                        {content.saving}
                                    </span>
                                )}
                                {success && (
                                    <span className="text-xs text-green-600">
                                        ✓ {content.saved}
                                    </span>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            {cv.id && (
                                <>
                                    {/* 🚀 SENIOR DEV: Birbaşa PDF Export Button - Mobile Optimized */}
                                    <button
                                        onClick={handleDirectPDFExport}
                                        disabled={saving}
                                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={content.downloadPDF}
                                    >
                                        {saving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        ) : (
                                            <>
                                                {/* Icon only on desktop */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 hidden sm:block">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c-.621 0-1.125-.504-1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                </svg>
                                                {/* Text always visible */}
                                                <span className="sm:ml-2">
                                                    {content.downloadPDF}
                                                </span>
                                            </>
                                        )}
                                    </button>

                                   
                                </>
                            )}
                            
                            <button
                                onClick={onCancel}
                                className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-gray-700 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label={content.goBack}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                <span className="hidden sm:inline ml-2">
                                    {content.goBack}
                                </span>
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                {saving ? '...' : <>
                                    <span className="hidden sm:inline">
                                        {content.save}
                                    </span>
                                    <span className="sm:hidden">
                                        {content.saveShort}
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
                                title={content.translateWithAI}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                {content.aiTranslate}
                            </button>

                            {/* Font Manager Button */}
                            <button
                                onClick={() => setShowFontPanel(true)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg transition-all duration-200 shadow-md"
                                title={content.fontSettings}
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                {content.fontManager}
                            </button>





                            {/* Mobile Status Indicator */}
                            <div className="md:hidden flex items-center ml-auto">
                                {saving && (
                                    <div className="flex items-center text-xs text-blue-600">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                        {content.savingShort}
                                    </div>
                                )}
                                {success && (
                                    <span className="text-xs text-green-600 flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {content.savedShort}
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
                                    {content.cvSections}
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
                    {getSectionDescription(activeSection, siteLanguage)}
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
                                    <span>{content.preview}</span>
                                </h3>
                                <div className="flex items-center space-x-3">
                                  
                                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full capitalize">
                                        {cv.templateId.replace('-', ' ')}
                                    </span>
                                </div>
                            </div>

                    {/* A4 Preview Container */}
<div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 transition-all duration-300 overflow-hidden">
    {/* Desktop: A4 size container with vertical scrolling */}
    <div 
        className="hidden lg:flex p-4 sm:p-8 justify-center items-start border border-white overflow-y-auto"
        style={{
            height: '297mm'
        }}
    >
        <div 
            className="bg-white rounded-xl border border-white shadow-2xl shadow-slate-300/60 transition-transform duration-300 mb-8"
            style={{
                width: '210mm',
                minHeight: '297mm'
            }}
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
                        <div className="text-sm text-gray-600 mb-1">{content.selectedSection}</div>
                        <div className="text-lg font-semibold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                            {getSectionName(activeMobileSection, siteLanguage, cv.sectionNames, cv)}
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
                        📱 {siteLanguage === 'azerbaijani' ? 'CV bölməsinin yerini dəyişmək üçün yuxarı və ya aşağı düymələrini istifadə edin' : 
                             siteLanguage === 'russian' ? 'Используйте кнопки вверх или вниз, чтобы изменить положение раздела резюме' : 
                             'Use the up or down buttons to change the position of the CV section'}
                    </div>
                </div>
            </div>
        )}

        {/* Mobile instruction when no section selected */}
        {isMobile && !activeMobileSection && (
            <div className="bg-blue-50 border-t border-blue-200 p-4">
                <div className="text-center">
                    <div className="text-sm text-blue-700 font-medium">
                        📋 {siteLanguage === 'azerbaijani' ? 'Sırasını dəyişmək istədiyiniz bölməni seçin' : 
                             siteLanguage === 'russian' ? 'Выберите раздел для изменения порядка' : 
                             'Select the section you want to reorder'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                        {siteLanguage === 'azerbaijani' ? 'CV-də istənilən bölməyə toxunaraq seçə bilərsiniz' : 
                         siteLanguage === 'russian' ? 'Вы можете выбрать любой раздел в резюме, нажав на него' : 
                         'You can select any section in the CV by tapping on it'}
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
                                {content.aiTranslationPanel}
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
                            uiLanguage={siteLanguage}
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
                                    // Don't use translated section names for UI - use site language
                                    const sections = getSections(siteLanguage, {}, false);
                                    console.log('📋 CVEditor: Generated sections with site language:', sections);
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
                                {content.fontManager}
                            </h2>
                            <button
                                onClick={() => setShowFontPanel(false)}
                                className="flex items-center justify-center w-9 h-9 
                                         bg-white hover:bg-gray-100 rounded-full shadow-sm border border-gray-200
                                         text-gray-500 hover:text-gray-700 transition-all duration-200
                                         hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={content.close}
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
                            {/* Heading Size */}
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 text-center">
                                    {content.headingSize}
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
                                    {content.subheadingSize}
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
                                    {content.bodyTextSize}
                                </label>
                                <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-36 sm:max-w-40 mx-auto">
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, bodySize: Math.max(10, prev.bodySize - 1) }))}
                                        disabled={fontSettings.bodySize <= 10}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        -
                                    </button>
                                    <div className="flex-1 text-center min-w-12 sm:min-w-14">
                                        <span className="text-sm sm:text-base font-medium text-gray-700">{fontSettings.bodySize}px</span>
                                    </div>
                                    <button
                                        onClick={() => setFontSettings(prev => ({ ...prev, bodySize: Math.min(18, prev.bodySize + 1) }))}
                                        disabled={fontSettings.bodySize >= 18}
                                        className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 text-purple-600 rounded-full flex items-center justify-center hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-semibold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Small Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                    {content.smallTextSize}
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
                                    {content.headingWeight}
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
                                    {content.subheadingWeight}
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
                                    {content.smallTextWeight}
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
                                    {content.sectionSpacing}
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
                            {content.reset}
                        </button>
                    </div>
                </div>
            </div>
        )}
        
        {/* AI Assistant Floating Button */}
        <div className="fixed bottom-6 left-6 z-[60]">
            <button
                onClick={handleAiAnalysis}
                disabled={isAiAnalyzing}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                         text-white rounded-lg px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium"
                title={
                    siteLanguage === 'azerbaijani' ? 'AI ilə CV-ni təkmilləşdirin' :
                    siteLanguage === 'english' ? 'Improve your CV with AI' :
                    'Улучшите резюме с помощью ИИ'
                }
            >
                {isAiAnalyzing ? (
                    <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>
                            {siteLanguage === 'azerbaijani' && 'Analiz edilir...'}
                            {siteLanguage === 'english' && 'Analyzing...'}
                            {siteLanguage === 'russian' && 'Анализируется...'}
                        </span>
                    </>
                ) : (
                    <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span>
                            {siteLanguage === 'azerbaijani' && 'Süni İntellekt ilə təkmilləşdirin'}
                            {siteLanguage === 'english' && 'Improve with AI'}
                            {siteLanguage === 'russian' && 'Улучшить с ИИ'}
                        </span>
                    </>
                )}
            </button>
        </div>

        {/* AI Suggestions Modal */}
        {isAiModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                                </svg>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {siteLanguage === 'azerbaijani' && 'AI Köməkçi'}
                                        {siteLanguage === 'english' && 'AI Assistant'}
                                        {siteLanguage === 'russian' && 'ИИ Помощник'}
                                    </h2>
                                    <p className="text-purple-100">
                                        {siteLanguage === 'azerbaijani' && 'CV təkmilləşdirmə təklifləri'}
                                        {siteLanguage === 'english' && 'CV improvement suggestions'}
                                        {siteLanguage === 'russian' && 'Предложения по улучшению резюме'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAiModalOpen(false)}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {isAiAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <svg className="animate-spin h-12 w-12 text-purple-600 mb-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    {siteLanguage === 'azerbaijani' && 'CV analiz edilir...'}
                                    {siteLanguage === 'english' && 'Analyzing CV...'}
                                    {siteLanguage === 'russian' && 'Анализ резюме...'}
                                </h3>
                                <p className="text-gray-600">
                                    {siteLanguage === 'azerbaijani' && 'Zəhmət olmasa gözləyin, Aİ sizin CV-nizi analiz edir'}
                                    {siteLanguage === 'english' && 'Please wait, AI is analyzing your CV'}
                                    {siteLanguage === 'russian' && 'Пожалуйста, подождите, ИИ анализирует ваше резюме'}
                                </p>
                            </div>
                        ) : aiSuggestions.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                </svg>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    {siteLanguage === 'azerbaijani' && 'Təklif tapılmadı'}
                                    {siteLanguage === 'english' && 'No suggestions found'}
                                    {siteLanguage === 'russian' && 'Предложения не найдены'}
                                </h3>
                                <p className="text-gray-600">
                                    {siteLanguage === 'azerbaijani' && 'CV-nizə heç bir təkmilləşdirmə təklifi tapılmadı'}
                                    {siteLanguage === 'english' && 'No improvement suggestions were found for your CV'}
                                    {siteLanguage === 'russian' && 'Для вашего резюме не найдено предложений по улучшению'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                        {siteLanguage === 'azerbaijani' && `${aiSuggestions.length} təkmilləşdirmə təklifi`}
                                        {siteLanguage === 'english' && `${aiSuggestions.length} improvement suggestions`}
                                        {siteLanguage === 'russian' && `${aiSuggestions.length} предложений по улучшению`}
                                    </h3>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-blue-800 text-sm">
                                            {siteLanguage === 'azerbaijani' && '💡 Hər təklifi diqqətlə nəzərdən keçirin və yalnız uyğun olanları tətbiq edin'}
                                            {siteLanguage === 'english' && '💡 Review each suggestion carefully and apply only the relevant ones'}
                                            {siteLanguage === 'russian' && '💡 Внимательно изучите каждое предложение и применяйте только подходящие'}
                                        </p>
                                    </div>
                                </div>
                                
                                {aiSuggestions.map((suggestion, index) => (
                                    <div key={suggestion.id || index} 
                                         className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        suggestion.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {suggestion.priority === 'high' ? (
                                                            siteLanguage === 'azerbaijani' ? 'Yüksək' :
                                                            siteLanguage === 'english' ? 'High' : 'Высокий'
                                                        ) : suggestion.priority === 'medium' ? (
                                                            siteLanguage === 'azerbaijani' ? 'Orta' :
                                                            siteLanguage === 'english' ? 'Medium' : 'Средний'
                                                        ) : (
                                                            siteLanguage === 'azerbaijani' ? 'Aşağı' :
                                                            siteLanguage === 'english' ? 'Low' : 'Низкий'
                                                        )}
                                                    </span>
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                                        {suggestion.type}
                                                    </span>
                                                </div>
                                                <h4 className="font-semibold text-gray-800 mb-2">{suggestion.title}</h4>
                                                <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>
                                                
                                                {/* Yeni element əlavə etmək üçün - sadəcə newValue göstər */}
                                                {suggestion.field === 'add' && suggestion.newValue && (
                                                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                                        <span className="text-xs font-medium text-green-700 uppercase tracking-wide mb-2 block">
                                                            {siteLanguage === 'azerbaijani' && '➕ Əlavə ediləcək:'}
                                                            {siteLanguage === 'english' && '➕ Will be added:'}
                                                            {siteLanguage === 'russian' && '➕ Будет добавлено:'}
                                                        </span>
                                                        <p className="text-sm text-green-900 font-medium">
                                                            {typeof suggestion.newValue === 'object' ? (
                                                                suggestion.type === 'skills' ? (
                                                                    <>
                                                                        <span className="font-bold">{suggestion.newValue?.name || 'N/A'}</span>
                                                                        <span className="text-green-700"> ({suggestion.newValue?.level || 'N/A'})</span>
                                                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                                                                            suggestion.newValue?.type === 'hard' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                                        }`}>
                                                                            {suggestion.newValue?.type === 'hard' ? 
                                                                                (siteLanguage === 'azerbaijani' ? 'Texniki' : siteLanguage === 'english' ? 'Technical' : 'Техническая') : 
                                                                                (siteLanguage === 'azerbaijani' ? 'Soft' : siteLanguage === 'english' ? 'Soft' : 'Мягкая')
                                                                            }
                                                                        </span>
                                                                        {suggestion.newValue?.category && (
                                                                            <span className="text-green-600 text-xs ml-2">• {suggestion.newValue.category}</span>
                                                                        )}
                                                                    </>
                                                                ) : suggestion.type === 'projects' ? (
                                                                    <>
                                                                        <span className="font-bold">{suggestion.newValue?.name || 'N/A'}</span>
                                                                        <span className="text-green-700 block mt-1">{suggestion.newValue?.description || ''}</span>
                                                                        {suggestion.newValue?.technologies && Array.isArray(suggestion.newValue.technologies) && (
                                                                            <span className="text-green-600 text-xs block mt-1">
                                                                                {suggestion.newValue.technologies.join(', ')}
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : suggestion.type === 'languages' ? (
                                                                    `${suggestion.newValue?.language || 'N/A'} (${suggestion.newValue?.level || 'N/A'})`
                                                                ) : suggestion.type === 'experience' ? (
                                                                    <>
                                                                        <span className="font-bold">{suggestion.newValue?.position || 'N/A'}</span>
                                                                        <span className="text-green-700"> at {suggestion.newValue?.company || 'N/A'}</span>
                                                                    </>
                                                                ) : suggestion.type === 'education' ? (
                                                                    <>
                                                                        <span className="font-bold">{suggestion.newValue?.degree || 'N/A'}</span>
                                                                        <span className="text-green-700"> at {suggestion.newValue?.institution || 'N/A'}</span>
                                                                    </>
                                                                ) : JSON.stringify(suggestion.newValue, null, 2)
                                                            ) : suggestion.newValue}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Mövcud elementi yeniləmək üçün - current və new göstər */}
                                                {suggestion.field !== 'add' && suggestion.currentValue && suggestion.newValue && (
                                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                                        <div>
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                                {siteLanguage === 'azerbaijani' && 'Mövcud:'}
                                                                {siteLanguage === 'english' && 'Current:'}
                                                                {siteLanguage === 'russian' && 'Текущее:'}
                                                            </span>
                                                            <p className="text-sm text-gray-800 mt-1">
                                                                {typeof suggestion.currentValue === 'object' ? JSON.stringify(suggestion.currentValue, null, 2) : suggestion.currentValue}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                                                {siteLanguage === 'azerbaijani' && 'Təklif:'}
                                                                {siteLanguage === 'english' && 'Suggested:'}
                                                                {siteLanguage === 'russian' && 'Предложение:'}
                                                            </span>
                                                            <p className="text-sm text-green-800 mt-1 font-medium">
                                                                {typeof suggestion.newValue === 'object' ? (
                                                                    suggestion.type === 'skills' ? (
                                                                        `${suggestion.newValue?.name || 'N/A'} (${suggestion.newValue?.level || 'N/A'}) - ${suggestion.newValue?.type === 'hard' ? 
                                                                            (siteLanguage === 'azerbaijani' ? 'Texniki bacarıq' : siteLanguage === 'english' ? 'Technical Skill' : 'Техническая навык') : 
                                                                            (siteLanguage === 'azerbaijani' ? 'Soft bacarıq' : siteLanguage === 'english' ? 'Soft Skill' : 'Мягкая навык')
                                                                        }`
                                                                    ) : suggestion.type === 'projects' ? (
                                                                        `${suggestion.newValue?.name || 'N/A'}: ${suggestion.newValue?.description?.substring(0, 100) || ''}...`
                                                                    ) : suggestion.type === 'languages' ? (
                                                                        `${suggestion.newValue?.language || 'N/A'} (${suggestion.newValue?.level || 'N/A'})`
                                                                    ) : suggestion.type === 'experience' ? (
                                                                        `${suggestion.newValue?.position || 'N/A'} at ${suggestion.newValue?.company || 'N/A'}`
                                                                    ) : suggestion.type === 'education' ? (
                                                                        `${suggestion.newValue?.degree || 'N/A'} at ${suggestion.newValue?.institution || 'N/A'}`
                                                                    ) : JSON.stringify(suggestion.newValue, null, 2)
                                                                ) : suggestion.newValue}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 
                                                         hover:border-gray-400 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                {siteLanguage === 'azerbaijani' && 'Rədd edin'}
                                                {siteLanguage === 'english' && 'Dismiss'}
                                                {siteLanguage === 'russian' && 'Отклонить'}
                                            </button>
                                            <button
                                                onClick={() => applyAiSuggestion(suggestion)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                                                         rounded-lg transition-colors text-sm font-medium"
                                            >
                                                {siteLanguage === 'azerbaijani' && 'Tətbiq edin'}
                                                {siteLanguage === 'english' && 'Apply'}
                                                {siteLanguage === 'russian' && 'Применить'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}