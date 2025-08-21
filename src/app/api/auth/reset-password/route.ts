import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EmailService } from '@/lib/email-service';

const prisma = new PrismaClient();
const emailService = new EmailService();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token və yeni şifrə tələb olunur' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Şifrə minimum 6 simvol olmalıdır' },
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
        { message: 'Token etibarsızdır və ya müddəti bitib' },
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
        message: 'Şifrəniz uğurla yeniləndi. İndi yeni şifrənizlə daxil ola bilərsiniz.',
        success: true
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Reset password error:', error);

    return NextResponse.json(
      { message: 'Server xətası baş verdi. Zəhmət olmasa yenidən cəhd edin.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
