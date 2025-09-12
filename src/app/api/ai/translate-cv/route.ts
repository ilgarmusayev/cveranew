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

// Link protection functions
function extractAndProtectLinks(content: any): { content: any, linkMap: Map<string, string> } {
  const linkMap = new Map<string, string>();
  let linkCounter = 0;
  
  // URL patterns to detect links
  const urlPatterns = [
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
    /www\.[^\s<>"{}|\\^`[\]]+/gi,
    /[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]]*)?/gi
  ];
  
  function replaceLinkInText(text: string): string {
    if (typeof text !== 'string') return text;
    
    urlPatterns.forEach(pattern => {
      text = text.replace(pattern, (match) => {
        const placeholder = `__LINK_PLACEHOLDER_${linkCounter}__`;
        linkMap.set(placeholder, match);
        linkCounter++;
        return placeholder;
      });
    });
    
    return text;
  }
  
  function recursivelyProtectLinks(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => recursivelyProtectLinks(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = recursivelyProtectLinks(value);
      }
      return newObj;
    } else if (typeof obj === 'string') {
      return replaceLinkInText(obj);
    }
    return obj;
  }
  
  return {
    content: recursivelyProtectLinks(content),
    linkMap
  };
}

function restoreLinks(content: any, linkMap: Map<string, string>): any {
  function restoreLinkInText(text: string): string {
    if (typeof text !== 'string') return text;
    
    linkMap.forEach((originalLink, placeholder) => {
      text = text.replace(new RegExp(placeholder, 'g'), originalLink);
    });
    
    return text;
  }
  
  function recursivelyRestoreLinks(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => recursivelyRestoreLinks(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        newObj[key] = recursivelyRestoreLinks(value);
      }
      return newObj;
    } else if (typeof obj === 'string') {
      return restoreLinkInText(obj);
    }
    return obj;
  }
  
  return recursivelyRestoreLinks(content);
}

// Function to translate CV sections
async function translateCVContent(content: any, targetLanguage: string, sourceLanguage: string = 'auto') {
  const geminiAI = initializeGeminiAI();
  const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const targetLangName = LANGUAGE_NAMES[targetLanguage as keyof typeof LANGUAGE_NAMES] || targetLanguage;
  const sourceLangName = sourceLanguage === 'auto' ? 'mətndə olan dil' : LANGUAGE_NAMES[sourceLanguage as keyof typeof LANGUAGE_NAMES];

  const prompt = `
Siz peşəkar CV tərcümə mütəxəssisiniz. Aşağıdakı CV məzmununu ${sourceLangName} dilindən ${targetLangName} dilinə tam və dəqiq tərcümə edin.

🔥 MÜTLƏQ QAYDALAR:
1. 📧 Email, telefon nömrəsi, URL-lər olduğu kimi saxla
2. 📅 Tarixlər (dates) olduğu kimi saxla - dəyişmə! 
3. 🔗 MÜTLƏQ: Bütün linkləri (URLs) olduğu kimi saxla:
   - https://... başlayan bütün linklər
   - http://... başlayan bütün linklər  
   - www... başlayan linklər
   - github.com, linkedin.com, behance.net və s. linklər
   - HEÇBIR URL/LİNKİ TƏRCÜMə ETMə!
4. 🎯 MÜTLƏQ: "sectionNames" bölməsindəki BÜTÜN dəyərləri tərcümə edin
5. 💼 MÜTLƏQ: Skills hissəsində "category" və ya "type" olan skillsləri olduğu kimi AYRI saxla:
   - Soft skills → ayrı qrup (məs: category: "soft" və ya type: "soft")
   - Hard skills → ayrı qrup (məs: category: "hard", "technical", "programming" və ya type: "hard")
   - Skills-in strukturunu və category/type-ını heç vaxt qarışdırma!
6. 📋 JSON strukturunu dəqiq saxlayın - heç bir field silinməsin
7. 🔒 Boş/null dəyərləri olduğu kimi saxlayın

🚫 LİNK QORUMA MİSALLARI:
✅ DOĞRU: "https://github.com/user/project" → "https://github.com/user/project"
✅ DOĞRU: "www.example.com" → "www.example.com"
✅ DOĞRU: "https://portfolio.com" → "https://portfolio.com"
❌ SƏHV: "https://github.com" ni tərcümə etmə!
❌ SƏHV: URL-lərin heç bir hissəsini dəyişmə!

${targetLanguage === 'az' ? `
� Azərbaycan Tərcümə Qaydaları:
"personalInfo" → "Şəxsi Məlumatlar"
"summary" → "Peşəkar Xülasə"
"professionalSummary" → "Peşəkar Xülasə"
"experience" → "İş Təcrübəsi"  
"professionalExperience" → "Peşəkar Təcrübə"
"education" → "Təhsil"
"skills" → "Bacarıqlar"
"technicalSkills" → "Texniki Bacarıqlar"
"softSkills" → "Şəxsi Bacarıqlar"
"coreCompetencies" → "Əsas Bacarıqlar"
"projects" → "Layihələr"
"keyProjects" → "Əsas Layihələr"
"languages" → "Dillər"
"certifications" → "Sertifikatlar"
"volunteerExperience" → "Könüllü Təcrübə"
"volunteerWork" → "Könüllü İş"
"publications" → "Nəşrlər"
"honorsAwards" → "Mükafatlar və Fəxri Adlar"
` : `
� English Translation Rules:
"personalInfo" → "Personal Information"
"summary" → "Professional Summary"
"professionalSummary" → "Professional Summary"
"experience" → "Work Experience"
"professionalExperience" → "Professional Experience"
"education" → "Education"
"skills" → "Skills"
"technicalSkills" → "Technical Skills"
"softSkills" → "Soft Skills"
"coreCompetencies" → "Core Competencies"
"projects" → "Projects"
"keyProjects" → "Key Projects"
"languages" → "Languages"
"certifications" → "Certifications"
"volunteerExperience" → "Volunteer Experience"
"volunteerWork" → "Volunteer Work"
"publications" → "Publications"
"honorsAwards" → "Honors & Awards"
`}

💡 NÜMUNƏ:
Əgər "Software Engineer" varsa → ${targetLanguage === 'az' ? '"Proqram Təminatı Mühəndisi"' : '"Software Engineer"'}
Əgər "University of Technology" varsa → olduğu kimi saxla
Əgər "john@email.com" varsa → olduğu kimi saxla

🎯 SKILLS NÜMUNƏ (MÜTLƏQ bu formata uyğun):
${targetLanguage === 'az' ? `
📋 Azərbaycan dilində skill nümunələri:
Hard Skills: "JavaScript", "Python", "React", "Node.js", "SQL", "AWS", "Docker"
Soft Skills: "Komanda ilə işləmə", "Liderlik", "Kommunikasiya", "Problem həll etmə", "Vaxt idarəetməsi", "Kreativlik"
` : `
📋 English skill examples:
Hard Skills: "JavaScript", "Python", "React", "Node.js", "SQL", "AWS", "Docker"  
Soft Skills: "Team Collaboration", "Leadership", "Communication", "Problem Solving", "Time Management", "Creativity"
`}

INPUT: [
  {name: "JavaScript", category: "technical"},
  {name: "Communication", type: "soft"}
]
OUTPUT: [
  {name: ${targetLanguage === 'az' ? '"JavaScript"' : '"JavaScript"'}, category: "technical"},
  {name: ${targetLanguage === 'az' ? '"Kommunikasiya"' : '"Communication"'}, type: "soft"}
]

⚠️ ÇOX ÖNƏMLİ: Cavabınızda "sectionNames" obyektini MÜTLƏQ daxil edin!
⚠️ SKILLS XƏBƏRDARLıĞı: Skills array-də hər skill-in category/type-ini (soft/hard/technical) heç vaxt dəyişmə və qarışdırma!
🚫 ÖNƏMLİ: Mövcud olmayan yeni skill-lər əlavə etmə - YALNIZ mövcud skill-ləri tərcümə et!
🎯 YALNIZ tərcümə edilmiş JSON qaytarın, başqa heç nə yazmayın:`;

  // Extract and protect all links before translation
  const { content: protectedContent, linkMap } = extractAndProtectLinks(content);
  
  // Add protected content to prompt
  const fullPrompt = prompt + `\n\nINPUT JSON:\n${JSON.stringify(protectedContent, null, 2)}`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    // Clean the response and parse JSON
    const cleanedResponse = translatedText.replace(/```json\s*|\s*```/g, '').trim();
    const translatedContent = JSON.parse(cleanedResponse);
    
    // Restore all protected links
    const finalContent = restoreLinks(translatedContent, linkMap);
    
    console.log('✅ Link protection applied successfully:', linkMap.size, 'links protected');
    return finalContent;
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
      professionalSummary: 'Peşəkar Xülasə',
      experience: 'İş Təcrübəsi',
      professionalExperience: 'Peşəkar Təcrübə',
      education: 'Təhsil',
      skills: 'Bacarıqlar',
      technicalSkills: 'Texniki Bacarıqlar',
      softSkills: 'Şəxsi Bacarıqlar',
      coreCompetencies: 'Əsas Bacarıqlar',
      languages: 'Dillər',
      projects: 'Layihələr',
      keyProjects: 'Əsas Layihələr',
      certifications: 'Sertifikatlar',
      volunteerExperience: 'Könüllü Təcrübə',
      volunteerWork: 'Könüllü İş',
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
      professionalSummary: 'Professional Summary',
      experience: 'Work Experience',
      professionalExperience: 'Professional Experience',
      education: 'Education',
      skills: 'Skills',
      technicalSkills: 'Technical Skills',
      softSkills: 'Soft Skills',
      coreCompetencies: 'Core Competencies',
      languages: 'Languages',
      projects: 'Projects',
      keyProjects: 'Key Projects',
      certifications: 'Certifications',
      volunteerExperience: 'Volunteer Experience',
      volunteerWork: 'Volunteer Work',
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

  // Personal info translations (including names for translation)
  if (cvData.personalInfo) {
    // Include ALL fields for translation including names
    const translatableFields: any = {};
    
    // Include ALL personal info fields including names for translation
    Object.keys(cvData.personalInfo).forEach(key => {
      // NEVER translate: contact details, images, and binary data
      const neverTranslate = [
        'email', 
        'phone', 
        'website', 
        'linkedin', 
        'github',
        'profileImage', // 🔥 CRITICAL: Profil şəkli tərcümə edilməməli (base64 data)
        'image',
        'avatar',
        'photo',
        'picture'
      ];
      
      const fieldValue = cvData.personalInfo[key];
      
      // Skip fields that shouldn't be translated
      if (neverTranslate.includes(key)) {
        return;
      }
      
      // Skip empty values
      if (!fieldValue) {
        return;
      }
      
      // Skip very large values (likely base64 images)
      if (typeof fieldValue === 'string' && fieldValue.length > 10000) {
        console.log(`⚠️ Skipping large field ${key} (${fieldValue.length} chars) - likely base64 image`);
        return;
      }
      
      // Skip data URLs (base64 images)
      if (typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
        console.log(`⚠️ Skipping data URL field ${key} - base64 image detected`);
        return;
      }
      
      translatableFields[key] = fieldValue;
    });
    
    // Only add personalInfo if we have translatable fields
    if (Object.keys(translatableFields).length > 0) {
      translatableContent.personalInfo = translatableFields;
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
        category: skill.category || skill.type, // Support both 'category' and 'type' fields
        type: skill.type // Keep original type field if it exists
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

  // Section names translations - ALWAYS include default section names for translation
  const defaultSectionNames = getDefaultSectionNames('en'); // Get English defaults as base
  
  // Enhanced section names mapping to match CVPreview expectations
  const enhancedSectionNames = {
    ...defaultSectionNames,
    // Add CVPreview specific keys
    professionalSummary: 'Professional Summary',
    professionalExperience: 'Professional Experience', 
    technicalSkills: 'Technical Skills',
    softSkills: 'Soft Skills',
    coreCompetencies: 'Core Competencies',
    keyProjects: 'Key Projects',
    volunteerWork: 'Volunteer Work',
    // Override with custom section names if available
    ...(cvData.sectionNames || {})
  };

  translatableContent.sectionNames = enhancedSectionNames;

  console.log('📝 Section names for translation:', translatableContent.sectionNames);
  console.log('🔍 Translatable fields extracted:', {
    personalInfo: translatableContent.personalInfo ? Object.keys(translatableContent.personalInfo) : 'none',
    experience: translatableContent.experience ? `${translatableContent.experience.length} items` : 'none',
    education: translatableContent.education ? `${translatableContent.education.length} items` : 'none',
    skills: translatableContent.skills ? `${translatableContent.skills.length} items` : 'none',
    projects: translatableContent.projects ? `${translatableContent.projects.length} items` : 'none',
    certifications: translatableContent.certifications ? `${translatableContent.certifications.length} items` : 'none',
    totalFields: Object.keys(translatableContent).length
  });

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
    console.log('🚀 Starting translation with content keys:', Object.keys(translatableContent));
    
    // Check content size before sending to AI
    const contentString = JSON.stringify(translatableContent);
    const contentSize = new Blob([contentString]).size; // Get accurate byte size
    console.log(`📊 Content size for AI: ${contentSize} bytes (${(contentSize / 1024).toFixed(2)} KB)`);
    
    if (contentSize > 500000) { // 500KB limit
      console.warn(`⚠️ Large content detected: ${(contentSize / 1024).toFixed(2)} KB - this may cause API issues`);
    }
    
    const translatedContent = await translateCVContent(translatableContent, mappedTargetLanguage, sourceLanguage);
    console.log('🎯 Translation completed with keys:', Object.keys(translatedContent || {}));

    // Get default section names for target language
    const defaultSectionNames = getDefaultSectionNames(mappedTargetLanguage);

    console.log('🏷️ Default section names for target language:', defaultSectionNames);
    console.log('🔄 Translated section names from AI:', translatedContent.sectionNames);

    // FORCE section names translation - use AI translated names or defaults
    const finalSectionNames = {
      ...defaultSectionNames, // Start with defaults for target language
      ...(translatedContent.sectionNames || {}) // Override with AI translated names
    };

    console.log('✅ Final section names:', finalSectionNames);

    // Merge translated content back with original CV data, preserving structure
    const translatedData = {
      ...cvToTranslate,
      ...translatedContent,
      // CRITICAL: Preserve original personal info and merge only translated fields
      personalInfo: {
        ...cvToTranslate.personalInfo, // Keep ALL original personal info (names, contact, etc.)
        ...(translatedContent.personalInfo || {}) // Add only translated fields (summary, title, etc.)
      },
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
