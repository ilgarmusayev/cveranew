import { NextRequest, NextResponse } from 'next/server';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';
import { validateApiKeyForService, formatApiKeyDisplay } from '@/lib/api-key-validator';
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
      apiKey: fallbackKeys[0],
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
    apiKey: apiKeyInfo.apiKey,
    apiKeyId: apiKeyInfo.id
  };
};

export async function POST(request: NextRequest) {
  let apiKeyId: string | null = null;
  
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' }, 
        { status: 400 }
      );
    }

    // Get Gemini API key from database or fallback
    const { apiKey, apiKeyId: keyId } = await getGeminiAI();
    apiKeyId = keyId;

    // Use v1 API with gemini-2.5-flash model (sərfəli və sürətli)
    const geminiV1 = new GeminiV1Client(apiKey);
    let text: string;
    
    try {
      text = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      if (!text) {
        throw new Error('No content generated from gemini-2.5-flash');
      }
    } catch (error) {
      console.log('🔄 Trying fallback to gemini-2.0-flash...');
      
      // Fallback to v1 API with gemini-2.0-flash
      try {
        text = await geminiV1.generateContent('gemini-2.0-flash', prompt);
        
        if (!text) {
          throw new Error('No content generated from fallback model');
        }
      } catch (fallbackError) {
        console.error('Both gemini-2.5-flash and gemini-2.0-flash failed:', fallbackError);
        throw new Error('All Gemini models failed to generate content');
      }
    }

    // Record successful API usage
    if (apiKeyId) {
      await recordApiUsage(apiKeyId, true, text);
    }

    return NextResponse.json({ 
      text: text.trim(),
      success: true 
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Mark API key as failed if we used a database key
    if (apiKeyId) {
      await markApiKeyFailed(apiKeyId, error instanceof Error ? error.message : 'Unknown error');
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}