import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// Initialize Gemini AI
function initializeGeminiAI() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable tapılmadı');
  }
  return new GoogleGenerativeAI(geminiApiKey);
}

// Language mappings for better translation
const LANGUAGE_NAMES = {
  'az': 'Azərbaycan',
  'en': 'English',
  'tr': 'Türkçe',
  'ru': 'Русский',
  'de': 'Deutsch',
  'fr': 'Français',
  'es': 'Español',
  'it': 'Italiano',
  'pt': 'Português',
  'ar': 'العربية',
  'zh': '中文',
  'ja': '日本語',
  'ko': '한국어'
};

// Function to translate CV sections
async function translateCVContent(content: any, targetLanguage: string, sourceLanguage: string = 'auto') {
  const geminiAI = initializeGeminiAI();
  const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const targetLangName = LANGUAGE_NAMES[targetLanguage as keyof typeof LANGUAGE_NAMES] || targetLanguage;
  const sourceLangName = sourceLanguage === 'auto' ? 'mətndə olan dil' : LANGUAGE_NAMES[sourceLanguage as keyof typeof LANGUAGE_NAMES];

  const prompt = `
Siz peşəkar tərcüməçisiniz. Aşağıdakı CV məzmununu ${sourceLangName} dilindən ${targetLangName} dilinə tərcümə edin.

MÜTLƏQ QAYDALAR:
1. Bütün mətnləri professional və dəqiq tərcümə edin
2. Şəxs adları, şirkət adları və yer adlarını orijinal saxlayın
3. Texniki terminləri düzgün tərcümə edin
4. Bölmə başlıqlarını (section names) tərcümə edin
5. CV formatını və strukturunu dəqiq saxlayın
6. Tarixləri və rəqəmləri orijinal saxlayın
7. JSON formatını dəqiq saxlayın
8. Boş və ya null dəyərləri tərcümə etməyin

Tərcümə ediləcək məzmun:
${JSON.stringify(content, null, 2)}

Yalnız tərcümə edilmiş JSON-u qaytarın, əlavə mətn yazmayın:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    // Clean the response and parse JSON
    const cleanedResponse = translatedText.replace(/```json\s*|\s*```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error('Tərcümə zamanı xəta baş verdi');
  }
}

// Function to generate default section names based on target language
function getDefaultSectionNames(targetLanguage: string): Record<string, string> {
  const sectionMappings = {
    'az': {
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
      customSections: 'Əlavə Bölmələr'
    },
    'en': {
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
      customSections: 'Additional Sections'
    }
  };

  return sectionMappings[targetLanguage as keyof typeof sectionMappings] || sectionMappings['en'];
}

// Function to identify which fields need translation - Enhanced version
function getTranslatableFields(cvData: any): any {
  const translatableContent: any = {};

  // Personal info translations
  if (cvData.personalInfo) {
    translatableContent.personalInfo = {};
    if (cvData.personalInfo.professionalSummary) {
      translatableContent.personalInfo.professionalSummary = cvData.personalInfo.professionalSummary;
    }
    if (cvData.personalInfo.headline) {
      translatableContent.personalInfo.headline = cvData.personalInfo.headline;
    }
    if (cvData.personalInfo.summary) {
      translatableContent.personalInfo.summary = cvData.personalInfo.summary;
    }
    if (cvData.personalInfo.title) {
      translatableContent.personalInfo.title = cvData.personalInfo.title;
    }
  }

  // Experience translations
  if (cvData.experience && Array.isArray(cvData.experience)) {
    translatableContent.experience = cvData.experience.map((exp: any) => ({
      id: exp.id,
      position: exp.position,
      company: exp.company,
      location: exp.location,
      description: exp.description,
      startDate: exp.startDate,
      endDate: exp.endDate,
      current: exp.current
    }));
  }

  // Education translations
  if (cvData.education && Array.isArray(cvData.education)) {
    translatableContent.education = cvData.education.map((edu: any) => ({
      id: edu.id,
      degree: edu.degree,
      institution: edu.institution,
      field: edu.field,
      description: edu.description,
      startDate: edu.startDate,
      endDate: edu.endDate,
      current: edu.current,
      gpa: edu.gpa
    }));
  }

  // Skills translations
  if (cvData.skills && Array.isArray(cvData.skills)) {
    translatableContent.skills = cvData.skills.map((skill: any) => {
      if (typeof skill === 'string') {
        return skill;
      }
      return {
        id: skill.id,
        name: skill.name,
        level: skill.level,
        category: skill.category
      };
    });
  }

  // Projects translations
  if (cvData.projects && Array.isArray(cvData.projects)) {
    translatableContent.projects = cvData.projects.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      url: project.url,
      startDate: project.startDate,
      endDate: project.endDate
    }));
  }

  // Certifications translations
  if (cvData.certifications && Array.isArray(cvData.certifications)) {
    translatableContent.certifications = cvData.certifications.map((cert: any) => ({
      id: cert.id,
      name: cert.name,
      issuer: cert.issuer,
      description: cert.description,
      date: cert.date,
      url: cert.url
    }));
  }

  // Languages (translate language names but preserve levels)
  if (cvData.languages && Array.isArray(cvData.languages)) {
    translatableContent.languages = cvData.languages.map((lang: any) => {
      if (typeof lang === 'string') {
        return lang;
      }
      return {
        id: lang.id,
        language: lang.language || lang.name,
        level: lang.level || lang.proficiency
      };
    });
  }

  // Volunteer work translations
  if (cvData.volunteerExperience && Array.isArray(cvData.volunteerExperience)) {
    translatableContent.volunteerExperience = cvData.volunteerExperience.map((vol: any) => ({
      id: vol.id,
      organization: vol.organization,
      role: vol.role || vol.position,
      cause: vol.cause,
      description: vol.description,
      startDate: vol.startDate,
      endDate: vol.endDate,
      current: vol.current
    }));
  }

  // Awards and honors translations
  if (cvData.honorsAwards && Array.isArray(cvData.honorsAwards)) {
    translatableContent.honorsAwards = cvData.honorsAwards.map((award: any) => ({
      id: award.id,
      title: award.title || award.name,
      issuer: award.issuer || award.organization,
      description: award.description,
      date: award.date
    }));
  }

  // Publications translations
  if (cvData.publications && Array.isArray(cvData.publications)) {
    translatableContent.publications = cvData.publications.map((pub: any) => ({
      id: pub.id,
      title: pub.title,
      authors: pub.authors,
      publication: pub.publication,
      description: pub.description,
      date: pub.date,
      url: pub.url
    }));
  }

  // Custom sections translations
  if (cvData.customSections && Array.isArray(cvData.customSections)) {
    translatableContent.customSections = cvData.customSections.map((section: any) => ({
      id: section.id,
      title: section.title,
      items: section.items ? section.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        description: item.description,
        startDate: item.startDate,
        endDate: item.endDate
      })) : []
    }));
  }

  // Section names translations
  if (cvData.sectionNames) {
    translatableContent.sectionNames = { ...cvData.sectionNames };
  }

  return translatableContent;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🌐 CV Tərcümə API: Sorğu başladı');

    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        error: 'Authentication token tapılmadı'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return Response.json({
        success: false,
        error: 'Etibarsız token'
      }, { status: 401 });
    }

    const { cvData, cvId, targetLanguage, sourceLanguage = 'auto', saveToDatabase = true } = await req.json();

    // Handle both cvData and cvId inputs
    let cvToTranslate = cvData;
    let originalCvRecord = null;

    if (!cvToTranslate && cvId) {
      // Fetch CV data from database
      try {
        originalCvRecord = await prisma.cV.findUnique({
          where: {
            id: cvId,
            userId: decoded.userId
          }
        });

        if (!originalCvRecord) {
          return Response.json({
            success: false,
            error: 'CV tapılmadı'
          }, { status: 404 });
        }

        cvToTranslate = originalCvRecord.cv_data;
      } catch (dbError) {
        console.error('Database error:', dbError);
        return Response.json({
          success: false,
          error: 'CV məlumatları əldə edilərkən xəta baş verdi'
        }, { status: 500 });
      }
    }

    // Validate input
    if (!cvToTranslate) {
      return Response.json({
        success: false,
        error: 'CV məlumatları tapılmadı'
      }, { status: 400 });
    }

    if (!targetLanguage) {
      return Response.json({
        success: false,
        error: 'Hədəf dil göstərilmədi'
      }, { status: 400 });
    }

    // Map frontend language codes to backend codes
    const languageMapping: { [key: string]: string } = {
      'azerbaijani': 'az',
      'english': 'en',
      'az': 'az',
      'en': 'en'
    };

    const mappedTargetLanguage = languageMapping[targetLanguage] || targetLanguage;

    if (!LANGUAGE_NAMES[mappedTargetLanguage as keyof typeof LANGUAGE_NAMES]) {
      return Response.json({
        success: false,
        error: 'Dəstəklənməyən dil seçildi'
      }, { status: 400 });
    }

    console.log(`🌐 CV tərcümə edilir: ${sourceLanguage} → ${mappedTargetLanguage}`);

    // Extract translatable content
    const translatableContent = getTranslatableFields(cvToTranslate);

    if (Object.keys(translatableContent).length === 0) {
      return Response.json({
        success: false,
        error: 'Tərcümə ediləcək məzmun tapılmadı'
      }, { status: 400 });
    }

    // Translate the content
    const translatedContent = await translateCVContent(translatableContent, mappedTargetLanguage, sourceLanguage);

    // Get default section names for target language
    const defaultSectionNames = getDefaultSectionNames(mappedTargetLanguage);

    // Merge section names - use translated ones if available, otherwise use defaults
    const finalSectionNames = {
      ...defaultSectionNames,
      ...(translatedContent.sectionNames || {}),
      // Ensure we have section names for all existing sections
      ...(cvToTranslate.sectionNames ?
          Object.keys(cvToTranslate.sectionNames).reduce((acc, key) => {
            acc[key] = translatedContent.sectionNames?.[key] || defaultSectionNames[key] || cvToTranslate.sectionNames[key];
            return acc;
          }, {} as Record<string, string>) : {})
    };

    // Merge translated content back with original CV data, preserving structure
    const translatedData = {
      ...cvToTranslate,
      ...translatedContent,
      cvLanguage: targetLanguage, // Use original frontend language code
      sectionNames: finalSectionNames, // Ensure section names are properly set
      translationMetadata: {
        sourceLanguage: sourceLanguage,
        targetLanguage: mappedTargetLanguage,
        translatedAt: new Date().toISOString(),
        translatedBy: 'Gemini AI',
        originalLanguage: cvToTranslate.cvLanguage || sourceLanguage,
        sectionsTranslated: Object.keys(translatableContent),
        totalSections: Object.keys(finalSectionNames).length
      }
    };

    console.log('✅ CV tərcümə tamamlandı');

    // Save translated data to database if requested and cvId is provided
    if (saveToDatabase && (cvId || originalCvRecord)) {
      try {
        const cvIdToUpdate = cvId || originalCvRecord?.id;

        const updatedCV = await prisma.cV.update({
          where: {
            id: cvIdToUpdate,
            userId: decoded.userId
          },
          data: {
            cv_data: translatedData,
            updatedAt: new Date(),
            // Update title to reflect translation if needed
            title: originalCvRecord?.title ?
              `${originalCvRecord.title} (${LANGUAGE_NAMES[mappedTargetLanguage as keyof typeof LANGUAGE_NAMES]})` :
              originalCvRecord?.title
          }
        });

        console.log('💾 Tərcümə edilmiş CV verilənlər bazasında saxlanıldı:', cvIdToUpdate);

        return Response.json({
          success: true,
          translatedData: translatedData,
          savedCV: updatedCV,
          saved: true,
          message: `CV uğurla ${LANGUAGE_NAMES[mappedTargetLanguage as keyof typeof LANGUAGE_NAMES]} dilinə tərcümə edildi və saxlanıldı`
        });

      } catch (saveError) {
        console.error('❌ Tərcümə edilmiş CV saxlanarkən xəta:', saveError);

        // Return translated data even if saving failed
        return Response.json({
          success: true,
          translatedData: translatedData,
          saved: false,
          saveError: 'Tərcümə edilmiş CV saxlanarkən xəta baş verdi',
          message: `CV uğurla ${LANGUAGE_NAMES[mappedTargetLanguage as keyof typeof LANGUAGE_NAMES]} dilinə tərcümə edildi, lakin saxlanmadı`
        });
      }
    }

    return Response.json({
      success: true,
      translatedData: translatedData,
      saved: false,
      message: `CV uğurla ${LANGUAGE_NAMES[mappedTargetLanguage as keyof typeof LANGUAGE_NAMES]} dilinə tərcümə edildi`
    });

  } catch (error) {
    console.error('❌ CV Tərcümə xətası:', error);

    return Response.json({
      success: false,
      error: 'CV tərcümə edilərkən xəta baş verdi',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}

// GET endpoint to retrieve supported languages
export async function GET() {
  try {
    return Response.json({
      success: true,
      data: {
        supportedLanguages: LANGUAGE_NAMES,
        defaultSourceLanguage: 'auto',
        message: 'CV tərcümə xidməti əlçatandır'
      }
    });
  } catch (error) {
    console.error('❌ Dil siyahısı xətası:', error);
    return Response.json({
      success: false,
      error: 'Dəstəklənən dillər əldə edilərkən xəta baş verdi'
    }, { status: 500 });
  }
}
