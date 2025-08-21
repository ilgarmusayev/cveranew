const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding 4 CV templates...');

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
    try {
      await prisma.template.upsert({
        where: { id: template.id },
        update: template,
        create: template
      });
      console.log(`✅ Template ${template.name} added/updated`);
    } catch (error) {
      console.log(`❌ Error with ${template.name}:`, error.message);
    }
  }

  const count = await prisma.template.count();
  console.log(`Total templates in database: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
