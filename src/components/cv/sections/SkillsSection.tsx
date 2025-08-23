'use client';

import { useState } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import { useNotification } from '@/components/ui/Toast';

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

export default function SkillsSection({ data, onChange, userTier = 'Free', cvData, cvId }: SkillsSectionProps) {
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
    onChange([...data, newSkill]);
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
      showWarning('AI tövsiyələri almaq üçün CV ID lazımdır');
      return;
    }

    // Check if user has enough data for meaningful suggestions
    const hasExperience = cvData?.experience && cvData.experience.length > 0;
    const hasEducation = cvData?.education && cvData.education.length > 0;
    const hasPersonalInfo = cvData?.personalInfo && cvData.personalInfo.fullName;

    if (!hasPersonalInfo || (!hasExperience && !hasEducation)) {
      showWarning('AI tövsiyələri üçün əvvəlcə təcrübə və ya təhsil məlumatlarını doldurun');
      return;
    }

    setAiSuggesting(true);
    setShowSuggestions(false);
    console.log('🤖 Getting AI skill suggestions...');

    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth-token');

      if (!token) {
        showError('Giriş icazəsi yoxdur. Yenidən giriş edin.');
        setAiSuggesting(false);
        return;
      }

      const response = await fetch('/api/ai/generate-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cvData }),
      });

      console.log('📡 AI Skills API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('📋 AI Skills Result:', result);

      if (!response.ok) {
        if (response.status === 401) {
          showError('Giriş icazəsi yoxdur. Yenidən giriş edin.');
        } else if (response.status === 403) {
          setShowUpgradeModal(true);
        } else {
          throw new Error(result.error || 'API xətası');
        }
        return;
      }

      // Handle new format with hard and soft skills
      if (result.success && (result.hardSkills || result.softSkills)) {
        const hardSkills = result.hardSkills || [];
        const softSkills = result.softSkills || [];
        
        console.log('✅ AI Skills received:', hardSkills.length, 'hard skills,', softSkills.length, 'soft skills');

        // Convert skills to suggestions format
        const hardSkillSuggestions = hardSkills.map((skillName: string) => ({
          name: skillName,
          reason: 'AI tərəfindən təklif edilib (Hard Skill)',
          category: 'Hard Skills'
        }));

        const softSkillSuggestions = softSkills.map((skillName: string) => ({
          name: skillName,
          reason: 'AI tərəfindən təklif edilib (Soft Skill)',
          category: 'Soft Skills'
        }));

        const allSuggestions = [...hardSkillSuggestions, ...softSkillSuggestions];
        setSuggestions(allSuggestions);
        setShowSuggestions(true);

        // Show success message for suggestions received
        showSuccess(
          `AI tərəfindən ${allSuggestions.length} skill tövsiyəsi alındı! (${hardSkills.length} hard, ${softSkills.length} soft)`,
          'AI Tövsiyələri Hazır! 💡'
        );
      }
      // Handle legacy format for backward compatibility
      else if (result.success && result.skills && result.skills.length > 0) {
        console.log('✅ AI Skills received (legacy format):', result.skills.length, 'skills');

        // Convert skills to suggestions format
        const skillSuggestions = result.skills.map((skillName: string) => ({
          name: skillName,
          reason: 'AI tərəfindən təklif edilib',
          category: 'AI Generated'
        }));

        setSuggestions(skillSuggestions);
        setShowSuggestions(true);

        // Show success message for suggestions received
        showSuccess(`AI tərəfindən ${skillSuggestions.length} skill tövsiyəsi alındı!`, 'AI Tövsiyələri Hazır! 💡');
      } else {
        console.log('❌ No skills received from API');
        throw new Error('AI skills alına bilmədi');
      }

    } catch (error) {
      console.error('💥 AI Skills error:', error);
      showError('AI skills alarkən xəta baş verdi. Yenidən cəhd edin.');
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
      showWarning('Bu bacarıq artıq mövcuddur!');
      return;
    }

    // Determine skill type based on category
    const skillType = suggestion.category === 'Soft Skills' ? 'soft' : 'hard';

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
    showSuccess(`"${suggestion.name}" bacarığı CV-nizə əlavə edildi! 🎉`);
  };

  const generateAIDescription = async (skillId: string, skillName: string, skillType?: string) => {
    // Check if user can use AI
    if (!canUseAI) {
      setShowUpgradeModal(true);
      return;
    }

    if (!cvId) {
      showError('AI təsvir yaratmaq üçün CV ID lazımdır', 'Məlumat çatışmır');
      return;
    }

    if (!skillName.trim()) {
      showWarning('AI təsvir yaratmaq üçün bacarıq adı lazımdır');
      return;
    }

    setAiGeneratingSkill(skillId);
    console.log('🤖 Generating AI description for skill:', skillName);

    try {
      // Get authentication token
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth-token');

      if (!token) {
        showError('Giriş icazəsi yoxdur. Yenidən giriş edin.', 'Autentifikasiya xətası');
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
          showError('Giriş icazəsi yoxdur. Yenidən giriş edin.', 'Autentifikasiya xətası');
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
          `${userTier === 'Premium' ? 'Executive-level' : 'Peşəkar'} səviyyədə hazırlandı və ATS üçün optimallaşdırıldı.`,
          'AI Bacarıq Təsviri Yaradıldı! 🎉'
        );
      } else {
        console.log('❌ API returned success=false or no description');
        throw new Error('AI bacarıq təsviri yaradıla bilmədi');
      }

    } catch (error) {
      console.error('💥 AI Skill Description error:', error);
      showError('AI bacarıq təsviri yaradarkən xəta baş verdi. Yenidən cəhd edin.', 'AI Xətası');
    } finally {
      setAiGeneratingSkill(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bacarıqlar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={getSuggestionsFromAI}
            disabled={aiSuggesting}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
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
                <span>AI təklif edir...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span>AI Təklifi</span>
                {!canUseAI && <span className="ml-1">🔒</span>}
              </div>
            )}
          </button>
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Əlavə edin
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">Hələ heç bir bacarıq əlavə etməmisiniz</p>
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            İlk bacarığınızı əlavə edin
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hard Skills Section */}
          {data.filter(skill => skill.type === 'hard' || !skill.type).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚙️</span>
                <h4 className="text-lg font-semibold text-gray-900">Hard Skills</h4>
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
                          {skill.name || 'Yeni hard skill'}
                        </h4>
                      </div>
                      {skill.level && (
                        <p className="text-xs text-gray-500 mt-1">
                          Səviyyə: {skill.level}
                        </p>
                      )}
                    </div>

                    {/* Action links moved to bottom of card */}
                    <div className="flex items-center justify-end gap-4 mt-4 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                      >
                        {expandedId === skill.id ? 'Bağlayın' : 'Redaktə edin'}
                      </button>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                      >
                        Silin
                      </button>
                    </div>

                    {expandedId === skill.id && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bacarıq adı <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder="JavaScript, Python, Photoshop, AutoCAD, və s."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bacarıq növü
                            </label>
                            <select
                              value={skill.type || 'hard'}
                              onChange={(e) => updateSkill(skill.id, 'type', e.target.value as 'hard' | 'soft')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="hard">Hard Skill (Texniki bacarıqlar)</option>
                              <option value="soft">Soft Skill (Şəxsi bacarıqlar)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Səviyyə
                            </label>
                            <select
                              value={skill.level || ''}
                              onChange={(e) => updateSkill(skill.id, 'level', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="">Səviyyə seçin</option>
                              <option value="Başlanğıc">Başlanğıc</option>
                              <option value="Orta">Orta</option>
                              <option value="İrəliləmiş">İrəliləmiş</option>
                              <option value="Ekspert">Ekspert</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Peşəkar Təsvir {canUseAI && <span className="text-xs text-purple-600">(AI Powered)</span>}
                              </label>
                              {canUseAI && skill.name.trim() && (
                                <button
                                  onClick={() => generateAIDescription(skill.id, skill.name, skill.type)}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                                >
                                  🤖 AI ilə yarat
                                </button>
                              )}
                            </div>
                            <textarea
                              value={skill.description || ''}
                              onChange={(e) => updateSkill(skill.id, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder={canUseAI ? "AI ilə peşəkar təsvir yaradın və ya əl ilə yazın..." : "Bu bacarığın necə istifadə etdiyinizi qısaca təsvir edin..."}
                            />
                            {skill.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {skill.description.length} simvol
                              </p>
                            )}
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
                <h4 className="text-lg font-semibold text-gray-900">Soft Skills</h4>
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
                          {skill.name || 'Yeni soft skill'}
                        </h4>
                      </div>
                      {skill.level && (
                        <p className="text-xs text-gray-500 mt-1">
                          Səviyyə: {skill.level}
                        </p>
                      )}
                    </div>

                    {/* Action links moved to bottom of card */}
                    <div className="flex items-center justify-end gap-4 mt-4 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                      >
                        {expandedId === skill.id ? 'Bağlayın' : 'Redaktə edin'}
                      </button>
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                      >
                        Silin
                      </button>
                    </div>

                    {expandedId === skill.id && (
                      <div className="space-y-4 border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bacarıq adı <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder="Liderlik, Komanda işi, Komunikasiya, və s."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bacarıq növü
                            </label>
                            <select
                              value={skill.type || 'soft'}
                              onChange={(e) => updateSkill(skill.id, 'type', e.target.value as 'hard' | 'soft')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="hard">Hard Skill (Texniki bacarıqlar)</option>
                              <option value="soft">Soft Skill (Şəxsi bacarıqlar)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Səviyyə
                            </label>
                            <select
                              value={skill.level || ''}
                              onChange={(e) => updateSkill(skill.id, 'level', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                              <option value="">Səviyyə seçin</option>
                              <option value="Başlanğıc">Başlanğıc</option>
                              <option value="Orta">Orta</option>
                              <option value="İrəliləmiş">İrəliləmiş</option>
                              <option value="Ekspert">Ekspert</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Peşəkar Təsvir {canUseAI && <span className="text-xs text-purple-600">(AI Powered)</span>}
                              </label>
                              {canUseAI && skill.name.trim() && (
                                <button
                                  onClick={() => generateAIDescription(skill.id, skill.name, skill.type)}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                                >
                                  🤖 AI ilə yarat
                                </button>
                              )}
                            </div>
                            <textarea
                              value={skill.description || ''}
                              onChange={(e) => updateSkill(skill.id, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              placeholder={canUseAI ? "AI ilə peşəkar təsvir yaradın və ya əl ilə yazın..." : "Bu bacarığın necə istifadə etdiyinizi qısaca təsvir edin..."}
                            />
                            {skill.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {skill.description.length} simvol
                              </p>
                            )}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bacarıqlar</h3>
          <p className="text-sm text-gray-700">
            Bacarıqlarınızı kateqoriyalara ayırın (məsələn: &quot;Proqramlaşdırma&quot;, &quot;Dizayn&quot;, &quot;İdarəetmə&quot;) 
            və ən vacib bacarıqlarınızı yuxarıda yerləşdirin.
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
              <h3 className="text-lg font-semibold text-gray-900">AI Peşəkar Bacarıqlar Analizçisi</h3>
              <p className="text-sm text-gray-600">
                {canUseAI ?
                  `${userTier} üzvü - Peşəkar bacarıqlar analizi və tövsiyələri` :
                  'Premium və Medium üzvlər üçün mövcuddur'
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
              <strong>AI sizin profilinizi analiz edəcək:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 ml-2">
              <li>İş təcrübəniz və karyera inkişafınız</li>
              <li>Təhsil fonu və sertifikatlarınız</li>
              <li>Mövcud bacarıqlar və expertiza sahələri</li>
              <li>İndustiya trendləri və market tələbləri</li>
              <li>Karyera məqsədləriniz üçün strateji skills</li>
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
                <span>AI profilinizi analiz edir...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>🎯</span>
                <span>Peşəkar Bacarıqlar Tövsiyələri Al</span>
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

              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  {/* Skill Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-base font-semibold text-gray-900">
                          {suggestion.name}
                        </h5>
                        {suggestion.category && (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                      <div className="flex items-center gap-4 mb-2">
                        {suggestion.relevanceScore && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Uyğunluq:</span>
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
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {suggestion.reason}
                  </p>

                  {/* Additional Info */}
                  {(suggestion.implementation || suggestion.timeToMaster || suggestion.industryTrend) && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3 space-y-2">
                      {suggestion.implementation && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-500 font-medium min-w-fit">💡 Necə inkişaf etdirin:</span>
                          <span className="text-xs text-gray-700">{suggestion.implementation}</span>
                        </div>
                      )}

                      {suggestion.timeToMaster && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">⏱️ Mənimsəmə müddəti:</span>
                          <span className="text-xs text-gray-700">{suggestion.timeToMaster}</span>
                        </div>
                      )}

                      {suggestion.industryTrend && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">📊 İndustiya trendi:</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
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
