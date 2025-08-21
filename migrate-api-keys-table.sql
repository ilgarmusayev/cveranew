-- Migration script to update existing ApiKey table for admin-controlled API management
-- This script safely adds new columns without losing existing data

-- First, add new columns with default values
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "serviceName" VARCHAR(255);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "apiUrl" VARCHAR(255);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "dailyLimit" INTEGER;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "currentUsage" INTEGER DEFAULT 0;
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "lastResetDate" TIMESTAMP DEFAULT NOW();
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "createdBy" VARCHAR(255);
ALTER TABLE "ApiKey" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Update existing records with appropriate values
UPDATE "ApiKey" SET
  "serviceName" = CASE
    WHEN "service" = 'linkedin_scraping' THEN 'scrapingdog_linkedin'
    WHEN "service" = 'rapidapi' THEN 'rapidapi_linkedin'
    ELSE CONCAT('legacy_', "service")
  END,
  "apiUrl" = CASE
    WHEN "service" = 'linkedin_scraping' THEN 'https://api.scrapingdog.com/linkedin'
    WHEN "service" = 'rapidapi' THEN 'https://linkedin-api.rapidapi.com'
    ELSE 'https://api.example.com'
  END,
  "isActive" = "active",
  "dailyLimit" = CASE
    WHEN "dailyLimit" IS NOT NULL THEN "dailyLimit"
    ELSE 1000
  END,
  "currentUsage" = COALESCE("dailyUsage", 0),
  "lastResetDate" = COALESCE("lastReset", NOW()),
  "notes" = CONCAT('Migrated from legacy system. Original service: ', "service")
WHERE "serviceName" IS NULL;

-- Make serviceName unique after updating
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_serviceName_unique" UNIQUE ("serviceName");

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "ApiKey_serviceName_isActive_idx" ON "ApiKey"("serviceName", "isActive");

-- Optional: Remove old columns (uncomment if you want to clean up)
-- ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "service";
-- ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "priority";
-- ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "usageCount";
-- ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "lastUsed";
-- ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "lastResult";
