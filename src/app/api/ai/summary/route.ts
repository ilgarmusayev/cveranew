import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { generateProfessionalSummary, canUseAIFeatures, CVDataForSummary } from "@/lib/aiSummary";

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

export async function POST(req: NextRequest) {
  try {
    console.log('🤖 AI Summary API çağırıldı');
    
    // Get user ID from token
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Giriş tələb olunur - Token lazımdır" },
        { status: 401 }
      );
    }

    // Get user and check subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        tier: true,
        name: true 
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "İstifadəçi tapılmadı" },
        { status: 404 }
      );
    }

    console.log(`👤 User: ${user.email}, Tier: ${user.tier}`);

    // Check if user has access to AI features
    if (!canUseAIFeatures(user.tier)) {
      return NextResponse.json(
        { 
          error: "AI features are only available for Premium and Medium users",
          message: "AI professional summary Premium və Medium istifadəçilər üçün mövcuddur. Planınızı yüksəldin!",
          tier: user.tier,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Parse CV data from request body
    const body = await req.json();
    const cvData: CVDataForSummary = body.cvData;

    if (!cvData || !cvData.personalInfo) {
      return NextResponse.json(
        { error: "Invalid CV data provided" },
        { status: 400 }
      );
    }

    console.log('📋 CV data alındı:', {
      name: cvData.personalInfo.fullName,
      hasExperience: !!cvData.experience?.length,
      hasEducation: !!cvData.education?.length,
      hasSkills: !!cvData.skills?.length
    });

    // ❌ Skills olmayan CV-lər üçün AI summary yaradılmamalıdır
    const hasSkills = cvData.skills && Array.isArray(cvData.skills) && cvData.skills.length > 0;
    
    if (!hasSkills) {
      console.log('⚠️ Skills olmayan CV üçün AI summary yaradılmadı');
      return NextResponse.json({
        error: 'Bacarıq əlavə edin',
        errorEn: 'Please add skills first',
        requiresSkills: true
      }, { status: 400 });
    }

    // Generate AI-powered professional summary with language detection
    console.log('🧠 AI Summary yaradılır, CV data:', cvData, `(Skills: ${cvData.skills?.length || 0})`);
    const summary = await generateProfessionalSummary(cvData);    if (!summary) {
      return NextResponse.json(
        { error: "Failed to generate summary" },
        { status: 500 }
      );
    }

    // Log usage for analytics
    console.log(`✅ AI Summary yaradıldı: ${user.email} (${user.tier})`);

    return NextResponse.json({
      success: true,
      summary: summary,
      message: "Professional summary AI ilə yaradıldı!",
      user: {
        tier: user.tier,
        canUseAI: true
      }
    });

  } catch (error) {
    console.error('AI Summary API error:', error);
    return NextResponse.json(
      {
        error: "Daxili server xətası",
        details: error instanceof Error ? error.message : "Naməlum xəta"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check AI feature availability
export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, email: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const canUseAI = canUseAIFeatures(user.tier);
    
    return NextResponse.json({
      canUseAI,
      tier: user.tier,
      message: canUseAI 
        ? "AI professional summary mövcuddur!" 
        : "AI professional summary Premium istifadəçilər üçün mövcuddur. Planınızı yüksəldin!"
    });

  } catch (error) {
    console.error('❌ AI Feature Check error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
