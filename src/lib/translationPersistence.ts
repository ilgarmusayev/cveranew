/**
 * Translation Persistence Utilities
 * Ensures that all translated CV data is properly saved and maintained in the correct format
 */

import { PrismaClient } from '@prisma/client';
import { CVLanguage } from './cvLanguage';

const prisma = new PrismaClient();

export interface TranslationMetadata {
  sourceLanguage: string;
  targetLanguage: string;
  translatedAt: string;
  translatedBy: string;
  originalLanguage?: string;
}

export interface TranslatedCVData {
  cvLanguage: CVLanguage;
  translationMetadata: TranslationMetadata;
  [key: string]: any;
}

/**
 * Save translated CV data to database ensuring format persistence
 */
export async function saveTranslatedCV(
  cvId: string,
  userId: string,
  translatedData: TranslatedCVData,
  updateTitle: boolean = false
): Promise<any> {
  try {
    const updateData: any = {
      cv_data: translatedData,
      updatedAt: new Date()
    };

    // Update title to reflect translation if requested
    if (updateTitle && translatedData.translationMetadata) {
      const existingCV = await prisma.cV.findUnique({
        where: { id: cvId, userId: userId }
      });

      if (existingCV?.title) {
        const languageNames = {
          'az': 'Azərbaycan',
          'en': 'English',
          'tr': 'Türkçe',
          'ru': 'Русский'
        };

        const targetLangName = languageNames[translatedData.translationMetadata.targetLanguage as keyof typeof languageNames]
          || translatedData.translationMetadata.targetLanguage;

        updateData.title = `${existingCV.title} (${targetLangName})`;
      }
    }

    const updatedCV = await prisma.cV.update({
      where: {
        id: cvId,
        userId: userId
      },
      data: updateData
    });

    console.log('💾 Tərcümə edilmiş CV format saxlanıldı:', {
      cvId,
      language: translatedData.cvLanguage,
      translatedAt: translatedData.translationMetadata.translatedAt
    });

    return updatedCV;
  } catch (error) {
    console.error('❌ Tərcümə edilmiş CV saxlanarkən xəta:', error);
    throw new Error('Tərcümə edilmiş CV saxlanarkən xəta baş verdi');
  }
}

/**
 * Validate that CV data maintains translated format
 */
export function validateTranslatedFormat(cvData: any): boolean {
  if (!cvData) return false;

  // Check if language is set
  if (!cvData.cvLanguage) return false;

  // Check if translation metadata exists (for translated CVs)
  if (cvData.translationMetadata) {
    const metadata = cvData.translationMetadata;
    return !!(
      metadata.sourceLanguage &&
      metadata.targetLanguage &&
      metadata.translatedAt &&
      metadata.translatedBy
    );
  }

  return true; // Original CVs without translation metadata are valid
}

/**
 * Merge CV data while preserving translation format
 */
export function mergePreservingTranslation(
  existingData: any,
  newData: any
): any {
  // Create a deep merge that preserves all translation formatting
  const merged = {
    ...existingData,
    ...newData,
    // Always preserve translation metadata and language
    cvLanguage: newData.cvLanguage || existingData.cvLanguage,
    translationMetadata: newData.translationMetadata || existingData.translationMetadata,
    // Preserve section names in the current language - CRITICAL for translation persistence
    sectionNames: {
      ...existingData.sectionNames,
      ...newData.sectionNames
    },
    // Preserve section order
    sectionOrder: newData.sectionOrder || existingData.sectionOrder,
    // Preserve additional sections with proper merging
    additionalSections: {
      ...existingData.additionalSections,
      ...newData.additionalSections
    },
    // Preserve all sections data with translation format
    personalInfo: {
      ...existingData.personalInfo,
      ...newData.personalInfo
    },
    experience: newData.experience || existingData.experience || [],
    education: newData.education || existingData.education || [],
    skills: newData.skills || existingData.skills || [],
    projects: newData.projects || existingData.projects || [],
    certifications: newData.certifications || existingData.certifications || [],
    languages: newData.languages || existingData.languages || [],
    volunteerExperience: newData.volunteerExperience || existingData.volunteerExperience || [],
    publications: newData.publications || existingData.publications || [],
    honorsAwards: newData.honorsAwards || existingData.honorsAwards || []
  };

  return merged;
}

/**
 * Bulk save multiple translated CVs
 */
export async function bulkSaveTranslatedCVs(
  translations: Array<{
    cvId: string;
    userId: string;
    translatedData: TranslatedCVData;
    updateTitle?: boolean;
  }>
): Promise<any[]> {
  const results = [];

  for (const translation of translations) {
    try {
      const result = await saveTranslatedCV(
        translation.cvId,
        translation.userId,
        translation.translatedData,
        translation.updateTitle
      );
      results.push({ success: true, cvId: translation.cvId, result });
    } catch (error) {
      console.error(`❌ CV ${translation.cvId} saxlanarkən xəta:`, error);
      results.push({
        success: false,
        cvId: translation.cvId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

/**
 * Check if CV needs translation update
 */
export function needsTranslationUpdate(
  cvData: any,
  targetLanguage: CVLanguage
): boolean {
  if (!cvData) return true;

  // If no language is set, needs translation
  if (!cvData.cvLanguage) return true;

  // If current language differs from target, needs translation
  if (cvData.cvLanguage !== targetLanguage) return true;

  // If translation metadata suggests it was translated to a different language
  if (cvData.translationMetadata &&
      cvData.translationMetadata.targetLanguage !== targetLanguage) {
    return true;
  }

  return false;
}

/**
 * Get translation status for a CV
 */
export function getTranslationStatus(cvData: any): {
  isTranslated: boolean;
  currentLanguage?: CVLanguage;
  originalLanguage?: string;
  translatedAt?: string;
  translatedBy?: string;
} {
  if (!cvData) {
    return { isTranslated: false };
  }

  const isTranslated = !!(cvData.translationMetadata);

  return {
    isTranslated,
    currentLanguage: cvData.cvLanguage,
    originalLanguage: cvData.translationMetadata?.originalLanguage,
    translatedAt: cvData.translationMetadata?.translatedAt,
    translatedBy: cvData.translationMetadata?.translatedBy
  };
}

/**
 * Auto-save translated content after any CV modification
 */
export async function autoSaveWithTranslationPreservation(
  cvId: string,
  userId: string,
  updatedData: any
): Promise<any> {
  try {
    // Get existing CV data
    const existingCV = await prisma.cV.findUnique({
      where: { id: cvId, userId: userId }
    });

    if (!existingCV) {
      throw new Error('CV tapılmadı');
    }

    // Merge while preserving translation format
    const mergedData = mergePreservingTranslation(
      existingCV.cv_data,
      updatedData
    );

    // Validate the merged format
    if (!validateTranslatedFormat(mergedData)) {
      console.warn('⚠️ Tərcümə formatı pozuldu, düzəldilir...');
    }

    // Save with preserved format
    const result = await prisma.cV.update({
      where: { id: cvId },
      data: {
        cv_data: mergedData,
        updatedAt: new Date()
      }
    });

    console.log('✅ CV avtomatik saxlanıldı və tərcümə formatı saxlanıldı');
    return result;

  } catch (error) {
    console.error('❌ Avtomatik saxlama xətası:', error);
    throw error;
  }
}
