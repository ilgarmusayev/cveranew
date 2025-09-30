-- Check if BrightData API key exists in database
SELECT 
    id,
    service,
    key_value,
    is_active,
    created_at
FROM "ApiKey" 
WHERE service = 'brightdata' AND is_active = true
ORDER BY created_at DESC
LIMIT 1;