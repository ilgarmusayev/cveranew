// Authentication middleware for API routes
import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await verifyJWT(token);

    return payload;
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return null;
  }
}

export function requireAuth() {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Giriş tələb olunur' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    return null; // Continue to the actual handler
  };
}
