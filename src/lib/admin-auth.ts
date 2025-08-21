import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || "";

export function getAdminFromRequest(req: NextRequest): { adminId: string; email: string; role: string } | null {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get("admin-token")?.value || 
                 req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_ADMIN_SECRET) as { 
      adminId: string; 
      email: string; 
      role: string; 
      isAdmin: boolean; 
    };

    if (!decoded.isAdmin) {
      return null;
    }

    return {
      adminId: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return null;
  }
}

export function requireAdmin(req: NextRequest): NextResponse | null {
  const admin = getAdminFromRequest(req);
  
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 401 });
  }

  return null;
}

export function requireSuperAdmin(req: NextRequest): NextResponse | null {
  const admin = getAdminFromRequest(req);
  
  if (!admin || admin.role !== "superadmin") {
    return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
  }

  return null;
}
