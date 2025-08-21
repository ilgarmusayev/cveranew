import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '@/lib/email-service';

const prisma = new PrismaClient();
const emailService = new EmailService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Təsdiqləmə tokeni tələb olunur' },
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
          message: 'Təsdiqləmə tokeni etibarsızdır və ya müddəti bitib',
          error: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Check if user is already verified
    if (user.emailVerified && user.status === "active") {
      return NextResponse.json(
        {
          message: 'Bu hesab artıq təsdiqlənib',
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
        message: 'Email uğurla təsdiqləndi! İndi hesabınıza daxil ola bilərsiniz.',
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

    return NextResponse.json(
      { message: 'E-poçt təsdiqi zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Resend verification email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'E-poçt ünvanı tələb olunur' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Bu e-poçt ünvanı ilə istifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    if (user.emailVerified && user.status === "active") {
      return NextResponse.json(
        { message: 'Bu hesab artıq təsdiqlənib' },
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
          message: 'Təsdiqləmə emaili yenidən göndərildi. E-poçt qutunuzu yoxlayın.',
          success: true
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'E-poçt göndərmədə xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Resend verification error:', error);

    return NextResponse.json(
      { message: 'E-poçt yenidən göndərmədə xəta baş verdi.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
