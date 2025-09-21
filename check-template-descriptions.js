const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplateDescriptions() {
  try {
    console.log('Template açıqlamalarını yoxlayırıq...\n');

    const templates = await prisma.template.findMany({
      select: {
        name: true,
        description: true,
        description_en: true,
        tier: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`🔍 Toplam ${templates.length} template tapıldı:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.tier})`);
      console.log(`   AZ: ${template.description || '❌ YOX'}`);
      console.log(`   EN: ${template.description_en || '❌ YOX'}`);
      console.log('');
    });

    // Description_en olmayan template-ləri say
    const missingEn = templates.filter(t => !t.description_en).length;
    const missingAz = templates.filter(t => !t.description).length;

    console.log(`📊 Statistika:`);
    console.log(`- İngilis dili açıqlaması olmayan: ${missingEn}`);
    console.log(`- Azərbaycan dili açıqlaması olmayan: ${missingAz}`);

  } catch (error) {
    console.error('Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplateDescriptions();