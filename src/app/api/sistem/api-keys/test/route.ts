import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Test API key with user's exact code sample
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
    const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'fallback_secret_key';

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_ADMIN_SECRET) as any;
    } catch {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    }

    if (!(decoded.role === 'admin' || decoded.role === 'ADMIN' || decoded.role === 'SUPER_ADMIN' || decoded.isAdmin || decoded.adminId)) {
      return NextResponse.json({ error: 'Admin icazəniz yoxdur' }, { status: 403 });
    }

    const { apiKey, service } = await request.json();

    if (!apiKey || !service) {
      return NextResponse.json({
        success: false,
        error: 'API key və service tələb olunur'
      }, { status: 400 });
    }

    // Test ScrapingDog API with user's exact code style
    if (service === 'scrapingdog') {
      const axios = require('axios');

      const api_key = apiKey; // User's API key
      const url = 'https://api.scrapingdog.com/linkedin';

      const params = {
        api_key: api_key,
        type: 'profile',
        linkId: 'musayevcreate',
        premium: 'false',
      };

      try {
        // First check account status like user's code structure
        console.log('🔄 Testing API key with user code style...');

        const accountResponse = await axios.get('https://api.scrapingdog.com/account', {
          params: { api_key: api_key },
          timeout: 10000
        });

        const accountData = accountResponse.data;
        const remaining = accountData.requestLimit - accountData.requestUsed;

        console.log('📊 Account status for key:', api_key.substring(0, 8) + '***');
        console.log('- Request Limit:', accountData.requestLimit);
        console.log('- Request Used:', accountData.requestUsed);
        console.log('- Remaining:', remaining);

        if (remaining <= 0) {
          return NextResponse.json({
            success: false,
            error: `API limit tükənib! Used: ${accountData.requestUsed}/${accountData.requestLimit}`,
            details: {
              used: accountData.requestUsed,
              limit: accountData.requestLimit,
              remaining: remaining,
              pack: accountData.pack,
              message: 'Yeni API key almalısınız'
            }
          });
        }

        // Test LinkedIn API call exactly like user's code
        const response = await axios
          .get(url, { params: params })
          .then(function (response: any) {
            if (response.status === 200) {
              const data = response.data;
              return {
                success: true,
                status: response.status,
                data: data,
                message: 'ScrapingDog API test successful'
              };
            } else {
              return {
                success: false,
                status: response.status,
                message: 'Request failed with status code: ' + response.status
              };
            }
          })
          .catch(function (error: any) {
            console.error('Error making the request: ' + error.message);
            return {
              success: false,
              error: error.message,
              status: error.response?.status || 'unknown'
            };
          });

        if (response.success) {
          return NextResponse.json({
            success: true,
            message: '✅ API key düzgün işləyir!',
            details: {
              status: response.status,
              remaining: remaining,
              pack: accountData.pack,
              profileDataReceived: !!response.data,
              dataFields: response.dataKeys,
              testProfile: 'musayevcreate'
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: response.error || response.message,
            details: response.details || { status: response.status }
          });
        }

      } catch (error: any) {
        console.error('❌ API test failed:', error.message);

        return NextResponse.json({
          success: false,
          error: error.message || 'Test uğursuz',
          details: {
            code: error.code,
            status: error.response?.status,
            note: 'User kod style ilə test edildi'
          }
        });
      }
    }

    // Test other services (placeholder)
    return NextResponse.json({
      success: false,
      error: `${service} service test hələ dəstəklənmir`
    });

  } catch (error) {
    console.error('API test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server xətası'
    }, { status: 500 });
  }
}
