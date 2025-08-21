const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTemplateAPI() {
  try {
    console.log('🔍 Template sistemini yoxlayıram...\n');

    // 1. Database əlaqəsini yoxla
    console.log('1. Database əlaqəsi:');
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Database əlaqəsi uğurludur');

    // 2. Template-ləri yoxla
    console.log('\n2. Template-lər:');
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   📋 Cəmi ${templates.length} template tapıldı:`);
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.tier}) - ID: ${template.id}`);
    });

    // 3. "Ənənəvi CV" template-ini yoxla
    console.log('\n3. "Ənənəvi CV" template-i:');
    const traditionalTemplate = templates.find(t =>
      t.name === 'Ənənəvi CV' ||
      t.id === 'traditional' ||
      t.name.includes('Ənənəvi')
    );

    if (traditionalTemplate) {
      console.log('   ✅ "Ənənəvi CV" template-i tapıldı:');
      console.log(`      - ID: ${traditionalTemplate.id}`);
      console.log(`      - Ad: ${traditionalTemplate.name}`);
      console.log(`      - Tier: ${traditionalTemplate.tier}`);
      console.log(`      - Preview URL: ${traditionalTemplate.previewUrl}`);
    } else {
      console.log('   ❌ "Ənənəvi CV" template-i tapılmadı!');
    }

    // 4. API response strukturunu simulasiya et
    console.log('\n4. API Response simulasiyası:');
    const apiResponse = {
      templates: templates.map(template => ({
        ...template,
        hasAccess: true,
        requiresUpgrade: false,
        accessTier: template.tier,
      })),
      userTier: 'Free',
      limits: {
        dailyCVLimit: 5,
        allowedTemplates: ['Free'],
        exportFormats: ['PDF'],
        supportType: 'Community',
        allowImages: false,
      }
    };

    console.log(`   📦 API cavabı hazırdır: ${apiResponse.templates.length} template`);

    return apiResponse;

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Test-i işə sal
testTemplateAPI()
  .then((result) => {
    console.log('\n🎉 Template sistemi test edildi və işləkdir!');
  })
  .catch((error) => {
    console.error('\n💥 Template sistemində problem var:', error.message);
    process.exit(1);
  });
