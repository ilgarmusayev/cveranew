import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/cv/save-order - CV section order və drag&drop dəyişikliklərini saxla
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    const { cvId, sectionOrder, cvData } = await request.json();

    if (!cvId) {
      return NextResponse.json(
        { error: 'CV ID tələb olunur' },
        { status: 400 }
      );
    }

    // CV-nin mövcudluğunu və sahibliyini yoxla
    const existingCV = await prisma.cV.findFirst({
      where: {
        id: cvId,
        userId: decoded.userId
      }
    });

    if (!existingCV) {
      return NextResponse.json(
        { error: 'CV tapılmadı və ya sizə məxsus deyil' },
        { status: 404 }
      );
    }

    // Mövcud CV data-nı əldə et və yenilə
    let updatedCvData = existingCV.cv_data as any || {};

    // Əgər yeni CV data varsa, onu birləşdir (deep merge)
    if (cvData) {
      updatedCvData = {
        ...updatedCvData,
        ...cvData,
        // Custom sections-ları qoruyub saxla
        customSections: cvData.customSections || updatedCvData.customSections || [],
        // Əlavə bölmələri qoruyub saxla
        additionalSections: {
          ...updatedCvData.additionalSections,
          ...cvData.additionalSections
        }
      };
      console.log('📋 CV data birləşdirildi, custom və əlavə bölmələr qorundu');
    }

    // Section order-i əlavə et və ya yenilə
    if (sectionOrder) {
      updatedCvData.sectionOrder = sectionOrder;
      console.log('📋 Section order yeniləndi:', sectionOrder);
    }

    // CV-ni yenilə
    const updatedCV = await prisma.cV.update({
      where: { id: cvId },
      data: {
        cv_data: updatedCvData,
        updatedAt: new Date()
      }
    });

    console.log('✅ CV section order saxlanıldı:', {
      cvId,
      sectionOrderLength: sectionOrder?.length,
      userId: decoded.userId
    });

    return NextResponse.json({
      success: true,
      cv: updatedCV,
      message: 'CV dəyişiklikləri uğurla saxlanıldı'
    });

  } catch (error) {
    console.error('❌ CV save order error:', error);
    return NextResponse.json(
      { error: 'CV saxlanılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
