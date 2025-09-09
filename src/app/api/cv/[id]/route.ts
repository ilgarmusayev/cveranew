import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/cv/[id] - Spesifik CV-ni əldə et
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const cv = await prisma.cV.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV tapılmadı' },
        { status: 404 }
      );
    }

    // Return CV data in the expected format
    const cvResponse = {
      id: cv.id,
      title: cv.title,
      templateId: cv.templateId,
      data: cv.cv_data, // cv_data contains the actual CV content
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt
    };

    console.log('📤 Returning CV data:', {
      id: cvResponse.id,
      title: cvResponse.title,
      personalInfo: (cvResponse.data as any)?.personalInfo
    });
    return NextResponse.json(cvResponse);

  } catch (error) {
    console.error('CV fetch error:', error);
    return NextResponse.json(
      { error: 'CV yüklənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// PUT /api/cv/[id] - CV-ni yenilə
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const { title, cv_data, templateId } = await request.json();
    
    console.log('🔍 PUT request received:', {
      cvId: id,
      title,
      templateId,
      personalInfo: cv_data?.personalInfo,
      hasData: !!cv_data
    });

    // CV-nin mövcudluğunu və sahibliyini yoxla
    const existingCV = await prisma.cV.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    });

    if (!existingCV) {
      return NextResponse.json(
        { error: 'CV tapılmadı və ya sizə məxsus deyil' },
        { status: 404 }
      );
    }

    const updatedCV = await prisma.cV.update({
      where: { id: id },
      data: {
        title: title || existingCV.title,
        cv_data: cv_data ? {
          // Use the enhanced merge function to preserve translation format
          ...existingCV.cv_data as any,
          ...cv_data,
          // CRITICAL: Preserve translation metadata and language settings
          cvLanguage: cv_data.cvLanguage || (existingCV.cv_data as any)?.cvLanguage,
          translationMetadata: cv_data.translationMetadata || (existingCV.cv_data as any)?.translationMetadata,
          // Preserve section names in the current language - this prevents reverting
          sectionNames: cv_data.sectionNames ? {
            ...(existingCV.cv_data as any)?.sectionNames,
            ...cv_data.sectionNames
          } : (existingCV.cv_data as any)?.sectionNames,
          // Preserve section order if it exists
          sectionOrder: cv_data.sectionOrder || (existingCV.cv_data as any)?.sectionOrder,
          // Specially handle additional sections to ensure they're preserved
          additionalSections: {
            ...(existingCV.cv_data as any)?.additionalSections,
            ...cv_data.additionalSections
          },
          // Preserve all main sections with their translated content
          personalInfo: cv_data.personalInfo ? {
            ...(existingCV.cv_data as any)?.personalInfo,
            ...cv_data.personalInfo
          } : (existingCV.cv_data as any)?.personalInfo,
          experience: cv_data.experience || (existingCV.cv_data as any)?.experience || [],
          education: cv_data.education || (existingCV.cv_data as any)?.education || [],
          skills: cv_data.skills || (existingCV.cv_data as any)?.skills || [],
          projects: cv_data.projects || (existingCV.cv_data as any)?.projects || [],
          certifications: cv_data.certifications || (existingCV.cv_data as any)?.certifications || [],
          languages: cv_data.languages || (existingCV.cv_data as any)?.languages || [],
          volunteerExperience: cv_data.volunteerExperience || (existingCV.cv_data as any)?.volunteerExperience || [],
          publications: cv_data.publications || (existingCV.cv_data as any)?.publications || [],
          honorsAwards: cv_data.honorsAwards || (existingCV.cv_data as any)?.honorsAwards || []
        } : existingCV.cv_data,
        templateId: templateId || existingCV.templateId,
        updatedAt: new Date()
      }
    });

    console.log('✅ CV updated successfully:', {
      cvId: id,
      title: updatedCV.title,
      language: (updatedCV.cv_data as any)?.cvLanguage,
      hasTranslationMetadata: !!(updatedCV.cv_data as any)?.translationMetadata,
      hasAdditionalSections: !!(updatedCV.cv_data as any)?.additionalSections && Object.keys((updatedCV.cv_data as any).additionalSections).length > 0
    });

    // Return the updated CV in the same format as GET
    const cvResponse = {
      id: updatedCV.id,
      title: updatedCV.title,
      templateId: updatedCV.templateId,
      data: updatedCV.cv_data,
      createdAt: updatedCV.createdAt,
      updatedAt: updatedCV.updatedAt
    };

    return NextResponse.json(cvResponse);

  } catch (error) {
    console.error('CV update error:', error);
    return NextResponse.json(
      { error: 'CV yenilənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// DELETE /api/cv/[id] - CV-ni sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // CV-nin mövcudluğunu və sahibliyini yoxla
    const existingCV = await prisma.cV.findFirst({
      where: {
        id: id,
        userId: decoded.userId
      }
    });

    if (!existingCV) {
      return NextResponse.json(
        { error: 'CV tapılmadı və ya sizə məxsus deyil' },
        { status: 404 }
      );
    }

    await prisma.cV.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'CV uğurla silindi'
    });

  } catch (error) {
    console.error('CV delete error:', error);
    return NextResponse.json(
      { error: 'CV silinərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}
