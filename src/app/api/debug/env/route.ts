import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Only allow in development or with admin access
  const isDev = process.env.NODE_ENV === 'development';
  const adminKey = req.headers.get('x-admin-key');

  if (!isDev && adminKey !== 'debug-cvera-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    timestamp: new Date().toISOString(),
    production_mode: process.env.NODE_ENV === 'production',
    promo_system_status: 'Checking...'
  };

  try {
    // Test database connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const promoCount = await prisma.promoCode.count();
    envCheck.promo_system_status = `✅ ${promoCount} promo codes in database`;

    await prisma.$disconnect();
  } catch (error) {
    envCheck.promo_system_status = `❌ Database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }

  return NextResponse.json(envCheck);
}
