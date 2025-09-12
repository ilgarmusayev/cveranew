import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { canCreateCV, canUseTemplate, incrementDailyUsage } from "@/lib/subscription-limits";
import { isValidCVLanguage, getDefaultCVLanguage } from "@/lib/cvLanguage";

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

async function validateTemplateAccess(userId: string, templateId: string): Promise<boolean> {
  if (!templateId) return true; // No template specified

  // Get user's current subscription tier
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: "active" },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });

  const userTier = user?.subscriptions[0]?.tier || "Free";

  // Get template's tier
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { tier: true },
  });

  if (!template) return false; // Template not found

  // Check if user has access to this template tier
  const tierOrder = { Free: 1, Medium: 2, Premium: 3 };
  const userTierLevel = tierOrder[userTier as keyof typeof tierOrder] || 1;
  const templateTierLevel = tierOrder[template.tier as keyof typeof tierOrder] || 1;

  return templateTierLevel <= userTierLevel;
}

// GET /api/cvs - List all CVs for the current user
export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cvs = await prisma.cV.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(cvs);
}

// POST /api/cvs - Create a new CV
export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    console.log('CV creation request body:', JSON.stringify(body, null, 2));
    
    const { title, cv_data } = body;
    
    if (!title || !cv_data) {
      console.error('Missing required fields:', { title: !!title, cv_data: !!cv_data });
      return NextResponse.json({ error: "Title and cv_data required." }, { status: 400 });
    }

    // Set default CV language if not specified
    if (cv_data && typeof cv_data === 'object') {
      if (!cv_data.cvLanguage) {
        cv_data.cvLanguage = getDefaultCVLanguage();
      } else if (!isValidCVLanguage(cv_data.cvLanguage)) {
        cv_data.cvLanguage = 'english'; // Fallback to English
      }
      console.log('CV language set to:', cv_data.cvLanguage);
    }
    
    // Validate cv_data structure
    if (typeof cv_data !== 'object' || cv_data === null) {
      console.error('Invalid cv_data format:', typeof cv_data);
      return NextResponse.json({ error: "cv_data must be an object" }, { status: 400 });
    }
    
    console.log('Creating CV with userId:', userId);
    
    // Check if user can create CV (daily limit)
    const cvLimitCheck = await canCreateCV(userId);
    if (!cvLimitCheck.allowed) {
      return NextResponse.json({ 
        error: cvLimitCheck.reason,
        errorCode: 'DAILY_LIMIT_EXCEEDED'
      }, { status: 403 });
    }
    
    // Extract templateId from cv_data for database field, default to 'basic'
    const templateId = (cv_data as any)?.templateId || 'basic';

    // Ensure cv_data also has templateId set to basic if not specified
    if (!(cv_data as any).templateId) {
      (cv_data as any).templateId = 'basic';
    }

    console.log('🎨 Template ID for new CV:', templateId);

    // Check template access if templateId is present
    if (templateId) {
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: { tier: true },
      });

      if (template) {
        const templateAccessCheck = await canUseTemplate(userId, template.tier);
        if (!templateAccessCheck.allowed) {
          return NextResponse.json({ 
            error: templateAccessCheck.reason,
            errorCode: 'TEMPLATE_ACCESS_DENIED'
          }, { status: 403 });
        }
      }
    }

    // Legacy template access validation (keeping for compatibility)
    const hasAccess = await validateTemplateAccess(userId, templateId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access to this template is denied." }, { status: 403 });
    }
    
    const cv = await prisma.cV.create({
      data: { 
        userId, 
        title, 
        cv_data,
        templateId // Both cv_data and database field have same templateId
      },
    });
    
    // Increment daily CV creation count
    await incrementDailyUsage(userId, 'cv');
    
    console.log('✅ CV created successfully with template:', templateId, 'CV ID:', cv.id);
    return NextResponse.json(cv, { status: 201 });
  } catch (error) {
    console.error('CV creation error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to create CV", 
        details: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
