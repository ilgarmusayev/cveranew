import { getBestApiKey, recordApiKeyUsage } from '@/lib/api-key-manager';
import axios from 'axios';

interface ApiCallResult {
  success: boolean;
  data?: any;
  error?: string;
  keyUsed?: string;
  attemptsCount?: number;
}

/**
 * Enhanced API caller with automatic fallback between multiple keys
 * @param service - Service name (scrapingdog, rapidapi, etc.)
 * @param apiCall - Function that makes the API call with a given key
 * @param maxRetries - Maximum number of different keys to try (default: 3)
 */
export async function callApiWithFallback(
  service: string,
  apiCall: (apiKey: string) => Promise<any>,
  maxRetries: number = 3
): Promise<ApiCallResult> {

  let lastError = '';
  let attemptCount = 0;
  const usedKeys: string[] = [];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    attemptCount++;

    try {
      console.log(`🔄 ${service} API çağırışı (cəhd ${attempt + 1}/${maxRetries})`);

      // Get next best available API key
      const keyResult = await getBestApiKey(service);

      if (!keyResult.success) {
        lastError = keyResult.error || 'API key tapılmadı';
        console.warn(`⚠️ ${service} API key alına bilmədi:`, lastError);
        continue;
      }

      // Skip if we already used this key in previous attempts
      if (usedKeys.includes(keyResult.apiKey!)) {
        console.log(`🔄 Key artıq istifadə edilib, növbəti key axtarılır...`);
        continue;
      }

      usedKeys.push(keyResult.apiKey!);

      try {
        console.log(`📡 ${service} API çağırışı key ilə: ${keyResult.apiKey!.substring(0, 8)}***`);

        // Make the actual API call
        const result = await apiCall(keyResult.apiKey!);

        // Record successful usage
        await recordApiKeyUsage(keyResult.keyId!, true);

        console.log(`✅ ${service} API uğurlu (${attempt + 1} cəhddə)`);

        return {
          success: true,
          data: result,
          keyUsed: keyResult.keyId,
          attemptsCount: attemptCount
        };

      } catch (apiError: any) {
        console.warn(`❌ ${service} API xətası:`, apiError.message);

        // Record failed usage
        await recordApiKeyUsage(keyResult.keyId!, false, apiError.message);

        lastError = apiError.message;

        // Check if this is a limit/quota error (should try next key)
        const isLimitError = apiError.response?.status === 429 ||
                           apiError.message.toLowerCase().includes('limit') ||
                           apiError.message.toLowerCase().includes('quota') ||
                           apiError.response?.status === 403;

        if (!isLimitError && attempt === 0) {
          // If it's not a limit error and first attempt, might be temporary - try once more with same service
          console.log(`🔄 Müvəqqəti xəta, yenidən cəhd edilir...`);
          continue;
        }

        console.log(`⏭️ ${isLimitError ? 'Limit xətası' : 'API xətası'}, növbəti key-ə keçirik...`);
      }

    } catch (systemError: any) {
      console.error(`💥 ${service} sistem xətası:`, systemError);
      lastError = systemError.message;
    }
  }

  // All attempts failed
  console.error(`❌ ${service} API: Bütün cəhdlər uğursuz (${attemptCount} cəhd)`);

  return {
    success: false,
    error: `${service} API: ${lastError} (${attemptCount} key cəhd edildi)`,
    attemptsCount: attemptCount
  };
}

/*** BrightData specific API caller with fallback (replacing ScrapingDog)
 */
export async function callScrapingDogAPI(linkedinUsername: string): Promise<ApiCallResult> {
  return callApiWithFallback('brightdata', async (apiKey: string) => {
    const response = await axios.post('https://api.brightdata.com/dca/dataset/get_snapshot', {
      dataset_id: 'linkedin_public_data',
      format: 'json',
      filters: {
        profile_url: `https://linkedin.com/in/${linkedinUsername}`
      },
      exclude_fields: ['skills', 'endorsements', 'skill_assessments'] // Skills xaric edilir
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error(`BrightData cavab vermedi: ${response.status}`);
    }
  }, 3); // Maximum 3 different BrightData keys to try
}

/**
 * RapidAPI specific API caller with fallback - ONLY for skills data
 */
export async function callRapidAPIForSkills(linkedinUrl: string): Promise<ApiCallResult> {
  return callApiWithFallback('rapidapi', async (apiKey: string) => {
    const response = await axios.get('https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile', {
      params: {
        linkedin_url: linkedinUrl,
        include_skills: 'true',
        include_experience: 'false',
        include_education: 'false',
        include_projects: 'false'
      },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com'
      },
      timeout: 25000
    });

    if (response.status === 200 && response.data) {
      // Extract only skills data from RapidAPI response
      return {
        skills: response.data.skills || []
      };
    } else {
      throw new Error(`RapidAPI cavab vermedi: ${response.status}`);
    }
  }, 3); // Maximum 3 different RapidAPI keys to try
}
