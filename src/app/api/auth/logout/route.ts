import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;

    console.log('🚪 Logout API called with token:', token ? 'present' : 'none');

    let isLinkedInUser = false;

    if (token) {
      // Try to extract user ID from token for database cleanup
      try {
        const decoded = jwt.decode(token) as any;
        console.log('Token decoded for user:', decoded?.userId);

        if (decoded?.userId) {
          // Check if user logged in with LinkedIn
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { loginMethod: true }
          });

          if (user?.loginMethod === 'linkedin') {
            isLinkedInUser = true;
            console.log('🔗 LinkedIn user detected for logout');
          }

          // More comprehensive user session cleanup
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              lastLogin: null, // Clear last login to force re-authentication
            }
          }).catch((error) => {
            console.log('User update during logout failed (continuing):', error.message);
          });

          console.log('Session cleanup completed for user:', decoded.userId);
        }
      } catch (tokenError) {
        console.log('Token decode error during logout (continuing):', tokenError);
      }
    }

    const response = NextResponse.json({
      message: "Uğurla çıxış edildi",
      timestamp: new Date().toISOString(),
      cleared: true,
      tokenWasPresent: !!token,
      isLinkedInUser: isLinkedInUser,
      linkedInLogoutUrl: isLinkedInUser ? 'https://linkedin.com/m/logout' : null
    });

    // Enhanced cookie clearing with more aggressive approach
    const cookiesToClear = [
      "auth-token",
      "accessToken",
      "refreshToken",
      "session",
      "token",
      "cvera-auth",
      "cvera-token",
      "next-auth.session-token",
      "next-auth.csrf-token",
      "__Secure-next-auth.session-token",
      "__Host-next-auth.csrf-token",
      "connect.sid",
      "JSESSIONID"
    ];

    // More comprehensive path and domain clearing
    const paths = ["/", "/api", "/auth", "/dashboard", "/admin"];
    const domains = [
      undefined,
      ".cvera.net",
      "cvera.net",
      `.${process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '').replace('http://', '')}`
    ].filter(Boolean);

    cookiesToClear.forEach(cookieName => {
      paths.forEach(path => {
        domains.forEach(domain => {
          const cookieOptions: any = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: path,
            maxAge: 0,
            expires: new Date(0),
          };

          if (domain) {
            cookieOptions.domain = domain;
          }

          try {
            response.cookies.set(cookieName, "", cookieOptions);
          } catch (cookieError) {
            console.log(`Failed to clear cookie ${cookieName}:`, cookieError);
          }
        });
      });
    });

    // Enhanced security headers for complete session termination
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage", "executionContexts"');
    response.headers.set('X-Logout-Success', 'true');
    response.headers.set('X-Session-Cleared', 'true');

    // LinkedIn çıxış məlumatı əlavə et
    if (isLinkedInUser) {
      response.headers.set('X-LinkedIn-Logout', 'true');
      response.headers.set('X-LinkedIn-Logout-URL', 'https://linkedin.com/m/logout');
    }

    console.log('✅ Logout API completed successfully');
    return response;

  } catch (error) {
    console.error('❌ Logout API error:', error);

    // Even on error, return success response with aggressive cookie clearing
    const response = NextResponse.json({
      message: "Çıxış edildi (xəta ilə, amma təmizləndi)",
      timestamp: new Date().toISOString(),
      error: true,
      cleared: true
    });

    // Emergency cookie clearing
    const emergencyCookies = ["accessToken", "refreshToken", "auth-token", "session", "cvera-auth"];
    emergencyCookies.forEach(cookieName => {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    });

    // Still set security headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');

    return response;
  } finally {
    await prisma.$disconnect();
  }
}
