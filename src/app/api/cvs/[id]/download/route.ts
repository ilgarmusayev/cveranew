import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyJWT } from "@/lib/jwt";
import { FileGenerationService } from "@/lib/fileGeneration";
import { CVData } from "@/types/cv";
import { v4 as uuidv4 } from "uuid";
import { canExportFormat, incrementDailyUsage } from "@/lib/subscription-limits";

const prisma = new PrismaClient();

// POST /api/cvs/[id]/download - Initiates the file generation job
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Yanlış token' },
        { status: 401 }
      );
    }

    const { format } = await req.json();
    if (!format || !["pdf", "docx"].includes(format)) {
      return NextResponse.json({ error: "Invalid format. Use 'pdf' or 'docx'" }, { status: 400 });
    }

    // Check if user can export in this format
    const formatCheck = await canExportFormat(decoded.userId, format as 'pdf' | 'docx');
    if (!formatCheck.allowed) {
      return NextResponse.json({ 
        error: formatCheck.reason,
        errorCode: 'FORMAT_ACCESS_DENIED'
      }, { status: 403 });
    }

    // Verify CV ownership
    const cv = await prisma.cV.findUnique({
      where: { id, userId: decoded.userId },
    });

    if (!cv) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    // Create file generation job
    const job = await prisma.fileGenerationJob.create({
      data: {
        id: uuidv4(),
        cvId: id,
        format,
        status: "pending",
      },
    });

    // Generate file
    try {
      const cvData = cv.cv_data as unknown as CVData;
      console.log('Generating file for CV:', cv.id, 'format:', format);
      
      const fileBuffer = await FileGenerationService.generateFile({
        format: format as 'pdf' | 'docx',
        cvData,
        templateId: cv.templateId || undefined, // Template ID əlavə edildi
      });

      console.log('File buffer generated, size:', fileBuffer?.length || 0);

      // Validate fileBuffer
      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('Empty file buffer generated');
      }

      // Update job status to done (without storing the file content)
      await prisma.fileGenerationJob.update({
        where: { id: job.id },
        data: {
          status: 'done',
        },
      });

      // Increment daily export count
      await incrementDailyUsage(decoded.userId, format as 'pdf' | 'docx');

      const mimeType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Sanitize filename to avoid non-ASCII characters in headers
      const sanitizedTitle = cv.title
        .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters except spaces, hyphens, underscores
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
        
      const filename = `${sanitizedTitle || 'cv'}.${format}`;

      console.log('Sanitized filename:', filename);

      // Create stream response for better memory handling
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(fileBuffer));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error('File generation error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        cvId: cv?.id,
        format,
        templateId: cv?.templateId
      });
      
      // Update job status to failed
      if (job?.id) {
        try {
          await prisma.fileGenerationJob.update({
            where: { id: job.id },
            data: { status: 'failed' },
          });
        } catch (updateError) {
          console.error('Failed to update job status:', updateError);
        }
      }

      return NextResponse.json(
        { 
          message: 'Fayl yaradılarkən xəta baş verdi',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Download CV error:", error);
    return NextResponse.json(
      { message: 'Daxili server xətası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET /api/cvs/[id]/download - For future use, currently behaves like POST
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Future implementation for GET if needed

    return NextResponse.json(
      { message: 'GET method not implemented for file download' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Download CV error:', error);
    return NextResponse.json(
      { message: 'Daxili server xətası' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
