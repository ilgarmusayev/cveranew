const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTemplateSaveIssue() {
  try {
    console.log('🔍 Template save problemi test edilir...');

    // Mövcud CV tap
    const testCV = await prisma.cV.findFirst({
      select: { id: true, title: true, templateId: true, cv_data: true, userId: true }
    });

    if (!testCV) {
      console.log('❌ Test üçün CV tapılmadı');
      return;
    }

    console.log(`\n📋 Test CV: ${testCV.title}`);
    console.log(`👤 User ID: ${testCV.userId}`);
    console.log(`🎨 Hazırkı template: ${testCV.templateId}`);
    console.log(`📊 cv_data template: ${testCV.cv_data?.templateId}`);

    // Template-i "basic"-ə dəyiş və save et
    console.log('\n🔄 Template "basic"-ə dəyişdirilir...');
    
    const updatedCvData = {
      ...testCV.cv_data,
      templateId: 'basic'
    };

    const savedCV = await prisma.cV.update({
      where: { id: testCV.id },
      data: {
        templateId: 'basic',
        cv_data: updatedCvData
      }
    });

    console.log('💾 CV save edildi');

    // Dərhal yenidən oxu (refresh simulasiyası)
    console.log('\n🔄 CV yenidən oxunur (refresh test)...');
    
    const refreshedCV = await prisma.cV.findUnique({
      where: { id: testCV.id },
      select: { templateId: true, cv_data: true }
    });

    console.log('\n📊 Refresh sonrası nəticə:');
    console.log(`  Database templateId: ${refreshedCV?.templateId}`);
    console.log(`  cv_data templateId: ${refreshedCV?.cv_data?.templateId}`);

    // Nəticəni yoxla
    if (refreshedCV?.templateId === 'basic' && refreshedCV?.cv_data?.templateId === 'basic') {
      console.log('\n✅ SUCCESS: Template düzgün save olundu və refresh-dən sonra qaldı!');
    } else {
      console.log('\n❌ PROBLEM: Template save olmadı və ya refresh-dən sonra dəyişdi!');
      
      // Əgər problem varsa, manually düzəlt
      console.log('🔧 Manual düzəlmə başlayır...');
      
      await prisma.cV.update({
        where: { id: testCV.id },
        data: {
          templateId: 'basic',
          cv_data: {
            ...refreshedCV?.cv_data,
            templateId: 'basic'
          }
        }
      });
      
      console.log('✅ Manual düzəlmə tamamlandı');
    }

    // Template-i "medium"-ə dəyiş və test et
    console.log('\n🔄 İndi template "medium"-ə dəyişdirilir...');

    const mediumCvData = {
      ...refreshedCV?.cv_data,
      templateId: 'medium'
    };

    await prisma.cV.update({
      where: { id: testCV.id },
      data: {
        templateId: 'medium',
        cv_data: mediumCvData
      }
    });

    // Yenidən refresh test
    const finalCV = await prisma.cV.findUnique({
      where: { id: testCV.id },
      select: { templateId: true, cv_data: true }
    });

    console.log('\n📊 Medium template test nəticəsi:');
    console.log(`  Database templateId: ${finalCV?.templateId}`);
    console.log(`  cv_data templateId: ${finalCV?.cv_data?.templateId}`);

    if (finalCV?.templateId === 'medium' && finalCV?.cv_data?.templateId === 'medium') {
      console.log('\n🎉 PERFECT: Medium template də düzgün işləyir!');
      console.log('💾 Template save problemi həll olundu!');
    } else {
      console.log('\n❌ STILL PROBLEM: Medium template save olmur');
    }

    // Original template-ə geri qaytar
    await prisma.cV.update({
      where: { id: testCV.id },
      data: {
        templateId: testCV.templateId,
        cv_data: testCV.cv_data
      }
    });
    
    console.log('\n🔄 Original template-ə geri qaytarıldı');

  } catch (error) {
    console.error('❌ Test xətası:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTemplateSaveIssue();
