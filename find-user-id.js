const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findRealUserID() {
  try {
    console.log('🔍 Real user ID-ni tapıram...');

    // Email əsasında user ID-ni tap
    const user = await prisma.user.findUnique({
      where: { email: 'musayevcreate@gmail.com' },
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

    if (user) {
      console.log(`✅ User tapıldı:`);
      console.log(`ID: ${user.id}`);
      console.log(`Ad: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`CV sayı: ${user._count.cvs}`);

      // Bu user ID ilə CV-ləri götür
      const cvs = await prisma.cV.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          templateId: true
        }
      });

      console.log(`\n📋 Bu user ID ilə ${cvs.length} CV tapıldı:`);
      cvs.forEach((cv, index) => {
        console.log(`${index + 1}. ${cv.title}`);
        console.log(`   ID: ${cv.id}`);
        console.log(`   Yaradılma: ${new Date(cv.createdAt).toLocaleString()}`);
        console.log('---');
      });

    } else {
      console.log('❌ User tapılmadı!');
    }

  } catch (error) {
    console.error('❌ User ID axtarış xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findRealUserID();
