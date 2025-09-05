'use client';

import { useState } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import { useNotification } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api-client';

interface Skill {
  id: string;
  name: string;
  level?: string;
  type?: 'hard' | 'soft'; // Add skill type
  description?: string; // AI-generated description
}

interface SkillsSectionProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
  userTier?: string; // User tier for AI features
  cvData?: any; // Full CV data for AI analysis
  cvId?: string; // CV ID for AI suggestions
  cvLanguage?: 'english' | 'azerbaijani'; // Add CV language prop
}

interface SkillSuggestion {
  name: string;
  reason: string;
  category?: string; // Add optional category property
  relevanceScore?: number; // Relevance score (1-10)
  marketDemand?: string; // Market demand level
  implementation?: string; // How to develop this skill
  timeToMaster?: string; // Time needed to master
  industryTrend?: string; // Industry trend information
}

export default function SkillsSection({ data, onChange, userTier = 'Free', cvData, cvId, cvLanguage = 'azerbaijani' }: SkillsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiGeneratingSkill, setAiGeneratingSkill] = useState<string | null>(null); // Track which skill is generating AI description
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // AI is available for all users to see, but only works for premium users
  const canUseAI = ['premium', 'populyar', 'medium'].includes(userTier?.toLowerCase());

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      type: 'hard' // Default to hard skill
    };
    onChange([newSkill, ...data]);
    setExpandedId(newSkill.id);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    const updated = data.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    );
    onChange(updated);
  };

  const removeSkill = (id: string) => {
    onChange(data.filter(skill => skill.id !== id));
  };

  const moveSkill = (id: string, direction: 'up' | 'down') => {
    const index = data.findIndex(skill => skill.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...data];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      onChange(updated);
    } else if (direction === 'down' && index < data.length - 1) {
      const updated = [...data];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    }
  };

  const getSuggestionsFromAI = async () => {
    // Check if user is on free plan - show upgrade modal instead of alert
    if (!canUseAI) {
      setShowUpgradeModal(true);
      return;
    }

    if (!cvId) {
      showWarning(cvLanguage === 'english' ? 'CV ID is required for AI suggestions' : 'AI tövsiyələri almaq üçün CV ID lazımdır');
      return;
    }

    // Check if user has enough data for meaningful suggestions
    const hasExperience = cvData?.experience && cvData.experience.length > 0;
    const hasEducation = cvData?.education && cvData.education.length > 0;
    const hasPersonalInfo = cvData?.personalInfo && cvData.personalInfo.fullName;

    if (!hasPersonalInfo || (!hasExperience && !hasEducation)) {
      showWarning(cvLanguage === 'english' 
        ? 'Please first add work experience or education information for AI suggestions' 
        : 'AI tövsiyələri üçün əvvəlcə təcrübə və ya təhsil məlumatlarını doldurun'
      );
      return;
    }

    setAiSuggesting(true);
    setShowSuggestions(false);
    setSuggestions([]); // Clear previous suggestions
    console.log('🤖 Getting AI skill suggestions...');

    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth-token');

      if (!token) {
        showError(cvLanguage === 'english' ? 'Access denied. Please log in again.' : 'Giriş icazəsi yoxdur. Yenidən giriş edin.');
        setAiSuggesting(false);
        return;
      }

      const response = await apiClient.post('/api/ai/suggest-skills', { 
        cvId: cvId, // Add CV ID to request
        cvData,
        // Pass SAME language as CV for same-language suggestions
        targetLanguage: cvData?.cvLanguage || 'english',
        // Add timestamp to ensure new suggestions each time
        requestId: Date.now().toString()
      });

      console.log('🔄 Skills API Request:', {
        cvLanguage: cvData?.cvLanguage,
        targetLanguage: cvData?.cvLanguage || 'english',
        requestId: Date.now().toString()
      });

      console.log('📡 AI Skills API Response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (response.success && response.data) {
        const { suggestions } = response.data;
        
        console.log('📋 Raw AI Response suggestions:', suggestions);
        console.log('📋 First suggestion example:', suggestions?.[0]);
        
        console.log('✅ AI Skills Generated:', suggestions?.length || 0, 'skills');
        
        if (suggestions && suggestions.length > 0) {
          // Log skill distribution
          const hardSkills = suggestions.filter((s: any) => s.category === 'Hard');
          const softSkills = suggestions.filter((s: any) => s.category === 'Soft');
          console.log('📊 Skill Distribution - Hard:', hardSkills.length, 'Soft:', softSkills.length);
          console.log('🔍 Hard Skills:', hardSkills.map((s: any) => s.name));
          console.log('🔍 Soft Skills:', softSkills.map((s: any) => s.name));
          
          // Store suggested skills for user to manually choose from (avoid duplicates)
          const existingSkillNames = data.map(skill => skill.name.toLowerCase());
          const newSuggestions = suggestions
            .filter((skill: any) => !existingSkillNames.includes(skill.name.toLowerCase()))
            .map((skill: any) => ({
              name: skill.name,
              reason: skill.reason || skill.cvConnection || (cvLanguage === 'english' 
                ? 'Recommended based on your CV profile'
                : 'CV profilinizə əsasən tövsiyə edilən'
              ),
              category: skill.category || 'Hard', // Use AI's actual category instead of hardcoding
              relevanceScore: skill.relevanceScore || 8,
              marketDemand: 'High',
              implementation: 'Add to your skillset',
              timeToMaster: '6-12 months',
              industryTrend: 'Growing',
              cvConnection: skill.cvConnection
            }));
          
          if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions);
            setShowSuggestions(true);
            showSuccess(cvLanguage === 'english' 
              ? `${newSuggestions.length} AI skill suggestions generated! Select and add them.`
              : `${newSuggestions.length} AI bacarıq təklifi hazırlandı! Seçib əlavə edin.`
            );
          } else {
            showInfo('Bütün təklif edilən bacarıqlar artıq mövcuddur.');
          }
        } else {
          showInfo('AI hazırda əlavə bacarıq təklif etmir.');
        }
      } else {
        const errorMessage = response.error || 'AI bacarıq təklifi almaq mümkün olmadı';
        console.error('❌ AI Skills Error:', errorMessage);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('🚨 AI Skills Generation Error:', error);
      console.error('🚨 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(cvLanguage === 'english' 
        ? `Error occurred during AI skill suggestion: ${errorMessage}` 
        : `AI bacarıq təklifi zamanı xəta baş verdi: ${errorMessage}`
      );
    } finally {
      setAiSuggesting(false);
    }
  };

  const addSuggestedSkill = (suggestion: SkillSuggestion) => {
    // Check if skill already exists
    const existingSkill = data.find(skill =>
      skill.name.toLowerCase() === suggestion.name.toLowerCase()
    );

    if (existingSkill) {
      showWarning(cvLanguage === 'english' ? 'This skill already exists!' : 'Bu bacarıq artıq mövcuddur!');
      return;
    }

    // Determine skill type based on category - improved logic
    let skillType: 'hard' | 'soft' = 'hard'; // default to hard
    
    console.log('🔍 Categorizing skill:', suggestion.name, 'with category:', suggestion.category);
    
    if (suggestion.category) {
      const category = suggestion.category.toLowerCase();
      console.log('📝 Processing category:', category);
      
      // Direct AI category matching ("Hard" and "Soft" from AI)
      if (category === 'soft') {
        skillType = 'soft';
        console.log('✅ Matched as Soft skill (direct)');
      } else if (category === 'hard') {
        skillType = 'hard';
        console.log('✅ Matched as Hard skill (direct)');
      }
      // Fallback for language-specific categories
      else if (category.includes('soft') || 
               category.includes('şəxsi') || 
               category.includes('personal') ||
               category === 'soft skills' ||
               category === 'şəxsi bacarıqlar') {
        skillType = 'soft';
        console.log('✅ Matched as Soft skill (fallback)');
      }
    }
    
    // Additional check based on skill name for common soft skills
    const skillName = suggestion.name.toLowerCase();
    const commonSoftSkills = [
      'communication', 'kommunikasiya', 'iletişim',
      'leadership', 'liderlik', 'rəhbərlik', 
      'teamwork', 'team work', 'komanda işi', 'takım çalışması',
      'problem solving', 'problem həlli', 'problem çözme',
      'adaptability', 'adaptasiya', 'uyum',
      'creativity', 'yaradıcılıq', 'kreativite',
      'time management', 'vaxt idarəetməsi', 'zaman yönetimi',
      'analytical thinking', 'analitik düşüncə', 'analitik düşünce',
      'critical thinking', 'tənqidi düşüncə', 'eleştirel düşünce',
      'negotiation', 'danışıq', 'müzakere',
      'presentation', 'təqdimat', 'sunum',
      'strategic thinking', 'strateji düşüncə'
    ];
    
    if (commonSoftSkills.some(softSkill => skillName.includes(softSkill))) {
      skillType = 'soft';
      console.log('✅ Matched as Soft skill (by name)');
    }

    console.log('🎯 Final skill type:', skillType, 'for skill:', suggestion.name);

    // Add the suggested skill with proper type
    const newSkill: Skill = {
      id: `skill-${skillType}-${Date.now()}-${Math.random()}`,
      name: suggestion.name,
      level: 'Intermediate' as const,
      type: skillType as 'hard' | 'soft'
    };

    onChange([...data, newSkill]);

    // Remove the suggestion from the list
    setSuggestions(prev => prev.filter(s => s.name !== suggestion.name));

    // Show success message
    showSuccess(cvLanguage === 'english' 
      ? `"${suggestion.name}" skill added to your CV! 🎉`
      : `"${suggestion.name}" bacarığı CV-nizə əlavə edildi! 🎉`
    );
  };

  const generateAIDescription = async (skillId: string, skillName: string, skillType?: string) => {
    // Check if user can use AI
    if (!canUseAI) {
      setShowUpgradeModal(true);
      return;
    }

    if (!cvId) {
      showError(
        cvLanguage === 'english' ? 'CV ID is required to generate AI description' : 'AI təsvir yaratmaq üçün CV ID lazımdır', 
        cvLanguage === 'english' ? 'Missing Information' : 'Məlumat çatışmır'
      );
      return;
    }

    if (!skillName.trim()) {
      showWarning(cvLanguage === 'english' 
        ? 'Skill name is required to generate AI description' 
        : 'AI təsvir yaratmaq üçün bacarıq adı lazımdır'
      );
      return;
    }

    setAiGeneratingSkill(skillId);
    console.log('🤖 Generating AI description for skill:', skillName);

    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth-token');

      if (!token) {
        showError(
          cvLanguage === 'english' ? 'Access denied. Please log in again.' : 'Giriş icazəsi yoxdur. Yenidən giriş edin.', 
          cvLanguage === 'english' ? 'Authentication Error' : 'Autentifikasiya xətası'
        );
        return;
      }

      const response = await fetch('/api/generate-ai-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          cvId, 
          skillId, 
          skillName,
          skillType 
        }),
      });

      console.log('📡 AI Skill Description API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('📋 AI Skill Description Result:', result);

      if (!response.ok) {
        if (response.status === 401) {
          showError(
            cvLanguage === 'english' ? 'Access denied. Please log in again.' : 'Giriş icazəsi yoxdur. Yenidən giriş edin.', 
            cvLanguage === 'english' ? 'Authentication Error' : 'Autentifikasiya xətası'
          );
        } else if (response.status === 403) {
          setShowUpgradeModal(true);
        } else {
          throw new Error(result.error || 'API xətası');
        }
        return;
      }

      if (result.success && result.description) {
        console.log('✅ AI Skill Description generated successfully:', result.description.length, 'characters');
        
        // Update the skill with the AI-generated description
        const updated = data.map(skill => 
          skill.id === skillId ? { ...skill, description: result.description } : skill
        );
        onChange(updated);

        showSuccess(
          cvLanguage === 'english' 
            ? `${userTier === 'Premium' ? 'Executive-level' : 'Professional'} quality generated and ATS optimized.`
            : `${userTier === 'Premium' ? 'Executive-level' : 'Peşəkar'} səviyyədə hazırlandı və ATS üçün optimallaşdırıldı.`,
          cvLanguage === 'english' ? 'AI Skill Description Generated! 🎉' : 'AI Bacarıq Təsviri Yaradıldı! 🎉'
        );
      } else {
        console.log('❌ API returned success=false or no description');
        throw new Error('AI bacarıq təsviri yaradıla bilmədi');
      }

    } catch (error) {
      console.error('💥 AI Skill Description error:', error);
      showError(
        cvLanguage === 'english' ? 'Error occurred while generating AI skill description. Please try again.' : 'AI bacarıq təsviri yaradarkən xəta baş verdi. Yenidən cəhd edin.', 
        cvLanguage === 'english' ? 'AI Error' : 'AI Xətası'
      );
    } finally {
      setAiGeneratingSkill(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {cvLanguage === 'english' ? 'Skills' : 'Bacarıqlar'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={getSuggestionsFromAI}
            disabled={aiSuggesting}
            className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
              canUseAI
                ? aiSuggesting
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {aiSuggesting ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span className="hidden sm:inline">{cvLanguage === 'english' ? 'AI suggesting...' : 'AI təklif edir...'}</span>
                <span className="sm:hidden">AI...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span className="hidden sm:inline">{cvLanguage === 'english' ? 'AI Suggestions' : 'AI Təklifi'}</span>
                <span className="sm:hidden">AI</span>
                {!canUseAI && <span className="ml-1">🔒</span>}
              </div>
            )}
          </button>
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">
              {cvLanguage === 'english' ? '+ Add' : '+ Əlavə edin'}
            </span>
            <span className="sm:hidden">
              {cvLanguage === 'english' ? '+' : '+'}
            </span>
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4 flex justify-center">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {cvLanguage === 'english' 
              ? 'No skills added yet' 
              : 'Hələ heç bir bacarıq əlavə etməmisiniz'
            }
          </p>
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {cvLanguage === 'english' 
              ? 'Add your first skill' 
              : 'İlk bacarığınızı əlavə edin'
            }
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hard Skills Section */}
          {data.filter(skill => skill.type === 'hard' || !skill.type).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚙️</span>
                <h4 className="text-lg font-semibold text-gray-900">
                  {cvLanguage === 'english' ? 'Technical Skills' : 'Texniki Bacarıqlar'}
                </h4>
                <span className="text-sm text-gray-500">
                  ({data.filter(skill => skill.type === 'hard' || !skill.type).length})
                </span>
              </div>
              <div className="space-y-4">
                {data.filter(skill => skill.type === 'hard' || !skill.type).map((skill, index) => (
                  <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-500">⚙️</span>
                        <h4 className="font-medium text-gray-900">
                          {skill.name || (cvLanguage === 'english' ? 'New technical skill' : 'Yeni texniki bacarıq')}
                        </h4>
                      </div>
                    </div>

                    {/* Action links moved to bottom of card */}
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                      {/* Move buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSkill(skill.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={cvLanguage === 'english' ? 'Move Up' : 'Yuxarı'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSkill(skill.id, 'down')}
                          disabled={index === data.filter(s => s.type === 'hard' || !s.type).length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === data.filter(s => s.type === 'hard' || !s.type).length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={cvLanguage === 'english' ? 'Move Down' : 'Aşağı'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Edit and remove buttons */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                        >
                          {expandedId === skill.id ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın') : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')}
                        </button>
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                        >
                          {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                        </button>
                      </div>
                    </div>

                    {expandedId === skill.id && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {cvLanguage === 'english' ? 'Skill Name' : 'Bacarıq adı'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder={cvLanguage === 'english' 
                                ? 'JavaScript, Python, Photoshop, AutoCAD, etc.' 
                                : 'JavaScript, Python, Photoshop, AutoCAD, və s.'
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {cvLanguage === 'english' ? 'Skill Type' : 'Bacarıq növü'}
                            </label>
                            <select
                              value={skill.type || 'hard'}
                              onChange={(e) => updateSkill(skill.id, 'type', e.target.value as 'hard' | 'soft')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="hard">
                                {cvLanguage === 'english' ? 'Technical Skill' : 'Texniki Bacarıq'}
                              </option>
                              <option value="soft">
                                {cvLanguage === 'english' ? 'Soft Skill' : 'Şəxsi Bacarıq'}
                              </option>
                            </select>
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills Section */}
          {data.filter(skill => skill.type === 'soft').length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤝</span>
                <h4 className="text-lg font-semibold text-gray-900">
                  {cvLanguage === 'english' ? 'Soft Skills' : 'Şəxsi Bacarıqlar'}
                </h4>
                <span className="text-sm text-gray-500">
                  ({data.filter(skill => skill.type === 'soft').length})
                </span>
              </div>
              <div className="space-y-4">
                {data.filter(skill => skill.type === 'soft').map((skill, index) => (
                  <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-500">🤝</span>
                        <h4 className="font-medium text-gray-900">
                          {skill.name || (cvLanguage === 'english' ? 'New soft skill' : 'Yeni şəxsi bacarıq')}
                        </h4>
                      </div>
                    </div>

                    {/* Action links moved to bottom of card */}
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                      {/* Move buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveSkill(skill.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={cvLanguage === 'english' ? 'Move Up' : 'Yuxarı'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveSkill(skill.id, 'down')}
                          disabled={index === data.filter(s => s.type === 'soft').length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === data.filter(s => s.type === 'soft').length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title={cvLanguage === 'english' ? 'Move Down' : 'Aşağı'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Edit and remove buttons */}
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                        >
                          {expandedId === skill.id ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın') : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')}
                        </button>
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                        >
                          {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                        </button>
                      </div>
                    </div>

                    {expandedId === skill.id && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {cvLanguage === 'english' ? 'Skill Name' : 'Bacarıq adı'} <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder={cvLanguage === 'english' 
                                ? 'Leadership, Teamwork, Communication, etc.' 
                                : 'Liderlik, Komanda işi, Komunikasiya, və s.'
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {cvLanguage === 'english' ? 'Skill Type' : 'Bacarıq növü'}
                            </label>
                            <select
                              value={skill.type || 'soft'}
                              onChange={(e) => updateSkill(skill.id, 'type', e.target.value as 'hard' | 'soft')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="hard">
                                {cvLanguage === 'english' ? 'Technical Skill' : 'Texniki Bacarıq'}
                              </option>
                              <option value="soft">
                                {cvLanguage === 'english' ? 'Soft Skill' : 'Şəxsi Bacarıq'}
                              </option>
                            </select>
                          </div>
                          
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {cvLanguage === 'english' ? 'Skills' : 'Bacarıqlar'}
          </h3>
          <p className="text-sm text-gray-700">
            {cvLanguage === 'english' 
              ? 'Organize your skills into categories (e.g., "Programming", "Design", "Management") and place the most important skills at the top.'
              : 'Bacarıqlarınızı kateqoriyalara ayırın (məsələn: "Proqramlaşdırma", "Dizayn", "İdarəetmə") və ən vacib bacarıqlarınızı yuxarıda yerləşdirin.'
            }
          </p>
        </div>
      )}

      {/* AI Skills Suggestions Section - Enhanced */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {cvLanguage === 'english' ? 'AI Professional Skills Analyzer' : 'AI Peşəkar Bacarıqlar Analizçisi'}
              </h3>
              <p className="text-sm text-gray-600">
                {canUseAI ?
                  (cvLanguage === 'english' 
                    ? `${userTier} member - Professional skills analysis and recommendations`
                    : `${userTier} üzvü - Peşəkar bacarıqlar analizi və tövsiyələri`
                  ) :
                  (cvLanguage === 'english' 
                    ? 'Available for Premium and Medium members'
                    : 'Premium və Medium üzvlər üçün mövcuddur'
                  )
                }
              </p>
            </div>
          </div>

          {canUseAI && (
            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              ✨ AI Powered
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              <strong>
                {cvLanguage === 'english' 
                  ? 'AI will analyze your profile:' 
                  : 'AI sizin profilinizi analiz edəcək:'
                }
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-2">
              <li>
                {cvLanguage === 'english' 
                  ? 'Your work experience and career development'
                  : 'İş təcrübəniz və karyera inkişafınız'
                }
              </li>
              <li>
                {cvLanguage === 'english' 
                  ? 'Educational background and certifications'
                  : 'Təhsil fonu və sertifikatlarınız'
                }
              </li>
              <li>
                {cvLanguage === 'english' 
                  ? 'Current skills and expertise areas'
                  : 'Mövcud bacarıqlar və expertiza sahələri'
                }
              </li>
              <li>
                {cvLanguage === 'english' 
                  ? 'Industry trends and market demands'
                  : 'İndustiya trendləri və market tələbləri'
                }
              </li>
              <li>
                {cvLanguage === 'english' 
                  ? 'Strategic skills for your career goals'
                  : 'Karyera məqsədləriniz üçün strateji skills'
                }
              </li>
            </ul>
          </div>

          <button
            onClick={getSuggestionsFromAI}
            disabled={!canUseAI || aiSuggesting}
            className={`w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              !canUseAI 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : aiSuggesting
                ? 'bg-purple-300 text-purple-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {aiSuggesting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>
                  {cvLanguage === 'english' 
                    ? 'AI analyzing your profile...' 
                    : 'AI profilinizi analiz edir...'
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>
                  {cvLanguage === 'english' 
                    ? 'Get Professional Skills Recommendations' 
                    : 'Peşəkar Bacarıqlar Tövsiyələri Al'
                  }
                </span>
              </div>
            )}
          </button>

          {!canUseAI && (
            <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-purple-600 text-lg">💎</span>
                <div>
                  <p className="text-sm font-medium text-purple-800 mb-1">
                    AI Peşəkar Bacarıqlar Analizçisi
                  </p>
                  <p className="text-xs text-purple-700">
                    CV məlumatlarınızı dərin analiz edərək karyeranız üçün ən münasib
                    professional skills tövsiyələri verir. Premium və Medium planlar üçün mövcuddur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Suggestions Display - Enhanced */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  🎯 AI Peşəkar Tövsiyələri
                </h4>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  {suggestions.length} təklif
                </span>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                    {/* Skill Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h5 className="text-base font-semibold text-gray-900 truncate">
                            {suggestion.name}
                          </h5>
                          {suggestion.category && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                              suggestion.category === 'Strategic' ? 'bg-purple-100 text-purple-700' :
                              suggestion.category === 'Technical' ? 'bg-blue-100 text-blue-700' :
                              suggestion.category === 'Leadership' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {suggestion.category}
                            </span>
                          )}
                        </div>

                        {/* Skill Metrics */}
                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                          {suggestion.relevanceScore && (
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-xs text-gray-500 whitespace-nowrap">Uyğunluq:</span>
                              <div className="flex">
                                {[...Array(10)].map((_, i) => (
                                  <span key={i} className={`text-xs ${
                                    i < (suggestion.relevanceScore || 0) ? 'text-yellow-400' : 'text-gray-300'
                                  }`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {suggestion.relevanceScore}/10
                              </span>
                            </div>
                          )}

                          {suggestion.marketDemand && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                              suggestion.marketDemand === 'Critical' ? 'bg-red-100 text-red-700' :
                              suggestion.marketDemand === 'Very High' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              📈 {suggestion.marketDemand}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Skill Description */}
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed break-words">
                      {suggestion.reason}
                    </p>

                    {/* Additional Info */}
                    {(suggestion.implementation || suggestion.timeToMaster || suggestion.industryTrend) && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2 overflow-hidden">
                        {suggestion.implementation && (
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap flex-shrink-0">💡 Necə inkişaf etdirin:</span>
                            <span className="text-xs text-gray-700 break-words">{suggestion.implementation}</span>
                          </div>
                        )}

                        {suggestion.timeToMaster && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">⏱️ Mənimsəmə müddəti:</span>
                            <span className="text-xs text-gray-700">{suggestion.timeToMaster}</span>
                          </div>
                        )}

                        {suggestion.industryTrend && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">📊 İndustiya trendi:</span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                              suggestion.industryTrend === 'Future-Critical' ? 'bg-purple-100 text-purple-700' :
                              suggestion.industryTrend === 'Essential' ? 'bg-red-100 text-red-700' :
                              suggestion.industryTrend === 'Growing' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {suggestion.industryTrend}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => addSuggestedSkill(suggestion)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      ✨ CV-yə əlavə et
                    </button>
                  </div>
                ))}
              </div>

              {/* Regenerate Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={getSuggestionsFromAI}
                  disabled={aiSuggesting}
                  className="w-full px-4 py-2 text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium"
                >
                  🔄 Yeni tövsiyələr al
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Hər dəfə fərqli professional skills tövsiyələri alacaqsınız
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Modal - New */}
      {showUpgradeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Premium Üzvlük Təklifi</h3>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🤖</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-800 mb-1">
                    AI Peşəkar Bacarıqlar Analizçisi
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                AI Peşəkar Bacarıqlar Analizçisi funksiyasından istifadə etmək üçün
                Premium və ya Medium planına yüksəltməyi düşünün. Bu, CV məlumatlarınıza
                əsaslanaraq sizə ən uyğun professional skills tövsiyələrini almanıza kömək edəcək.
              </p>

              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-purple-800 mb-2">Əldə edəcəyiniz:</h4>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• AI-powered skills analizi</li>
                  <li>• Karyera üçün strateji tövsiyələr</li>
                  <li>• İndustiya trend analizi</li>
                  <li>• Personalized skill roadmap</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 text-center text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sonra
              </button>
              <a
                href="/pricing"
                className="flex-1 px-4 py-2 text-center text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200"
              >
                Planları Görüntülə
              </a>
            </div>
          </div>
        </div>
      )}
      {data.length > 0 && (
          <div className="text-center">
            <button
                onClick={addSkill}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Başqa bacarıq əlavə edin
            </button>
          </div>
      )}

    </div>
  );
}
