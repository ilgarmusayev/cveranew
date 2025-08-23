const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addBasicTemplate() {
  try {
    // Check if Basic template already exists
    const existingBasic = await prisma.template.findFirst({
      where: { name: 'Basic' }
    });

    if (existingBasic) {
      console.log('✅ Basic template artıq mövcuddur:', existingBasic.id);
      return;
    }

    // Add Basic template
    const basicTemplate = await prisma.template.create({
      data: {
        name: 'Basic',
        tier: 'Free',
        previewUrl: '/templates/basic-preview.jpg',
        description: 'Sadə və təmiz dizayn ilə əsas CV şablonu. Yeni başlayanlar üçün mükəmməl seçim.'
      }
    });

    console.log('🎯 Basic template əlavə edildi:', basicTemplate);

  } catch (error) {
    console.error('❌ Basic template əlavə edilərkən xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBasicTemplate();
