const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTraditionalTemplate() {
  try {
    console.log('Ənənəvi CV template-i əlavə edilir...');

    // Əvvəlcə mövcud template-i yoxla
    const existingTemplate = await prisma.template.findFirst({
      where: {
        OR: [
          { name: 'Ənənəvi CV' },
          { name: 'Traditional CV' },
          { id: 'traditional' }
        ]
      }
    });

    if (existingTemplate) {
      console.log('Ənənəvi CV template-i artıq mövcuddur:', existingTemplate.id);
      console.log('Mövcud template məlumatları:', {
        id: existingTemplate.id,
        name: existingTemplate.name,
        tier: existingTemplate.tier,
        previewUrl: existingTemplate.previewUrl
      });
      return existingTemplate;
    }

    // Yeni template yarat
    const newTemplate = await prisma.template.create({
      data: {
        id: 'traditional',
        name: 'Ənənəvi CV',
        tier: 'Free',
        previewUrl: '/templates/traditional-preview.jpg',
        description: 'Klassik və peşəkar dizaynlı ənənəvi CV şablonu. Tünd yan panel və ağ əsas sahə ilə hazırlanmış Resume1 faylından.',
      }
    });

    console.log('✅ Ənənəvi CV template-i uğurla əlavə edildi!');
    console.log('Template məlumatları:', {
      id: newTemplate.id,
      name: newTemplate.name,
      tier: newTemplate.tier,
      previewUrl: newTemplate.previewUrl
    });

    return newTemplate;

  } catch (error) {
    console.error('❌ Template əlavə edilərkən xəta:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Template-i əlavə et
addTraditionalTemplate()
  .then((template) => {
    console.log('\n🎉 Ənənəvi CV template-i hazırdır!');
    console.log('Template ID:', template.id);
    console.log('Template adı:', template.name);
  })
  .catch((error) => {
    console.error('Xəta baş verdi:', error);
    process.exit(1);
  });
