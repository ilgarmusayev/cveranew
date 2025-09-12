import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';


// Admin authentication middleware - updated to match our admin system
async function authenticateAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
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

    return null;
  } catch (error) {
    console.error('Admin auth error:', error);
    return null;
  }
}

// GET - List all API keys
export async function GET(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    const whereClause = service ? { service } : {};

    // Try to get API keys, if table doesn't exist, return empty array
    let apiKeys: any[] = [];
    try {
      apiKeys = await prisma.apiKey.findMany({
        where: whereClause,
        select: {
          id: true,
          service: true,
          active: true,
          priority: true,
          usageCount: true,
          lastUsed: true,
          lastResult: true,
          dailyLimit: true,
          dailyUsage: true,
          lastReset: true,
          createdAt: true,
          updatedAt: true,
          // Don't expose the actual API key for security - partial exposure only
          apiKey: true
        },
        orderBy: [
          { active: 'desc' },
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    } catch (error) {
      console.log('ApiKey table might not exist, returning empty array');
      apiKeys = [];
    }

    // Mask API keys for security
    const maskedApiKeys = apiKeys.map(key => ({
      ...key,
      apiKey: key.apiKey ? `${key.apiKey.substring(0, 8)}***${key.apiKey.slice(-4)}` : 'N/A'
    }));

    return NextResponse.json({
      success: true,
      data: maskedApiKeys
    });

  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Add new API key
export async function POST(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service, apiKey, priority = 1, dailyLimit = 1000 } = body;

    if (!service || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Service və API key tələb olunur'
      }, { status: 400 });
    }

    // Create API key entry
    try {
      const newApiKey = await prisma.apiKey.create({
        data: {
          service,
          apiKey,
          priority: parseInt(priority),
          dailyLimit: parseInt(dailyLimit),
          active: true,
          usageCount: 0,
          dailyUsage: 0,
          lastReset: new Date()
        },
        select: {
          id: true,
          service: true,
          active: true,
          priority: true,
          dailyLimit: true,
          createdAt: true
        }
      });

      return NextResponse.json({
        success: true,
        data: newApiKey,
        message: 'API key uğurla əlavə edildi'
      });

    } catch (error) {
      console.error('Database error when creating API key:', error);
      return NextResponse.json({
        success: false,
        error: 'API key əlavə edilə bilmədi'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server xətası'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update API key
export async function PUT(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, active, priority, dailyLimit } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID tələb olunur' },
        { status: 400 }
      );
    }

    const updatedApiKey = await prisma.apiKey.update({
      where: { id },
      data: {
        ...(active !== undefined && { active: Boolean(active) }),
        ...(priority !== undefined && { priority: parseInt(priority) }),
        ...(dailyLimit !== undefined && { dailyLimit: parseInt(dailyLimit) })
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedApiKey,
        apiKey: updatedApiKey.apiKey.substring(0, 8) + '***' + updatedApiKey.apiKey.slice(-4)
      },
      message: 'API key uğurla yeniləndi'
    });

  } catch (error) {
    console.error('API Keys PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete API key
export async function DELETE(request: NextRequest) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID tələb olunur' },
        { status: 400 }
      );
    }

    await prisma.apiKey.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'API key uğurla silindi'
    });

  } catch (error) {
    console.error('API Keys DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
