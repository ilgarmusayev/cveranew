import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get premium users
    const premiumUsers = await prisma.user.count({
      where: {
        tier: 'Premium'
      }
    });

    // Get total CVs
    const totalCVs = await prisma.cV.count();

    // Get total revenue (this would come from payment records)
    // For now, let's estimate based on premium users
    const totalRevenue = premiumUsers * 29.99; // Assuming 29.99 AZN per premium user

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const stats = {
      totalUsers,
      activeUsers,
      premiumUsers,
      totalCVs,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      newUsersToday
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
