import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const userAgent = request.headers.get('user-agent');
  
  // Generate possible redirect URIs
  const possibleRedirectUris = [
    'https://cvera.net/api/auth/linkedin/callback',
    `${protocol}://${host}/api/auth/linkedin/callback`,
    process.env.LINKEDIN_REDIRECT_URI
  ].filter(Boolean);

  return NextResponse.json({
    message: 'LinkedIn OAuth Debug Info',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      host: host,
      protocol: protocol,
      userAgent: userAgent,
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI
    },
    possibleRedirectUris: possibleRedirectUris,
    recommendations: {
      production: 'https://cvera.net/api/auth/linkedin/callback',
      vercel: `${protocol}://${host}/api/auth/linkedin/callback`
    },
    instructions: [
      '1. Go to https://www.linkedin.com/developers/apps',
      '2. Select your app',
      '3. Go to Auth tab',
      '4. Add this redirect URI:',
      '   - https://cvera.net/api/auth/linkedin/callback (for production)',
      `   - ${protocol}://${host}/api/auth/linkedin/callback (for current domain)`
    ]
  });
}
