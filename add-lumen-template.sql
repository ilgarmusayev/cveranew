-- Add the new Lumen Template - Clean, Bright & Clear Visual Design
-- This script adds the Lumen template based on ATS design but with white left panel

-- Insert Lumen template
INSERT INTO "Template" (
    id, 
    name, 
    tier, 
    "previewUrl", 
    description,
    "createdAt",
    "updatedAt"
) VALUES (
    'lumen',
    'Lumen',
    'free',
    '/templates/lumen-preview.jpg',
    'Aydın, oxunaqlı və təmiz vizuallı şablon. ATS dizaynı əsasında ağ sol panel ilə.',
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    description = EXCLUDED.description,
    "updatedAt" = NOW();

-- Show all templates to verify the addition
SELECT id, name, tier, description FROM "Template" ORDER BY "createdAt";
