// Next.js integration for automatic promo code expiration checking
// Import this file in your main app layout or server component

import PromoCodeExpirationScheduler from '../../promo-cleanup-scheduler.js';

let scheduler: any = null;

export function initPromoCodeScheduler() {
  if (typeof window === 'undefined') { // Only run on server-side
    if (!scheduler) {
      const PromoScheduler = require('../../promo-cleanup-scheduler.js');
      scheduler = new PromoScheduler();
      scheduler.start();

      console.log('🚀 Promokod müddət yoxlama sistemi Next.js-də aktiv edildi');
    }
  }
}

// Manual trigger function for admin panel
export async function triggerPromoCodeCheck() {
  if (typeof window === 'undefined') {
    if (!scheduler) {
      const PromoScheduler = require('../../promo-cleanup-scheduler.js');
      scheduler = new PromoScheduler();
    }

    await scheduler.triggerManual();
  } else {
    // Client-side: call API directly
    try {
      const response = await fetch('/api/promo/check-expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ manualTrigger: true })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Promokod yoxlanması zamanı xəta:', error);
      throw error;
    }
  }
}

// Auto-initialize when imported
if (typeof window === 'undefined') {
  initPromoCodeScheduler();
}
