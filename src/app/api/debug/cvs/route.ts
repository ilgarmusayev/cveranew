import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        hasAuthHeader: !!authHeader,
        cookieNames: request.cookies.getAll().map(c => c.name)
      }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid token',
        tokenLength: token.length,
        jwtError: error instanceof Error ? error.message : 'Unknown'
      }, { status: 401 });
    }

    // Get CVs for this user
    const userCVs = await prisma.cV.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    // Get total CV count in database
    const totalCVs = await prisma.cV.count();

    // Get all CVs (for debugging)
    const allCVs = await prisma.cV.findMany({
      select: {
        id: true,
        title: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      take: 10 // Limit to first 10
    });

    return NextResponse.json({
      currentUser: user,
      currentUserId: userId,
      userCVCount: userCVs.length,
      userCVs,
      totalCVsInDatabase: totalCVs,
      sampleAllCVs: allCVs,
      debugInfo: {
        tokenValid: true,
        hasUserId: !!userId,
      }
    });

  } catch (error) {
    console.error('Debug CV error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
