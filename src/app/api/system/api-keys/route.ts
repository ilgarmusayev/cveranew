import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-auth";

const prisma = new PrismaClient();

// API Keys configuration (since we don't have apiKey model in database)
const API_KEYS_CONFIG = {
  linkedin: [
    {
      id: 'scrapingdog-primary',
      service: 'linkedin',
      key: '6882894b855f5678d36484c8',
      provider: 'ScrapingDog',
      active: true,
      priority: 1,
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ]
};

// GET /api/system/api-keys - Get all API keys
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "linkedin";

    // Return hardcoded API keys instead of database query
    const apiKeys = API_KEYS_CONFIG[service as keyof typeof API_KEYS_CONFIG] || [];

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "API açarları götürülmədi" },
      { status: 500 }
    );
  }
}

// POST /api/system/api-keys - Add new API key (placeholder for future implementation)
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { service, key, provider, priority = 1 } = body;

    if (!service || !key || !provider) {
      return NextResponse.json({
        error: 'Servis, açar və təminatçı tələb olunur'
      }, { status: 400 });
    }

    // For now, return success message since we're using static configuration
    // In the future, this could save to database if apiKey model is added
    return NextResponse.json({
      message: 'API açar konfiqurasiyası qeyd edildi. Hazırda statik konfiqurasiya istifadə olunur.',
      key: {
        id: `${provider.toLowerCase()}-${Date.now()}`,
        service,
        provider,
        priority,
        active: true,
        key: key.substring(0, 20) + "...", // Masked for security
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error("Admin API key add error:", error);
    return NextResponse.json({ error: "Daxili server xətası" }, { status: 500 });
  }
}
