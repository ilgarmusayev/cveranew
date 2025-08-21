const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTemplateSynchronization() {
  try {
    console.log('🔧 CV template sinxronlaşması başlayır...');

    // Bütün CV-ləri tap
    const allCVs = await prisma.cV.findMany({
      select: {
        id: true,
        title: true,
        templateId: true,
        cv_data: true,
        userId: true
      }
    });

    console.log(`📊 Tapılan CV sayı: ${allCVs.length}`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const cv of allCVs) {
      try {
        console.log(`\n🔄 CV yoxlanılır: ${cv.id} - ${cv.title}`);
        
        let needsUpdate = false;
        let newTemplateId = cv.templateId;
        let newCvData = cv.cv_data;

        // 1. Database templateId yoxla
        if (!cv.templateId) {
          console.log('⚠️ Database templateId yoxdur, basic təyin edilir');
          newTemplateId = 'basic';
          needsUpdate = true;
        }

        // 2. cv_data templateId yoxla
        if (cv.cv_data && typeof cv.cv_data === 'object') {
          const cvData = cv.cv_data as any;
          
          if (!cvData.templateId) {
            console.log('⚠️ cv_data templateId yoxdur, database-dən götürülür');
            cvData.templateId = newTemplateId || 'basic';
            newCvData = cvData;
            needsUpdate = true;
          } else if (cvData.templateId !== newTemplateId) {
            console.log('⚠️ Template ID uyğunsuzluğu:', {
              database: newTemplateId,
              cvData: cvData.templateId
            });
            
            // Database-i prioritet veririk
            cvData.templateId = newTemplateId || 'basic';
            newCvData = cvData;
            needsUpdate = true;
          }
        } else {
          console.log('❌ cv_data structure problemi');
          errorCount++;
          continue;
        }

        // 3. Update lazımdırsa
        if (needsUpdate) {
          await prisma.cV.update({
            where: { id: cv.id },
            data: {
              templateId: newTemplateId,
              cv_data: newCvData
            }
          });

          console.log(`✅ CV düzəldildi - Template: ${newTemplateId}`);
          fixedCount++;
        } else {
          console.log(`✅ CV artıq düzgündür - Template: ${cv.templateId}`);
        }

      } catch (error) {
        console.error(`❌ CV ${cv.id} xətası:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📋 Nəticə:');
    console.log(`✅ Düzəldilən CV-lər: ${fixedCount}`);
    console.log(`❌ Xətalı CV-lər: ${errorCount}`);
    console.log(`📊 Ümumi CV-lər: ${allCVs.length}`);

    // Son yoxlama
    const updatedCVs = await prisma.cV.findMany({
      where: {
        OR: [
          { templateId: null },
          { templateId: '' }
        ]
      },
      select: { id: true, templateId: true }
    });

    if (updatedCVs.length > 0) {
      console.log(`⚠️ Hələ də problemli ${updatedCVs.length} CV var`);
    } else {
      console.log(`🎉 Bütün CV-lərdə template düzgündür!`);
    }

  } catch (error) {
    console.error('❌ Template sinxronlaşma xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplateSynchronization();
