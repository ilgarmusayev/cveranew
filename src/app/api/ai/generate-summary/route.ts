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

// Prepare profile text for AI analysis
function prepareProfileTextForAI(profileData: any): string {
  let profileText = '';

  if (profileData.name) {
    profileText += `Ad: ${profileData.name}\n`;
  }

  if (profileData.headline) {
    profileText += `Başlıq: ${profileData.headline}\n`;
  }

  if (profileData.location) {
    profileText += `Yer: ${profileData.location}\n`;
  }

  if (profileData.about) {
    profileText += `Haqqında: ${profileData.about}\n`;
  }

  if (profileData.experience && Array.isArray(profileData.experience)) {
    profileText += '\nİş təcrübəsi:\n';
    profileData.experience.forEach((exp: any, index: number) => {
      profileText += `${index + 1}. ${exp.position || exp.title} - ${exp.company} (${exp.duration || exp.date_range})\n`;
      if (exp.description) {
        profileText += `   ${exp.description}\n`;
      }
    });
  }

  if (profileData.education && Array.isArray(profileData.education)) {
    profileText += '\nTəhsil:\n';
    profileData.education.forEach((edu: any, index: number) => {
      profileText += `${index + 1}. ${edu.degree} - ${edu.school || edu.institution} (${edu.duration || edu.date_range})\n`;
    });
  }

  return profileText;
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

    // Create profile text for AI analysis
    const profileText = prepareProfileTextForAI(profileData);

    // Create language-specific prompt with strict word limits
    const prompt = isEnglish ? `
Write a professional CV summary in 4-5 sentences (60-80 words). No names, no "I am", no personal pronouns.

Profile: ${profileText.substring(0, 500)}

Structure format:
1. "[Field] with [X+] years of experience in [specific areas]"
2. "Skilled in [2-3 key technical skills] with [specialization/background]"
3. "Successfully [achievement with metric/result]"
4. "Seeking to [career goal/contribution] in [type of company/role]"

Example: "Software engineer with 6+ years of experience in designing and developing scalable web applications. Skilled in JavaScript, React, and Node.js with a strong background in system architecture. Successfully led cross-functional teams and delivered projects that improved efficiency by 25%. Seeking to contribute technical expertise to innovative projects in a growth-oriented company."

STRICT RULES:
- 60-80 words total
- 4-5 sentences exactly
- NO names, NO "I am", NO personal pronouns
- Include specific metrics when possible
- Professional third-person perspective

Summary:` : `
4-5 cümlədən ibarət peşəkar CV xülasəsi yaz (60-80 söz). Ad yox, "Mən" yox, şəxsi zamirlər yox.

Profil: ${profileText.substring(0, 500)}

Struktur format:
1. "[X+] ildən artıq təcrübəyə malik [sahə] mütəxəssisi [spesifik sahələr]də"
2. "[2-3 əsas texniki bacarıq]da güclü bacarıqlara sahibdir [ixtisaslaşma/background] ilə"
3. "[nailiyyət metrik/nəticə ilə] uğurla həyata keçirib"
4. "[karyera məqsədi/töhfə] istəyir [şirkət tipi/rol]də"

Nümunə: "6 ildən artıq təcrübəyə malik proqram mühəndisi. Veb tətbiqlərin hazırlanması və miqyaslandırılmasında ixtisaslaşıb. JavaScript, React və Node.js üzrə güclü bacarıqlara sahibdir. Layihələrin effektivliyini 25% artıran komandaları uğurla idarə edib. Dinamik şirkətdə texniki biliklərini tətbiq etməklə innovativ layihələrin inkişafına töhfə vermək istəyir."

QƏTİ QAYDALAR:
- 60-80 söz
- Tam 4-5 cümlə
- AD yox, "Mən" yox, şəxsi zamirlər yox
- Mümkün olduqda spesifik rəqəmlər daxil et
- Peşəkar üçüncü şəxs baxımından

Xülasə:`;

    let lastError: Error | null = null;
    let generatedSummary = '';

    // Try each API key until one works
    for (let i = 0; i < geminiAIInstances.length; i++) {
      try {
        const geminiAI = getGeminiAI();
        const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
        timestamp: new Date().toISOString()
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
