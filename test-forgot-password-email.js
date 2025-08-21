const EmailService = require('./email-service');

async function testForgotPasswordEmailSystem() {
  console.log('🚀 CVera Forgot Password Email System Test\n');

  const emailService = new EmailService();

  // Test 1: Email connection
  console.log('1️⃣ Testing email connection...');
  const connectionTest = await emailService.testConnection();

  if (!connectionTest) {
    console.log('❌ Email connection failed. Check configuration.');
    return;
  }
  console.log('✅ Email connection successful\n');

  // Test 2: Send forgot password email
  console.log('2️⃣ Testing forgot password email...');
  const resetToken = emailService.generateResetToken();
  console.log(`🔑 Generated reset token: ${resetToken.substring(0, 10)}...`);

  const forgotPasswordResult = await emailService.sendForgotPasswordEmail(
    'musayev.create@gmail.com',
    'Musayev Test User',
    resetToken
  );

  if (forgotPasswordResult.success) {
    console.log('✅ Forgot password email sent successfully');
    console.log(`📧 Message ID: ${forgotPasswordResult.messageId}`);
  } else {
    console.log('❌ Failed to send forgot password email:', forgotPasswordResult.error);
    return;
  }

  // Wait a moment before sending confirmation
  console.log('\n⏳ Waiting 3 seconds before sending confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 3: Send password reset confirmation
  console.log('\n3️⃣ Testing password reset confirmation email...');
  const confirmationResult = await emailService.sendPasswordResetConfirmation(
    'musayev.create@gmail.com',
    'Musayev Test User'
  );

  if (confirmationResult.success) {
    console.log('✅ Password reset confirmation email sent successfully');
    console.log(`📧 Message ID: ${confirmationResult.messageId}`);
  } else {
    console.log('❌ Failed to send confirmation email:', confirmationResult.error);
  }

  // Test summary
  console.log('\n📊 Test Summary:');
  console.log('├── Email Connection:', connectionTest ? '✅ Pass' : '❌ Fail');
  console.log('├── Forgot Password Email:', forgotPasswordResult.success ? '✅ Pass' : '❌ Fail');
  console.log('└── Confirmation Email:', confirmationResult.success ? '✅ Pass' : '❌ Fail');

  if (connectionTest && forgotPasswordResult.success && confirmationResult.success) {
    console.log('\n🎉 All tests passed! Forgot password email system is ready for production.');
    console.log('\n📝 Integration Notes:');
    console.log('• Use EmailService.generateResetToken() to create secure tokens');
    console.log('• Store reset tokens in database with expiration (1 hour recommended)');
    console.log('• Call sendForgotPasswordEmail() when user requests password reset');
    console.log('• Call sendPasswordResetConfirmation() after successful password change');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration and try again.');
  }
}

// Test with multiple email addresses
async function testMultipleEmails() {
  console.log('\n🔄 Testing with multiple email addresses...');

  const emailService = new EmailService();
  const testEmails = [
    { email: 'musayev.create@gmail.com', name: 'Musayev Primary' },
    // Add more test emails if needed
  ];

  for (const testUser of testEmails) {
    console.log(`\n📧 Testing email to: ${testUser.email}`);
    const token = emailService.generateResetToken();
    const result = await emailService.sendForgotPasswordEmail(
      testUser.email,
      testUser.name,
      token
    );

    console.log(`Result: ${result.success ? '✅ Success' : '❌ Failed'}`);

    if (!result.success) {
      console.log(`Error: ${result.error}`);
    }

    // Wait between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Example usage function showing how to integrate
function showIntegrationExample() {
  console.log('\n📋 Integration Example:');
  console.log(`
// In your forgot password route:
const EmailService = require('./email-service');

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // 1. Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 2. Generate reset token
    const emailService = new EmailService();
    const resetToken = emailService.generateResetToken();
    
    // 3. Store token in database with expiration
    await ResetToken.create({
      userId: user.id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    
    // 4. Send email
    const result = await emailService.sendForgotPasswordEmail(
      user.email,
      user.name,
      resetToken
    );
    
    if (result.success) {
      res.json({ message: 'Password reset email sent' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// In your reset password route:
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // 1. Verify token
    const resetToken = await ResetToken.findOne({ 
      token, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // 2. Update password
    const user = await User.findById(resetToken.userId);
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    // 3. Delete used token
    await ResetToken.deleteOne({ _id: resetToken._id });
    
    // 4. Send confirmation email
    const emailService = new EmailService();
    await emailService.sendPasswordResetConfirmation(user.email, user.name);
    
    res.json({ message: 'Password reset successful' });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
  `);
}

// Run the tests
async function runTests() {
  await testForgotPasswordEmailSystem();
  await testMultipleEmails();
  showIntegrationExample();
}

runTests().catch(console.error);
