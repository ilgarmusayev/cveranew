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
  
  // Smart selection: prefer keys with recent success and low usage
  const scoredKeys = validApiKeys.map(key => {
    let score = 100 - key.priority; // Lower priority = higher score
    
    // Bonus for recent success
    if (key.lastResult?.includes('SUCCESS')) {
      score += 20;
    }
    
    // Penalty for recent failures
    if (key.lastResult?.includes('FAILED')) {
      score -= 30;
    }
    
    // Penalty for high usage
    const usageRatio = key.dailyUsage / key.dailyLimit;
    score -= usageRatio * 50;
    
    // Bonus for being unused recently
    if (!key.lastUsed || (Date.now() - key.lastUsed.getTime()) > 300000) { // 5 minutes
      score += 10;
    }
    
    return { ...key, score };
  });
  
  // Sort by score (highest first)
  scoredKeys.sort((a, b) => b.score - a.score);
  
  const selectedKey = scoredKeys[0];
  console.log(`✅ Selected API key for ${service}: ${selectedKey.id} (Priority: ${selectedKey.priority}, Score: ${selectedKey.score.toFixed(1)}, Usage: ${selectedKey.dailyUsage}/${selectedKey.dailyLimit})`);
  
  return selectedKey;
}

/**
 * Get next available API key when current one fails (smart rotation)
 */
export async function getNextApiKey(service: string, failedKeyId?: string): Promise<ApiKeyInfo | null> {
  const apiKeys = await getActiveApiKeys(service);
  
  // Filter out the failed key and invalid formats
  const validApiKeys = apiKeys.filter(key => {
    if (failedKeyId && key.id === failedKeyId) {
      return false; // Skip the failed key
    }
    
    return validateApiKeyForService(key.apiKey, service);
  });
  
  if (validApiKeys.length === 0) {
    console.error(`❌ No alternative API keys available for service: ${service}`);
    return null;
  }
  
  const nextKey = validApiKeys[0];
  console.log(`🔄 Switching to next API key for ${service}: ${nextKey.id} (Priority: ${nextKey.priority})`);
  
  return nextKey;
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
    // Check if this is an overload/quota error
    const isOverloadError = error.includes('quota') || 
                           error.includes('limit') || 
                           error.includes('overload') ||
                           error.includes('429') ||
                           error.includes('rate limit') ||
                           error.includes('too many requests');
    
    const isAuthError = error.includes('401') || 
                       error.includes('403') || 
                       error.includes('invalid') ||
                       error.includes('unauthorized');
    
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: {
        lastResult: `FAILED: ${error}`,
        lastUsed: new Date(),
        // Temporarily deactivate if quota/overload error
        active: isOverloadError ? false : undefined,
        // Mark for review if auth error  
        priority: isAuthError ? 999 : undefined
      }
    });
    
    if (isOverloadError) {
      console.log(`🚫 API key ${apiKeyId} temporarily deactivated due to overload/quota: ${error}`);
      
      // Reactivate after 1 hour for quota issues
      setTimeout(async () => {
        try {
          await prisma.apiKey.update({
            where: { id: apiKeyId },
            data: { active: true }
          });
          console.log(`✅ API key ${apiKeyId} reactivated after cooldown period`);
        } catch (e) {
          console.error('Error reactivating API key:', e);
        }
      }, 60 * 60 * 1000); // 1 hour
    }
    
    if (isAuthError) {
      console.log(`🔐 API key ${apiKeyId} marked for review due to auth error: ${error}`);
    }
    
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
