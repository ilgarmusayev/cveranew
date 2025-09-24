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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    console.log('Extend subscription API called for ID:', id);
    
    await verifyAdmin(request);
    console.log('Admin verification passed');

    const body = await request.json();
    console.log('Request body:', body);
    
    const { months } = body;

    // Validate months
    if (!months || months < 1 || months > 12) {
      console.log('Invalid months value:', months);
      return NextResponse.json({
        success: false,
        message: 'Ay sayı 1-12 arasında olmalıdır'
      }, { status: 400 });
    }
    
    console.log('Extending subscription by', months, 'months');

    // Get current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id }
    });

    console.log('Found subscription:', subscription ? 'Yes' : 'No');
    if (subscription) {
      console.log('Current expiration:', subscription.expiresAt);
    }

    if (!subscription) {
      return NextResponse.json({
        success: false,
        message: 'Abunəlik tapılmadı'
      }, { status: 404 });
    }

    // Calculate new expiration date
    const currentExpiresAt = new Date(subscription.expiresAt);
    const newExpiresAt = new Date(currentExpiresAt);
    newExpiresAt.setMonth(newExpiresAt.getMonth() + months);
    
    console.log('New expiration date:', newExpiresAt);

    // Update subscription
    console.log('Updating subscription in database...');
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        expiresAt: newExpiresAt,
        status: 'active', // Reactivate if it was expired
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });

    console.log('Subscription updated successfully');

    // Update user tier if subscription was reactivated
    console.log('Updating user tier...');
    await prisma.user.update({
      where: { id: updatedSubscription.userId },
      data: { tier: updatedSubscription.tier }
    });

    console.log('User tier updated successfully');
    console.log('Sending success response');

    return NextResponse.json({
      success: true,
      message: `Abunəlik ${months} ay uzadıldı`,
      subscription: updatedSubscription
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Extend subscription error:', error);
    
    try {
      return NextResponse.json({
        success: false,
        message: error instanceof Error ? error.message : 'Server xətası'
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (jsonError) {
      console.error('Error creating JSON response:', jsonError);
      return new NextResponse('Server xətası', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Prisma disconnect error:', disconnectError);
    }
  }
}
