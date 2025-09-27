import { getBestApiKey, getNextApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';

// Manual Gemini v1 API client with smart API key rotation
export class GeminiV1Client {
  constructor(private apiKey: string, private apiKeyId?: string) {}
  
  // Static method to create client with automatic API key selection
  static async create(): Promise<GeminiV1Client> {
    const apiKeyInfo = await getBestApiKey('gemini');
    if (!apiKeyInfo) {
      throw new Error('No valid Gemini API key available');
    }
    return new GeminiV1Client(apiKeyInfo.apiKey, apiKeyInfo.id);  
  }

  async generateContent(model: string, prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${this.apiKey}`;
    
    // Model-specific configuration
    const getModelConfig = (modelName: string) => {
      if (modelName.includes('2.5-flash')) {
        return {
          temperature: 0.2, // Very consistent for JSON
          topK: 15,
          topP: 0.7,
          maxOutputTokens: 8192,
        };
      } else if (modelName.includes('2.0-flash')) {
        return {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
        };
      } else {
        return {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 4096,
        };
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: getModelConfig(model)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = `Gemini v1 API error: ${response.status} - ${errorText}`;
      
      // Record failure and check if we should rotate keys
      if (this.apiKeyId) {
        await markApiKeyFailed(this.apiKeyId, error);
        
        // If it's an overload/quota error, try next API key
        const isOverloadError = response.status === 429 || 
                               errorText.includes('quota') || 
                               errorText.includes('limit') ||
                               errorText.includes('overload');
        
        if (isOverloadError) {
          console.log(`🔄 API key overloaded, trying next key...`);
          const nextApiKey = await getNextApiKey('gemini', this.apiKeyId);
          
          if (nextApiKey) {
            // Retry with next API key
            console.log(`🔁 Retrying with next API key: ${nextApiKey.id}`);
            const retryClient = new GeminiV1Client(nextApiKey.apiKey, nextApiKey.id);
            return await retryClient.generateContent(model, prompt);
          }
        }
      }
      
      throw new Error(error);
    }

    const data = await response.json();
    
    // Debug log for response structure
    console.log('🔍 Gemini v1 API Response Structure:', JSON.stringify(data, null, 2).substring(0, 500));
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates in response:', data);
      throw new Error('No response from Gemini v1 API');
    }

    // Try multiple possible response structures
    let text = null;
    
    // Standard structure: candidates[0].content.parts[0].text
    if (data.candidates[0]?.content?.parts?.[0]?.text) {
      text = data.candidates[0].content.parts[0].text;
    }
    // Alternative structure: candidates[0].text
    else if (data.candidates[0]?.text) {
      text = data.candidates[0].text;
    }
    // Alternative structure: candidates[0].output
    else if (data.candidates[0]?.output) {
      text = data.candidates[0].output;
    }
    // Alternative structure: direct text in candidate
    else if (typeof data.candidates[0] === 'string') {
      text = data.candidates[0];
    }
    
    if (!text) {
      console.error('❌ Could not extract text from response structure:', data.candidates[0]);
      throw new Error('Invalid response structure from Gemini v1 API');
    }

    // Record successful usage
    if (this.apiKeyId) {
      await recordApiUsage(this.apiKeyId, true, `${model} success`);
    }

    return text.trim();
  }
}