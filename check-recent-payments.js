const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentPayments() {
  try {
    console.log('🔍 Son ödənişləri yoxlayıram...\n');

    // Son 24 saat ərzindəki bütün ödənişlər
    const recentPayments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Son 24 saat
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Son 24 saatda ${recentPayments.length} ödəniş tapıldı:\n`);

    recentPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Ödəniş:`);
      console.log(`   Order ID: ${payment.orderId}`);
      console.log(`   İstifadəçi: ${payment.user?.email || 'N/A'}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Məbləğ: ${payment.amount} ${payment.currency}`);
      console.log(`   Plan: ${payment.planType}`);
      console.log(`   Yaradılma tarixi: ${payment.createdAt}`);
      console.log(`   Yenilənmə tarixi: ${payment.updatedAt}`);
      console.log(`   Transaction ID: ${payment.transactionId || 'Yoxdur'}`);
      console.log(`   Provider: ${payment.provider}`);
      console.log('   ───────────────────────────────\n');
    });

    // Pending status-da olan ödənişlər
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\n⏳ Pending status-da ${pendingPayments.length} ödəniş var:\n`);

    pendingPayments.forEach((payment, index) => {
      console.log(`${index + 1}. Pending Ödəniş:`);
      console.log(`   Order ID: ${payment.orderId}`);
      console.log(`   İstifadəçi: ${payment.user?.email || 'N/A'}`);
      console.log(`   Məbləğ: ${payment.amount} ${payment.currency}`);
      console.log(`   Plan: ${payment.planType}`);
      console.log(`   Yaradılma tarixi: ${payment.createdAt}`);
      console.log('   ───────────────────────────────\n');
    });

    // Son subscription-ları yoxlayaq
    const recentSubscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`\n📋 Son 24 saatda ${recentSubscriptions.length} subscription yaradıldı:\n`);

    recentSubscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. Subscription:`);
      console.log(`   İstifadəçi: ${sub.user?.email || 'N/A'}`);
      console.log(`   Tier: ${sub.tier}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Provider: ${sub.provider}`);
      console.log(`   Başlanğıc: ${sub.startedAt}`);
      console.log(`   Bitmə: ${sub.expiresAt}`);
      console.log('   ───────────────────────────────\n');
    });

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentPayments();
