const axios = require('axios');

async function testAIEndpoint() {
  try {
    console.log('🚀 Testing AI Summary API...');
    
    const response = await axios.post('http://localhost:3001/api/generate-ai-summary', {
      cvId: 'test-cv-id'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('✅ API Response:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('Expected error (no valid token):', error.response?.status, error.response?.data);
  }
}

testAIEndpoint();
