import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

interface DecodedToken {
    userId: string;
    email: string;
    tier: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    console.log('=== SIMPLE PDF Export API başladı ===');
    
    let browser: any;
    
    try {
        const { id } = await params;
        const cvId = id;
        console.log('Simple PDF Export başladı - CV ID:', cvId);
        
        // JWT token doğrulama
        const authHeader = request.headers.get('authorization');
        console.log('Auth header:', authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'YOX');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Token xətası: Authorization header yoxdur');
            return NextResponse.json(
                { error: 'Token tələb olunur' }, 
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        let decodedToken: DecodedToken;

        try {
            decodedToken = verify(token, JWT_SECRET) as DecodedToken;
            console.log('Token doğrulandı - User ID:', decodedToken.userId);
        } catch (jwtError) {
            console.log('JWT xətası:', jwtError);
            return NextResponse.json(
                { error: 'Keçərsiz token' }, 
                { status: 401 }
            );
        }

        // CV data çəkmək
        console.log('CV data yüklənir...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cv/${cvId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('CV data xətası:', response.status);
            return NextResponse.json(
                { error: 'CV tapılmadı' }, 
                { status: 404 }
            );
        }

        const cvData = await response.json();
        console.log('CV data alındı:', cvData.name);

        // Front-end data-sı alırıq
        const requestBody = await request.json();
        const { htmlContent, cssContent, fontSettings, templateId } = requestBody;

        console.log('Request body data:');
        console.log('- htmlContent length:', htmlContent?.length || 'YOX');
        console.log('- cssContent length:', cssContent?.length || 'YOX');
        console.log('- fontSettings:', fontSettings ? 'VAR' : 'YOX');
        console.log('- templateId:', templateId || 'YOX');

        // Browser yaratmaq
        browser = await createBrowser();
        console.log('Browser yaradıldı');
        
        // PDF yaratmaq
        const pdfBuffer = await generateSimplePDF(browser, cvData, templateId, fontSettings, htmlContent, cssContent, cvId);
        console.log('PDF yaradıldı, ölçü:', pdfBuffer.length, 'bytes');

        // PDF qaytarmaq
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="CV_${cvData.name || 'document'}.pdf"`
            }
        });

    } catch (error) {
        console.error('Simple Export xətası:', error);
        return NextResponse.json(
            { error: 'PDF yaradıla bilmədi' },
            { status: 500 }
        );
    } finally {
        if (browser) {
            console.log('Browser bağlanır...');
            await browser.close();
        }
    }
}

async function createBrowser() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    const isServerless = isVercel || process.env.AWS_LAMBDA_FUNCTION_NAME;
    const isLocal = !isProduction && !isServerless;

    let executablePath: string | undefined;
    let browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
        '--enable-features=NetworkService,NetworkServiceLogging',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--disable-default-apps',
        '--mute-audio',
        '--disable-web-security',
        '--disable-features=TranslateUI',
        '--disable-component-extensions-with-background-pages',
        '--single-process',
        '--accept-lang=az-AZ,az,en-US,en'
    ];

    if (isLocal) {
        // Local development
        executablePath = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH;
        console.log('Local environment detected, executablePath:', executablePath);
    } else {
        // Production serverless - use @sparticuz/chromium
        try {
            executablePath = await chromium.executablePath();
            browserArgs = [...browserArgs, ...chromium.args];
            console.log('Serverless Chromium path obtained:', executablePath);
        } catch (error) {
            console.error('Error getting serverless Chromium path:', error);
            throw new Error('Serverless Chromium could not be loaded');
        }
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: browserArgs,
            executablePath: executablePath
        });
        console.log('Browser başladıldı successfully');
        return browser;
    } catch (browserError) {
        console.error('Browser launch error:', browserError);
        throw new Error('Browser başlada bilmədi');
    }
}

async function generateSimplePDF(browser: any, cvData: any, templateId: string, fontSettings: any, htmlContent: string, cssContent: string, cvId: string) {
    console.log('=== SIMPLE PDF Generation başladı ===');
    
    try {
        console.log('Browser açılır, səhifə yaradılır...');
        const page = await browser.newPage();

        // A4 page ayarları
        await page.setViewport({ 
            width: 794,   // 210mm at 96 DPI
            height: 1123, // 297mm at 96 DPI
            deviceScaleFactor: 1
        });

        // HTML yaratmaq
        console.log('HTML generasiya edilir...');
        const html = `
            <!DOCTYPE html>
            <html lang="az">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>CV Export</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                        font-family: 'Inter', sans-serif !important;
                    }
                    
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    body {
                        line-height: 1.4;
                        color: #333;
                        background: white;
                    }
                    
                    /* SIMPLE PAGINATION - Content just flows naturally */
                    .cv-section {
                        margin-bottom: 20px;
                        page-break-inside: auto;
                    }
                    
                    h1, h2, h3 {
                        margin-bottom: 10px;
                        page-break-after: avoid;
                    }
                    
                    h1 { font-size: 24px; font-weight: 700; }
                    h2 { font-size: 18px; font-weight: 600; }
                    h3 { font-size: 16px; font-weight: 500; }
                    p { font-size: 14px; margin-bottom: 8px; }
                    
                    ${cssContent || ''}
                </style>
            </head>
            <body>
                ${htmlContent || '<div>Test content</div>'}
            </body>
            </html>
        `;

        console.log('HTML səhifəyə yüklənir...');
        await page.setContent(html, { 
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000 
        });

        console.log('🌟 REAL PAGINATION TEST - No restrictions, natural flow');
        
        // 📄 REAL PAGINATION - Remove ALL restrictions
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            // 🔥 NO PAGE RESTRICTIONS AT ALL - Let content flow to multiple pages naturally
            // pageRanges: REMOVED completely
            margin: {
                top: '15mm',
                right: '15mm',
                bottom: '15mm',
                left: '15mm'
            },
            scale: 1.0,
            timeout: 60000
        });

        console.log('✅ PDF yaradıldı - size:', pdfBuffer.length, 'bytes');
        return pdfBuffer;

    } catch (error) {
        console.error('Simple PDF generation xətası:', error);
        throw error;
    }
}
