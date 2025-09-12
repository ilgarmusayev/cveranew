import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tapılmadı');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || user.role !== 'ADMIN') {
    throw new Error('Admin icazəniz yoxdur');
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    // Get subscription stats
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });

    const expiredSubscriptions = await prisma.subscription.count({
      where: { status: 'expired' }
    });

    const cancelledSubscriptions = await prisma.subscription.count({
      where: { status: 'cancelled' }
    });

    // Calculate total revenue (estimate based on subscription counts)
    const premiumSubscriptions = await prisma.subscription.count({
      where: { 
        tier: 'Premium',
        status: { in: ['active', 'expired'] }
      }
    });

    const mediumSubscriptions = await prisma.subscription.count({
      where: { 
        tier: 'Medium',
        status: { in: ['active', 'expired'] }
      }
    });

    const totalRevenue = (premiumSubscriptions * 29.99) + (mediumSubscriptions * 19.99);

    // Get usage stats
    const totalCVs = await prisma.cV.count();

    const cvsCreatedToday = await prisma.cV.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const cvsCreatedThisWeek = await prisma.cV.count({
      where: {
        createdAt: {
          gte: thisWeekStart
        }
      }
    });

    const cvsCreatedThisMonth = await prisma.cV.count({
      where: {
        createdAt: {
          gte: thisMonthStart
        }
      }
    });

    // Get user growth data (simplified - daily counts for the period)
    const userGrowth = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });

      userGrowth.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }

    // Get top users by CV count
    const topUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        cvs: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: { cvs: true }
        }
      }
    });

    const formattedTopUsers = topUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      cvCount: user._count.cvs,
      tier: user.tier
    }));

    const analytics = {
      userGrowth,
      subscriptionStats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        activeSubscriptions,
        expiredSubscriptions,
        cancelledSubscriptions
      },
      usageStats: {
        totalCVs,
        cvsCreatedToday,
        cvsCreatedThisWeek,
        cvsCreatedThisMonth
      },
      topUsers: formattedTopUsers
    };

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
