import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

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

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Giriş tələb olunur" }, { status: 401 });
    }

    // Get user's LinkedIn data from import sessions
    const linkedinSession = await prisma.importSession.findFirst({
      where: {
        userId,
        type: 'linkedin'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!linkedinSession) {
      return NextResponse.json({
        profile: null,
        message: "LinkedIn məlumatları tapılmadı"
      });
    }

    let profileData = null;
    try {
      profileData = JSON.parse(linkedinSession.data);
    } catch (error) {
      console.error('LinkedIn data parsing error:', error);
      return NextResponse.json({
        profile: null,
        message: "LinkedIn məlumatları oxuna bilmədi"
      });
    }

    // Extract relevant profile information
    const profile = {
      firstName: profileData.first_name || profileData.firstName || '',
      lastName: profileData.last_name || profileData.lastName || '',
      emailAddress: profileData.email || profileData.emailAddress || '',
      summary: profileData.summary || profileData.headline || '',
      location: {
        name: profileData.location || profileData.geo_location || ''
      },
      phoneNumbers: profileData.phone_numbers || [],
      headline: profileData.headline || '',
      industry: profileData.industry || '',
      // Additional fields that might be useful
      experience: profileData.experience || [],
      education: profileData.education || [],
      skills: profileData.skills || []
    };

    console.log('📤 LinkedIn məlumatları göndərildi:', {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.emailAddress
    });

    return NextResponse.json({
      profile,
      lastImport: linkedinSession.createdAt,
      message: "LinkedIn məlumatları uğurla yükləndi"
    });

  } catch (error) {
    console.error('LinkedIn data fetch error:', error);
    return NextResponse.json(
      { error: "LinkedIn məlumatları yüklənərkən xəta baş verdi" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
