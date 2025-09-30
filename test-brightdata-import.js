// Simple test script for BrightData LinkedIn import
const axios = require('axios');

async function testBrightDataImport() {
  try {
    console.log('🧪 Testing BrightData LinkedIn Import...');
    
    // Replace with your actual JWT token from localStorage
    const token = 'your_jwt_token_here'; // Get this from browser localStorage
    
    const response = await axios.post('http://localhost:3000/api/import/linkedin-brightdata', {
      linkedinUrl: 'https://linkedin.com/in/musayevcreate'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.cvId) {
      console.log('🎉 CV successfully created!');
      console.log('📝 CV ID:', response.data.data.cvId);
      console.log('🏷️ CV Title:', response.data.data.cvTitle);
      console.log('📊 Stats:', response.data.data.stats);
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

console.log('ℹ️ Instructions:');
console.log('1. Start your Next.js dev server: npm run dev');
console.log('2. Get your JWT token from browser localStorage');
console.log('3. Replace "your_jwt_token_here" with actual token');
console.log('4. Run: node test-brightdata-import.js');
console.log('');

testBrightDataImport();