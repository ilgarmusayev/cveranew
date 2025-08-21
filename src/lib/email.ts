import nodemailer from 'nodemailer';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email sending options
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create email transporter with Hostinger SMTP
export function createEmailTransporter(): nodemailer.Transporter {
  const config: EmailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true' || true, // SSL/TLS
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  };

  if (!config.auth.user || !config.auth.pass) {
    throw new Error('Email konfigurasyonu tamamlanmamış. EMAIL_USER və EMAIL_PASS tələb olunur.');
  }

  console.log('📧 Email transporter yaradılır:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user.substring(0, 3) + '***'
  });

  return nodemailer.createTransport(config); // Fixed: createTransport not createTransporter
}

// Send email utility function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'CVera Support',
        address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'noreply@cvera.net'
      },
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    console.log('📤 Email göndərilir:', {
      to: options.to,
      subject: options.subject,
      from: mailOptions.from
    });

    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email uğurla göndərildi:', {
      messageId: result.messageId,
      response: result.response
    });

    return true;
  } catch (error) {
    console.error('❌ Email göndərmə xətası:', error);
    return false;
  }
}

// Password reset email template
export function createPasswordResetEmailTemplate(
  userName: string,
  resetLink: string,
  expirationTime: string = '1 saat'
): { subject: string; html: string; text: string } {
  const subject = 'CVera - Şifrə Yeniləmə Tələbi';

  const html = `
    <!DOCTYPE html>
    <html lang="az">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifrə Yeniləmə</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background: #ffffff;
                border-radius: 12px;
                padding: 40px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39);
                transition: all 0.3s ease;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px 0 rgba(37, 99, 235, 0.5);
            }
            .warning {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                color: #92400e;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
            .link {
                color: #2563eb;
                word-break: break-all;
                font-size: 14px;
                font-family: monospace;
                background: #f3f4f6;
                padding: 8px;
                border-radius: 4px;
                display: block;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">CVera</div>
                <h1 class="title">Şifrə Yeniləmə Tələbi</h1>
            </div>
            
            <div class="content">
                <p>Salam <strong>${userName}</strong>,</p>
                
                <p>CVera hesabınız üçün şifrə yeniləmə tələbi aldıq. Şifrənizi yeniləmək üçün aşağıdakı linkə basın:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" class="button">Şifrəni Yenilə</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Diqqət:</strong> Bu link ${expirationTime} ərzində etibarlıdır. Müddət bitdikdən sonra yeni tələb etməlisiniz.
                </div>
                
                <p>Əgər yuxarıdakı butonu işləmirsə, bu linki browser-də açın:</p>
                <div class="link">${resetLink}</div>
                
                <p><strong>Əgər bu tələbi siz etməmisinizsə:</strong></p>
                <ul>
                    <li>Bu emaili nəzərə almayın</li>
                    <li>Heç bir linkə basmayın</li>
                    <li>Şifrəniz təhlükəsizdir və dəyişməyəcək</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Bu email avtomatik olaraq göndərilmişdir. Cavab verməyin.</p>
                <p>© 2025 CVera. Bütün hüquqlar qorunur.</p>
                <p style="margin-top: 10px;">
                    <a href="https://cvera.net" style="color: #2563eb;">cvera.net</a> | 
                    <a href="https://cvera.net/contact" style="color: #2563eb;">Dəstək</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
CVera - Şifrə Yeniləmə Tələbi

Salam ${userName},

CVera hesabınız üçün şifrə yeniləmə tələbi aldıq.

Şifrənizi yeniləmək üçün bu linkə basın:
${resetLink}

⚠️ DİQQƏT: Bu link ${expirationTime} ərzində etibarlıdır.

Əgər bu tələbi siz etməmisinizsə, bu emaili nəzərə almayın və heç bir linkə basmayın.

© 2025 CVera
cvera.net
  `;

  return { subject, html, text };
}

// Account verification email template
export function createAccountVerificationEmailTemplate(
  userName: string,
  verificationLink: string
): { subject: string; html: string; text: string } {
  const subject = 'CVera - Hesabınızı Təsdiqlə';

  const html = `
    <!DOCTYPE html>
    <html lang="az">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hesab Təsdiqi</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .container {
                background: #ffffff;
                border-radius: 12px;
                padding: 40px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .title {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .button {
                display: inline-block;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.39);
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">CVera</div>
                <h1 class="title">Xoş Gəlmisiniz!</h1>
            </div>
            
            <div class="content">
                <p>Salam <strong>${userName}</strong>,</p>
                
                <p>CVera-ya qeydiyyatdan keçdiyinizə görə təşəkkür edirik! Hesabınızı aktivləşdirmək üçün aşağıdakı linkə basın:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" class="button">Hesabı Təsdiqlə</a>
                </div>
                
                <p>Hesabınızı təsdiqlədikdən sonra bütün CVera xüsusiyyətlərindən istifadə edə biləcəksiniz:</p>
                <ul>
                    <li>✅ Peşəkar CV-lər yaradın</li>
                    <li>✅ LinkedIn profilinizi import edin</li>
                    <li>✅ AI ilə professional summary yaradın</li>
                    <li>✅ Müxtəlif template-lərdən istifadə edin</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>© 2025 CVera. Bütün hüquqlar qorunur.</p>
                <p><a href="https://cvera.net" style="color: #2563eb;">cvera.net</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  const text = `
CVera - Hesabınızı Təsdiqlə

Salam ${userName},

CVera-ya qeydiyyatdan keçdiyinizə görə təşəkkür edirik!

Hesabınızı aktivləşdirmək üçün bu linkə basın:
${verificationLink}

© 2025 CVera
cvera.net
  `;

  return { subject, html, text };
}
