// JWT utilities for server-side authentication
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';


export function verifyJWT(token: string): { userId: string; email: string } | null {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

export function generateJWT(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h', // Extended from 1h to 24h
  });
}

export function generateRefreshToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '7d',
  });
}

export function verifyRefreshToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

// Cookie configuration functions
export function createSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60, // 24 hours in seconds
    path: '/'
  };
}

export function createRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  };
}

// Token blacklisting functions
export async function blacklistToken(token: string, userId: string): Promise<void> {
  try {
    const decoded = jwt.decode(token) as any;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate a unique ID for the blacklist entry
    const tokenId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.tokenBlacklist.create({
      data: {
        id: tokenId,
        token,
        userId,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Error blacklisting token:', error instanceof Error ? error.message : String(error));
  }
}

export async function blacklistAllUserTokens(userId: string): Promise<void> {
  try {
    // This would require tracking all active tokens for a user
    // For now, we'll just update the user's lastLogin to force re-authentication
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: null }
    });
  } catch (error) {
    console.error('Error blacklisting all user tokens:', error);
  }
}

export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    const blacklistedToken = await prisma.tokenBlacklist.findUnique({
      where: { token }
    });
    return !!blacklistedToken;
  } catch (error) {
    console.error('Error checking token blacklist:', error);
    return false;
  }
}
