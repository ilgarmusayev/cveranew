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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const tier = url.searchParams.get('tier') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tier !== 'all') {
      where.tier = tier;
    }

    // Get users with CV count and subscription info
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { cvs: true }
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);

    // Format users data
    const formattedUsers = users.map(user => {
      const latestSubscription = user.subscriptions[0];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        tier: user.tier,
        subscriptionStatus: latestSubscription?.status || 'none',
        subscriptionStart: latestSubscription?.startedAt,
        subscriptionEnd: latestSubscription?.expiresAt,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLogin,
        isActive: user.status === 'active',
        cvCount: user._count.cvs
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      totalPages,
      currentPage: page,
      totalUsers
    });

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
