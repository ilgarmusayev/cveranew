import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

const emailService = new EmailService();

// Get error messages in 3 languages
const getMessages = (language: string = 'azerbaijani') => {
  const messages = {
    azerbaijani: {
      emailRequired: 'E-poçt tələb olunur',
      emailNotFound: 'Bu e-poçt ünvanı ilə qeydiyyatdan keçmiş istifadəçi tapılmadı. Zəhmət olmasa düzgün e-poçt ünvanını daxil edin və ya qeydiyyatdan keçin.',
      emailSent: 'Şifrə yeniləmə linki e-poçt ünvanınıza göndərildi',
      emailSendError: 'E-poçt göndərmədə xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.',
      serverError: 'Server xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.'
    },
    english: {
      emailRequired: 'Email is required',
      emailNotFound: 'No user found with this email address. Please enter a valid email address or register.',
      emailSent: 'Password reset link has been sent to your email address',
      emailSendError: 'Error sending email. Please try again.',
      serverError: 'Server error occurred. Please try again.'
    },
    russian: {
      emailRequired: 'Требуется электронная почта',
      emailNotFound: 'Пользователь с этим адресом электронной почты не найден. Пожалуйста, введите правильный адрес электронной почты или зарегистрируйтесь.',
      emailSent: 'Ссылка для сброса пароля отправлена на ваш адрес электронной почты',
      emailSendError: 'Ошибка при отправке электронной почты. Пожалуйста, попробуйте снова.',
      serverError: 'Произошла ошибка сервера. Пожалуйста, попробуйте снова.'
    }
  };
  
  return messages[language as keyof typeof messages] || messages.azerbaijani;
};

export async function POST(request: NextRequest) {
  try {
    // Get site language from headers
    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);
    
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: content.emailRequired },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Return user-friendly error message that email is not registered
      return NextResponse.json(
        { message: content.emailNotFound },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = emailService.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send reset email
    const emailResult = await emailService.sendForgotPasswordEmail(
      user.email,
      user.name,
      resetToken
    );

    if (emailResult.success) {
      console.log(`✅ Password reset email sent to ${user.email}`);

      return NextResponse.json(
        {
          message: content.emailSent,
          success: true
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Failed to send email:', emailResult.error);

      return NextResponse.json(
        { message: content.emailSendError },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);
    
    const siteLanguage = request.headers.get('x-site-language') || 'azerbaijani';
    const content = getMessages(siteLanguage);

    return NextResponse.json(
      { message: content.serverError },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
