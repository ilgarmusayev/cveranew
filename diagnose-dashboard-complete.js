// Complete dashboard problem diagnosis
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function diagnoseDashboardProblem() {
  try {
    console.log('🔍 Dashboard problemi tam diaqnostikası...\n');

    // 1. Database CV-lərini yoxla
    const user = await prisma.user.findUnique({
      where: { email: 'musayevcreate@gmail.com' },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      console.log('❌ User tapılmadı!');
      return;
    }

    const cvCount = await prisma.cV.count({
      where: { userId: user.id }
    });

    console.log('📊 Database Status:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   CV Count: ${cvCount}\n`);

    // 2. JWT Token Test
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔑 JWT Token Test:');
    console.log(`   Token Length: ${token.length}`);
    console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...\n`);

    // 3. API Endpoint Test
    console.log('🧪 API Endpoint Test:');

    try {
      // Test /api/cv endpoint directly
      const response = await axios.get('http://localhost:3000/api/cv', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ API Response:');
      console.log(`   Status: ${response.status}`);
      console.log(`   CV Count: ${response.data.cvs?.length || 0}`);

      if (response.data.cvs && response.data.cvs.length > 0) {
        console.log(`   First CV: ${response.data.cvs[0].title}`);
        console.log(`   First CV ID: ${response.data.cvs[0].id}`);
      }

    } catch (apiError) {
      console.log('❌ API Test Failed:');
      if (apiError.response) {
        console.log(`   Status: ${apiError.response.status}`);
        console.log(`   Error: ${JSON.stringify(apiError.response.data, null, 2)}`);
      } else {
        console.log(`   Network Error: ${apiError.message}`);
      }
    }

    // 4. Frontend localStorage simulation
    console.log('\n💾 Frontend Token Test:');
    console.log('   Simulating localStorage token...');

    // This simulates what happens in the browser
    const frontendTest = {
      token: token,
      apiCall: async () => {
        try {
          const res = await axios.get('http://localhost:3000/api/cv', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return { success: true, count: res.data.cvs?.length || 0 };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }
    };

    const frontendResult = await frontendTest.apiCall();
    console.log('   Frontend API Test:', frontendResult);

    // 5. Recommendations
    console.log('\n🎯 Problemin səbəbi:');

    if (cvCount === 0) {
      console.log('   ❌ Database-də CV yoxdur');
    } else if (!frontendResult.success) {
      console.log('   ❌ API endpoint problemi:', frontendResult.error);
    } else if (frontendResult.count !== cvCount) {
      console.log('   ❌ Database və API arasında uyğunsuzluq');
      console.log(`   Database: ${cvCount}, API: ${frontendResult.count}`);
    } else {
      console.log('   ✅ Backend işləyir - Frontend problemi!');
      console.log('   📋 Frontend debug addımları:');
      console.log('   1. Browser console-da localStorage.getItem("accessToken") yoxlayın');
      console.log('   2. Dashboard-da F12 açıb console log-larına baxın');
      console.log('   3. React component state-i düzgün update olmurmusa bilər');
    }

  } catch (error) {
    console.error('❌ Diaqnostika xətası:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseDashboardProblem();
