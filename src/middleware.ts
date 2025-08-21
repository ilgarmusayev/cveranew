import { NextRequest, NextResponse } from 'next/server';

// Simple JWT decode for Edge Runtime - no crypto dependencies
function simpleJWTDecode(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ JWT format invalid:', parts.length, 'parts');
      return null;
    }

    // Add padding if needed for base64 decode
    let payload = parts[1];
    while (payload.length % 4) {
      payload += '=';
    }

    const decoded = JSON.parse(atob(payload));
    console.log('✅ JWT decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      exp: decoded.exp,
      iat: decoded.iat
    });

    return decoded;
  } catch (error) {
    console.log('❌ JWT decode failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const key = `${ip}:${req.nextUrl.pathname}`;

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null;
    }

    if (store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return null;
    }

    store[key].count++;

    if (store[key].count > limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((store[key].resetTime - now) / 1000).toString(),
          }
        }
      );
    }

    return null;
  };
}

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/cv', '/profile', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API auth routes, and images
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||  // LinkedIn OAuth callback buradadır
    pathname.startsWith('/auth/') ||      // Auth səhifələri də skip edilməli
    pathname.startsWith('/public/') ||
    pathname.includes('.') && (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.avif') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.json') ||
      pathname.endsWith('.xml') ||
      pathname.endsWith('.txt')
    )
  ) {
    console.log(`🟢 Skipping middleware for: ${pathname}`);
    return NextResponse.next();
  }

  // Apply rate limiting to all requests
  const rateLimitResponse = rateLimit()(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Check if accessing a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    console.log(`🔒 Checking auth for protected route: ${pathname}`);

    // Get token from multiple sources - LinkedIn callback zamanı token cookie-də olacaq
    const tokenCookie = request.cookies.get('token')?.value;  // LinkedIn callback-dən gələn token
    const authTokenCookie = request.cookies.get('auth-token')?.value;
    const accessTokenCookie = request.cookies.get('accessToken')?.value;

    let token = tokenCookie || authTokenCookie || accessTokenCookie;

    if (!token) {
      console.log(`🚫 No authentication token found for ${pathname}`);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log(`🔍 Token found, length: ${token.length}`);

    // Decode and validate JWT using simple Edge Runtime compatible method
    const decoded = simpleJWTDecode(token);

    if (!decoded) {
      console.log(`🚫 JWT decode failed for ${pathname}`);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', 'true');
      return NextResponse.redirect(loginUrl);
    }

    // Check expiration
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      console.log(`🚫 Token expired for ${pathname}`);
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', 'true');
      return NextResponse.redirect(loginUrl);
    }

    // Check required fields
    if (!decoded.userId || !decoded.email) {
      console.log(`🚫 Missing required fields in token for ${pathname}`, {
        userId: decoded.userId,
        email: decoded.email,
        allFields: Object.keys(decoded)
      });
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log(`✅ Authentication successful for user ${decoded.userId} on ${pathname}`);
  }

  return NextResponse.next();
}

// Matcher configuration - Much simpler approach
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/cv/:path*',
    '/profile/:path*',
    '/admin/:path*'
  ]
}
