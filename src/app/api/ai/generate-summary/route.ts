import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
function initializeGeminiAI() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable tapılmadı');
  }
  return new GoogleGenerativeAI(geminiApiKey);
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
    const { profileData } = await req.json();

    if (!profileData) {
      return NextResponse.json({
        success: false,
        error: 'Profile data tapılmadı'
      }, { status: 400 });
    }

    console.log('🤖 AI Professional Summary generasiya edilir...');

    // Initialize Gemini AI
    const geminiAI = initializeGeminiAI();
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create profile text for AI analysis
    const profileText = prepareProfileTextForAI(profileData);

    const prompt = `
LinkedIn profil məlumatlarına əsasən professional özət yazın. Özət qısa, təsirli və peşəkar olmalıdır.

Profil məlumatları:
${profileText}

Qaydalar:
1. 2-3 cümlə ilə yazın
2. Şəxsin əsas bacarıqları və təcrübəsini vurğulayın
3. Professional ton istifadə edin
4. Azərbaycan dilində yazın
5. Özət birbaşa başlasın, giriş sözləri yazmayın

Peşəkar Xülasə:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedSummary = response.text().trim();

    console.log('✅ AI Peşəkar Xülasə generasiya edildi');

    return NextResponse.json({
      success: true,
      data: {
        professionalSummary: generatedSummary,
        timestamp: new Date().toISOString()
      },
      message: 'Peşəkar Xülasə uğurla generasiya edildi'
    });

  } catch (error) {
    console.error('❌ AI Peşəkar Xülasə generasiya xətası:', error);

    return NextResponse.json({
      success: false,
      error: 'Peşəkar Xülasə generasiya edilərkən xəta baş verdi',
      details: process.env.NODE_ENV === 'development' ?
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}
