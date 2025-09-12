import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { checkCVCreationLimit, incrementCVUsage, getLimitMessage } from '@/lib/cvLimits';
import { LinkedInImportService } from '@/lib/linkedinImportService';


export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
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

    const { linkedinUsername, profileData } = await request.json();

    // Yeni sistem: Database-dən API key istifadə edərək LinkedIn məlumatlarını əldə et
    let cvData;
    
    if (linkedinUsername) {
      console.log(`🔄 LinkedIn import başladı: ${linkedinUsername}`);
      try {
        cvData = await LinkedInImportService.importFromLinkedIn(linkedinUsername);
        console.log(`✅ LinkedIn import uğurlu: ${linkedinUsername}`);
      } catch (importError) {
        console.error(`❌ LinkedIn import xətası: ${linkedinUsername}`, importError);
        const errorMessage = importError instanceof Error ? importError.message : 'Naməlum xəta';
        return NextResponse.json(
          { error: `LinkedIn profilini import etmək mümkün olmadı: ${errorMessage}` },
          { status: 400 }
        );
      }
    } else if (profileData) {
      // Köhnə sistem: Əvvəlcədən hazırlanmış profil məlumatları
      cvData = profileData;
    } else {
      return NextResponse.json(
        { error: 'LinkedinUsername və ya profileData tələb olunur' },
        { status: 400 }
      );
    }

    if (!cvData || !cvData.personalInfo) {
      return NextResponse.json(
        { error: 'Etibarlı profil məlumatları əldə edilmədi' },
        { status: 400 }
      );
    }

    // CV yaratmaq üçün başlıq generate et
    const cvTitle = `${cvData.personalInfo.fullName || 'LinkedIn'} CV - ${new Date().toLocaleDateString('az-AZ')}`;

    // CV-ni verilənlər bazasında saxla
    const newCV = await prisma.cV.create({
      data: {
        userId: decoded.userId,
        title: cvTitle,
        cv_data: cvData,
        templateId: 'professional'
      }
    });

    // İstifadə sayğacını artır
    await incrementCVUsage(decoded.userId);

    console.log(`✅ LinkedIn CV yaradıldı: ${newCV.id}, User: ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      cv: newCV,
      message: 'LinkedIn profilindən CV uğurla yaradıldı',
      importSource: cvData.importSource || 'manual',
      importDate: cvData.importDate
    });

  } catch (error) {
    console.error('❌ LinkedIn CV yaratma xətası:', error);
    return NextResponse.json(
      { error: 'CV yaradılarkən xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
