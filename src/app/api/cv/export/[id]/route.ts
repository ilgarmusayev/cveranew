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
    console.log('=== PDF Export API başladı ===');
    
    let browser: any;
    
    try {
        const { id } = await params;
        const cvId = id;
        console.log('PDF Export başladı - CV ID:', cvId);
        
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

        const body = await request.json();
        const { format, templateId, data, fontSettings, htmlContent, cssContent } = body;

        console.log('Request body alındı:', { 
            format, 
            templateId, 
            dataKeys: Object.keys(data || {}),
            fontSettings: fontSettings ? 'mövcud' : 'yox',
            htmlContent: htmlContent ? 'mövcud' : 'yox',
            cssContent: cssContent ? 'mövcud' : 'yox'
        });
        
        // FONT SETTINGS DEBUG - TAM STRUCTURE
        console.log('=== FONT SETTINGS FULL DEBUG ===');
        console.log('fontSettings raw:', JSON.stringify(fontSettings, null, 2));
        if (fontSettings) {
            console.log('fontSettings properties:');
            Object.keys(fontSettings).forEach(key => {
                console.log(`  ${key}:`, fontSettings[key]);
            });
        } else {
            console.log('⚠️  fontSettings is NULL/UNDEFINED - using defaults');
        }
        console.log('=== END FONT SETTINGS DEBUG ===');

        if (!format || format !== 'pdf') {
            return NextResponse.json(
                { error: 'Yalnız PDF format dəstəklənir' }, 
                { status: 400 }
            );
        }

        // Browser başlat və PDF generate et
        browser = await initializeBrowser();
        return await generatePDF(browser, data, templateId, fontSettings, htmlContent, cssContent, cvId);

    } catch (error) {
        console.error('Export xətası:', error);
        
        // Browser cleanup if it was opened
        if (browser) {
            try {
                await browser.close();
                console.log('Browser cleaned up after error');
            } catch (cleanupError) {
                console.error('Browser cleanup error:', cleanupError);
            }
        }
        
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Export xətası: ${errorMsg}` }, 
            { status: 500 }
        );
    }
}

async function initializeBrowser() {
    console.log('Puppeteer browser başladılır...');
    
    // Environment detection
    const isProduction = process.env.NODE_ENV === 'production';
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
    const isLocal = !isServerless;
    
    let executablePath: string | undefined;
    let browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-component-extensions-with-background-pages'
    ];

    if (isLocal) {
        // Local development - try multiple fallback options
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const puppeteerChrome = path.join(os.homedir(), '.cache/puppeteer/chrome/linux-139.0.7258.138/chrome-linux64/chrome');
        
        executablePath = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH;
        
        // Check if puppeteer chrome exists
        if (!executablePath && fs.existsSync(puppeteerChrome)) {
            executablePath = puppeteerChrome;
            console.log('Found Puppeteer Chrome at:', puppeteerChrome);
        }
        
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

    console.log('Browser configuration:', {
        isProduction,
        isServerless,
        isLocal,
        executablePath: executablePath ? 'set' : 'undefined',
        argsCount: browserArgs.length
    });

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                ...browserArgs,
                '--font-render-hinting=none',
                '--enable-font-antialiasing',
                '--force-device-scale-factor=1',
                '--default-encoding=utf-8',
                '--locale=az-AZ',
                '--lang=az',
                '--accept-lang=az-AZ,az,tr-TR,tr,en-US,en',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ],
            executablePath: executablePath
        });
        console.log('Browser başladıldı successfully with unicode support');
        return browser;
    } catch (browserError) {
        console.error('Browser launch error:', browserError);
        
        // Fallback strategy for local development
        if (isLocal) {
            console.log('Trying multiple fallback strategies...');
            
            // Strategy 1: Try with minimal args
            try {
                console.log('Fallback 1: Minimal args without executablePath');
                const browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                console.log('Browser started with minimal args');
                return browser;
            } catch (fallback1Error) {
                console.log('Fallback 1 failed, trying strategy 2...');
                
                // Strategy 2: Try @sparticuz/chromium even in local
                try {
                    console.log('Fallback 2: Using @sparticuz/chromium in local');
                    const chromiumPath = await chromium.executablePath();
                    const browser = await puppeteer.launch({
                        headless: true,
                        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                        executablePath: chromiumPath
                    });
                    console.log('Browser started with @sparticuz/chromium in local');
                    return browser;
                } catch (fallback2Error) {
                    console.log('Fallback 2 failed, trying strategy 3...');
                    
                    // Strategy 3: Try puppeteer bundled chromium
                    try {
                        console.log('Fallback 3: Using bundled Chromium');
                        const browser = await puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                        });
                        console.log('Browser started with bundled Chromium');
                        return browser;
                    } catch (fallback3Error) {
                        console.error('All fallback strategies failed');
                        throw new Error('Could not start browser with any strategy. Please install Chrome/Chromium or set CHROME_BIN environment variable.');
                    }
                }
            }
        } else {
            const errorMsg = browserError instanceof Error ? browserError.message : 'Unknown error';
            throw new Error(`Serverless browser launch failed: ${errorMsg}`);
        }
    }
}

async function generatePDF(browser: any, cvData: any, templateId: string, fontSettings: any, htmlContent: string, cssContent: string, cvId: string) {
    console.log('=== PDF Export başladı ===');
    
    try {
        console.log('Browser başladıldı, səhifə yaradılır...');
        const page = await browser.newPage();

        // A4 page ayarları - 210mm x 297mm at 96 DPI
        await page.setViewport({ 
            width: 794,   // 210mm at 96 DPI
            height: 1123, // 297mm at 96 DPI
            deviceScaleFactor: 1
        });

        // CV render etmək üçün HTML yarat
        console.log('HTML generasiya edilir...');
        let html;
        
        if (htmlContent && cssContent) {
            // Front-end-dən gələn HTML content istifadə et, amma CSS-i təkmilləşdir
            console.log('=== Front-end HTML/CSS istifadə edilir ===');
            console.log('HTML length:', htmlContent.length);
            console.log('CSS length:', cssContent.length);
            console.log('Font Settings DEBUG:', JSON.stringify(fontSettings, null, 2));
            console.log('Template ID:', templateId);
            
            // Check if basic template
            if (templateId === 'basic') {
                console.log('=== BASIC TEMPLATE DETECTED - EXTRA DEBUGGING ===');
                console.log('Font Settings Object Keys:', Object.keys(fontSettings || {}));
                console.log('Available font settings:');
                console.log('- headingSize:', fontSettings?.headingSize);
                console.log('- titleSize:', fontSettings?.titleSize);
                console.log('- subheadingSize:', fontSettings?.subheadingSize);
                console.log('- subtitleSize:', fontSettings?.subtitleSize);
                console.log('- bodySize:', fontSettings?.bodySize);
                console.log('- fontSize:', fontSettings?.fontSize);
                console.log('- smallSize:', fontSettings?.smallSize);
                console.log('- xsSize:', fontSettings?.xsSize);
                console.log('Final computed sizes:');
                console.log('- Heading:', fontSettings?.headingSize || fontSettings?.titleSize, 'px');
                console.log('- Subheading:', fontSettings?.subheadingSize || fontSettings?.subtitleSize, 'px');
                console.log('- Body:', fontSettings?.bodySize || fontSettings?.fontSize, 'px');
                console.log('- Small:', fontSettings?.smallSize || fontSettings?.xsSize, 'px');
            }
            html = `
                <!DOCTYPE html>
                <html lang="az">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                    <meta http-equiv="Content-Language" content="az-AZ">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>CV Export</title>
                    <style>
                        ${cssContent}
                        
                        /* ROUTE.TS ƏLAVƏ CSS - YALNIZ DINAMIK FONT SISTEMI */
                          
                        /* MƏCBURI SIFIR MARGIN - PDF ÜÇÜN */
                        @page {
                            size: A4;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                        }
                        
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            height: 100% !important;
                            box-sizing: border-box !important;
                            border: none !important;
                            outline: none !important;
                        }
                        
                        /* Bütün elementlər üçün margin sıfır */
                        *, *::before, *::after {
                            box-sizing: border-box !important;
                            margin: 0 !important;
                        }
                        
                        /* Container siniflarını override et */
                        .cv-preview, .cv-container, .container, .max-w-4xl, .max-w-3xl, .max-w-2xl, 
                        .max-w-xl, .max-w-lg, .mx-auto, .w-full, .h-full {
                            width: 100% !important;
                            max-width: none !important;
                            margin: 0 !important;
                            border: none !important;
                        }
                            
                        /* TAMAMILƏ DİNAMİK SİSTEM - HEÇ BİR HARDCODED DƏYƏR YOX */
                        
                        /* CSS Variables - FONT MANAGER İLƏ SINXRON */
                        :root, html, body {
                            --cv-font-family: ${fontSettings?.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
                            /* FONT MANAGER İLƏ TAM 1:1 UYĞUN ÖLÇÜLƏR */
                            --cv-name-size: ${fontSettings?.nameSize || 24}px;
                            --cv-heading-size: ${fontSettings?.headingSize || 18}px;
                            --cv-subheading-size: ${fontSettings?.subheadingSize || 16}px;  
                            --cv-body-size: ${fontSettings?.bodySize || 14}px;
                            --cv-small-size: ${fontSettings?.smallSize || 12}px;
                            
                            /* Font Weight Dəyişənləri */
                            --cv-heading-weight: ${fontSettings?.headingWeight};
                            --cv-subheading-weight: ${fontSettings?.subheadingWeight};
                            --cv-body-weight: ${fontSettings?.bodyWeight};
                            --cv-small-weight: ${fontSettings?.smallWeight};
                            
                            /* Section Spacing - CVPreview ilə tam uyğun, px istifadə */
                            --cv-section-spacing: ${fontSettings?.sectionSpacing || 8}px;
                            
                            /* Additional Spacing Variables */
                            --cv-small-spacing: 4px;
                            --cv-item-spacing: 8px;
                            
                            /* Dinamik Rənglər */
                            --cv-primary-color: ${fontSettings?.primaryColor || '#1f2937'};
                            --cv-secondary-color: ${fontSettings?.secondaryColor || '#6b7280'};
                            --cv-accent-color: ${fontSettings?.accentColor || '#3b82f6'};
                            --cv-text-color: ${fontSettings?.textColor || '#374151'};
                            --cv-light-color: ${fontSettings?.lightColor || '#f9fafb'};
                            --cv-border-color: ${fontSettings?.borderColor || '#e5e7eb'};
                            
                            /* Dinamik Məsafələr */
                            --cv-spacing-xs: ${fontSettings?.spacingXs || '0.25rem'};
                            --cv-spacing-sm: ${fontSettings?.spacingSm || '0.5rem'};
                            --cv-spacing-md: ${fontSettings?.spacingMd || '1rem'};
                            --cv-spacing-lg: ${fontSettings?.spacingLg || '1.5rem'};
                            --cv-spacing-xl: ${fontSettings?.spacingXl || '2rem'};
                            
                            /* Dinamik Border və Shadow */
                            --cv-border-width: ${fontSettings?.borderWidth || '1px'};
                            --cv-border-radius: ${fontSettings?.borderRadius || '0.375rem'};
                            --cv-shadow: ${fontSettings?.shadow || '0 1px 3px 0 rgb(0 0 0 / 0.1)'};
                        }
                        
                        /* Global Dynamic Override - HEÇ BİR HARDCODE YOX */
                        *, *::before, *::after, html, body, div, span, h1, h2, h3, h4, h5, h6, p, a, strong, em, ul, ol, li {
                            font-family: var(--cv-font-family) !important;
                            color: var(--cv-text-color) !important;
                        }
                        
                        /* UNIVERSAL CSS OVERRIDE - FRONT-END CSS-İ OVERRIDE ET */
                        .basic-template *, .basic-template *::before, .basic-template *::after,
                        .basic-template h1, .basic-template h2, .basic-template h3, .basic-template h4, .basic-template h5, .basic-template h6,
                        .basic-template p, .basic-template span, .basic-template div, .basic-template li, .basic-template a, .basic-template strong {
                            font-family: var(--cv-font-family) !important;
                            color: var(--cv-text-color) !important;
                        }
                        
                        /* UNIVERSAL DYNAMIC SYSTEM - CLEAN AND SIMPLE */
                        
                        /* ALL TEXT SIZES - DYNAMIC - NO SCALE FACTORS */
                        .text-xs { font-size: var(--cv-small-size) !important; }
                        .text-sm { font-size: var(--cv-small-size) !important; }
                        .text-base { font-size: var(--cv-body-size) !important; }
                        .text-lg { font-size: var(--cv-subheading-size) !important; }
                        .text-xl { font-size: var(--cv-heading-size) !important; }
                        .text-2xl { font-size: var(--cv-heading-size) !important; }
                        .text-3xl { font-size: var(--cv-heading-size) !important; }
                        .text-4xl { font-size: var(--cv-heading-size) !important; }
                        .text-5xl { font-size: var(--cv-heading-size) !important; }
                        
                        /* BASIC TEMPLATE FONT SIZE OVERRIDES - NO SCALE FACTORS */
                        .basic-template .text-xs { font-size: var(--cv-small-size) !important; }
                        .basic-template .text-sm { font-size: var(--cv-small-size) !important; }
                        .basic-template .text-base { font-size: var(--cv-body-size) !important; }
                        .basic-template .text-lg { font-size: var(--cv-subheading-size) !important; }
                        .basic-template .text-xl { font-size: var(--cv-heading-size) !important; }
                        .basic-template .text-2xl { font-size: var(--cv-heading-size) !important; }
                        .basic-template .text-3xl { font-size: var(--cv-heading-size) !important; }
                        .basic-template .text-4xl { font-size: var(--cv-heading-size) !important; }
                        .basic-template .text-5xl { font-size: var(--cv-heading-size) !important; }
                        
                        /* BASIC TEMPLATE ULTRA STRONG OVERRIDES */
                        /* NUCLEAR OPTION - ABSOLUTE FONT SIZE OVERRIDE */
                        .basic-template * {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        .basic-template *[class*="text-xs"] {
                            font-size: var(--cv-small-size) !important;
                        }
                        
                        .basic-template *[class*="text-sm"] {
                            font-size: var(--cv-small-size) !important;
                        }
                        
                        .basic-template *[class*="text-base"] {
                            font-size: var(--cv-body-size) !important;
                        }
                        
                        .basic-template *[class*="text-lg"] {
                            font-size: var(--cv-subheading-size) !important;
                        }
                        
                        .basic-template *[class*="text-xl"]:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]) {
                            font-size: var(--cv-heading-size) !important;
                        }
                        
                        .basic-template *[class*="text-2xl"] {
                            font-size: var(--cv-heading-size) !important;
                        }
                        
                        .basic-template *[class*="text-3xl"] {
                            font-size: var(--cv-heading-size) !important;
                        }
                        
                        .basic-template *[class*="text-4xl"] {
                            font-size: var(--cv-heading-size) !important;
                        }
                        
                        .basic-template *[class*="text-5xl"] {
                            font-size: var(--cv-heading-size) !important;
                        }
                        
                        /* HTML TAGS - NO SCALE FACTORS */
                        h1 { 
                            font-size: var(--cv-heading-size) !important;
                            color: var(--cv-primary-color) !important;
                            margin: var(--cv-spacing-md) 0 !important;
                        }
                        h2 { 
                            font-size: var(--cv-heading-size) !important;
                            color: var(--cv-primary-color) !important;
                            margin: var(--cv-spacing-md) 0 !important;
                        }
                        h3 { 
                            font-size: var(--cv-subheading-size) !important;
                            color: var(--cv-primary-color) !important;
                            margin: var(--cv-spacing-sm) 0 !important;
                        }
                        h4, h5, h6 { 
                            font-size: var(--cv-subheading-size) !important;
                            color: var(--cv-primary-color) !important;
                        }
                        p, span, div, li, td, th, a { 
                            font-size: var(--cv-body-size) !important;
                            color: var(--cv-text-color) !important;
                        }
                        
                        /* BASIC TEMPLATE EXTREME OVERRIDES - MAX SPECIFICITY */
                        body .basic-template h1, 
                        html body .basic-template h1,
                        .basic-template h1[class*="text-"],
                        .basic-template .text-4xl,
                        .basic-template .text-5xl { 
                            font-size: calc(var(--cv-heading-size) * 1.33) !important;
                            color: var(--cv-primary-color) !important;
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        body .basic-template h2, 
                        html body .basic-template h2,
                        .basic-template h2[class*="text-"],
                        .basic-template .text-3xl,
                        .basic-template .text-2xl { 
                            font-size: var(--cv-heading-size) !important;
                            color: var(--cv-primary-color) !important;
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        body .basic-template h3, 
                        html body .basic-template h3,
                        .basic-template h3[class*="text-"],
                        .basic-template .text-xl,
                        .basic-template .text-lg { 
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important;
                            color: var(--cv-primary-color) !important;
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        body .basic-template h4, body .basic-template h5, body .basic-template h6,
                        html body .basic-template h4, html body .basic-template h5, html body .basic-template h6,
                        .basic-template h4[class*="text-"], .basic-template h5[class*="text-"], .basic-template h6[class*="text-"],
                        .basic-template .text-base { 
                            font-size: var(--cv-subheading-size) !important;
                            color: var(--cv-primary-color) !important;
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        body .basic-template p, body .basic-template span, body .basic-template div, body .basic-template li, body .basic-template td, body .basic-template th, body .basic-template a,
                        html body .basic-template p, html body .basic-template span, html body .basic-template div, html body .basic-template li, html body .basic-template td, html body .basic-template th, html body .basic-template a,
                        .basic-template p[class*="text-"], .basic-template span[class*="text-"], .basic-template div[class*="text-"], .basic-template li[class*="text-"],
                        .basic-template .text-sm { 
                            font-size: var(--cv-body-size) !important;
                            color: var(--cv-text-color) !important;
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* BASIC TEMPLATE ABSOLUTE NUCLEAR OVERRIDE - HƏR HALDA DİNAMİK OLSUN */
                        .basic-template * { font-family: var(--cv-font-family) !important; }
                        .basic-template *[class*="text-"] { 
                            font-family: var(--cv-font-family) !important;
                        }
                        .basic-template [class*="text-xs"] { font-size: calc(var(--cv-small-size) * 0.75) !important; }
                        .basic-template [class*="text-sm"] { font-size: var(--cv-small-size) !important; }
                        .basic-template [class*="text-base"] { font-size: var(--cv-body-size) !important; }
                        .basic-template [class*="text-lg"] { font-size: calc(var(--cv-subheading-size) * 1.125) !important; }
                        .basic-template [class*="text-xl"]:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]) { font-size: calc(var(--cv-heading-size) * 0.83) !important; }
                        .basic-template [class*="text-2xl"] { font-size: var(--cv-heading-size) !important; }
                        .basic-template [class*="text-3xl"] { font-size: calc(var(--cv-heading-size) * 1.25) !important; }
                        .basic-template [class*="text-4xl"] { font-size: calc(var(--cv-heading-size) * 1.5) !important; }
                        .basic-template [class*="text-5xl"] { font-size: calc(var(--cv-heading-size) * 2) !important; }
                        
                        /* BASIC TEMPLATE MEGA NUCLEAR OVERRIDE - BÜTÜNLÜYLƏ DYNAMIC */
                        html .basic-template *,
                        body .basic-template *,
                        .basic-template *,
                        .basic-template h1, .basic-template h2, .basic-template h3, .basic-template h4, .basic-template h5, .basic-template h6,
                        .basic-template p, .basic-template span, .basic-template div, .basic-template li, .basic-template a, .basic-template strong, .basic-template em,
                        .basic-template .text-xs, .basic-template .text-sm, .basic-template .text-base, .basic-template .text-lg, 
                        .basic-template .text-xl, .basic-template .text-2xl, .basic-template .text-3xl, .basic-template .text-4xl, .basic-template .text-5xl {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* BASIC TEMPLATE FONT SIZE NUCLEAR MATRIX - MAX SPECIFICITY */
                        html body .basic-template .text-xs,
                        html body .basic-template [class*="text-xs"],
                        .basic-template .text-xs[class],
                        .basic-template *[class*="text-xs"] {
                            font-size: calc(var(--cv-small-size) * 0.75) !important;
                            line-height: 1.3 !important;
                        }
                        
                        html body .basic-template .text-sm,
                        html body .basic-template [class*="text-sm"],
                        .basic-template .text-sm[class],
                        .basic-template *[class*="text-sm"] {
                            font-size: var(--cv-small-size) !important;
                            line-height: 1.4 !important;
                        }
                        
                        html body .basic-template .text-base,
                        html body .basic-template [class*="text-base"],
                        .basic-template .text-base[class],
                        .basic-template *[class*="text-base"] {
                            font-size: var(--cv-body-size) !important;
                            line-height: 1.5 !important;
                        }
                        
                        html body .basic-template .text-lg,
                        html body .basic-template [class*="text-lg"],
                        .basic-template .text-lg[class],
                        .basic-template *[class*="text-lg"] {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important;
                            line-height: 1.4 !important;
                        }
                        
                        html body .basic-template .text-xl:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]),
                        html body .basic-template [class*="text-xl"]:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]),
                        .basic-template .text-xl[class]:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]),
                        .basic-template *[class*="text-xl"]:not([class*="text-2xl"]):not([class*="text-3xl"]):not([class*="text-4xl"]):not([class*="text-5xl"]) {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.4 !important;
                        }
                        
                        html body .basic-template .text-2xl,
                        html body .basic-template [class*="text-2xl"],
                        .basic-template .text-2xl[class],
                        .basic-template *[class*="text-2xl"] {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.3 !important;
                        }
                        
                        html body .basic-template .text-3xl,
                        html body .basic-template [class*="text-3xl"],
                        .basic-template .text-3xl[class],
                        .basic-template *[class*="text-3xl"] {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.3 !important;
                        }
                        
                        html body .basic-template .text-4xl,
                        html body .basic-template [class*="text-4xl"],
                        .basic-template .text-4xl[class],
                        .basic-template *[class*="text-4xl"] {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.2 !important;
                        }
                        
                        html body .basic-template .text-5xl,
                        html body .basic-template [class*="text-5xl"],
                        .basic-template .text-5xl[class],
                        .basic-template *[class*="text-5xl"] {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.2 !important;
                        }
                        
                        /* BASIC TEMPLATE FONT WEIGHT NUCLEAR OVERRIDE */
                        html body .basic-template .font-light,
                        html body .basic-template [class*="font-light"],
                        .basic-template .font-light[class],
                        .basic-template *[class*="font-light"] {
                            font-weight: 300 !important;
                        }
                        
                        html body .basic-template .font-normal,
                        html body .basic-template [class*="font-normal"],
                        .basic-template .font-normal[class],
                        .basic-template *[class*="font-normal"] {
                            font-weight: 400 !important;
                        }
                        
                        html body .basic-template .font-medium,
                        html body .basic-template [class*="font-medium"],
                        .basic-template .font-medium[class],
                        .basic-template *[class*="font-medium"] {
                            font-weight: 500 !important;
                        }
                        
                        html body .basic-template .font-semibold,
                        html body .basic-template [class*="font-semibold"],
                        .basic-template .font-semibold[class],
                        .basic-template *[class*="font-semibold"] {
                            font-weight: 600 !important;
                        }
                        
                        html body .basic-template .font-bold,
                        html body .basic-template [class*="font-bold"],
                        .basic-template .font-bold[class],
                        .basic-template *[class*="font-bold"] {
                            font-weight: 700 !important;
                        }
                        
                        html body .basic-template .font-extrabold,
                        html body .basic-template [class*="font-extrabold"],
                        .basic-template .font-extrabold[class],
                        .basic-template *[class*="font-extrabold"] {
                            font-weight: 800 !important;
                        }
                        
                        html body .basic-template .font-black,
                        html body .basic-template [class*="font-black"],
                        .basic-template .font-black[class],
                        .basic-template *[class*="font-black"] {
                            font-weight: 900 !important;
                        }
                        
                        /* UNIVERSAL SPACING CLASSES - DİNAMİK */
                        .space-y-0 > * + * { margin-top: 0 !important; }
                        .space-y-1 > * + * { margin-top: var(--cv-spacing-xs) !important; }
                        .space-y-2 > * + * { margin-top: var(--cv-spacing-sm) !important; }
                        .space-y-3 > * + * { margin-top: var(--cv-spacing-sm) !important; }
                        .space-y-4 > * + * { margin-top: var(--cv-spacing-md) !important; }
                        .space-y-6 > * + * { margin-top: var(--cv-spacing-lg) !important; }
                        .space-y-8 > * + * { margin-top: var(--cv-spacing-xl) !important; }
                        
                        .space-x-0 > * + * { margin-left: 0 !important; }
                        .space-x-1 > * + * { margin-left: var(--cv-spacing-xs) !important; }
                        .space-x-2 > * + * { margin-left: var(--cv-spacing-sm) !important; }
                        .space-x-4 > * + * { margin-left: var(--cv-spacing-md) !important; }
                        
                        /* UNIVERSAL GAP CLASSES - DİNAMİK */
                        .gap-0 { gap: 0 !important; }
                        .gap-1 { gap: var(--cv-spacing-xs) !important; }
                        .gap-2 { gap: var(--cv-spacing-sm) !important; }
                        .gap-3 { gap: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .gap-4 { gap: var(--cv-spacing-md) !important; }
                        .gap-6 { gap: var(--cv-spacing-lg) !important; }
                        .gap-8 { gap: var(--cv-spacing-xl) !important; }
                        
                        /* UNIVERSAL FONT WEIGHTS - DİNAMİK */
                        .font-thin { font-weight: 100 !important; }
                        .font-light { font-weight: 300 !important; }
                        .font-normal { font-weight: 400 !important; }
                        .font-medium { font-weight: 500 !important; }
                        .font-semibold { font-weight: 600 !important; }
                        .font-bold { font-weight: 700 !important; }
                        .font-extrabold { font-weight: 800 !important; }
                        .font-black { font-weight: 900 !important; }
                        
                        /* UNIVERSAL LAYOUT CLASSES - DİNAMİK */
                        .flex { display: flex !important; }
                        .flex-col { flex-direction: column !important; }
                        .flex-row { flex-direction: row !important; }
                        .flex-wrap { flex-wrap: wrap !important; }
                        .items-start { align-items: flex-start !important; }
                        .items-center { align-items: center !important; }
                        .items-end { align-items: flex-end !important; }
                        .justify-start { justify-content: flex-start !important; }
                        .justify-center { justify-content: center !important; }
                        .justify-between { justify-content: space-between !important; }
                        .justify-end { justify-content: flex-end !important; }
                        
                        .grid { display: grid !important; }
                        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                        .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                        .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                        
                        /* UNIVERSAL WIDTH/HEIGHT CLASSES - DİNAMİK */
                        .w-full { width: 100% !important; }
                        .w-1\/2 { width: 50% !important; }
                        .w-1\/3 { width: 33.333333% !important; }
                        .w-2\/3 { width: 66.666667% !important; }
                        .w-1\/4 { width: 25% !important; }
                        .w-3\/4 { width: 75% !important; }
                        
                        .h-full { height: 100% !important; }
                        .h-auto { height: auto !important; }
                        
                        /* UNIVERSAL POSITION CLASSES - DİNAMİK */
                        .relative { position: relative !important; }
                        .absolute { position: absolute !important; }
                        .fixed { position: fixed !important; }
                        .sticky { position: sticky !important; }
                        
                        .top-0 { top: 0 !important; }
                        .bottom-0 { bottom: 0 !important; }
                        .left-0 { left: 0 !important; }
                        .right-0 { right: 0 !important; }
                        
                        /* UNIVERSAL DISPLAY CLASSES - DİNAMİK */
                        .block { display: block !important; }
                        .inline { display: inline !important; }
                        .inline-block { display: inline-block !important; }
                        .hidden { display: none !important; }
                        
                        /* UNIVERSAL TEXT ALIGNMENT - DİNAMİK */
                        .text-left { text-align: left !important; }
                        .text-center { text-align: center !important; }
                        .text-right { text-align: right !important; }
                        .text-justify { text-align: justify !important; }
                        
                        /* UNIVERSAL LINE HEIGHT - DİNAMİK */
                        .leading-tight { line-height: 1.25 !important; }
                        .leading-snug { line-height: 1.375 !important; }
                        .leading-normal { line-height: 1.5 !important; }
                        .leading-relaxed { line-height: 1.625 !important; }
                        .leading-loose { line-height: 2 !important; }
                        
                        /* UNIVERSAL BREAK RULES - DİNAMİK */
                        .break-words { word-break: break-word !important; }
                        .break-all { word-break: break-all !important; }
                        .whitespace-nowrap { white-space: nowrap !important; }
                        .whitespace-normal { white-space: normal !important; }
                        
                        /* UNIVERSAL OVERFLOW - DİNAMİK */
                        .overflow-hidden { overflow: hidden !important; }
                        .overflow-visible { overflow: visible !important; }
                        .overflow-auto { overflow: auto !important; }
                        
                        /* UNIVERSAL CURSOR - DİNAMİK */
                        .cursor-pointer { cursor: pointer !important; }
                        .cursor-default { cursor: default !important; }
                        
                        /* UNIVERSAL OPACITY - DİNAMİK */
                        .opacity-0 { opacity: 0 !important; }
                        .opacity-50 { opacity: 0.5 !important; }
                        .opacity-75 { opacity: 0.75 !important; }
                        .opacity-100 { opacity: 1 !important; }
                        
                        
                        /* UNIVERSAL TEXT SIZE CLASSES - TAMAMI DİNAMİK */
                        .text-xs { font-size: calc(var(--cv-small-size) * 0.75) !important; line-height: 1.3 !important; }
                        .text-sm { font-size: var(--cv-body-size) !important; line-height: 1.4 !important; }
                        .text-base { font-size: var(--cv-subheading-size) !important; line-height: 1.5 !important; }
                        .text-lg { font-size: calc(var(--cv-subheading-size) * 1.125) !important; line-height: 1.4 !important; }
                        .text-xl { font-size: calc(var(--cv-heading-size) * 0.83) !important; line-height: 1.4 !important; }
                        .text-2xl { font-size: var(--cv-heading-size) !important; line-height: 1.3 !important; }
                        .text-3xl { font-size: calc(var(--cv-heading-size) * 1.25) !important; line-height: 1.3 !important; }
                        .text-4xl { font-size: calc(var(--cv-heading-size) * 1.5) !important; line-height: 1.2 !important; }
                        .text-5xl { font-size: calc(var(--cv-heading-size) * 2) !important; line-height: 1.2 !important; }
                        
                        /* UNIVERSAL HTML TAG STYLING - DİNAMİK */
                        h1 { font-size: calc(var(--cv-heading-size) * 1.33) !important; line-height: 1.2 !important; }
                        h2 { font-size: var(--cv-heading-size) !important; line-height: 1.3 !important; }
                        h3 { font-size: calc(var(--cv-subheading-size) * 1.125) !important; line-height: 1.4 !important; }
                        h4 { font-size: var(--cv-subheading-size) !important; line-height: 1.5 !important; }
                        
                        /* ALL TEMPLATES USE DYNAMIC FONT FAMILY */
                        .aurora-template, .vertex-template, .horizon-template, .lumen-template,
                        .modern-template, .ats-template, .basic-template, .traditional-template,
                        .classic-template, .exclusive-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        .text-sm {
                            font-size: var(--cv-small-size) !important; /* 12px default */
                        }
                        
                        .text-base {
                            font-size: var(--cv-body-size) !important; /* 14px default */
                        }
                        
                        .text-lg {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important; /* ~18px */
                        }
                        
                        .text-xl {
                            font-size: calc(var(--cv-heading-size) * 0.83) !important; /* ~20px */
                        }
                        
                        .text-2xl {
                            font-size: var(--cv-heading-size) !important; /* 24px default */
                        }
                        
                        .text-3xl {
                            font-size: calc(var(--cv-heading-size) * 1.25) !important; /* ~30px */
                        }
                        
                        .text-4xl {
                            font-size: calc(var(--cv-heading-size) * 1.5) !important; /* ~36px */
                        }
                        
                        .text-5xl {
                            font-size: calc(var(--cv-heading-size) * 2) !important; /* ~48px */
                        }
                        
                        /* HTML Tag Overrides - Universal */
                        h1 {
                            font-size: calc(var(--cv-heading-size) * 1.33) !important; /* ~32px */
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        h2 {
                            font-size: var(--cv-heading-size) !important; /* 24px default */
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        h3 {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important; /* ~18px */
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        
                        /* UNIVERSAL BACKGROUND GRADIENTS - DİNAMİK */
                        .bg-gradient-to-r.from-blue-50.to-indigo-50,
                        .bg-gradient-to-r {
                            background: linear-gradient(to right, #eff6ff, #eef2ff) !important;
                        }
                        
                        /* UNIVERSAL BORDER COLORS - DİNAMİK */
                        .border-blue-200 { border-color: #dbeafe !important; }
                        
                        /* UNIVERSAL PADDING CLASSES - DİNAMİK */
                        .p-1 { padding: var(--cv-spacing-xs) !important; }
                        .p-2 { padding: var(--cv-spacing-sm) !important; }
                        .p-3 { padding: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .p-4 { padding: var(--cv-spacing-md) !important; }
                        .p-6 { padding: var(--cv-spacing-lg) !important; }
                        .p-8 { padding: var(--cv-spacing-xl) !important; }
                        
                        .px-1 { padding-left: var(--cv-spacing-xs) !important; padding-right: var(--cv-spacing-xs) !important; }
                        .px-2 { padding-left: var(--cv-spacing-sm) !important; padding-right: var(--cv-spacing-sm) !important; }
                        .px-3 { padding-left: calc(var(--cv-spacing-sm) * 1.5) !important; padding-right: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .px-4 { padding-left: var(--cv-spacing-md) !important; padding-right: var(--cv-spacing-md) !important; }
                        .px-6 { padding-left: var(--cv-spacing-lg) !important; padding-right: var(--cv-spacing-lg) !important; }
                        .px-8 { padding-left: var(--cv-spacing-xl) !important; padding-right: var(--cv-spacing-xl) !important; }
                        
                        .py-1 { padding-top: var(--cv-spacing-xs) !important; padding-bottom: var(--cv-spacing-xs) !important; }
                        .py-2 { padding-top: var(--cv-spacing-sm) !important; padding-bottom: var(--cv-spacing-sm) !important; }
                        .py-3 { padding-top: calc(var(--cv-spacing-sm) * 1.5) !important; padding-bottom: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .py-4 { padding-top: var(--cv-spacing-md) !important; padding-bottom: var(--cv-spacing-md) !important; }
                        .py-6 { padding-top: var(--cv-spacing-lg) !important; padding-bottom: var(--cv-spacing-lg) !important; }
                        .py-8 { padding-top: var(--cv-spacing-xl) !important; padding-bottom: var(--cv-spacing-xl) !important; }
                        
                        /* UNIVERSAL MARGIN CLASSES - DİNAMİK */
                        .m-0 { margin: 0 !important; }
                        .m-1 { margin: var(--cv-spacing-xs) !important; }
                        .m-2 { margin: var(--cv-spacing-sm) !important; }
                        .m-3 { margin: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .m-4 { margin: var(--cv-spacing-md) !important; }
                        .m-6 { margin: var(--cv-spacing-lg) !important; }
                        .m-8 { margin: var(--cv-spacing-xl) !important; }
                        
                        .mx-auto { margin-left: auto !important; margin-right: auto !important; }
                        
                        .mb-0 { margin-bottom: 0 !important; }
                        .mb-1 { margin-bottom: var(--cv-spacing-xs) !important; }
                        .mb-2 { margin-bottom: var(--cv-spacing-sm) !important; }
                        .mb-3 { margin-bottom: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .mb-4 { margin-bottom: var(--cv-spacing-md) !important; }
                        .mb-6 { margin-bottom: var(--cv-spacing-lg) !important; }
                        .mb-8 { margin-bottom: var(--cv-spacing-xl) !important; }
                        
                        .mt-0 { margin-top: 0 !important; }
                        .mt-1 { margin-top: var(--cv-spacing-xs) !important; }
                        .mt-2 { margin-top: var(--cv-spacing-sm) !important; }
                        .mt-3 { margin-top: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .mt-4 { margin-top: var(--cv-spacing-md) !important; }
                        .mt-6 { margin-top: var(--cv-spacing-lg) !important; }
                        .mt-8 { margin-top: var(--cv-spacing-xl) !important; }
                        
                        .ml-0 { margin-left: 0 !important; }
                        .ml-1 { margin-left: var(--cv-spacing-xs) !important; }
                        .ml-2 { margin-left: var(--cv-spacing-sm) !important; }
                        .ml-3 { margin-left: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .ml-4 { margin-left: var(--cv-spacing-md) !important; }
                        .ml-6 { margin-left: var(--cv-spacing-lg) !important; }
                        .ml-8 { margin-left: var(--cv-spacing-xl) !important; }
                        
                        .mr-0 { margin-right: 0 !important; }
                        .mr-1 { margin-right: var(--cv-spacing-xs) !important; }
                        .mr-2 { margin-right: var(--cv-spacing-sm) !important; }
                        .mr-3 { margin-right: calc(var(--cv-spacing-sm) * 1.5) !important; }
                        .mr-4 { margin-right: var(--cv-spacing-md) !important; }
                        .mr-6 { margin-right: var(--cv-spacing-lg) !important; }
                        .mr-8 { margin-right: var(--cv-spacing-xl) !important; }
                        
                        /* UNIVERSAL BORDER RADIUS - DİNAMİK */
                        .rounded { border-radius: 0.25rem !important; }
                        .rounded-md { border-radius: 0.375rem !important; }
                        .rounded-lg { border-radius: 0.5rem !important; }
                        .rounded-xl { border-radius: 0.75rem !important; }
                        .rounded-2xl { border-radius: 1rem !important; }
                        .rounded-full { border-radius: 9999px !important; }
                        
                        .exclusive-template .shadow-sm {
                            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
                        }
                        
                        .exclusive-template .border {
                            border-width: 1px !important;
                            border-style: solid !important;
                        }
                        
                        /* Profile image and content layout */
                        .exclusive-template .flex {
                            display: flex !important;
                        }
                        
                        .exclusive-template .flex-row {
                            flex-direction: row !important;
                        }
                        
                        .exclusive-template .items-center {
                            align-items: center !important;
                        }
                        
                        .exclusive-template .gap-6 {
                            gap: 1.5rem !important;
                        }
                        
                        
                        /* UNIVERSAL FLEX SHRINK - DİNAMİK */
                        .flex-shrink-0 { flex-shrink: 0 !important; }
                        .flex-shrink { flex-shrink: 1 !important; }
                        
                        /* UNIVERSAL WIDTH/HEIGHT SPECIFIC VALUES - DİNAMİK */
                        .w-28 { width: 7rem !important; }
                        .h-28 { height: 7rem !important; }
                        
                        /* UNIVERSAL OBJECT FIT - DİNAMİK */
                        .object-cover { object-fit: cover !important; }
                        .object-contain { object-fit: contain !important; }
                        .object-fill { object-fit: fill !important; }
                        
                        /* UNIVERSAL SHADOWS - DİNAMİK */
                        .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important; }
                        .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1) !important; }
                        .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important; }
                        .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1) !important; }
                        .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important; }
                        
                        /* UNIVERSAL BORDER WIDTHS - DİNAMİK */
                        .border { border-width: 1px !important; }
                        .border-0 { border-width: 0px !important; }
                        .border-2 { border-width: 2px !important; }
                        .border-4 { border-width: 4px !important; }
                        .border-8 { border-width: 8px !important; }
                        
                        /* UNIVERSAL BORDER COLORS - DİNAMİK */
                        .border-white { border-color: white !important; }
                        .border-blue-600 { border-color: #2563eb !important; }
                        .border-gray-200 { border-color: #e5e7eb !important; }
                        .border-gray-300 { border-color: #d1d5db !important; }
                        
                        /* UNIVERSAL INSET POSITIONS - DİNAMİK */
                        .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
                        .inset-1 { top: var(--cv-spacing-xs) !important; right: var(--cv-spacing-xs) !important; bottom: var(--cv-spacing-xs) !important; left: var(--cv-spacing-xs) !important; }
                        
                        /* UNIVERSAL FLEX PROPERTIES - DİNAMİK */
                        .flex-1 { flex: 1 1 0% !important; }
                        .flex-auto { flex: 1 1 auto !important; }
                        .flex-initial { flex: 0 1 auto !important; }
                        .flex-none { flex: none !important; }
                        
                        /* UNIVERSAL LETTER SPACING - DİNAMİK */
                        .tracking-tighter { letter-spacing: -0.05em !important; }
                        .tracking-tight { letter-spacing: -0.025em !important; }
                        .tracking-normal { letter-spacing: 0em !important; }
                        .tracking-wide { letter-spacing: 0.025em !important; }
                        .tracking-wider { letter-spacing: 0.05em !important; }
                        .tracking-widest { letter-spacing: 0.1em !important; }
                        
                        /* UNIVERSAL TEXT COLORS - DİNAMİK */
                        .text-gray-900 { color: #111827 !important; }
                        .text-gray-600 { color: #4b5563 !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-gray-400 { color: #9ca3af !important; }
                        .text-gray-300 { color: #d1d5db !important; }
                        .text-blue-600 { color: #2563eb !important; }
                        .text-blue-500 { color: #3b82f6 !important; }
                        .text-blue-700 { color: #1d4ed8 !important; }
                        
                        /* UNIVERSAL BORDER DIRECTIONS - DİNAMİK */
                        .border-t { border-top-width: 1px !important; border-top-style: solid !important; }
                        .border-b { border-bottom-width: 1px !important; border-bottom-style: solid !important; }
                        .border-l { border-left-width: 1px !important; border-left-style: solid !important; }
                        .border-r { border-right-width: 1px !important; border-right-style: solid !important; }
                        
                        /* UNIVERSAL PADDING DIRECTIONS - DİNAMİK */
                        .pt-0 { padding-top: 0 !important; }
                        .pt-1 { padding-top: var(--cv-spacing-xs) !important; }
                        .pt-2 { padding-top: var(--cv-spacing-sm) !important; }
                        .pt-3 { padding-top: var(--cv-spacing-sm) !important; }
                        .pt-4 { padding-top: var(--cv-spacing-md) !important; }
                        .pt-6 { padding-top: var(--cv-spacing-lg) !important; }
                        .pt-8 { padding-top: var(--cv-spacing-xl) !important; }
                        
                        .pb-0 { padding-bottom: 0 !important; }
                        .pb-1 { padding-bottom: var(--cv-spacing-xs) !important; }
                        .pb-2 { padding-bottom: var(--cv-spacing-sm) !important; }
                        .pb-3 { padding-bottom: var(--cv-spacing-sm) !important; }
                        .pb-4 { padding-bottom: var(--cv-spacing-md) !important; }
                        .pb-6 { padding-bottom: var(--cv-spacing-lg) !important; }
                        .pb-8 { padding-bottom: var(--cv-spacing-xl) !important; }
                        
                        .pl-0 { padding-left: 0 !important; }
                        .pl-1 { padding-left: var(--cv-spacing-xs) !important; }
                        .pl-2 { padding-left: var(--cv-spacing-sm) !important; }
                        .pl-3 { padding-left: var(--cv-spacing-sm) !important; }
                        .pl-4 { padding-left: var(--cv-spacing-md) !important; }
                        .pl-6 { padding-left: var(--cv-spacing-lg) !important; }
                        .pl-8 { padding-left: var(--cv-spacing-xl) !important; }
                        
                        .pr-0 { padding-right: 0 !important; }
                        .pr-1 { padding-right: var(--cv-spacing-xs) !important; }
                        .pr-2 { padding-right: var(--cv-spacing-sm) !important; }
                        .pr-3 { padding-right: var(--cv-spacing-sm) !important; }
                        .pr-4 { padding-right: var(--cv-spacing-md) !important; }
                        .pr-6 { padding-right: var(--cv-spacing-lg) !important; }
                        .pr-8 { padding-right: var(--cv-spacing-xl) !important; }
                        }
                        
                        .exclusive-template .mt-4 {
                            margin-top: 1rem !important;
                        }
                        
                        .exclusive-template .grid {
                            display: grid !important;
                        }
                        
                        .exclusive-template .grid-cols-3 {
                            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                        }
                        
                        .exclusive-template .gap-4 {
                            gap: 1rem !important;
                        }
                        
                        /* Contact info items */
                        .exclusive-template .p-3 {
                            padding: 0.75rem !important;
                        }
                        
                        .exclusive-template .rounded-md {
                            border-radius: 0.375rem !important;
                        }
                        
                        .exclusive-template .text-center {
                            text-align: center !important;
                        }
                        
                        .exclusive-template .mb-1 {
                            margin-bottom: 0.25rem !important;
                        }
                        
                        .exclusive-template .uppercase {
                            text-transform: uppercase !important;
                        }
                        
                        .exclusive-template .text-gray-500 {
                            color: #6b7280 !important;
                        }
                        
                        .exclusive-template .text-gray-800 {
                            color: #1f2937 !important;
                        }
                        
                        .exclusive-template .break-all {
                            word-break: break-all !important;
                        }
                        
                        /* PROFESSIONAL PAGE BREAK SİSTEMİ - AUTOMATIC MULTI-PAGE SUPPORT */
                        
                        /* A4 page setup - bütün səhifələr üçün eyni margin */
                        @page {
                            size: A4;
                            margin: 0 !important; /* TAMAMİLƏ SIFIR */
                        }
                        
                        /* CV Container - otomatik səhifə keçidi */
                        .cv-template {
                            min-height: 257mm; /* A4 content area (297mm - 40mm margins) */
                            height: auto !important;
                            page-break-inside: auto !important; /* İçerik çox olsa növbəti səhifəyə keçsin */
                            break-inside: auto !important;
                        }
                        
                        /* UNIVERSAL SECTION BREAKS - Məzmun əsaslı qırılmalar */
                        
                        /* Kiçik section-lar - birgə qalsın */
                        .mb-4 {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* Böyük section-lar - lazımsa keçid icazə ver */
                        .mb-6 {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                            orphans: 2 !important; /* Minimum 2 sətir qırılmadan əvvəl */
                            widows: 2 !important; /* Minimum 2 sətir qırılmadan sonra */
                        }
                        
                        /* UNIVERSAL HEADER PROTECTION - Başlıqlar tək qalmasın */
                        h1, h2, h3, .text-2xl {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                        }
                        
                        /* UNIVERSAL ITEM LEVEL PROTECTION - Individual items */
                        .space-y-2 > div, .space-y-3 > div {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* Larger sections that can break - işiniz çoxsa səhifə dəyişsin */
                        .space-y-4 > div {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                        }
                        
                        /* UNIVERSAL PERSONAL INFO PROTECTION - Şəxsi məlumat hissəsi */
                        .mb-6:first-child, .personal-info-section, .header-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        
                        /* UNIVERSAL MANUAL CONTROL CLASSES */
                        .force-page-break {
                            page-break-before: always !important;
                            break-before: page !important;
                        }
                        
                        .avoid-page-break {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        .allow-page-break {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                        }
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;
        } else {
            // Fallback - sadə HTML
            console.log('=== Fallback generateCVHTML istifadə edilir ===');
            console.log('Template ID:', templateId);
            console.log('Font Settings ötürülür:', fontSettings);
            html = generateCVHTML(cvData, templateId, fontSettings);
        }
        
        console.log('HTML hazırlandı, uzunluq:', html.length);

        // Browser səhifəsini güclü UTF-8 encoding və font dəstəyi ilə set et
        console.log('HTML səhifəyə yüklənir...');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'az,az-AZ,en',
            'Accept-Charset': 'utf-8',
            'Content-Type': 'text/html; charset=UTF-8'
        });
        
        // Azərbaycan dili üçün düzgün encoding və font rendering
        await page.evaluateOnNewDocument(() => {
            // Set proper encoding for Azerbaijani characters
            document.documentElement.setAttribute('lang', 'az');
            document.documentElement.setAttribute('dir', 'ltr');
            
            const meta = document.createElement('meta');
            meta.setAttribute('charset', 'UTF-8');
            meta.setAttribute('http-equiv', 'Content-Type');
            meta.setAttribute('content', 'text/html; charset=UTF-8');
            document.head?.appendChild(meta);
            
            // Font rendering optimizasyonu
            const style = document.createElement('style');
            style.textContent = `
                * {
                    font-synthesis: weight style !important;
                    font-variant-ligatures: common-ligatures !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                }
            `;
            document.head?.appendChild(style);
        });
        
        await page.setContent(html, { 
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Basic template üçün runtime CSS injection
        if (templateId === 'basic') {
            console.log('=== BASIC TEMPLATE - RUNTIME CSS INJECTION ===');
            
            console.log('🎨 Font Settings from font manager:', JSON.stringify(fontSettings, null, 2));
            
            // Use only fontSettings from request body (font manager)
            const finalFontSettings = {
                fontFamily: fontSettings?.fontFamily || 'Arial, sans-serif',
                headingSize: fontSettings?.headingSize || 18,
                subheadingSize: fontSettings?.subheadingSize || 16,
                bodySize: fontSettings?.bodySize || 14,
                smallSize: fontSettings?.smallSize || 12,
                headingWeight: fontSettings?.headingWeight || 700,
                subheadingWeight: fontSettings?.subheadingWeight || 600,
                bodyWeight: fontSettings?.bodyWeight || 400,
                smallWeight: fontSettings?.smallWeight || 400,
                sectionSpacing: fontSettings?.sectionSpacing || 8
            };
            
            console.log('✅ Final font settings (font manager only):', JSON.stringify(finalFontSettings, null, 2));
            
            // İndi finalFontSettings istifadə edək
            const headingSize = finalFontSettings.headingSize;
            const subheadingSize = finalFontSettings.subheadingSize;  
            const bodySize = finalFontSettings.bodySize;
            const smallSize = finalFontSettings.smallSize;
            const fontFamily = finalFontSettings.fontFamily;
            const headingWeight = finalFontSettings.headingWeight;
            const subheadingWeight = finalFontSettings.subheadingWeight;
            const bodyWeight = finalFontSettings.bodyWeight;
            
            console.log('✅ COMPUTED FONT SIZES FROM MERGED SETTINGS:', { headingSize, subheadingSize, bodySize, smallSize });
            
            // Direct CSS injection with important
            await page.addStyleTag({
                content: `
                    /* BASIC TEMPLATE FONT OVERRIDE - SIMPLE AND EFFECTIVE */
                    
                    /* All text size classes - maximum specificity */
                    .basic-template .text-xs { font-size: ${Math.round(smallSize * 0.8)}px !important; font-family: ${fontFamily} !important; }
                    .basic-template .text-sm { font-size: ${smallSize}px !important; font-family: ${fontFamily} !important; }
                    .basic-template .text-base { font-size: ${bodySize}px !important; font-family: ${fontFamily} !important; }
                    .basic-template .text-lg { font-size: ${Math.round(subheadingSize * 1.1)}px !important; font-family: ${fontFamily} !important; }
                    .basic-template .text-xl { font-size: ${subheadingSize}px !important; font-family: ${fontFamily} !important; }
                    .basic-template .text-2xl { font-size: ${headingSize}px !important; font-family: ${fontFamily} !important; }
                    
                    /* HTML tags override */
                    .basic-template h1 { font-size: ${Math.round(headingSize * 1.3)}px !important; font-weight: ${headingWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template h2 { font-size: ${headingSize}px !important; font-weight: ${headingWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template h3 { font-size: ${subheadingSize}px !important; font-weight: ${subheadingWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template h4, .basic-template h5, .basic-template h6 { font-size: ${bodySize}px !important; font-weight: ${subheadingWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template p { font-size: ${bodySize}px !important; font-weight: ${bodyWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template span { font-size: ${bodySize}px !important; font-weight: ${bodyWeight} !important; font-family: ${fontFamily} !important; }
                    .basic-template div { font-size: ${bodySize}px !important; font-family: ${fontFamily} !important; }
                    .basic-template li { font-size: ${bodySize}px !important; font-family: ${fontFamily} !important; }
                    
                    /* Font weight classes */
                    .basic-template .font-medium { font-weight: ${bodyWeight + 100} !important; }
                    .basic-template .font-semibold { font-weight: ${subheadingWeight} !important; }
                    .basic-template .font-bold { font-weight: ${headingWeight} !important; }
                    
                    /* Important: Force all elements */
                    .basic-template * { font-family: ${fontFamily} !important; }
                    
                    /* PDF MULTI-PAGE SYSTEM */
                    @page {
                        size: A4;
                        margin: 5mm 10mm;
                    }
                    
                    /* Page break settings */
                    .cv-section {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    
                    .cv-section-title {
                        break-after: avoid;
                        page-break-after: avoid;
                    }
                    
                    .cv-item {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    
                    /* Force page content to flow properly */
                    body {
                        margin: 0;
                        padding: 5mm;
                        line-height: 1.4;
                    }
                    
                    /* Adjust spacing for better page breaks */
                    .section-spacing {
                        margin-bottom: 8px;
                    }
                `
            });
            
            console.log('✅ BASIC TEMPLATE CSS INJECTION COMPLETED - SIMPLE VERSION');
        }
        
        // Azərbaycan dili və encoding dəstəyi üçün əlavə ayarlar
        await page.setExtraHTTPHeaders({
            'Accept-Charset': 'utf-8',
            'Accept-Language': 'az-AZ,az,tr-TR,tr,en-US,en'
        });

        // PDF yarat - Ultra minimal margin-lar, maksimal content sahəsi
        console.log('PDF yaradılır...');
        
        // Azərbaycan hərfləri üçün font-ları yüklə və unicode dəstəyini artır
        await page.addStyleTag({
            content: `
                @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
                
                * {
                    font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
                    -webkit-font-feature-settings: "liga", "kern" !important;
                    font-feature-settings: "liga", "kern" !important;
                    text-rendering: optimizeLegibility !important;
                    unicode-bidi: normal !important;
                    font-variant-ligatures: common-ligatures !important;
                    font-synthesis: weight style !important;
                }
                
                /* Azərbaycan dili xüsusi hərfləri üçün */
                body, h1, h2, h3, h4, h5, h6, p, span, div, li, td, th {
                    font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                }
            `
        });
        
        // Unicode və font rendering üçün əlavə ayarlar
        await page.evaluateOnNewDocument(() => {
            // Force UTF-8 encoding və Azərbaycan dili dəstəyi
            if (document.characterSet !== 'UTF-8') {
                const meta = document.querySelector('meta[charset]') || document.createElement('meta');
                meta.setAttribute('charset', 'UTF-8');
                meta.setAttribute('http-equiv', 'Content-Type');
                meta.setAttribute('content', 'text/html; charset=UTF-8');
                if (!document.head.contains(meta)) {
                    document.head.appendChild(meta);
                }
            }
            
            // Language və locale dəstəyi
            document.documentElement.setAttribute('lang', 'az-AZ');
            
            // Font rendering optimizasyonu
            const style = document.createElement('style');
            style.textContent = `
                * {
                    font-synthesis: weight style !important;
                    font-variant-ligatures: common-ligatures !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                    text-rendering: optimizeLegibility !important;
                    -webkit-font-feature-settings: "liga", "kern", "calt" !important;
                    font-feature-settings: "liga", "kern", "calt" !important;
                    -moz-font-feature-settings: "liga", "kern", "calt" !important;
                }
                
                /* Azərbaycan hərfləri üçün xüsusi optimizasiya */
                body, h1, h2, h3, h4, h5, h6, p, span, div, li, a, td, th, input, textarea, select, button {
                    font-family: 'Roboto', 'Open Sans', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                    text-rendering: optimizeLegibility !important;
                }
            `;
            document.head?.appendChild(style);
        });
        
        // Multi-page PDF support üçün CSS əlavə et
        await page.addStyleTag({
            content: `
                /* PDF Export Font Variables - fontSettings-dən gələn dəyərlər */
                :root {
                    --cv-font-family: ${fontSettings.fontFamily};
                    --cv-heading-size: ${fontSettings.headingSize}px;
                    --cv-subheading-size: ${fontSettings.subheadingSize}px;
                    --cv-body-size: ${fontSettings.bodySize}px;
                    --cv-small-size: ${fontSettings.smallSize}px;
                    --cv-heading-weight: ${fontSettings.headingWeight};
                    --cv-subheading-weight: ${fontSettings.subheadingWeight};
                    --cv-body-weight: ${fontSettings.bodyWeight};
                    --cv-small-weight: ${fontSettings.smallWeight};
                    --cv-line-height: 1.4;
                    --cv-section-spacing: ${fontSettings.sectionSpacing}px;
                    --cv-item-spacing: ${fontSettings.sectionSpacing}px;
                    --cv-small-spacing: ${fontSettings.sectionSpacing}px;
                }
                
                @page {
                    size: A4;
                    margin: 0; /* Bütün margin-lar sıfır */
                    padding: 0;
                }
                
                @page :first {
                    margin: 0; /* 1ci səhifədə də margin yox */
                }
                
                /* Səhifə arası boşluq yox */
                .cv-preview, .basic-template {
                    page-break-inside: auto;
                }
                
                /* Səhifə arası əlavə boşluq sil */
                .cv-preview > *,
                .basic-template > * {
                    margin-top: 0 !important;
                    page-break-before: auto;
                }
                
                /* PDF Multi-page fundamental rules for A4 */
                html {
                    height: auto !important;
                    overflow: visible !important;
                    font-size: var(--cv-body-size, 12pt) !important;
                }
                
                body {
                    height: auto !important;
                    min-height: auto !important;
                    overflow: visible !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    line-height: var(--cv-line-height, 1.4) !important;
                }
                
                /* PDF-də bütün container-lərin kənar boşluqlarını tamamilə sil */
                .cv-preview,
                .basic-template, 
                [class*="template"],
                .template-container,
                .cv-container {
                    margin: 0 !important;
                    padding: 0 !important; /* Tamamilə kənar boşluq yoxdur */
                    border: none !important;
                    box-shadow: none !important;
                }
                
                /* HƏTTA DAHA RADIKAL - Bütün div-lərin edge margin/padding-ini sil */
                body > div:first-child,
                html > body > *:first-child,
                [class*="container"]:first-child,
                .main:first-child {
                    margin: 0 !important;
                    padding: 0 !important;
                }
                
                /* Force multi-page behavior with A4 constraints */
                .basic-template {
                    width: 100% !important;
                    max-width: 180mm !important; /* A4 genişlik (210mm) - iki tərəfdən 15mm = 180mm */
                    height: auto !important;
                    min-height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                    page-break-after: auto !important;
                    break-after: auto !important;
                }
                
                /* A4 OPTIMIZED SECTION BREAK CONTROL */
                .cv-section,
                [class*="experience"],
                [class*="education"],
                [class*="project"],
                .space-y-6 > div,
                .space-y-4 > div {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    margin-bottom: 12px !important;
                }
                
                /* Allow very long sections to break intelligently */
                .cv-section-long,
                .experience-item,
                .education-item {
                    page-break-inside: auto;
                    break-inside: auto;
                }
                
                /* Prevent headers from being orphaned */
                h1, h2, h3, h4, h5, h6 {
                    page-break-after: avoid;
                    break-after: avoid;
                    page-break-inside: avoid;
                    break-inside: avoid;
                    orphans: 3;
                    widows: 3;
                }
                
                /* Optimize spacing for better page breaks */
                .mb-6, .mb-8 {
                    page-break-after: auto;
                    break-after: auto;
                }
                
                /* Keep related content together */
                .flex, .grid {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                
                /* BASIC TEMPLATE ULTIMATE HARDCODE KILLER */
                .basic-template .text-xs { font-size: var(--cv-small-size) !important; }
                .basic-template .text-sm { font-size: var(--cv-body-size) !important; }
                .basic-template .text-base { font-size: var(--cv-subheading-size) !important; }
                .basic-template .text-lg { font-size: var(--cv-subheading-size) !important; }
                .basic-template .text-xl { font-size: var(--cv-heading-size) !important; }
                .basic-template .text-2xl { font-size: var(--cv-heading-size) !important; }
                
                .basic-template .font-medium { font-weight: var(--cv-body-weight) !important; }
                .basic-template .font-semibold { font-weight: var(--cv-subheading-weight) !important; }
                .basic-template .font-bold { font-weight: var(--cv-heading-weight) !important; }
                
                .basic-template .mb-1 { margin-bottom: var(--cv-small-spacing) !important; }
                .basic-template .mb-2 { margin-bottom: var(--cv-item-spacing) !important; }
                .basic-template .mb-3 { margin-bottom: var(--cv-section-spacing) !important; }
                .basic-template .mt-1 { margin-top: var(--cv-small-spacing) !important; }
                .basic-template .mt-2 { margin-top: var(--cv-item-spacing) !important; }
                .basic-template .pl-2 { padding-left: var(--cv-item-spacing) !important; }
                .basic-template .pl-3 { padding-left: var(--cv-section-spacing) !important; }
                .basic-template .pb-1 { padding-bottom: var(--cv-small-spacing) !important; }
                .basic-template .pb-2 { padding-bottom: var(--cv-item-spacing) !important; }
                
                /* Bütün rənglər dinamik olmalıdır */
                .basic-template .text-blue-600 { color: #2563eb !important; }
                .basic-template .text-gray-700 { color: #374151 !important; }
                .basic-template .text-gray-600 { color: #6b7280 !important; }
                .basic-template .text-gray-900 { color: #111827 !important; }
                .basic-template .border-blue-200 { border-color: #bfdbfe !important; }
                .basic-template .border-gray-300 { border-color: #d1d5db !important; }
                
                /* CVPreview Tailwind class-larını override et */
                .cv-preview .text-xs { font-size: var(--cv-small-size) !important; }
                .cv-preview .text-sm { font-size: var(--cv-body-size) !important; }
                .cv-preview .text-base { font-size: var(--cv-subheading-size) !important; }
                .cv-preview .text-lg { font-size: var(--cv-subheading-size) !important; }
                .cv-preview .text-xl { font-size: var(--cv-heading-size) !important; }
                .cv-preview .text-2xl { font-size: var(--cv-heading-size) !important; }
                
                .cv-preview .font-medium { font-weight: var(--cv-body-weight) !important; }
                .cv-preview .font-semibold { font-weight: var(--cv-subheading-weight) !important; }
                .cv-preview .font-bold { font-weight: var(--cv-heading-weight) !important; }
                
                /* UNIVERSAL TAILWIND OVERRIDE - HƏR HANSĂ TEMPLATE ÜÇÜN */
                .text-xs { font-size: var(--cv-small-size) !important; }
                .text-sm { font-size: var(--cv-body-size) !important; }
                .text-base { font-size: var(--cv-subheading-size) !important; }
                .text-lg { font-size: var(--cv-subheading-size) !important; }
                .text-xl { font-size: var(--cv-heading-size) !important; }
                .text-2xl { font-size: var(--cv-heading-size) !important; }
                .text-3xl { font-size: var(--cv-name-size) !important; }
                .text-4xl { font-size: var(--cv-name-size) !important; }
                
                .font-medium { font-weight: var(--cv-body-weight) !important; }
                .font-semibold { font-weight: var(--cv-subheading-weight) !important; }
                .font-bold { font-weight: var(--cv-heading-weight) !important; }
            `
        });
        
        // CRITICAL: Wait for content to fully load and calculate height
        await page.waitForFunction(() => {
            return document.readyState === 'complete';
        }, { timeout: 15000 });
        
        // Check if template exists, if not continue anyway
        const templateExists = await page.evaluate(() => {
            const basicTemplate = document.querySelector('.basic-template');
            const anyTemplate = document.querySelector('[class*="template"]');
            const hasContent = document.body.children.length > 0;
            
            console.log('=== TEMPLATE DETECTION DEBUG ===');
            console.log('Basic template found:', !!basicTemplate);
            console.log('Any template found:', !!anyTemplate);
            console.log('Body has children:', hasContent, 'count:', document.body.children.length);
            
            return basicTemplate !== null || anyTemplate !== null || hasContent;
        });
        
        console.log('Template exists:', templateExists);
        
        // Force recalculation of layout
        if (templateExists) {
            await page.evaluate(() => {
                console.log('=== A4 PAGE BREAK ALGORITHM STARTING ===');
                
                // Force browser to recalculate layout 
                document.body.offsetHeight;
                
                // Add explicit page breaks if content is too long
                const template = document.querySelector('.basic-template') as HTMLElement ||
                                document.querySelector('[class*="template"]') as HTMLElement ||
                                document.body as HTMLElement;
                
                if (template) {
                    // A4 calculations with 8mm margins and 15mm bottom reserve
                    // A4 = 210mm x 297mm
                    // With 8mm margins: content area = 194mm x 281mm  
                    // With 15mm bottom reserve: usable height = 266mm
                    // At 96 DPI: 266mm ≈ 1008px, but conservatively use 950px
                    
                    const templateHeight = template.scrollHeight;
                    const a4UsableHeight = 950; // Conservative A4 height minus bottom reserve
                    const pageBreakThreshold = a4UsableHeight; // When to break to next page
                    
                    console.log('=== A4 PAGE CALCULATIONS ===');
                    console.log('Template total height:', templateHeight + 'px');
                    console.log('A4 usable height (with 15mm bottom reserve):', a4UsableHeight + 'px');
                    console.log('Needs multi-page:', templateHeight > a4UsableHeight);
                    
                    if (templateHeight > a4UsableHeight) {
                        console.log('Content exceeds A4 usable area - applying page breaks');
                        
                        // Ensure template can flow across pages
                        template.style.height = 'auto';
                        template.style.minHeight = 'auto';
                        template.style.maxHeight = 'none';
                        template.style.overflow = 'visible';
                        template.style.pageBreakInside = 'auto';
                        template.style.breakInside = 'auto';
                        
                        // Find all potential break points - prioritize logical content boundaries
                        const allElements = template.querySelectorAll(`
                            div, section, p, h1, h2, h3, h4, h5, h6,
                            .space-y-6 > *,
                            .space-y-4 > *,
                            .mb-6, .mb-8, .mt-6, .mt-8,
                            [class*="experience"],
                            [class*="education"], 
                            [class*="project"],
                            [class*="skill"]
                        `);
                        
                        console.log('Found', allElements.length, 'potential break elements');
                        
                        let currentPageHeight = 0;
                        let pageNumber = 1;
                        let pageBreaksAdded = 0;
                        
                        allElements.forEach((element, index) => {
                            const htmlElement = element as HTMLElement;
                            const elementTop = htmlElement.offsetTop;
                            const elementHeight = htmlElement.offsetHeight;
                            
                            // Enhanced debug info
                            if (index < 10 || elementTop > (pageNumber * pageBreakThreshold - 100)) {
                                console.log(`Element ${index}: ${htmlElement.tagName}.${htmlElement.className} at ${elementTop}px, height: ${elementHeight}px`);
                            }
                            
                            // Check if this element would exceed current page
                            if (elementTop > 0 && elementTop > (pageNumber * pageBreakThreshold)) {
                                // Add page break before this element
                                htmlElement.style.pageBreakBefore = 'always';
                                htmlElement.style.breakBefore = 'page';
                                pageBreaksAdded++;
                                pageNumber++;
                                
                                console.log(`🔥 PAGE BREAK ${pageBreaksAdded}: Added before element at ${elementTop}px (moving to Page ${pageNumber})`);
                                console.log(`   Element: ${htmlElement.tagName}.${htmlElement.className}`);
                                console.log(`   Break threshold was: ${(pageNumber-1) * pageBreakThreshold}px`);
                                console.log(`   Next break will be at: ${pageNumber * pageBreakThreshold}px`);
                            }
                        });
                        
                        console.log('Total page breaks added:', pageBreaksAdded);
                        console.log('Estimated pages:', pageNumber);
                        
                        // Additional safety: force breaks at fixed intervals if still too long
                        if (templateHeight > pageBreakThreshold * 3) {
                            console.log('Applying safety breaks every', pageBreakThreshold, 'px');
                            
                            const allDivs = template.querySelectorAll('div, section');
                            allDivs.forEach((div) => {
                                const htmlDiv = div as HTMLElement;
                                const divTop = htmlDiv.offsetTop;
                                
                                // Add breaks near multiples of pageBreakThreshold
                                if (divTop > 0) {
                                    const pagePosition = divTop % pageBreakThreshold;
                                    const nextPageStart = Math.floor(divTop / pageBreakThreshold + 1) * pageBreakThreshold;
                                    
                                    // If we're close to the end of a page, break to next page
                                    if (pagePosition > (pageBreakThreshold - 100)) {
                                        htmlDiv.style.pageBreakBefore = 'always';
                                        htmlDiv.style.breakBefore = 'page';
                                    }
                                }
                            });
                        }
                        
                        console.log('=== A4 PAGE BREAK ALGORITHM COMPLETED ===');
                    } else {
                        console.log('Content fits in single A4 page, no breaks needed');
                    }
                } else {
                    console.log('No template element found for page break processing');
                }
            });
        } else {
            console.log('Template does not exist, skipping page break logic');
        }

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,  // CSS @page ayarlarını istifadə et - ÇOX VACIB!
            displayHeaderFooter: false,
            // Unicode və font support üçün əlavə ayarlar
            tagged: true,  // PDF/A accessibility və unicode dəstəyi
            outline: false,
            omitBackground: false,  // Background-ları qoruyub saxla
            // PDF margin-ları sıfır - kənar boşluq yox
            margin: {
                top: '0mm',
                right: '0mm', 
                bottom: '0mm',
                left: '0mm'
            },
            scale: 1,
            // Multi-page support - CRITICAL FOR A4 PAGINATION  
            pageRanges: '',  // Boş string = bütün səhifələr
            // A4 tam ölçü - kənar boşluq yoxdur
            width: '210mm',   // A4 tam genişlik
            height: '297mm'   // A4 tam hündürlük
        });

        console.log('PDF yaradıldı, browser bağlanır...');
        await browser.close();

        // PDF faylını geri qaytar
        console.log('PDF response qaytarılır, ölçü:', pdfBuffer.length, 'bytes');
        return new NextResponse(Buffer.from(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="CV-${cvId}.pdf"`,
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('PDF export xətası:', error);
        
        // Browser cleanup if it was opened
        if (browser) {
            try {
                await browser.close();
                console.log('Browser cleaned up after error');
            } catch (cleanupError) {
                console.error('Browser cleanup error:', cleanupError);
            }
        }
        
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `PDF export xətası: ${errorMsg}` }, 
            { status: 500 }
        );
    }
}

function generateCVHTML(cvData: any, templateId: string, fontSettings?: any): string {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [] } = cvData;

    console.log('=== generateCVHTML çağırıldı ===');
    console.log('Template ID:', templateId);
    console.log('Font Settings (gələn):', fontSettings);

    // Default font settings - FULL DYNAMIC
    const defaultFontSettings = {
        fontFamily: 'Arial, sans-serif',
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12,
        // Dynamic Colors
        primaryColor: '#1f2937',
        secondaryColor: '#6b7280', 
        textColor: '#374151',
        lightColor: '#f9fafb',
        borderColor: '#e5e7eb',
        // Dynamic Spacing
        spacingXs: '0.25rem',
        spacingSm: '0.5rem', 
        spacingMd: '1rem',
        spacingLg: '1.5rem',
        spacingXl: '2rem'
    };
    
    const fonts = { ...defaultFontSettings, ...fontSettings };
    console.log('Final font settings (merged):', fonts);

    // Utility functions for HTML generation
    const stripHtmlTags = (html: string): string => {
        if (!html) return '';
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        if (dateStr.toLowerCase() === 'present' || dateStr.toLowerCase() === 'hazırda') {
            return 'Hazırda';
        }
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('az-AZ', { month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Generate CV HTML based on template
    let cvHTML = '';
    
    // Professional PDF üçün CSS style-lar - minimal margins
    const pdfStyles = `
        <style>
            :root {
                --cv-font-family: ${fonts.fontFamily};
                --cv-heading-size: ${fonts.headingSize}px;
                --cv-subheading-size: ${fonts.subheadingSize}px;
                --cv-body-size: ${fonts.bodySize}px;
                --cv-small-size: ${fonts.smallSize}px;
                --cv-primary-color: ${fonts.primaryColor};
                --cv-secondary-color: ${fonts.secondaryColor};
                --cv-text-color: ${fonts.textColor};
                --cv-light-color: ${fonts.lightColor};
                --cv-border-color: ${fonts.borderColor};
                --cv-spacing-xs: ${fonts.spacingXs};
                --cv-spacing-sm: ${fonts.spacingSm};
                --cv-spacing-md: ${fonts.spacingMd};
                --cv-spacing-lg: ${fonts.spacingLg};
                --cv-spacing-xl: ${fonts.spacingXl};
            }
            
            @page {
                size: A4;
                margin: 0 !important; /* SIFIR MARGIN - TAMAMI PDF ÜÇÜN */
                padding: 0 !important;
                border: none !important;
            }
            
            body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                box-sizing: border-box !important;
                font-family: var(--cv-font-family) !important;
                font-size: var(--cv-body-size) !important;
                color: var(--cv-text-color) !important;
                -webkit-font-feature-settings: "liga", "kern", "clig" !important;
                font-feature-settings: "liga", "kern", "clig" !important;
                text-rendering: optimizeLegibility;
                unicode-bidi: normal;
                direction: ltr;
                font-variant-ligatures: common-ligatures;
                font-synthesis: weight style;
            }
            
            h1, h2, h3, h4, h5, h6, p, span, div, li, td, th {
                font-family: var(--cv-font-family) !important;
                color: var(--cv-text-color) !important;
                unicode-bidi: normal !important;
                text-rendering: optimizeLegibility !important;
                direction: ltr !important;
                font-variant-ligatures: common-ligatures !important;
                margin: 0 !important;
            }
            
            /* DYNAMIC FONT SIZES - NO SCALE FACTORS */
            h1 { font-size: var(--cv-heading-size) !important; color: var(--cv-primary-color) !important; }
            h2 { font-size: var(--cv-heading-size) !important; color: var(--cv-primary-color) !important; }
            h3 { font-size: var(--cv-subheading-size) !important; color: var(--cv-primary-color) !important; }
            h4, h5, h6 { font-size: var(--cv-subheading-size) !important; color: var(--cv-primary-color) !important; }
            p, span, div, li, td, th { font-size: var(--cv-body-size) !important; }
            
            /* UNIVERSAL TEXT SIZE CLASSES - NO SCALE FACTORS */
            .text-xs { font-size: var(--cv-small-size) !important; }
            .text-sm { font-size: var(--cv-small-size) !important; }
            .text-base { font-size: var(--cv-body-size) !important; }
            .text-lg { font-size: var(--cv-subheading-size) !important; }
            .text-xl { font-size: var(--cv-heading-size) !important; }
            .text-2xl { font-size: var(--cv-heading-size) !important; }
            .text-3xl { font-size: var(--cv-heading-size) !important; }
            
            /* UNIVERSAL MARGIN CLASSES - DİNAMİK */
            .m-0 { margin: 0 !important; }
            .mb-1 { margin-bottom: var(--cv-spacing-xs) !important; }
            .mb-2 { margin-bottom: var(--cv-spacing-sm) !important; }
            .mb-4 { margin-bottom: var(--cv-spacing-md) !important; }
            .mb-6 { margin-bottom: var(--cv-spacing-lg) !important; }
            .mb-8 { margin-bottom: var(--cv-spacing-xl) !important; }
            
            /* UNIVERSAL PADDING CLASSES - DİNAMİK */
            .p-0 { padding: 0 !important; }
            .pb-1 { padding-bottom: var(--cv-spacing-xs) !important; }
            .pb-4 { padding-bottom: var(--cv-spacing-md) !important; }
            .px-4 { padding-left: var(--cv-spacing-md) !important; padding-right: var(--cv-spacing-md) !important; }
            .py-8 { padding-top: var(--cv-spacing-xl) !important; padding-bottom: var(--cv-spacing-xl) !important; }
            
            /* UNIVERSAL FONT WEIGHTS - DİNAMİK */
            .font-bold { font-weight: 700 !important; }
            .font-medium { font-weight: 500 !important; }
            .font-normal { font-weight: 400 !important; }
            .italic { font-style: italic !important; }
            
            /* UNIVERSAL LAYOUT CLASSES - DİNAMİK */
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .items-start { align-items: flex-start !important; }
            .leading-relaxed { line-height: 1.625 !important; }
            .leading-snug { line-height: 1.375 !important; }
            
            /* UNIVERSAL BORDER CLASSES - DİNAMİK */
            .border-b { border-bottom: 1px solid var(--cv-border-color) !important; }
            .border-b-2 { border-bottom: 2px solid var(--cv-border-color) !important; }
            
            /* UNIVERSAL TEXT ALIGNMENT - DİNAMİK */
            .text-center { text-align: center !important; }
            .text-left { text-align: left !important; }
            .text-right { text-align: right !important; }
            
            /* CONTAINER UNIVERSAL OVERRIDES */
            .cv-container, .container, .max-w-4xl, .w-full {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            
            .cv-section {
                page-break-inside: avoid;
                margin-bottom: var(--cv-spacing-lg) !important;
            }
            
            .cv-section h2, .cv-section h3 {
                page-break-after: avoid;
            }
            
            .avoid-break {
                page-break-inside: avoid;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            /* Exclusive Template üçün əlavə page-break qaydaları */
            .exclusive-template .cv-section,
            .exclusive-template [key] {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* Section headers heç vaxt tək qalmasın */
            .exclusive-template h2[class*="text-sm"],
            .exclusive-template h2[class*="font-bold"] {
                page-break-after: avoid !important;
                keep-with-next: always !important;
            }
            
            /* Experience, education item-ları */
            .exclusive-template div[class*="p-3"],
            .exclusive-template div[class*="p-4"] {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            /* Section container-ları */
            .exclusive-template div[class*="mb-4"] {
                page-break-inside: avoid !important;
                orphans: 2 !important;
                widows: 2 !important;
            }
            
            /* Skills section - birlikdə qalsın */
            .exclusive-template div[key="skills"],
            .exclusive-template div[key="technical-skills"],
            .exclusive-template div[key="soft-skills"] {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
            
            .cv-preview {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }
        </style>
    `;

    // Traditional template fallback
    cvHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            ${pdfStyles}
        </head>
        <body>
        <div class="cv-preview max-w-full mx-auto p-0 leading-snug" style="
            font-family: var(--cv-font-family); 
            font-size: var(--cv-body-size); 
            color: var(--cv-text-color); 
            width: 100%;
            max-width: none;
        ">
            <!-- Header -->
            <div class="cv-section avoid-break text-center mb-8 border-b-2 pb-4" style="border-color: var(--cv-primary-color);">
                <h1 style="color: var(--cv-primary-color); font-size: var(--cv-heading-size); font-weight: bold; margin: 0; margin-bottom: var(--cv-spacing-sm);">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                <div style="color: var(--cv-secondary-color); font-size: var(--cv-small-size);">
                    ${personalInfo.email ? `${personalInfo.email}` : ''}
                    ${personalInfo.phone ? ` | ${personalInfo.phone}` : ''}
                    ${personalInfo.location ? ` | ${personalInfo.location}` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${personalInfo.summary ? `
            <div class="cv-section mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-border-color); padding-bottom: var(--cv-spacing-xs);">
                    ÖZƏT
                </h2>
                <p style="color: var(--cv-text-color); font-size: var(--cv-body-size); line-height: 1.5; margin: 0;">
                    ${stripHtmlTags(personalInfo.summary)}
                </p>
            </div>
            ` : ''}

            <!-- Experience -->
            ${experience.length > 0 ? `
            <div class="cv-section mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-border-color); padding-bottom: var(--cv-spacing-xs);">
                    İŞ TƏCRÜBƏSİ
                </h2>
                ${experience.map((exp: any) => `
                <div class="avoid-break mb-4">
                    <div class="flex justify-between items-start mb-1">
                        <h3 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin: 0;">${exp.position}</h3>
                        <span style="color: var(--cv-secondary-color); font-size: var(--cv-small-size);">
                            ${formatDate(exp.startDate)} - ${exp.current ? 'Hazırda' : formatDate(exp.endDate || '')}
                        </span>
                    </div>
                    <p style="color: var(--cv-text-color); font-size: var(--cv-small-size); font-style: italic; margin: 0; margin-bottom: var(--cv-spacing-xs);">${exp.company}</p>
                    ${exp.description ? `<p style="color: var(--cv-text-color); font-size: var(--cv-small-size); line-height: 1.4; margin: 0;">${stripHtmlTags(exp.description)}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Education -->
            ${education.length > 0 ? `
            <div class="cv-section mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-border-color); padding-bottom: var(--cv-spacing-xs);">
                    TƏHSİL
                </h2>
                ${education.map((edu: any) => `
                <div class="avoid-break mb-2">
                    <div class="flex justify-between items-start mb-1">
                        <h3 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin: 0;">${edu.degree}</h3>
                        <span style="color: var(--cv-secondary-color); font-size: var(--cv-small-size);">
                            ${formatDate(edu.startDate)} - ${edu.current ? 'Hazırda' : formatDate(edu.endDate || '')}
                        </span>
                    </div>
                    <p style="color: var(--cv-text-color); font-size: var(--cv-small-size); margin: 0;">${edu.institution}</p>
                    ${edu.field ? `<p style="color: var(--cv-secondary-color); font-size: var(--cv-small-size); margin: 0;">${edu.field}</p>` : ''}
                    ${edu.gpa ? `<p style="color: var(--cv-secondary-color); font-size: var(--cv-small-size); margin: 0;">GPA: ${edu.gpa}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Skills -->
            ${skills.length > 0 ? `
            <div class="cv-section avoid-break mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-border-color); padding-bottom: var(--cv-spacing-xs);">
                    BACARIQLAR
                </h2>
                <p style="color: var(--cv-text-color); font-size: var(--cv-body-size); line-height: 1.4; margin: 0;">
                    ${skills.map((skill: any) => skill.name).join(', ')}
                </p>
            </div>
            ` : ''}

            <!-- Languages -->
            ${languages.length > 0 ? `
            <div class="cv-section avoid-break mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-border-color); padding-bottom: var(--cv-spacing-xs);">
                    DİLLƏR
                </h2>
                <p style="color: var(--cv-text-color); font-size: var(--cv-body-size); line-height: 1.4; margin: 0;">
                    ${languages.map((lang: any) => `${lang.language} (${lang.level})`).join(', ')}
                </p>
            </div>
            ` : ''}
        </div>
        </body>
        </html>
    `;

    return cvHTML;
}