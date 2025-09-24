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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE request received');
    await verifyAdmin(request);
    console.log('Admin verification passed');
    
    const { id } = await params;
    console.log('User ID to delete:', id);

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cvs: true,
            subscriptions: true,
            payments: true
          }
        }
      }
    });

    console.log('User to delete found:', userToDelete ? 'Yes' : 'No');

    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      }, { status: 404 });
    }

    // Prevent deleting admin users
    if (userToDelete.role === 'ADMIN') {
      return NextResponse.json({
        success: false,
        message: 'Admin istifadəçiləri silinə bilməz'
      }, { status: 400 });
    }

    // Delete related data in correct order (foreign key constraints)
    console.log('Starting transaction to delete user and related data');
    await prisma.$transaction(async (tx) => {
      // Delete daily usage records
      try {
        console.log('Deleting daily usage records...');
        const dailyUsageDeleted = await tx.dailyUsage.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${dailyUsageDeleted.count} daily usage records`);
      } catch (error) {
        console.log('Daily usage deletion failed or table not exists:', error);
      }

      // Delete import sessions
      try {
        console.log('Deleting import sessions...');
        const importSessionsDeleted = await tx.importSession.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${importSessionsDeleted.count} import sessions`);
      } catch (error) {
        console.log('Import sessions deletion failed or table not exists:', error);
      }

      // Delete promo code usages
      try {
        console.log('Deleting promo code usages...');
        const promoUsageDeleted = await tx.promoCodeUsage.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${promoUsageDeleted.count} promo code usages`);
      } catch (error) {
        console.log('Promo code usages deletion failed or table not exists:', error);
      }

      // Delete file generation jobs related to user's CVs
      try {
        console.log('Deleting file generation jobs...');
        const fileJobsDeleted = await tx.fileGenerationJob.deleteMany({
          where: {
            cv: {
              userId: id
            }
          }
        });
        console.log(`Deleted ${fileJobsDeleted.count} file generation jobs`);
      } catch (error) {
        console.log('File generation jobs deletion failed or table not exists:', error);
      }

      // Delete CVs
      try {
        console.log('Deleting CVs...');
        const cvsDeleted = await tx.cV.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${cvsDeleted.count} CVs`);
      } catch (error) {
        console.log('CVs deletion failed:', error);
      }

      // Delete subscriptions
      try {
        console.log('Deleting subscriptions...');
        const subscriptionsDeleted = await tx.subscription.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${subscriptionsDeleted.count} subscriptions`);
      } catch (error) {
        console.log('Subscriptions deletion failed:', error);
      }

      // Delete payments
      try {
        console.log('Deleting payments...');
        const paymentsDeleted = await tx.payment.deleteMany({
          where: { userId: id }
        });
        console.log(`Deleted ${paymentsDeleted.count} payments`);
      } catch (error) {
        console.log('Payments deletion failed:', error);
      }

      // Finally delete the user
      console.log('Finally deleting the user...');
      await tx.user.delete({
        where: { id }
      });
    });

    console.log('User deletion transaction completed successfully');

    return NextResponse.json({
      success: true,
      message: 'İstifadəçi və bütün məlumatları uğurla silindi'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    
    // Ensure we always return valid JSON
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
      // Fallback to plain text if JSON fails
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cvs: true }
        },
        cvs: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        dailyUsage: {
          orderBy: { date: 'desc' },
          take: 7
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'İstifadəçi tapılmadı'
      }, { status: 404 });
    }

    const latestSubscription = user.subscriptions[0];
    const cvCount = user._count?.cvs || 0;
    
    console.log(`Detailed user info - ${user.name} (${user.email}) has ${cvCount} CVs, actual CVs: ${user.cvs.length}`);
    
    const formattedUser = {
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
      cvCount: cvCount,
      cvs: user.cvs,
      subscriptions: user.subscriptions,
      payments: user.payments,
      dailyUsage: user.dailyUsage
    };

    return NextResponse.json({
      success: true,
      user: formattedUser
    });

  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}