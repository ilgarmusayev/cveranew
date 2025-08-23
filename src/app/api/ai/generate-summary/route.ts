import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Multiple Gemini API Keys for load balancing and failover
const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean) as string[];

// Initialize multiple Gemini AI instances
const geminiAIInstances = GEMINI_API_KEYS.map(key => new GoogleGenerativeAI(key));

console.log(`🔑 Initialized ${geminiAIInstances.length} Gemini API instances for /api/ai/generate-summary`);

// Round-robin index for load balancing
let currentAPIIndex = 0;

// Get next available Gemini AI instance
const getGeminiAI = () => {
  if (geminiAIInstances.length === 0) {
    throw new Error('No Gemini API keys configured');
  }
  
  const instance = geminiAIInstances[currentAPIIndex];
  currentAPIIndex = (currentAPIIndex + 1) % geminiAIInstances.length;
  
  console.log(`🔄 Using Gemini API instance ${currentAPIIndex + 1}/${geminiAIInstances.length}`);
  return instance;
};

// Initialize Gemini AI (deprecated - using load balancer now)
function initializeGeminiAI() {
  return getGeminiAI();
}

// Prepare comprehensive CV data for AI analysis with enhanced structure
function prepareCVDataForAI(profileData: any): string {
  let cvText = '';

  // Calculate total years of experience from work history
  let totalYears = 0;
  if (profileData.experience && Array.isArray(profileData.experience)) {
    totalYears = profileData.experience.length * 1.5; // Rough estimation
  }

  cvText += `=== CAREER OVERVIEW ===\n`;
  cvText += `Estimated Total Experience: ${totalYears > 0 ? Math.round(totalYears) + ' years' : 'Entry level'}\n`;
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
      en: `ACHIEVEMENT-FOCUSED APPROACH:
- Lead with quantifiable accomplishments and measurable impact
- Emphasize specific results, improvements, and successful outcomes
- Highlight awards, recognitions, or standout achievements
- Structure: "Accomplished [role] who achieved [specific results] through [key skills/methods]"
- Focus on transformation, growth, and concrete results delivered`,
      az: `NAİLİYYƏT FOKUSLANDıRıLAN YANAŞMA:
- Ölçülə bilən nailiyyətlər və təsirlə başla
- Konkret nəticələr, yaxşılaşmalar və uğurlu nəticələr vurğula
- Mükafatlar, tanınma və ya diqqətəlayiq nailiyyətlər göstər
- Struktur: "[konkret nəticələr] əldə edən [rol] [əsas bacarıqlar/metodlar] vasitəsilə"
- Transformasiya, artım və çatdırılan konkret nəticələrə fokus`
    },
    skill_technical: {
      en: `TECHNICAL SKILL-FOCUSED APPROACH:
- Emphasize technical expertise and specialized knowledge
- Highlight cutting-edge technologies, tools, and methodologies
- Showcase depth of technical competency and innovation
- Structure: "Technical expert in [domain] with mastery of [specific technologies/tools]"
- Focus on technical problem-solving capabilities and expertise depth`,
      az: `TEXNİKİ BACAFıQ FOKUSLANDıRıLAN YANAŞMA:
- Texniki ekspertiza və ixtisaslaşmış bilik vurğula
- Müasir texnologiyalar, alətlər və metodologiyalar göstər
- Texniki səriştənin dərinliyi və innovasiya nümayiş etdir
- Struktur: "[sahə]də texniki ekspert [konkret texnologiyalar/alətlər] mükəmməlliyi ilə"
- Texniki problem həlli qabiliyyətləri və ekspertiza dərinliyi fokus`
    },
    leadership_strategic: {
      en: `LEADERSHIP & STRATEGIC APPROACH:
- Emphasize management, team leadership, and strategic thinking
- Highlight ability to guide teams, make decisions, and drive organizational goals
- Showcase vision, planning, and execution capabilities
- Structure: "Strategic leader who guides [team size/type] to achieve [organizational outcomes]"
- Focus on influence, direction-setting, and transformational leadership`,
      az: `LİDERLİK VƏ STRATEJİ YANAŞMA:
- İdarəetmə, komanda liderliyi və strateji düşüncə vurğula
- Komandaları idarə etmək, qərar vermək və təşkilati hədəflərə nail olmaq qabiliyyəti göstər
- Vizyon, planlaşdırma və icra qabiliyyətləri nümayiş etdir
- Struktur: "[təşkilati nəticələr] əldə etmək üçün [komanda ölçüsü/növü] idarə edən strateji lider"
- Təsir, istiqamət müəyyənləşdirmə və transformasional liderlik fokus`
    },
    innovation_problem_solving: {
      en: `INNOVATION & PROBLEM-SOLVING APPROACH:
- Emphasize creative thinking, innovation, and solution development
- Highlight unique approaches to challenges and breakthrough solutions
- Showcase adaptability, creativity, and forward-thinking
- Structure: "Innovative problem-solver who develops [solution types] for [challenge areas]"
- Focus on creative methodologies, breakthrough thinking, and adaptive solutions`,
      az: `İNNOVASİYA VƏ PROBLEM HƏLLİ YANAŞMA:
- Yaradıcı düşüncə, innovasiya və həll inkişafı vurğula
- Çətinliklərə unikal yanaşmalar və çıraq həlləri göstər
- Uyğunlaşma, yaradıcılıq və gələcəkə yönəlik düşüncə nümayiş etdir
- Struktur: "[çətinlik sahələri] üçün [həll növləri] inkişaf etdirən innovativ problem həllədicisi"
- Yaradıcı metodologiyalar, çıraq düşüncə və uyğunlaşan həlləri fokus`
    },
    industry_expertise: {
      en: `INDUSTRY EXPERTISE APPROACH:
- Emphasize deep industry knowledge and sector-specific experience
- Highlight understanding of industry trends, regulations, and best practices
- Showcase domain expertise and specialized industry insights
- Structure: "Industry specialist with deep expertise in [sector/domain] and proven track record"
- Focus on sector knowledge, industry standards, and domain authority`,
      az: `SAHƏKARLıQ EKSPERTİZASı YANAŞMA:
- Dərin sahəkarlıq bilik və sektor-spesifik təcrübə vurğula
- Sahəkarlıq trendləri, qaydalar və ən yaxşı təcrübələr anlayışı göstər
- Domen ekspertizası və ixtisaslaşmış sahəkarlıq görüşləri nümayiş etdir
- Struktur: "[sektor/domen]də dərin ekspertiza və sübut edilmiş rekord ilə sahəkarlıq mütəxəssisi"
- Sektor bilik, sahəkarlıq standartları və domen avtoriteti fokus`
    }
  };

  const instruction = instructions[style as keyof typeof instructions];
  return instruction ? (isEnglish ? instruction.en : instruction.az) : '';
}

export async function POST(req: NextRequest) {
  try {
    const { profileData, cvLanguage } = await req.json();

    if (!profileData) {
      return NextResponse.json({
        success: false,
        error: 'Profile data tapılmadı'
      }, { status: 400 });
    }

    // Determine language for summary generation
    const targetLanguage = cvLanguage || 'azerbaijani';
    const isEnglish = targetLanguage === 'english';

    console.log(`🤖 AI Professional Summary generasiya edilir (${targetLanguage})...`);

    // Create comprehensive CV text for AI analysis
    const cvText = prepareCVDataForAI(profileData);

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
      `Write a professional CV summary based strictly on the information provided in the CV. The text must be written in third-person style (e.g., "An experienced specialist with over 5 years of expertise..."), never in first-person. Avoid clichés such as "responsible" or "result-oriented." The summary should highlight real skills, measurable achievements, and distinctive strengths, while maintaining a polished, credible tone that attracts HR professionals and conveys uniqueness.

FULL CV DATA FOR ANALYSIS:
${cvText}

CRITICAL REQUIREMENTS:
- Analyze ALL sections of the CV thoroughly (experience, education, skills, projects, certifications, languages)
- Write in third-person perspective ONLY
- NO names, NO personal pronouns ("I", "my", "me")
- NO percentage symbols (%) - express improvements as "increased by X times" or "improved X-fold"
- Avoid generic clichés and buzzwords
- Focus on specific technical skills and measurable achievements
- Create a unique value proposition based on the CV data
- Professional tone that stands out to HR professionals
- 4-5 sentences, 70-90 words total

STYLE FOCUS: ${selectedStyle}

IMPORTANT: Do not use percentage symbols (%). Instead use phrases like:
- "doubled efficiency" instead of "increased efficiency by 100%"
- "improved performance significantly" instead of "improved performance by 25%"
- "reduced costs substantially" instead of "reduced costs by 30%"` :
      
      `CV üçün peşəkar xülasə (Professional Summary) hazırla. Xülasə yazılarkən yalnız CV-dəki məlumatlara əsaslan. Mətn 3-cü tərəf üslubunda olsun (məsələn, "5 ildən artıq təcrübəyə malik..." kimi), "mən" formasından istifadə etmə. Klişe ifadələrdən ("məsuliyyətli", "nəticəyönümlü") uzaq dur, HR mütəxəssislərinin diqqətini çəkəcək, inandırıcı və unikallıq hissi verən üslubda yaz. Mətn real bacarıqları, nəticələri və fərqləndirici cəhətləri ön plana çıxarsın.

CV-NİN TAM MƏLUMATLARı ANALİZ ÜÇÜN:
${cvText}

HƏYATI TƏLƏBLƏR:
- CV-nin BÜTÜN bölmələrini hərtərəfli analiz et (iş təcrübəsi, təhsil, bacarıqlar, layihələr, sertifikatlar, dillər)
- YALNIZ 3-cü tərəf baxımından yaz
- Ad YOX, şəxsi zamirlər YOX ("mən", "mənim")
- FAİZ simvolu (%) istifadə etmə - yaxşılaşmaları "X dəfə artırdı" və ya "əhəmiyyətli dərəcədə yaxşılaşdırdı" kimi ifadə et
- Ümumi klişe və buzzword-lərdən çəkin
- Konkret texniki bacarıqlar və ölçülə bilən nailiyyətlərə fokus
- CV məlumatları əsasında unikal dəyər təklifi yarat
- HR mütəxəssislərinin diqqətini çəkəcək peşəkar ton
- 4-5 cümlə, cəmi 70-90 söz

ÜSLUB FOKUS: ${selectedStyle}

ÖNƏMLİ: Faiz simvolu (%) istifadə etmə. Əvəzinə bu ifadələri işlət:
- "effektivliyi iki dəfə artırdı" əvəzinə "effektivliyi 100% artırdı"
- "performansı əhəmiyyətli dərəcədə yaxşılaşdırdı" əvəzinə "performansı 25% yaxşılaşdırdı"
- "xərcləri kəskin azaldı" əvəzinə "xərcləri 30% azaldı"`;

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
    for (let i = 0; i < geminiAIInstances.length; i++) {
      try {
        const geminiAI = getGeminiAI();
        const model = geminiAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
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
        
        console.log(`✅ AI Professional Summary generated successfully with API instance ${currentAPIIndex}/${geminiAIInstances.length}`);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        console.log(`❌ API instance ${currentAPIIndex}/${geminiAIInstances.length} failed:`, error.message);
        
        // Check if it's a quota error
        if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
          console.log(`🚫 Quota exceeded for API instance ${currentAPIIndex}/${geminiAIInstances.length}, trying next...`);
          continue; // Try next API key
        } else {
          // For non-quota errors, don't retry
          break;
        }
      }
    }

    if (!generatedSummary) {
      console.error('❌ All Gemini API keys failed');
      const isQuotaError = lastError?.message?.includes('429') || lastError?.message?.toLowerCase().includes('quota');
      
      return NextResponse.json({
        success: false,
        error: isEnglish 
          ? 'All AI API quotas exceeded. Please try again in a few minutes.' 
          : 'Bütün AI API limiti aşıldı. Zəhmət olmasa bir neçə dəqiqə sonra yenidən cəhd edin.',
        quotaExceeded: isQuotaError
      }, { status: 429 });
    }

    console.log(`✅ AI Peşəkar Xülasə generasiya edildi (${targetLanguage})`);

    return NextResponse.json({
      success: true,
      data: {
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
