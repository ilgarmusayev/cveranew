-- Add Clarity Template to CV Templates
INSERT INTO cv_templates (
    id,
    name,
    preview_url,
    thumbnail_url,
    category,
    tags,
    is_premium,
    created_at,
    updated_at,
    ordering,
    is_active
) VALUES (
    'clarity',
    'Clarity',
    '/images/templates/clarity-preview.jpg',
    '/images/templates/clarity-thumb.jpg',
    'professional',
    ARRAY['simple', 'clean', 'ats-friendly', 'modern', 'orange', 'white'],
    false,
    NOW(),
    NOW(),
    (SELECT COALESCE(MAX(ordering), 0) + 1 FROM cv_templates),
    true
);

-- Add template description
UPDATE cv_templates 
SET description = 'Clarity - Sade və ATS-dostu dizayn. Ağ arxa plan, tünd narıncı vurğular və təmiz görünüş. Peşəkar və oxunaqlı template.'
WHERE id = 'clarity';

-- Verify the insertion
SELECT * FROM cv_templates WHERE id = 'clarity';
