import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Bütün sahələr məcburidir' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Düzgün e-poçt ünvanı daxil edin' },
        { status: 400 }
      );
    }

    // Create transporter for sending emails
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email content for admin notification
    const adminMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@cvera.net',
      to: 'info@cvera.net',
      subject: `CVera.net Əlaqə Formu: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            Yeni Əlaqə Mesajı
          </h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Göndərən Məlumatları:</h3>
            <p><strong>Ad Soyad:</strong> ${name}</p>
            <p><strong>E-poçt:</strong> ${email}</p>
            <p><strong>Mövzu:</strong> ${subject}</p>
          </div>
          
          <div style="background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Mesaj:</h3>
            <p style="line-height: 1.6; color: #4b5563;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Qeyd:</strong> Bu mesaja cavab vermək üçün birbaşa ${email} ünvanına yazın.
            </p>
          </div>
        </div>
      `,
    };

    // Email content for user confirmation
    const userMailOptions = {
      from: process.env.SMTP_FROM || 'noreply@cvera.net',
      to: email,
      subject: 'CVera.net - Mesajınız alındı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">CVera.net</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">LinkedIn və AI ilə CV yaradın</p>
          </div>
          
          <div style="padding: 30px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #374151; margin-top: 0;">Hörmətli ${name},</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Mesajınızı aldıq və tezliklə sizə cavab verəcəyik. CVera.net komandası olaraq sizinlə əlaqə saxlamaqdan məmnunluq duyuruq.
            </p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Mesajınızın məzmunu:</h3>
              <p><strong>Mövzu:</strong> ${subject}</p>
              <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin-top: 10px;">
                <p style="margin: 0; color: #4b5563; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Əlavə məlumat və dəstək:</h3>
              <ul style="color: #3730a3; margin: 10px 0; padding-left: 20px;">
                <li>Dəstək e-poçt: <a href="mailto:support@cvera.net" style="color: #2563eb;">support@cvera.net</a></li>
                <li>Ümumi sorğular: <a href="mailto:info@cvera.net" style="color: #2563eb;">info@cvera.net</a></li>
                <li>Veb sayt: <a href="https://cvera.net" style="color: #2563eb;">cvera.net</a></li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                CVera.net komandası<br>
                LinkedIn və AI inteqrasiyası ilə professional CV yaradın
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    return NextResponse.json(
      { success: true, message: 'Mesajınız uğurla göndərildi' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Mesaj göndərilərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
