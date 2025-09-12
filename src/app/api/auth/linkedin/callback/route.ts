import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateJWT } from '@/lib/jwt';


// LinkedIn OAuth configuration with validation
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI!,
  scope: 'openid profile email',
};

// Validate required environment variables on startup
function validateEnvironment() {
  const required = ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables first
    validateEnvironment();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('LinkedIn callback triggered with code:', code ? 'YES' : 'NO');
    console.log('LinkedIn callback error param:', error);

    // Handle OAuth error
    if (error) {
      console.error('LinkedIn OAuth error:', error);
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=linkedin_oauth_ugursuz&details=${error}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=avtorizasiya_kodu_alinmadi`);
    }

    // Exchange code for access token with enhanced error handling
    console.log('Exchanging code for token...');
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: LINKEDIN_CONFIG.clientId,
        client_secret: LINKEDIN_CONFIG.clientSecret,
        redirect_uri: LINKEDIN_CONFIG.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('LinkedIn token error:', errorText);
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=token_deyisimi_ugursuz&details=${encodeURIComponent(errorText)}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Access token received:', accessToken ? 'YES' : 'NO');

    if (!accessToken) {
      console.error('No access token in response:', tokenData);
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=token_not_received`);
    }

    // Get LinkedIn profile data with enhanced error handling
    let profileData = null;
    let email = null;
    let firstName = '';
    let lastName = '';
    let linkedinId = '';

    // Try OpenID Connect userinfo endpoint first
    try {
      console.log('Trying OpenID Connect userinfo endpoint...');
      const userinfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (userinfoResponse.ok) {
        const userinfoData = await userinfoResponse.json();
        console.log('OpenID userinfo success:', JSON.stringify(userinfoData, null, 2));

        email = userinfoData.email;
        firstName = userinfoData.given_name || '';
        lastName = userinfoData.family_name || '';
        linkedinId = userinfoData.sub;
      } else {
        const errorText = await userinfoResponse.text();
        console.log('OpenID userinfo failed, trying legacy endpoints...', errorText);

        // Fallback to legacy LinkedIn API
        const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (profileResponse.ok) {
          profileData = await profileResponse.json();
          console.log('Legacy profile data:', JSON.stringify(profileData, null, 2));

          firstName = profileData.localizedFirstName || '';
          lastName = profileData.localizedLastName || '';
          linkedinId = profileData.id;

          // Get email separately
          const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            email = emailData.elements?.[0]?.['handle~']?.emailAddress;
          }
        } else {
          const profileErrorText = await profileResponse.text();
          console.error('Legacy profile fetch error:', profileErrorText);
          return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=legacy_profile_fetch_failed&details=${encodeURIComponent(profileErrorText)}`);
        }
      }
    } catch (apiError) {
      console.error('LinkedIn API error:', apiError);
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=profile_fetch_failed&details=${encodeURIComponent(String(apiError))}`);
    }

    console.log('Final extracted data:', { email, firstName, lastName, linkedinId });

    if (!email) {
      console.error('No email found in LinkedIn response');
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=no_email_provided`);
    }

    // Enhanced database operations with error handling
    console.log('Checking user in database by email and LinkedIn ID...');

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user && linkedinId) {
      user = await prisma.user.findUnique({
        where: { linkedinId },
      });
    }

    // Try to extract LinkedIn username from profile data if available
    let linkedinUsername = null;
    if (profileData && profileData.publicProfileUrl) {
      const urlMatch = profileData.publicProfileUrl.match(/linkedin\.com\/in\/([^/?]+)/);
      if (urlMatch) {
        linkedinUsername = urlMatch[1];
        console.log('Extracted LinkedIn username:', linkedinUsername);
      }
    }

    if (!user) {
      // Create new user - this is registration
      console.log('Creating new user (LinkedIn registration)...');
      user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`.trim() || email.split('@')[0],
          linkedinId: linkedinId,
          tier: 'Free',
          status: 'active',
          loginMethod: 'linkedin',
          emailVerified: new Date(), // Auto-verify LinkedIn users
          lastLogin: new Date(),
        },
      });
      console.log('New user created (registration):', user.id);
    } else {
      // Update existing user - this is login
      console.log('Updating existing user (LinkedIn login)...');
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          // Update LinkedIn data if not present or if changed
          linkedinId: linkedinId || user.linkedinId,
          loginMethod: 'linkedin', // Update to LinkedIn login method
          lastLogin: new Date(),
          // Update name if it was missing or LinkedIn provides better data
          name: user.name || `${firstName} ${lastName}`.trim() || email.split('@')[0],
        },
      });
      console.log('Existing user updated (login):', user.id);
    }

    // Generate JWT token with error handling
    console.log('Generating JWT token...');
    let token;
    try {
      token = generateJWT({ userId: user.id, email: user.email });
    } catch (jwtError) {
      console.error('JWT generation failed:', jwtError);
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=jwt_generation_failed`);
    }

    // Create response with redirect to LinkedIn callback page
    const response = NextResponse.redirect(`https://cvera.net/auth/linkedin-callback`);

    // Set secure HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.cvera.net' : undefined,
    });

    console.log('LinkedIn authentication successful, redirecting to callback page');
    return response;

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    if (errorStack) {
      console.error('Error stack:', errorStack);
    }

    // Enhanced error reporting
    if (errorMessage.includes('Missing required environment variables')) {
      return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=configuration_error&details=${encodeURIComponent(errorMessage)}`);
    }

    return NextResponse.redirect(`https://cvera.net/api/auth/linkedin-error?error=authentication_failed&debug=${encodeURIComponent(errorMessage)}`);
  } finally {
    await prisma.$disconnect();
  }
}
