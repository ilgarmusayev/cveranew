const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTemplateDescriptions() {
  try {
    console.log('Template açıqlamalarını yeniləyirik...');

    // Template adlarına görə ingilis dili açıqlamaları əlavə edək
    const updates = [
      { keywords: ['modern'], description_en: 'Modern and professional CV template with contemporary design elements' },
      { keywords: ['classic'], description_en: 'Classic resume design with traditional and formal appearance' },
      { keywords: ['creative'], description_en: 'Creative portfolio template for artistic and design professionals' },
      { keywords: ['minimalist'], description_en: 'Minimalist CV template with clean and simple design approach' },
      { keywords: ['professional'], description_en: 'Professional business template suitable for corporate environments' },
      { keywords: ['executive'], description_en: 'Executive level resume template for senior management positions' },
      { keywords: ['technical'], description_en: 'Technical specialist template optimized for IT and engineering fields' },
      { keywords: ['academic'], description_en: 'Academic research template for education and research professionals' },
      { keywords: ['simple'], description_en: 'Simple and effective design with straightforward layout' },
      { keywords: ['elegant'], description_en: 'Elegant professional template with sophisticated visual appeal' },
      { keywords: ['corporate'], description_en: 'Corporate business template for formal business environments' },
      { keywords: ['fresh'], description_en: 'Fresh and modern design with contemporary visual elements' },
      { keywords: ['aurora'], description_en: 'Aurora template with vibrant and dynamic design elements' },
      { keywords: ['clarity'], description_en: 'Clarity template with clear and readable layout structure' },
      { keywords: ['essence'], description_en: 'Essence template focusing on core professional information' },
      { keywords: ['exclusive'], description_en: 'Exclusive premium template with unique design features' },
      { keywords: ['horizon'], description_en: 'Horizon template with expansive and forward-looking design' },
      { keywords: ['lumen'], description_en: 'Lumen template with bright and illuminating visual style' },
      { keywords: ['prime'], description_en: 'Prime template with top-quality design and premium features' },
      { keywords: ['traditional'], description_en: 'Traditional template with timeless and conventional styling' },
      { keywords: ['vertex'], description_en: 'Vertex template with sharp and professional edge design' }
    ];

    let updateCount = 0;

    for (const update of updates) {
      for (const keyword of update.keywords) {
        const result = await prisma.template.updateMany({
          where: {
            name: {
              contains: keyword,
              mode: 'insensitive'
            }
          },
          data: {
            description_en: update.description_en
          }
        });
        updateCount += result.count;
        if (result.count > 0) {
          console.log(`✓ ${result.count} template yeniləndi: ${keyword} - ${update.description_en}`);
        }
      }
    }

    // Default açıqlama null olan template-lər üçün
    const defaultResult = await prisma.template.updateMany({
      where: {
        description_en: null
      },
      data: {
        description_en: 'Professional CV template with modern design and clean layout'
      }
    });

    updateCount += defaultResult.count;
    if (defaultResult.count > 0) {
      console.log(`✓ ${defaultResult.count} template default açıqlama ilə yeniləndi`);
    }

    console.log(`\n🎉 Toplam ${updateCount} template açıqlaması yeniləndi!`);

    // Yenilənmiş template-ləri göstərək
    const templates = await prisma.template.findMany({
      select: {
        name: true,
        description: true,
        description_en: true,
        tier: true
      },
      orderBy: { name: 'asc' }
    });

    console.log('\n📋 Yenilənmiş template-lər:');
    templates.forEach(template => {
      console.log(`- ${template.name} (${template.tier})`);
      console.log(`  AZ: ${template.description || 'N/A'}`);
      console.log(`  EN: ${template.description_en || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTemplateDescriptions();