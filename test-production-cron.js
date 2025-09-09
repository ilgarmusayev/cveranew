// Vercel Production Cron Job Test
// Bu faylı production-da test etmək üçün istifadə edin

const axios = require('axios');

async function testProductionCronJob() {
  try {
    console.log('🔍 Testing production cron job...');
    console.log('🗓️ Current time:', new Date().toISOString());

    // Production endpoint-i test et
    const response = await axios.post('https://cvera.net/api/cron/cancel-expired-subscriptions', {}, {
      headers: {
        'Authorization': 'Bearer GRSFF935BBJHJGBV44343HBJ', // CRON_SECRET
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Production cron job response:', response.data);

    if (response.data.success) {
      console.log(`📊 Canceled subscriptions: ${response.data.canceledCount}`);
      
      if (response.data.canceledSubscriptions && response.data.canceledSubscriptions.length > 0) {
        console.log('📋 Canceled subscription details:');
        response.data.canceledSubscriptions.forEach(sub => {
          console.log(`  - User: ${sub.userEmail}, Tier: ${sub.tier}, Expired: ${sub.expiredAt}`);
        });
      } else {
        console.log('✅ No expired subscriptions found (system working correctly)');
      }
    } else {
      console.log('❌ Production cron job failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Error testing production cron job:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Likely authentication issue - check CRON_SECRET environment variable');
    }
  }
}

// Production test qısa müddətdə çalıştırmaq üçün
async function triggerProductionCleanup() {
  console.log('🚀 Triggering immediate production subscription cleanup...');
  await testProductionCronJob();
}

triggerProductionCleanup();
