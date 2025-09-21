-- Template cədvəlinə ingilis dili description sütunu əlavə etmək
-- Bu sayədə hər template üçün həm azərbaycan, həm də ingilis dilində açıqlama olacaq

-- Əvvəlcə yeni sütun əlavə edək
ALTER TABLE templates ADD COLUMN description_en TEXT;

-- Mövcud templatelar üçün ingilis dili açıqlamaları əlavə edək
UPDATE templates SET description_en = 'Modern and professional CV template with contemporary design elements' WHERE name LIKE '%Modern%';
UPDATE templates SET description_en = 'Classic resume design with traditional and formal appearance' WHERE name LIKE '%Classic%';
UPDATE templates SET description_en = 'Creative portfolio template for artistic and design professionals' WHERE name LIKE '%Creative%';
UPDATE templates SET description_en = 'Minimalist CV template with clean and simple design approach' WHERE name LIKE '%Minimalist%';
UPDATE templates SET description_en = 'Professional business template suitable for corporate environments' WHERE name LIKE '%Professional%';
UPDATE templates SET description_en = 'Executive level resume template for senior management positions' WHERE name LIKE '%Executive%';
UPDATE templates SET description_en = 'Technical specialist template optimized for IT and engineering fields' WHERE name LIKE '%Technical%';
UPDATE templates SET description_en = 'Academic research template for education and research professionals' WHERE name LIKE '%Academic%';
UPDATE templates SET description_en = 'Simple and effective design with straightforward layout' WHERE name LIKE '%Simple%';
UPDATE templates SET description_en = 'Elegant professional template with sophisticated visual appeal' WHERE name LIKE '%Elegant%';
UPDATE templates SET description_en = 'Corporate business template for formal business environments' WHERE name LIKE '%Corporate%';
UPDATE templates SET description_en = 'Fresh and modern design with contemporary visual elements' WHERE name LIKE '%Fresh%';
UPDATE templates SET description_en = 'Aurora template with vibrant and dynamic design elements' WHERE name LIKE '%Aurora%';
UPDATE templates SET description_en = 'Clarity template with clear and readable layout structure' WHERE name LIKE '%Clarity%';
UPDATE templates SET description_en = 'Essence template focusing on core professional information' WHERE name LIKE '%Essence%';
UPDATE templates SET description_en = 'Exclusive premium template with unique design features' WHERE name LIKE '%Exclusive%';
UPDATE templates SET description_en = 'Horizon template with expansive and forward-looking design' WHERE name LIKE '%Horizon%';
UPDATE templates SET description_en = 'Lumen template with bright and illuminating visual style' WHERE name LIKE '%Lumen%';
UPDATE templates SET description_en = 'Prime template with top-quality design and premium features' WHERE name LIKE '%Prime%';
UPDATE templates SET description_en = 'Traditional template with timeless and conventional styling' WHERE name LIKE '%Traditional%';
UPDATE templates SET description_en = 'Vertex template with sharp and professional edge design' WHERE name LIKE '%Vertex%';

-- Default açıqlama mövcud template-lər üçün
UPDATE templates SET description_en = 'Professional CV template with modern design and clean layout' WHERE description_en IS NULL;

-- Sütunun structure-ini yoxlayaq
SELECT 
    name,
    description as description_az,
    description_en,
    tier
FROM templates 
ORDER BY name;