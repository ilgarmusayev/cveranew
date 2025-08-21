const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTemplateMemory() {
  try {
    console.log('🔍 Template yaddaş testı başlayır...');

    // 1. Template-ləri yoxla
    const templates = await prisma.template.findMany();
    console.log('\n🎨 Mövcud template-lər:');
    templates.forEach(t => console.log(`  - ${t.id}: ${t.name}`));

    // 2. Test CV yarad
    console.log('\n📝 Test CV yaradılır...');
    const testCV = await prisma.cV.create({
      data: {
        userId: 'test-user-id',
        title: 'Template Test CV',
        templateId: 'basic',
        cv_data: {
          templateId: 'basic',
          personalInfo: {
            fullName: 'Test User',
            title: 'Test Position'
          }
        }
      }
    });
    console.log(`✅ Test CV yaradıldı: ${testCV.id}`);

    // 3. Template-i "modern"-ə dəyiş
    console.log('\n🔄 Template "modern"-ə dəyişdirilir...');
    const updatedCV = await prisma.cV.update({
      where: { id: testCV.id },
      data: {
        templateId: 'modern',
        cv_data: {
          ...testCV.cv_data,
          templateId: 'modern'
        }
      }
    });
    console.log('✅ Template dəyişdirildi');

    // 4. CV-ni yenidən oxu (refresh simulasiyası)
    console.log('\n🔄 CV yenidən oxunur (refresh test)...');
    const refreshedCV = await prisma.cV.findUnique({
      where: { id: testCV.id }
    });

    // 5. Nəticəni yoxla
    const dbTemplate = refreshedCV.templateId;
    const cvDataTemplate = refreshedCV.cv_data.templateId;

    console.log('\n📊 Test nəticəsi:');
    console.log(`Database templateId: ${dbTemplate}`);
    console.log(`cv_data templateId: ${cvDataTemplate}`);

    if (dbTemplate === 'modern' && cvDataTemplate === 'modern') {
      console.log('✅ SUCCESS: Template yaddaşda düzgün saxlanılır!');
      console.log('🎉 Refresh sonrası template dəyişmir!');
    } else {
      console.log('❌ FAIL: Template yaddaş problemi hələ də var');
    }

    // 6. Test CV-ni sil
    await prisma.cV.delete({ where: { id: testCV.id } });
    console.log('\n🗑️ Test CV silindi');

  } catch (error) {
    console.error('❌ Test xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateMemory();
