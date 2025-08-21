const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTraditionalTemplateId() {
  try {
    console.log('🔧 "Ənənəvi CV" template ID-ni düzəltirəm...\n');

    // Əvvəlcə mövcud template-i tap
    const existingTemplate = await prisma.template.findFirst({
      where: {
        OR: [
          { name: 'Ənənəvi CV' },
          { id: '8b26fb4c-7ec1-4c0d-bbd9-4b597fb1df45' }
        ]
      }
    });

    if (!existingTemplate) {
      console.log('❌ "Ənənəvi CV" template-i tapılmadı!');
      return;
    }

    console.log('📋 Mövcud template:', {
      id: existingTemplate.id,
      name: existingTemplate.name,
      tier: existingTemplate.tier
    });

    // Əgər ID artıq "traditional" deyilsə, onu dəyişdir
    if (existingTemplate.id !== 'traditional') {
      console.log('\n🔄 Template ID-ni "traditional" olaraq yeniləyirəm...');

      // Əvvəlcə "traditional" ID-li template var-yoxdu yoxla
      const traditionalExists = await prisma.template.findUnique({
        where: { id: 'traditional' }
      });

      if (traditionalExists) {
        console.log('⚠️ "traditional" ID-li template artıq mövcuddur, köhnəsini silirəm...');
        await prisma.template.delete({
          where: { id: 'traditional' }
        });
      }

      // Yeni template yarat "traditional" ID ilə
      const newTemplate = await prisma.template.create({
        data: {
          id: 'traditional',
          name: 'Ənənəvi CV',
          tier: 'Free',
          previewUrl: '/templates/traditional-preview.jpg',
          description: 'Klassik və peşəkar dizaynlı ənənəvi CV şablonu. Tünd yan panel və ağ əsas sahə ilə hazırlanmış Resume1 faylından.',
        }
      });

      // Köhnə template-i sil
      await prisma.template.delete({
        where: { id: existingTemplate.id }
      });

      console.log('✅ Template ID uğurla yeniləndi!');
      console.log('📋 Yeni template məlumatları:', {
        id: newTemplate.id,
        name: newTemplate.name,
        tier: newTemplate.tier,
        previewUrl: newTemplate.previewUrl
      });

    } else {
      console.log('✅ Template ID artıq düzgündür: "traditional"');
    }

    // Son yoxlama - bütün template-ləri göstər
    console.log('\n📊 Bütün template-lər:');
    const allTemplates = await prisma.template.findMany({
      orderBy: { createdAt: 'desc' }
    });

    allTemplates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (ID: ${template.id}) - ${template.tier}`);
    });

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Template ID-ni düzəlt
fixTraditionalTemplateId()
  .then(() => {
    console.log('\n🎉 "Ənənəvi CV" template ID düzəldildi və hazırdır!');
    console.log('\n📋 Test üçün:');
    console.log('   1. Browser-də http://localhost:3002/templates açın');
    console.log('   2. "Ənənəvi CV" template-ini seçin');
    console.log('   3. CV yaradın və preview-də tam formada görünməsini yoxlayın');
  })
  .catch((error) => {
    console.error('❌ Template ID düzəldilə bilmədi:', error.message);
    process.exit(1);
  });
