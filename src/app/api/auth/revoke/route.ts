import { NextResponse } from "next/server";

export async function POST() {
  console.log('🗑️ Token revoke çağrıldı');
  
  const response = NextResponse.json({ 
    message: "All tokens revoked successfully",
    timestamp: new Date().toISOString()
  });
  
  // Clear all possible authentication cookies with different configurations
  const cookiesToClear = [
    "auth-token",
    "accessToken", 
    "refreshToken",
    "session",
    "token",
    "user-session",
    "jwt-token"
  ];
  
  cookiesToClear.forEach(cookieName => {
    // Clear for root path
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    
    // Clear for api path
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api",
      maxAge: 0,
      expires: new Date(0),
    });
    
    // Clear for domain
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      domain: process.env.NODE_ENV === "production" ? ".cvera.net" : "localhost",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  });
  
  // Add cache control headers
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
  
  console.log('✅ Bütün token-lər və cookie-lər təmizləndi');
  
  return response;
}
