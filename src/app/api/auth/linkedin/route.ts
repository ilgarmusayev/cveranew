import { NextRequest, NextResponse } from 'next/server';

// LinkedIn OAuth configuration
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI!, // Should be https://cvera.net/api/auth/linkedin/callback
  scope: 'openid profile email', // Updated to use modern LinkedIn API scopes
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromPage = searchParams.get('from'); // Check if coming from registration page

    // Always redirect to LinkedIn authorization
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINKEDIN_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', LINKEDIN_CONFIG.redirectUri);
    authUrl.searchParams.set('scope', LINKEDIN_CONFIG.scope);

    // Generate a unique state parameter for security
    authUrl.searchParams.set('state', Math.random().toString(36).substring(7) + Date.now().toString(36));

    if (fromPage === 'register') {
      // REGISTRATION: Force complete re-authentication (MANDATORY)
      authUrl.searchParams.set('prompt', 'login');
      authUrl.searchParams.set('max_age', '0');

      console.log('REGISTRATION: Forcing LinkedIn re-authentication with prompt=login');
    } else {
      // LOGIN: Normal LinkedIn OAuth flow (less aggressive)
      console.log('LOGIN: Using normal LinkedIn OAuth flow');
      // No additional parameters - let LinkedIn handle normal auth flow
    }

    console.log('Redirecting to LinkedIn OAuth');
    console.log('From page:', fromPage || 'login');
    console.log('Auth URL:', authUrl.toString());

    // Create response with LinkedIn redirect AFTER setting all URL parameters
    const response = NextResponse.redirect(authUrl.toString());

    if (fromPage === 'register') {
      // Clear LinkedIn-related cookies for registration
      const linkedinCookies = [
        'li_at', 'JSESSIONID', 'bcookie', 'bscookie', 'li_mc', 'li_sugr',
        'liap', 'li_oatml', 'UserMatchHistory', 'AnalyticsSyncHistory',
        'li_fat_id', 'li_giant', 'li_ep_auth_context'
      ];

      linkedinCookies.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          domain: '.linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        });
        response.cookies.set(cookieName, '', {
          expires: new Date(0),
          domain: 'linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        });
      });

      // Clear our own session cookies
      response.cookies.set('token', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true
      });

      // Add cache control headers for registration
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      console.log('LinkedIn session clearing completed for REGISTRATION');
    }

    // ...existing code for mutation observer and setTimeout...

    return response;

  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'https://cvera.net'}/auth/login?error=linkedin_init_failed`);
  }
}
