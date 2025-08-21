// Promo kod avtomatik təmizləməsi üçün cron job
// Bu faylı server başladıqda və ya ayrıca çalışdırmaq üçün istifadə edin

const axios = require('axios');
const cron = require('node-cron');

class PromoCodeExpirationScheduler {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.isRunning = false;
  }

  // Check expired promo codes
  async checkExpiredPromoCodes() {
    try {
      console.log('🔄 Promokod müddətlərinin avtomatik yoxlanması...');

      const response = await axios.get(`${this.apiUrl}/api/promo/check-expiration`);

      if (response.data.success) {
        const { deactivatedCount, deactivatedCodes } = response.data;

        if (deactivatedCount > 0) {
          console.log(`✅ ${deactivatedCount} promokod avtomatik deaktiv edildi:`);
          deactivatedCodes?.forEach((code) => {
            console.log(
              `  - ${code.code} (${code.tier}) - Müddət: ${new Date(
                code.expiresAt
              ).toLocaleDateString()}`
            );
          });
        } else {
          console.log('✅ Müddəti çatmış promokod tapılmadı');
        }
      } else {
        console.error('❌ Promokod yoxlanması uğursuz oldu:', response.data.error);
      }
    } catch (error) {
      console.error('❌ Promokod müddətlərinin yoxlanması zamanı xəta:', error.message);
    }
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Promokod planlaması artıq işləyir');
      return;
    }

    // Run every day at 23:59 (end of day)
    const schedule = '59 23 * * *';

    console.log('🚀 Promokod müddət yoxlama planlaması başladı');
    console.log('📅 Hər gün saat 23:59-da işləyəcək');

    cron.schedule(
      schedule,
      async () => {
        console.log('\n⏰ Günlük promokod müddət yoxlaması - ' + new Date().toLocaleString());
        await this.checkExpiredPromoCodes();
      },
      {
        scheduled: true,
        timezone: 'Asia/Baku',
      }
    );

    // Also run at startup to check immediately
    setTimeout(() => {
      console.log('\n🔄 Başlanğıc promokod müddət yoxlaması...');
      this.checkExpiredPromoCodes();
    }, 5000); // Wait 5 seconds after startup

    this.isRunning = true;
    console.log('✅ Promokod müddət yoxlama planlaması aktiv edildi');
  }

  // Manual trigger for testing
  async triggerManual() {
    console.log('\n🔧 Manual promokod müddət yoxlaması tetikləndi...');
    await this.checkExpiredPromoCodes();
  }

  // Stop the scheduler
  stop() {
    this.isRunning = false;
    console.log('🛑 Promokod müddət yoxlama planlaması dayandırıldı');
  }
}

// Create and start the scheduler
const scheduler = new PromoCodeExpirationScheduler();

// Start the scheduler when this script is run
if (require.main === module) {
  console.log('📋 Promokod Müddət Yoxlama Sistemi');
  console.log('=====================================');

  scheduler.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🔄 Sistem bağlanır...');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🔄 Sistem bağlanır...');
    scheduler.stop();
    process.exit(0);
  });

  // Keep the process running
  console.log('✅ Sistem işləyir. Dayandırmaq üçün Ctrl+C basın.\n');
}

module.exports = PromoCodeExpirationScheduler;
