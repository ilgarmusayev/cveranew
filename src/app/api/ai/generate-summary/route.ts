import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { getGeminiApiKey, recordApiUsage, markApiKeyFailed, getBestApiKey } from '@/lib/api-service';
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

// Get comprehensive style instructions for maximum variety
function getStyleInstructions(style: string, structure: string, pattern: string, isEnglish: boolean): string {
  const styleMap = {
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

  const structureMap = {
    impact_first: {
      en: `Start with the most significant impact or achievement, then explain capabilities.`,
      az: `Ən böyük təsir və ya nailiyyətlə başla, sonra qabiliyyətləri izah et.`
    },
    skill_showcase: {
      en: `Lead with core competencies, then demonstrate their application and results.`,
      az: `Əsas bacarıqlarla başla, sonra onların tətbiqi və nəticələrini göstər.`
    },
    problem_solver: {
      en: `Position as someone who identifies and solves complex challenges effectively.`,
      az: `Mürəkkəb problemləri təyin edən və effektiv həll edən şəxs kimi təqdim et.`
    },
    value_creator: {
      en: `Emphasize how they create tangible value and drive organizational success.`,
      az: `Necə konkret dəyər yaratdıqlarını və təşkilati uğura təsir etdiklərini vurğula.`
    },
    industry_expert: {
      en: `Present as a recognized authority with deep industry knowledge and insights.`,
      az: `Dərin sahə bilik və görüşləri olan tanınmış mütəxəssis kimi təqdim et.`
    },
    strategic_leader: {
      en: `Highlight strategic thinking and leadership in driving organizational goals.`,
      az: `Strateji düşüncə və təşkilati məqsədlərə nail olmaqda liderliyi vurğula.`
    },
    innovation_driver: {
      en: `Show how they drive innovation and bring fresh perspectives to challenges.`,
      az: `Necə innovasiyaya rəhbərlik etdiklərini və problemlərə yeni baxış gətirdiklərini göstər.`
    },
    results_builder: {
      en: `Focus on systematic approach to building measurable results and outcomes.`,
      az: `Ölçülə bilən nəticələr və yekunlar yaratmaqda sistematik yanaşmaya fokuslan.`
    }
  };

  const patternMap = {
    active_dynamic: {
      en: `Use dynamic action verbs and energetic language. Keep sentences punchy and impactful.`,
      az: `Dinamik hərəkət felləri və enerjili dil işlət. Cümlələri dolğun və təsirli saxla.`
    },
    consultative: {
      en: `Adopt an advisory tone. Present expertise as guidance and strategic insight.`,
      az: `Məsləhətçi ton işlət. Ekspertizanı rəhbərlik və strateji görüş kimi təqdim et.`
    },
    technical_precise: {
      en: `Use precise technical language. Focus on exact methodologies and specific outcomes.`,
      az: `Dəqiq texniki dil işlət. Xüsusi metodologiya və konkret nəticələrə fokuslan.`
    },
    business_focused: {
      en: `Emphasize business impact, ROI, and organizational benefits. Use commercial language.`,
      az: `Biznes təsiri, gəlirlilik və təşkilati faydaları vurğula. Kommersiya dili işlət.`
    },
    creative_engaging: {
      en: `Use engaging, creative language flow. Make the summary memorable and distinctive.`,
      az: `Cəlbedici və yaradıcı dil axını işlət. Xülasəni yadda qalan və fərqləndirici et.`
    },
    analytical_sharp: {
      en: `Present information with analytical precision. Use sharp, insightful observations.`,
      az: `Məlumatı analitik dəqiqliklə təqdim et. Kəskin və dərindən görüşlər işlət.`
    }
  };

  const styleInstruction = styleMap[style as keyof typeof styleMap];
  const structureInstruction = structureMap[structure as keyof typeof structureMap];
  const patternInstruction = patternMap[pattern as keyof typeof patternMap];

  const lang = isEnglish ? 'en' : 'az';
  
  let combinedInstruction = '';
  if (styleInstruction) combinedInstruction += styleInstruction[lang] + ' ';
  if (structureInstruction) combinedInstruction += structureInstruction[lang] + ' ';
  if (patternInstruction) combinedInstruction += patternInstruction[lang];

  return combinedInstruction;
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
    
    // Writing structure variations for maximum diversity
    const writingStructures = [
      'impact_first',      // Start with biggest achievement
      'skill_showcase',    // Lead with core competencies  
      'problem_solver',    // Position as solution provider
      'value_creator',     // Focus on value delivered
      'industry_expert',   // Emphasize domain knowledge
      'strategic_leader',  // Highlight leadership qualities
      'innovation_driver', // Show innovative thinking
      'results_builder'    // Focus on building results
    ];
    
    const sentencePatterns = [
      'active_dynamic',    // Dynamic action-oriented sentences
      'consultative',      // Advisory and consultative tone
      'technical_precise', // Precise technical language
      'business_focused',  // Business impact language
      'creative_engaging', // Engaging and creative flow
      'analytical_sharp'   // Sharp analytical presentation
    ];
    
    // Randomly select style and structure variations
    const selectedStyle = summaryStyles[Math.floor(Math.random() * summaryStyles.length)];
    const selectedStructure = writingStructures[Math.floor(Math.random() * writingStructures.length)];
    const selectedPattern = sentencePatterns[Math.floor(Math.random() * sentencePatterns.length)];
    


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

    // Add comprehensive style instructions
    const styleInstructions = getStyleInstructions(selectedStyle, selectedStructure, selectedPattern, isEnglish);
    
    // Enhanced randomness and uniqueness factors
    const timestamp = Date.now();
    const randomSeed = Math.floor(Math.random() * 100000);
    const creativityFactor = Math.random();
    const structuralVariation = Math.floor(Math.random() * 5) + 1;
    
    // Dynamic opening approaches
    const openingStyles = [
      'expertise_highlight', 'achievement_opener', 'value_proposition', 
      'competency_showcase', 'impact_leader', 'solution_architect'
    ];
    const selectedOpening = openingStyles[Math.floor(Math.random() * openingStyles.length)];
    
    const uniquenessPrompt = isEnglish ? 
      `\n\n🎯 CREATIVE GENERATION PARAMETERS:
Timestamp: ${timestamp} | Seed: ${randomSeed} | Creativity: ${creativityFactor.toFixed(3)}
Structural Variation: ${structuralVariation} | Opening Style: ${selectedOpening}

CRITICAL DIVERSITY REQUIREMENTS:
✅ Use completely different opening phrases each time
✅ Vary sentence lengths: mix short punchy statements with flowing descriptions  
✅ Alternate between different grammatical structures
✅ Rotate focus points: skills → results → value → expertise
✅ Change vocabulary choices and power words
✅ Modify the logical flow and connection patterns
✅ Experiment with emphasis placement and highlight different strengths

FORBIDDEN REPETITIVE PATTERNS:
❌ Same sentence starters or connectors
❌ Identical word combinations or phrases  
❌ Repetitive structure or rhythm
❌ Similar emphasis points or focus areas
❌ Standard templated language

CREATE A COMPLETELY FRESH PERSPECTIVE EVERY TIME!` :
      
      `\n\n🎯 YARADıCı GENERASİYA PARAMETRLƏRİ:
Timestamp: ${timestamp} | Seed: ${randomSeed} | Yaradıcılıq: ${creativityFactor.toFixed(3)}
Struktur Dəyişkənliyi: ${structuralVariation} | Açılış Üslubu: ${selectedOpening}

KRİTİK ÇEŞİTLİLİK TƏLƏBLƏRİ:
✅ Hər dəfə tamamilə fərqli açılış ifadələri işlət
✅ Cümlə uzunluqlarını dəyişdir: qısa təsirli ifadələri axıcı təsvirlərlə qarışdır
✅ Müxtəlif qrammatik strukturlar arasında dəyişir  
✅ Fokus nöqtələrini döndər: bacarıqlar → nəticələr → dəyər → ekspertiza
✅ Söz seçimləri və güclü sözləri dəyişdir
✅ Məntiqi axın və bağlantı nümunələrini dəyişdir
✅ Vurğu yerləşdirilməsi ilə eksperiment et və müxtəlif güclü tərəfləri vurğula

QADAĞAN EDİLƏN TƏKRARLANAN NÜMUNƏLƏR:
❌ Eyni cümlə başlanğıcları və ya bağlayıcılar
❌ Eyni söz kombinasiyaları və ya ifadələr
❌ Təkrarlanan struktur və ya ritm  
❌ Oxşar vurğu nöqtələri və ya fokus sahələri
❌ Standart şablon dili

HƏR DƏFƏ TAMAMILƏ TƏZƏ PERSPEKTIV YARAT!`;

    // Dynamic creativity booster
    const creativityBooster = isEnglish ? 
      `\n\n🚀 CREATIVE EXECUTION PROTOCOL:
1. BEGIN with an unexpected angle or fresh perspective
2. WEAVE in the selected writing style naturally  
3. BALANCE professional tone with engaging language
4. INTEGRATE quantifiable achievements creatively
5. CONCLUDE with forward-looking impact statement
6. ENSURE every word adds unique value
7. AVOID generic phrases and clichéd expressions
8. CREATE memorable, distinctive professional narrative

INNOVATION MANDATE: Think outside conventional CV summary patterns. Be professional yet distinctive, formal yet engaging, comprehensive yet concise.` :
      
      `\n\n🚀 YARADıCı İCRA PROTOKOLU:
1. Gözlənilməz bucaq və ya təzə perspektivlə BAŞLA
2. Seçilmiş yazı üslubunu təbii şəkildə DAXIL ET
3. Peşəkar tonu cəlbedici dillə BALANSLAŞDIR  
4. Kəmiyyət göstəricilərini yaradıcı şəkildə İNTEQRASİYA ET
5. Gələcəyə yönəlik təsir bəyanı ilə TAMAMLA
6. Hər sözün unikal dəyər əlavə etməsini TƏMİN ET
7. Ümumi ifadələr və klişe ifadələrdən ÇƏKIN
8. Yadda qalan, fərqli peşəkar hekayə YARAT

İNNOVASİYA MANDATı: Ənənəvi CV xülasə nümunələrindən kənarda düşün. Peşəkar, lakin fərqli, formal, lakin cəlbedici, əhatəli, lakin qısa ol.`;

    const finalChallenge = isEnglish ? 
      `\n\n🎨 FINAL GENERATION CHALLENGE: Create a professional summary that perfectly embodies ALL selected parameters while delivering maximum impact and memorability. Make it IMPOSSIBLE to confuse with any previous generation!` :
      `\n\n🎨 SON GENERASİYA ÇAĞIRIŞI: Seçilmiş bütün parametrləri mükəmməl şəkildə əks etdirən, maksimum təsir və yadda qalmaq qabiliyyəti olan peşəkar xülasə yarat. Onu əvvəlki generasiyalarla qarışdırmaq MÜMKÜNSİZ olsun!`;
    
    const prompt = basePrompt + '\n\n' + styleInstructions + uniquenessPrompt + creativityBooster + finalChallenge;

    console.log('🎯 Advanced Generation Parameters:', {
      language: isEnglish ? 'English' : 'Azerbaijani',
      writingStyle: selectedStyle,
      structure: selectedStructure,
      sentencePattern: selectedPattern,
      creativityFactor: creativityFactor,
      structuralVariation: structuralVariation,
      openingStyle: selectedOpening,
      timestamp: timestamp,
      seed: randomSeed,
      promptLength: prompt.length,
      totalVariations: summaryStyles.length * writingStructures.length * sentencePatterns.length
    });

    let lastError: Error | null = null;
    let generatedSummary = '';

    // Get API key info outside try block for scope access
    const apiKeyInfo = await getBestApiKey('gemini');
    const apiKey = apiKeyInfo?.apiKey;
    const apiKeyId = apiKeyInfo?.id;
    
    if (!apiKey) {
      throw new Error('No valid API key available');
    }

    try {
      // Use v1 API with gemini-2.5-flash model (sərfəli və sürətli)
      const geminiV1 = new GeminiV1Client(apiKey);
      generatedSummary = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      // Record successful usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'Professional summary generated (v1 gemini-2.5-flash)');
      }
      
      console.log(`✅ AI Professional Summary generated successfully with v1 API`);
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Gemini v1 API failed:`, error.message);
      
      // Fallback to v1 API with gemini-2.0-flash
      try {
        console.log('🔄 Trying fallback to gemini-2.0-flash...');
        const geminiV1Fallback = new GeminiV1Client(apiKey);
        generatedSummary = await geminiV1Fallback.generateContent('gemini-2.0-flash', prompt);
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'Professional summary generated (v1 gemini-2.0-flash fallback)');
        }
        
        console.log('✅ Professional summary generated with fallback gemini-2.0-flash');
      } catch (fallbackError: any) {
        console.log(`❌ All Gemini v1 attempts failed:`, fallbackError.message);
        
        // Record API failure
        if (apiKeyId) {
          await markApiKeyFailed(apiKeyId, fallbackError.message);
        }
        
        lastError = fallbackError;
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

    console.log(`✅ AI Professional Summary generated successfully (${targetLanguage})`, {
      summaryLength: generatedSummary.length,
      wordsCount: generatedSummary.split(' ').length,
      uniquenessFactors: {
        style: selectedStyle,
        structure: selectedStructure,
        pattern: selectedPattern,
        creativityScore: creativityFactor.toFixed(3),
        structuralVar: structuralVariation,
        openingApproach: selectedOpening
      },
      apiPerformance: {
        keyUsed: apiKeyId,
        totalPromptLength: prompt.length,
        generationTime: Date.now() - timestamp
      }
    });

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
