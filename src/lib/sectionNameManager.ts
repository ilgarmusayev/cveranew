/**
 * Section Name Management Utilities
 * Ensures section names are properly translated and preserved in the UI
 */

import { CVLanguage, getLabel } from './cvLanguage';

export interface SectionInfo {
  id: string;
  name: string;
  displayName: string;
  isVisible: boolean;
  order: number;
  hasData: boolean;
  icon: string;
}

/**
 * Get section display name based on current CV language
 */
export function getSectionDisplayName(
  sectionId: string,
  cvData: any,
  fallbackLanguage: CVLanguage = 'azerbaijani'
): string {
  // First check if CV has custom section names (from translation)
  if (cvData?.sectionNames && cvData.sectionNames[sectionId]) {
    return cvData.sectionNames[sectionId];
  }

  // Use CV language if available
  const language = cvData?.cvLanguage || fallbackLanguage;

  // Get translated label based on language
  return getLabel(sectionId, language) || sectionId;
}

/**
 * Update section names in CV data while preserving translation
 */
export function updateSectionNames(
  cvData: any,
  newSectionNames: Record<string, string>
): any {
  return {
    ...cvData,
    sectionNames: {
      ...cvData.sectionNames,
      ...newSectionNames
    }
  };
}

/**
 * Generate section names for a specific language
 */
export function generateSectionNamesForLanguage(
  existingSections: string[],
  targetLanguage: CVLanguage
): Record<string, string> {
  const sectionNames: Record<string, string> = {};

  existingSections.forEach(sectionId => {
    sectionNames[sectionId] = getLabel(sectionId, targetLanguage) || sectionId;
  });

  return sectionNames;
}

/**
 * Check if section names need updating for language change
 */
export function needsSectionNameUpdate(
  cvData: any,
  targetLanguage: CVLanguage
): boolean {
  if (!cvData) return true;

  // If no section names exist, need update
  if (!cvData.sectionNames) return true;

  // If language changed, need update
  if (cvData.cvLanguage !== targetLanguage) return true;

  return false;
}

/**
 * Preserve section names during CV operations
 */
export function preserveSectionNames(
  originalData: any,
  newData: any
): Record<string, string> {
  const preserved = {
    ...originalData?.sectionNames,
    ...newData?.sectionNames
  };

  // Ensure we don't lose any section names during merge
  if (originalData?.translationMetadata) {
    // This is a translated CV, preserve its section names
    Object.keys(preserved).forEach(key => {
      if (!preserved[key] && originalData.sectionNames?.[key]) {
        preserved[key] = originalData.sectionNames[key];
      }
    });
  }

  return preserved;
}

/**
 * Auto-detect sections that need translation
 */
export function detectSectionsNeedingTranslation(cvData: any): string[] {
  const sectionsWithData = [];

  if (cvData.personalInfo) sectionsWithData.push('personalInfo');
  if (cvData.experience?.length > 0) sectionsWithData.push('experience');
  if (cvData.education?.length > 0) sectionsWithData.push('education');
  if (cvData.skills?.length > 0) sectionsWithData.push('skills');
  if (cvData.projects?.length > 0) sectionsWithData.push('projects');
  if (cvData.certifications?.length > 0) sectionsWithData.push('certifications');
  if (cvData.languages?.length > 0) sectionsWithData.push('languages');
  if (cvData.volunteerExperience?.length > 0) sectionsWithData.push('volunteerExperience');
  if (cvData.publications?.length > 0) sectionsWithData.push('publications');
  if (cvData.honorsAwards?.length > 0) sectionsWithData.push('honorsAwards');

  return sectionsWithData;
}

/**
 * Ensure section names are consistent with CV language
 */
export function ensureSectionNamesConsistency(cvData: any): any {
  if (!cvData) return cvData;

  const currentLanguage = cvData.cvLanguage || 'azerbaijani';
  const sectionsWithData = detectSectionsNeedingTranslation(cvData);

  // Generate proper section names for current language
  const properSectionNames = generateSectionNamesForLanguage(sectionsWithData, currentLanguage);

  // Merge with existing section names, giving priority to existing ones
  const finalSectionNames = {
    ...properSectionNames,
    ...cvData.sectionNames
  };

  return {
    ...cvData,
    sectionNames: finalSectionNames
  };
}

/**
 * Force update all section names to match current language
 */
export function forceUpdateSectionNamesToLanguage(
  cvData: any,
  targetLanguage: CVLanguage
): any {
  if (!cvData) return cvData;

  const sectionsWithData = detectSectionsNeedingTranslation(cvData);
  const newSectionNames = generateSectionNamesForLanguage(sectionsWithData, targetLanguage);

  return {
    ...cvData,
    cvLanguage: targetLanguage,
    sectionNames: newSectionNames
  };
}
