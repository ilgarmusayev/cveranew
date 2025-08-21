-- Add missing linkedinUsername column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedinUsername" TEXT;

-- Add index for better performance (optional)
CREATE INDEX IF NOT EXISTS "User_linkedinUsername_idx" ON "User"("linkedinUsername");
