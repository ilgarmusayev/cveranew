/**
 * AI-Powered Translation Service for CV Content
 * Provides comprehensive translation between Azerbaijani and English
 */

import { CVLanguage } from './cvLanguage';

// Translation API configuration
const TRANSLATION_API_CONFIG = {
  // Using Google Translate API or similar service
  apiUrl: 'https://translate.googleapis.com/translate_a/single',
  // Fallback to OpenAI API for better context-aware translations
  openaiUrl: 'https://api.openai.com/v1/chat/completions',
};

/**
 * AI Translation Service Interface
 */
export interface AITranslationService {
  translateText(text: string, fromLang: CVLanguage, toLang: CVLanguage): Promise<string>;
  translateBatch(texts: string[], fromLang: CVLanguage, toLang: CVLanguage): Promise<string[]>;
  translateCVSection(sectionData: any, fromLang: CVLanguage, toLang: CVLanguage): Promise<any>;
}

/**
 * Peşəkar CV Tərcümə Konteksti
 */
const CV_TRANSLATION_CONTEXT = {
  azerbaijani: {
    systemPrompt: `Siz peşəkar CV məzmununu tərcümə edən mütəxəssissiniz. 
    Aşağıdakı qaydaları izləyin:
    - Peşəkar terminologiyadan istifadə edin
    - CV-də istifadə olunan standart ifadələri saxlayın  
    - Şirkət adları və texniki terminləri dəyişməyin
    - Konteksti nəzərə alaraq tərcümə edin
    - Formal və peşəkar ton saxlayın`,

    jobTitles: [
      'Baş Mühəndis', 'Proqram Təminatı Mühəndisi', 'Frontend Developer',
      'Backend Developer', 'Full Stack Developer', 'UI/UX Dizayner',
      'Layihə Meneceri', 'Məhsul Meneceri', 'Satış Meneceri', 'İnsan Resursları Mütəxəssisi',
      'Maliyyə Analitiki', 'Marketinq Mütəxəssisi', 'Biznes Analitiki'
    ],

    skills: [
      'Proqramlaşdırma', 'Veb İnkişaf', 'Mobil Tətbiq İnkişafı', 'Verilənlər Bazası İdarəetməsi',
      'Layihə İdarəetməsi', 'Komanda Rəhbərliyi', 'Müştəri Xidməti', 'Satış və Marketinq'
    ]
  },

  english: {
    systemPrompt: `You are a professional CV content translator. 
    Follow these guidelines:
    - Use professional terminology
    - Maintain standard CV expressions
    - Keep company names and technical terms unchanged
    - Translate considering context
    - Maintain formal and professional tone`,

    jobTitles: [
      'Senior Engineer', 'Software Engineer', 'Frontend Developer',
      'Backend Developer', 'Full Stack Developer', 'UI/UX Designer',
      'Project Manager', 'Product Manager', 'Sales Manager', 'HR Specialist',
      'Financial Analyst', 'Marketing Specialist', 'Business Analyst'
    ],

    skills: [
      'Programming', 'Web Development', 'Mobile App Development', 'Database Management',
      'Project Management', 'Team Leadership', 'Customer Service', 'Sales & Marketing'
    ]
  }
};

/**
 * AI-Powered Translation using OpenAI API
 */
export class OpenAITranslationService implements AITranslationService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async translateText(text: string, fromLang: CVLanguage, toLang: CVLanguage): Promise<string> {
    if (!text.trim()) return text;

    // If same language, return original
    if (fromLang === toLang) return text;

    try {
      const context = CV_TRANSLATION_CONTEXT[toLang];
      const prompt = this.buildTranslationPrompt(text, fromLang, toLang, context.systemPrompt);

      const response = await fetch(TRANSLATION_API_CONFIG.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: context.systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || text;

    } catch (error) {
      console.error('AI Translation error:', error);
      // Fallback to basic translation
      return this.fallbackTranslation(text, fromLang, toLang);
    }
  }

  async translateBatch(texts: string[], fromLang: CVLanguage, toLang: CVLanguage): Promise<string[]> {
    const translations = await Promise.all(
      texts.map(text => this.translateText(text, fromLang, toLang))
    );
    return translations;
  }

  async translateCVSection(sectionData: any, fromLang: CVLanguage, toLang: CVLanguage): Promise<any> {
    if (!sectionData || fromLang === toLang) return sectionData;

    // Handle different section types
    if (Array.isArray(sectionData)) {
      return await Promise.all(
        sectionData.map(item => this.translateCVSection(item, fromLang, toLang))
      );
    }

    if (typeof sectionData === 'object') {
      const translatedSection: any = {};

      for (const [key, value] of Object.entries(sectionData)) {
        if (typeof value === 'string' && value.trim()) {
          // Translate string values
          translatedSection[key] = await this.translateText(value, fromLang, toLang);
        } else if (Array.isArray(value)) {
          // Translate arrays recursively
          translatedSection[key] = await this.translateCVSection(value, fromLang, toLang);
        } else if (typeof value === 'object' && value !== null) {
          // Translate nested objects
          translatedSection[key] = await this.translateCVSection(value, fromLang, toLang);
        } else {
          // Keep non-string values as is
          translatedSection[key] = value;
        }
      }

      return translatedSection;
    }

    if (typeof sectionData === 'string') {
      return await this.translateText(sectionData, fromLang, toLang);
    }

    return sectionData;
  }

  private buildTranslationPrompt(text: string, fromLang: CVLanguage, toLang: CVLanguage, systemPrompt: string): string {
    const langNames = {
      azerbaijani: fromLang === 'azerbaijani' ? 'Azərbaycan dilindən' : 'Azerbaijani',
      english: toLang === 'english' ? 'English' : 'İngilis dilinə'
    };

    if (toLang === 'azerbaijani') {
      return `Bu CV məzmununu ${langNames.english}-dən ${langNames.azerbaijani} tərcümə edin. Peşəkar terminologiya və konteksti saxlayın:\n\n"${text}"`;
    } else {
      return `Translate this CV content from ${langNames.azerbaijani} to ${langNames.english}. Maintain professional terminology and context:\n\n"${text}"`;
    }
  }

  private fallbackTranslation(text: string, fromLang: CVLanguage, toLang: CVLanguage): string {
    // Basic fallback translation using predefined patterns
    const basicTranslations = {
      azerbaijani: {
        'Software Engineer': 'Proqram Təminatı Mühəndisi',
        'Project Manager': 'Layihə Meneceri',
        'Senior Developer': 'Böyük Developer',
        'Full Stack Developer': 'Full Stack Developer',
        'Frontend Developer': 'Frontend Developer',
        'Backend Developer': 'Backend Developer',
        'UI/UX Designer': 'UI/UX Dizayner',
        'Data Analyst': 'Verilənlər Analitiki',
        'Business Analyst': 'Biznes Analitiki',
        'Product Manager': 'Məhsul Meneceri'
      },
      english: {
        'Proqram Təminatı Mühəndisi': 'Software Engineer',
        'Layihə Meneceri': 'Project Manager',
        'Böyük Developer': 'Senior Developer',
        'Verilənlər Analitiki': 'Data Analyst',
        'Biznes Analitiki': 'Business Analyst',
        'Məhsul Meneceri': 'Product Manager',
        'Dizayner': 'Designer',
        'Mühəndis': 'Engineer',
        'Menecer': 'Manager',
        'Mütəxəssis': 'Specialist'
      }
    };

    const translations = basicTranslations[toLang];
    let translatedText = text;

    // Apply basic word-by-word translation for known terms
    Object.entries(translations).forEach(([original, translation]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation);
    });

    return translatedText;
  }
}

/**
 * Google Translate API Service (Free alternative)
 */
export class GoogleTranslateService implements AITranslationService {
  async translateText(text: string, fromLang: CVLanguage, toLang: CVLanguage): Promise<string> {
    if (!text.trim() || fromLang === toLang) return text;

    try {
      const langCodes = {
        azerbaijani: 'az',
        english: 'en'
      };

      const url = `${TRANSLATION_API_CONFIG.apiUrl}?client=gtx&sl=${langCodes[fromLang]}&tl=${langCodes[toLang]}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }

      return text;
    } catch (error) {
      console.error('Google Translate error:', error);
      return text;
    }
  }

  async translateBatch(texts: string[], fromLang: CVLanguage, toLang: CVLanguage): Promise<string[]> {
    return await Promise.all(
      texts.map(text => this.translateText(text, fromLang, toLang))
    );
  }

  async translateCVSection(sectionData: any, fromLang: CVLanguage, toLang: CVLanguage): Promise<any> {
    // Implementation similar to OpenAI service but using Google Translate
    if (!sectionData || fromLang === toLang) return sectionData;

    if (Array.isArray(sectionData)) {
      return await Promise.all(
        sectionData.map(item => this.translateCVSection(item, fromLang, toLang))
      );
    }

    if (typeof sectionData === 'object') {
      const translatedSection: any = {};

      for (const [key, value] of Object.entries(sectionData)) {
        if (typeof value === 'string' && value.trim()) {
          translatedSection[key] = await this.translateText(value, fromLang, toLang);
        } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
          translatedSection[key] = await this.translateCVSection(value, fromLang, toLang);
        } else {
          translatedSection[key] = value;
        }
      }

      return translatedSection;
    }

    if (typeof sectionData === 'string') {
      return await this.translateText(sectionData, fromLang, toLang);
    }

    return sectionData;
  }
}

/**
 * Translation Service Factory
 */
export function createTranslationService(useAI: boolean = true): AITranslationService {
  if (useAI && process.env.OPENAI_API_KEY) {
    return new OpenAITranslationService();
  }
  return new GoogleTranslateService();
}

/**
 * Translate entire CV data structure
 */
export async function translateFullCV(cvData: any, fromLang: CVLanguage, toLang: CVLanguage): Promise<any> {
  if (!cvData || fromLang === toLang) return cvData;

  const translationService = createTranslationService();
  const translatedCV = { ...cvData };

  try {
    // Translate personal information
    if (cvData.personalInfo) {
      translatedCV.personalInfo = await translationService.translateCVSection(
        cvData.personalInfo,
        fromLang,
        toLang
      );
    }

    // Translate all sections
    const sectionsToTranslate = [
      'experience', 'education', 'skills', 'projects',
      'certifications', 'volunteerExperience', 'languages',
      'publications', 'honorsAwards', 'courses'
    ];

    for (const sectionKey of sectionsToTranslate) {
      if (cvData[sectionKey]) {
        translatedCV[sectionKey] = await translationService.translateCVSection(
          cvData[sectionKey],
          fromLang,
          toLang
        );
      }
    }

    // Update language setting
    translatedCV.cvLanguage = { code: toLang };

    return translatedCV;

  } catch (error) {
    console.error('Full CV translation error:', error);
    return cvData; // Return original on error
  }
}

/**
 * Smart field translation for specific CV fields
 */
export async function translateCVField(
  fieldValue: string,
  fieldType: 'jobTitle' | 'skill' | 'description' | 'general',
  fromLang: CVLanguage,
  toLang: CVLanguage
): Promise<string> {

  if (!fieldValue || fromLang === toLang) return fieldValue;

  const translationService = createTranslationService();

  // Add context-specific prompts for different field types
  switch (fieldType) {
    case 'jobTitle':
      return await translationService.translateText(
        `Job Title: ${fieldValue}`,
        fromLang,
        toLang
      );
    case 'skill':
      return await translationService.translateText(
        `Professional Skill: ${fieldValue}`,
        fromLang,
        toLang
      );
    case 'description':
      return await translationService.translateText(
        fieldValue,
        fromLang,
        toLang
      );
    default:
      return await translationService.translateText(
        fieldValue,
        fromLang,
        toLang
      );
  }
}
