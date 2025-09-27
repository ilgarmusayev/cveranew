import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey, recordApiUsage, markApiKeyFailed, getBestApiKey } from '@/lib/api-service';
import { validateApiKeyForService, formatApiKeyDisplay } from '@/lib/api-key-validator';
import { withRateLimit } from '@/lib/rate-limiter';
import { GeminiV1Client } from '@/lib/gemini-v1-client';

// Get Gemini AI instance using API keys from database
const getGeminiAI = async () => {
  const apiKeyInfo = await getBestApiKey('gemini');
  
  if (!apiKeyInfo) {
    // Fallback to environment variables if no DB keys available
    const fallbackKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean) as string[];
    
    if (fallbackKeys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }
    
    // Validate fallback key format
    const isValidFormat = validateApiKeyForService(fallbackKeys[0], 'gemini');
    if (!isValidFormat) {
      console.error(`❌ Invalid Gemini API key format in environment: ${formatApiKeyDisplay(fallbackKeys[0])}`);
      throw new Error('Invalid Gemini API key format in environment variables');
    }
    
    console.log(`🔄 Using fallback Gemini API key from environment: ${formatApiKeyDisplay(fallbackKeys[0])}`);
    return {
      geminiAI: new GoogleGenerativeAI(fallbackKeys[0]),
      apiKeyId: null
    };
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
};

interface CVData {
  personalInfo?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    [key: string]: any;
  };
  experience?: Array<{
    position?: string;
    company?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    [key: string]: any;
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }>;
  skills?: Array<{
    name?: string;
    level?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

function generatePrompt(cvData: any, jobTitle: string, companyName: string, jobDescription: string, tone: string, length: string, coverLetterLanguage: string = 'azerbaijani'): string {
  // Language-specific settings
  const languageSettings = {
    azerbaijani: {
      lengthGuide: {
        short: '200-300 söz',
        medium: '300-500 söz',
        long: '500-700 söz'
      },
      toneGuide: {
        formal: 'rəsmi və peşəkar',
        creative: 'yaradıcı və fərdi yanaşma ilə'
      },
      language: 'Azərbaycan dili',
      instruction: 'Məktub tamamilə Azərbaycan dilində yazılsın'
    },
    english: {
      lengthGuide: {
        short: '200-300 words',
        medium: '300-500 words',
        long: '500-700 words'
      },
      toneGuide: {
        formal: 'formal and professional',
        creative: 'creative and personalized approach'
      },
      language: 'English',
      instruction: 'Write the letter entirely in English'
    },
    russian: {
      lengthGuide: {
        short: '200-300 слов',
        medium: '300-500 слов',
        long: '500-700 слов'
      },
      toneGuide: {
        formal: 'формальный и профессиональный',
        creative: 'креативный и персонализированный подход'
      },
      language: 'Русский язык',
      instruction: 'Напишите письмо полностью на русском языке'
    }
  };

  const settings = languageSettings[coverLetterLanguage as keyof typeof languageSettings] || languageSettings.azerbaijani;

  // Safely extract personal info
  const personalInfo = cvData?.personalInfo || {};
  const fullName = personalInfo?.fullName || personalInfo?.firstName || 'İstifadəçi';
  const email = personalInfo?.email || '';
  const phone = personalInfo?.phone || '';
  const location = personalInfo?.location || '';
  const summary = personalInfo?.summary || '';

  // Safely extract experience
  const experience = cvData?.experience || [];
  const experienceSection = experience.length > 0 
    ? experience.map((exp: any) => `
- ${exp?.position || 'Vəzifə'} (${exp?.company || 'Şirkət'})
  ${exp?.description || ''}
  ${exp?.startDate || ''} - ${exp?.endDate || exp?.current ? 'hazırda' : ''}
`).join('\n')
    : 'İş təcrübəsi məlumatı yoxdur';

  // Safely extract education
  const education = cvData?.education || [];
  const educationSection = education.length > 0
    ? education.map((edu: any) => `
- ${edu?.degree || 'Təhsil'} ${edu?.field ? `(${edu.field})` : ''} - ${edu?.institution || 'Müəssisə'}
  ${edu?.startDate || ''} - ${edu?.endDate || 'hazırda'}
`).join('\n')
    : 'Təhsil məlumatı yoxdur';

  // Safely extract skills
  const skills = cvData?.skills || [];
  const skillsSection = skills.length > 0
    ? skills.map((skill: any) => `- ${skill?.name || 'Bacarıq'}${skill?.level ? ` (${skill.level})` : ''}`).join('\n')
    : 'Bacarıq məlumatı yoxdur';

  return `
Sən professional karyera məsləhətçisi kimi çıxış edirsən və cover letter yaratmalısan.

İSTİFADƏÇİ MƏLUMATLARI:
Ad: ${fullName}
Email: ${email}
Telefon: ${phone}
${location ? `Ünvan: ${location}` : ''}
${summary ? `Özet: ${summary}` : ''}

İŞ TƏCRÜBƏSİ:
${experienceSection}

TƏHSİL:
${educationSection}

BACARIQLAR:
${skillsSection}

VAKANSİYA MƏLUMATLARI:
Vəzifə: ${jobTitle}
Şirkət: ${companyName}
Vakansiya təsviri: ${jobDescription}

TÖN: ${settings.toneGuide[tone as keyof typeof settings.toneGuide]} 
UZUNLUQ: ${settings.lengthGuide[length as keyof typeof settings.lengthGuide]}
DİL: ${settings.language}

COVER LETTER YARATMA TƏLİMATLARI:
1. YALNIZ hazır cover letter mətnini ver, başqa heç bir şey yazma
2. Heç bir format işarəsi istifadə etmə (*, -, [Tarix], *** və s.)
3. ${settings.instruction}
4. Struktur: Giriş, əsas hissə və yekun hissələrini natural şəkildə birləşdir
5. ${settings.toneGuide[tone as keyof typeof settings.toneGuide]} tərzində yaz
6. ${settings.lengthGuide[length as keyof typeof settings.lengthGuide]} həcmində olsun
7. CV-dəki təcrübə və bacarıqlardan vakansiyaya uyğun olanları vurğula
8. Motivasiya və əməkdaşlığa hazır olduğunu bildir

NƏTICƏ: Yalnız hazır cover letter mətnini ver, heç bir əlavə izah və ya format işarəsi olmadan.
`;
}

async function handlePOST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decoded.userId;

    const body = await request.json();
    const { cvId, jobTitle, jobDescription, companyName, tone = 'formal', length = 'medium', coverLetterLanguage = 'azerbaijani' } = body;

    if (!cvId || !jobTitle || !jobDescription || !companyName) {
      return NextResponse.json({ 
        error: 'Bütün sahələr tələb olunur' 
      }, { status: 400 });
    }

    // Get CV data from database using Prisma
    const cv = await prisma.cV.findFirst({
      where: {
        id: cvId,
        userId: userId
      }
    });
    
    if (!cv) {
      return NextResponse.json({ 
        error: 'CV tapılmadı' 
      }, { status: 404 });
    }

    const cvData = cv.cv_data as any;
    
    // Validate CV data structure
    if (!cvData || !cvData.personalInfo) {
      return NextResponse.json({ 
        error: 'CV məlumatları tapılmadı və ya düzgün formatda deyil' 
      }, { status: 400 });
    }

    // Generate cover letter using Gemini AI
    let coverLetter = '';
    let lastError: Error | null = null;

    try {
      const apiKeyInfo = await getBestApiKey('gemini');
      const apiKey = apiKeyInfo?.apiKey;
      const apiKeyId = apiKeyInfo?.id;
      
      if (!apiKey) {
        throw new Error('No valid API key available');
      }
      
      const prompt = generatePrompt(cvData, jobTitle, companyName, jobDescription, tone, length, coverLetterLanguage);
      
      // Use v1 API with gemini-2.5-flash model (sərfəli və sürətli)
      const geminiV1 = new GeminiV1Client(apiKey);
      coverLetter = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'Cover letter generated (v1 gemini-2.5-flash)');
      }
      
      console.log(`✅ Cover letter generated successfully with v1 API`);
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Gemini v1 API failed:`, error.message);
      
      // Fallback to v1 API with gemini-2.0-flash
      try {
        console.log('🔄 Trying fallback to gemini-2.0-flash...');
        const apiKeyInfo = await getBestApiKey('gemini');
        const apiKey = apiKeyInfo?.apiKey;
        const apiKeyId = apiKeyInfo?.id;
        
        if (apiKey) {
          const prompt = generatePrompt(cvData, jobTitle, companyName, jobDescription, tone, length, coverLetterLanguage);
          const geminiV1Fallback = new GeminiV1Client(apiKey);
          coverLetter = await geminiV1Fallback.generateContent('gemini-2.0-flash', prompt);
          
          // Record successful API usage
          if (apiKeyId) {
            await recordApiUsage(apiKeyId, true, 'Cover letter generated (v1 gemini-2.0-flash fallback)');
          }
          
          console.log(`✅ Cover letter generated with fallback gemini-2.0-flash`);
        }
      } catch (fallbackError: any) {
        console.log(`❌ All Gemini v1 attempts failed:`, fallbackError.message);
        
        // Record API failure
        try {
          const apiKeyInfo = await getBestApiKey('gemini');
          if (apiKeyInfo?.id) {
            await markApiKeyFailed(apiKeyInfo.id, fallbackError.message);
          }
        } catch (e) {
          console.error('Error recording API failure:', e);
        }
        
        lastError = fallbackError;
      }
    }

    if (!coverLetter) {
      return NextResponse.json({ 
        error: `Cover letter yaradıla bilmədi${lastError ? ': ' + lastError.message : ''}` 
      }, { status: 500 });
    }

   

    return NextResponse.json({
      success: true,
      coverLetter: coverLetter.trim()
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json({ 
      error: 'Sistem xətası baş verdi' 
    }, { status: 500 });
  }
}

// Rate limited POST export
export const POST = withRateLimit(handlePOST, 'coverLetterGeneration');