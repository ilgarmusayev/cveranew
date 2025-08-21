import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Simple heartbeat - just check if payment system is configured
    const isConfigured = !!(process.env.EPOINT_PUBLIC_KEY && process.env.EPOINT_PRIVATE_KEY);
    
    return NextResponse.json({
      success: true,
      status: isConfigured ? 'configured' : 'not_configured',
      message: isConfigured ? 'Payment system is configured' : 'Payment system needs configuration',
      timestamp: new Date().toISOString(),
      development_mode: process.env.EPOINT_DEVELOPMENT_MODE === 'true'
    });

  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Heartbeat yoxlanarkən xəta',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
