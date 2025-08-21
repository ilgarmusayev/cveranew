// Auth sistemi real-time debug script
console.log('🔍 Auth sistemi debug rejimində...');

// Monitor localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  console.log(`📝 localStorage.setItem: ${key} = ${value.substring(0, 50)}...`);
  return originalSetItem.apply(this, arguments);
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
  console.log(`🗑️ localStorage.removeItem: ${key}`);
  return originalRemoveItem.apply(this, arguments);
};

// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  console.log(`🌐 Fetch request: ${url}`, options?.method || 'GET');

  return originalFetch.apply(this, arguments).then(response => {
    console.log(`📡 Fetch response: ${url} - Status: ${response.status}`);
    return response;
  });
};

// Monitor auth context changes
let authStateCount = 0;
const monitorAuth = () => {
  const authStates = [];

  const logAuthState = () => {
    authStateCount++;
    const state = {
      count: authStateCount,
      timestamp: new Date().toLocaleTimeString(),
      token: localStorage.getItem('accessToken') ? 'exists' : 'none',
      logoutFlag: localStorage.getItem('user_logged_out'),
      logoutTime: localStorage.getItem('logout_timestamp'),
      currentPath: window.location.pathname
    };

    console.log(`🔍 Auth State #${authStateCount}:`, state);
    authStates.push(state);

    // Show auth flow summary every 5 states
    if (authStateCount % 5 === 0) {
      console.log('📊 Auth State Summary:', authStates.slice(-5));
    }
  };

  // Initial state
  logAuthState();

  // Monitor route changes
  let currentPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      logAuthState();
    }
  }, 100);

  return { logAuthState, getStates: () => authStates };
};

// Start monitoring
const authMonitor = monitorAuth();

console.log('✅ Auth debug monitoring başladı');
console.log('📱 Bu script auth prosesini izləyəcək');
console.log('🔍 Console log-larını izləyin və login etməyə çalışın');

// Add manual state check function
window.checkAuthState = () => {
  console.log('🔍 Manual Auth State Check:');
  console.log('Token:', localStorage.getItem('accessToken') ? 'exists' : 'none');
  console.log('Logout flag:', localStorage.getItem('user_logged_out'));
  console.log('Current path:', window.location.pathname);
  console.log('All localStorage keys:', Object.keys(localStorage));
};
