const axios = require('axios');

async function testPromoValidation() {
  try {
    console.log('🧪 Testing promo validation API...');
    
    // Test expired promo code
    try {
      const expiredResponse = await axios.post('http://localhost:3000/api/promo-code/validate', {
        promoCode: 'TEST_EXPIRED_PROMO'
      }, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiMWM2MDg3NC03Y2M5LTQwMGMtYTI1NC0wMzVhMTA2MzUxM2MiLCJlbWFpbCI6ImlsZ2FyNTg2OUBnbWFpbC5jb20iLCJpYXQiOjE3NTczNjQ5OTYsImV4cCI6MTc1NzQ1MTM5Nn0.rq_C7PGOm7tDcjjZJN8B4nZK6sTFUHj3AQvKlBl1pQA'
        }
      });
      console.log('❌ TEST_EXPIRED_PROMO result:', expiredResponse.data);
    } catch (error) {
      console.log('✅ TEST_EXPIRED_PROMO correctly failed:', error.response?.data?.message || error.message);
    }

    // Test valid promo code
    try {
      const validResponse = await axios.post('http://localhost:3000/api/promo-code/validate', {
        promoCode: 'TEST_VALID_PROMO'
      }, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiMWM2MDg3NC03Y2M5LTQwMGMtYTI1NC0wMzVhMTA2MzUxM2MiLCJlbWFpbCI6ImlsZ2FyNTg2OUBnbWFpbC5jb20iLCJpYXQiOjE3NTczNjQ5OTYsImV4cCI6MTc1NzQ1MTM5Nn0.rq_C7PGOm7tDcjjZJN8B4nZK6sTFUHj3AQvKlBl1pQA'
        }
      });
      console.log('✅ TEST_VALID_PROMO result:', validResponse.data);
    } catch (error) {
      console.log('❌ TEST_VALID_PROMO failed:', error.response?.data?.message || error.message);
    }

    // Test cron job
    try {
      const cronResponse = await axios.get('http://localhost:3000/api/cron/deactivate-expired-promodes', {
        headers: {
          'Authorization': 'Bearer default_cron_secret_change_me'
        }
      });
      console.log('✅ Cron job result:', cronResponse.data);
    } catch (error) {
      console.log('❌ Cron job failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPromoValidation();
