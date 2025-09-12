import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

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

// GET /api/jobs/[jobId]/result - Download the generated file
export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const job = await prisma.fileGenerationJob.findUnique({
      where: { id: jobId },
      include: {
        cv: {
          select: { userId: true, title: true },
        },
      },
    });

    if (!job || job.cv.userId !== userId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "done" || !job.fileUrl) {
      return NextResponse.json({ error: "File not ready" }, { status: 400 });
    }

    try {
      const filePath = path.join(
        process.env.TEMP_FILE_DIR || "/tmp/cvera-files",
        job.fileUrl
      );
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = `${job.cv.title}.${job.format}`;

      const contentType =
        job.format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } catch (error) {
      console.error("File download error:", error);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error getting job result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
