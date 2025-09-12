import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const dbResponseTime = Date.now() - startTime;
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXT_PUBLIC_APP_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // System information
    const healthData: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'connected',
        responseTime: `${dbResponseTime}ms`,
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      configuration: {
        missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null,
      },
      features: {
        linkedinImport: process.env.FEATURE_LINKEDIN_IMPORT === 'true',
        premiumTemplates: process.env.FEATURE_PREMIUM_TEMPLATES === 'true',
        pdfExport: process.env.FEATURE_PDF_EXPORT === 'true',
        docxExport: process.env.FEATURE_DOCX_EXPORT === 'true',
      },
    };
    
    // Warning conditions
    const warnings = [];
    
    if (dbResponseTime > 1000) {
      warnings.push('Database response time is slow');
    }
    
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      warnings.push('High memory usage detected');
    }
    
    if (missingEnvVars.length > 0) {
      warnings.push(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    if (warnings.length > 0) {
      healthData.warnings = warnings;
    }
    
    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
    };
    
    return NextResponse.json(errorData, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Also support HEAD requests for load balancer health checks
export async function HEAD(request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}
