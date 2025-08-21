import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const issues: string[] = [];
    const config: Record<string, string> = {};

    // Check environment variables
    const envVars = {
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
      LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL
    };

    // Validate environment configuration
    if (!envVars.LINKEDIN_CLIENT_ID) {
      issues.push('LINKEDIN_CLIENT_ID environment variable is not set');
    } else {
      config.clientId = envVars.LINKEDIN_CLIENT_ID.substring(0, 10) + '...';
    }

    if (!envVars.LINKEDIN_CLIENT_SECRET) {
      issues.push('LINKEDIN_CLIENT_SECRET environment variable is not set');
    } else {
      config.clientSecret = 'SET (hidden)';
    }

    if (!envVars.LINKEDIN_REDIRECT_URI) {
      issues.push('LINKEDIN_REDIRECT_URI environment variable is not set');
    } else {
      config.redirectUri = envVars.LINKEDIN_REDIRECT_URI;

      // Validate redirect URI format
      const expectedUri = 'https://cvera.net/api/auth/linkedin/callback';
      if (envVars.LINKEDIN_REDIRECT_URI !== expectedUri) {
        issues.push(`LINKEDIN_REDIRECT_URI mismatch. Expected: ${expectedUri}, Got: ${envVars.LINKEDIN_REDIRECT_URI}`);
      }
    }

    // Check route files existence
    const routeChecks = {
      authRouteExists: fs.existsSync(path.join(process.cwd(), 'src/app/api/auth/linkedin/route.ts')),
      callbackRouteExists: fs.existsSync(path.join(process.cwd(), 'src/app/api/auth/linkedin/callback/route.ts')),
      duplicateCallbackExists: fs.existsSync(path.join(process.cwd(), 'src/app/api/auth/callback/linkedin/route.ts'))
    };

    if (routeChecks.duplicateCallbackExists) {
      issues.push('Duplicate LinkedIn callback route found at /api/auth/callback/linkedin - this may cause routing conflicts');
    }

    // Test LinkedIn OAuth URL generation
    let oauthUrl = null;
    if (envVars.LINKEDIN_CLIENT_ID && envVars.LINKEDIN_REDIRECT_URI) {
      const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', envVars.LINKEDIN_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', envVars.LINKEDIN_REDIRECT_URI);
      authUrl.searchParams.set('scope', 'openid profile email');
      authUrl.searchParams.set('state', 'debug-test');

      oauthUrl = authUrl.toString();
    }

    // Check common LinkedIn OAuth issues
    const commonIssues = [
      {
        issue: 'Invalid redirect URI in LinkedIn Developer Console',
        solution: 'Ensure the redirect URI in LinkedIn Developer Console matches exactly: https://cvera.net/api/auth/linkedin/callback'
      },
      {
        issue: 'Incorrect OAuth scopes',
        solution: 'Use modern LinkedIn scopes: "openid profile email" instead of legacy scopes'
      },
      {
        issue: 'LinkedIn app not in production mode',
        solution: 'Check if your LinkedIn app is approved for production use'
      },
      {
        issue: 'HTTPS requirement',
        solution: 'LinkedIn OAuth requires HTTPS. Ensure your redirect URI uses https://'
      }
    ];

    return NextResponse.json({
      status: 'LinkedIn Login Debug Report',
      timestamp: new Date().toISOString(),
      environment: {
        config,
        issues: issues.length > 0 ? issues : ['No environment issues detected']
      },
      routes: {
        ...routeChecks,
        issues: routeChecks.duplicateCallbackExists ? ['Duplicate callback route detected'] : []
      },
      oauth: {
        generatedUrl: oauthUrl || 'Cannot generate - missing environment variables',
        expectedRedirectUri: 'https://cvera.net/api/auth/linkedin/callback'
      },
      commonIssues,
      recommendations: [
        'Verify LinkedIn Developer Console settings match redirect URI exactly',
        'Check server logs during OAuth flow for detailed error messages',
        'Test with a fresh incognito browser session',
        'Ensure database connectivity for user creation',
        'Verify SSL certificate is valid for cvera.net'
      ]
    });

  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      error: 'Debug check failed',
      message: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}
