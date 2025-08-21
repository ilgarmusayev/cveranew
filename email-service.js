const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: 'noreply@cvera.net',
        pass: 'ilqarilqar1M@@'
      }
    });
  }

  // Generate secure reset token
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Send forgot password email
  async sendForgotPasswordEmail(userEmail, userName, resetToken) {
    try {
      const resetLink = `https://cvera.net/auth/reset-password?token=${resetToken}`;

      const emailHTML = `
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Şifrə Yeniləmə - CVera</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px; 
                    background-color: #f8fafc;
                }
                .container { 
                    background: #ffffff; 
                    border-radius: 12px; 
                    padding: 40px; 
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e2e8f0;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #2563eb;
                    padding-bottom: 20px;
                }
                .logo { 
                    font-size: 28px; 
                    font-weight: bold; 
                    color: #2563eb; 
                    margin-bottom: 10px;
                }
                .subtitle {
                    color: #64748b;
                    font-size: 16px;
                }
                .content {
                    margin: 30px 0;
                }
                .button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold; 
                    margin: 25px 0;
                    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
                    transition: all 0.3s ease;
                }
                .button:hover {
                    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
                    transform: translateY(-2px);
                }
                .warning { 
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-left: 4px solid #f59e0b; 
                    color: #92400e; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 25px 0;
                }
                .security-note {
                    background: #f1f5f9;
                    border-left: 4px solid #64748b;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-size: 14px;
                    color: #475569;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CVera</div>
                    <div class="subtitle">Peşəkar CV Yaradıcısı</div>
                    <h1 style="color: #1e293b; margin: 20px 0 0 0;">Şifrə Yeniləmə Tələbi</h1>
                </div>
                
                <div class="content">
                    <p style="font-size: 16px;">Salam <strong>${userName || userEmail}</strong>,</p>
                    
                    <p>CVera hesabınız üçün şifrə yeniləmə tələbi aldıq. Şifrənizi yeniləmək üçün aşağıdakı təhlükəsiz linkə basın:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" class="button">🔐 Şifrəni Yenilə</a>
                    </div>
                    
                    <div class="warning">
                        <strong>⏰ Vaxt məhdudiyyəti:</strong> Bu link yalnız <strong>1 saat</strong> ərzində etibarlıdır və yalnız bir dəfə istifadə edilə bilər.
                    </div>
                    
                    <div class="security-note">
                        <strong>🛡️ Təhlükəsizlik məlumatı:</strong><br>
                        • Əgər bu tələbi siz etməmisinizsə, bu emaili nəzərə almayın<br>
                        • Şifrənizi heç vaxt başqa şəxslərlə paylaşmayın<br>
                        • Şübhəli fəaliyyət gördükdə dərhal bizə müraciət edin
                    </div>
                    
                    <p>CVera komandası olaraq hesabınızın təhlükəsizliyini qorumaq bizim əsas prioritetimizdir.</p>
                </div>
                
                <div class="footer">
                    <p><strong>CVera</strong> - Peşəkar karyeranızın başlanğıcı</p>
                    <p>© 2025 CVera. Bütün hüquqlar qorunur.</p>
                    <p style="font-size: 12px; margin-top: 15px;">
                        Bu email avtomatik olaraq göndərilmişdir. Bu emailə cavab verməyin.
                    </p>
                </div>
            </div>
        </body>
        </html>
      `;

      const textVersion = `
CVera - Şifrə Yeniləmə Tələbi

Salam ${userName || userEmail},

CVera hesabınız üçün şifrə yeniləmə tələbi aldıq.

Şifrənizi yeniləmək üçün bu linkə basın: ${resetLink}

DIQQƏT: Bu link yalnız 1 saat ərzində etibarlıdır.

Əgər bu tələbi siz etməmisinizsə, bu emaili nəzərə almayın.

© 2025 CVera
Bu email avtomatik olaraq göndərilmişdir.
      `;

      const mailOptions = {
        from: {
          name: 'CVera Support',
          address: 'noreply@cvera.net'
        },
        to: userEmail,
        subject: '🔐 CVera - Şifrə Yeniləmə Tələbi',
        html: emailHTML,
        text: textVersion,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Forgot password email sent to ${userEmail}`);
      console.log(`📧 Message ID: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
        resetToken: resetToken
      };

    } catch (error) {
      console.error(`❌ Failed to send forgot password email to ${userEmail}:`, error.message);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send password reset confirmation email
  async sendPasswordResetConfirmation(userEmail, userName) {
    try {
      const emailHTML = `
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Şifrə Uğurla Yeniləndi - CVera</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; }
                .container { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
                .logo { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
                .success-icon { font-size: 48px; color: #10b981; margin: 20px 0; }
                .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CVera</div>
                    <div class="success-icon">✅</div>
                    <h1 style="color: #10b981;">Şifrəniz Uğurla Yeniləndi</h1>
                </div>
                
                <p>Salam <strong>${userName || userEmail}</strong>,</p>
                
                <p>CVera hesabınızın şifrəsi uğurla yeniləndi. İndi yeni şifrənizlə hesabınıza daxil ola bilərsiniz.</p>
                
                <p>Əgər bu dəyişikliyi siz etməmisinizsə, dərhal bizə müraciət edin.</p>
                
                <div class="footer">
                    <p><strong>CVera</strong> - Peşəkar karyeranızın başlanğıcı</p>
                    <p>© 2025 CVera. Bütün hüquqlar qorunur.</p>
                </div>
            </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: 'CVera Support',
          address: 'noreply@cvera.net'
        },
        to: userEmail,
        subject: '✅ CVera - Şifrəniz Uğurla Yeniləndi',
        html: emailHTML
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset confirmation sent to ${userEmail}`);

      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error(`❌ Failed to send confirmation email to ${userEmail}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email transporter connection successful');
      return true;
    } catch (error) {
      console.error('❌ Email transporter connection failed:', error.message);
      return false;
    }
  }
}

module.exports = EmailService;
