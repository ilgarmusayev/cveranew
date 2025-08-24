// Test JWT token refresh functionality
const testTokenRefresh = async () => {
  console.log('🔍 Testing JWT token refresh...');
  
  try {
    // Try to call an AI endpoint that requires authentication
    const response = await fetch('/api/ai/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: JSON.stringify({
        personalInfo: { name: 'Test User' },
        experiences: [],
        education: []
      })
    });

    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('❌ JWT expired as expected, testing refresh...');
      
      // Try to refresh token
      const refreshResponse = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('✅ Token refresh successful');
        console.log('New token length:', refreshData.accessToken?.length);
        
        if (refreshData.accessToken) {
          localStorage.setItem('accessToken', refreshData.accessToken);
          console.log('✅ New token saved to localStorage');
          
          // Try the AI call again with new token
          const retryResponse = await fetch('/api/ai/summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${refreshData.accessToken}`
            },
            body: JSON.stringify({
              personalInfo: { name: 'Test User' },
              experiences: [],
              education: []
            })
          });
          
          if (retryResponse.ok) {
            console.log('✅ AI API call successful after token refresh');
          } else {
            console.log('❌ AI API call still failed after token refresh');
            const errorData = await retryResponse.json();
            console.log('Error:', errorData);
          }
        }
      } else {
        console.log('❌ Token refresh failed');
        const refreshError = await refreshResponse.json();
        console.log('Refresh error:', refreshError);
      }
    } else if (response.ok) {
      console.log('✅ AI API call successful with current token');
    } else {
      console.log('❌ AI API call failed with status:', response.status);
      const errorData = await response.json();
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
if (typeof window !== 'undefined') {
  console.log('JWT Token Refresh Test loaded. Run testTokenRefresh() in console to test.');
  window.testTokenRefresh = testTokenRefresh;
} else {
  console.log('This script should be run in the browser');
}

export default testTokenRefresh;
