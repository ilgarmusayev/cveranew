import { NextRequest, NextResponse } from 'next/server';
import { BrightDataLinkedInService } from '@/lib/services/brightdata-linkedin';
import { getBrightDataApiKey } from '@/lib/api-service';

// Test endpoint for BrightData API
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 BrightData Test Endpoint');

    // Test API key
    const apiKey = await getBrightDataApiKey();
    console.log('🔑 API Key status:', apiKey ? 'Found' : 'Not found');
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'No BrightData API key found',
        message: 'Please add a BrightData API key in admin panel'
      }, { status: 400 });
    }

    // Test service initialization
    const brightDataService = new BrightDataLinkedInService();
    console.log('🎯 BrightData Service created');

    // Test simple call (without actual scraping)
    return NextResponse.json({
      success: true,
      message: 'BrightData service test successful',
      data: {
        apiKeyExists: !!apiKey,
        serviceInitialized: true,
        testEndpoint: 'Working'
      }
    });

  } catch (error) {
    console.error('❌ BrightData test error:', error);
    
    return NextResponse.json({
      error: 'BrightData test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Test with actual LinkedIn URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testUrl } = body;

    console.log('🧪 BrightData Full Test with URL:', testUrl);

    const brightDataService = new BrightDataLinkedInService();
    
    // Test actual scraping
    const result = await brightDataService.scrapeLinkedInProfile(testUrl || 'https://linkedin.com/in/musayevcreate');
    
    return NextResponse.json({
      success: true,
      message: 'BrightData scraping test successful',
      data: {
        resultExists: !!result,
        resultKeys: result ? Object.keys(result) : [],
        sampleData: result ? JSON.stringify(result).substring(0, 500) : null
      }
    });

  } catch (error) {
    console.error('❌ BrightData scraping test error:', error);
    
    return NextResponse.json({
      error: 'BrightData scraping test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}