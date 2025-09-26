import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma, withRetry } from '@/lib/prisma';
import { checkCVCreationLimit, incrementCVUsage, getLimitMessage } from '@/lib/cvLimits';

// GET /api/cv - Bütün CV-ləri əldə et
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Dashboard API: CV sorğusu başladı');

    const authHeader = request.headers.get('authorization');
    console.log('🔍 Dashboard API: Authorization header:', authHeader ? 'Mövcuddur' : 'Yoxdur');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Dashboard API: Authorization header yoxdur və ya səhvdir');
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    console.log('🔍 Dashboard API: JWT decode nəticəsi:', decoded ? `User ID: ${decoded.userId}` : 'Decode xətası');

    if (!decoded) {
      console.log('❌ Dashboard API: JWT token etibarsız');
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    console.log(`🔍 Dashboard API: ${decoded.userId} user ID-si üçün CV-lər axtarılır...`);

    // Use retry logic for database query
    const cvs = await withRetry(async () => {
      return await prisma.cV.findMany({
        where: { userId: decoded.userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          templateId: true
        }
      });
    });

    console.log(`✅ Dashboard API: ${cvs.length} CV tapıldı`);
    console.log('📋 CV-lər:', cvs.slice(0, 3).map(cv => ({ id: cv.id, title: cv.title })));

    // Ensure proper response format
    const response = {
      success: true,
      cvs: cvs,
      count: cvs.length
    };

    console.log('📤 Dashboard API: Response hazırlandı:', { count: response.count });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Dashboard API xətası:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('P1001')) {
      console.error('🔗 Database connection error - retrying...');
      return NextResponse.json(
        {
          error: 'Verilənlər bazasına qoşulma problemi. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json(
      {
        error: 'CV-lər yüklənərkən xəta baş verdi',
        details: error instanceof Error ? error.message : 'Naməlum xəta'
      },
      { status: 500 }
    );
  }
}

// POST /api/cv - Yeni CV yarat
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

    // Check CV creation limits before proceeding
    const limits = await checkCVCreationLimit(decoded.userId);

    if (!limits.canCreate) {
      return NextResponse.json(
        {
          error: 'CV yaratma limiti dolmuşdur',
          message: getLimitMessage(limits),
          limits: {
            currentCount: limits.currentCount,
            limit: limits.limit,
            tierName: limits.tierName,
            resetTime: limits.resetTime
          }
        },
        { status: 403 }
      );
    }

    const { title, cv_data, templateId, cvLanguage } = await request.json();

    console.log('🔍 CV Creation: Received data:', {
      title,
      templateId,
      cvLanguage,
      hasData: !!cv_data
    });

    if (!title || !cv_data) {
      return NextResponse.json(
        { error: 'CV başlığı və məlumatları tələb olunur' },
        { status: 400 }
      );
    }

    // Import section name manager
    const { generateSectionNamesForLanguage, detectSectionsNeedingTranslation } = await import('@/lib/sectionNameManager');
    
    // Map cvLanguage to proper format
    const targetLanguage = cvLanguage === 'en' ? 'english' : 
                          cvLanguage === 'ru' ? 'russian' : 'azerbaijani';
    
    // Set cvLanguage in cv_data and generate section names
    cv_data.cvLanguage = targetLanguage;
    
    // Detect sections that exist in cv_data and generate appropriate section names
    const sectionsWithData = detectSectionsNeedingTranslation(cv_data);
    const sectionNames = generateSectionNamesForLanguage(sectionsWithData, targetLanguage);
    cv_data.sectionNames = sectionNames;

    console.log('🏷️ Generated section names for', targetLanguage, ':', sectionNames);

    const cv = await prisma.cV.create({
      data: {
        userId: decoded.userId,
        title: title,
        cv_data: cv_data,
        templateId: templateId || 'professional',
        cvLanguage: cvLanguage || 'az'
      } as any
    });

    // Increment usage counter after successful CV creation
    await incrementCVUsage(decoded.userId);

    console.log('✅ CV yaradıldı:', {
      id: cv.id,
      cvLanguage: (cv as any).cvLanguage,
      templateId: cv.templateId
    });

    // Get updated limits for response
    const updatedLimits = await checkCVCreationLimit(decoded.userId);

    return NextResponse.json({
      success: true,
      cvId: cv.id,
      cv: cv,
      message: 'CV uğurla yaradıldı',
      limits: {
        currentCount: updatedLimits.currentCount,
        limit: updatedLimits.limit,
        tierName: updatedLimits.tierName,
        canCreateMore: updatedLimits.canCreate,
        limitMessage: getLimitMessage(updatedLimits)
      }
    });

  } catch (error) {
    console.error('CV creation error:', error);
    return NextResponse.json(
      { error: 'CV yaradılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// PUT /api/cv - Mövcud CV-ni yenilə (əlavə bölmələr daxil olmaqla)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 CV Update API: Yeniləmə sorğusu başladı');

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ CV Update API: Authorization header yoxdur');
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      console.log('❌ CV Update API: JWT token etibarsız');
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    const { cvId, title, cv_data, templateId } = await request.json();

    if (!cvId) {
      return NextResponse.json(
        { error: 'CV ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log(`🔍 CV Update API: CV ${cvId} yenilənir, user: ${decoded.userId}`);

    // Use retry logic for database operations
    const existingCV = await withRetry(async () => {
      return await prisma.cV.findFirst({
        where: {
          id: cvId,
          userId: decoded.userId
        }
      });
    });

    if (!existingCV) {
      console.log('❌ CV Update API: CV tapılmadı və ya sahiblik xətası');
      return NextResponse.json(
        { error: 'CV tapılmadı və ya sizə məxsus deyil' },
        { status: 404 }
      );
    }

    // Mövcud CV data-nı əldə et və yeni data ilə birləşdir
    let currentCvData = existingCV.cv_data as any || {};

    // Əgər yeni cv_data varsa, mövcud data ilə birləşdir
    let updatedCvData = currentCvData;
    if (cv_data) {
      // Deep merge to preserve existing sections while adding new ones
      updatedCvData = {
        ...currentCvData,
        ...cv_data,
        // Əlavə bölmələri birləşdir (additionalSections)
        additionalSections: {
          ...currentCvData.additionalSections,
          ...cv_data.additionalSections
        }
      };
      console.log('📋 CV Update API: CV data birləşdirildi, əlavə bölmələr saxlanıldı');
    }

    // CV-ni yenilə
    const updatedCV = await withRetry(async () => {
      return await prisma.cV.update({
        where: { id: cvId },
        data: {
          ...(title && { title }),
          ...(cv_data && { cv_data: updatedCvData }),
          ...(templateId && { templateId }),
          updatedAt: new Date()
        }
      });
    });

    console.log('✅ CV Update API: CV uğurla yeniləndi:', {
      cvId,
      title: updatedCV.title,
      hasAdditionalSections: !!(updatedCvData.additionalSections && Object.keys(updatedCvData.additionalSections).length > 0)
    });

    return NextResponse.json({
      success: true,
      cv: updatedCV,
      message: 'CV uğurla yeniləndi',
      additionalSections: updatedCvData.additionalSections || {}
    });

  } catch (error) {
    console.error('❌ CV Update API xətası:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('P1001')) {
      return NextResponse.json(
        {
          error: 'Verilənlər bazasına qoşulma problemi. Zəhmət olmasa bir az sonra yenidən cəhd edin.',
          code: 'DB_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'CV yenilənərkən xəta baş verdi',
        details: error instanceof Error ? error.message : 'Naməlum xəta'
      },
      { status: 500 }
    );
  }
}
