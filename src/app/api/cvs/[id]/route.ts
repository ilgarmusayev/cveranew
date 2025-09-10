import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { isValidCVLanguage } from "@/lib/cvLanguage";

const prisma = new PrismaClient();
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

// Check if user has permission to delete CVs (Premium only)
async function canDeleteCV(userId: string): Promise<boolean> {
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

  const userTier = user?.subscriptions[0]?.tier || user?.tier || "Free";
  return userTier.toLowerCase() === "premium";
}

// GET /api/cvs/[id] - Get a single CV's data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log('Fetching CV with ID:', id, 'for userId:', userId);
    const cv = await prisma.cV.findUnique({ where: { id, userId } });
    
    if (!cv) {
      console.log('CV not found:', id);
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }
    
    console.log('CV fetched successfully:', {
      id: cv.id,
      title: cv.title,
      templateId: cv.templateId, // Database template ID
      hasData: !!cv.cv_data,
      dataKeys: cv.cv_data ? Object.keys(cv.cv_data as Record<string, unknown>) : []
    });
    
    // Validate cv_data structure
    if (!cv.cv_data || typeof cv.cv_data !== 'object') {
      console.error('Invalid cv_data in database:', typeof cv.cv_data);
      return NextResponse.json({ 
        error: "CV data is corrupted",
        details: "cv_data is not a valid object"
      }, { status: 500 });
    }

    // Ensure cv_data has templateId synchronized with database
    const cvData = cv.cv_data as any;
    if (!cvData.templateId || cvData.templateId !== cv.templateId) {
      console.log('🔄 Synchronizing template ID in cv_data:', {
        dbTemplateId: cv.templateId,
        cvDataTemplateId: cvData.templateId
      });

      // Update cv_data with correct templateId from database
      cvData.templateId = cv.templateId || 'basic';

      // Update database to ensure synchronization
      await prisma.cV.update({
        where: { id, userId },
        data: { cv_data: cvData }
      });

      console.log('✅ Template ID synchronized:', cvData.templateId);
    }

    console.log('📤 Returning CV with template:', cvData.templateId);

    return NextResponse.json({
      ...cv,
      cv_data: cvData
    });
  } catch (error) {
    console.error('CV fetch error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to fetch CV", 
        details: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/cvs/[id] - Update CV data
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    console.log('🔍 CV UPDATE DEBUG - Request Body:', JSON.stringify(body, null, 2));

    const { title, cv_data } = body;
    
    if (!title || !cv_data) {
      console.error('Missing required fields for update:', { title: !!title, cv_data: !!cv_data });
      return NextResponse.json({ error: "Title and cv_data required." }, { status: 400 });
    }
    
    // Validate cv_data structure
    if (typeof cv_data !== 'object' || cv_data === null) {
      console.error('Invalid cv_data format for update:', typeof cv_data);
      return NextResponse.json({ error: "cv_data must be an object" }, { status: 400 });
    }

    // Validate and set CV language if specified
    if (cv_data.cvLanguage && !isValidCVLanguage(cv_data.cvLanguage)) {
      console.error('Invalid CV language:', cv_data.cvLanguage);
      return NextResponse.json({ error: "Invalid CV language. Must be 'azerbaijani' or 'english'" }, { status: 400 });
    }
    
    console.log('CV language for update:', cv_data.cvLanguage || 'not specified');
    
    console.log('Updating CV with ID:', id, 'userId:', userId);
    
    // Extract templateId from cv_data for database field
    const requestTemplateId = (cv_data as any)?.templateId;
    console.log('🎨 Template ID from request:', requestTemplateId);

    // Get current CV to compare
    const currentCV = await prisma.cV.findUnique({
      where: { id, userId },
      select: { templateId: true, cv_data: true }
    });

    if (!currentCV) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    console.log('🎨 Current CV template:', currentCV.templateId);

    // Determine final template ID
    let finalTemplateId = requestTemplateId;
    if (!requestTemplateId) {
      finalTemplateId = currentCV.templateId || 'basic';
      console.log('⚠️ No template ID in request, using existing:', finalTemplateId);
    } else {
      console.log('✅ Using template ID from request:', finalTemplateId);
    }

    // Validate template access
    if (finalTemplateId && !(await validateTemplateAccess(userId, finalTemplateId))) {
      return NextResponse.json({
        error: "Template access denied. Please upgrade your subscription." 
      }, { status: 403 });
    }
    
    // Ensure templateId is consistent in both cv_data and database field
    (cv_data as any).templateId = finalTemplateId;

    console.log('💾 SAVING WITH TEMPLATE:', finalTemplateId);
    console.log('💾 cv_data templateId set to:', (cv_data as any).templateId);

    const cv = await prisma.cV.update({
      where: { id, userId },
      data: { 
        title, 
        cv_data: {
          // Merge existing CV data with new data to preserve additional sections
          ...currentCV.cv_data as any,
          ...cv_data,
          // Specially handle additional sections to ensure they're preserved
          additionalSections: {
            ...(currentCV.cv_data as any)?.additionalSections,
            ...(cv_data as any)?.additionalSections
          }
        },
        templateId: finalTemplateId // Database field updated with final templateId
      },
    });
    
    console.log('✅ CV updated successfully with merged data!');
    console.log('✅ Database templateId:', cv.templateId);
    console.log('✅ cv_data templateId:', (cv.cv_data as any)?.templateId);
    console.log('✅ Additional sections preserved:', !!(cv.cv_data as any)?.additionalSections && Object.keys((cv.cv_data as any).additionalSections).length > 0);

    // Verify the save worked
    const verifyCV = await prisma.cV.findUnique({
      where: { id, userId },
      select: { templateId: true, cv_data: true }
    });

    console.log('🔍 VERIFICATION AFTER SAVE:');
    console.log('  Database templateId:', verifyCV?.templateId);
    console.log('  cv_data templateId:', (verifyCV?.cv_data as any)?.templateId);

    if (verifyCV?.templateId === (verifyCV?.cv_data as any)?.templateId) {
      console.log('✅ VERIFICATION SUCCESS: Templates are synchronized!');
    } else {
      console.log('❌ VERIFICATION FAILED: Templates are NOT synchronized!');
    }

    return NextResponse.json(cv);
  } catch (error) {
    console.error('CV update error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: "Failed to update CV", 
        details: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/cvs/[id] - Delete a CV
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete CVs (Premium only)
    const hasDeletePermission = await canDeleteCV(userId);
    if (!hasDeletePermission) {
      return NextResponse.json({ 
        error: "CV silmə funksiyası yalnız Premium istifadəçilər üçün mövcuddur.",
        code: "PREMIUM_FEATURE_REQUIRED"
      }, { status: 403 });
    }

    // Check if CV exists and belongs to user
    const existingCV = await prisma.cV.findFirst({
      where: { id, userId }
    });

    if (!existingCV) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    console.log('Deleting CV and related records:', id);

    // Use transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete FileGenerationJob records first
      await tx.fileGenerationJob.deleteMany({
        where: { cvId: id }
      });

      // Delete the CV
      await tx.cV.delete({ 
        where: { id, userId } 
      });
    });

    console.log('CV deleted successfully:', id);
    return NextResponse.json({ message: "CV deleted successfully" });
    
  } catch (error) {
    console.error('CV deletion error:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      return NextResponse.json({ 
        error: "Failed to delete CV", 
        details: error.message 
      }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
