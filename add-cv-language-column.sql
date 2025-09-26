-- Add cvLanguage column to CV table
ALTER TABLE "CV" ADD COLUMN "cvLanguage" TEXT DEFAULT 'az';

-- Update existing CVs to have default language based on content analysis
UPDATE "CV" SET "cvLanguage" = 'ru' WHERE cv_data::text ILIKE '%русский%' OR cv_data::text ILIKE '%инженер%' OR cv_data::text ILIKE '%москва%';
UPDATE "CV" SET "cvLanguage" = 'en' WHERE "cvLanguage" = 'az' AND (cv_data::text ILIKE '%engineer%' OR cv_data::text ILIKE '%manager%' OR cv_data::text ILIKE '%developer%');

-- Add comment for documentation
COMMENT ON COLUMN "CV"."cvLanguage" IS 'Language of the CV content (az, en, ru)';