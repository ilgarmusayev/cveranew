'use client';

import { useState, useEffect } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import { useNotification } from '@/components/ui/Toast';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface PersonalInfo {
  fullName: string;      // Tam ad - API-dən gələn
  firstName?: string;    // Ad sahəsi
  lastName?: string;     // Soyad sahəsi
  email: string;
  phone: string;
  website?: string;
  linkedin?: string;
  location?: string;     // Yer sahəsi
  field?: string;        // Sahə/peşə sahəsi
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
  cvData?: any; // Full CV data for AI context
  cvId?: string; // Add CV ID for AI summary generation
  cvLanguage?: 'english' | 'azerbaijani'; // Add CV language prop
}

export default function PersonalInfoSection({ data, onChange, userTier = 'Free', cvData, cvId, cvLanguage = 'azerbaijani' }: PersonalInfoSectionProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const isPremium = userTier?.toLowerCase() === 'premium' || userTier?.toLowerCase() === 'pro';
  const canUseAI = ['premium', 'populyar', 'medium', 'pro'].includes(userTier?.toLowerCase());
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

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
            target.setCustomValidity(cvLanguage === 'english' ? 'Please fill out this field' : 'Zəhmət olmasa bu sahəni doldurun');
          } else if (target.validity.typeMismatch) {
            target.setCustomValidity(cvLanguage === 'english' ? 'Please enter a valid email address' : 'Zəhmət olmasa düzgün email ünvanı daxil edin');
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
        
        // Update the summary field
        handleChange('summary', result.summary);
        
        // Small delay to ensure DOM is updated, then scroll to summary section
        setTimeout(() => {
          const summarySection = document.querySelector('[data-testid="summary-editor"]') as HTMLElement;
          if (summarySection) {
            summarySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            summarySection.focus();
          }
        }, 100);
        
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
    field: data.field || '',
    summary: data.summary || '',
    profileImage: data.profileImage || '',
    additionalLinks: data.additionalLinks || []
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {cvLanguage === 'english' ? 'Personal Information' : 'Şəxsi məlumatlar'}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPremium && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {cvLanguage === 'english' ? 'Profile Image' : 'Profil Şəkli'} <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">{userTier === 'Pro' ? 'Pro' : 'Premium'}</span>
            </label>
            {data.profileImage ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={data.profileImage} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-md"
                />
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-gray-600">
                    {cvLanguage === 'english' ? 'Profile image uploaded' : 'Profil şəkli yükləndi'}
                  </p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {cvLanguage === 'english' ? 'Remove Image' : 'Şəkli sil'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-xs text-center">
                    {cvLanguage === 'english' ? 'No\nImage' : 'Şəkil\nyox'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={imageUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      id="profile-image-upload"
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className={`block w-28 px-4 py-2 text-sm text-center border border-gray-300 rounded-lg cursor-pointer transition-colors ${
                        imageUploading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                      }`}
                    >
                      {imageUploading 
                        ? (cvLanguage === 'english' ? 'Uploading...' : 'Yüklənir...') 
                        : (cvLanguage === 'english' ? 'Choose Image' : 'Şəkil seçin')
                      }
                    </label>
                  </div>
                  {imageUploading && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-500">
                        {cvLanguage === 'english' ? 'Uploading...' : 'Yüklənir...'}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {cvLanguage === 'english' 
                      ? 'JPG, PNG format, maximum 2MB' 
                      : 'JPG, PNG formatında, maksimum 2MB'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'First Name' : 'Ad'} <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            value={safeData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' ? 'Your Name' : 'Adınız'}
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity(cvLanguage === 'english' ? 'Name field is required' : 'Ad sahəsi məcburidir');
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'Last Name' : 'Soyad'} <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            value={safeData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' ? 'Your Surname' : 'Soyadınız'}
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity(cvLanguage === 'english' ? 'Surname field is required' : 'Soyad sahəsi məcburidir');
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'Email' : 'E-poçt'} <span className="text-gray-400 text-xs">({cvLanguage === 'english' ? 'optional' : 'ixtiyari'})</span>
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
            {cvLanguage === 'english' ? 'Phone' : 'Telefon'} <span className="text-gray-400 text-xs">({cvLanguage === 'english' ? 'optional' : 'ixtiyari'})</span>
          </label>
          <input
            type="tel"
            value={safeData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' ? '+1 XXX XXX XXXX' : '+994 XX XXX XX XX'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'Website' : 'Veb sayt'}
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
            {cvLanguage === 'english' ? 'LinkedIn' : 'LinkedIn'}
          </label>
          <input
            type="url"
            value={safeData.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' 
              ? "linkedin.com/in/username or www.linkedin.com/in/username" 
              : "linkedin.com/in/username və ya www.linkedin.com/in/username"
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'Field/Profession' : 'Sahə'} <span className="text-gray-400 text-xs">({cvLanguage === 'english' ? 'optional' : 'ixtiyari'})</span>
          </label>
          <input
            type="text"
            value={safeData.field}
            onChange={(e) => handleChange('field', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' ? 'e.g., Software Engineer' : 'məsələn, Proqram Mühəndisi'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {cvLanguage === 'english' ? 'Location (Country, city)' : 'Yer (Ölkə, şəhər)'} <span className="text-gray-400 text-xs">{cvLanguage === 'english' ? '(optional)' : '(ixtiyari)'}</span>
          </label>
          <input
            type="text"
            value={safeData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={cvLanguage === 'english' ? 'United States, New York' : 'Azərbaycan, Bakı'}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {cvLanguage === 'english' ? 'Professional Summary' : 'Peşəkar Xülasə'}
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
            title={canUseAI 
              ? (cvLanguage === 'english' ? 'Generate automatic professional summary with AI' : 'AI ilə avtomatik peşəkar xülasə yaradın')
              : (cvLanguage === 'english' ? 'AI features available for Premium/Pro/Popular' : 'AI funksiyalar Premium/Pro/Populyar üçün mövcuddur')
            }
          >
            {aiGenerating ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span>{cvLanguage === 'english' ? 'AI generating...' : 'AI yaradır...'}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span>{cvLanguage === 'english' ? 'AI Summary' : 'AI Xülasə'}</span>
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
                <p className="text-sm font-medium text-purple-800">
                  {cvLanguage === 'english' ? 'AI Professional Summary' : 'AI Peşəkar Xülasə'}
                </p>
                <p className="text-xs text-purple-600">
                  {cvLanguage === 'english' 
                    ? 'Generate automatic Professional Summary from your data! Available for '
                    : 'Məlumatlarınızdan avtomatik Peşəkar Xülasə yaradın! '
                  }
                  <span className="font-semibold">
                    {cvLanguage === 'english' ? 'Premium, Pro and Popular' : 'Premium, Pro və Populyar'}
                  </span>
                  {cvLanguage === 'english' ? ' users.' : ' istifadəçilər üçün uyğundur.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rich Text Editor */}
        <RichTextEditor
          value={safeData.summary}
          onChange={(value) => handleChange('summary', value)}
          placeholder={canUseAI
            ? (cvLanguage === 'english' 
              ? "Write your professional experience or generate automatically with the AI button above..."
              : "Peşəkar təcrübənizi yazın və ya yuxarıdakı AI butonundan avtomatik yaradın..."
            )
            : (cvLanguage === 'english'
              ? "Briefly describe your professional experience and goals..."
              : "Peşəkar təcrübənizi və məqsədlərinizi qısaca təsvir edin..."
            )
          }
          minHeight="120px"
          data-testid="summary-editor"
        />
      </div>
    </div>
  );
}
