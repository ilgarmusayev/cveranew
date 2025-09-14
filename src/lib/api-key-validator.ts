// API Key validation helper functions

/**
 * Validate if API key matches the service type
 */
export function validateApiKeyForService(apiKey: string, service: string): boolean {
  if (!apiKey || !service) return false;

  switch (service.toLowerCase()) {
    case 'gemini':
      // Gemini API keys start with "AIzaSy"
      return apiKey.startsWith('AIzaSy') && apiKey.length >= 20;
      
    case 'scrapingdog':
      // ScrapingDog API keys are 24-character hex strings
      return /^[a-f0-9]{24}$/i.test(apiKey);
      
    case 'openai':
      // OpenAI API keys start with "sk-"
      return apiKey.startsWith('sk-') && apiKey.length >= 40;
      
    case 'anthropic':
      // Anthropic API keys start with "sk-ant-"
      return apiKey.startsWith('sk-ant-') && apiKey.length >= 40;
      
    default:
      return true; // Allow unknown services for now
  }
}

/**
 * Get service type from API key format
 */
export function detectServiceFromApiKey(apiKey: string): string | null {
  if (!apiKey) return null;

  if (apiKey.startsWith('AIzaSy')) {
    return 'gemini';
  } else if (/^[a-f0-9]{24}$/i.test(apiKey)) {
    return 'scrapingdog';
  } else if (apiKey.startsWith('sk-ant-')) {
    return 'anthropic';
  } else if (apiKey.startsWith('sk-')) {
    return 'openai';
  }
  
  return null;
}

/**
 * Format API key display (show first and last few characters)
 */
export function formatApiKeyDisplay(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) return apiKey;
  
  const start = apiKey.substring(0, 8);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}...${end}`;
}

/**
 * Validate and suggest correct service for API key
 */
export function validateAndSuggestService(apiKey: string, selectedService: string): {
  isValid: boolean;
  suggestedService?: string;
  message: string;
} {
  const detectedService = detectServiceFromApiKey(apiKey);
  const isValid = validateApiKeyForService(apiKey, selectedService);

  if (isValid) {
    return {
      isValid: true,
      message: `✅ API key format is valid for ${selectedService}`
    };
  }

  if (detectedService && detectedService !== selectedService) {
    return {
      isValid: false,
      suggestedService: detectedService,
      message: `❌ This API key appears to be for ${detectedService}, not ${selectedService}`
    };
  }

  return {
    isValid: false,
    message: `❌ Invalid API key format for ${selectedService}`
  };
}
