-- Add Prime Template to Templates Table
-- Professional Executive Style CV Template with modern design

INSERT INTO templates (
    id, 
    name, 
    preview_url, 
    is_premium, 
    category, 
    description, 
    features,
    template_order,
    created_at, 
    updated_at
) VALUES (
    'prime',
    'Prime',
    '/api/templates/prime/preview',
    true,
    'professional',
    'Professional executive-style CV template with modern design, gradient accents, and clean card-based layout. Perfect for senior professionals and executives.',
    ARRAY[
        'Executive-style header with gradient accent',
        'Modern card-based section layouts',
        'Professional color scheme with blue accents',
        'Timeline-style experience section',
        'Categorized skills display',
        'Clean typography and spacing',
        'Export-ready PDF format',
        'Mobile-responsive design',
        'Drag & drop section reordering',
        'Professional contact grid layout'
    ],
    9, -- Order after existing templates
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    preview_url = EXCLUDED.preview_url,
    is_premium = EXCLUDED.is_premium,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    template_order = EXCLUDED.template_order,
    updated_at = NOW();

-- Verify the template was added
SELECT 
    id, 
    name, 
    is_premium, 
    category, 
    description,
    template_order
FROM templates 
WHERE id = 'prime';
