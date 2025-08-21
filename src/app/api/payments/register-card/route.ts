import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Card registration functionality not yet implemented' 
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('Card registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}