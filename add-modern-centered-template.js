const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addModernCenteredTemplate() {
  try {
    console.log('🔄 Adding Modern Centered CV template...');

    const newTemplate = {
      id: 'modern-centered',
      name: 'Modern Centered',
      tier: 'Medium',
      previewUrl: '/templates/modern-centered-preview.jpg',
      description: 'Modern design with centered sections and clean layout'
    };

    const existing = await prisma.template.findUnique({
      where: { id: newTemplate.id }
    });

    if (existing) {
      console.log(`⚠️  Template ${newTemplate.name} already exists, updating...`);
      await prisma.template.update({
        where: { id: newTemplate.id },
        data: newTemplate
      });
    } else {
      console.log(`✅ Creating template: ${newTemplate.name}`);
      await prisma.template.create({
        data: newTemplate
      });
    }

    console.log('✅ Modern Centered template added successfully!');

    // Verify templates
    const allTemplates = await prisma.template.findMany();
    console.log('\n📋 Current templates in database:');
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.tier}) - ${t.id}`);
    });

  } catch (error) {
    console.error('❌ Error adding Modern Centered template:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addModernCenteredTemplate();
