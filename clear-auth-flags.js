// Bu script hal-hazırkı logout flag-larını təmizləyəcək və sistemi fresh edəcək

console.log('🔧 Sistemi təmizləyirəm və hazırlayıram...');

if (typeof window !== 'undefined') {
  // Clear all logout flags and auth data
  localStorage.removeItem('user_logged_out');
  localStorage.removeItem('logout_timestamp');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('auth-token');

  console.log('✅ Bütün logout flag-ları təmizləndi!');
  console.log('🔄 Sistem hazırdır - yenidən giriş edə bilərsiniz');

  // Optionally reload the page
  // window.location.reload();
} else {
  console.log('⚠️ Bu script browser console-da işə salınmalıdır');
}
