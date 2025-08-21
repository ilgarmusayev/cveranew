import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@/components/ui/Toast';
import { CVData, PersonalInfo, Experience, Education, Skill, Language, Project, Certification, VolunteerExperience } from '@/types/cv';

// Import section components
import PersonalInfoSection from './sections/PersonalInfoSection';
import ExperienceSection from './sections/ExperienceSection';
import EducationSection from './sections/EducationSection';
import SkillsSection from './sections/SkillsSection';
import LanguagesSection from './sections/LanguagesSection';
import ProjectsSection from './sections/ProjectsSection';
import CertificationsSection from './sections/CertificationsSection';
import VolunteerExperienceSection from './sections/VolunteerExperienceSection';

// Import preview components
import CVPreview from './CVPreview';

// Import template selector
import TemplateSelector from './TemplateSelector';

// API client for HTTP requests
const apiClient = {
    get: async (url: string) => {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
            },
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
    post: async (url: string, data: any) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
    put: async (url: string, data: any) => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return response.json();
    },
};

// Type definitions
type CVLanguage = 'azerbaijani' | 'english';

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
    sectionOrder?: any[];
    cvLanguage: CVLanguage;
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
    sectionOrder: any[];
    cvLanguage: CVLanguage;
}

interface CVEditorProps {
    cvId?: string;
    onSave: (cv: CVEditorData) => void;
    onCancel: () => void;
    initialData?: any;
    userTier?: string;
}

// Default CV data
const getDefaultCVData = (): CVEditorState => ({
    id: undefined,
    title: '',
    templateId: 'basic',
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
    sectionOrder: [],
    cvLanguage: 'azerbaijani'
});

// Sections configuration
const getSections = (language: CVLanguage) => {
    if (language === 'english') {
        return [
            { id: 'personal', label: 'Personal Information', icon: '👤' },
            { id: 'experience', label: 'Work Experience', icon: '💼' },
            { id: 'education', label: 'Education', icon: '🎓' },
            { id: 'skills', label: 'Skills', icon: '🛠️' },
            { id: 'languages', label: 'Languages', icon: '🌍' },
            { id: 'projects', label: 'Projects', icon: '🚀' },
            { id: 'certifications', label: 'Certifications', icon: '🏆' },
            { id: 'volunteer', label: 'Volunteer Experience', icon: '❤️' },
            { id: 'template', label: 'Template Selection', icon: '🎨' }
        ];
    } else {
        return [
            { id: 'personal', label: 'Şəxsi Məlumatlar', icon: '👤' },
            { id: 'experience', label: 'İş Təcrübəsi', icon: '💼' },
            { id: 'education', label: 'Təhsil', icon: '🎓' },
            { id: 'skills', label: 'Bacarıqlar', icon: '🛠️' },
            { id: 'languages', label: 'Dillər', icon: '🌍' },
            { id: 'projects', label: 'Layihələr', icon: '🚀' },
            { id: 'certifications', label: 'Sertifikatlar', icon: '🏆' },
            { id: 'volunteer', label: 'Könüllü Təcrübə', icon: '❤️' },
            { id: 'template', label: 'Şablon Seçimi', icon: '🎨' }
        ];
    }
};

export default function NewCVEditor({ cvId, onSave, onCancel, initialData, userTier }: CVEditorProps) {
    // Initialize CV state
    const [cv, setCv] = useState<CVEditorState>(() => {
        if (initialData) {
            console.log('🎯 Initializing CV with provided data:', initialData);
            return {
                id: initialData.id || cvId,
                title: initialData.title || 'Yeni CV',
                templateId: initialData.templateId || 'basic',
                personalInfo: initialData.personalInfo || getDefaultCVData().personalInfo,
                experience: initialData.experience || [],
                education: initialData.education || [],
                skills: initialData.skills || [],
                languages: initialData.languages || [],
                projects: initialData.projects || [],
                certifications: initialData.certifications || [],
                volunteerExperience: initialData.volunteerExperience || [],
                publications: initialData.publications || [],
                honorsAwards: initialData.honorsAwards || [],
                testScores: initialData.testScores || [],
                recommendations: initialData.recommendations || [],
                courses: initialData.courses || [],
                sectionOrder: initialData.sectionOrder || [],
                cvLanguage: initialData.cvLanguage || 'azerbaijani'
            };
        }
        return getDefaultCVData();
    });

    // UI state
    const [activeSection, setActiveSection] = useState('personal');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Notification hooks
    const { showSuccess, showError, showWarning } = useNotification();

    console.log('🔄 CV Editor State:', {
        cvId,
        hasInitialData: !!initialData,
        activeSection,
        templateId: cv.templateId,
        userTier
    });

    // Update CV data helper
    const updateCVData = useCallback((section: string, data: any) => {
        console.log(`🔄 Updating ${section}:`, data);
        setCv(prev => ({
            ...prev,
            [section]: data
        }));
    }, []);

    // Handle save
    const handleSave = useCallback(async () => {
        setSaving(true);
        setError('');

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
                    sectionOrder: cv.sectionOrder,
                    cvLanguage: cv.cvLanguage
                }
            };

            console.log('💾 Saving CV:', cvData);

            if (cv.id) {
                // Update existing CV
                await apiClient.put(`/api/cv/${cv.id}`, {
                    title: cvData.title,
                    cv_data: cvData.data
                });
                showSuccess('CV uğurla yeniləndi');
            } else {
                // Create new CV
                const result = await apiClient.post('/api/cv', {
                    title: cvData.title,
                    templateId: cvData.templateId,
                    cv_data: cvData.data
                });
                
                // Update the CV ID
                setCv(prev => ({ ...prev, id: result.id }));
                showSuccess('CV uğurla yaradıldı');
            }

            // Call the onSave callback
            onSave(cvData);

        } catch (error) {
            console.error('❌ Save error:', error);
            setError('CV saxlanılarkən xəta baş verdi');
            showError('CV saxlanılarkən xəta baş verdi');
        } finally {
            setSaving(false);
        }
    }, [cv, onSave, showSuccess, showError]);

    // Get sections for current language
    const sections = getSections(cv.cvLanguage);

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
                cvLanguage: cv.cvLanguage,
                sectionOrder: cv.sectionOrder
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

            case 'template':
                return (
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Şablon Seçimi</h3>
                        <TemplateSelector
                            selectedTemplateId={cv.templateId}
                            onTemplateSelect={(templateId: string) => setCv(prev => ({ ...prev, templateId }))}
                            userTier={userTier}
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
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left side - Title */}
                        <div className="flex items-center space-x-4">
                            <input
                                type="text"
                                value={cv.title}
                                onChange={(e) => setCv(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="CV başlığı"
                                className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
                            />
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Ləğv et
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                            >
                                {saving ? 'Saxlanılır...' : 'CV Saxla'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col xl:flex-row gap-6">
                    
                    {/* Left Panel - Form */}
                    <div className="flex-1 xl:max-w-xl">
                        {/* Mobile Section Selector */}
                        <div className="xl:hidden mb-6">
                            <select
                                value={activeSection}
                                onChange={(e) => setActiveSection(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.icon} {section.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Desktop Section Navigation */}
                        <div className="hidden xl:block mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                activeSection === section.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>{section.icon}</span>
                                            <span>{section.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6">
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
                    <div className="flex-1 xl:max-w-4xl">
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-800">Önizləmə</h3>
                                    <span className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                                        A4 Format
                                    </span>
                                </div>
                            </div>

                            {/* A4 Preview Container */}
                            <div 
                                className="p-8 bg-gray-100 flex items-center justify-center"
                                style={{ minHeight: '80vh' }}
                            >
                                <div 
                                    className="bg-white shadow-2xl"
                                    style={{
                                        width: '210mm',
                                        minHeight: '297mm',
                                        maxWidth: '100%',
                                        transform: 'scale(0.6)',
                                        transformOrigin: 'center top',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
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
    );
}
