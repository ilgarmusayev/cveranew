const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createWorkingTemplates() {
  try {
    console.log('🔧 Template-ları order ilə yaradılır...');

    const templates = [
      {
        name: 'Basic Template',
        tier: 'Free',
        previewUrl: '/templates/classic-professional.png',
        description: 'Sadə və klassik dizayn. Bütün sahələr üçün uyğun.',
        order: 1,
        isActive: true
      },
      {
        name: 'Resumonk Bold',
        tier: 'Free',
        previewUrl: '/templates/modern-creative.png',
        description: 'Qalın başlıqlar və müasir dizayn. Diqqət çəkən format.',
        order: 2,
        isActive: true
      },
      {
        name: 'Modern Creative',
        tier: 'Premium',
        previewUrl: '/templates/tech-professional.png',
        description: 'Müasir dizayn və yaradıcı elementlər. Kreativ sahələr üçün ideal.',
        order: 3,
        isActive: true
      },
      {
        name: 'Executive Premium',
        tier: 'Premium',
        previewUrl: '/templates/executive-premium.png',
        description: 'Yüksək səviyyəli rəhbər vəzifələr üçün premium template.',
        order: 4,
        isActive: true
      }
    ];

    // Delete existing templates to avoid duplicates
    await prisma.template.deleteMany({});
    console.log('🗑️ Köhnə templatelar silindi');

    // Create new templates with ordering
    for (const templateData of templates) {
      const template = await prisma.template.create({
        data: templateData
      });
      console.log(`✅ Template yaradıldı: ${template.name} (Order: ${template.order}, Tier: ${template.tier})`);
    }

    console.log('\n📋 Yaradılan templatelar (sıralı):');
    const allTemplates = await prisma.template.findMany({
      orderBy: { order: 'asc' }
    });

    allTemplates.forEach(template => {
      console.log(`${template.order}. ${template.name}: ${template.tier} tier`);
      console.log(`   Preview: ${template.previewUrl}`);
      console.log(`   Təsvir: ${template.description}`);
      console.log(`   Status: ${template.isActive ? 'Active' : 'Inactive'}`);
      console.log('');
    });

    console.log('🎉 Template-lar uğurla yaradıldı və sıralandı!');

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createWorkingTemplates();
