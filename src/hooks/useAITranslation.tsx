/**
 * AI Translation Hook
 * Handles CV translation with proper state management
 */

import { useState, useCallback } from 'react';
import { CVLanguage } from '@/lib/cvLanguage';
import { apiClient } from '@/lib/api-client';

export interface TranslationState {
  isTranslating: boolean;
  progress: number;
  error: string | null;
  currentSection?: string;
}

export interface UseAITranslationReturn {
  translationState: TranslationState;
  translateFullCV: (cvData: any, fromLang: CVLanguage, toLang: CVLanguage) => Promise<any>;
  translateSection: (sectionData: any, fromLang: CVLanguage, toLang: CVLanguage) => Promise<any>;
  resetTranslationState: () => void;
}

export function useAITranslation(): UseAITranslationReturn {
  const [translationState, setTranslationState] = useState<TranslationState>({
    isTranslating: false,
    progress: 0,
    error: null
  });

  const resetTranslationState = useCallback(() => {
    setTranslationState({
      isTranslating: false,
      progress: 0,
      error: null
    });
  }, []);

  const translateFullCV = useCallback(async (cvData: any, fromLang: CVLanguage, toLang: CVLanguage | 'russian') => {
    console.log('🌐 useAITranslation: Starting full CV translation...', {
      fromLang,
      toLang,
      cvDataKeys: Object.keys(cvData || {})
    });

    setTranslationState({
      isTranslating: true,
      progress: 10,
      error: null,
      currentSection: 'Preparing translation...'
    });

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Update progress
      setTranslationState(prev => ({
        ...prev,
        progress: 30,
        currentSection: 'Sending to AI translation service...'
      }));

      // Call the enhanced translation API
      const response = await apiClient.post('/api/ai/translate-cv', {
        cvData: cvData,
        targetLanguage: toLang,
        sourceLanguage: fromLang,
        saveToDatabase: true // Ensure it saves to database
      });

      if (!response.success) {
        const errorMessage = response.error || 'Translation failed';
        throw new Error(errorMessage);
      }

      const result = response.data;

      console.log('✅ useAITranslation: Translation API response:', {
        success: result.success,
        saved: result.saved,
        hasTranslatedData: !!result.translatedData,
        newLanguage: result.translatedData?.cvLanguage
      });

      if (!result.success) {
        throw new Error(result.error || 'Translation failed');
      }

      // Update progress
      setTranslationState(prev => ({
        ...prev,
        progress: 80,
        currentSection: 'Processing translated content...'
      }));

      // CRITICAL: Return the translated data with all necessary fields
      const translatedCV = {
        ...result.translatedData,
        // Ensure translation metadata is preserved
        translationMetadata: result.translatedData.translationMetadata || {
          sourceLanguage: fromLang,
          targetLanguage: toLang,
          translatedAt: new Date().toISOString(),
          translatedBy: 'Gemini AI'
        },
        // Ensure language is set correctly
        cvLanguage: toLang,
        // Preserve all sections including translated section names
        sectionNames: result.translatedData.sectionNames || {}
      };

      // Final progress update
      setTranslationState(prev => ({
        ...prev,
        progress: 100,
        currentSection: 'Translation completed!'
      }));

      // Reset state after a short delay
      setTimeout(() => {
        resetTranslationState();
      }, 2000);

      console.log('🎉 useAITranslation: Translation completed successfully!', {
        newLanguage: translatedCV.cvLanguage,
        hasMetadata: !!translatedCV.translationMetadata,
        sectionsCount: Object.keys(translatedCV.sectionNames || {}).length
      });

      return translatedCV;

    } catch (error) {
      console.error('❌ useAITranslation: Translation error:', error);

      setTranslationState({
        isTranslating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Translation failed'
      });

      throw error;
    }
  }, [resetTranslationState]);

  const translateSection = useCallback(async (sectionData: any, fromLang: CVLanguage, toLang: CVLanguage) => {
    console.log('🌐 useAITranslation: Starting section translation...', {
      fromLang,
      toLang,
      sectionType: typeof sectionData
    });

    setTranslationState({
      isTranslating: true,
      progress: 20,
      error: null,
      currentSection: 'Translating section...'
    });

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // For section translation, we can use the same API but with specific section data
      const response = await apiClient.post('/api/ai/translate-cv', {
        cvData: { sectionData },
        targetLanguage: toLang,
        sourceLanguage: fromLang,
        saveToDatabase: false // Don't save partial translations
      });

      if (!response.success) {
        const errorMessage = response.error || 'Section translation failed';
        throw new Error(errorMessage);
      }

      const result = response.data;

      if (!result.success) {
        throw new Error(result.error || 'Section translation failed');
      }

      setTranslationState(prev => ({
        ...prev,
        progress: 100,
        currentSection: 'Section translation completed!'
      }));

      setTimeout(() => {
        resetTranslationState();
      }, 1500);

      return result.translatedData.sectionData;

    } catch (error) {
      console.error('❌ useAITranslation: Section translation error:', error);

      setTranslationState({
        isTranslating: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Section translation failed'
      });

      throw error;
    }
  }, [resetTranslationState]);

  return {
    translationState,
    translateFullCV,
    translateSection,
    resetTranslationState
  };
}

/**
 * AI Translation Button Component
 */
interface AITranslationButtonProps {
  currentLanguage: CVLanguage;
  onTranslate: (targetLanguage: CVLanguage) => Promise<void>;
  isTranslating: boolean;
  className?: string;
}

export function AITranslationButton({
  currentLanguage,
  onTranslate,
  isTranslating,
  className = ''
}: AITranslationButtonProps) {
  const targetLanguage: CVLanguage = currentLanguage === 'azerbaijani' ? 'english' : 'azerbaijani';

  const labels = {
    azerbaijani: {
      button: 'İngilis dilinə tərcümə et',
      translating: 'Tərcümə edilir...'
    },
    english: {
      button: 'Translate to Azerbaijani',
      translating: 'Translating...'
    },
    russian: {
      button: 'Перевести на английский',
      translating: 'Переводится...'
    }
  };

  const content = labels[currentLanguage];

  const handleClick = async () => {
    try {
      await onTranslate(targetLanguage);
    } catch (error) {
      console.error('Translation button error:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isTranslating}
      className={`
        px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        relative
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        {/* Target language indicator */}
        <div className="flex items-center gap-1">
          <span className="text-xs opacity-80">
            {targetLanguage === 'english' ? '🇺🇸' : '🇦🇿'}
          </span>
          {targetLanguage === 'english' ? 'EN' : 'AZ'}
        </div>
        
        {/* Loading spinner only on selected language */}
        {isTranslating && (
          <svg className="w-4 h-4 animate-spin text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        
        <span className="flex-1">
          {isTranslating ? content.translating : content.button}
        </span>
      </div>
    </button>
  );
}

/**
 * Translation Progress Modal Component
 */
interface TranslationProgressProps {
  isTranslating: boolean;
  progress: number;
  error: string | null;
  language: CVLanguage;
}

export function TranslationProgress({
  isTranslating,
  progress,
  error,
  language
}: TranslationProgressProps) {
  if (!isTranslating && !error) return null;

  const labels = {
    azerbaijani: {
      title: 'CV Tərcümə Edilir',
      error: 'Tərcümə Xətası',
      close: 'Bağla'
    },
    english: {
      title: 'Translating CV',
      error: 'Translation Error',
      close: 'Close'
    },
    russian: {
      title: 'Переводится CV',
      error: 'Ошибка перевода',
      close: 'Закрыть'
    }
  };

  const content = labels[language];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {error ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{content.error}</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {content.close}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{content.title}</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{progress}% completed</p>
          </div>
        )}
      </div>
    </div>
  );
}
