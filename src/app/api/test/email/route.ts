import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

const emailService = new EmailService();

export async function GET(req: NextRequest) {
  try {
    // Test email connection
    let connectionTest = false;
    let connectionError = null;
    
    try {
      connectionTest = await emailService.testConnection();
    } catch (error) {
      connectionError = error;
    }
    
    const config = {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'undefined',
      from_name: process.env.EMAIL_FROM_NAME,
      from_address: process.env.EMAIL_FROM_ADDRESS,
      base_url: process.env.NEXT_PUBLIC_BASE_URL
    };

    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        message: 'Email server connection failed',
        error: connectionError?.toString(),
        config: config
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email server connection successful',
      config: config
    });

  } catch (error: any) {
    console.error('Email test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Email test failed',
      error: error?.toString(),
      config: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'undefined',
        from_name: process.env.EMAIL_FROM_NAME,
        from_address: process.env.EMAIL_FROM_ADDRESS
      }
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email address required'
      }, { status: 400 });
    }

    // Send test email
    const result = await emailService.sendEmailVerification(
      email,
      'Test User',
      'test-token-12345'
    );

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Test email failed',
      result: result.success ? { messageId: result.messageId } : { error: result.error?.toString() }
    });

  } catch (error: any) {
    console.error('Test email send failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Test email send failed',
      error: error?.toString()
    }, { status: 500 });
  }
}