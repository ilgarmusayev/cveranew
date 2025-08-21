/**
 * Language utilities for CVERA application
 * Handles translation between Azerbaijani and English for CV sections
 */

export type CVLanguage = 'azerbaijani' | 'english';

// Section labels/headers
export const SECTION_LABELS = {
  azerbaijani: {
    personalInfo: 'Şəxsi Məlumatlar',
    summary: 'Peşəkar Xülasə',
    experience: 'İş Təcrübəsi',
    education: 'Təhsil',
    skills: 'Bacarıqlar',
    languages: 'Dillər',
    projects: 'Layihələr',
    certifications: 'Sertifikatlar',
    volunteerExperience: 'Könüllü Təcrübə',
    publications: 'Nəşrlər',
    honorsAwards: 'Mükafatlar və Təltiflər',
    testScores: 'Test Nəticələri',
    recommendations: 'Tövsiyələr',
    courses: 'Kurslar',

    // Personal info fields
    fullName: 'Ad və Soyad',
    email: 'Elektron Poçt',
    phone: 'Telefon Nömrəsi',
    linkedin: 'LinkedIn Profili',
    github: 'GitHub Profili',
    website: 'Veb Sayt',
    location: 'Ünvan',
    professionalSummary: 'Peşəkar Xülasə',

    // Experience fields
    position: 'Vəzifə',
    company: 'Şirkət',
    startDate: 'Başlama Tarixi',
    endDate: 'Bitmə Tarixi',
    description: 'Vəzifə Təsviri',
    current: 'Hal-hazırda',

    // Education fields
    degree: 'Təhsil Dərəcəsi',
    institution: 'Təhsil Müəssisəsi',
    gpa: 'Orta Qiymət',
    fieldOfStudy: 'Ixtisas',

    // Skill fields
    skillName: 'Bacarıq',
    name: 'Ad',
    category: 'Kateqoriya',
    level: 'Səviyyə',

    // Language fields
    language: 'Dil',
    proficiency: 'Bilmə Səviyyəsi',

    // Project fields
    projectName: 'Layihə Adı',
    technologies: 'İstifadə Edilən Texnologiyalar',
    url: 'Layihə Linki',

    // Certification fields
    issuer: 'Verən Təşkilat',
    date: 'Verilmə Tarixi',

    // Volunteer fields
    organization: 'Təşkilat',
    role: 'Vəzifə',
    cause: 'Məqsəd',

    // Date formats
    present: 'İndiyədək',
    to: ' - ',

    // Additional CV specific terms
    'Phone': 'Telefon',
    'Email': 'E-poçt',
    'Website': 'Veb sayt',
    'LinkedIn': 'LinkedIn',
    'Summary': 'Xülasə',
    'Work Experience': 'İş Təcrübəsi',
    'EXPERIENCE': 'İŞ TƏCRÜBƏSİ',
    'EDUCATION': 'TƏHSİL',
    'SKILLS': 'BACARIQLAR',
    'LANGUAGES': 'DİLLƏR',
    'PROJECTS': 'LAYİHƏLƏR',
    'CERTIFICATIONS': 'SERTİFİKATLAR',
    'VOLUNTEER EXPERIENCE': 'KÖNÜLLÜ TƏCRÜBƏSİ',
    'PUBLICATIONS': 'NƏŞRLƏR',
    'HONORS & AWARDS': 'MÜKAFATLAR VƏ TƏLTİFLƏR',
    'Present': 'İndiyədək',
    'GPA': 'Orta Qiymət',

    // Professional skill levels
    'Expert': 'Mütəxəssis',
    'Advanced': 'Qabaqcıl',
    'Intermediate': 'Orta',
    'Beginner': 'Başlanğıc',
    'Professional': 'Peşəkar',

    // Common professional terms
    'Responsibilities': 'Məsuliyyətlər',
    'Achievements': 'Nailiyyətlər',
    'Key Skills': 'Əsas Bacarıqlar',
    'Technical Skills': 'Texniki Bacarıqlar',
    'Soft Skills': 'Şəxsi Keyfiyyətlər',
    'Programming Languages': 'Proqramlaşdırma Dilləri',
    'Frameworks': 'Çərçivələr',
    'Tools': 'Alətlər',
    'Databases': 'Verilənlər Bazaları',

    // Buttons and actions
    add: 'Əlavə et',
    addSection: 'Bölmə əlavə et',
    save: 'Yadda saxla',
    cancel: 'Ləğv et',
    delete: 'Sil',
    edit: 'Redaktə et',
    generate: 'Yarad',
    translate: 'Tərcümə et',
    preview: 'Önizləmə',
    download: 'Yüklə',

    // Common terms
    optional: '(İxtiyari)',
    required: '(Məcburi)',
    loading: 'Yüklənir...',
    error: 'Xəta baş verdi',
    success: 'Uğurla tamamlandı',
    warning: 'Xəbərdarlıq',
    info: 'Məlumat',

    // CV sections titles
    cvLanguage: 'CV Dili',
    template: 'Şablon',
    export: 'İxrac et',

    // Placeholders
    enterName: 'Ad və soyadınızı daxil edin',
    enterEmail: 'E-poçt ünvanınızı daxil edin',
    enterPhone: 'Telefon nömrənizi daxil edin',
    enterLinkedin: 'LinkedIn profil linkini daxil edin',
    enterGithub: 'GitHub profil linkini daxil edin',
    enterWebsite: 'Veb sayt ünvanınızı daxil edin',
    enterLocation: 'Yaşadığınız şəhəri daxil edin',

    // Messages
    noDataAdded: 'Hələ məlumat əlavə edilməyib',
    addFirstItem: 'İlk elementi əlavə edin',
    addMoreItems: 'Daha çox məlumat əlavə edin',

    // Professional context terms
    'Years of Experience': 'İl Təcrübə',
    'Team Lead': 'Komanda Rəhbəri',
    'Senior': 'Böyük',
    'Junior': 'Kiçik',
    'Lead': 'Rəhbər',
    'Manager': 'Menecer',
    'Director': 'Direktor',
    'CEO': 'İcraçı Direktor',
    'CTO': 'Texniki Direktor',
    'Full-time': 'Tam ştat',
    'Part-time': 'Yarım ştat',
    'Contract': 'Müqavilə əsasında',
    'Freelance': 'Sərbəst iş',
    'Internship': 'Təcrübə'
  },

  english: {
    personalInfo: 'Personal Information',
    summary: 'Professional Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    projects: 'Projects',
    certifications: 'Certifications',
    volunteerExperience: 'Volunteer Experience',
    publications: 'Publications',
    honorsAwards: 'Honors & Awards',
    testScores: 'Test Scores',
    recommendations: 'Recommendations',
    courses: 'Courses',

    // Personal info fields
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    linkedin: 'LinkedIn Profile',
    github: 'GitHub Profile',
    website: 'Website',
    location: 'Location',
    professionalSummary: 'Professional Summary',

    // Experience fields
    position: 'Position',
    company: 'Company',
    startDate: 'Start Date',
    endDate: 'End Date',
    description: 'Job Description',
    current: 'Current',

    // Education fields
    degree: 'Degree',
    institution: 'Institution',
    gpa: 'GPA',
    fieldOfStudy: 'Field of Study',

    // Skill fields
    skillName: 'Skill',
    name: 'Name',
    category: 'Category',
    level: 'Level',

    // Language fields
    language: 'Language',
    proficiency: 'Proficiency Level',

    // Project fields
    projectName: 'Project Name',
    technologies: 'Technologies Used',
    url: 'Project URL',

    // Certification fields
    issuer: 'Issuing Organization',
    date: 'Issue Date',

    // Volunteer fields
    organization: 'Organization',
    role: 'Role',
    cause: 'Cause',

    // Date formats
    present: 'Present',
    to: ' - ',

    // Additional CV specific terms
    'Phone': 'Phone',
    'Email': 'Email',
    'Website': 'Website',
    'LinkedIn': 'LinkedIn',
    'Summary': 'Summary',
    'Work Experience': 'Work Experience',
    'EXPERIENCE': 'EXPERIENCE',
    'EDUCATION': 'EDUCATION',
    'SKILLS': 'SKILLS',
    'LANGUAGES': 'LANGUAGES',
    'PROJECTS': 'PROJECTS',
    'CERTIFICATIONS': 'CERTIFICATIONS',
    'VOLUNTEER EXPERIENCE': 'VOLUNTEER EXPERIENCE',
    'PUBLICATIONS': 'PUBLICATIONS',
    'HONORS & AWARDS': 'HONORS & AWARDS',
    'Present': 'Present',
    'GPA': 'GPA',

    // Professional skill levels
    'Expert': 'Expert',
    'Advanced': 'Advanced',
    'Intermediate': 'Intermediate',
    'Beginner': 'Beginner',
    'Professional': 'Professional',

    // Common professional terms
    'Responsibilities': 'Responsibilities',
    'Achievements': 'Achievements',
    'Key Skills': 'Key Skills',
    'Technical Skills': 'Technical Skills',
    'Soft Skills': 'Soft Skills',
    'Programming Languages': 'Programming Languages',
    'Frameworks': 'Frameworks',
    'Tools': 'Tools',
    'Databases': 'Databases',

    // Buttons and actions
    add: 'Add',
    addSection: 'Add Section',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    generate: 'Generate',
    translate: 'Translate',
    preview: 'Preview',
    download: 'Download',

    // Common terms
    optional: '(Optional)',
    required: '(Required)',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Successfully completed',
    warning: 'Warning',
    info: 'Information',

    // CV sections titles
    cvLanguage: 'CV Language',
    template: 'Template',
    export: 'Export',

    // Placeholders
    enterName: 'Enter your full name',
    enterEmail: 'Enter your email address',
    enterPhone: 'Enter your phone number',
    enterLinkedin: 'Enter your LinkedIn profile URL',
    enterGithub: 'Enter your GitHub profile URL',
    enterWebsite: 'Enter your website URL',
    enterLocation: 'Enter your city',

    // Messages
    noDataAdded: 'No data added yet',
    addFirstItem: 'Add first item',
    addMoreItems: 'Add more information',

    // Professional context terms
    'Years of Experience': 'Years of Experience',
    'Team Lead': 'Team Lead',
    'Senior': 'Senior',
    'Junior': 'Junior',
    'Lead': 'Lead',
    'Manager': 'Manager',
    'Director': 'Director',
    'CEO': 'Chief Executive Officer',
    'CTO': 'Chief Technology Officer',
    'Full-time': 'Full-time',
    'Part-time': 'Part-time',
    'Contract': 'Contract',
    'Freelance': 'Freelance',
    'Internship': 'Internship'
  }
};

// Language level translations
export const LANGUAGE_LEVELS = {
  azerbaijani: {
    'Native': 'Ana dil',
    'Native Speaker': 'Ana dil danışanı',
    'Fluent': 'Sərbəst',
    'Professional': 'Peşəkar səviyyə',
    'Conversational': 'Danışıq səviyyəsi',
    'Intermediate': 'Orta səviyyə',
    'Basic': 'Əsas səviyyə',
    'Beginner': 'Başlanğıc səviyyə',
    'Advanced': 'Yüksək səviyyə',
    'Upper Intermediate': 'Yuxarı orta səviyyə',
    'Pre-Intermediate': 'Orta-altı səviyyə',
    'Elementary': 'İlkin səviyyə'
  },
  english: {
    'Ana dil': 'Native',
    'Ana dil danışanı': 'Native Speaker',
    'Sərbəst': 'Fluent',
    'Peşəkar səviyyə': 'Professional',
    'Danışıq səviyyəsi': 'Conversational',
    'Orta səviyyə': 'Intermediate',
    'Əsas səviyyə': 'Basic',
    'Başlanğıc səviyyə': 'Beginner',
    'Yüksək səviyyə': 'Advanced',
    'Yuxarı orta səviyyə': 'Upper Intermediate',
    'Orta-altı səviyyə': 'Pre-Intermediate',
    'İlkin səviyyə': 'Elementary'
  }
};

// Common degree translations
export const DEGREE_TRANSLATIONS = {
  azerbaijani: {
    'Bachelor': 'Bakalavr',
    'Bachelor of Science': 'Elm Bakalavr',
    'Bachelor of Arts': 'İncəsənət Bakalavr',
    'Bachelor of Engineering': 'Mühəndislik Bakalavr',
    'Master': 'Magistr',
    'Master of Science': 'Elm Magistr',
    'Master of Arts': 'İncəsənət Magistr',
    'Master of Business Administration': 'Biznes İdarəetməsi Magistr',
    'PhD': 'Fəlsəfə Doktoru',
    'Doctorate': 'Doktorantura',
    'Associate': 'Assotsiat',
    'Associate Degree': 'Assotsiat Dərəcəsi',
    'High School': 'Orta məktəb',
    'High School Diploma': 'Orta məktəb attestatı',
    'Certificate': 'Sertifikat',
    'Professional Certificate': 'Peşəkar Sertifikat',
    'Diploma': 'Diplom'
  },
  english: {
    'Bakalavr': 'Bachelor',
    'Elm Bakalavr': 'Bachelor of Science',
    'İncəsənət Bakalavr': 'Bachelor of Arts',
    'Mühəndislik Bakalavr': 'Bachelor of Engineering',
    'Magistr': 'Master',
    'Elm Magistr': 'Master of Science',
    'İncəsənət Magistr': 'Master of Arts',
    'Biznes İdarəetməsi Magistr': 'Master of Business Administration',
    'Fəlsəfə Doktoru': 'PhD',
    'Doktorantura': 'Doctorate',
    'Assotsiat': 'Associate',
    'Assotsiat Dərəcəsi': 'Associate Degree',
    'Orta məktəb': 'High School',
    'Orta məktəb attestatı': 'High School Diploma',
    'Sertifikat': 'Certificate',
    'Peşəkar Sertifikat': 'Professional Certificate',
    'Diplom': 'Diploma'
  }
};

// Professional skill categories
export const SKILL_CATEGORIES = {
  azerbaijani: {
    'Technical': 'Texniki',
    'Programming': 'Proqramlaşdırma',
    'Software': 'Proqram Təminatı',
    'Design': 'Dizayn',
    'Marketing': 'Marketinq',
    'Management': 'İdarəetmə',
    'Communication': 'Ünsiyyət',
    'Leadership': 'Liderlik',
    'Analytical': 'Analitik',
    'Creative': 'Yaradıcı',
    'Language': 'Dil',
    'Other': 'Digər'
  },
  english: {
    'Texniki': 'Technical',
    'Proqramlaşdırma': 'Programming',
    'Proqram Təminatı': 'Software',
    'Dizayn': 'Design',
    'Marketinq': 'Marketing',
    'İdarəetmə': 'Management',
    'Ünsiyyət': 'Communication',
    'Liderlik': 'Leadership',
    'Analitik': 'Analytical',
    'Yaradıcı': 'Creative',
    'Dil': 'Language',
    'Digər': 'Other'
  }
};

/**
 * Get month names for date formatting
 */
export const MONTH_NAMES = {
  azerbaijani: [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ],
  english: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
};

/**
 * Get translated label for a field/section
 */
export function getLabel(key: string, language: CVLanguage): string {
  return SECTION_LABELS[language][key as keyof typeof SECTION_LABELS[typeof language]] || key;
}

/**
 * Format date range according to language
 */
export function formatDateRange(startDate: string, endDate: string | undefined, language: CVLanguage): string {
  const labels = SECTION_LABELS[language];

  if (!endDate) {
    return `${startDate} ${labels.to} ${labels.present}`;
  }

  return `${startDate} ${labels.to} ${endDate}`;
}

/**
 * Format professional experience date range
 */
export function formatExperienceDateRange(
  startDate: string,
  endDate: string | undefined,
  isCurrent: boolean,
  language: CVLanguage
): string {
  const labels = SECTION_LABELS[language];
  const formattedStart = formatDate(startDate, language) || startDate;

  if (isCurrent) {
    return `${formattedStart}${labels.to}${labels.present}`;
  }

  const formattedEnd = endDate ? (formatDate(endDate, language) || endDate) : '';
  return formattedEnd ? `${formattedStart}${labels.to}${formattedEnd}` : formattedStart;
}

/**
 * Get localized contact labels
 */
export function getContactLabels(language: CVLanguage) {
  const labels = SECTION_LABELS[language];
  return {
    phone: labels.phone || 'Phone',
    email: labels.email || 'Email',
    website: labels.website || 'Website',
    linkedin: labels.linkedin || 'LinkedIn',
    location: labels.location || 'Location'
  };
}

/**
 * Get section display names in the specified language
 */
export function getSectionDisplayNames(language: CVLanguage) {
  const labels = SECTION_LABELS[language];
  return {
    personalInfo: labels.personalInfo,
    summary: labels.summary,
    experience: labels.experience,
    education: labels.education,
    skills: labels.skills,
    languages: labels.languages,
    projects: labels.projects,
    certifications: labels.certifications,
    volunteerExperience: labels.volunteerExperience,
    publications: labels.publications,
    honorsAwards: labels.honorsAwards,
    courses: labels.courses
  };
}

/**
 * Translate language level
 */
export function translateLanguageLevel(level: string, targetLanguage: CVLanguage): string {
  const translations = LANGUAGE_LEVELS[targetLanguage];
  return translations[level as keyof typeof translations] || level;
}

/**
 * Translate degree name
 */
export function translateDegree(degree: string, targetLanguage: CVLanguage): string {
  const translations = DEGREE_TRANSLATIONS[targetLanguage];
  return translations[degree as keyof typeof translations] || degree;
}

/**
 * Format date according to language preference
 */
export function formatDate(dateString: string, language: CVLanguage): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const monthNames = MONTH_NAMES[language];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${year}`;
  } catch {
    return dateString; // Return original if parsing fails
  }
}

/**
 * Get default CV language based on browser/user preference
 */
export function getDefaultCVLanguage(): CVLanguage {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('az') || browserLang.includes('aze')) {
      return 'azerbaijani';
    }
  }
  return 'english'; // Default to English
}

/**
 * Validate CV language
 */
export function isValidCVLanguage(language: string): language is CVLanguage {
  return language === 'azerbaijani' || language === 'english';
}

/**
 * Translate skill category
 */
export function translateSkillCategory(category: string, targetLanguage: CVLanguage): string {
  const translations = SKILL_CATEGORIES[targetLanguage];
  return translations[category as keyof typeof translations] || category;
}

/**
 * Translate content text (for common professional terms)
 */
export function translateContent(text: string, targetLanguage: CVLanguage): string {
  if (!text) return text;

  const labels = SECTION_LABELS[targetLanguage];

  // Check if the text exists as a key in our translations
  const translation = labels[text as keyof typeof labels];
  if (translation) {
    return translation;
  }

  // For composite terms, try to translate individual words
  const words = text.split(' ');
  const translatedWords = words.map(word => {
    const wordTranslation = labels[word as keyof typeof labels];
    return wordTranslation || word;
  });

  const translatedText = translatedWords.join(' ');
  return translatedText !== text ? translatedText : text;
}

/**
 * Smart text translation for CV content
 * Attempts to translate job titles, skills, and other professional terms
 */
export function smartTranslateText(text: string, targetLanguage: CVLanguage): string {
  if (!text) return text;

  // Common job title patterns
  const jobTitlePatterns = {
    azerbaijani: {
      'Developer': 'Developer',
      'Engineer': 'Mühəndis',
      'Manager': 'Menecer',
      'Director': 'Direktor',
      'Analyst': 'Analitik',
      'Designer': 'Dizayner',
      'Consultant': 'Məsləhətçi',
      'Specialist': 'Mütəxəssis',
      'Coordinator': 'Koordinator',
      'Administrator': 'Administrator',
      'Assistant': 'Köməkçi',
      'Lead': 'Rəhbər',
      'Senior': 'Böyük',
      'Junior': 'Kiçik',
      'Principal': 'Baş',
      'Chief': 'Baş'
    },
    english: {
      'Mühəndis': 'Engineer',
      'Menecer': 'Manager',
      'Direktor': 'Director',
      'Analitik': 'Analyst',
      'Dizayner': 'Designer',
      'Məsləhətçi': 'Consultant',
      'Mütəxəssis': 'Specialist',
      'Koordinator': 'Coordinator',
      'Köməkçi': 'Assistant',
      'Rəhbər': 'Lead',
      'Böyük': 'Senior',
      'Kiçik': 'Junior',
      'Baş': 'Principal/Chief'
    }
  };

  let translatedText = text;
  const patterns = jobTitlePatterns[targetLanguage];

  // Replace job title terms
  Object.entries(patterns).forEach(([original, translation]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    translatedText = translatedText.replace(regex, translation);
  });

  // Use general content translation as fallback
  if (translatedText === text) {
    translatedText = translateContent(text, targetLanguage);
  }

  return translatedText;
}

/**
 * AI-Powered intelligent text translation
 * Uses AI to translate any CV content with professional context
 */
export async function aiTranslateText(
  text: string,
  fromLang: CVLanguage,
  toLang: CVLanguage,
  context: 'jobTitle' | 'skill' | 'description' | 'general' = 'general'
): Promise<string> {
  if (!text || fromLang === toLang) return text;

  try {
    // Dynamic import to avoid bundling issues
    const { translateCVField } = await import('./aiTranslation');
    return await translateCVField(text, context, fromLang, toLang);
  } catch (error) {
    console.error('AI translation failed, using fallback:', error);
    // Fallback to smart translation
    return smartTranslateText(text, toLang);
  }
}

/**
 * Translate complete CV data using AI
 */
export async function aiTranslateFullCV(cvData: any, fromLang: CVLanguage, toLang: CVLanguage): Promise<any> {
  if (!cvData || fromLang === toLang) return cvData;

  try {
    const { translateFullCV } = await import('./aiTranslation');
    return await translateFullCV(cvData, fromLang, toLang);
  } catch (error) {
    console.error('Full CV AI translation failed:', error);
    return cvData;
  }
}

/**
 * Enhanced content translation with AI fallback
 */
export async function enhancedTranslateContent(
  text: string,
  targetLanguage: CVLanguage,
  sourceLanguage?: CVLanguage,
  context?: 'jobTitle' | 'skill' | 'description' | 'general'
): Promise<string> {
  if (!text) return text;

  // Detect source language if not provided
  const sourceLang = sourceLanguage || detectLanguage(text);

  if (sourceLang === targetLanguage) return text;

  // Try AI translation first
  try {
    return await aiTranslateText(text, sourceLang, targetLanguage, context);
  } catch (error) {
    console.warn('AI translation failed, using static translation:', error);
    // Fallback to static translation
    return smartTranslateText(text, targetLanguage);
  }
}

/**
 * Detect language of text (simple heuristic)
 */
function detectLanguage(text: string): CVLanguage {
  // Simple detection based on character patterns
  const azerbaijaniChars = /[əıöüçğşâî]/gi;
  const matches = text.match(azerbaijaniChars);

  if (matches && matches.length > 0) {
    return 'azerbaijani';
  }

  return 'english';
}

/**
 * Batch translate multiple texts
 */
export async function batchTranslateTexts(
  texts: string[],
  fromLang: CVLanguage,
  toLang: CVLanguage
): Promise<string[]> {
  if (fromLang === toLang) return texts;

  try {
    const { createTranslationService } = await import('./aiTranslation');
    const translationService = createTranslationService();
    return await translationService.translateBatch(texts, fromLang, toLang);
  } catch (error) {
    console.error('Batch translation failed:', error);
    // Fallback to individual smart translations
    return texts.map(text => smartTranslateText(text, toLang));
  }
}

/**
 * Translate section names dynamically
 */
export async function translateSectionNames(
  sectionNames: Record<string, string>,
  targetLanguage: CVLanguage
): Promise<Record<string, string>> {
  const translatedSections: Record<string, string> = {};

  for (const [key, value] of Object.entries(sectionNames)) {
    if (value) {
      try {
        translatedSections[key] = await enhancedTranslateContent(
          value,
          targetLanguage,
          undefined,
          'general'
        );
      } catch (error) {
        // Fallback to predefined translations
        translatedSections[key] = getLabel(key, targetLanguage) || value;
      }
    } else {
      translatedSections[key] = getLabel(key, targetLanguage) || '';
    }
  }

  return translatedSections;
}

/**
 * Professional CV content validation and translation
 */
export async function translateAndValidateCVContent(
  content: any,
  fromLang: CVLanguage,
  toLang: CVLanguage
): Promise<any> {
  if (!content || fromLang === toLang) return content;

  try {
    // Handle different content types
    if (typeof content === 'string') {
      return await enhancedTranslateContent(content, toLang, fromLang, 'description');
    }

    if (Array.isArray(content)) {
      return await Promise.all(
        content.map(item => translateAndValidateCVContent(item, fromLang, toLang))
      );
    }

    if (typeof content === 'object' && content !== null) {
      const translatedContent: any = {};

      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string' && value.trim()) {
          // Determine context based on field name
          let context: 'jobTitle' | 'skill' | 'description' | 'general' = 'general';

          if (key.includes('position') || key.includes('title') || key.includes('role')) {
            context = 'jobTitle';
          } else if (key.includes('skill') || key.includes('technology')) {
            context = 'skill';
          } else if (key.includes('description') || key.includes('summary')) {
            context = 'description';
          }

          translatedContent[key] = await enhancedTranslateContent(
            value,
            toLang,
            fromLang,
            context
          );
        } else if (value !== null && value !== undefined) {
          translatedContent[key] = await translateAndValidateCVContent(value, fromLang, toLang);
        } else {
          translatedContent[key] = value;
        }
      }

      return translatedContent;
    }

    return content;
  } catch (error) {
    console.error('Content translation error:', error);
    return content;
  }
}
