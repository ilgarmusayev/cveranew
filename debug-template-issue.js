const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTemplateIssue() {
  try {
    console.log('🔍 Template problemi debug edilir...');

    // 1. Ümumi CV sayını yoxla
    const totalCVs = await prisma.cV.count();
    console.log(`📊 Ümumi CV sayı: ${totalCVs}`);

    // 2. Template ID olmayan CV-ləri tap
    const cvsWithoutTemplate = await prisma.cV.findMany({
      where: {
        OR: [
          { templateId: null },
          { templateId: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        templateId: true,
        createdAt: true
      }
    });

    console.log(`❌ Template ID olmayan CV-lər: ${cvsWithoutTemplate.length}`);
    if (cvsWithoutTemplate.length > 0) {
      console.log('Problemli CV-lər:');
      cvsWithoutTemplate.forEach(cv => {
        console.log(`  - ${cv.id}: ${cv.title} (${cv.templateId || 'NULL'})`);
      });
    }

    // 3. cv_data-da template problemi olan CV-ləri tap
    const allCVs = await prisma.cV.findMany({
      select: {
        id: true,
        title: true,
        templateId: true,
        cv_data: true
      },
      take: 5 // İlk 5 CV
    });

    let cvDataIssues = 0;
    let templateMismatches = 0;

    console.log('\n🔍 cv_data template analizi:');
    allCVs.forEach(cv => {
      console.log(`\nCV: ${cv.id} - ${cv.title}`);
      console.log(`Database templateId: ${cv.templateId || 'NULL'}`);
      
      if (cv.cv_data && typeof cv.cv_data === 'object') {
        const cvData = cv.cv_data;
        console.log(`cv_data templateId: ${cvData.templateId || 'NULL'}`);
        
        if (!cvData.templateId) {
          cvDataIssues++;
          console.log('  ❌ cv_data-da templateId yoxdur');
        } else if (cvData.templateId !== cv.templateId) {
          templateMismatches++;
          console.log(`  ⚠️ Template uyğunsuzluğu: DB(${cv.templateId}) vs cvData(${cvData.templateId})`);
        } else {
          console.log('  ✅ Template məlumatları uyğundur');
        }
      } else {
        cvDataIssues++;
        console.log('  ❌ cv_data structure problemi');
      }
    });

    console.log('\n📋 Problemlər:');
    console.log(`❌ cv_data templateId problemi: ${cvDataIssues}`);
    console.log(`⚠️ Template uyğunsuzluğu: ${templateMismatches}`);

    // 4. Template-ləri yoxla
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        tier: true
      }
    });

    console.log('\n🎨 Mövcud template-lər:');
    templates.forEach(template => {
      console.log(`  - ${template.id}: ${template.name} (${template.tier})`);
    });

    // 5. Basic template mövcudluğunu yoxla
    const basicTemplate = await prisma.template.findUnique({
      where: { id: 'basic' }
    });

    if (!basicTemplate) {
      console.log('❌ PROBLEM: "basic" template mövcud deyil!');
      console.log('Bu default template yaratmaq lazımdır.');
    } else {
      console.log('✅ "basic" template mövcuddur');
    }

  } catch (error) {
    console.error('❌ Debug xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTemplateIssue();
