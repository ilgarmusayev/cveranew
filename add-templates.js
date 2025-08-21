const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTemplates() {
  try {
    console.log('🔄 Adding 4 CV templates...');

    const templates = [
      {
        id: 'professional',
        name: 'Professional',
        tier: 'Free',
        previewUrl: '/templates/professional-preview.jpg',
        description: 'Clean and professional design perfect for corporate jobs'
      },
      {
        id: 'modern',
        name: 'Modern Creative',
        tier: 'Medium',
        previewUrl: '/templates/modern-preview.jpg',
        description: 'Creative modern design with stylish elements'
      },
      {
        id: 'elegant',
        name: 'Elegant Professional',
        tier: 'Premium',
        previewUrl: '/templates/elegant-professional-preview.jpg',
        description: 'Sophisticated elegant design for senior positions'
      },
      {
        id: 'executive',
        name: 'Executive Elite',
        tier: 'Premium',
        previewUrl: '/templates/executive-elite-preview.jpg',
        description: 'Premium executive template for leadership roles'
      }
    ];

    for (const template of templates) {
      const existing = await prisma.template.findUnique({
        where: { id: template.id }
      });

      if (existing) {
        console.log(`⚠️  Template ${template.name} already exists, updating...`);
        await prisma.template.update({
          where: { id: template.id },
          data: template
        });
      } else {
        console.log(`✅ Creating template: ${template.name}`);
        await prisma.template.create({
          data: template
        });
      }
    }

    console.log('✅ All 4 templates added successfully!');

    // Verify templates
    const allTemplates = await prisma.template.findMany();
    console.log('\n📋 Current templates in database:');
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.tier}) - ${t.id}`);
    });

  } catch (error) {
    console.error('❌ Error adding templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTemplates();
