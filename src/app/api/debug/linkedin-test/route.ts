import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Capture all query parameters
    const allParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }

    // Get environment variables
    const envCheck = {
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || 'NOT SET',
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'NOT SET',
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    };

    // Test LinkedIn OAuth URL generation
    const testAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    testAuthUrl.searchParams.set('response_type', 'code');
    testAuthUrl.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID || '');
    testAuthUrl.searchParams.set('redirect_uri', process.env.LINKEDIN_REDIRECT_URI || '');
    testAuthUrl.searchParams.set('scope', 'openid profile email');
    testAuthUrl.searchParams.set('state', 'test123');

    const debugInfo = {
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
      queryParameters: allParams,
      environment: envCheck,
      generatedAuthUrl: testAuthUrl.toString(),
      routes: {
        authRoute: '/api/auth/linkedin',
        callbackRoute: '/api/auth/linkedin/callback',
        debugRoute: '/api/debug/linkedin-test'
      }
    };

    console.log('=== LinkedIn OAuth Debug Info ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    return NextResponse.json({
      message: 'LinkedIn OAuth Debug Test',
      status: 'debug_info_collected',
      debug: debugInfo,
      instructions: [
        '1. Check if all environment variables are properly set',
        '2. Test the generated auth URL manually',
        '3. Verify LinkedIn Developer Console settings',
        '4. Check server logs for detailed error information'
      ],
      nextSteps: [
        'Visit the generatedAuthUrl to test LinkedIn OAuth manually',
        'Check that redirect_uri matches exactly in LinkedIn Developer Console',
        'Ensure your LinkedIn app has "Sign In with LinkedIn using OpenID Connect" product enabled'
      ]
    });

  } catch (error) {
    console.error('Debug route error:', error);

    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Debug route failed',
      message: errorMessage
    }, { status: 500 });
  }
}
