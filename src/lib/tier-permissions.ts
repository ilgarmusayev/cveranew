// Tier-based permission system for CVERA

export interface TierPermissions {
  aiAccess: boolean;
  templateAccess: string[];
  previewAccess: boolean;
  cvLimit?: number;
  dailyLimit?: number;
  formats: string[];
}

export const TIER_PERMISSIONS: Record<string, TierPermissions> = {
  Free: {
    aiAccess: false,
    templateAccess: ['free'],
    previewAccess: true,
    cvLimit: 2,
    formats: ['pdf']
  },
  Medium: {
    aiAccess: true,
    templateAccess: ['free', 'medium'],
    previewAccess: true,
    dailyLimit: 5,
    formats: ['pdf', 'docx']
  },
  Pro: {
    aiAccess: true,
    templateAccess: ['free', 'medium'],
    previewAccess: true,
    dailyLimit: 5,
    formats: ['pdf', 'docx']
  },
  Premium: {
    aiAccess: true,
    templateAccess: ['free', 'medium', 'premium'],
    previewAccess: true,
    formats: ['pdf', 'docx']
  }
};

/**
 * Check if user has AI access based on their tier
 */
export function hasAIAccess(userTier: string): boolean {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;
  return permissions.aiAccess;
}

/**
 * Check if user can access a specific template tier
 */
export function canAccessTemplate(userTier: string, templateTier: string): boolean {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;
  return permissions.templateAccess.includes(templateTier.toLowerCase());
}

/**
 * Check if user can preview templates (all users can preview)
 */
export function canPreviewTemplates(userTier: string): boolean {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;
  return permissions.previewAccess;
}

/**
 * Get available template tiers for user
 */
export function getAvailableTemplateTiers(userTier: string): string[] {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;
  return permissions.templateAccess;
}

/**
 * Check if user can export in specific format
 */
export function canExportFormat(userTier: string, format: string): boolean {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;
  return permissions.formats.includes(format.toLowerCase());
}

/**
 * Get user's CV creation limits
 */
export function getUserLimits(userTier: string): {
  type: 'total' | 'daily' | 'unlimited';
  limit: number;
  description: string;
} {
  const permissions = TIER_PERMISSIONS[userTier] || TIER_PERMISSIONS.Free;

  if (permissions.cvLimit) {
    return {
      type: 'total',
      limit: permissions.cvLimit,
      description: `Ümumi ${permissions.cvLimit} CV yarada bilərsiniz`
    };
  }

  if (permissions.dailyLimit) {
    return {
      type: 'daily',
      limit: permissions.dailyLimit,
      description: `Gündə ${permissions.dailyLimit} CV yarada bilərsiniz`
    };
  }

  return {
    type: 'unlimited',
    limit: Infinity,
    description: 'Limitsiz CV yarada bilərsiniz'
  };
}

/**
 * Get tier display name in Azerbaijani
 */
export function getTierDisplayName(tier: string): string {
  const tierNames: Record<string, string> = {
    Free: 'Pulsuz',
    Medium: 'Orta',
    Pro: 'Orta',
    Premium: 'Premium'
  };

  return tierNames[tier] || 'Pulsuz';
}

/**
 * Check if tier is paid
 */
export function isPaidTier(tier: string): boolean {
  return tier !== 'Free';
}

/**
 * Get upgrade suggestions for user
 */
export function getUpgradeSuggestions(userTier: string, requiredFeature: string): {
  message: string;
  suggestedTier: string;
  upgradeUrl: string;
} {
  if (requiredFeature === 'ai' && !hasAIAccess(userTier)) {
    return {
      message: 'AI xüsusiyyətləri üçün Orta və ya Premium paketi tələb olunur',
      suggestedTier: 'Medium',
      upgradeUrl: '/pricing'
    };
  }

  if (requiredFeature === 'premium-templates' && !canAccessTemplate(userTier, 'premium')) {
    return {
      message: 'Premium şablonlar üçün Premium paketi tələb olunur',
      suggestedTier: 'Premium',
      upgradeUrl: '/pricing'
    };
  }

  if (requiredFeature === 'docx' && !canExportFormat(userTier, 'docx')) {
    return {
      message: 'DOCX formatı üçün Orta və ya Premium paketi tələb olunur',
      suggestedTier: 'Medium',
      upgradeUrl: '/pricing'
    };
  }

  return {
    message: 'Bu xüsusiyyət üçün paket yeniləməsi tələb olunur',
    suggestedTier: 'Premium',
    upgradeUrl: '/pricing'
  };
}
