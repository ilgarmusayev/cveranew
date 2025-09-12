import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateJWT, createSessionCookieOptions } from "@/lib/jwt";


export async function POST(req: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({
        error: "Refresh token tapılmadı"
      }, { status: 401 });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json({
        error: "Refresh token yanlışdır və ya müddəti bitib"
      }, { status: 401 });
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        error: "İstifadəçi tapılmadı"
      }, { status: 401 });
    }

    // Generate new access token
    const newAccessToken = generateJWT({
      userId: user.id,
      email: user.email
    });

    // Prepare user data
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      tier: user.tier,
      loginMethod: user.loginMethod,
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
      message: "Token yeniləndi",
      accessToken: newAccessToken,
      user: userData
    });

    // Set new access token cookie
    response.cookies.set("auth-token", newAccessToken, createSessionCookieOptions());

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({
      error: "Token yeniləmə xətası"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
