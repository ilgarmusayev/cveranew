-- Lumen template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'İşıqlı və dinamik görünüşə sahibdir. Müasir dizaynı ilə yaradıcılıq və enerjini əks etdirmək istəyənlər üçün ideal seçimdir.',
  description_en = 'Bright and dynamic design with modern layout. Perfect for those who want to reflect creativity and energy in their CV.',
  description_ru = 'Яркий и динамичный дизайн с современной компоновкой. Идеально подходит для тех, кто хочет отразить креативность и энергию в своем резюме.'
WHERE name = 'Lumen';

-- Basic template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'Sadə və təmiz dizaynlı əsas CV şablonu. Yeni başlayanlar və klassik görünüş istəyənlər üçün mükəmməl seçim.',
  description_en = 'Simple and clean basic CV template. Perfect choice for beginners and those who prefer classic appearance.',
  description_ru = 'Простой и чистый базовый шаблон резюме. Идеальный выбор для начинающих и тех, кто предпочитает классический внешний вид.'
WHERE name = 'Basic';

-- Clarity template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'Sade və ATS-dostu dizayn. Ağ arxa plan, tünd narıncı vurğular və təmiz görünüş. Peşəkar və oxunaqlı şablon.',
  description_en = 'Simple and ATS-friendly design. White background with dark orange accents and clean appearance. Professional and readable template.',
  description_ru = 'Простой и ATS-совместимый дизайн. Белый фон с темно-оранжевыми акцентами и чистым внешним видом. Профессиональный и читаемый шаблон.'
WHERE name = 'Clarity';

-- Essence template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'Modern və minimalist dizayn. Yaradıcı peşəkarlıq və müasir mövqelər üçün ideal şablon.',
  description_en = 'Modern and minimalist design. Ideal template for creative professionals and contemporary positions.',
  description_ru = 'Современный и минималистичный дизайн. Идеальный шаблон для творческих профессионалов и современных позиций.'
WHERE name = 'Essence';

-- Prime template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'Premium dizayn elementləri ilə lüks görünüş. Yüksək səviyyəli mövqelər və rəhbər vəzifələr üçün.',
  description_en = 'Luxury appearance with premium design elements. Perfect for high-level positions and executive roles.',
  description_ru = 'Роскошный внешний вид с премиальными элементами дизайна. Идеально подходит для высокоуровневых позиций и руководящих ролей.'
WHERE name = 'Prime';

-- Aurora template üçün yaxşı açıqlamalar
UPDATE "Template" SET 
  description = 'Rəngli və canlı dizayn. Yaradıcı sahələr, reklam və media sektorları üçün uyğun şablon.',
  description_en = 'Colorful and vibrant design. Suitable template for creative fields, advertising and media sectors.',
  description_ru = 'Красочный и яркий дизайн. Подходящий шаблон для творческих областей, рекламы и медиа-секторов.'
WHERE name = 'Aurora';
