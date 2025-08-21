import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// BrightData API configuration (replacing ScrapingDog)
const BRIGHTDATA_CONFIG = {
  api_key: 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae',
  url: 'https://api.brightdata.com/dca/dataset/get_snapshot',
  zone: 'linkedin_public_data'
};

// Extract LinkedIn ID from various URL formats
function extractLinkIdFromUrl(linkedinUrl: string): string {
  if (!linkedinUrl) {
    throw new Error('LinkedIn URL tələb olunur');
  }

  const cleanUrl = linkedinUrl.trim();

  // If it's already just a username/ID (no URL), return it
  if (!cleanUrl.includes('/') && !cleanUrl.includes('linkedin.com')) {
    return cleanUrl;
  }

  // Handle various LinkedIn URL formats
  const patterns = [
    /linkedin\.com\/in\/([^\/\?&#]+)/i,
    /linkedin\.com\/pub\/([^\/\?&#]+)/i,
    /linkedin\.com\/profile\/view\?id=([^&]+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error('LinkedIn URL formatı düzgün deyil');
}

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl, premium = false } = await request.json();

    if (!linkedinUrl) {
      return NextResponse.json(
        { error: 'LinkedIn URL tələb olunur' },
        { status: 400 }
      );
    }

    // LinkedIn URL-dən istifadəçi ID-sini çıxar
    let linkId: string;
    try {
      linkId = extractLinkIdFromUrl(linkedinUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'LinkedIn URL formatı düzgün deyil' },
        { status: 400 }
      );
    }

    console.log(`🔍 LinkedIn profil scraping with BrightData: ${linkId}`);

    // BrightData API call
    const headers = {
      'Authorization': `Bearer ${BRIGHTDATA_CONFIG.api_key}`,
      'Content-Type': 'application/json'
    };

    const requestBody = {
      dataset_id: BRIGHTDATA_CONFIG.zone,
      format: 'json',
      filters: {
        profile_url: `https://linkedin.com/in/${linkId}`
      },
      exclude_fields: ['skills', 'endorsements', 'skill_assessments'] // Exclude skills as requested
    };

    const response = await axios.post(BRIGHTDATA_CONFIG.url, requestBody, {
      headers: headers,
      timeout: 30000
    });

    if (response.status !== 200) {
      console.log('BrightData request failed with status code: ' + response.status);
      return NextResponse.json(
        { error: `API xətası: Status ${response.status}` },
        { status: response.status }
      );
    }

    const data = response.data;
    console.log('✅ LinkedIn profil uğurla əldə edildi (BrightData):', data.name || 'Unknown');

    return NextResponse.json({
      success: true,
      data: data,
      message: 'LinkedIn profil uğurla scrape edildi (BrightData)',
      provider: 'BrightData'
    });

  } catch (error) {
    console.error('❌ BrightData LinkedIn scraper xətası:', error);

    let errorMessage = 'LinkedIn scraping zamanı xəta baş verdi (BrightData)';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test BrightData API connection
    const headers = {
      'Authorization': `Bearer ${BRIGHTDATA_CONFIG.api_key}`,
      'Content-Type': 'application/json'
    };

    const requestBody = {
      dataset_id: BRIGHTDATA_CONFIG.zone,
      format: 'json',
      filters: {
        profile_url: 'https://linkedin.com/in/musayevcreate'
      },
      exclude_fields: ['skills', 'endorsements', 'skill_assessments'],
      limit: 1
    };

    const response = await axios.post(BRIGHTDATA_CONFIG.url, requestBody, {
      headers: headers,
      timeout: 10000
    });

    const isWorking = response.status === 200;

    return NextResponse.json({
      status: 'online',
      linkedin_api: isWorking ? 'working' : 'error',
      timestamp: new Date().toISOString(),
      message: 'LinkedIn scraper API hazırdır (BrightData)',
      api_provider: 'BrightData'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'LinkedIn scraper API xətası (BrightData)',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
