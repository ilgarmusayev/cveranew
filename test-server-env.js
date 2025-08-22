// Test server environment variables
async function testServerEnvironment() {
  try {
    console.log('🚀 Testing server environment...');
    
    const response = await fetch('http://localhost:3001/api/debug/env', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server environment response:', data);
    } else {
      console.log('❌ Server environment failed:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response text:', text);
    }
    
  } catch (error) {
    console.error('❌ Server environment error:', error.message);
  }
}

testServerEnvironment();
