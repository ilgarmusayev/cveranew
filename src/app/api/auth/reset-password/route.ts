import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { EmailService } from '@/lib/email-service';

const emailService = new EmailService();

// Get error messages in 3 languages
const getMessages = (language: string = 'azerbaijani') => {
  const messages = {
    azerbaijani: {
      tokenPasswordRequired: 'Token və yeni şifrə tələb olunur',
      passwordTooShort: 'Şifrə minimum 8 simvol olmalıdır',
      tokenInvalid: 'Token etibarsızdır və ya müddəti bitib',
      passwordResetSuccess: 'Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.',
      serverError: 'Server xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.'
    },
    english: {
      tokenPasswordRequired: 'Token and new password are required',
      passwordTooShort: 'Password must be at least 8 characters',
      tokenInvalid: 'Token is invalid or has expired',
      passwordResetSuccess: 'Your password has been successfully updated. You can now login with your new password.',
      serverError: 'Server error occurred. Please try again.'
    },
    russian: {
      tokenPasswordRequired: 'Требуется токен и новый пароль',
      passwordTooShort: 'Пароль должен содержать минимум 8 символов',
      tokenInvalid: 'Токен недействителен или истек',
      passwordResetSuccess: 'Ваш пароль успешно обновлен. Теперь вы можете войти с новым паролем.',
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
    
    const { token, newPassword } = await request.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { message: content.tokenPasswordRequired },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: content.passwordTooShort },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: content.tokenInvalid },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    // Send confirmation email
    await emailService.sendPasswordResetConfirmation(
      user.email,
      user.name
    );

    console.log(`✅ Password reset successful for user: ${user.email}`);

    return NextResponse.json(
      {
        message: content.passwordResetSuccess,
        success: true
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Reset password error:', error);

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
