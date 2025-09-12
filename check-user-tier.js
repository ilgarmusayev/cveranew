const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserTier() {
  try {
    console.log('🔍 İstifadəçi məlumatlarını yoxlayıram...\n');

    // İstifadəçini tap
    const user = await prisma.user.findUnique({
      where: {
        email: 'ilgar5869@gmail.com'
      },
      include: {
        subscriptions: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      }
    });

    if (!user) {
      console.log('❌ İstifadəçi tapılmadı!');
      return;
    }

    console.log('👤 İstifadəçi məlumatları:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Current Tier: ${user.tier}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Updated: ${user.updatedAt}\n`);

    console.log('📋 Subscription-lar:');
    user.subscriptions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ${sub.tier} - ${sub.status}`);
      console.log(`      Provider: ${sub.provider}`);
      console.log(`      Başlanğıc: ${sub.startedAt || sub.createdAt}`);
      console.log(`      Bitmə: ${sub.expiresAt}`);
      console.log(`      Yaradılma: ${sub.createdAt}\n`);
    });

    console.log('💳 Son ödənişlər:');
    user.payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ${payment.planType} - ${payment.status}`);
      console.log(`      Order ID: ${payment.orderId}`);
      console.log(`      Məbləğ: ${payment.amount} ${payment.currency}`);
      console.log(`      Tarix: ${payment.createdAt}\n`);
    });

    // Aktiv subscription tap
    const activeSubscription = user.subscriptions.find(sub => sub.status === 'active');
    
    if (activeSubscription) {
      console.log('✅ Aktiv subscription var:');
      console.log(`   Tier: ${activeSubscription.tier}`);
      console.log(`   Status: ${activeSubscription.status}`);
      
      if (user.tier !== activeSubscription.tier) {
        console.log(`\n🚨 PROBLEM: User tier (${user.tier}) və subscription tier (${activeSubscription.tier}) uyğun deyil!`);
        
        console.log('\n🔧 User tier-i yeniləyirəm...');
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: activeSubscription.tier }
        });
        console.log(`✅ User tier ${user.tier} -> ${activeSubscription.tier} yeniləndi!`);
      } else {
        console.log('✅ User tier və subscription tier uyğundur');
      }
    } else {
      console.log('❌ Aktiv subscription tapılmadı');
    }

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTier();
