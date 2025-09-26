-- Add working Gemini API key to database
-- This is the key that was confirmed to be working: AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM

-- First, check if ApiKey table has the necessary structure
-- If using the old structure, insert into ApiKey table
INSERT INTO "ApiKey" (
  "service", 
  "key", 
  "serviceName", 
  "apiUrl", 
  "isActive", 
  "dailyLimit", 
  "currentUsage", 
  "lastResetDate", 
  "notes"
) VALUES (
  'gemini',
  'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM',
  'gemini',
  'https://generativelanguage.googleapis.com',
  true,
  1000,
  0,
  NOW(),
  'Working Gemini API key - primary key for AI translations and content generation'
) ON CONFLICT (service) DO UPDATE SET
  "key" = EXCLUDED."key",
  "notes" = EXCLUDED."notes",
  "isActive" = true,
  "currentUsage" = 0,
  "lastResetDate" = NOW();

-- If using the new api_keys table structure, also insert there
INSERT INTO api_keys (
  service_name, 
  api_key, 
  api_url, 
  is_active, 
  daily_limit, 
  current_usage, 
  last_reset_date, 
  notes,
  created_by
) VALUES (
  'gemini',
  'AIzaSyC2ibKvEuDyilAwgMKUBIRiwkAdz1ROGdM',
  'https://generativelanguage.googleapis.com',
  true,
  1000,
  0,
  CURRENT_DATE,
  'Working Gemini API key - primary key for AI translations and content generation',
  1
) ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  notes = EXCLUDED.notes,
  is_active = true,
  current_usage = 0,
  last_reset_date = CURRENT_DATE;

-- Check the result
SELECT * FROM "ApiKey" WHERE "service" = 'gemini';
SELECT * FROM api_keys WHERE service_name = 'gemini';