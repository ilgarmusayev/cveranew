-- Check all templates and their Russian descriptions
SELECT 
  name, 
  CASE 
    WHEN description_ru IS NULL OR description_ru = '' THEN 'MISSING'
    ELSE 'OK'
  END as rus_status,
  description_ru
FROM "Template" 
ORDER BY name;