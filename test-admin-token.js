const jwt = require('jsonwebtoken');

// Test admin token creation və verification
const JWT_SECRET = 'az8V!hjkJHKL1231jklADJKU2389@qweTFD';

console.log('🔐 Admin Token Test');
console.log('==================');

// Admin token yaradırıq
const adminPayload = {
  adminId: 'test-admin-123',
  email: 'admin@cvera.com',
  role: 'SUPER_ADMIN',
  isAdmin: true,
  name: 'CVERA Administrator'
};

const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('✅ Admin token yaradıldı:');
console.log('Token:', adminToken.substring(0, 50) + '...');
console.log('');

// Token-i verify edək
try {
  const decoded = jwt.verify(adminToken, JWT_SECRET);
  console.log('✅ Token verification uğurlu');
  console.log('Decoded data:', decoded);
  console.log('');

  // Admin check
  if (decoded.role === 'SUPER_ADMIN' || decoded.isAdmin) {
    console.log('✅ Admin icazələri təsdiqləndi');
  } else {
    console.log('❌ Admin icazələri tapılmadı');
  }

} catch (error) {
  console.error('❌ Token verification xətası:', error.message);
}

console.log('');
console.log('📋 Admin panel giriş məlumatları:');
console.log('- URL: /sistem/login');
console.log('- Email: admin@cvera.com');
console.log('- Şifrə: Admin123!');
console.log('');
console.log('💡 Bu token localStorage-da "adminToken" key ilə saxlanmalıdır');
