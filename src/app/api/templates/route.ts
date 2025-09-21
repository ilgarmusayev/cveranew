import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getUserTierAndLimits } from "@/lib/subscription-limits";

const JWT_SECRET = process.env.JWT_SECRET || "";

function getUserIdFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
}

// GET /api/templates - List all available templates
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    
    // Get user's tier and limits
    const { tier: userTier, limits } = userId 
      ? await getUserTierAndLimits(userId)
      : { tier: 'Free' as const, limits: { allowedTemplates: ['Free'] } };

    // Site language header-dən dili təyin edək
    const siteLanguage = req.headers.get('x-site-language') || 'english';
    console.log('API Templates - Site Language:', siteLanguage);

    // Get all templates with both descriptions using raw query
    const templates = await prisma.$queryRaw`
      SELECT 
        id, name, tier, "previewUrl", description, description_en, "createdAt", "updatedAt"
      FROM "Template" 
      ORDER BY "createdAt" DESC
    ` as Array<{
      id: string;
      name: string;
      tier: string;
      previewUrl: string;
      description: string | null;
      description_en: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;

    console.log('Raw templates from DB (first template):', templates[0]);

    // Helper function to check template access
    const hasTemplateAccess = (templateTier: string) => {
      if (!userId) return templateTier === 'Free'; // Anonymous users only get Free
      return limits.allowedTemplates.includes(templateTier);
    };

    // Add access information to each template and select appropriate description
    const templatesWithAccess = templates.map(template => {
      // Site language-ə görə description seçək
      let finalDescription: string;
      
      if (siteLanguage === 'azerbaijani') {
        // Azərbaycan dili üçün description (əsas) və ya description_en (fallback)
        finalDescription = template.description || template.description_en || 'Professional CV şablonu';
      } else {
        // İngilis dili üçün description_en (əsas) və ya description (fallback)
        finalDescription = template.description_en || template.description || 'Professional CV template';
      }

      return {
        id: template.id,
        name: template.name,
        tier: template.tier,
        previewUrl: template.previewUrl,
        description: finalDescription, // Site language-ə uyğun description
        description_en: template.description_en, // Frontend üçün əlavə məlumat
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        preview_url: template.previewUrl, // Add preview_url for backward compatibility
        hasAccess: hasTemplateAccess(template.tier),
        requiresUpgrade: !hasTemplateAccess(template.tier),
        accessTier: template.tier,
      };
    });

    return NextResponse.json({
      templates: templatesWithAccess,
      userTier,
      limits: userId ? {
        dailyCVLimit: limits.dailyCVLimit,
        allowedTemplates: limits.allowedTemplates,
        exportFormats: limits.exportFormats,
        supportType: limits.supportType,
        allowImages: limits.allowImages,
      } : {
        dailyCVLimit: 1,
        allowedTemplates: ['Free'],
        exportFormats: ['PDF'],
        supportType: 'Community',
        allowImages: false,
      }
    });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json({ error: "Şablonlar yüklənərkən xəta baş verdi" }, { status: 500 });
  }
}
