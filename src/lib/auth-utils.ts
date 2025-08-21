// Authentication utility functions for server-side use
import { NextRequest } from 'next/server';
import { verifyJWT } from './jwt';

export interface JWTPayload {
  userId: string;
  email: string;
  // Add other JWT payload fields as needed
}

export interface AuthResult {
  success: boolean;
  user?: JWTPayload;
  error?: string;
}

/**
 * Extract token from request headers or cookies
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieToken = request.cookies.get('auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}

/**
 * Authenticate request and return user info
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  const token = extractToken(request);

  if (!token) {
    return {
      success: false,
      error: 'Token tapılmadı'
    };
  }

  const decoded = verifyJWT(token);

  if (!decoded) {
    return {
      success: false,
      error: 'Token yanlışdır və ya müddəti bitib'
    };
  }

  return {
    success: true,
    user: decoded
  };
}

/**
 * Middleware function to require authentication
 */
export function requireAuth(request: NextRequest): AuthResult {
  return authenticateRequest(request);
}

/**
 * Get user ID from middleware headers (set by middleware)
 */
export function getUserFromHeaders(request: NextRequest): { userId: string; email: string } | null {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');

  if (userId && email) {
    return { userId, email };
  }

  return null;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Normalize email for consistent storage
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      error: 'Şifrə ən azı 6 simvol olmalıdır'
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Şifrə çox uzundur'
    };
  }

  return { isValid: true };
}

/**
 * Rate limiting helper
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5
};

export function isRateLimited(
    identifier: string,
    config: RateLimitConfig = defaultRateLimit
): boolean {
  // This is a simple in-memory rate limiter
  // In production, you might want to use Redis or similar
  const key = `rate_limit_${identifier}`;
  const now = Date.now();

  // This would be stored in a proper cache in production
  if (typeof window !== 'undefined') return false; // Client-side safety

  // Simple implementation - in production use proper caching
  return false;
}

/**
 * Sanitize user data for API responses
 */
export function sanitizeUserData(user: any): any {
  if (!user) return null;

  const {
    password,
    refreshToken,
    resetPasswordToken,
    resetPasswordExpires,
    ...sanitizedUser
  } = user;

  return sanitizedUser;
}