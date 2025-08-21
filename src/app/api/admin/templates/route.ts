import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Verify admin token
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all templates
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: 'Template-lar yüklənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// PUT - Update template (simplified - only basic updates since order field doesn't exist)
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, tier, previewUrl, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID tələb olunur' },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tier && { tier }),
        ...(previewUrl && { previewUrl }),
        ...(description !== undefined && { description })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template yeniləndi',
      template: updatedTemplate
    });

  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: 'Template yenilənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, tier, previewUrl, description } = await request.json();

    if (!name || !tier || !previewUrl) {
      return NextResponse.json(
        { error: 'Bütün məcburi sahələr doldurulmalıdır' },
        { status: 400 }
      );
    }

    const template = await prisma.template.create({
      data: {
        name,
        tier,
        previewUrl,
        description: description || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Template yaradıldı',
      template
    });

  } catch (error) {
    console.error('Template creation error:', error);
    return NextResponse.json(
      { error: 'Template yaradılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
