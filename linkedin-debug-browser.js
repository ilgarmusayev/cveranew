// Real-time LinkedIn import debug
// Bu kodu browser console-da istifadə edin

console.log('🔍 LinkedIn Import Debug Started');

// Intercept fetch requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;

  if (url.includes('linkedin-profile') || url.includes('import')) {
    console.log('📡 LinkedIn Import Request Detected:');
    console.log('URL:', url);
    console.log('Method:', options?.method || 'GET');
    console.log('Headers:', options?.headers);
    console.log('Body:', options?.body);

    // Show request details
    if (options?.body) {
      try {
        const parsedBody = JSON.parse(options.body);
        console.log('📝 Request Data:', parsedBody);
      } catch (e) {
        console.log('📝 Raw Body:', options.body);
      }
    }
  }

  return originalFetch.apply(this, args)
    .then(response => {
      if (url.includes('linkedin-profile') || url.includes('import')) {
        console.log('📥 LinkedIn Response:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);

        // Clone response to read it
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          console.log('📦 Response Data:', data);

          if (!data.success) {
            console.error('❌ LinkedIn Import Failed:', data.error);
            console.log('🔍 Debug Info:', {
              remainingImports: data.remainingImports,
              errorMessage: data.error
            });
          }
        }).catch(e => {
          console.log('📦 Response (not JSON):', clonedResponse);
        });
      }

      return response;
    })
    .catch(error => {
      if (url.includes('linkedin-profile') || url.includes('import')) {
        console.error('💥 LinkedIn Request Failed:', error);
      }
      throw error;
    });
};

console.log('✅ Debug interceptor activated. Try LinkedIn import now!');
console.log('📋 Check console for detailed request/response logs.');
