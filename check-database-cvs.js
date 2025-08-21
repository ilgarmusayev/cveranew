const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCVs() {
  try {
    console.log('🔍 Database-də CV-ləri yoxlayıram...');

    // Bütün CV-ləri götür
    const allCVs = await prisma.cV.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📊 Cəmi CV sayı: ${allCVs.length}`);

    if (allCVs.length === 0) {
      console.log('❌ Database-də heç bir CV tapılmadı!');

      // İstifadəçiləri də yoxlayaq
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      });

      console.log(`\n👥 Database-də ${users.length} istifadəçi var:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Ad yoxdur'} (${user.email}) - ${user.createdAt}`);
      });

    } else {
      console.log('\n📋 Tapılan CV-lər:');
      allCVs.forEach((cv, index) => {
        console.log(`\n${index + 1}. CV ID: ${cv.id}`);
        console.log(`   Başlıq: ${cv.title}`);
        console.log(`   İstifadəçi: ${cv.user?.name || 'Ad yoxdur'} (${cv.user?.email})`);
        console.log(`   Yaradılma tarixi: ${cv.createdAt}`);
        console.log(`   Son yeniləmə: ${cv.updatedAt}`);
        console.log(`   Template ID: ${cv.templateId || 'Yoxdur'}`);

        // CV data-nın strukturunu yoxlayaq
        if (cv.cv_data) {
          const cvData = typeof cv.cv_data === 'string' ? JSON.parse(cv.cv_data) : cv.cv_data;
          console.log(`   Şəxsi məlumat: ${cvData.personalInfo?.fullName || 'Yoxdur'}`);
          console.log(`   Təcrübə sayı: ${cvData.experience?.length || 0}`);
          console.log(`   Təhsil sayı: ${cvData.education?.length || 0}`);
        }
      });
    }

    // Son 24 saat ərzində yaradılan CV-ləri yoxlayaq
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentCVs = await prisma.cV.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`\n🕒 Son 24 saatda yaradılan CV-lər: ${recentCVs.length}`);
    if (recentCVs.length > 0) {
      recentCVs.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.title} - ${cv.user?.email} - ${cv.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Database xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCVs();
