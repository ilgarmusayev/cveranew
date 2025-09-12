import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";


// GET /api/admin/users - Get paginated list of users
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    // Get users with subscription and CV count
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { cvs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        cvCount: user._count.cvs,
        subscription: user.subscriptions[0] || null,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user status or subscription
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { userId, action, data } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "İstifadəçi ID və əməliyyat tələb olunur" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "İstifadəçi tapılmadı" }, { status: 404 });
    }

    switch (action) {
      case "updateStatus":
        if (!data.status || !["active", "suspended", "deactivated"].includes(data.status)) {
          return NextResponse.json({ error: "Etibarsız status" }, { status: 400 });
        }
        
        await prisma.user.update({
          where: { id: userId },
          data: { status: data.status },
        });
        break;

      case "updateSubscription":
        if (!data.tier || !["Free", "Medium", "Premium"].includes(data.tier)) {
          return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
        }

        // Create or update subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

        // Check if user has an active subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (existingSubscription) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              tier: data.tier,
              status: "active",
              expiresAt,
            },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId,
              tier: data.tier,
              status: "active",
              provider: "admin",
              expiresAt,
            },
          });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
