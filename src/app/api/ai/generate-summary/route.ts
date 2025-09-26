import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { getGeminiApiKey, recordApiUsage, markApiKeyFailed, getBestApiKey } from '@/lib/api-service';


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

// Get style-specific instructions for variety in summary generation
function getStyleInstructions(style: string, isEnglish: boolean): string {
  const instructions = {
    achievement_focused: {
      en: `Focus on specific accomplishments and measurable results. Start with what the person achieved.`,
      az: `Konkret nailiyyətlər və ölçülə bilən nəticələrə fokuslan. Şəxsin nə əldə etdiyi ilə başla.`
    },
    skill_technical: {
      en: `Highlight technical expertise and practical application of skills. Show how they solve problems.`,
      az: `Texniki ekspertiza və bacarıqların praktiki tətbiqini vurğula. Problemləri necə həll etdiklərini göstər.`
    },
    leadership_strategic: {
      en: `Emphasize leadership impact and strategic thinking. Show how they guide and influence.`,
      az: `Liderlik təsiri və strateji düşüncəni vurğula. Necə rəhbərlik etdiklərini və təsir göstərdiklərini göstər.`
    },
    innovation_problem_solving: {
      en: `Focus on creative solutions and innovative approaches. Highlight unique problem-solving methods.`,
      az: `Yaradıcı həllər və innovativ yanaşmalara fokuslan. Unikal problem həlli metodlarını vurğula.`
    },
    industry_expertise: {
      en: `Emphasize deep domain knowledge and industry-specific achievements. Show specialized expertise.`,
      az: `Dərin sahə bilik və sahə-spesifik nailiyyətləri vurğula. İxtisaslaşmış ekspertizanı göstər.`
    }
  };

  const instruction = instructions[style as keyof typeof instructions];
  return instruction ? (isEnglish ? instruction.en : instruction.az) : '';
}

export async function POST(req: NextRequest) {
  try {
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

    // Array of different summary approaches for variety
    const summaryStyles = [
      'achievement_focused', 
      'skill_technical', 
      'leadership_strategic', 
      'innovation_problem_solving',
      'industry_expertise'
    ];
    
    // Randomly select a style to ensure variety
    const selectedStyle = summaryStyles[Math.floor(Math.random() * summaryStyles.length)];
    
    console.log(`🎯 Selected summary style: ${selectedStyle}`);

    // Create enhanced prompt with style variation
    const basePrompt = isEnglish ? 
      `Write a professional CV summary strictly based on the information provided in the CV. The text must be in third-person style (not first-person). Avoid phrases like "with X years of experience." Instead, emphasize the quality of experience, tangible outcomes, and unique strengths of the candidate. Do not use clichés such as "responsible" or "results-driven." The summary should feel authentic, highlight practical application of skills and measurable impact, and clearly show the value the candidate can bring to an organization.

CV DATA:
${cvText}

Requirements:
- Third-person perspective only
- No time-based phrases or experience years
- Focus on achievements and practical impact
- Highlight unique value proposition
- Professional and authentic tone
- 70-90 words, 4-5 sentences

Generate the summary:` :
      
      `CV üçün peşəkar xülasə (Professional Summary) yaz. Yalnız CV-dəki məlumatlara əsaslan. Mətn 3-cü tərəf üslubunda olsun, "mən" formasından istifadə etmə. "X il təcrübəyə malikdir" tipli ifadələr işlətmə. Onun əvəzinə namizədin təcrübəsinin keyfiyyətini, nəticələrini və fərqləndirici tərəflərini vurğula. Klişe ifadələrdən ("məsuliyyətli", "nəticəyönümlü") uzaq dur. Mətn HR mütəxəssislərinin diqqətini çəkəcək, inandırıcı və unikallıq hissi verən üslubda yazılsın. Fokus – bacarıqların praktik tətbiqi, əldə olunan nəticələr və namizədin şirkətə əlavə edə biləcəyi dəyər üzərində olsun.

CV MƏLUMATLARı:
${cvText}

Tələblər:
- Yalnız 3-cü tərəf baxımından
- Vaxt əsaslı ifadələr və təcrübə ili yox
- Nailiyyətlər və praktik təsirə fokus
- Unikal dəyər təklifini vurğula
- Peşəkar və həqiqi ton
- 70-90 söz, 4-5 cümlə

Xülasəni generasiya et:`;

    // Add style-specific instructions
    const styleInstructions = getStyleInstructions(selectedStyle, isEnglish);
    
    // Add timestamp and randomness for uniqueness
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 10000);
    
    const uniquenessPrompt = isEnglish ? 
      `\n\nUNIQUENESS REQUIREMENT: Generate a completely unique summary. Timestamp: ${timestamp}, Seed: ${randomSeed}. Vary sentence structure, word choice, and emphasis points to ensure each generation is distinctly different from previous versions.` :
      `\n\nUNİKALLıQ TƏLƏBİ: Tamamilə unikal xülasə yarat. Timestamp: ${timestamp}, Seed: ${randomSeed}. Cümlə strukturunu, söz seçimini və vurğu nöqtələrini dəyiş ki, hər generasiya əvvəlki versiyalardan fərqli olsun.`;
    
    const prompt = basePrompt + '\n\n' + styleInstructions + uniquenessPrompt;

    let lastError: Error | null = null;
    let generatedSummary = '';

    // Try each API key until one works
    try {
      const { geminiAI, apiKeyId } = await getGeminiAI();
      
      const model = geminiAI.getGenerativeModel({ 
        model: 'gemini-pro-latest',
        generationConfig: {
          temperature: 0.9, // High creativity for variety
          topP: 0.95, // Diverse token sampling
          topK: 40, // Token variety
          maxOutputTokens: 150, // Sufficient for summary
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
        style: selectedStyle,
        timestamp: new Date().toISOString(),
        uniquenessId: `${timestamp}_${randomSeed}`
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
