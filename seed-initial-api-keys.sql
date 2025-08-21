-- Initial API keys for the system
INSERT INTO "ApiKey" (id, service, "apiKey", active, priority, "dailyLimit", "usageCount", "dailyUsage", "lastReset", "createdAt", "updatedAt") VALUES
-- ScrapingDog API Key
('scrapingdog-1', 'scrapingdog', '6882894b855f5678d36484c8', true, 1, 1000, 0, 0, NOW(), NOW(), NOW()),

-- RapidAPI Key for LinkedIn
('rapidapi-1', 'rapidapi', 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4', true, 1, 500, 0, 0, NOW(), NOW(), NOW())

ON CONFLICT (id) DO NOTHING;
