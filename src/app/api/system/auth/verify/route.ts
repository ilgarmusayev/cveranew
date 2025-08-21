import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || "";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.get("admin-token")?.value || 
                 req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_ADMIN_SECRET) as { 
      adminId: string; 
      email: string; 
      role: string; 
      isAdmin: boolean; 
    };

    if (!decoded.isAdmin) {
      return NextResponse.json({ error: "Not an admin" }, { status: 403 });
    }

    // Get admin details
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId, active: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLogin: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
