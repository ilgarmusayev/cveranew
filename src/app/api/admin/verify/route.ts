import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'fallback_secret_key';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token tapılmadı' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Try with admin secret first, then regular secret
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_ADMIN_SECRET) as any;
      } catch {
        decoded = jwt.verify(token, JWT_SECRET) as any;
      }

      // Check if user is admin (multiple ways to verify)
      if (decoded.role === 'admin' ||
          decoded.role === 'ADMIN' ||
          decoded.role === 'SUPER_ADMIN' ||
          decoded.isAdmin ||
          decoded.adminId) {
        return NextResponse.json({ success: true, user: decoded });
      } else {
        return NextResponse.json({ success: false, error: 'Admin icazəniz yoxdur' }, { status: 403 });
      }
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ success: false, error: 'Token səhvdir' }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json({ success: false, error: 'Server xətası' }, { status: 500 });
  }
}
