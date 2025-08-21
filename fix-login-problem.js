// Bu script localStorage-daki logout flag-larını təmizləyəcək və giriş problemini həll edəcək

console.log('🔧 Giriş problemini həll edirəm...');

// Browser console-da işə salınacaq kod
const clearLogoutFlags = `
console.log('🧹 Logout flag-larını təmizləyirəm...');

// Logout flag-larını təmizlə
localStorage.removeItem('user_logged_out');
localStorage.removeItem('logout_timestamp');

// Bütün authentication məlumatlarını təmizlə
localStorage.removeItem('accessToken');
localStorage.removeItem('token');
localStorage.removeItem('auth-token');

console.log('✅ Logout flag-ları təmizləndi!');
console.log('🔄 İndi səhifəni yeniləyin və giriş etməyə çalışın');

// Səhifəni avtomatik yenilə
window.location.reload();
`;

console.log('🌐 Browser console-da bu kodu işə salın:');
console.log(clearLogoutFlags);

console.log('\n📋 Və ya bu addımları izləyin:');
console.log('1. Browser Developer Tools açın (F12)');
console.log('2. Console tab-ına keçin');
console.log('3. Yuxarıdakı kodu kopyalayıb console-a yapışdırın');
console.log('4. Enter basın');
console.log('5. Səhifə avtomatik yenilənəcək');
console.log('6. Yenidən giriş etməyə çalışın');
