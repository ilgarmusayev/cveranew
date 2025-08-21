const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLoginFlow() {
  try {
    console.log('🔐 Login sistemini test edirəm...\n');

    // Test data
    const testCredentials = [
      {
        email: 'ilgar2@gmail.com',
        password: 'test123', // You may need to adjust this
        description: 'Email/Password istifadəçisi'
      }
    ];

    for (const creds of testCredentials) {
      console.log(`📧 ${creds.description} test edilir...`);
      console.log(`   Email: ${creds.email}`);

      try {
        // Test login API call
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: creds.email,
          password: creds.password
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          console.log('✅ Login uğurlu!');
          console.log('   Token alındı:', response.data.accessToken ? 'Bəli' : 'Xeyr');
          console.log('   İstifadəçi məlumatları:', response.data.user ? 'Bəli' : 'Xeyr');

          if (response.data.user) {
            console.log(`   İstifadəçi adı: ${response.data.user.name}`);
            console.log(`   Tier: ${response.data.user.tier}`);
            console.log(`   Login metodu: ${response.data.user.loginMethod}`);
          }
        }

      } catch (error) {
        if (error.response) {
          console.log('❌ Login uğursuz!');
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Mesaj: ${error.response.data?.message || 'Məlum deyil'}`);

          if (error.response.data?.requiresLinkedInLogin) {
            console.log('   🔗 LinkedIn login tələb olunur');
          }
        } else if (error.code === 'ECONNREFUSED') {
          console.log('❌ Server işləmir! Serveri başlatın: npm run dev');
        } else {
          console.log('❌ Network xətası:', error.message);
        }
      }

      console.log(''); // Empty line between tests
    }

    // Check database state
    console.log('📊 Database vəziyyəti:');
    const users = await prisma.user.findMany({
      select: {
        email: true,
        loginMethod: true,
        lastLogin: true,
        linkedinUsername: true
      }
    });

    users.forEach(user => {
      console.log(`   ${user.email}: ${user.loginMethod}, Son giriş: ${user.lastLogin || 'Heç vaxt'}`);
      if (user.linkedinUsername) {
        console.log(`     LinkedIn: ${user.linkedinUsername}`);
      }
    });

  } catch (error) {
    console.error('❌ Test xətası:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('⚠️  Bu testi işə salmaq üçün server işləməlidir (npm run dev)');
console.log('🚀 Testi başlatmaq üçün: node test-login-flow.js\n');

testLoginFlow();
