import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CVLimits {
  canCreate: boolean;
  limitReached: boolean;
  currentCount: number;
  limit: number | null; // null means unlimited
  resetTime?: Date; // For daily limits
  tierName: string;
}

export async function checkCVCreationLimit(userId: string): Promise<CVLimits> {
  try {
    // Get user's tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    if (!user) {
      throw new Error('İstifadəçi tapılmadı');
    }

    const tier = user.tier.toLowerCase();

    // Get today's date for daily usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (tier) {
      case 'free':
      case 'pulsuz': {
        // Free tier: 2 CV total limit
        const totalCVs = await prisma.cV.count({
          where: { userId }
        });

        return {
          canCreate: totalCVs < 2,
          limitReached: totalCVs >= 2,
          currentCount: totalCVs,
          limit: 2,
          tierName: 'Pulsuz'
        };
      }

      case 'medium':
      case 'orta': {
        // Medium tier: 5 CV per day limit
        let dailyUsage = await prisma.dailyUsage.findUnique({
          where: {
            userId_date: {
              userId,
              date: today
            }
          }
        });

        // Create daily usage record if it doesn't exist
        if (!dailyUsage) {
          dailyUsage = await prisma.dailyUsage.create({
            data: {
              userId,
              date: today,
              cvCreated: 0,
              pdfExports: 0,
              docxExports: 0
            }
          });
        }

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
          canCreate: dailyUsage.cvCreated < 5,
          limitReached: dailyUsage.cvCreated >= 5,
          currentCount: dailyUsage.cvCreated,
          limit: 5,
          resetTime: tomorrow,
          tierName: 'Orta'
        };
      }

      case 'premium': {
        // Premium tier: Unlimited
        const totalCVs = await prisma.cV.count({
          where: { userId }
        });

        return {
          canCreate: true,
          limitReached: false,
          currentCount: totalCVs,
          limit: null,
          tierName: 'Premium'
        };
      }

      default: {
        // Default to free tier limits
        const totalCVs = await prisma.cV.count({
          where: { userId }
        });

        return {
          canCreate: totalCVs < 2,
          limitReached: totalCVs >= 2,
          currentCount: totalCVs,
          limit: 2,
          tierName: 'Pulsuz'
        };
      }
    }
  } catch (error) {
    console.error('CV limit check error:', error);
    throw new Error('CV limit yoxlanılarkən xəta baş verdi');
  }
}

export async function incrementCVUsage(userId: string): Promise<void> {
  try {
    // Get user's tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    });

    if (!user) {
      throw new Error('İstifadəçi tapılmadı');
    }

    const tier = user.tier.toLowerCase();

    // Only increment daily usage for medium tier
    if (tier === 'medium' || tier === 'orta') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.dailyUsage.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        update: {
          cvCreated: {
            increment: 1
          }
        },
        create: {
          userId,
          date: today,
          cvCreated: 1,
          pdfExports: 0,
          docxExports: 0
        }
      });
    }
  } catch (error) {
    console.error('CV usage increment error:', error);
    throw new Error('CV istifadə sayı artırılarkən xəta baş verdi');
  }
}

export function getLimitMessage(limits: CVLimits): string {
  if (limits.canCreate) {
    if (limits.limit === null) {
      return `${limits.tierName} paketiniz limitsiz CV yaratma imkanı verir.`;
    } else if (limits.resetTime) {
      return `${limits.currentCount}/${limits.limit} günlük CV yaratma haqıınızı istifadə etmisiniz.`;
    } else {
      return `${limits.currentCount}/${limits.limit} CV yaratma haqınızı istifadə etmisiniz.`;
    }
  } else {
    if (limits.resetTime) {
      const resetTimeStr = limits.resetTime.toLocaleDateString('az-AZ');
      return `Günlük CV yaratma limitiniz (${limits.limit}) dolmuşdur. Limit ${resetTimeStr} tarixində sıfırlanacaq.`;
    } else {
      return `CV yaratma limitiniz (${limits.limit}) dolmuşdur. Premium paketi alın və limitsiz CV yaradın.`;
    }
  }
}
