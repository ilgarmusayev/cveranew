import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';

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
  
  console.log(`✅ Using Gemini API key from database (ID: ${apiKeyInfo.id})`);
  return {
    geminiAI: new GoogleGenerativeAI(apiKeyInfo.apiKey),
    apiKeyId: apiKeyInfo.id
  };
};

export async function POST(request: NextRequest) {
  try {
    const { prompt, template, language } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt tələb olunur' },
        { status: 400 }
      );
    }

    const { geminiAI, apiKeyId } = await getGeminiAI();
    const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Motivasiya məktubu üçün xüsusi prompt hazırla
    const systemPrompt = `Sen peşəkar motivasiya məktubu yazma mütəxəssisisən. 

Göstərilən məlumatlara əsasən ${language === 'azerbaijani' ? 'Azərbaycan' : language === 'english' ? 'English' : 'Русский'} dilində motivasiya məktubu məzmunu yarat.

Şablon növü: ${template}

Aşağıdakı JSON formatında cavab ver:
{
  "motivation": "Motivasiya hissəsi - niyə bu proqrama/vəzifəyə müraciət edirsən",
  "goals": "Məqsədlər - gələcək planlar və nə əldə etmək istəyirsən", 
  "qualifications": "Keyfiyyətlər - güclü tərəflər və təcrübə",
  "conclusion": "Nəticə - yekun fikir və minnətdarlıq"
}

Hər hissə 2-3 cümlə olsun, professional və şəxsi ton istifadə et.`;

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Record API usage if we have an API key ID
    if (apiKeyId) {
      await recordApiUsage(apiKeyId, true);
    }

    try {
      // AI cavabını JSON kimi parse etməyə çalış
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedContent = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsedContent);
      } else {
        // Əgər JSON formatında deyilsə, sadə mətn kimi qaytır
        return NextResponse.json({
          motivation: text.split('\n')[0] || text.substring(0, 200),
          goals: '',
          qualifications: '',
          conclusion: ''
        });
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Parse xətası olarsa, sadə mətn qaytır
      return NextResponse.json({
        motivation: text.substring(0, 200),
        goals: '',
        qualifications: '',
        conclusion: ''
      });
    }

  } catch (error) {
    console.error('AI motivation content generation error:', error);
    
    // Mark API key as failed if it was a Gemini error
    if (error instanceof Error && error.message.includes('API key')) {
      // We would need the apiKeyId here to mark it as failed
      console.error('Gemini API key error detected');
    }

    return NextResponse.json(
      { 
        error: 'AI köməyi zamanı xəta baş verdi',
        details: error instanceof Error ? error.message : 'Naməlum xəta'
      },
      { status: 500 }
    );
  }
}