-- Check existing columns in User table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- Add loginMethod column if it doesn't exist
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;

-- Add index for better performance (optional)
CREATE INDEX IF NOT EXISTS "User_loginMethod_idx" ON "User"("loginMethod");

-- Update existing LinkedIn users to have loginMethod = 'linkedin'
UPDATE "User"
SET "loginMethod" = 'linkedin'
WHERE "linkedinId" IS NOT NULL AND "loginMethod" IS NULL;
