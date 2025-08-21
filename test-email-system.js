const nodemailer = require('nodemailer');

async function testEmailConnection() {
  console.log('📧 Email konfiqurasiyası test edilir...');

  const config = {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: 'noreply@cvera.net',
      pass: 'ilqarilqar1M@@'
    }
  };

  console.log('🔧 Email konfigurasyonu:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user
  });

  try {
    // Create transporter - correct method name
    const transporter = nodemailer.createTransport(config);

    // Test connection
    console.log('🔗 SMTP bağlantısı test edilir...');
    await transporter.verify();
    console.log('✅ SMTP bağlantısı uğurludur!');

    // Test email send
    console.log('📤 Test email göndərilir...');
    const testEmailOptions = {
      from: {
        name: 'CVERA Support',
        address: 'noreply@cvera.net'
      },
      to: 'musayev.create@gmail.com', // Test email address
      subject: 'CVera Email Test',
      html: `
        <h2>CVera Email Test</h2>
        <p>Bu test emaildir. Əgər bu emaili görürsinizsə, email sistemi düzgün işləyir.</p>
        <p>Tarix: ${new Date().toLocaleString('az-AZ')}</p>
      `,
      text: 'CVera email sistemi test - bu test emaildir.'
    };

    const result = await transporter.sendMail(testEmailOptions);

    console.log('✅ Test email uğurla göndərildi!');
    console.log('📋 Email detalları:', {
      messageId: result.messageId,
      response: result.response,
      accepted: result.accepted,
      rejected: result.rejected
    });

    return true;

  } catch (error) {
    console.error('❌ Email xətası:', error.message);
    console.error('🔍 Xəta kodu:', error.code);
    console.error('🔍 Tam xəta:', error);
    return false;
  }
}

// Test password reset email template
async function testPasswordResetEmail() {
  console.log('\n🔐 Password reset email test edilir...');

  const config = {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'noreply@cvera.net',
      pass: 'ilqarilqar1M@@'
    }
  };

  try {
    const transporter = nodemailer.createTransport(config);

    const resetLink = 'https://cvera.net/auth/reset-password?token=test-token-12345';
    const userName = 'Test User';

    const emailHTML = `
      <!DOCTYPE html>
      <html lang="az">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Şifrə Yeniləmə</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #ffffff; border-radius: 8px; padding: 30px; border: 1px solid #ddd; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">CVera</div>
                  <h1>Şifrə Yeniləmə Tələbi</h1>
              </div>
              
              <p>Salam <strong>${userName}</strong>,</p>
              
              <p>CVera hesabınız üçün şifrə yeniləmə tələbi aldıq. Şifrənizi yeniləmək üçün aşağıdakı linkə basın:</p>
              
              <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Şifrəni Yenilə</a>
              </div>
              
              <div class="warning">
                  <strong>⚠️ Diqqət:</strong> Bu link 1 saat ərzində etibarlıdır.
              </div>
              
              <p>Əgər bu tələbi siz etməmisinizsə, bu emaili nəzərə almayın.</p>
              
              <p>© 2025 CVera</p>
          </div>
      </body>
      </html>
    `;

    const passwordResetOptions = {
      from: {
        name: 'CVERA Support',
        address: 'noreply@cvera.net'
      },
      to: 'musayev.create@gmail.com',
      subject: 'CVera - Şifrə Yeniləmə Tələbi (Test)',
      html: emailHTML,
      text: `CVera Şifrə Yeniləmə\n\nSalam ${userName},\n\nŞifrənizi yeniləmək üçün bu linkə basın: ${resetLink}\n\n© 2025 CVera`
    };

    const result = await transporter.sendMail(passwordResetOptions);

    console.log('✅ Password reset email test uğurludur!');
    console.log('📋 Detallar:', {
      messageId: result.messageId,
      response: result.response
    });

    return true;

  } catch (error) {
    console.error('❌ Password reset email xətası:', error.message);
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 CVera Email System Test Başlanır\n');

  const basicTest = await testEmailConnection();
  const resetTest = await testPasswordResetEmail();

  console.log('\n📊 Test Nəticələri:');
  console.log('- Basic Email Test:', basicTest ? '✅ Uğurlu' : '❌ Uğursuz');
  console.log('- Password Reset Test:', resetTest ? '✅ Uğurlu' : '❌ Uğursuz');

  if (basicTest && resetTest) {
    console.log('\n🎉 Bütün email testləri uğurludur! Email sistemi hazırdır.');
  } else {
    console.log('\n⚠️ Bəzi testlər uğursuz oldu. Email konfiqurasiyasını yoxlayın.');
  }
}

runAllTests().catch(console.error);
