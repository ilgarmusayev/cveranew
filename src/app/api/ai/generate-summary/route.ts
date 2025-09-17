import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { getGeminiApiKey, recordApiUsage, markApiKeyFailed, getBestApiKey } from '@/lib/api-service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Get user ID from JWT token
function getUserIdFromRequest(req: NextRequest): string | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Check if user can use AI features (not Free tier)
function canUseAIFeatures(userTier: string): boolean {
  const tier = userTier.toLowerCase();
  return tier !== 'free' && tier !== 'pulsuz';
}


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
    
    console.log('🔄 Using fallback Gemini API key from environment');
    return {
      geminiAI: new GoogleGenerativeAI(fallbackKeys[0]),
      apiKeyId: null
    };
  }
  
  console.log(`� Using Gemini API key from database (ID: ${apiKeyInfo.id})`);
  return {
    geminiAI: new GoogleGenerativeAI(apiKeyInfo.apiKey),
    apiKeyId: apiKeyInfo.id
  };
};

// Initialize Gemini AI (deprecated - using load balancer now)
function initializeGeminiAI() {
  return getGeminiAI();
}

// Prepare comprehensive CV data for AI analysis with enhanced structure
function prepareCVDataForAI(profileData: any): string {
  let cvText = '';
   cvText += `=== CAREER OVERVIEW ===\n`;
   cvText += `Number of Positions: ${profileData.experience?.length || 0}\n`;
   cvText += `Education Level: ${profileData.education?.length > 0 ? 'Higher Education' : 'Not specified'}\n\n`;
 

  // Work Experience with detailed analysis
  if (profileData.experience && Array.isArray(profileData.experience) && profileData.experience.length > 0) {
    cvText += '=== PROFESSIONAL EXPERIENCE (DETAILED) ===\n';
    profileData.experience.forEach((exp: any, index: number) => {
      cvText += `POSITION ${index + 1}:\n`;
      cvText += `• Role: ${exp.position || exp.title || 'Not specified'}\n`;
      cvText += `• Company: ${exp.company || 'Not specified'}\n`;
      if (exp.startDate || exp.endDate) {
        cvText += `• Duration: ${exp.startDate || 'Start date not specified'} - ${exp.endDate || 'Present'}\n`;
      }
      if (exp.description) {
        cvText += `• Key Responsibilities & Achievements: ${exp.description}\n`;
      }
      cvText += '\n';
    });
  }

  // Education with comprehensive details
  if (profileData.education && Array.isArray(profileData.education) && profileData.education.length > 0) {
    cvText += '=== EDUCATIONAL BACKGROUND ===\n';
    profileData.education.forEach((edu: any, index: number) => {
      cvText += `EDUCATION ${index + 1}:\n`;
      cvText += `• Degree: ${edu.degree || 'Not specified'}\n`;
      cvText += `• Institution: ${edu.institution || 'Not specified'}\n`;
      if (edu.field) {
        cvText += `• Field of Study: ${edu.field}\n`;
      }
      if (edu.gpa) {
        cvText += `• Academic Performance: ${edu.gpa}\n`;
      }
      if (edu.description) {
        cvText += `• Additional Details: ${edu.description}\n`;
      }
      cvText += '\n';
    });
  }

  // Technical and Soft Skills Analysis
  if (profileData.skills && Array.isArray(profileData.skills) && profileData.skills.length > 0) {
    cvText += '=== CORE COMPETENCIES ===\n';
    
    const hardSkills = profileData.skills.filter((skill: any) => skill.type === 'hard');
    const softSkills = profileData.skills.filter((skill: any) => skill.type === 'soft');
    
    if (hardSkills.length > 0) {
      cvText += 'TECHNICAL EXPERTISE:\n';
      hardSkills.forEach((skill: any) => {
        cvText += `• ${skill.name}${skill.level ? ` - ${skill.level} level` : ''}${skill.description ? ` (${skill.description})` : ''}\n`;
      });
      cvText += '\n';
    }
    
    if (softSkills.length > 0) {
      cvText += 'PROFESSIONAL SKILLS:\n';
      softSkills.forEach((skill: any) => {
        cvText += `• ${skill.name}${skill.level ? ` - ${skill.level} level` : ''}${skill.description ? ` (${skill.description})` : ''}\n`;
      });
      cvText += '\n';
    }
  }

  // Project Portfolio
  if (profileData.projects && Array.isArray(profileData.projects) && profileData.projects.length > 0) {
    cvText += '=== PROJECT PORTFOLIO ===\n';
    profileData.projects.forEach((project: any, index: number) => {
      cvText += `PROJECT ${index + 1}: ${project.name || 'Unnamed Project'}\n`;
      if (project.description) {
        cvText += `• Description: ${project.description}\n`;
      }
      if (project.technologies && Array.isArray(project.technologies)) {
        cvText += `• Technologies Used: ${project.technologies.join(', ')}\n`;
      }
      if (project.url) {
        cvText += `• Project Link: Available\n`;
      }
      cvText += '\n';
    });
  }

  // Professional Certifications
  if (profileData.certifications && Array.isArray(profileData.certifications) && profileData.certifications.length > 0) {
    cvText += '=== PROFESSIONAL CERTIFICATIONS ===\n';
    profileData.certifications.forEach((cert: any, index: number) => {
      cvText += `CERTIFICATION ${index + 1}:\n`;
      cvText += `• Name: ${cert.name}\n`;
      if (cert.issuer) {
        cvText += `• Issuing Authority: ${cert.issuer}\n`;
      }
      if (cert.description) {
        cvText += `• Details: ${cert.description}\n`;
      }
      cvText += '\n';
    });
  }

  // Language Proficiency
  if (profileData.languages && Array.isArray(profileData.languages) && profileData.languages.length > 0) {
    cvText += '=== LANGUAGE PROFICIENCY ===\n';
    profileData.languages.forEach((lang: any) => {
      cvText += `• ${lang.language || lang.name}: ${lang.level || lang.proficiency || 'Not specified'}\n`;
    });
    cvText += '\n';
  }

  // Volunteer Experience (if available)
  if (profileData.volunteerExperience && Array.isArray(profileData.volunteerExperience) && profileData.volunteerExperience.length > 0) {
    cvText += '=== VOLUNTEER & COMMUNITY INVOLVEMENT ===\n';
    profileData.volunteerExperience.forEach((vol: any, index: number) => {
      cvText += `${index + 1}. ${vol.role || 'Volunteer'} at ${vol.organization || 'Organization not specified'}\n`;
      if (vol.description) {
        cvText += `   ${vol.description}\n`;
      }
      cvText += '\n';
    });
  }

  cvText += '=== END OF CV DATA ===\n';
  cvText += 'INSTRUCTION: Analyze ALL the above information to create a comprehensive, unique professional summary that captures the candidate\'s true value proposition.';

  return cvText;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🤖 AI Generate Summary API çağırıldı');
    
    // Get user ID from token
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Giriş tələb olunur - Token lazımdır',
          errorEn: 'Authentication required - Token needed'
        },
        { status: 401 }
      );
    }

    // Get user and check subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        tier: true,
        name: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'İstifadəçi tapılmadı',
          errorEn: 'User not found'
        },
        { status: 404 }
      );
    }

    console.log(`👤 User: ${user.email}, Tier: ${user.tier}`);

    // Check if user has access to AI features (block free users)
    if (!canUseAIFeatures(user.tier)) {
      return NextResponse.json(
        { 
          success: false,
          error: "AI summary yalnız ödənişli planlar üçün mövcuddur. Planınızı yüksəldin!",
          errorEn: "AI summary is only available for paid plans. Please upgrade!",
          tier: user.tier,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const { cvId, profileData, cvLanguage, structurePattern, openingStyle, requestId } = await req.json();

    // Handle both scenarios: direct profileData or cvId to fetch data
    let actualProfileData = profileData;
    let actualCvLanguage = cvLanguage;

    if (cvId && !profileData) {
      // Fetch CV data from database using cvId
      try {
        const cv = await prisma.cV.findUnique({
          where: { id: cvId }
        });

        if (!cv || !cv.cv_data) {
          throw new Error('CV tapılmadı');
        }

        // Parse the JSON CV data
        const cvData = cv.cv_data as any;
        actualProfileData = cvData;
        actualCvLanguage = cvData.cvLanguage || 'azerbaijani';
      } catch (fetchError) {
        console.error('CV data fetch error:', fetchError);
        return NextResponse.json({
          success: false,
          error: 'CV məlumatları alına bilmədi'
        }, { status: 400 });
      }
    }

    if (!actualProfileData) {
      return NextResponse.json({
        success: false,
        error: 'Profile data tapılmadı'
      }, { status: 400 });
    }

    // ❌ Skills olmayan CV-lər üçün AI summary yaradılmamalıdır
    const hasSkills = actualProfileData.skills && Array.isArray(actualProfileData.skills) && actualProfileData.skills.length > 0;
    
    if (!hasSkills) {
      console.log('⚠️ Skills olmayan CV üçün AI summary yaradılmadı');
      return NextResponse.json({
        success: false,
        error: 'Bacarıq əlavə edin',
        errorEn: 'Please add skills first',
        requiresSkills: true
      }, { status: 400 });
    }

    // Determine language for summary generation
    const targetLanguage = actualCvLanguage || 'azerbaijani';
    const isEnglish = targetLanguage === 'english';

    console.log(`🤖 AI Professional Summary generasiya edilir (${targetLanguage})... (Skills: ${actualProfileData.skills.length})`);

    // Create comprehensive CV text for AI analysis
    const cvText = prepareCVDataForAI(actualProfileData);

    // Create enhanced prompt with clearer instructions
    const basePrompt = isEnglish ? 
      `You are a professional CV writer. Create a professional summary based on the CV information below.

REQUIREMENTS:
- Write in third-person (not "I", use "experienced professional", "skilled in", etc.)
- 60-80 words, 3-4 sentences only
- Focus on key skills and achievements
- Professional tone
- No generic phrases like "results-driven" or "team player"
- Be specific about expertise areas

CV INFORMATION:
${cvText}

Write only the professional summary, nothing else:` :
      
      `Sən peşəkar CV yazıçısısan. Aşağıdakı CV məlumatlarına əsasən professional summary yaz.

TƏLƏBLƏr:
- 3-cü şəxs formasi ilə yaz ("mən" yox, "təcrübəli mütəxəssis", "bacarıqlıdır" kimi)
- 60-80 söz, 3-4 cümlə
- Əsas bacarıq və nailiyyətlərə fokus
- Professional ton
- "nəticəyönümlü", "komanda oyunçusu" kimi klişe ifadələr işlətmə
- Ekspertlik sahələrini konkret göstər

CV MƏLUMATLARı:
${cvText}

Yalnız professional summary-ni yaz, başqa heç nə əlavə etmə:`;

    // Create simple, direct prompt
    const prompt = basePrompt;

    let lastError: Error | null = null;
    let generatedSummary = '';

    // Try each API key until one works
    try {
      const { geminiAI, apiKeyId } = await getGeminiAI();
      
      const model = geminiAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent results
          topP: 0.8, // More focused sampling
          topK: 20, // Reduced token variety for consistency
          maxOutputTokens: 120, // Sufficient for summary
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      generatedSummary = response.text().trim();
      
      // Record successful usage if using DB API key
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'Summary generated successfully');
      }
      
      console.log(`✅ AI Professional Summary generated successfully`);
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Gemini API failed:`, error.message);
      
      // If using DB API key, mark it as failed
      try {
        const { apiKeyId } = await getGeminiAI();
        if (apiKeyId) {
          await markApiKeyFailed(apiKeyId, error.message);
        }
      } catch (e) {
        console.error('Error marking API key as failed:', e);
      }
    }

    if (!generatedSummary) {
      console.error('❌ Gemini API failed');
      const isQuotaError = lastError?.message?.includes('429') || lastError?.message?.toLowerCase().includes('quota');
      
      return NextResponse.json({
        success: false,
        error: isEnglish 
          ? 'AI API failed. Please try again in a few minutes.' 
          : 'AI API uğursuz oldu. Zəhmət olmasa bir neçə dəqiqə sonra yenidən cəhd edin.',
        quotaExceeded: isQuotaError
      }, { status: isQuotaError ? 429 : 500 });
    }

    console.log(`✅ AI Peşəkar Xülasə generasiya edildi (${targetLanguage})`);

    return NextResponse.json({
      success: true,
      data: {
        summary: generatedSummary,
        professionalSummary: generatedSummary,
        language: targetLanguage,
        timestamp: new Date().toISOString(),
        uniquenessId: `${Date.now()}_${Math.floor(Math.random() * 10000)}`
      },
      message: isEnglish ? 'Professional Summary generated successfully' : 'Peşəkar Xülasə uğurla generasiya edildi'
    });

  } catch (error) {
    console.error('❌ AI Peşəkar Xülasə generasiya xətası:', error);

    return NextResponse.json({
      success: false,
      error: 'Peşəkar Xülasə generasiya edilərkən xəta baş verdi',
      errorEn: 'Error occurred while generating Professional Summary',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}
