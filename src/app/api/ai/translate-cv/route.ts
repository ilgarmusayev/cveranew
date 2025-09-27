import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';
import { validateApiKeyForService, formatApiKeyDisplay } from '@/lib/api-key-validator';
import { MONTH_NAMES } from '@/lib/cvLanguage';
import { GeminiV1Client } from '@/lib/gemini-v1-client';

// Get Gemini AI instance using API keys from database
const getGeminiAI = async () => {
  try {
    console.log('🔍 Attempting to get Gemini API key from database...');
    const apiKeyInfo = await getBestApiKey('gemini');
    
    if (!apiKeyInfo) {
      console.log('⚠️ No database API keys found, falling back to environment variables...');
      // Fallback to environment variables if no DB keys available
      const fallbackKeys = [
        process.env.GEMINI_API_KEY,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
      ].filter(Boolean) as string[];
      
      if (fallbackKeys.length === 0) {
        throw new Error('No Gemini API keys configured in database or environment');
      }
      
      // Try each fallback key
      for (const key of fallbackKeys) {
        const isValidFormat = validateApiKeyForService(key, 'gemini');
        if (isValidFormat) {
          console.log(`🔄 Using fallback Gemini API key from environment: ${formatApiKeyDisplay(key)}`);
          return {
            geminiAI: new GoogleGenerativeAI(key),
            apiKeyId: null
          };
        } else {
          console.error(`❌ Invalid Gemini API key format in environment: ${formatApiKeyDisplay(key)}`);
        }
      }
      
      throw new Error('All environment API keys have invalid format');
    }
    
    // Validate database API key format
    const isValidFormat = validateApiKeyForService(apiKeyInfo.apiKey, 'gemini');
    if (!isValidFormat) {
      console.error(`❌ Invalid Gemini API key format in database: ${formatApiKeyDisplay(apiKeyInfo.apiKey)}`);
      throw new Error('Invalid Gemini API key format in database');
    }
    
    console.log(`✅ Using valid Gemini API key from database (ID: ${apiKeyInfo.id}): ${formatApiKeyDisplay(apiKeyInfo.apiKey)}`);
    return {
      geminiAI: new GoogleGenerativeAI(apiKeyInfo.apiKey),
      apiKeyId: apiKeyInfo.id
    };
  } catch (error) {
    console.error('❌ Error getting Gemini AI instance:', error);
    throw error;
  }
};

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
  
  // Enhanced URL patterns to detect ALL types of links
  const urlPatterns = [
    // Full URLs with protocols
    /https?:\/\/[^\s<>"{}|\\^`[\]\u00A0-\u9999\uF900-\uFDCF\uFDF0-\uFFEF]+/gi,
    // GitHub patterns specifically
    /github\.com\/[a-zA-Z0-9\-_.\/]+/gi,
    // LinkedIn patterns
    /linkedin\.com\/[a-zA-Z0-9\-_.\/]+/gi,
    // Common domain patterns
    /(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9\-_.]*\.[a-zA-Z]{2,}(?:\/[^\s<>"{}|\\^`[\]\u00A0-\u9999\uF900-\uFDCF\uFDF0-\uFFEF]*)?/gi,
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    // Domain.com patterns without www
    /[a-zA-Z0-9][a-zA-Z0-9\-_.]*\.(?:com|net|org|edu|gov|io|dev|co|me|tech|app|ly|be|to|tv|ai)/gi
  ];
  
  function replaceLinkInText(text: string): string {
    if (typeof text !== 'string') return text;
    
    let modifiedText = text;
    
    urlPatterns.forEach(pattern => {
      modifiedText = modifiedText.replace(pattern, (match) => {
        // Skip if already replaced
        if (match.includes('__LINK_PLACEHOLDER_')) {
          return match;
        }
        
        const placeholder = `__LINK_PLACEHOLDER_${linkCounter}__`;
        linkMap.set(placeholder, match);
        linkCounter++;
        console.log(`🔗 Protected link: ${match} → ${placeholder}`);
        return placeholder;
      });
    });
    
    return modifiedText;
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
    
    let restoredText = text;
    let restoredCount = 0;
    
    linkMap.forEach((originalLink, placeholder) => {
      if (restoredText.includes(placeholder)) {
        restoredText = restoredText.replace(new RegExp(placeholder, 'g'), originalLink);
        restoredCount++;
        console.log(`🔄 Restored link: ${placeholder} → ${originalLink}`);
      }
    });
    
    return restoredText;
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

// Function to translate dates according to target language
function translateDates(content: any, targetLanguage: string): any {
  if (!content || !MONTH_NAMES[targetLanguage as keyof typeof MONTH_NAMES]) {
    return content;
  }

  const monthNames = MONTH_NAMES[targetLanguage as keyof typeof MONTH_NAMES];
  const englishMonths = MONTH_NAMES.english;
  const azMonths = MONTH_NAMES.azerbaijani;
  
  function translateDateInString(text: string): string {
    if (!text || typeof text !== 'string') return text;
    
    let translatedText = text;
    
    // Replace English month names with target language
    englishMonths.forEach((englishMonth, index) => {
      const regex = new RegExp(`\\b${englishMonth}\\b`, 'gi');
      translatedText = translatedText.replace(regex, monthNames[index]);
    });
    
    // Replace Azerbaijani month names with target language
    azMonths.forEach((azMonth, index) => {
      const regex = new RegExp(`\\b${azMonth}\\b`, 'gi');
      translatedText = translatedText.replace(regex, monthNames[index]);
    });
    
    return translatedText;
  }
  
  function recursivelyTranslateDates(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => recursivelyTranslateDates(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this field likely contains dates
        if (key.toLowerCase().includes('date') || 
            key.toLowerCase().includes('duration') ||
            key.toLowerCase().includes('period') ||
            key === 'startDate' || 
            key === 'endDate') {
          newObj[key] = translateDateInString(value as string);
        } else {
          newObj[key] = recursivelyTranslateDates(value);
        }
      }
      return newObj;
    } else if (typeof obj === 'string') {
      return translateDateInString(obj);
    }
    return obj;
  }
  
  return recursivelyTranslateDates(content);
}

// Function to translate CV sections with retry logic
async function translateCVContent(content: any, targetLanguage: string, sourceLanguage: string = 'auto', retryCount: number = 0) {
  const maxRetries = 2;
  let apiKey, apiKeyId;
  
  try {
    const apiKeyInfo = await getBestApiKey('gemini');
    apiKey = apiKeyInfo?.apiKey;
    apiKeyId = apiKeyInfo?.id;
    
    if (!apiKey) {
      throw new Error('No valid API key available');
    }
  } catch (error) {
    console.error('❌ Failed to get Gemini API key:', error);
    throw new Error('AI xidmətinə qoşulmaq mümkün olmadı');
  }
  const targetLangName = LANGUAGE_NAMES[targetLanguage as keyof typeof LANGUAGE_NAMES] || targetLanguage;
  const sourceLangName = sourceLanguage === 'auto' ? 'mətndə olan dil' : LANGUAGE_NAMES[sourceLanguage as keyof typeof LANGUAGE_NAMES];

  const prompt = `
Siz peşəkar CV tərcümə mütəxəssisiniz. Aşağıdakı CV məzmununu ${sourceLangName} dilindən ${targetLangName} dilinə tam və dəqiq tərcümə edin.

🔥 MÜTLƏQ QAYDALAR:
1. 📧 Email, telefon nömrəsi, URL-lər olduğu kimi saxla
2. 📅 Tarixlər (dates) olduğu kimi saxla - dəyişmə! 
3. 🔗 PLACEHOLDER QORUMA: __LINK_PLACEHOLDER_X__ formatındakı bütün placeholder-ləri DƏQIQ olduğu kimi saxla:
   - __LINK_PLACEHOLDER_0__, __LINK_PLACEHOLDER_1__ və s.
   - Bu placeholder-lər link-ləri təmsil edir - HEÇBIR dəyişiklik etmə!
   - Placeholder-ləri tərcümə etmə, silmə və ya dəyişmə!
4. 🔗 MÜTLƏQ: Bütün linkləri və URL-ləri olduğu kimi saxla:
   - https://... başlayan bütün linklər
   - http://... başlayan bütün linklər  
   - www... başlayan linklər
   - github.com, linkedin.com, behance.net və s. linklər
   - domain.com formatında domainlər
   - HEÇBIR URL/LİNKİ TƏRCÜMə ETMə!
5. 🎯 MÜTLƏQ: "sectionNames" bölməsindəki BÜTÜN dəyərləri tərcümə edin
6. 💼 MÜTLƏQ: Skills hissəsində "category" və ya "type" olan skillsləri olduğu kimi AYRI saxla:
   - Soft skills → ayrı qrup (məs: category: "soft" və ya type: "soft")
   - Hard skills → ayrı qrup (məs: category: "hard", "technical", "programming" və ya type: "hard")
   - Skills-in strukturunu və category/type-ını heç vaxt qarışdırma!
7. 📋 JSON strukturunu dəqiq saxlayın - heç bir field silinməsin
8. 🔒 Boş/null dəyərləri olduğu kimi saxlayın

🚫 LİNK QORUMA MİSALLARI:
✅ DOĞRU: "https://github.com/user/project" → "https://github.com/user/project"  
✅ DOĞRU: "www.example.com" → "www.example.com"
✅ DOĞRU: "https://portfolio.com" → "https://portfolio.com"
✅ DOĞRU: "__LINK_PLACEHOLDER_0__" → "__LINK_PLACEHOLDER_0__" (dəqiq olduğu kimi!)
✅ DOĞRU: "__LINK_PLACEHOLDER_15__" → "__LINK_PLACEHOLDER_15__" (dəqiq olduğu kimi!)
❌ SƏHV: "https://github.com" ni tərcümə etmə!
❌ SƏHV: URL-lərin heç bir hissəsini dəyişmə!
❌ SƏHV: Placeholder-ləri dəyişmə və ya silmə!

🔗 PLACEHOLDER NÜMUNƏ:
INPUT: "Portfolio saytım __LINK_PLACEHOLDER_5__ da mövcuddur"
OUTPUT: "My portfolio website is available at __LINK_PLACEHOLDER_5__" (placeholder dəqiq saxlanır!)

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

🔥 JSON FORMAT QAYDALARı:
- YALNIZ valid JSON qaytarın, heç başqa mətn yox
- JSON-da string-lər düzgün quote edilməli (double quotes)
- Trailing comma-lar qadağandır
- Proper escaping istifadə edin (\", \\, \/, \n və s.)
- JSON açıq və bağlı mötərizələrlə başlayıb bitməlidir
- Multiline string-lər üçün \n istifadə edin

🎯 YALNIZ bu formatda cavab verin:
{
  "key": "value",
  "array": ["item1", "item2"]
}

CAVAB YALNIZ JSON OLMALIDIR - BAŞQA HEÇ NƏ YAZMAYIN!`;

  // Extract and protect all links before translation
  const { content: protectedContent, linkMap } = extractAndProtectLinks(content);
  
  console.log('🔗 Link protection summary:');
  console.log(`   - Total links found: ${linkMap.size}`);
  linkMap.forEach((link, placeholder) => {
    console.log(`   - ${placeholder}: ${link}`);
  });
  
  // Add protected content to prompt
  const fullPrompt = prompt + `\n\nINPUT JSON:\n${JSON.stringify(protectedContent, null, 2)}`;

  let translatedText = '';

  try {
    // Use v1 API with gemini-2.5-flash model (sərfəli və sürətli)
    const geminiV1 = new GeminiV1Client(apiKey);
    translatedText = await geminiV1.generateContent('gemini-2.5-flash', fullPrompt);
    
    // Record successful API usage
    if (apiKeyId) {
      await recordApiUsage(apiKeyId, true, 'CV translation generated (v1 gemini-2.5-flash)');
    }
    
    console.log('✅ CV translation generated successfully with v1 API');
  } catch (error: any) {
    console.log(`❌ Gemini v1 API failed:`, error.message);
    
    // Fallback to v1 API with gemini-2.0-flash
    try {
      console.log('🔄 Trying fallback to gemini-2.0-flash...');
      const geminiV1Fallback = new GeminiV1Client(apiKey);
      translatedText = await geminiV1Fallback.generateContent('gemini-2.0-flash', fullPrompt);
      
      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'CV translation generated (v1 gemini-2.0-flash fallback)');
      }
      
      console.log('✅ CV translation generated with fallback gemini-2.0-flash');
    } catch (fallbackError: any) {
      console.log(`❌ All Gemini v1 attempts failed:`, fallbackError.message);
      
      // Record API failure
      if (apiKeyId) {
        await markApiKeyFailed(apiKeyId, fallbackError.message);
      }
      
      throw fallbackError; // Re-throw the final error
    }
  }

  try {
    console.log('🔍 Raw AI Response length:', translatedText.length);
    console.log('🔍 AI Response preview:', translatedText.substring(0, 500));

    // Clean the response and parse JSON
    let cleanedResponse = translatedText.replace(/```json\s*|\s*```/g, '').trim();
    
    // Remove any extra text before the first { or after the last }
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    } else {
      console.error('❌ No valid JSON found in AI response');
      throw new Error('AI response does not contain valid JSON');
    }
    
    // Additional JSON cleaning
    cleanedResponse = cleanedResponse
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim();
    
    console.log('🔍 Cleaned JSON preview:', cleanedResponse.substring(0, 300));
    
    const translatedContent = JSON.parse(cleanedResponse);
    
    // Validate that placeholders are preserved in translation
    const translatedString = JSON.stringify(translatedContent);
    const missingPlaceholders: string[] = [];
    linkMap.forEach((_, placeholder) => {
      if (!translatedString.includes(placeholder)) {
        missingPlaceholders.push(placeholder);
      }
    });
    
    if (missingPlaceholders.length > 0) {
      console.warn('⚠️ WARNING: Some placeholders missing in translation:', missingPlaceholders);
    }
    
    // Restore all protected links
    const finalContent = restoreLinks(translatedContent, linkMap);
    
    // Record successful API usage
    if (apiKeyId) {
      await recordApiUsage(apiKeyId, true, 'CV translation completed successfully');
    }
    
    console.log('✅ Link protection applied successfully:', linkMap.size, 'links protected');
    return finalContent;
  } catch (error) {
    console.error('Translation error:', error);
    
    let errorMessage = 'Unknown error';
    let userFriendlyMessage = 'Tərcümə zamanı xəta baş verdi';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle specific error types
      if (error.message.includes('404') && error.message.includes('model')) {
        userFriendlyMessage = 'AI modeli əlçatan deyil. Daha sonra yenidən cəhd edin.';
        console.error('❌ Model not found error - API key might be invalid or model version not supported');
      } else if (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('Unterminated')) {
        userFriendlyMessage = 'AI cavabında format xətası. Yenidən cəhd edilir...';
        console.error('❌ JSON parse error - AI response malformed:', translatedText.substring(0, 200));
      } else if (error.message.includes('API key')) {
        userFriendlyMessage = 'API açarı problemi. Yenidən cəhd edilir...';
        console.error('❌ API key error detected');
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        userFriendlyMessage = 'API limitə çatdı. Bir az gözləyin və yenidən cəhd edin.';
        console.error('❌ API quota/limit exceeded');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        userFriendlyMessage = 'Şəbəkə problemi. İnternet bağlantınızı yoxlayın.';
        console.error('❌ Network error detected');
      }
    }
    
    // Record failed API usage
    if (apiKeyId) {
      await recordApiUsage(apiKeyId, false, `Translation failed: ${errorMessage}`);
      
      // Mark API key as failed only for certain error types
      if (errorMessage.includes('404') || errorMessage.includes('401') || errorMessage.includes('403')) {
        await markApiKeyFailed(apiKeyId, `API key error: ${errorMessage}`);
        console.log(`🚫 API key ${apiKeyId} marked as failed due to: ${errorMessage}`);
      }
    }
    
    // Retry logic for certain errors
    if (retryCount < maxRetries) {
      const shouldRetry = errorMessage.includes('404') || 
                         errorMessage.includes('API key') || 
                         errorMessage.includes('network') ||
                         errorMessage.includes('fetch') ||
                         errorMessage.includes('timeout') ||
                         errorMessage.includes('JSON') ||
                         errorMessage.includes('parse') ||
                         errorMessage.includes('Unterminated');
      
      if (shouldRetry) {
        console.log(`🔄 Retrying translation (attempt ${retryCount + 1}/${maxRetries}) due to: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000)); // Progressive delay
        return translateCVContent(content, targetLanguage, sourceLanguage, retryCount + 1);
      }
    }
    
    throw new Error(userFriendlyMessage);
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
    },
    'ru': {
      personalInfo: 'Личная информация',
      summary: 'Профессиональное резюме',
      professionalSummary: 'Профессиональное резюме',
      experience: 'Опыт работы',
      professionalExperience: 'Профессиональный опыт',
      education: 'Образование',
      skills: 'Навыки',
      technicalSkills: 'Технические навыки',
      softSkills: 'Личные навыки',
      coreCompetencies: 'Основные компетенции',
      languages: 'Языки',
      projects: 'Проекты',
      keyProjects: 'Ключевые проекты',
      certifications: 'Сертификаты',
      volunteerExperience: 'Волонтерский опыт',
      volunteerWork: 'Волонтерская работа',
      publications: 'Публикации',
      honorsAwards: 'Награды и достижения',
      testScores: 'Результаты тестов',
      recommendations: 'Рекомендации',
      courses: 'Курсы',
      customSections: 'Дополнительные разделы'
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
      'russian': 'ru',
      'az': 'az',
      'en': 'en',
      'ru': 'ru'
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

    // Translate dates in the translated content
    const contentWithTranslatedDates = translateDates(translatedContent, mappedTargetLanguage);
    console.log('📅 Dates translated for target language:', mappedTargetLanguage);

    // Get default section names for target language
    const defaultSectionNames = getDefaultSectionNames(mappedTargetLanguage);

    console.log('🏷️ Default section names for target language:', defaultSectionNames);
    console.log('🔄 Translated section names from AI:', contentWithTranslatedDates.sectionNames);

    // FORCE section names translation - use AI translated names or defaults
    const finalSectionNames = {
      ...defaultSectionNames, // Start with defaults for target language
      ...(contentWithTranslatedDates.sectionNames || {}) // Override with AI translated names
    };

    console.log('✅ Final section names:', finalSectionNames);

    // Merge translated content back with original CV data, preserving structure
    const translatedData = {
      ...cvToTranslate,
      ...contentWithTranslatedDates,
      // CRITICAL: Preserve original personal info and merge only translated fields
      personalInfo: {
        ...cvToTranslate.personalInfo, // Keep ALL original personal info (names, contact, etc.)
        ...(contentWithTranslatedDates.personalInfo || {}) // Add only translated fields (summary, title, etc.)
      },
      cvLanguage: targetLanguage === 'russian' ? 'russian' : targetLanguage, // Use original frontend language code
      sectionNames: finalSectionNames, // Ensure section names are properly set
      translationMetadata: {
        sourceLanguage: sourceLanguage,
        targetLanguage: mappedTargetLanguage, // Backend language code (ru)
        frontendTargetLanguage: targetLanguage, // Frontend language code (russian)
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
