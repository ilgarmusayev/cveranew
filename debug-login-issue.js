const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLoginIssue() {
  try {
    console.log('🔍 Giriş problemini araşdırıram...');

    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log(`📊 Toplam istifadəçi sayı: ${userCount}`);

    if (userCount === 0) {
      console.log('❌ Heç bir istifadəçi tapılmadı!');
      return;
    }

    // Get all users to see their data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        loginMethod: true,
        linkedinId: true,
        linkedinUsername: true,
        createdAt: true,
        lastLogin: true
      }
    });

    console.log('\n👥 İstifadəçi məlumatları:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Giriş metodu: ${user.loginMethod || 'email'}`);
      console.log(`   LinkedIn ID: ${user.linkedinId || 'yoxdur'}`);
      console.log(`   LinkedIn username: ${user.linkedinUsername || 'yoxdur'}`);
      console.log(`   Son giriş: ${user.lastLogin || 'heç vaxt'}`);
      console.log('   ---');
    });

    // Check recent login attempts (if we have logs)
    console.log('\n🔐 Giriş sistemini yoxlayıram...');

    // Test database connection
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      console.log('✅ Database bağlantısı işləyir');
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkLoginIssue();
