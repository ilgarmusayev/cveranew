import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Promokod müddətlərinin yoxlanması başladı...');

    // Find all expired promo codes that are still active
    const expiredPromoCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date() // expired (less than current date)
        }
      }
    });

    if (expiredPromoCodes.length === 0) {
      console.log('✅ Müddəti çatmış aktiv promokod tapılmadı');
      return NextResponse.json({
        success: true,
        message: 'Müddəti çatmış aktiv promokod tapılmadı',
        deactivatedCount: 0
      });
    }

    console.log(`⚠️ ${expiredPromoCodes.length} promokodun müddəti çatıb`);

    // Deactivate expired promo codes
    const updateResult = await prisma.promoCode.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ ${updateResult.count} promokod deaktiv edildi`);

    // Log the deactivated promo codes
    expiredPromoCodes.forEach(promo => {
      console.log(`- ${promo.code} (${promo.tier}) - Müddət: ${promo.expiresAt?.toLocaleDateString()}`);
    });

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} müddəti çatmış promokod deaktiv edildi`,
      deactivatedCount: updateResult.count,
      deactivatedCodes: expiredPromoCodes.map(p => ({
        code: p.code,
        tier: p.tier,
        expiresAt: p.expiresAt
      }))
    });

  } catch (error) {
    console.error('❌ Promokod müddətlərinin yoxlanması zamanı xəta:', error);
    return NextResponse.json({
      success: false,
      error: 'Promokod müddətlərinin yoxlanması zamanı xəta baş verdi',
      details: error instanceof Error ? error.message : 'Naməlum xəta'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST method for manual trigger
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manualTrigger = false } = body;

    console.log(`🔄 Promokod müddətlərinin yoxlanması başladı... ${manualTrigger ? '(Manual tetikləmə)' : ''}`);

    // Find all expired promo codes that are still active
    const expiredPromoCodes = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    if (expiredPromoCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Müddəti çatmış aktiv promokod tapılmadı',
        deactivatedCount: 0
      });
    }

    // Deactivate expired promo codes
    const updateResult = await prisma.promoCode.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} müddəti çatmış promokod deaktiv edildi`,
      deactivatedCount: updateResult.count,
      deactivatedCodes: expiredPromoCodes.map(p => ({
        code: p.code,
        tier: p.tier,
        expiresAt: p.expiresAt
      }))
    });

  } catch (error) {
    console.error('❌ Promokod müddətlərinin yoxlanması zamanı xəta:', error);
    return NextResponse.json({
      success: false,
      error: 'Promokod müddətlərinin yoxlanması zamanı xəta baş verdi'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
