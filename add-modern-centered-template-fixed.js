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
      description: 'Modern design with centered sections and clean layout',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if template exists
    const existing = await prisma.template.findUnique({
      where: { id: newTemplate.id }
    });

    if (existing) {
      console.log(`⚠️  Template ${newTemplate.name} already exists, updating...`);
      await prisma.template.update({
        where: { id: newTemplate.id },
        data: {
          name: newTemplate.name,
          tier: newTemplate.tier,
          previewUrl: newTemplate.previewUrl,
          description: newTemplate.description,
          updatedAt: new Date()
        }
      });
      console.log('✅ Template updated successfully!');
    } else {
      console.log(`✅ Creating new template: ${newTemplate.name}`);
      await prisma.template.create({
        data: newTemplate
      });
      console.log('✅ Template created successfully!');
    }

    // Verify all templates
    const allTemplates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📋 Current templates in database:');
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.tier}) - ID: ${t.id}`);
    });

    console.log('\n🎉 Modern Centered template setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addModernCenteredTemplate();
