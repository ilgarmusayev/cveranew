-- Add the new Exclusive Template as the 4th template
-- This script adds the Exclusive template while keeping Medium Professional as is

-- Insert Exclusive template
INSERT INTO templates (id, name, tier, preview_url, created_at, updated_at, ordering)
VALUES (
  'exclusive',
  'Exclusive',
  'Premium',
  '/templates/exclusive-preview.jpg',
  NOW(),
  NOW(),
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  preview_url = EXCLUDED.preview_url,
  updated_at = NOW(),
  ordering = EXCLUDED.ordering;

-- Update template ordering to ensure proper sequence
UPDATE templates SET ordering = 1 WHERE id = 'basic';
UPDATE templates SET ordering = 2 WHERE id = 'ats';
UPDATE templates SET ordering = 3 WHERE id = 'medium';
UPDATE templates SET ordering = 4 WHERE id = 'exclusive';

-- Show all templates with their ordering
SELECT id, name, tier, ordering FROM templates ORDER BY ordering;
