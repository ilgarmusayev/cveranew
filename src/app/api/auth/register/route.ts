import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validateEmail, validatePassword, validateName } from "@/lib/validation";
import { EmailService } from "@/lib/email-service";

const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, name, email, password } = await req.json();
    
    // Handle both old format (firstName, lastName) and new format (name)
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    
    // Comprehensive validation
    const nameValidation = validateName(fullName);
    if (!nameValidation.isValid) {
      return NextResponse.json({ 
        message: nameValidation.error 
      }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ 
        message: emailValidation.error 
      }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        message: passwordValidation.error 
      }, { status: 400 });
    }
    
    // Check if user already exists (case-insensitive email check)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail } 
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        message: "Bu e-poçt ünvanı artıq mövcuddur. Başqa e-poçt ünvanı istifadə edin." 
      }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || "12"));
    
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: normalizedEmail,
        password: hashedPassword,
        status: "pending_verification", // User cannot login until verified
        emailVerified: null, // Not verified yet
        resetToken: verificationToken, // Reuse reset token field for verification
        resetTokenExpiry: verificationTokenExpiry,
        tier: "Free",
        role: "USER",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        status: true,
        createdAt: true
      }
    });

    // Send verification email
    console.log('🔧 Email configuration check:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'undefined',
      from_name: process.env.EMAIL_FROM_NAME,
      from_address: process.env.EMAIL_FROM_ADDRESS,
      base_url: process.env.NEXT_PUBLIC_BASE_URL
    });

    const emailResult = await emailService.sendEmailVerification(
      user.email,
      user.name,
      verificationToken
    );

    if (emailResult.success) {
      console.log(`✅ Verification email sent successfully to ${user.email}`, emailResult);

      return NextResponse.json({
        message: "Qeydiyyat uğurludur! E-poçt ünvanınıza təsdiqləmə mesajı göndərildi. E-poçt təsdiqlədikdən sonra hesabınıza daxil ola bilərsiniz.",
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          requiresVerification: true
        }
      }, { status: 201 });
    } else {
      console.error(`❌ Email verification failed for ${user.email}:`, emailResult);
      // If email sending fails, delete the user and return error
      await prisma.user.delete({ where: { id: user.id } });

      return NextResponse.json({
        message: "E-poçt göndərmədə xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.",
        error: emailResult.error
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json({
        message: "Bu e-poçt ünvanı artıq mövcuddur."
      }, { status: 409 });
    }

    return NextResponse.json({
      message: "Qeydiyyat zamanı xəta baş verdi. Zəhmət olmasa yenidən cəhd edin." 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
