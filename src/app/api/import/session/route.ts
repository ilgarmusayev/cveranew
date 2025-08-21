import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "";

function getUserIdFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

// GET /api/import/session - Get import session data
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session');
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Find the import session
    const importSession = await prisma.importSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!importSession) {
      return NextResponse.json({ 
        error: "Import session not found or expired" 
      }, { status: 404 });
    }

    // Parse the stored data
    let sessionData;
    try {
      sessionData = JSON.parse(importSession.data);
    } catch (parseError) {
      console.error('Failed to parse session data:', parseError);
      return NextResponse.json({ 
        error: "Invalid session data" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: sessionData,
      type: importSession.type,
      createdAt: importSession.createdAt,
      expiresAt: importSession.expiresAt
    });

  } catch (error) {
    console.error("Import session error:", error);
    return NextResponse.json({ 
      error: "Failed to load import session" 
    }, { status: 500 });
  }
}

// DELETE /api/import/session - Delete import session after use
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session');
    
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Delete the import session
    await prisma.importSession.deleteMany({
      where: {
        id: sessionId,
        userId: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully"
    });

  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ 
      error: "Failed to delete session" 
    }, { status: 500 });
  }
}
