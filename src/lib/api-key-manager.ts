import { prisma } from '@/lib/prisma';


export interface ApiKeyResult {
  success: boolean;
  apiKey?: string;
  error?: string;
  keyId?: string;
}

/**
 * Get the best available API key for a service
 * @param service - Service name (scrapingdog, rapidapi, openai, etc.)
 * @returns Promise with API key or error
 */
export async function getBestApiKey(service: string): Promise<ApiKeyResult> {
  try {
    // Get all active API keys for the service, ordered by priority and usage
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        service: service.toLowerCase(),
        active: true
      },
      orderBy: [
        { priority: 'asc' },        // Lower priority number = higher priority
        { dailyUsage: 'asc' },      // Lower usage first
        { usageCount: 'asc' }       // Lower total usage first
      ]
    });

    if (apiKeys.length === 0) {
      return {
        success: false,
        error: `${service} üçün aktiv API key tapılmadı`
      };
    }

    // Check daily limits and find best key
    const now = new Date();

    for (const key of apiKeys) {
      // Reset daily usage if it's a new day
      const lastReset = new Date(key.lastReset);
      const isNewDay = now.toDateString() !== lastReset.toDateString();

      if (isNewDay) {
        await prisma.apiKey.update({
          where: { id: key.id },
          data: {
            dailyUsage: 0,
            lastReset: now
          }
        });
        key.dailyUsage = 0;
      }

      // Check if this key is within daily limit
      if (key.dailyUsage < key.dailyLimit) {
        return {
          success: true,
          apiKey: key.apiKey,
          keyId: key.id
        };
      }
    }

    return {
      success: false,
      error: `${service} üçün bütün API key-lər günlük limitə çatıb`
    };

  } catch (error) {
    console.error('API key seçimi xətası:', error);
    return {
      success: false,
      error: 'API key seçimi zamanı xəta baş verdi'
    };
  }
}

/**
 * Record API key usage
 * @param keyId - API key ID
 * @param success - Whether the API call was successful
 * @param error - Error message if failed
 */
export async function recordApiKeyUsage(
  keyId: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        usageCount: { increment: 1 },
        dailyUsage: { increment: 1 },
        lastUsed: new Date(),
        lastResult: success ? 'SUCCESS' : 'FAILED'
      }
    });

    console.log(`API key usage recorded: ${keyId}, success: ${success}`);
  } catch (error) {
    console.error('API key usage qeydə alınmadı:', error);
  }
}

/**
 * Get API key statistics
 * @param service - Optional service filter
 */
export async function getApiKeyStats(service?: string) {
  try {
    const whereClause = service ? { service: service.toLowerCase() } : {};

    const stats = await prisma.apiKey.groupBy({
      by: ['service'],
      where: {
        ...whereClause,
        active: true
      },
      _count: {
        id: true
      },
      _sum: {
        usageCount: true,
        dailyUsage: true
      },
      _avg: {
        dailyUsage: true
      }
    });

    return stats;
  } catch (error) {
    console.error('API key statistikası alınmadı:', error);
    return [];
  }
}

/**
 * Check if any API keys need attention (high usage, failures, etc.)
 */
export async function checkApiKeyHealth() {
  try {
    const warnings: Array<{
      type: string;
      service: string;
      message: string;
    }> = [];

    // Check for keys near daily limit (90% threshold)
    const allActiveKeys = await prisma.apiKey.findMany({
      where: {
        active: true
      },
      select: {
        id: true,
        service: true,
        dailyUsage: true,
        dailyLimit: true
      }
    });

    // Filter keys that are near their limit (90% or higher)
    const nearLimitKeys = allActiveKeys.filter(key => {
      const usagePercentage = (key.dailyUsage / key.dailyLimit) * 100;
      return usagePercentage >= 90;
    });

    nearLimitKeys.forEach(key => {
      warnings.push({
        type: 'NEAR_LIMIT',
        service: key.service,
        message: `${key.service} API key günlük limitin 90%-na çatıb (${key.dailyUsage}/${key.dailyLimit})`
      });
    });

    // Check for recently failed keys
    const failedKeys = await prisma.apiKey.findMany({
      where: {
        active: true,
        lastResult: 'FAILED',
        lastUsed: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        id: true,
        service: true,
        lastUsed: true
      }
    });

    failedKeys.forEach(key => {
      warnings.push({
        type: 'RECENT_FAILURE',
        service: key.service,
        message: `${key.service} API key son 24 saatda uğursuz olub`
      });
    });

    return warnings;
  } catch (error) {
    console.error('API key health check xətası:', error);
    return [];
  }
}

// Export prisma instance for cleanup
export { prisma as apiKeyPrisma };
