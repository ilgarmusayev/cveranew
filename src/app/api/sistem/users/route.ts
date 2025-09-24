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
      const cvCount = user._count?.cvs || 0;
      
      console.log(`User ${user.name} (${user.email}) has ${cvCount} CVs`);
      
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
        cvCount: cvCount
      };
    });

    // Calculate additional stats
    const totalCvs = formattedUsers.reduce((sum, user) => sum + user.cvCount, 0);
    const activeUsers = formattedUsers.filter(user => user.isActive).length;
    
    // Count users by tier AND active subscription status
    const premiumUsers = formattedUsers.filter(user => 
      user.tier === 'Premium' && 
      (user.subscriptionStatus === 'active' || user.tier === 'Premium')
    ).length;
    
    const mediumUsers = formattedUsers.filter(user => 
      user.tier === 'Medium' && 
      (user.subscriptionStatus === 'active' || user.tier === 'Medium')
    ).length;

    const proUsers = formattedUsers.filter(user => 
      user.tier === 'Pro' && 
      (user.subscriptionStatus === 'active' || user.tier === 'Pro')
    ).length;

    const populyarUsers = formattedUsers.filter(user => 
      user.tier === 'Populyar' && 
      (user.subscriptionStatus === 'active' || user.tier === 'Populyar')
    ).length;
    
    const freeUsers = formattedUsers.filter(user => 
      user.tier === 'Free' || 
      (user.subscriptionStatus !== 'active' && 
       !['Premium', 'Medium', 'Pro', 'Populyar'].includes(user.tier))
    ).length;

    // Get actual subscription statistics from database
    const actualTotalCvs = await prisma.cV.count();
    const actualPremiumUsers = await prisma.user.count({ 
      where: { tier: 'Premium', status: 'active' } 
    });
    const actualMediumUsers = await prisma.user.count({ 
      where: { tier: 'Medium', status: 'active' } 
    });
    const actualProUsers = await prisma.user.count({ 
      where: { tier: 'Pro', status: 'active' } 
    });
    const actualPopulyarUsers = await prisma.user.count({ 
      where: { tier: 'Populyar', status: 'active' } 
    });
    const actualActiveSubscriptions = await prisma.subscription.count({
      where: { status: 'active' }
    });
    
    console.log(`Stats - Calculated CVs: ${totalCvs}, Actual CVs in DB: ${actualTotalCvs}`);
    console.log(`User Stats - Total: ${totalUsers}, Active: ${activeUsers}, Premium: ${premiumUsers}, Medium: ${mediumUsers}, Pro: ${proUsers}, Populyar: ${populyarUsers}, Free: ${freeUsers}`);
    console.log(`DB Stats - Premium users: ${actualPremiumUsers}, Medium users: ${actualMediumUsers}, Pro users: ${actualProUsers}, Populyar users: ${actualPopulyarUsers}, Active subscriptions: ${actualActiveSubscriptions}`);
    
    // Debug individual users
    formattedUsers.forEach(user => {
      if (['Premium', 'Medium', 'Pro', 'Populyar'].includes(user.tier)) {
        console.log(`User ${user.name}: tier=${user.tier}, subscriptionStatus=${user.subscriptionStatus}, active=${user.isActive}`);
      }
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      totalPages,
      currentPage: page,
      totalUsers,
      stats: {
        totalUsers,
        activeUsers,
        premiumUsers: actualPremiumUsers || premiumUsers,
        mediumUsers: actualMediumUsers || mediumUsers,
        proUsers: actualProUsers || proUsers,
        populyarUsers: actualPopulyarUsers || populyarUsers,
        freeUsers,
        totalCvs: actualTotalCvs || totalCvs,
        // Debug info
        calculatedPremium: premiumUsers,
        calculatedMedium: mediumUsers,
        calculatedPro: proUsers,
        calculatedPopulyar: populyarUsers,
        actualPremium: actualPremiumUsers,
        actualMedium: actualMediumUsers,
        actualPro: actualProUsers,
        actualPopulyar: actualPopulyarUsers,
        activeSubscriptions: actualActiveSubscriptions
      }
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

export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const { name, email, password, tier } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Ad, email və şifrə məcburidir'
      }, { status: 400 });
    }

    // Validate tier
    if (!['Free', 'Medium', 'Premium', 'Pro', 'Populyar'].includes(tier)) {
      return NextResponse.json({
        success: false,
        message: 'Yanlış plan səviyyəsi'
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Bu email artıq istifadə olunur'
      }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tier,
        status: 'active'
      }
    });

    // If tier is not Free, create a subscription
    if (tier !== 'Free') {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

      await prisma.subscription.create({
        data: {
          userId: newUser.id,
          tier,
          status: 'active',
          provider: 'admin',
          expiresAt
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'İstifadəçi uğurla yaradıldı',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tier: newUser.tier
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
