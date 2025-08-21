// Simple dashboard API test - direct database query
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function debugDashboardProblem() {
  try {
    console.log('🔍 Dashboard problemini debug edirəm...\n');

    // 1. User-i tap
    const user = await prisma.user.findUnique({
      where: { email: 'musayevcreate@gmail.com' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('❌ User tapılmadı!');
      return;
    }

    console.log('✅ User tapıldı:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}\n`);

    // 2. JWT token yarat
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ JWT Token yaradıldı\n');

    // 3. CV-ləri database-dən götür (dashboard API-nin eyni sorğusu)
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

    console.log('🔍 Database sorğusu nəticəsi:');
    console.log(`   Tapılan CV sayı: ${cvs.length}`);

    if (cvs.length > 0) {
      console.log('\n📋 CV-lər:');
      cvs.slice(0, 5).forEach((cv, index) => {
        console.log(`   ${index + 1}. "${cv.title}"`);
        console.log(`      ID: ${cv.id}`);
        console.log(`      Template: ${cv.templateId}`);
        console.log('');
      });
    } else {
      console.log('❌ Heç bir CV tapılmadı!');
    }

    // 4. API endpoint test edək
    console.log('🧪 Dashboard API-ni test edək:');

    const axios = require('axios');

    try {
      const response = await axios.get('http://localhost:3000/api/cv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ API Cavabı:');
      console.log(`   Status: ${response.status}`);
      console.log(`   CV sayı: ${response.data.cvs?.length || 0}`);

      if (response.data.cvs && response.data.cvs.length > 0) {
        console.log('   İlk CV:', response.data.cvs[0]);
      } else {
        console.log('   ❌ API boş array qaytardı');
        console.log('   Response:', response.data);
      }

    } catch (apiError) {
      console.log('❌ API Xətası:');
      console.log(`   Status: ${apiError.response?.status}`);
      console.log(`   Message: ${apiError.response?.data?.error || apiError.message}`);
    }

  } catch (error) {
    console.error('❌ Debug xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardProblem();
