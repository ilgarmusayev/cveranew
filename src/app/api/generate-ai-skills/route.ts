import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { linkedInImportService } from '@/lib/services/linkedin-import';

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value ||
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the JWT token
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { cvId, skillId, skillName, skillType } = await request.json();

    if (!cvId || !skillId || !skillName) {
      return NextResponse.json({ error: 'CV ID, skill ID, and skill name are required' }, { status: 400 });
    }

    // Generate AI skill description using the authenticated user's ID
    const result = await linkedInImportService.generateAISkillDescription(payload.userId, cvId, skillId, skillName, skillType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      description: result.description
    });

  } catch (error) {
    console.error('AI skill description generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI skill description' },
      { status: 500 }
    );
  }
}
