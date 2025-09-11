-- Production API Keys Migration
-- Bu script production database-də API açarlarını yaradır

-- 1. ScrapingDog API açarı (production-da dəyişdirilməlidir)
INSERT INTO "ApiKey" (
  "id",
  "service", 
  "apiKey", 
  "active", 
  "priority", 
  "usageCount", 
  "dailyLimit", 
  "dailyUsage",
  "lastReset",
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'scrapingdog',
  'PRODUCTION_SCRAPINGDOG_API_KEY_HERE', -- Production-da dəyişdirilməli
  true,
  1,
  0,
  1000,
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (service, "apiKey") DO NOTHING;

-- 2. Gemini AI API açarı (production-da dəyişdirilməlidir)
INSERT INTO "ApiKey" (
  "id",
  "service", 
  "apiKey", 
  "active", 
  "priority", 
  "usageCount", 
  "dailyLimit", 
  "dailyUsage",
  "lastReset",
  "createdAt", 
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'gemini',
  'PRODUCTION_GEMINI_API_KEY_HERE', -- Production-da dəyişdirilməli
  true,
  1,
  0,
  1000,
  0,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (service, "apiKey") DO NOTHING;

-- 3. Check if API keys were created
SELECT 
  id,
  service,
  active,
  priority,
  "usageCount",
  "dailyLimit",
  "createdAt"
FROM "ApiKey" 
WHERE service IN ('scrapingdog', 'gemini')
ORDER BY service, priority;
