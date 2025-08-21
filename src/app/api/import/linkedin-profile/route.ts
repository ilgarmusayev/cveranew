import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { linkedInImportService } from '@/lib/services/linkedin-import';

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get LinkedIn URL/username from request
    const { linkedinUrl } = await request.json();
    if (!linkedinUrl?.trim()) {
      return NextResponse.json(
        { error: 'LinkedIn URL or username is required' },
        { status: 400 }
      );
    }

    // Import LinkedIn profile using the new service
    const result = await linkedInImportService.importLinkedInProfile(
      decoded.userId,
      linkedinUrl.trim()
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          remainingImports: result.remainingImports 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'LinkedIn profile data retrieved successfully',
      cvId: result.cvId,
      profileData: result.profile,
      remainingImports: result.remainingImports
    });

  } catch (error) {
    console.error('LinkedIn profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
