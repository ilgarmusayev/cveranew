// Subscription limits and usage tracking
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TierLimits {
  dailyCVLimit: number;
  allowedTemplates: string[]; // 'Free', 'Medium', 'Premium'
  exportFormats: string[]; // 'pdf', 'docx'
  supportType: 'email' | 'website' | 'priority';
  allowImages: boolean;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  Free: {
    dailyCVLimit: 2,
    allowedTemplates: ['Free'],
    exportFormats: ['pdf'],
    supportType: 'email',
    allowImages: false,
  },
  Medium: {
    dailyCVLimit: 5,
    allowedTemplates: ['Free', 'Medium'],
    exportFormats: ['pdf', 'docx'],
    supportType: 'website',
    allowImages: false,
  },
  Premium: {
    dailyCVLimit: -1, // Unlimited
    allowedTemplates: ['Free', 'Medium', 'Premium'],
    exportFormats: ['pdf', 'docx'],
    supportType: 'priority',
    allowImages: true,
  },
};

export async function getUserTierAndLimits(userId: string): Promise<{ tier: string; limits: TierLimits }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { startedAt: 'desc' },
        take: 1,
      },
    },
  });

  const tier = user?.subscriptions[0]?.tier || user?.tier || 'Free';
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.Free;

  return { tier, limits };
}

export async function getDailyUsage(userId: string, date?: Date): Promise<{
  cvCreated: number;
  pdfExports: number;
  docxExports: number;
}> {
  const targetDate = date || new Date();
  const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  const usage = await prisma.dailyUsage.findUnique({
    where: {
      userId_date: {
        userId,
        date: new Date(dateString),
      },
    },
  });

  return {
    cvCreated: usage?.cvCreated || 0,
    pdfExports: usage?.pdfExports || 0,
    docxExports: usage?.docxExports || 0,
  };
}

export async function incrementDailyUsage(
  userId: string,
  type: 'cv' | 'pdf' | 'docx',
  date?: Date
): Promise<void> {
  const targetDate = date || new Date();
  const dateString = targetDate.toISOString().split('T')[0];

  const updateData = {
    cvCreated: type === 'cv' ? { increment: 1 } : undefined,
    pdfExports: type === 'pdf' ? { increment: 1 } : undefined,
    docxExports: type === 'docx' ? { increment: 1 } : undefined,
  };

  // Remove undefined values
  const cleanUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([_, value]) => value !== undefined)
  );

  await prisma.dailyUsage.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(dateString),
      },
    },
    update: cleanUpdateData,
    create: {
      userId,
      date: new Date(dateString),
      cvCreated: type === 'cv' ? 1 : 0,
      pdfExports: type === 'pdf' ? 1 : 0,
      docxExports: type === 'docx' ? 1 : 0,
    },
  });
}

export async function canCreateCV(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { tier, limits } = await getUserTierAndLimits(userId);
  
  // Premium has unlimited CV creation
  if (limits.dailyCVLimit === -1) {
    return { allowed: true };
  }

  const usage = await getDailyUsage(userId);
  
  if (usage.cvCreated >= limits.dailyCVLimit) {
    return {
      allowed: false,
      reason: `Günlük CV yaratma limitiniz (${limits.dailyCVLimit}) dolmuşdur. ${tier === 'Free' ? 'Premium plana keçin' : 'Sabah yenidən cəhd edin'}.`,
    };
  }

  return { allowed: true };
}

export async function canUseTemplate(userId: string, templateTier: string): Promise<{ allowed: boolean; reason?: string }> {
  const { tier, limits } = await getUserTierAndLimits(userId);
  
  if (!limits.allowedTemplates.includes(templateTier)) {
    return {
      allowed: false,
      reason: `Bu şablon ${templateTier} planı üçündür. Sizin planınız: ${tier}. Yüksəltmə edin.`,
    };
  }

  return { allowed: true };
}

export async function canExportFormat(userId: string, format: 'pdf' | 'docx'): Promise<{ allowed: boolean; reason?: string }> {
  const { tier, limits } = await getUserTierAndLimits(userId);
  
  if (!limits.exportFormats.includes(format)) {
    return {
      allowed: false,
      reason: `${format.toUpperCase()} export yalnız ${format === 'docx' ? 'Medium və Premium' : 'bütün'} planlar üçündür. Sizin planınız: ${tier}.`,
    };
  }

  return { allowed: true };
}

export async function canUseImages(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { tier, limits } = await getUserTierAndLimits(userId);
  
  if (!limits.allowImages) {
    return {
      allowed: false,
      reason: `Şəkil əlavə etmək yalnız Premium plan üçündür. Sizin planınız: ${tier}.`,
    };
  }

  return { allowed: true };
}

export function getSupportInfo(tier: string): {
  type: string;
  description: string;
  contact?: string;
} {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.Free;
  
  switch (limits.supportType) {
    case 'email':
      return {
        type: 'E-poçt Dəstəyi',
        description: 'Suallarınızı e-poçt vasitəsilə göndərə bilərsiniz',
        contact: 'support@cvera.net',
      };
    case 'website':
      return {
        type: 'Sayt Dəstəyi',
        description: 'Saytda canlı dəstək və e-poçt dəstəyi',
        contact: 'Saytda dəstək bölməsi',
      };
    case 'priority':
      return {
        type: 'Prioritet Dəstək',
        description: '24/7 prioritet dəstək xidməti',
        contact: 'Prioritet dəstək kanalı',
      };
    default:
      return {
        type: 'Dəstək yoxdur',
        description: 'Dəstək xidməti mövcud deyil',
      };
  }
}
