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
import CVPreview from './CVPreview';

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
                sectionOrder: cvData.sectionOrder || [],
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
            ...defaultData
        };
    });

    // UI state
    const [activeSection, setActiveSection] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showTranslationPanel, setShowTranslationPanel] = useState(false);
    // Disable auto-save for debugging
    // const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
    // const [lastSavedData, setLastSavedData] = useState<any>(null);

    // Auto-save effect disabled for debugging
    /*
    useEffect(() => {
        // Clear previous timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }

        // Don't auto-save if no meaningful data changes
        const currentDataString = JSON.stringify({
            personalInfo: cv.personalInfo,
            experience: cv.experience,
            education: cv.education,
            skills: cv.skills,
            languages: cv.languages,
            projects: cv.projects,
            certifications: cv.certifications,
            volunteerExperience: cv.volunteerExperience
        });

        if (lastSavedData && currentDataString === lastSavedData) {
            return; // No changes, skip auto-save
        }

        // Set new timer for auto-save (only if CV has an ID)
        if (cv.id && currentDataString !== lastSavedData) {
            const timer = setTimeout(() => {
                handleAutoSave();
                setLastSavedData(currentDataString);
            }, 8000); // Increased to 8 seconds delay

            setAutoSaveTimer(timer);
        }

        // Cleanup on unmount
        return () => {
            if (autoSaveTimer) {
                clearTimeout(autoSaveTimer);
            }
        };
    }, [cv.personalInfo, cv.experience, cv.education, cv.skills, cv.languages, cv.projects, cv.certifications, cv.volunteerExperience]); // Only watch data fields
    */

    // Auto save function
    const handleAutoSave = useCallback(async () => {
        if (!cv.id || saving) return;

        try {
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
        } catch (error) {
            console.error('❌ Auto-save failed:', error);
        }
    }, [cv, saving]);

    // Notification hooks
    const { showSuccess, showError, showWarning } = useNotification();

   const updateCVData = (section: keyof CVEditorState, data: any) => {
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
                cv_data: cvData.data
            };

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

        return <CVPreview cv={previewData} template={cv.templateId} />;
    };

    // Render section content
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'personal':
                return (
                        <PersonalInfoSection
                            data={cv.personalInfo}
                            onChange={(data: any) => updateCVData('personalInfo', data)}
                            userTier={userTier || 'Premium'} // Default to Premium for testing
                            cvData={cv} // Pass full CV data for AI context
                            cvId={cv.id}
                        />
                );

            case 'experience':
                return (
                    <ExperienceSection
                        data={cv.experience as any}
                        onChange={(data: any) => updateCVData('experience', data)}
                    />
                );

            case 'education':
                return (
                    <EducationSection
                        data={cv.education}
                        onChange={(data: any) => updateCVData('education', data)}
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
                    />
                );

            case 'languages':
                return (
                    <LanguagesSection
                        data={cv.languages}
                        onChange={(data: any) => updateCVData('languages', data)}
                    />
                );

            case 'projects':
                return (
                    <ProjectsSection
                        data={cv.projects as any}
                        onChange={(data: any) => updateCVData('projects', data)}
                    />
                );

            case 'certifications':
                return (
                    <CertificationsSection
                        data={cv.certifications}
                        onChange={(data: any) => updateCVData('certifications', data)}
                    />
                );

            case 'volunteer':
                return (
                    <VolunteerExperienceSection
                        data={cv.volunteerExperience}
                        onChange={(data: any) => updateCVData('volunteerExperience', data)}
                    />
                );

            case 'customSections':
                return (
                    <ElaveSections
                        data={cv.customSections}
                        onChange={(data: any) => updateCVData('customSections', data)}
                        userTier={userTier}
                    />
                );

            case 'template':
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Şablon Seçimi</h3>
                        <TemplateSelector
                            selectedTemplateId={cv.templateId}
                            onTemplateSelect={(templateId: string) => setCv(prev => ({ ...prev, templateId }))}
                            userTier={userTier || 'premium'}
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Bölmə seçin</p>
                    </div>
                );
        }
    };

        return (
        <div className="min-h-screen bg-gray-50">
        
            
            {/* CV Editor Header */}
            <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-16 z-10">
                <div className="max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-12 sm:h-16">
                        
                        {/* Left side - Title */}
                        <div className="flex items-center min-w-0">
                            <div className="ml-2 sm:ml-4 min-w-0">
                                <input
                                    type="text"
                                    value={cv.title}
                                    onChange={(e) => setCv(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="CV başlığı"
                                    className="text-base sm:text-lg font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-28 sm:w-48 md:w-auto truncate"
                                />
                            </div>
                            
                            {/* AI Translate Button */}
                            <button
                                onClick={() => {
                                    console.log('AI Translate clicked');
                                    setShowTranslationPanel(true);
                                }}
                                className="ml-3 flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-200 border border-white/20"
                                title="AI ilə tərcümə et"
                            >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                AI Tərcümə
                            </button>
                        </div>
                        
                        {/* Right side - Actions & Status */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                            {/* Status - hidden on small screens */}
                            <div className="hidden md:flex items-center space-x-3">
                                {saving && (
                                    <span className="text-xs text-blue-600 animate-pulse">
                                        Yadda saxlanılır...
                                    </span>
                                )}
                                {success && (
                                    <span className="text-xs text-green-600">
                                        ✓ Yadda saxlanıldı
                                    </span>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            {cv.id && (
                                <button
                                    onClick={() => window.open(`/cv/export/${cv.id}`, '_blank')}
                                    className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-lg hover:bg-gray-200 transition-colors"
                                    aria-label="Export CV"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                    <span className="hidden sm:inline ml-2">Export</span>
                                </button>
                            )}
                            
                            <button
                                onClick={onCancel}
                                className="flex items-center justify-center h-10 w-10 sm:h-auto sm:w-auto sm:px-3 sm:py-2 text-sm font-medium text-gray-700 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Geri qayıdın"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                <span className="hidden sm:inline ml-2">Geri qayıdın</span>
                            </button>
                            
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                {saving ? '...' : <>
                                    <span className="hidden sm:inline">Yadda Saxlayın</span>
                                    <span className="sm:hidden">Saxla</span>
                                </>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Content */}
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col xl:flex-row gap-8">
                 
                    {/* Left Panel - Sections */}
          
                    <div className=" mx-auto xl:w-2/5 xl:max-w-xl">
                        {/* Section Navigation */}
                        <div className="mb-8">
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 px-2">CV Bölmələri</h3>
                                
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
                    <div className=" xl:w-3/5">
                        <div className=" mx-auto sticky top-24">
                            {/* Preview Header */}
                            <div className="flex justify-between items-center mb-4 px-2">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Önizləmə</span>
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
    {/* Desktop: Current user setup - don't touch */}
    <div className="hidden lg:block h-auto p-4 sm:p-8 flex justify-center items-start border border-white overflow-visible">
        <div 
            className="bg-white rounded-xl border border-white shadow-2xl shadow-slate-300/60 transition-transform duration-300"
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
    </div>
</div>
</div>
                    </div>
                </div>
            </div>
        
        {showTranslationPanel && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">AI Tərcümə Paneli</h2>
                            <button
                                onClick={() => setShowTranslationPanel(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6m0 0l6-6m-6 6L6 6" />
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
                            userTier={userTier}
                        />
                    </div>
                </div>
            </div>
        )}
</div>
    );
}