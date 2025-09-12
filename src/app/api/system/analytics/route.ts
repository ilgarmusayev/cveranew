import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";


// GET /api/admin/analytics - Get dashboard analytics
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    // Get basic counts
    const [
      totalUsers,
      totalCvs,
      recentUsers,
      recentCvs,
      subscriptionStats,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total CVs
      prisma.cV.count(),
      
      // Recent users (last 30 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Recent CVs (last 30 days)
      prisma.cV.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Subscription statistics
      prisma.subscription.groupBy({
        by: ["tier"],
        _count: { tier: true },
        where: { status: "active" },
      }),
    ]);

    // Get template usage statistics
    const templateStats = await prisma.cV.groupBy({
      by: ["templateId"],
      _count: { templateId: true },
      where: { templateId: { not: null } },
    });

    // Get daily signup trends (last 7 days)
    const signupTrends = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: { createdAt: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Format subscription stats
    const subscriptionData = subscriptionStats.reduce((acc, stat) => {
      acc[stat.tier] = stat._count.tier;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalCvs,
        recentUsers,
        recentCvs,
      },
      subscriptions: {
        Free: subscriptionData.Free || 0,
        Medium: subscriptionData.Medium || 0,
        Premium: subscriptionData.Premium || 0,
      },
      // API keys removed - using HTML scraping approach
      scraping: {
        method: 'HTML Scraping',
        status: 'Active',
        note: 'Direct LinkedIn profile extraction via browser automation',
      },
      templates: templateStats.map(stat => ({
        templateId: stat.templateId,
        count: stat._count.templateId,
      })),
      trends: {
        signups: signupTrends.map(trend => ({
          date: trend.createdAt.toISOString().split('T')[0],
          count: trend._count.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Admin analytics fetch error:", error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
