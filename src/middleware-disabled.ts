// Middleware completely disabled for debugging
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow all requests without any authentication checks
  return NextResponse.next();
}

export const config = {
  matcher: '/(.*)'
}
