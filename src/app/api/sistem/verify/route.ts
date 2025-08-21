import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Token tapılmadı'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Admin icazəniz yoxdur'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin icazəsi təsdiqləndi'
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
