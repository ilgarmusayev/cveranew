const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeModernTemplateCleanup() {
  try {
    console.log('🧹 Modern template-lərin tam təmizliyi başlayır...');

    // 1. Mövcud template-ləri göstər
    const existingTemplates = await prisma.template.findMany({
      select: { id: true, name: true, tier: true }
    });

    console.log('\n📋 Mövcud template-lər:');
    existingTemplates.forEach(template => {
      console.log(`  ${template.id === 'modern-centered' || template.id === 'modern' ? '❌' : '✅'} ${template.id}: ${template.name} (${template.tier})`);
    });

    // 2. Modern template-ləri sil
    console.log('\n🗑️ Modern template-lər silinir...');

    const deletedModernTemplates = await prisma.template.deleteMany({
      where: {
        id: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      }
    });

    console.log(`✅ ${deletedModernTemplates.count} modern template silindi`);

    // 3. Medium template əlavə et
    console.log('\n➕ Medium template yaradılır...');

    const mediumTemplate = await prisma.template.upsert({
      where: { id: 'medium' },
      update: {
        name: 'Medium Professional',
        tier: 'Medium',
        description: 'Professional two-column template with ATS-friendly design',
        previewUrl: '/templates/medium-preview.jpg'
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

    // 4. Modern template istifadə edən CV-ləri basic-ə çevir
    console.log('\n🔄 Modern template istifadə edən CV-lər düzəldilir...');

    const modernCVs = await prisma.cV.findMany({
      where: {
        templateId: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      },
      select: { id: true, title: true, templateId: true, cv_data: true }
    });

    console.log(`📊 ${modernCVs.length} CV tapıldı ki, modern template istifadə edir`);

    let fixedCVs = 0;
    for (const cv of modernCVs) {
      // CV data-nı da düzəlt
      const updatedCvData = {
        ...cv.cv_data,
        templateId: 'basic'
      };

      await prisma.cV.update({
        where: { id: cv.id },
        data: {
          templateId: 'basic',
          cv_data: updatedCvData
        }
      });

      console.log(`  ✅ CV "${cv.title?.substring(0, 30)}..." ${cv.templateId} -> basic`);
      fixedCVs++;
    }

    console.log(`✅ ${fixedCVs} CV düzəldildi`);

    // 5. Template ordering düzəlt
    console.log('\n🔢 Template sıralaması düzəldilir...');

    await prisma.template.updateMany({
      where: { id: 'basic' },
      data: { ordering: 1 }
    });

    await prisma.template.updateMany({
      where: { id: 'medium' },
      data: { ordering: 2 }
    });

    await prisma.template.updateMany({
      where: { id: 'professional' },
      data: { ordering: 3 }
    });

    await prisma.template.updateMany({
      where: { id: 'professional-complex' },
      data: { ordering: 4 }
    });

    console.log('✅ Template sıralaması düzəldildi');

    // 6. Final nəticə
    const finalTemplates = await prisma.template.findMany({
      orderBy: { ordering: 'asc' },
      select: { id: true, name: true, tier: true, ordering: true }
    });

    console.log('\n🎯 Təmizlik tamamlandı! Final template-lər:');
    finalTemplates.forEach(template => {
      console.log(`  ${template.ordering}. ${template.id}: ${template.name} (${template.tier})`);
    });

    // 7. Verification
    console.log('\n🔍 Verification...');
    const remainingModernCVs = await prisma.cV.count({
      where: {
        templateId: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      }
    });

    if (remainingModernCVs === 0) {
      console.log('✅ Heç bir CV modern template istifadə etmir');
    } else {
      console.log(`❌ Hələ də ${remainingModernCVs} CV modern template istifadə edir`);
    }

    const modernTemplateCount = await prisma.template.count({
      where: {
        id: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      }
    });

    if (modernTemplateCount === 0) {
      console.log('✅ Bütün modern template-lər silindi');
    } else {
      console.log(`❌ Hələ də ${modernTemplateCount} modern template qalıb`);
    }

    console.log('\n🎉 Modern template təmizliyi TAM TAMAMLANDI!');
    console.log('📋 İndi sistemdə yalnız bu template-lər var:');
    console.log('  • basic (Free)');
    console.log('  • medium (Medium tier)');
    console.log('  • professional (Premium tier)');
    console.log('  • professional-complex (Premium tier)');

  } catch (error) {
    console.error('❌ Xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeModernTemplateCleanup();
