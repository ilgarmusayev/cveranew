-- Manual SQL script to clean up templates
-- Run this directly in your PostgreSQL database

-- Remove modern templates
DELETE FROM templates WHERE id IN ('modern-centered', 'modern');

-- Update any CVs using modern templates to use basic template
UPDATE cvs SET template_id = 'basic' WHERE template_id IN ('modern-centered', 'modern');

-- Insert Medium template
INSERT INTO templates (id, name, tier, preview_url, created_at, updated_at, ordering)
VALUES (
  'medium',
  'Medium Professional',
  'Medium',
  '/templates/medium-preview.jpg',
  NOW(),
  NOW(),
  2
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  preview_url = EXCLUDED.preview_url,
  updated_at = NOW(),
  ordering = EXCLUDED.ordering;

-- Update template ordering
UPDATE templates SET ordering = 1 WHERE id = 'basic';
UPDATE templates SET ordering = 2 WHERE id = 'medium';
UPDATE templates SET ordering = 3 WHERE id = 'professional';
UPDATE templates SET ordering = 4 WHERE id = 'professional-complex';

-- Display current templates
SELECT id, name, tier, ordering FROM templates ORDER BY ordering, id;
