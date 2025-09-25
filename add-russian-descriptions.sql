-- Template table-inə rus dilində açıqlama sütunu əlavə et
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS description_ru TEXT;

-- Mövcud templatekər üçün rus dilində açıqlamalar əlavə et
UPDATE "Template" SET description_ru = 'Простая и чистая базовая CV-шаблон. Идеальный выбор для начинающих.' WHERE name = 'Basic';

UPDATE "Template" SET description_ru = 'Простой и ATS-совместимый дизайн. Белый фон, темно-оранжевые акценты и чистый внешний вид. Профессиональный и читаемый шаблон.' WHERE name = 'Clarity';

UPDATE "Template" SET description_ru = 'Современный и минималистичный дизайн. Идеальный шаблон для творческих профессионалов.' WHERE name = 'Essence';

UPDATE "Template" SET description_ru = 'Роскошный внешний вид с премиальными дизайн-элементами. Для высокоуровневых позиций.' WHERE name = 'Prime';

UPDATE "Template" SET description_ru = 'Яркий и живой дизайн. Подходящий шаблон для творческих областей.' WHERE name = 'Aurora';

UPDATE "Template" SET description_ru = 'Светлый и ясный дизайн. Чисто структурированный и профессиональный шаблон.' WHERE name = 'Lumen';
