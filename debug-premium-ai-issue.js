const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPremiumAIIssue() {
  try {
    console.log('🔍 Debugging Premium AI Summary Issue...\n');

    // Get all users with their subscriptions
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    console.log('📊 User Analysis:');
    users.forEach(user => {
      console.log(`\n👤 User: ${user.name} (${user.email})`);
      console.log(`   Tier: ${user.tier}`);
      console.log(`   Login Method: ${user.loginMethod || 'email'}`);

      if (user.subscriptions.length > 0) {
        console.log('   📋 Subscriptions:');
        user.subscriptions.forEach(sub => {
          console.log(`      - ${sub.tier} | ${sub.status} | ${sub.startedAt} - ${sub.expiresAt}`);
        });

        // Check active subscription
        const activeSubscription = user.subscriptions
          .filter(sub => sub.status === 'active')
          .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];

        if (activeSubscription) {
          console.log(`   ✅ Active Subscription: ${activeSubscription.tier}`);
        } else {
          console.log(`   ❌ No active subscription found`);
        }
      } else {
        console.log('   📋 No subscriptions found');
      }
    });

    // Check CVs for debugging
    console.log('\n📁 CV Analysis:');
    const cvs = await prisma.cV.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            tier: true
          }
        }
      }
    });

    cvs.forEach(cv => {
      console.log(`\n📄 CV: ${cv.title} (ID: ${cv.id})`);
      console.log(`   Owner: ${cv.user.name} (${cv.user.email})`);
      console.log(`   User Tier: ${cv.user.tier}`);
      console.log(`   Created: ${cv.createdAt}`);

      // Check if CV has personal info for AI summary
      const cvData = cv.cv_data;
      if (cvData && cvData.personalInfo) {
        console.log(`   ✅ Has personal info: ${cvData.personalInfo.fullName || 'No name'}`);
        console.log(`   📧 Email: ${cvData.personalInfo.email || 'No email'}`);
        console.log(`   📱 Phone: ${cvData.personalInfo.phone || 'No phone'}`);
        console.log(`   📝 Summary: ${cvData.personalInfo.summary ? 'Present' : 'Missing'}`);
      } else {
        console.log(`   ❌ No personal info found`);
      }
    });

    // Check import sessions for AI summary usage
    console.log('\n🤖 AI Summary Usage Analysis:');
    const aiSessions = await prisma.importSession.findMany({
      where: {
        type: 'ai_summary_generated'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            tier: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (aiSessions.length > 0) {
      console.log(`Found ${aiSessions.length} AI summary generations:`);
      aiSessions.forEach(session => {
        console.log(`   🤖 ${session.user.name} (${session.user.tier}) - ${session.createdAt}`);
        const sessionData = JSON.parse(session.data);
        console.log(`      CV ID: ${sessionData.cvId}`);
        console.log(`      Summary Length: ${sessionData.summaryLength} characters`);
      });
    } else {
      console.log('❌ No AI summary generations found in database');
    }

  } catch (error) {
    console.error('❌ Error debugging Premium AI issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPremiumAIIssue();
