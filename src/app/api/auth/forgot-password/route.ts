import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EmailService } from '@/lib/email-service';

const emailService = new EmailService();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { message: 'Email tələb olunur' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Security: Don't reveal if user exists or not
      return NextResponse.json(
        { message: 'Əgər bu email mövcuddursa, şifrə yeniləmə linki göndəriləcək' },
        { status: 200 }
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
          message: 'Şifrə yeniləmə linki email ünvanınıza göndərildi',
          success: true
        },
        { status: 200 }
      );
    } else {
      console.error('❌ Failed to send email:', emailResult.error);

      return NextResponse.json(
        { message: 'Email göndərmədə xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Forgot password error:', error);

    return NextResponse.json(
      { message: 'Server xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
