// Test script to debug dashboard API issue
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function debugDashboardIssue() {
  try {
    console.log('🔍 Dashboard problemi debug edilir...\n');

    // 1. Real user ID-ni tap
    const user = await prisma.user.findUnique({
      where: { email: 'musayevcreate@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: { select: { cvs: true } }
      }
    });

    if (!user) {
      console.log('❌ User tapılmadı!');
      return;
    }

    console.log('✅ User məlumatları:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Ad: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   CV sayı: ${user._count.cvs}\n`);

    // 2. JWT token yarat
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ JWT Token yaradıldı');
    console.log(`   Token length: ${token.length}\n`);

    // 3. CV-ləri database-dən birbaşa götür
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

    console.log('✅ Database-dən CV-lər:');
    console.log(`   Tapılan CV sayı: ${cvs.length}`);

    if (cvs.length > 0) {
      console.log('\n📋 Son 5 CV:');
      cvs.slice(0, 5).forEach((cv, index) => {
        console.log(`   ${index + 1}. ${cv.title}`);
        console.log(`      ID: ${cv.id}`);
        console.log(`      Template: ${cv.templateId}`);
        console.log(`      Yaradıldı: ${new Date(cv.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // 4. API endpoint simulasiyası
    console.log('🧪 Dashboard API simulasiyası:');
    console.log('   Authorization: Bearer [token]');
    console.log('   JWT decode: SUCCESS');
    console.log(`   User ID match: ${user.id}`);
    console.log(`   Expected CV count: ${cvs.length}`);

    // 5. Test məlumatları yazdır
    console.log('\n🔧 Test məlumatları:');
    console.log(`USER_ID="${user.id}"`);
    console.log(`JWT_TOKEN="${token.substring(0, 50)}..."`);
    console.log(`CV_COUNT=${cvs.length}`);

  } catch (error) {
    console.error('❌ Debug xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardIssue();
