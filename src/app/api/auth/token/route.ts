import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Token endpoint called');

    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');

    // LinkedIn callback üçün xüsusi işləmə - token qaytarılmalıdır
    if (referer?.includes('/auth/linkedin-callback')) {
      console.log('✅ Token request from LinkedIn callback - allowing token retrieval');

      const token = request.cookies.get('token')?.value ||
                    request.cookies.get('auth-token')?.value ||
                    request.cookies.get('accessToken')?.value;

      if (!token) {
        console.log('🚫 No token found in cookies after LinkedIn login');
        return NextResponse.json({ error: 'LinkedIn login token tapılmadı' }, { status: 401 });
      }

      const payload = verifyJWT(token);
      if (!payload) {
        console.log('🚫 Invalid LinkedIn token found');
        return NextResponse.json({ error: 'LinkedIn token etibarsızdır' }, { status: 401 });
      }

      console.log('✅ Valid LinkedIn token found and returned');

      return NextResponse.json({
        accessToken: token,
        user: payload
      });
    }

    // Logout kontekstində token verilməsin
    if (referer?.includes('/auth/login') || referer?.includes('logout=true') || referer?.includes('logged_out=true')) {
      console.log('🚫 Token request from login page or logout context - denying token');
      return NextResponse.json({ error: 'Token tapılmadı - logout context' }, { status: 401 });
    }

    // Normal hallarda cookie-based token restoration deaktivdir
    console.log('🚫 Cookie-based token restoration is disabled to prevent auto re-login');

    return NextResponse.json({
      error: 'Cookie-based authentication disabled',
      message: 'Please login again'
    }, { status: 401 });

  } catch (error) {
    console.error('Get token error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}
