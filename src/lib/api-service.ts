import { prisma } from '@/lib/prisma';
import { validateApiKeyForService } from '@/lib/api-key-validator';


export interface ApiKeyInfo {
  id: string;
  service: string;
  apiKey: string;
  active: boolean;
  priority: number;
  usageCount: number;
  dailyLimit: number;
  dailyUsage: number;
  lastUsed: Date | null;
  lastResult: string | null;
}

/**
 * Get active API keys for a specific service, ordered by priority
 */
export async function getActiveApiKeys(service: string): Promise<ApiKeyInfo[]> {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: service,
        active: true,
        dailyUsage: {
          lt: prisma.apiKey.fields.dailyLimit
        }
      },
      orderBy: [
        { priority: 'asc' },
        { usageCount: 'asc' },
        { lastUsed: 'asc' }
      ]
    });

    return apiKeys;
  } catch (error) {
    console.error(`Error fetching API keys for ${service}:`, error);
    return [];
  }
}

/**
 * Get the best available API key for a service (highest priority, lowest usage)
 */
export async function getBestApiKey(service: string): Promise<ApiKeyInfo | null> {
  const apiKeys = await getActiveApiKeys(service);
  
  // Filter and validate API keys for the service
  const validApiKeys = apiKeys.filter(key => {
    const isValid = validateApiKeyForService(key.apiKey, service);
    if (!isValid) {
      console.warn(`⚠️ Invalid API key format for ${service}: ${key.id} (${key.apiKey.substring(0, 10)}...)`);
    }
    return isValid;
  });
  
  if (validApiKeys.length === 0) {
    console.error(`❌ No valid API keys found for service: ${service}`);
    return null;
  }
  
  const selectedKey = validApiKeys[0];
  console.log(`✅ Selected valid API key for ${service}: ${selectedKey.id} (${selectedKey.apiKey.substring(0, 10)}...)`);
  
  return selectedKey;
}

/**
 * Record API key usage and update statistics
 */
export async function recordApiUsage(
  apiKeyId: string, 
  success: boolean, 
  result?: string
): Promise<void> {
  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        usageCount: { increment: 1 },
        dailyUsage: { increment: 1 },
        lastUsed: new Date(),
        lastResult: result || (success ? 'SUCCESS' : 'FAILED')
      }
    });
  } catch (error) {
    console.error('Error recording API usage:', error);
  }
}

/**
 * Mark API key as failed and potentially deactivate it
 */
export async function markApiKeyFailed(apiKeyId: string, error: string): Promise<void> {
  try {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastResult: `FAILED: ${error}`,
        lastUsed: new Date()
      }
    });
  } catch (error) {
    console.error('Error marking API key as failed:', error);
  }
}

/**
 * Reset daily usage for all API keys (should be run daily)
 */
export async function resetDailyUsage(): Promise<void> {
  try {
    await prisma.apiKey.updateMany({
      data: {
        dailyUsage: 0,
        lastReset: new Date()
      }
    });
  } catch (error) {
    console.error('Error resetting daily usage:', error);
  }
}

/**
 * Get API key for ScrapingDog service
 */
export async function getScrapingDogApiKey(): Promise<string | null> {
  const apiKey = await getBestApiKey('scrapingdog');
  return apiKey?.apiKey || null;
}

/**
 * Get API key for Gemini service  
 */
export async function getGeminiApiKey(): Promise<string | null> {
  const apiKey = await getBestApiKey('gemini');
  return apiKey?.apiKey || null;
}

/**
 * Get API key for OpenAI service
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  const apiKey = await getBestApiKey('openai');
  return apiKey?.apiKey || null;
}

/**
 * Get API key for LinkedIn service
 */
export async function getLinkedInApiKey(): Promise<string | null> {
  const apiKey = await getBestApiKey('linkedin');
  return apiKey?.apiKey || null;
}

/**
 * Get API key for RapidAPI service
 */
export async function getRapidApiKey(): Promise<string | null> {
  const apiKey = await getBestApiKey('rapidapi');
  return apiKey?.apiKey || null;
}
