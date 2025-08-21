const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    console.log('🔍 Dashboard API-nin CV fetch funksiyasını test edirəm...');

    // Dashboard-da istifadə olunan sorğunu simulate edək
    const userId = '6d7f5a85-2c95-4b8b-bb8a-8c8e1b2f3a4d'; // Sizin user ID

    const cvs = await prisma.cV.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        templateId: true
      }
    });

    console.log(`\n📊 Dashboard API nəticəsi: ${cvs.length} CV tapıldı`);

    if (cvs.length === 0) {
      console.log('❌ User ID ilə CV tapılmadı! User ID-ni yoxlayaq...');

      // Bütün istifadəçiləri göstər
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              cvs: true
            }
          }
        }
      });

      console.log('\n👥 Bütün istifadəçilər:');
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Ad: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`CV sayı: ${user._count.cvs}`);
        console.log('---');
      });

    } else {
      console.log('\n📋 Dashboard üçün CV-lər:');
      cvs.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.title} (${cv.id})`);
        console.log(`   Yaradılma: ${cv.createdAt}`);
        console.log(`   Template: ${cv.templateId}`);
      });
    }

  } catch (error) {
    console.error('❌ Dashboard API test xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();
