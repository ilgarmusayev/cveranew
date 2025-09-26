/**
 * AI Translation Panel Compone  const handleFullTranslation = async (targetLanguage: CVLanguage | 'russian') => {
    // AI tercümə artıq bütün istifadəçilər üçün mövcuddur

    try {
      setTargetLanguageInTranslation(targetLanguage as any);
      resetTranslationState();Complete translation interface for CV content
 */

import React, { useState } from 'react';
import { CVLanguage } from '@/lib/cvLanguage';
import { useAITranslation, TranslationProgress } from '@/hooks/useAITranslation';

interface CVTranslationPanelProps {
  cvData: any;
  currentLanguage: CVLanguage;
  onCVUpdate: (updatedCV: any) => void;
  onLanguageChange: (language: CVLanguage) => void;
  onClose?: () => void;
  userTier?: string;
  uiLanguage?: 'english' | 'azerbaijani' | 'russian';
}

export function CVTranslationPanel({
  cvData,
  currentLanguage,
  onCVUpdate,
  onLanguageChange,
  onClose,
  userTier = 'Free',
  uiLanguage = 'azerbaijani'
}: CVTranslationPanelProps) {
  const { translationState, translateFullCV, resetTranslationState } = useAITranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetLanguageInTranslation, setTargetLanguageInTranslation] = useState<CVLanguage | 'russian' | null>(null);
  
  // AI translation permission check - Artıq bütün istifadəçilər AI tercümə edə bilər
  const canUseAI = true;

  const handleFullTranslation = async (targetLanguage: CVLanguage | 'russian') => {
    // AI tercümə artıq bütün istifadəçilər üçün mövcuddur

    try {
      setTargetLanguageInTranslation(targetLanguage as any);
      resetTranslationState();

      console.log('🌐 CVTranslationPanel: Starting full CV translation...', {
        currentLanguage,
        targetLanguage,
        cvDataKeys: Object.keys(cvData || {})
      });

      // Translate the CV using the enhanced API
      const translatedCV = await translateFullCV(cvData, currentLanguage, targetLanguage as any);

      console.log('✅ CVTranslationPanel: Translation completed, updating state...', {
        translatedKeys: Object.keys(translatedCV || {}),
        hasTranslationMetadata: !!translatedCV?.translationMetadata,
        newLanguage: translatedCV?.cvLanguage
      });

      // CRITICAL: Update the frontend state with translated data
      // This ensures the UI immediately reflects the translated content
      onCVUpdate(translatedCV);

            // Update the language in the UI (only for supported CVLanguages)
      if (targetLanguage === 'azerbaijani' || targetLanguage === 'english') {
        onLanguageChange(targetLanguage);
      }

      // Force re-render by updating component state as well
      console.log('🔄 CVTranslationPanel: Frontend state updated with translated content');

      // Show success notification
      console.log('🎉 CV tərcümə edildi və state yeniləndi!');

    } catch (error) {
      console.error('❌ CVTranslationPanel: Translation failed:', error);
    } finally {
      setTargetLanguageInTranslation(null);
    }
  };

  const labels = {
    azerbaijani: {
      title: 'AI Tərcümə',
      description: 'Bütün CV məzmununuzu AI ilə tərcümə edin',
      fullTranslation: 'Tam CV Tərcüməsi',
      advancedOptions: 'Əlavə Seçimlər',
      currentLang: 'Hazırkı dil: Azərbaycan',
      targetLang: 'Hədəf dil: İngilis',
      current: 'Hazırkı',
      featuresTitle: 'Xüsusiyyətlər:',
      translateTo: 'Tərcümə et:',
      languageNames: {
        azerbaijani: 'Azərbaycan dili',
        english: 'English',
        russian: 'Русский'
      },
      languageSubtitles: {
        azerbaijani: 'Azerbaijani',
        english: 'İngilis dili',
        russian: 'Rus dili'
      },
      features: [
        'Peşəkar terminologiya tərcüməsi',
        'Kontekst əsaslı tərcümə',
        'İş başlıqları və bacarıqların düzgün tərcüməsi',
        'Texniki terminlərin saxlanması'
      ],
      warning: 'Qeyd: Tərcümə prosesi bir dəqiqə çəkə bilər'
    },
    english: {
      title: 'AI Translation',
      description: 'Translate your entire CV content with AI',
      fullTranslation: 'Full CV Translation',
      advancedOptions: 'Advanced Options',
      currentLang: 'Current language: English',
      targetLang: 'Target language: Azerbaijani',
      current: 'Current',
      featuresTitle: 'Features:',
      translateTo: 'Translate to:',
      languageNames: {
        azerbaijani: 'Azərbaycan dili',
        english: 'English',
        russian: 'Русский'
      },
      languageSubtitles: {
        azerbaijani: 'Azerbaijani',
        english: 'İngilis dili',
        russian: 'Russian'
      },
      features: [
        'Professional terminology translation',
        'Context-aware translation',
        'Accurate job titles and skills translation',
        'Technical terms preservation'
      ],
      warning: 'Note: Translation process may take a few minutes'
    },
    russian: {
      title: 'ИИ Перевод',
      description: 'Переведите все содержимое вашего резюме с помощью ИИ',
      fullTranslation: 'Полный перевод резюме',
      advancedOptions: 'Дополнительные опции',
      currentLang: 'Текущий язык: Русский',
      targetLang: 'Целевой язык: Азербайджанский',
      current: 'Текущий',
      featuresTitle: 'Особенности:',
      translateTo: 'Перевести на:',
      languageNames: {
        azerbaijani: 'Azərbaycan dili',
        english: 'English',
        russian: 'Русский'
      },
      languageSubtitles: {
        azerbaijani: 'Азербайджанский',
        english: 'Английский язык',
        russian: 'Русский'
      },
      features: [
        'Перевод профессиональной терминологии',
        'Контекстный перевод',
        'Точный перевод должностей и навыков',
        'Сохранение технических терминов'
      ],
      warning: 'Примечание: Процесс перевода может занять несколько минут'
    }
  };

  const content = labels[uiLanguage];
  
  // Create dynamic current language display
  // Helper function to detect if CV is in Russian
  const isCurrentlyRussian = () => {
    return (currentLanguage as any) === 'russian' ||
           cvData?.cvLanguage === 'russian' ||
           cvData?.translationMetadata?.targetLanguage === 'ru' || 
           cvData?.translationMetadata?.targetLanguage === 'russian' ||
           cvData?.translationMetadata?.frontendTargetLanguage === 'russian' ||
           (cvData?.personalInfo?.summary && /[а-яё]/i.test(cvData.personalInfo.summary)) ||
           (cvData?.personalInfo?.title && /[а-яё]/i.test(cvData.personalInfo.title));
  };

  // Helper function to detect if CV is in English
  const isCurrentlyEnglish = () => {
    return (currentLanguage as any) === 'english' ||
           (cvData?.cvLanguage === 'english' && !isCurrentlyRussian());
  };

  // Helper function to detect if CV is in Azerbaijani (default)
  const isCurrentlyAzerbaijani = () => {
    return (currentLanguage as any) === 'azerbaijani' ||
           (cvData?.cvLanguage === 'azerbaijani') ||
           (!isCurrentlyRussian() && !isCurrentlyEnglish()); // Default fallback
  };

  const getCurrentLanguageDisplay = () => {
    console.log('🔍 Debug cvData for language detection:', {
      cvLanguage: cvData?.cvLanguage,
      currentLanguage: currentLanguage,
      translationMetadata: cvData?.translationMetadata,
      hasCyrillicText: cvData?.personalInfo?.summary ? /[а-яё]/i.test(cvData.personalInfo.summary) : false,
      summaryPreview: cvData?.personalInfo?.summary?.substring(0, 50),
      uiLanguage: uiLanguage
    });
    
    const isRussian = isCurrentlyRussian();
    const isEnglish = isCurrentlyEnglish();
    
    console.log('🔍 Language detection result:', { 
      isRussian, 
      isEnglish, 
      currentLanguage, 
      cvLanguage: cvData?.cvLanguage 
    });
    
    if (isRussian) {
      return uiLanguage === 'azerbaijani' ? 'Hazırkı dil: Rus' : 
             uiLanguage === 'english' ? 'Current language: Russian' : 'Текущий язык: Русский';
    }
    
    if (isEnglish) {
      return uiLanguage === 'azerbaijani' ? 'Hazırkı dil: İngilis' : 
             uiLanguage === 'english' ? 'Current language: English' : 'Текущий язык: Английский';
    }
    
    // Default to Azerbaijani
    return uiLanguage === 'azerbaijani' ? 'Hazırkı dil: Azərbaycan' : 
           uiLanguage === 'english' ? 'Current language: Azerbaijani' : 'Текущий язык: Азербайджанский';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
          <p className="text-sm text-gray-600">{content.description}</p>
        </div>
        {onClose && (
          <div className="flex-shrink-0">
          
          </div>
        )}
      </div>

      {/* Current Language Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">{getCurrentLanguageDisplay()}</span>
        </div>
      </div>

      {/* Language Selection Options - VERTICAL LAYOUT */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          {content.translateTo}
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {/* Azerbaijani Option */}
          <button
            onClick={() => handleFullTranslation('azerbaijani')}
            disabled={!canUseAI || translationState.isTranslating || isCurrentlyAzerbaijani()}
            className={`
              relative p-4 border-2 rounded-lg text-left transition-all duration-200
              ${!canUseAI 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : isCurrentlyAzerbaijani() 
                ? 'border-green-200 bg-green-50 cursor-not-allowed' 
                : translationState.isTranslating 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🇦🇿</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{content.languageNames.azerbaijani}</div>
                <div className="text-sm text-gray-500">{content.languageSubtitles.azerbaijani}</div>
              </div>
              {isCurrentlyAzerbaijani() && (
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">{content.current}</span>
                </div>
              )}
              {/* LOADING ONLY ON SELECTED TARGET LANGUAGE */}
              {translationState.isTranslating && targetLanguageInTranslation === 'azerbaijani' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                  <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* English Option */}
          <button
            onClick={() => handleFullTranslation('english')}
            disabled={!canUseAI || translationState.isTranslating || isCurrentlyEnglish()}
            className={`
              relative p-4 border-2 rounded-lg text-left transition-all duration-200
              ${!canUseAI 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : isCurrentlyEnglish() 
                ? 'border-green-200 bg-green-50 cursor-not-allowed' 
                : translationState.isTranslating 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🇺🇸</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{content.languageNames.english}</div>
                <div className="text-sm text-gray-500">{content.languageSubtitles.english}</div>
              </div>
              {isCurrentlyEnglish() && (
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">{content.current}</span>
                </div>
              )}
              {/* LOADING ONLY ON SELECTED TARGET LANGUAGE */}
              {translationState.isTranslating && targetLanguageInTranslation === 'english' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                  <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Russian Option */}
          <button
            onClick={() => handleFullTranslation('russian')}
            disabled={!canUseAI || translationState.isTranslating || isCurrentlyRussian()}
            className={`
              relative p-4 border-2 rounded-lg text-left transition-all duration-200
              ${!canUseAI 
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                : isCurrentlyRussian()
                ? 'border-green-200 bg-green-50 cursor-not-allowed' 
                : translationState.isTranslating 
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🇷🇺</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{content.languageNames.russian}</div>
                <div className="text-sm text-gray-500">{content.languageSubtitles.russian}</div>
              </div>
              {isCurrentlyRussian() && (
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-medium">{content.current}</span>
                </div>
              )}
              {/* LOADING ONLY ON SELECTED TARGET LANGUAGE */}
              {translationState.isTranslating && targetLanguageInTranslation === 'russian' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                  <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          {content.featuresTitle}
        </h4>
        <ul className="space-y-2">
          {content.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

 

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-yellow-800">{content.warning}</p>
        </div>
      </div>

      {/* Translation Progress Modal - Disabled to avoid duplicate loading */}
      {/* 
      <TranslationProgress
        isTranslating={translationState.isTranslating}
        progress={translationState.progress}
        error={translationState.error}
        language={currentLanguage}
      />
      */}
    </div>
  );
}
