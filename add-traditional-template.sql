// Ənənəvi CV template-ini database-ə əlavə etmək üçün SQL komandası
INSERT INTO "Template" (id, name, tier, "previewUrl", description, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Ənənəvi CV',
  'Free',
  '/templates/traditional-preview.jpg',
  'Klassik və peşəkar dizaynlı ənənəvi CV şablonu. Tünd yan panel və ağ əsas sahə ilə. Resume1 faylından hazırlanmışdır.',
  NOW(),
  NOW()
);

