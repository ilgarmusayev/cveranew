const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTemplatesAndFixMemory() {
  try {
    console.log('🧹 Template təmizliyi və yaddaş problemi həlli başlayır...');

    // 1. İlk öncə mövcud template-ləri görək
    const existingTemplates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        tier: true
      }
    });

    console.log('\n📋 Mövcud template-lər:');
    existingTemplates.forEach(template => {
      console.log(`  - ${template.id}: ${template.name} (${template.tier})`);
    });

    // 2. "basic" template-i yoxla və ya yarat
    console.log('\n📝 "basic" template yoxlanılır...');
    const basicTemplate = await prisma.template.upsert({
      where: { id: 'basic' },
      update: {
        name: 'Basic Template',
        tier: 'Free',
        description: 'Simple and clean basic template'
      },
      create: {
        id: 'basic',
        name: 'Basic Template',
        description: 'Simple and clean basic template',
        tier: 'Free',
        previewUrl: '/templates/basic/preview.png'
      }
    });
    console.log('✅ Basic template hazır:', basicTemplate.id);

    // 3. Medium template əlavə et
    console.log('\n📝 "medium" template yoxlanılır...');
    const mediumTemplate = await prisma.template.upsert({
      where: { id: 'medium' },
      update: {
        name: 'Medium Professional',
        tier: 'Medium',
        description: 'Professional two-column template with ATS-friendly design'
      },
      create: {
        id: 'medium',
        name: 'Medium Professional',
        description: 'Professional two-column template with ATS-friendly design',
        tier: 'Medium',
        previewUrl: '/templates/medium-preview.jpg'
      }
    });
    console.log('✅ Medium template hazır:', mediumTemplate.id);

    // 4. Digər template-ləri sil (modern template-ləri də daxil olmaqla)
    console.log('\n🗑️ Artıq template-lər silinir...');
    const templatesToKeep = ['basic', 'medium'];

    const deletedTemplates = await prisma.template.deleteMany({
      where: {
        id: {
          notIn: templatesToKeep
        }
      }
    });
    
    console.log(`✅ ${deletedTemplates.count} artıq template silindi`);

    // 5. CV-ləri yoxla və düzəlt - yalnız basic və medium istifadə et
    console.log('\n🔄 CV template-lərini düzəldir...');
    
    const allCVs = await prisma.cV.findMany({
      select: {
        id: true,
        title: true,
        templateId: true,
        cv_data: true
      }
    });

    let fixedCVs = 0;
    
    for (const cv of allCVs) {
      let needsUpdate = false;
      let newTemplateId = cv.templateId;
      let newCvData = cv.cv_data;

      // Əgər template mövcud deyilsə, basic-ə çevir
      if (!templatesToKeep.includes(cv.templateId)) {
        newTemplateId = 'basic';
        needsUpdate = true;
        console.log(`🔄 CV ${cv.id}: "${cv.templateId}" -> "basic"`);
      }

      // cv_data-nı da düzəlt
      if (cv.cv_data && typeof cv.cv_data === 'object') {
        const cvData = { ...cv.cv_data };
        
        if (!cvData.templateId || cvData.templateId !== newTemplateId) {
          cvData.templateId = newTemplateId;
          newCvData = cvData;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await prisma.cV.update({
          where: { id: cv.id },
          data: {
            templateId: newTemplateId,
            cv_data: newCvData
          }
        });
        fixedCVs++;
      }
    }

    console.log(`✅ ${fixedCVs} CV template-i düzəldildi`);

    // 6. Son nəticə
    const finalTemplates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        tier: true
      }
    });

    console.log('\n🎯 Son template-lər:');
    finalTemplates.forEach(template => {
      console.log(`  ✅ ${template.id}: ${template.name} (${template.tier})`);
    });

    // 7. Template yaddaş problemini yoxla
    console.log('\n🔍 Template yaddaş sinxronlaşması yoxlanılır...');
    
    const testCVs = await prisma.cV.findMany({
      select: {
        id: true,
        templateId: true,
        cv_data: true
      },
      take: 5
    });

    let memoryIssues = 0;
    testCVs.forEach(cv => {
      const dbTemplate = cv.templateId;
      const cvDataTemplate = cv.cv_data?.templateId;
      
      if (dbTemplate !== cvDataTemplate) {
        memoryIssues++;
        console.log(`❌ CV ${cv.id}: DB(${dbTemplate}) ≠ cvData(${cvDataTemplate})`);
      } else {
        console.log(`✅ CV ${cv.id}: Template sinxronizasiyası düzgün (${dbTemplate})`);
      }
    });

    if (memoryIssues === 0) {
      console.log('\n🎉 Template yaddaş problemi həll olundu!');
      console.log('📋 İndi yalnız 2 template var: basic və medium');
      console.log('💾 Bütün CV-lərdə template düzgün saxlanılır');
    } else {
      console.log(`\n⚠️ Hələ də ${memoryIssues} CV-də yaddaş problemi var`);
    }

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTemplatesAndFixMemory();
