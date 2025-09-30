-- Add BrightData API key to api_keys table
INSERT INTO api_keys (
  service_name, 
  api_key, 
  api_url, 
  daily_limit, 
  notes, 
  created_by,
  is_active
) VALUES (
  'brightdata_linkedin', 
  'your_brightdata_token_here', 
  'https://api.brightdata.com', 
  100, 
  'LinkedIn profile scraping via BrightData datasets', 
  1,
  true
) ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  api_url = EXCLUDED.api_url,
  daily_limit = EXCLUDED.daily_limit,
  notes = EXCLUDED.notes,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the insertion
SELECT id, service_name, api_key, api_url, daily_limit, is_active, notes 
FROM api_keys 
WHERE service_name = 'brightdata_linkedin';