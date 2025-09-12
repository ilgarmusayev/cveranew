import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { APIKeyManager } from '@/lib/apiKeyManager';


// Admin yetkilendirme yoxlaması
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token tələb olunur', status: 401 };
  }

  const token = authHeader.substring(7);
  const decoded = await verifyJWT(token);

  if (!decoded) {
    return { error: 'Etibarsız token', status: 401 };
  }

  // İstifadəçinin admin olub olmadığını yoxla
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Admin hüququ tələb olunur', status: 403 };
  }

  return { user, userId: decoded.userId };
}

// GET /api/admin/api-keys - Bütün API key-ləri əldə et
export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const apiKeys = await APIKeyManager.getAllAPIKeys();
    const stats = await APIKeyManager.getAPIStats();

    return NextResponse.json({
      success: true,
      apiKeys,
      stats,
      message: 'API key-lər uğurla əldə edildi'
    });

  } catch (error) {
    console.error('❌ Admin API keys GET error:', error);
    return NextResponse.json(
      { error: 'API key-lər əldə edilərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// POST /api/admin/api-keys - Yeni API key əlavə et
export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { serviceName, apiKey, dailyLimit, priority = 1, active = true } = await request.json();

    if (!serviceName || !apiKey) {
      return NextResponse.json(
        { error: 'serviceName və apiKey tələb olunur' },
        { status: 400 }
      );
    }

    const success = await APIKeyManager.addAPIKey({
      service: serviceName,
      apiKey,
      dailyLimit: dailyLimit || 1000,
      priority,
      active
    });

    if (success) {
      console.log(`✅ Admin ${authCheck.userId} yeni API key əlavə etdi: ${serviceName}`);
      return NextResponse.json({
        success: true,
        message: 'API key uğurla əlavə edildi'
      });
    } else {
      return NextResponse.json(
        { error: 'API key əlavə edilərkən xəta baş verdi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Admin API keys POST error:', error);
    return NextResponse.json(
      { error: 'API key əlavə edilərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/api-keys/[id] - API key yenilə
export async function PUT(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'API key ID tələb olunur' }, { status: 400 });
    }

    const updates = await request.json();
    const success = await APIKeyManager.updateAPIKey(id, updates);

    if (success) {
      console.log(`✅ Admin ${authCheck.userId} API key yenilədi: ${id}`);
      return NextResponse.json({
        success: true,
        message: 'API key uğurla yeniləndi'
      });
    } else {
      return NextResponse.json(
        { error: 'API key yenilənərkən xəta baş verdi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Admin API keys PUT error:', error);
    return NextResponse.json(
      { error: 'API key yenilənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/api-keys/[id] - API key sil
export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'API key ID tələb olunur' }, { status: 400 });
    }

    const success = await APIKeyManager.deleteAPIKey(id);

    if (success) {
      console.log(`✅ Admin ${authCheck.userId} API key sildi: ${id}`);
      return NextResponse.json({
        success: true,
        message: 'API key uğurla silindi'
      });
    } else {
      return NextResponse.json(
        { error: 'API key silinərkən xəta baş verdi' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Admin API keys DELETE error:', error);
    return NextResponse.json(
      { error: 'API key silinərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
