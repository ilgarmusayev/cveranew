import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

const emailService = new EmailService();

// Get error messages in 3 languages
const getMessages = (language: string = 'azerbaijani') => {
  const messages = {
    azerbaijani: {
      tokenRequired: 'Təsdiqləmə tokeni tələb olunur',
      tokenInvalid: 'Təsdiqləmə tokeni etibarsızdır və ya müddəti bitib',
      alreadyVerified: 'Bu hesab artıq təsdiqlənib',
      verificationSuccess: 'Email uğurla təsdiqləndi! İndi hesabınıza daxil ola bilərsiniz.',
      verificationError: 'E-poçt təsdiqi zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      emailRequired: 'E-poçt ünvanı tələb olunur',
      emailNotFound: 'Bu e-poçt ünvanı ilə istifadəçi tapılmadı',
      emailResent: 'Təsdiqləmə emaili yenidən göndərildi. E-poçt qutunuzu yoxlayın.',
      emailSendError: 'E-poçt göndərmədə xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      resendError: 'E-poçt yenidən göndərmədə xəta baş verdi.'
    },
    english: {
      tokenRequired: 'Verification token is required',
      tokenInvalid: 'Verification token is invalid or has expired',
      alreadyVerified: 'This account is already verified',
      verificationSuccess: 'Email successfully verified! You can now login to your account.',
      verificationError: 'Error occurred during email verification. Please try again.',
      emailRequired: 'Email address is required',
      emailNotFound: 'User not found with this email address',
      emailResent: 'Verification email has been resent. Please check your inbox.',
      emailSendError: 'Error sending email. Please try again.',
      resendError: 'Error resending verification email.'
    },
    russian: {
      tokenRequired: 'Требуется токен подтверждения',
      tokenInvalid: 'Токен подтверждения недействителен или истек',
      alreadyVerified: 'Эта учетная запись уже подтверждена',
      verificationSuccess: 'Email успешно подтвержден! Теперь вы можете войти в свою учетную запись.',
      verificationError: 'Произошла ошибка при подтверждении электронной почты. Пожалуйста, попробуйте снова.',
      emailRequired: 'Требуется адрес электронной почты',
      emailNotFound: 'Пользователь с этим адресом электронной почты не найден',
      emailResent: 'Письмо с подтверждением отправлено повторно. Пожалуйста, проверьте свою почту.',
      emailSendError: 'Ошибка при отправке электронной почты. Пожалуйста, попробуйте снова.',
      resendError: 'Ошибка при повторной отправке письма с подтверждением.'
    }
  };
  
  return messages[language as keyof typeof messages] || messages.azerbaijani;
};

export async function GET(request: NextRequest) {
  try {
    // Get site language from headers
    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: content.tokenRequired },
        { status: 400 }
      );
    }

    // Find user with valid verification token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token, // Reusing reset token field for verification
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        },
        status: "pending_verification"
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          message: content.tokenInvalid,
          error: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified && user.status === "active") {
      return NextResponse.json(
        {
          message: content.alreadyVerified,
          success: true,
          alreadyVerified: true
        },
        { status: 200 }
      );
    }

    // Update user to verified status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: "active",
        resetToken: null, // Clear verification token
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name);

    console.log(`✅ Email verified successfully for user: ${user.email}`);

    return NextResponse.json(
      {
        message: content.verificationSuccess,
        success: true,
        user: {
          name: user.name,
          email: user.email,
          verified: true
        }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Email verification error:', error);

    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);

    return NextResponse.json(
      { message: content.verificationError },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Resend verification email
export async function POST(request: NextRequest) {
  try {
    // Get site language from headers
    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);
    
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: content.emailRequired },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { message: content.emailNotFound },
        { status: 404 }
      );
    }

    if (user.emailVerified && user.status === "active") {
      return NextResponse.json(
        { message: content.alreadyVerified },
        { status: 400 }
      );
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: verificationToken,
        resetTokenExpiry: verificationTokenExpiry,
        updatedAt: new Date()
      }
    });

    // Send verification email
    const emailResult = await emailService.sendEmailVerification(
      user.email,
      user.name,
      verificationToken
    );

    if (emailResult.success) {
      return NextResponse.json(
        {
          message: content.emailResent,
          success: true
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: content.emailSendError },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Resend verification error:', error);

    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);

    return NextResponse.json(
      { message: content.resendError },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
