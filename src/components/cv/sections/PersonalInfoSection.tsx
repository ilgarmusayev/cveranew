'use client';

import { useState, useEffect } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import { useNotification } from '@/components/ui/Toast';

interface PersonalInfo {
  fullName: string;      // Tam ad - API-dən gələn
  firstName?: string;    // Ad sahəsi
  lastName?: string;     // Soyad sahəsi
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  location?: string;     // Yer sahəsi
  summary?: string;
  profileImage?: string; // Premium feature
  additionalLinks?: AdditionalLink[]; // Yeni: əlavə linklər və məlumatlar
}

interface AdditionalLink {
  id: string;
  label: string;
  value: string;
  type: 'url' | 'text' | 'email' | 'phone';
}

interface PersonalInfoSectionProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  userTier?: string; // User tier for premium features
  cvData?: any; // Full CV data for AI summary
  cvId?: string; // Add CV ID for AI summary generation
}

export default function PersonalInfoSection({ data, onChange, userTier = 'Free', cvData, cvId }: PersonalInfoSectionProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const isPremium = userTier?.toLowerCase() === 'premium';
  const canUseAI = ['premium', 'populyar', 'medium'].includes(userTier?.toLowerCase());
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Clean HTML content for proper display
  const cleanHtmlContent = (htmlContent: string): string => {
    if (!htmlContent) return '';

    let cleaned = htmlContent;

    // Replace &nbsp; with regular spaces
    cleaned = cleaned.replace(/&nbsp;/g, ' ');

    // Replace div tags with p tags
    cleaned = cleaned.replace(/<div>/g, '<p>');
    cleaned = cleaned.replace(/<\/div>/g, '</p>');

    // Remove empty paragraphs and clean up spacing
    cleaned = cleaned.replace(/<p><\/p>/g, '');
    cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
    cleaned = cleaned.replace(/<p><br><\/p>/g, '<p></p>');

    // Clean up multiple consecutive spaces
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Ensure proper paragraph wrapping for plain text
    if (cleaned && !cleaned.includes('<') && cleaned.trim()) {
      cleaned = `<p>${cleaned.trim()}</p>`;
    }

    // Fix malformed HTML
    cleaned = cleaned.replace(/<p>\s*<p>/g, '<p>');
    cleaned = cleaned.replace(/<\/p>\s*<\/p>/g, '</p>');

    return cleaned.trim();
  };

  // Form validasiya mesajlarını Azərbaycan dilinə çevirmək
  useEffect(() => {
    const setCustomValidationMessages = () => {
      const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;

      if (fullNameInput) {
        fullNameInput.setCustomValidity('');
        fullNameInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          }
        };
        fullNameInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }

      if (emailInput) {
        emailInput.setCustomValidity('');
        emailInput.oninvalid = function(e) {
          const target = e.target as HTMLInputElement;
          if (target.validity.valueMissing) {
            target.setCustomValidity('Zəhmət olmasa bu sahəni doldurun');
          } else if (target.validity.typeMismatch) {
            target.setCustomValidity('Zəhmət olmasa düzgün email ünvanı daxil edin');
          }
        };
        emailInput.oninput = function(e) {
          (e.target as HTMLInputElement).setCustomValidity('');
        };
      }
    };

    setCustomValidationMessages();
    const timer = setTimeout(setCustomValidationMessages, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    const updatedData = { ...data, [field]: value };

    // firstName və ya lastName dəyişdikdə fullName-i avtomatik yenilə
    if (field === 'firstName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : data.firstName || '';
      const lastName = field === 'lastName' ? value : data.lastName || '';
      updatedData.fullName = `${firstName} ${lastName}`.trim();
    }

    console.log('📝 PersonalInfo field changed:', { field, value, updatedData });
    onChange(updatedData);
  };
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Yalnız şəkil faylları qəbul edilir', 'Fayl növü xətası');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError('Şəkil ölçüsü 2MB-dan çox ola bilməz', 'Fayl ölçüsü xətası');
      return;
    }

    setImageUploading(true);
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        handleChange('profileImage', base64String);
        showSuccess('Şəkil uğurla yükləndi!', 'Yükləmə tamamlandı');
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      showError('Şəkil yüklənərkən xəta baş verdi', 'Yükləmə xətası');
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    handleChange('profileImage', '');
  };

  const generateAISummary = async () => {
    // Debug logging to identify the issue
    console.log('🔍 AI Summary Debug:', {
      canUseAI,
      userTier,
      cvId,
      hasPersonalInfo: !!(cvData?.personalInfo),
      fullName: cvData?.personalInfo?.fullName
    });

    if (!canUseAI) {
      console.log('❌ Cannot use AI. User tier:', userTier);
      showWarning(`AI Peşəkar Xülasə Premium və Populyar istifadəçilər üçün mövcuddur! Sizin tier: ${userTier}`, 'Giriş məhdudiyyəti');
      return;
    }

    if (!cvId) {
      console.log('❌ No CV ID provided');
      showError('AI summary yaratmaq üçün CV ID lazımdır', 'Məlumat çatışmır');
      return;
    }

    const info = cvData?.personalInfo || {};
    if (!cvData || !cvData.personalInfo || !(info.fullName || info.firstName || info.lastName || info.email || info.summary)) {
      console.log('❌ Missing CV data:', {
        hasCvData: !!cvData,
        hasPersonalInfo: !!(cvData?.personalInfo),
        hasFullName: !!(info.fullName),
        hasFirstName: !!(info.firstName),
        hasLastName: !!(info.lastName),
        hasEmail: !!(info.email),
        hasSummary: !!(info.summary)
      });
      showWarning('AI summary yaratmaq üçün əvvəlcə əsas məlumatları doldurun', 'Məlumat çatışmır');
      return;
    }

    setAiGenerating(true);
    console.log('🚀 Starting AI summary generation...');

    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('auth-token');
      
      if (!token) {
        showError('Giriş icazəsi yoxdur. Yenidən giriş edin.', 'Autentifikasiya xətası');
        setAiGenerating(false);
        return;
      }

      const response = await fetch('/api/generate-ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cvId }),
      });

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      const result = await response.json();
      console.log('📋 API Result:', result);

      if (!response.ok) {
        if (response.status === 401) {
          showError('Giriş icazəsi yoxdur. Yenidən giriş edin.', 'Autentifikasiya xətası');
        } else if (response.status === 403) {
          showWarning(result.error || 'AI funksiyalar üçün Premium/Populyar planı lazımdır', 'Plan məhdudiyyəti');
        } else {
          throw new Error(result.error || 'API xətası');
        }
        return;
      }

      if (result.success && result.summary) {
        console.log('✅ AI Summary generated successfully:', result.summary.length, 'characters');
        handleChange('summary', result.summary);
        showSuccess(
          `${userTier === 'Premium' ? 'Executive-level' : 'Peşəkar'} səviyyədə hazırlandı və ATS üçün optimallaşdırıldı.`,
          'AI Peşəkar Xülasə Yaradıldı! 🎉'
        );
      } else {
        console.log('❌ API returned success=false or no summary');
        throw new Error('AI summary yaradıla bilmədi');
      }

    } catch (error) {
      console.error('💥 AI Summary error:', error);
      showError('Süni intellekt ilə peşəkar xülasə yaratmaq üçün bacarıq əlavə edin', 'AI Xətası');
    } finally {
      setAiGenerating(false);
    }
  };

  // Ensure all values are strings to prevent controlled/uncontrolled input issues
  const safeData = {
    fullName: data.fullName || '',
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    linkedin: data.linkedin || '',
    location: data.location || '',
    summary: data.summary || '',
    profileImage: data.profileImage || '',
    additionalLinks: data.additionalLinks || []
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Şəxsi məlumatlar</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPremium && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profil Şəkli <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">Premium</span>
            </label>
            {data.profileImage ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={data.profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-md"
                />
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-600">Profil şəkli yükləndi</p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Şəkli sil
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-xs text-center">Şəkil<br/>yox</span>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer cursor-pointer"
                  />
                  {imageUploading && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-500">Yüklənir...</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG formatında, maksimum 2MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ad <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            value={safeData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Adınız"
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('Ad sahəsi məcburidir');
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soyad <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            value={safeData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Soyadınız"
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('Soyad sahəsi məcburidir');
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLabel('email', 'azerbaijani')} <span className="text-gray-400 text-xs">({getLabel('optional', 'azerbaijani')})</span>
          </label>
          <input
            id="email"
            type="email"
            value={safeData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLabel('phone', 'azerbaijani')} <span className="text-gray-400 text-xs">({getLabel('optional', 'azerbaijani')})</span>
          </label>
          <input
            type="tel"
            value={safeData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="+994 XX XXX XX XX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLabel('website', 'azerbaijani')}
          </label>
          <input
            type="url"
            value={safeData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {getLabel('linkedin', 'azerbaijani')}
          </label>
          <input
            type="url"
            value={safeData.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yer (Ölkə, şəhər) <span className="text-gray-400 text-xs">(ixtiyari)</span>
          </label>
          <input
            type="text"
            value={safeData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Azərbaycan, Bakı"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Peşəkar Xülasə
          </label>
          <button
            type="button"
            onClick={generateAISummary}
            disabled={aiGenerating || !canUseAI}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              canUseAI
                ? aiGenerating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            title={canUseAI ? 'AI ilə avtomatik peşəkar xülasə yaradın' : 'AI funksiyalar Premium/Medium üçün mövcuddur'}
          >
            {aiGenerating ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span>AI yaradır...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span>AI Xülasə</span>
                {!canUseAI && <span className="ml-1">🔒</span>}
              </div>
            )}
          </button>
        </div>
        
        {!canUseAI && (
          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-purple-600">🤖</span>
              <div>
                <p className="text-sm font-medium text-purple-800">AI Peşəkar Xülasə</p>
                <p className="text-xs text-purple-600">
                  LinkedIn məlumatlarınızdan avtomatik Peşəkar Xülasə yaradın!
                  <span className="font-semibold"> Premium və Medium </span> istifadəçilər üçün mövcuddur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rich Text Editor Toolbar */}
        <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => document.execCommand('bold', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('italic', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('underline', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Underline"
          >
            <span className="underline">U</span>
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => document.execCommand('insertUnorderedList', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('insertOrderedList', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Numbered List"
          >
            1.
          </button>
          <div className="w-px bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={() => document.execCommand('justifyLeft', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Align Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('justifyCenter', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => document.execCommand('justifyRight', false)}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Align Right"
          >
            →
          </button>
        </div>

        {/* Rich Text Editor Content */}
        <div
          ref={(el) => {
            if (el && data.summary && el.innerHTML !== data.summary) {
              el.innerHTML = cleanHtmlContent(data.summary);
            }
          }}
          contentEditable
          suppressContentEditableWarning={true}
          className="w-full min-h-[120px] px-3 py-2 border border-t-0 border-gray-300 rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none prose prose-sm max-w-none"
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            fontFamily: 'inherit'
          }}
          onInput={(e) => {
            const target = e.target as HTMLDivElement;
            const content = target.innerHTML;

            // Immediately clean and save content
            const cleanedContent = cleanHtmlContent(content);
            handleChange('summary', cleanedContent);
          }}
          onBlur={(e) => {
            const target = e.target as HTMLDivElement;
            const content = target.innerHTML;

            // Final cleanup on blur
            const cleanedContent = cleanHtmlContent(content);
            handleChange('summary', cleanedContent);
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          }}
          onKeyDown={(e) => {
            // Handle Enter key properly - single line break
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              document.execCommand('insertHTML', false, '<br>');
            }
          }}
          data-placeholder={canUseAI
            ? "Peşəkar təcrübənizi yazın və ya yuxarıdakı AI butonundan avtomatik yaradın..."
            : "Peşəkar təcrübənizi və məqsədlərinizi qısaca təsvir edin..."
          }
        />

        <style jsx>{`
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
          }
          [contenteditable] {
            background: white;
          }
          [contenteditable]:focus {
            background: white;
          }
          [contenteditable] p {
            margin: 0.5rem 0;
            line-height: 1.5;
          }
          [contenteditable] p:first-child {
            margin-top: 0;
          }
          [contenteditable] p:last-child {
            margin-bottom: 0;
          }
          [contenteditable] ul, [contenteditable] ol {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }
          [contenteditable] li {
            margin: 0.25rem 0;
            line-height: 1.4;
          }
          [contenteditable] strong {
            font-weight: 600;
          }
          [contenteditable] em {
            font-style: italic;
          }
          [contenteditable] u {
            text-decoration: underline;
          }
          [contenteditable] div {
            margin: 0.5rem 0;
          }
          [contenteditable] br {
            line-height: 1.5;
          }
        `}</style>
      </div>
    </div>
  );
}
