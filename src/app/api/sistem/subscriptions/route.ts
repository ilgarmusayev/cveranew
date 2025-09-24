import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token tapılmadı');
  }

  const token = authHeader.substring(7);
  
  // Try both JWT secrets
  let decoded: any;
  try {
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
    decoded = jwt.verify(token, JWT_ADMIN_SECRET!) as any;
  } catch {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  }
  
  // Check if it's an admin token
  if (decoded.adminId && decoded.isAdmin) {
    // This is an admin token, verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin || !admin.active) {
      throw new Error('Admin icazəniz yoxdur');
    }

    return admin;
  } else if (decoded.userId) {
    // This is a regular user token, check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      throw new Error('Admin icazəniz yoxdur');
    }

    return user;
  } else {
    throw new Error('Token səhvdir');
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'all';
    const tier = url.searchParams.get('tier') || 'all';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status !== 'all') {
      where.status = status;
    }

    if (tier !== 'all') {
      where.tier = tier;
    }

    // Get subscriptions with user info
    const subscriptions = await prisma.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get total count for pagination
    const totalSubscriptions = await prisma.subscription.count({ where });
    const totalPages = Math.ceil(totalSubscriptions / limit);

    return NextResponse.json({
      success: true,
      subscriptions,
      totalPages,
      currentPage: page,
      totalSubscriptions
    });

  } catch (error) {
    console.error('Admin subscriptions error:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
