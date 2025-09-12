import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Token tapılmadı');
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'fallback_secret_key';

    let decoded;
    try {
      // Try admin secret first, then regular secret
      decoded = jwt.verify(token, JWT_ADMIN_SECRET) as any;
    } catch {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    }

    // Check if user is admin
    if (decoded.role === 'admin' ||
        decoded.role === 'ADMIN' ||
        decoded.role === 'SUPER_ADMIN' ||
        decoded.isAdmin ||
        decoded.adminId) {
      return decoded;
    }

    throw new Error('Admin icazəniz yoxdur');
  } catch (error) {
    console.error('Admin verification failed:', error);
    throw error;
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
