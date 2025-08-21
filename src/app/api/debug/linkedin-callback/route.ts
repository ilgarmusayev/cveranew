import { NextRequest, NextResponse } from 'next/server';

// Define types for better TypeScript support
interface DiagnosticEntry {
  type: 'ERROR' | 'SUCCESS' | 'WARNING' | 'INFO';
  message: string;
  description?: string;
  possible_causes?: string[];
  next_step?: string;
  code_preview?: string;
  status?: string;
  result?: string;
  missing?: string[];
}

interface Diagnostics {
  timestamp: string;
  received_params: {
    code: string | null;
    state: string | null;
    error: string | null;
    error_description: string | null;
  };
  environment: {
    LINKEDIN_CLIENT_ID: string;
    LINKEDIN_CLIENT_SECRET: string;
    LINKEDIN_REDIRECT_URI: string;
  };
  analysis: DiagnosticEntry[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    console.log('=== LinkedIn Callback Debug Test ===');
    console.log('Full URL:', request.url);
    console.log('All parameters:', Object.fromEntries(searchParams.entries()));

    const params = {
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      error: searchParams.get('error'),
      error_description: searchParams.get('error_description')
    };

    const diagnostics: Diagnostics = {
      timestamp: new Date().toISOString(),
      received_params: params,
      environment: {
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID ? 'SET' : 'MISSING',
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET ? 'SET' : 'MISSING',
        LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI || 'MISSING'
      },
      analysis: []
    };

    // Analyze the callback
    if (params.error) {
      diagnostics.analysis.push({
        type: 'ERROR',
        message: `LinkedIn OAuth Error: ${params.error}`,
        description: params.error_description || 'No description provided',
        possible_causes: [
          'User denied authorization',
          'Invalid client configuration',
          'Redirect URI mismatch',
          'App not approved for production'
        ]
      });
    } else if (params.code) {
      diagnostics.analysis.push({
        type: 'SUCCESS',
        message: 'Authorization code received successfully',
        next_step: 'Code will be exchanged for access token',
        code_preview: params.code.substring(0, 20) + '...'
      });

      // Test token exchange (simulation)
      if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
        diagnostics.analysis.push({
          type: 'INFO',
          message: 'Environment configured for token exchange',
          status: 'Ready to proceed with OAuth flow'
        });
      } else {
        diagnostics.analysis.push({
          type: 'WARNING',
          message: 'Missing environment variables for token exchange',
          missing: [
            !process.env.LINKEDIN_CLIENT_ID ? 'LINKEDIN_CLIENT_ID' : null,
            !process.env.LINKEDIN_CLIENT_SECRET ? 'LINKEDIN_CLIENT_SECRET' : null
          ].filter(Boolean) as string[]
        });
      }
    } else {
      diagnostics.analysis.push({
        type: 'WARNING',
        message: 'No authorization code or error received',
        possible_causes: [
          'Direct access to callback URL',
          'Malformed OAuth request',
          'Session timeout'
        ]
      });
    }

    return NextResponse.json(diagnostics);

  } catch (error) {
    console.error('LinkedIn callback debug error:', error);

    // Type-safe error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Debug callback failed',
      message: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
