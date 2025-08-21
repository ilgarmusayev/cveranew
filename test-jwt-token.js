// Test JWT token generation and verification
const jwt = require('jsonwebtoken');

console.log('🔍 JWT Token Test...');

const JWT_SECRET = 'az8V!hjkJHKL1231jklADJKU2389@qweLKP';

// Test token generation
const testPayload = {
  userId: 'test-user-123',
  email: 'test@example.com'
};

try {
  // Generate token
  const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '24h' });
  console.log('✅ Token generation successful');
  console.log('Token length:', token.length);

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token verification successful');
  console.log('Decoded payload:', decoded);

  // Check expiration
  console.log('Token expires at:', new Date(decoded.exp * 1000));
  console.log('Current time:', new Date());
  console.log('Token valid:', decoded.exp * 1000 > Date.now());

} catch (error) {
  console.error('❌ JWT Test failed:', error.message);
}
