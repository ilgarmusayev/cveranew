import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/jwt";


function getUserIdFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  
  const payload = verifyJWT(token);
  return payload?.userId || null;
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      loginMethod: true,
      linkedinId: true,
      linkedinUsername: true,
      tier: true,
      createdAt: true,
      updatedAt: true,
      subscriptions: {
        where: { 
          status: "active" 
        },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          tier: true,
          status: true,
          provider: true,
          expiresAt: true,
        },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
  }

  try {
    const { name, email, password, currentPassword } = await req.json();
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: "Ad və e-poçt tələb olunur" }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId
        }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Bu e-poçt artıq istifadə olunur" }, { status: 400 });
    }

    const updateData: { name: string; email: string; password?: string } = {
      name,
      email
    };

    // Handle password change
    if (password) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Hazırkı şifrəni daxil edin" }, { status: 400 });
      }

      // Verify current password
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!currentUser) {
        return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
      }

      // Check if user has a password (LinkedIn users don't have passwords)
      if (!currentUser.password) {
        return NextResponse.json({
          error: "LinkedIn ilə qeydiyyatdan keçən istifadəçilər şifrə dəyişə bilməz. LinkedIn hesabınızdan istifadə edin.",
          requiresLinkedInLogin: true
        }, { status: 400 });
      }

      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
      
      if (!isValidPassword) {
        return NextResponse.json({ error: "Hazırkı şifrə yanlışdır" }, { status: 400 });
      }

      // Hash new password
      updateData.password = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || "12"));
    }

    // Update user
    const user = await prisma.user.update({ 
      where: { id: userId }, 
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      message: "Profil uğurla yeniləndi"
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
