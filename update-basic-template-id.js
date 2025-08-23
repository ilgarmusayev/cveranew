const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateBasicTemplateId() {
  try {
    // Find current Basic template
    const existingBasic = await prisma.template.findFirst({
      where: { name: 'Basic' }
    });

    if (!existingBasic) {
      console.log('❌ Basic template tapılmadı');
      return;
    }

    console.log('📋 Cari Basic template ID:', existingBasic.id);

    // Check if 'basic' ID already exists
    const basicIdExists = await prisma.template.findUnique({
      where: { id: 'basic' }
    });

    if (basicIdExists && basicIdExists.id !== existingBasic.id) {
      console.log('⚠️ basic ID artıq mövcuddur, əvvəlcə onu siləcəyik');
      await prisma.template.delete({
        where: { id: 'basic' }
      });
    }

    // Delete the old template and create a new one with 'basic' ID
    const templateData = {
      id: 'basic',
      name: existingBasic.name,
      tier: existingBasic.tier,
      previewUrl: existingBasic.previewUrl,
      description: existingBasic.description,
      createdAt: existingBasic.createdAt,
      updatedAt: new Date()
    };

    // Delete old template
    await prisma.template.delete({
      where: { id: existingBasic.id }
    });

    // Create new template with 'basic' ID
    await prisma.template.create({
      data: templateData
    });

    console.log('✅ Basic template ID-si basic olaraq dəyişdirildi');

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBasicTemplateId();
