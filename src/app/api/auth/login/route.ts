import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateJWT, generateRefreshToken, createSessionCookieOptions, createRefreshCookieOptions } from "@/lib/jwt";
import { EmailService } from "@/lib/email-service";

const emailService = new EmailService();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Input validation
    if (!email || !password) {
      return NextResponse.json({
        message: "E-poçt və şifrə tələb olunur"
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        message: "E-poçt formatı yanlışdır"
      }, { status: 400 });
    }
    
    // Normalize email for lookup (case-insensitive)
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with subscriptions
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        subscriptions: {
          where: {
            status: 'active'
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        message: "E-poçt və ya şifrə yanlışdır"
      }, { status: 401 });
    }
    
    // Check if user has a password (regular login) or uses LinkedIn login
    if (!user.password) {
      return NextResponse.json({
        message: "Bu hesab LinkedIn ilə qeydiyyatdan keçib. LinkedIn ilə daxil olun.",
        linkedinLogin: true
      }, { status: 400 });
    }

    // TEMPORARY: Skip email verification check
    /*
    // Check if email is verified
    if (!user.emailVerified || user.status === "pending_verification") {
      // Verify password first before resending email
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return NextResponse.json({
          message: "E-poçt və ya şifrə yanlışdır"
        }, { status: 401 });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: verificationToken,
          resetTokenExpiry: verificationTokenExpiry,
        }
      });

      // Resend verification email
      try {
        const emailResult = await emailService.sendEmailVerification(
          user.email,
          user.name,
          verificationToken
        );

        if (emailResult.success) {
          console.log(`✅ Verification email resent to ${user.email}`);
          return NextResponse.json({
            message: "E-poçt ünvanınız təsdiqlənməyib. Yeni təsdiqləmə linki e-poçt ünvanınıza göndərildi.",
            requiresVerification: true,
            email: user.email,
            emailResent: true
          }, { status: 403 });
        } else {
          console.error(`❌ Failed to resend verification email to ${user.email}:`, emailResult.error);
          return NextResponse.json({
            message: "E-poçt ünvanınız təsdiqlənməyib. E-poçt qutunuzu yoxlayın və təsdiqləmə linkinə klik edin.",
            requiresVerification: true,
            email: user.email,
            emailResent: false
          }, { status: 403 });
        }
      } catch (emailError) {
        console.error(`❌ Error resending verification email to ${user.email}:`, emailError);
        return NextResponse.json({
          message: "E-poçt ünvanınız təsdiqlənməyib. E-poçt qutunuzu yoxlayın və təsdiqləmə linkinə klik edin.",
          requiresVerification: true,
          email: user.email,
          emailResent: false
        }, { status: 403 });
      }
    }
    */

    // TEMPORARY: Skip status check for pending_verification users
    // Check if account is active (allow pending_verification during temporary period)
    if (user.status !== "active" && user.status !== "pending_verification") {
      return NextResponse.json({
        message: "Hesabınız aktiv deyil. Dəstək komandası ilə əlaqə saxlayın.",
        accountStatus: user.status
      }, { status: 403 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        message: "E-poçt və ya şifrə yanlışdır"
      }, { status: 401 });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginMethod: user.loginMethod || 'email' // Set default login method
      }
    });
    
    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = generateJWT(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Prepare user data for response
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      loginMethod: user.loginMethod || 'email',
      linkedinUsername: user.linkedinUsername,
      linkedinId: user.linkedinId,
      subscriptions: user.subscriptions.map(sub => ({
        id: sub.id,
        tier: sub.tier,
        status: sub.status,
        provider: sub.provider,
        expiresAt: sub.expiresAt.toISOString(),
        startedAt: sub.startedAt.toISOString()
      }))
    };

    const response = NextResponse.json({
      message: "Giriş uğurlu oldu",
      accessToken,
      user: userData
    });
    
    // Set secure cookies
    response.cookies.set("auth-token", accessToken, createSessionCookieOptions());
    response.cookies.set("refreshToken", refreshToken, createRefreshCookieOptions());

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      message: "Giriş zamanı xəta baş verdi"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
