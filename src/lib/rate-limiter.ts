import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store
interface RateLimitData {
  count: number;
  resetTime: number;
}

// Rate limiting konfiqurasiyası
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

// Müxtəlif endpoint üçün müxtəlif limitlər
export const rateLimitConfigs = {
  // CV yaratma - daha məhdud
  cvGeneration: {
    windowMs: 15 * 60 * 1000, // 15 dəqiqə
    max: 5, // 5 sorğu
    message: 'CV yaratma çox tez-tez. 15 dəqiqə gözləyin.'
  },
  
  // Cover Letter yaratma - daha məhdud
  coverLetterGeneration: {
    windowMs: 10 * 60 * 1000, // 10 dəqiqə
    max: 3, // 3 sorğu
    message: 'Cover letter yaratma çox tez-tez. 10 dəqiqə gözləyin.'
  },
  
  // LinkedIn import - çox məhdud
  linkedinImport: {
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 2, // 2 sorğu
    message: 'LinkedIn import çox tez-tez. 1 saat gözləyin.'
  },
  
  // AI xidmətləri - ümumi limit
  aiServices: {
    windowMs: 5 * 60 * 1000, // 5 dəqiqə
    max: 10, // 10 sorğu
    message: 'AI xidmətləri çox tez-tez istifadə edilir. Bir az gözləyin.'
  },
  
  // Ümumi API - geniş limit
  general: {
    windowMs: 1 * 60 * 1000, // 1 dəqiqə
    max: 30, // 30 sorğu
    message: 'Çox tez-tez sorğu göndərilir. Bir az yavaşlayın.'
  }
};

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitData>();

// Rate limiting check funksiyası
function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const data = rateLimitStore.get(key);
  
  if (!data || now > data.resetTime) {
    // Yeni window və ya köhnə window reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true;
  }
  
  if (data.count >= config.max) {
    return false; // Rate limit aşıldı
  }
  
  data.count++;
  return true;
}

// IP əsaslı monitoring
const ipRequests = new Map<string, { count: number; lastReset: number }>();

export function trackIpRequests(ip: string): boolean {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  
  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  const ipData = ipRequests.get(ip)!;
  
  // Saatlıq reset
  if (now - ipData.lastReset > hour) {
    ipData.count = 1;
    ipData.lastReset = now;
    return true;
  }
  
  ipData.count++;
  
  // Saatda 100-dən çox sorğu şübhəlidir
  if (ipData.count > 100) {
    console.log(`🚨 Şübhəli fəaliyyət: IP ${ip} saatda ${ipData.count} sorğu göndərib`);
    return false;
  }
  
  return true;
}

// User ID əsaslı monitoring
const userRequests = new Map<string, { count: number; lastReset: number }>();

export function trackUserRequests(userId: string): boolean {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  
  if (!userRequests.has(userId)) {
    userRequests.set(userId, { count: 1, lastReset: now });
    return true;
  }
  
  const userData = userRequests.get(userId)!;
  
  // Saatlıq reset
  if (now - userData.lastReset > hour) {
    userData.count = 1;
    userData.lastReset = now;
    return true;
  }
  
  userData.count++;
  
  // Saatda 50-dən çox sorğu şübhəlidir
  if (userData.count > 50) {
    console.log(`🚨 Şübhəli fəaliyyət: User ${userId} saatda ${userData.count} sorğu göndərib`);
    return false;
  }
  
  return true;
}

// Request logging
export function logApiRequest(
  endpoint: string, 
  ip: string, 
  userId?: string, 
  success?: boolean
) {
  const timestamp = new Date().toISOString();
  console.log(`📊 API Request: [${timestamp}] ${endpoint} - IP: ${ip} - User: ${userId || 'anonymous'} - Success: ${success}`);
}

// Get IP address from request
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

// Middleware funksiyası
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiterType: keyof typeof rateLimitConfigs = 'general'
) {
  return async (req: NextRequest) => {
    const ip = getClientIP(req);
    const config = rateLimitConfigs[limiterType];
    const key = `${limiterType}:${ip}`;
    
    // Rate limit check
    if (!checkRateLimit(key, config)) {
      console.log(`🚨 Rate limit aşıldı: ${ip} - ${req.url} - ${limiterType}`);
      return NextResponse.json(
        { 
          error: config.message,
          retryAfter: Math.round(config.windowMs / 1000)
        },
        { status: 429 }
      );
    }
    
    // IP tracking
    if (!trackIpRequests(ip)) {
      return NextResponse.json(
        { error: 'Çox tez-tez sorğu göndərilir. Daha sonra cəhd edin.' },
        { status: 429 }
      );
    }
    
    // Log request
    logApiRequest(req.url, ip);
    
    return handler(req);
  };
}

export default {
  rateLimitConfigs,
  checkRateLimit,
  trackIpRequests,
  trackUserRequests,
  logApiRequest,
  withRateLimit
};