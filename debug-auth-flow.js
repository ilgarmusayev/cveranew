const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function debugAuthFlow() {
  try {
    console.log('🔍 Giriş flow problemini araşdırıram...');

    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

    // Test JWT creation and validation
    if (process.env.JWT_SECRET) {
      const testPayload = { userId: 'test123', email: 'test@test.com' };
      const testToken = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

      console.log('\n🔑 JWT Test:');
      console.log('Token created successfully:', !!testToken);

      try {
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
        console.log('Token verification successful:', !!decoded);
      } catch (err) {
        console.log('❌ Token verification failed:', err.message);
      }
    }

    // Check a real user for token testing
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'ilgar@gmail.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        loginMethod: true
      }
    });

    if (testUser) {
      console.log('\n👤 Test User Found:');
      console.log('User ID:', testUser.id);
      console.log('Email:', testUser.email);
      console.log('Login Method:', testUser.loginMethod);

      // Create a real token for this user
      if (process.env.JWT_SECRET) {
        const realToken = jwt.sign(
          { userId: testUser.id, email: testUser.email },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        console.log('Real token created for user:', !!realToken);
        console.log('Token length:', realToken.length);
        console.log('Token starts with:', realToken.substring(0, 20) + '...');
      }
    }

    // Check recent activity
    const recentUsers = await prisma.user.findMany({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        email: true,
        name: true,
        lastLogin: true,
        loginMethod: true
      },
      orderBy: {
        lastLogin: 'desc'
      },
      take: 5
    });

    console.log('\n🕒 Recent Login Activity:');
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Method: ${user.loginMethod}, Last Login: ${user.lastLogin}`);
    });

  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuthFlow();
