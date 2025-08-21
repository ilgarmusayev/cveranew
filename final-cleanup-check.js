const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function finalCleanupCheck() {
  try {
    console.log('🔍 Final təmizlik yoxlanışı...');

    // 1. Template-ləri yoxla
    const templates = await prisma.template.findMany({
      select: { id: true, name: true, tier: true }
    });

    console.log('\n📋 Hal-hazırda mövcud template-lər:');
    templates.forEach(template => {
      console.log(`  ✅ ${template.id}: ${template.name} (${template.tier})`);
    });

    // 2. Modern template qalıb-qalmadığını yoxla
    const modernTemplates = await prisma.template.findMany({
      where: {
        id: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      }
    });

    if (modernTemplates.length === 0) {
      console.log('\n✅ Bütün modern template-lər uğurla silindi!');
    } else {
      console.log(`\n❌ Hələ də ${modernTemplates.length} modern template qalıb:`);
      modernTemplates.forEach(t => console.log(`  - ${t.id}`));
    }

    // 3. CV-lərdə modern template istifadəsini yoxla
    const cvWithModernTemplates = await prisma.cV.findMany({
      where: {
        templateId: {
          in: ['modern-centered', 'modern', 'modern-creative']
        }
      },
      select: { id: true, title: true, templateId: true }
    });

    if (cvWithModernTemplates.length === 0) {
      console.log('✅ Heç bir CV modern template istifadə etmir!');
    } else {
      console.log(`\n❌ ${cvWithModernTemplates.length} CV hələ də modern template istifadə edir:`);
      cvWithModernTemplates.forEach(cv => {
        console.log(`  - ${cv.title}: ${cv.templateId}`);
      });
    }

    // 4. Medium template-in düzgün yaradıldığını yoxla
    const mediumTemplate = await prisma.template.findUnique({
      where: { id: 'medium' }
    });

    if (mediumTemplate) {
      console.log('\n✅ Medium template uğurla yaradılıb:');
      console.log(`  📝 Ad: ${mediumTemplate.name}`);
      console.log(`  🎯 Tier: ${mediumTemplate.tier}`);
      console.log(`  📄 Təsvir: ${mediumTemplate.description}`);
    } else {
      console.log('\n❌ Medium template tapılmadı');
    }

    // 5. Final nəticə
    console.log('\n🎯 TEMİZLİK NƏTİCƏSİ:');
    if (modernTemplates.length === 0 && cvWithModernTemplates.length === 0 && mediumTemplate) {
      console.log('🎉 Modern template təmizliyi TAM UĞURLA BAŞA ÇATDI!');
      console.log('\n📊 Aktiv template-lər:');
      console.log('  • basic (Free tier) - Sadə və təmiz dizayn');
      console.log('  • medium (Medium tier) - Professional iki sütunlu dizayn, ATS uyğun');
      console.log('  • professional (Premium tier) - Qabaqcıl dizayn');
      console.log('  • professional-complex (Premium tier) - Ən təkmil özəlliklər');

      console.log('\n✅ İndi medium template-i istifadə edə bilərsiniz!');
    } else {
      console.log('❌ Hələ də bəzi problemlər var, yuxarıdakı detalları yoxlayın');
    }

  } catch (error) {
    console.error('❌ Xəta:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalCleanupCheck();
