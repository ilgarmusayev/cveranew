const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTraditionalTemplate() {
  try {
    console.log('Ənənəvi CV template-i əlavə edilir...');

    // Əvvəlcə mövcud template-i yoxla
    const existingTemplate = await prisma.template.findFirst({
      where: { name: 'Ənənəvi CV' }
    });

    if (existingTemplate) {
      console.log('Ənənəvi CV template-i artıq mövcuddur:', existingTemplate.id);
      return;
    }

    // Yeni template yarat
    const newTemplate = await prisma.template.create({
      data: {
        name: 'Ənənəvi CV',
        tier: 'Free',
        previewUrl: '/templates/traditional-preview.jpg',
        description: 'Klassik və peşəkar dizaynlı ənənəvi CV şablonu. Tünd yan panel və ağ əsas sahə ilə.',
      }
    });

    console.log('✅ Ənənəvi CV template-i uğurla əlavə edildi:', newTemplate.id);
    console.log('Template məlumatları:', {
      id: newTemplate.id,
      name: newTemplate.name,
      tier: newTemplate.tier,
      previewUrl: newTemplate.previewUrl
    });

  } catch (error) {
    console.error('❌ Template əlavə edilərkən xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTraditionalTemplate();
