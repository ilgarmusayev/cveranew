'use client';

import { useState, useEffect } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import { useSiteLanguage } from '@/contexts/SiteLanguageContext';
import { useNotification } from '@/components/ui/Toast';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useUndoRedo } from '@/hooks/useUndoRedo';

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
  cvLanguage?: 'english' | 'azerbaijani' | 'russian';
}

export default function PersonalInfoSection({ data, onChange, userTier = 'Free', cvData, cvId, cvLanguage = 'azerbaijani' }: PersonalInfoSectionProps) {
  const { siteLanguage } = useSiteLanguage();
  const [imageUploading, setImageUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const isPremium = userTier?.toLowerCase() === 'premium' || userTier?.toLowerCase() === 'pro';
  // AI features are available for all paid tiers (not Free/Pulsuz tier)
  const canUseAI = userTier && !['free', 'pulsuz'].includes(userTier?.toLowerCase());
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  // Use undo/redo hook for all input fields
  const { handleKeyDown } = useUndoRedo();

  // PersonalInfo labels
  const labels = {
    azerbaijani: {
      profileImage: 'Profil Şəkli',
      profileImageUploaded: 'Profil şəkli yükləndi',
      removeImage: 'Şəkli sil',
      noImage: 'Şəkil\nyox',
      uploading: 'Yüklənir...',
      chooseImage: 'Şəkil seçin',
      firstName: 'Ad',
      lastName: 'Soyad',
      email: 'E-poçt',
      phone: 'Telefon',
      website: 'Veb sayt',
      linkedin: 'LinkedIn',
      fieldProfession: 'Sahə',
      location: 'Yer (Ölkə, şəhər)',
      optional: 'ixtiyari',
      required: 'məcburi',
      yourName: 'Adınız',
      yourSurname: 'Soyadınız',
      nameRequired: 'Ad sahəsi məcburidir',
      surnameRequired: 'Soyad sahəsi məcburidir',
      phoneExample: '+994 XX XXX XX XX',
      fieldExample: 'məsələn, Proqram Mühəndisi',
      linkedinPlaceholder: 'linkedin.com/in/username və ya www.linkedin.com/in/username',
      locationPlaceholder: 'Azərbaycan, Bakı',
      professionalSummary: 'Peşəkar Xülasə',
      aiSummary: 'AI Xülasə',
      aiGenerating: 'AI yaradır...',
      aiProfessionalSummary: 'AI Peşəkar Xülasə',
      generateAISummary: 'AI ilə avtomatik peşəkar xülasə yaradın',
      aiFeaturesPremium: 'AI funksiyalar Premium/Pro/Populyar üçün mövcuddur',
      generateFromData: 'Məlumatlarınızdan avtomatik Peşəkar Xülasə yaradın! Mövcuddur',
      premiumProPopular: 'Premium, Populyar',
      title: 'Şəxsi məlumatlar',
      fillField: 'Zəhmət olmasa bu sahəni doldurun',
      validEmail: 'Zəhmət olmasa düzgün email ünvanı daxil edin',
      fileFormat: 'JPG, PNG formatında, maksimum 2MB',
      fileSizeError: 'Şəkil ölçüsü 2MB-dan çox ola bilməz',
      fileSizeErrorTitle: 'Fayl ölçüsü xətası',
      imageUploadSuccess: 'Şəkil uğurla yükləndi!',
      uploadCompleted: 'Yükləmə tamamlandı',
      imageUploadError: 'Şəkil yüklənərkən xəta baş verdi',
      uploadError: 'Yükləmə xətası',
      summaryPlaceholderWithAI: 'Peşəkar təcrübənizi yazın və ya yuxarıdakı AI butonundan avtomatik yaradın...',
      summaryPlaceholderNoAI: 'Peşəkar təcrübənizi və məqsədlərinizi qısaca təsvir edin...',
      aiSummarySuccess: 'Peşəkar səviyyədə hazırlandı və ATS üçün optimallaşdırıldı.',
      aiSummaryTitle: 'AI Peşəkar Xülasə Yaradıldı! 🎉',
      aiSummaryError: 'AI peşəkar xülasə yaradarkən xəta baş verdi. Yenidən cəhd edin.',
      aiErrorTitle: 'AI Xətası',
      fileTypeError: 'Yalnız şəkil faylları qəbul edilir',
      fileTypeErrorTitle: 'Fayl növü xətası',
      aiCvIdRequired: 'AI summary yaratmaq üçün CV ID lazımdır',
      dataInsufficient: 'Məlumat çatışmır',
      authError: 'Giriş icazəsi yoxdur. Yenidən giriş edin.',
      authErrorTitle: 'Autentifikasiya xətası'
    },
    english: {
      profileImage: 'Profile Image',
      profileImageUploaded: 'Profile image uploaded',
      removeImage: 'Remove Image',
      noImage: 'No\nImage',
      uploading: 'Uploading...',
      chooseImage: 'Choose Image',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      website: 'Website',
      linkedin: 'LinkedIn',
      fieldProfession: 'Field/Profession',
      location: 'Location (Country, city)',
      optional: 'optional',
      required: 'required',
      yourName: 'Your Name',
      yourSurname: 'Your Surname',
      nameRequired: 'Name field is required',
      surnameRequired: 'Surname field is required',
      phoneExample: '+1 XXX XXX XXXX',
      fieldExample: 'e.g., Software Engineer',
      linkedinPlaceholder: 'linkedin.com/in/username or www.linkedin.com/in/username',
      locationPlaceholder: 'United States, New York',
      professionalSummary: 'Professional Summary',
      aiSummary: 'AI Summary',
      aiGenerating: 'AI generating...',
      aiProfessionalSummary: 'AI Professional Summary',
      generateAISummary: 'Generate automatic professional summary with AI',
      aiFeaturesPremium: 'AI features available for Premium/Pro/Popular',
      generateFromData: 'Generate automatic Professional Summary from your data! Available for',
      premiumProPopular: 'Premium, Popular',
      title: 'Personal Information',
      fillField: 'Please fill out this field',
      validEmail: 'Please enter a valid email address',
      fileFormat: 'JPG, PNG format, maximum 2MB',
      fileSizeError: 'Image size cannot exceed 2MB',
      fileSizeErrorTitle: 'File size error',
      imageUploadSuccess: 'Image uploaded successfully!',
      uploadCompleted: 'Upload completed',
      imageUploadError: 'Error occurred while uploading image',
      uploadError: 'Upload error',
      summaryPlaceholderWithAI: 'Write your professional experience or generate automatically with the AI button above...',
      summaryPlaceholderNoAI: 'Briefly describe your professional experience and goals...',
      aiSummarySuccess: 'Professional level summary created and ATS optimized.',
      aiSummaryTitle: 'AI Professional Summary Created! 🎉',
      aiSummaryError: 'Error occurred while creating AI professional summary. Please try again.',
      aiErrorTitle: 'AI Error',
      fileTypeError: 'Only image files are accepted',
      fileTypeErrorTitle: 'File type error',
      aiCvIdRequired: 'CV ID is required to create AI summary',
      dataInsufficient: 'Insufficient data',
      authError: 'Access denied. Please log in again.',
      authErrorTitle: 'Authentication error'
    },
    russian: {
      profileImage: 'Фото профиля',
      profileImageUploaded: 'Фото профиля загружено',
      removeImage: 'Удалить фото',
      noImage: 'Нет\nфото',
      uploading: 'Загрузка...',
      chooseImage: 'Выбрать фото',
      firstName: 'Имя',
      lastName: 'Фамилия',
      email: 'Электронная почта',
      phone: 'Телефон',
      website: 'Веб-сайт',
      linkedin: 'LinkedIn',
      fieldProfession: 'Сфера/Профессия',
      location: 'Местоположение (Страна, город)',
      optional: 'необязательно',
      required: 'обязательно',
      yourName: 'Ваше имя',
      yourSurname: 'Ваша фамилия',
      nameRequired: 'Поле имени обязательно',
      surnameRequired: 'Поле фамилии обязательно',
      phoneExample: '+7 XXX XXX XXXX',
      fieldExample: 'например, Программист',
      linkedinPlaceholder: 'linkedin.com/in/username или www.linkedin.com/in/username',
      locationPlaceholder: 'Россия, Москва',
      professionalSummary: 'Проф. резюме',
      aiSummary: 'AI Резюме',
      aiGenerating: 'AI создает...',
      aiProfessionalSummary: 'AI Профессиональное резюме',
      generateAISummary: 'Создать автоматическое профессиональное резюме с AI',
      aiFeaturesPremium: 'AI функции доступны для Premium/Pro/Popular',
      generateFromData: 'Создать автоматическое профессиональное резюме из ваших данных! Доступно для',
      premiumProPopular: 'Premium, Popular',
      title: 'Личная информация',
      fillField: 'Пожалуйста, заполните это поле',
      validEmail: 'Пожалуйста, введите действительный адрес электронной почты',
      fileFormat: 'Формат JPG, PNG, максимум 2МБ',
      fileSizeError: 'Размер изображения не может превышать 2МБ',
      fileSizeErrorTitle: 'Ошибка размера файла',
      imageUploadSuccess: 'Изображение успешно загружено!',
      uploadCompleted: 'Загрузка завершена',
      imageUploadError: 'Произошла ошибка при загрузке изображения',
      uploadError: 'Ошибка загрузки',
      summaryPlaceholderWithAI: 'Напишите свой профессиональный опыт или создайте автоматически с помощью кнопки ИИ выше...',
      summaryPlaceholderNoAI: 'Кратко опишите свой профессиональный опыт и цели...',
      aiSummarySuccess: 'Профессиональное резюме создано и оптимизировано для ATS.',
      aiSummaryTitle: 'Профессиональное резюме ИИ создано! 🎉',
      aiSummaryError: 'Произошла ошибка при создании профессионального резюме ИИ. Попробуйте еще раз.',
      aiErrorTitle: 'Ошибка ИИ',
      fileTypeError: 'Принимаются только файлы изображений',
      fileTypeErrorTitle: 'Ошибка типа файла',
      aiCvIdRequired: 'Для создания резюме ИИ требуется ID CV',
      dataInsufficient: 'Недостаточно данных',
      authError: 'Доступ запрещен. Пожалуйста, войдите снова.',
      authErrorTitle: 'Ошибка аутентификации'
    }
  };

  const content = labels[siteLanguage];

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
            target.setCustomValidity(content.fillField);
          } else if (target.validity.typeMismatch) {
            target.setCustomValidity(content.validEmail);
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
      showError(content.fileTypeError, content.fileTypeErrorTitle);
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError(content.fileSizeError, content.fileSizeErrorTitle);
      return;
    }

    setImageUploading(true);
    try {
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        handleChange('profileImage', base64String);
        showSuccess(content.imageUploadSuccess, content.uploadCompleted);
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Image upload error:', error);
      showError(content.imageUploadError, content.uploadError);
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
      showError(content.aiCvIdRequired, content.dataInsufficient);
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
        showError(content.authError, content.authErrorTitle);
        setAiGenerating(false);
        return;
      }

      const response = await fetch('/api/generate-ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ cvId, language: cvLanguage }),
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
          showError(content.authError, content.authErrorTitle);
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
          content.aiSummarySuccess,
          content.aiSummaryTitle
        );
      } else {
        console.log('❌ API returned success=false or no summary');
        throw new Error('AI summary yaradıla bilmədi');
      }

    } catch (error) {
      console.error('💥 AI Summary error:', error);
      showError(content.aiSummaryError, content.aiErrorTitle);
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
            {content.title}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isPremium && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {content.profileImage} <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">{userTier === 'Pro' ? 'Pro' : 'Premium'}</span>
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
                    {content.profileImageUploaded}
                  </p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {content.removeImage}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <span className="text-gray-400 text-xs text-center">
                    {content.noImage}
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
                        ? content.uploading 
                        : content.chooseImage
                      }
                    </label>
                  </div>
                  {imageUploading && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-500">
                        {content.uploading}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {content.fileFormat}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.firstName} <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            value={safeData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.yourName}
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity(content.nameRequired);
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.lastName} <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            value={safeData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.yourSurname}
            required
            onInvalid={(e) => {
              (e.target as HTMLInputElement).setCustomValidity(content.surnameRequired);
            }}
            onInput={(e) => {
              (e.target as HTMLInputElement).setCustomValidity('');
            }}
          />
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.email} <span className="text-gray-400 text-xs">({content.optional})</span>
          </label>
          <input
            id="email"
            type="email"
            value={safeData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.phone} <span className="text-gray-400 text-xs">({content.optional})</span>
          </label>
          <input
            type="tel"
            value={safeData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.phoneExample}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.website}
          </label>
          <input
            type="url"
            value={safeData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.linkedin}
          </label>
          <input
            type="url"
            value={safeData.linkedin}
            onChange={(e) => handleChange('linkedin', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.linkedinPlaceholder}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.fieldProfession} <span className="text-gray-400 text-xs">({content.optional})</span>
          </label>
          <input
            type="text"
            value={safeData.field}
            onChange={(e) => handleChange('field', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.fieldExample}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {content.location} <span className="text-gray-400 text-xs">({content.optional})</span>
          </label>
          <input
            type="text"
            value={safeData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder={content.locationPlaceholder}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {content.professionalSummary}
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
              ? content.generateAISummary
              : content.aiFeaturesPremium
            }
          >
            {aiGenerating ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span>{content.aiGenerating}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <span>🤖</span>
                <span>{content.aiSummary}</span>
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
                  {content.aiProfessionalSummary}
                </p>
                <p className="text-xs text-purple-600">
                  {content.generateFromData}
                  <span className="font-semibold">
                    {content.premiumProPopular}
                  </span>
                  {siteLanguage === 'english' ? ' users.' : siteLanguage === 'russian' ? ' пользователей.' : ' istifadəçilər üçün uyğundur.'}
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
            ? content.summaryPlaceholderWithAI
            : content.summaryPlaceholderNoAI
          }
          minHeight="120px"
          data-testid="summary-editor"
        />
      </div>
    </div>
  );
}
