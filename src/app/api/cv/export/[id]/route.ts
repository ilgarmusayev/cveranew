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
                        
                        /* ROUTE.TS ƏLAVƏ CSS - LAYOUT VE FONT SISTEMI */
                        
                        /* CONSISTENT LAYOUT SYSTEM - PREVIEW İLƏ EYNI */
                        
                        /* A4 Layout - Template öz padding-i verir */
                        .cv-layout-container,
                        .cv-preview {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        .cv-template {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 20mm !important;
                            box-sizing: border-box !important;
                            background: white !important;
                        }
                        
                        /* CSS Variables - Font Manager Integration */
                        :root, body {
                            --cv-font-family: ${fontSettings?.fontFamily || 'Inter, sans-serif'};
                            --cv-heading-size: ${fontSettings?.headingSize || 24}px;
                            --cv-subheading-size: ${fontSettings?.subheadingSize || 16}px;
                            --cv-body-size: ${fontSettings?.bodySize || 14}px;
                            --cv-small-size: ${fontSettings?.smallSize || 12}px;
                        }
                        
                        /* Global font family override - dinamik olaraq */
                        * {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* UNIVERSAL DYNAMIC FONT SYSTEM - BÜTÜN TEMPLATE-LƏR ÜÇÜN */
                        
                        /* Font Family - Bütün template-lər */
                        .aurora-template *, .vertex-template *, .horizon-template *, 
                        .lumen-template *, .modern-template *, .exclusive-template *, 
                        .ats-template *, .basic-template *, .traditional-template *, 
                        .classic-template * {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Heading Sizes - Dinamik H1, H2, H3 */
                        .aurora-template h1, .vertex-template h1, .horizon-template h1,
                        .lumen-template h1, .modern-template h1, .exclusive-template h1,
                        .ats-template h1, .basic-template h1, .traditional-template h1,
                        .classic-template h1 {
                            font-size: calc(var(--cv-heading-size) * 1.33) !important; /* ~32px */
                            line-height: 1.2 !important;
                        }
                        
                        .aurora-template h2, .vertex-template h2, .horizon-template h2,
                        .lumen-template h2, .modern-template h2, .exclusive-template h2,
                        .ats-template h2, .basic-template h2, .traditional-template h2,
                        .classic-template h2 {
                            font-size: var(--cv-heading-size) !important; /* 24px default */
                            line-height: 1.3 !important;
                        }
                        
                        .aurora-template h3, .vertex-template h3, .horizon-template h3,
                        .lumen-template h3, .modern-template h3, .exclusive-template h3,
                        .ats-template h3, .basic-template h3, .traditional-template h3,
                        .classic-template h3 {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important; /* ~18px */
                            line-height: 1.4 !important;
                        }
                        
                        .aurora-template h4, .vertex-template h4, .horizon-template h4,
                        .lumen-template h4, .modern-template h4, .exclusive-template h4,
                        .ats-template h4, .basic-template h4, .traditional-template h4,
                        .classic-template h4 {
                            font-size: var(--cv-subheading-size) !important; /* 16px default */
                            line-height: 1.5 !important;
                        }
                        
                        /* Text Size Classes - Dinamik Tailwind */
                        .aurora-template .text-5xl, .vertex-template .text-5xl, .horizon-template .text-5xl,
                        .lumen-template .text-5xl, .modern-template .text-5xl, .exclusive-template .text-5xl,
                        .ats-template .text-5xl, .basic-template .text-5xl, .traditional-template .text-5xl,
                        .classic-template .text-5xl {
                            font-size: calc(var(--cv-heading-size) * 2) !important; /* ~48px */
                            line-height: 1.2 !important;
                        }
                        
                        .aurora-template .text-4xl, .vertex-template .text-4xl, .horizon-template .text-4xl,
                        .lumen-template .text-4xl, .modern-template .text-4xl, .exclusive-template .text-4xl,
                        .ats-template .text-4xl, .basic-template .text-4xl, .traditional-template .text-4xl,
                        .classic-template .text-4xl {
                            font-size: calc(var(--cv-heading-size) * 1.5) !important; /* ~36px */
                            line-height: 1.2 !important;
                        }
                        
                        .aurora-template .text-3xl, .vertex-template .text-3xl, .horizon-template .text-3xl,
                        .lumen-template .text-3xl, .modern-template .text-3xl, .exclusive-template .text-3xl,
                        .ats-template .text-3xl, .basic-template .text-3xl, .traditional-template .text-3xl,
                        .classic-template .text-3xl {
                            font-size: calc(var(--cv-heading-size) * 1.25) !important; /* ~30px */
                            line-height: 1.3 !important;
                        }
                        
                        .aurora-template .text-2xl, .vertex-template .text-2xl, .horizon-template .text-2xl,
                        .lumen-template .text-2xl, .modern-template .text-2xl, .exclusive-template .text-2xl,
                        .ats-template .text-2xl, .basic-template .text-2xl, .traditional-template .text-2xl,
                        .classic-template .text-2xl {
                            font-size: var(--cv-heading-size) !important; /* 24px default */
                            line-height: 1.3 !important;
                        }
                        
                        .aurora-template .text-xl, .vertex-template .text-xl, .horizon-template .text-xl,
                        .lumen-template .text-xl, .modern-template .text-xl, .exclusive-template .text-xl,
                        .ats-template .text-xl, .basic-template .text-xl, .traditional-template .text-xl,
                        .classic-template .text-xl {
                            font-size: calc(var(--cv-heading-size) * 0.83) !important; /* ~20px */
                            line-height: 1.4 !important;
                        }
                        
                        .aurora-template .text-lg, .vertex-template .text-lg, .horizon-template .text-lg,
                        .lumen-template .text-lg, .modern-template .text-lg, .exclusive-template .text-lg,
                        .ats-template .text-lg, .basic-template .text-lg, .traditional-template .text-lg,
                        .classic-template .text-lg {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important; /* ~18px */
                            line-height: 1.4 !important;
                        }
                        
                        .aurora-template .text-base, .vertex-template .text-base, .horizon-template .text-base,
                        .lumen-template .text-base, .modern-template .text-base, .exclusive-template .text-base,
                        .ats-template .text-base, .basic-template .text-base, .traditional-template .text-base,
                        .classic-template .text-base {
                            font-size: var(--cv-subheading-size) !important; /* 16px default */
                            line-height: 1.5 !important;
                        }
                        
                        .aurora-template .text-sm, .vertex-template .text-sm, .horizon-template .text-sm,
                        .lumen-template .text-sm, .modern-template .text-sm, .exclusive-template .text-sm,
                        .ats-template .text-sm, .basic-template .text-sm, .traditional-template .text-sm,
                        .classic-template .text-sm {
                            font-size: var(--cv-body-size) !important; /* 14px default */
                            line-height: 1.4 !important;
                        }
                        
                        .aurora-template .text-xs, .vertex-template .text-xs, .horizon-template .text-xs,
                        .lumen-template .text-xs, .modern-template .text-xs, .exclusive-template .text-xs,
                        .ats-template .text-xs, .basic-template .text-xs, .traditional-template .text-xs,
                        .classic-template .text-xs {
                            font-size: var(--cv-small-size) !important; /* 12px default */
                            line-height: 1.3 !important;
                        }
                        
                        /* Font Weights - Dinamik */
                        .aurora-template .font-bold, .vertex-template .font-bold, .horizon-template .font-bold,
                        .lumen-template .font-bold, .modern-template .font-bold, .exclusive-template .font-bold,
                        .ats-template .font-bold, .basic-template .font-bold, .traditional-template .font-bold,
                        .classic-template .font-bold {
                            font-weight: 700 !important;
                        }
                        
                        .aurora-template .font-semibold, .vertex-template .font-semibold, .horizon-template .font-semibold,
                        .lumen-template .font-semibold, .modern-template .font-semibold, .exclusive-template .font-semibold,
                        .ats-template .font-semibold, .basic-template .font-semibold, .traditional-template .font-semibold,
                        .classic-template .font-semibold {
                            font-weight: 600 !important;
                        }
                        
                        .aurora-template .font-medium, .vertex-template .font-medium, .horizon-template .font-medium,
                        .lumen-template .font-medium, .modern-template .font-medium, .exclusive-template .font-medium,
                        .ats-template .font-medium, .basic-template .font-medium, .traditional-template .font-medium,
                        .classic-template .font-medium {
                            font-weight: 500 !important;
                        }
                        
                        .aurora-template .font-normal, .vertex-template .font-normal, .horizon-template .font-normal,
                        .lumen-template .font-normal, .modern-template .font-normal, .exclusive-template .font-normal,
                        .ats-template .font-normal, .basic-template .font-normal, .traditional-template .font-normal,
                        .classic-template .font-normal {
                            font-weight: 400 !important;
                        }
                        
                        /* Template Specific Dynamic Overrides */
                        
                        /* Aurora Template */
                        .aurora-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Vertex Template */
                        .vertex-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Horizon Template */
                        .horizon-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Lumen Template */
                        .lumen-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Modern Template */
                        .modern-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* ATS Template */
                        .ats-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Basic Template */
                        .basic-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Traditional Template */
                        .traditional-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* Classic Template */
                        .classic-template {
                            font-family: var(--cv-font-family) !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE SPESIFIK EXPORT FIXES */
                        
                        /* Font weights - dinamik export üçün */
                        .exclusive-template .font-bold,
                        .exclusive-template h1,
                        .exclusive-template h2,
                        .exclusive-template .text-5xl {
                            font-weight: 700 !important;
                        }
                        
                        .exclusive-template .font-semibold,
                        .exclusive-template h3 {
                            font-weight: 600 !important;
                        }
                        
                        .exclusive-template .font-medium {
                            font-weight: 500 !important;
                        }
                        
                        /* Personal info background - mavi gradient */
                        .exclusive-template .bg-gradient-to-r.from-blue-50.to-indigo-50 {
                            background: linear-gradient(to right, #eff6ff, #eef2ff) !important;
                        }
                        
                        .exclusive-template .bg-gradient-to-r {
                            background: linear-gradient(to right, #eff6ff, #eef2ff) !important;
                        }
                        
                        /* Personal info border */
                        .exclusive-template .border-blue-200 {
                            border-color: #dbeafe !important;
                        }
                        
                        /* Dynamic font sizes - CSS Variables based */
                        .exclusive-template .text-5xl {
                            font-size: calc(var(--cv-heading-size) * 2) !important;
                            line-height: 1.2 !important;
                        }
                        
                        .exclusive-template .text-2xl {
                            font-size: var(--cv-heading-size) !important;
                            line-height: 1.3 !important;
                        }
                        
                        .exclusive-template .text-lg {
                            font-size: calc(var(--cv-subheading-size) * 1.125) !important;
                            line-height: 1.4 !important;
                        }
                        
                        .exclusive-template .text-base {
                            font-size: var(--cv-subheading-size) !important;
                            line-height: 1.5 !important;
                        }
                        
                        .exclusive-template .text-sm {
                            font-size: var(--cv-body-size) !important;
                            line-height: 1.4 !important;
                        }
                        
                        .exclusive-template .text-xs {
                            font-size: var(--cv-small-size) !important;
                            line-height: 1.3 !important;
                        }
                        
                        /* PERSONAL INFO SECTION - COMPLETE PREVIEW MATCH */
                        
                        /* Main header container */
                        .exclusive-template .p-6 {
                            padding: 1.5rem !important;
                        }
                        
                        .exclusive-template .mb-6 {
                            margin-bottom: 1.5rem !important;
                        }
                        
                        .exclusive-template .rounded-lg {
                            border-radius: 0.5rem !important;
                        }
                        
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
                        
                        /* Profile image */
                        .exclusive-template .flex-shrink-0 {
                            flex-shrink: 0 !important;
                        }
                        
                        .exclusive-template .relative {
                            position: relative !important;
                        }
                        
                        .exclusive-template .w-28 {
                            width: 7rem !important;
                        }
                        
                        .exclusive-template .h-28 {
                            height: 7rem !important;
                        }
                        
                        .exclusive-template .rounded-full {
                            border-radius: 9999px !important;
                        }
                        
                        .exclusive-template .object-cover {
                            object-fit: cover !important;
                        }
                        
                        .exclusive-template .shadow-lg {
                            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1) !important;
                        }
                        
                        .exclusive-template .border-4 {
                            border-width: 4px !important;
                        }
                        
                        .exclusive-template .border-white {
                            border-color: white !important;
                        }
                        
                        /* Decorative border */
                        .exclusive-template .absolute {
                            position: absolute !important;
                        }
                        
                        .exclusive-template .inset-0 {
                            top: 0px !important;
                            right: 0px !important;
                            bottom: 0px !important;
                            left: 0px !important;
                        }
                        
                        .exclusive-template .border-2 {
                            border-width: 2px !important;
                        }
                        
                        .exclusive-template .border-blue-600 {
                            border-color: #2563eb !important;
                        }
                        
                        .exclusive-template .opacity-20 {
                            opacity: 0.2 !important;
                        }
                        
                        /* Name and title section */
                        .exclusive-template .flex-1 {
                            flex: 1 1 0% !important;
                        }
                        
                        .exclusive-template .text-left {
                            text-align: left !important;
                        }
                        
                        .exclusive-template .mb-3 {
                            margin-bottom: 0.75rem !important;
                        }
                        
                        .exclusive-template .tracking-wide {
                            letter-spacing: 0.025em !important;
                        }
                        
                        .exclusive-template .text-gray-900 {
                            color: #111827 !important;
                        }
                        
                        .exclusive-template .text-gray-600 {
                            color: #4b5563 !important;
                        }
                        
                        /* Contact info section */
                        .exclusive-template .border-t {
                            border-top-width: 1px !important;
                            border-top-style: solid !important;
                        }
                        
                        .exclusive-template .pt-4 {
                            padding-top: 1rem !important;
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
                        
                        /* A4 page setup - PDF margin-ları 0 çünki template öz padding-i var */
                        @page {
                            size: A4;
                            margin: 0mm; /* Margin yoxdur - template özü 20mm padding verir */
                        }
                        
                        /* CV Container - otomatik səhifə keçidi */
                        .cv-template {
                            width: 210mm !important; /* Tam A4 eni */
                            min-height: 297mm !important; /* Tam A4 hündürlüyü */
                            height: auto !important;
                            page-break-inside: auto !important; /* İçerik çox olsa növbəti səhifəyə keçsin */
                            break-inside: auto !important;
                            margin: 0 !important;
                            padding: 20mm !important; /* Template öz 20mm padding-ini verir */
                            box-sizing: border-box !important;
                        }
                        
                        /* CV Preview container */
                        .cv-preview {
                            width: 210mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* SMART SECTION BREAKS - Məzmun əsaslı qırılmalar */
                        
                        /* Kiçik section-lar - birgə qalsın */
                        .aurora-template .mb-4, .vertex-template .mb-4, .horizon-template .mb-4,
                        .lumen-template .mb-4, .modern-template .mb-4, .exclusive-template .mb-4,
                        .ats-template .mb-4, .basic-template .mb-4, .traditional-template .mb-4,
                        .classic-template .mb-4 {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            margin-bottom: 4mm !important; /* Consistent 4mm spacing */
                        }
                        
                        /* Böyük section-lar - lazımsa keçid icazə ver */
                        .aurora-template .mb-6, .vertex-template .mb-6, .horizon-template .mb-6,
                        .lumen-template .mb-6, .modern-template .mb-6, .exclusive-template .mb-6,
                        .ats-template .mb-6, .basic-template .mb-6, .traditional-template .mb-6,
                        .classic-template .mb-6 {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                            orphans: 2 !important; /* Minimum 2 sətir qırılmadan əvvəl */
                            widows: 2 !important; /* Minimum 2 sətir qırılmadan sonra */
                            margin-bottom: 6mm !important; /* Consistent 6mm spacing for larger sections */
                        }
                        
                        /* HEADER PROTECTION - Başlıqlar tək qalmasın */
                        .aurora-template h1, .vertex-template h1, .horizon-template h1,
                        .lumen-template h1, .modern-template h1, .exclusive-template h1,
                        .ats-template h1, .basic-template h1, .traditional-template h1,
                        .classic-template h1,
                        .aurora-template h2, .vertex-template h2, .horizon-template h2,
                        .lumen-template h2, .modern-template h2, .exclusive-template h2,
                        .ats-template h2, .basic-template h2, .traditional-template h2,
                        .classic-template h2,
                        .aurora-template h3, .vertex-template h3, .horizon-template h3,
                        .lumen-template h3, .modern-template h3, .exclusive-template h3,
                        .ats-template h3, .basic-template h3, .traditional-template h3,
                        .classic-template h3,
                        .aurora-template .text-2xl, .vertex-template .text-2xl, .horizon-template .text-2xl,
                        .lumen-template .text-2xl, .modern-template .text-2xl, .exclusive-template .text-2xl,
                        .ats-template .text-2xl, .basic-template .text-2xl, .traditional-template .text-2xl,
                        .classic-template .text-2xl {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                            margin-bottom: 2mm !important; /* Consistent 2mm after headers */
                        }
                        
                        /* ITEM LEVEL PROTECTION - Individual items */
                        .aurora-template .space-y-2 > div, .vertex-template .space-y-2 > div, .horizon-template .space-y-2 > div,
                        .lumen-template .space-y-2 > div, .modern-template .space-y-2 > div, .exclusive-template .space-y-2 > div,
                        .ats-template .space-y-2 > div, .basic-template .space-y-2 > div, .traditional-template .space-y-2 > div,
                        .classic-template .space-y-2 > div,
                        .aurora-template .space-y-3 > div, .vertex-template .space-y-3 > div, .horizon-template .space-y-3 > div,
                        .lumen-template .space-y-3 > div, .modern-template .space-y-3 > div, .exclusive-template .space-y-3 > div,
                        .ats-template .space-y-3 > div, .basic-template .space-y-3 > div, .traditional-template .space-y-3 > div,
                        .classic-template .space-y-3 > div {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* Larger sections that can break - işiniz çoxsa səhifə dəyişsin */
                        .aurora-template .space-y-4 > div, .vertex-template .space-y-4 > div, .horizon-template .space-y-4 > div,
                        .lumen-template .space-y-4 > div, .modern-template .space-y-4 > div, .exclusive-template .space-y-4 > div,
                        .ats-template .space-y-4 > div, .basic-template .space-y-4 > div, .traditional-template .space-y-4 > div,
                        .classic-template .space-y-4 > div {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                        }
                        
                        /* PERSONAL INFO PROTECTION - Şəxsi məlumat hissəsi */
                        .aurora-template .mb-6:first-child, .vertex-template .mb-6:first-child, .horizon-template .mb-6:first-child,
                        .lumen-template .mb-6:first-child, .modern-template .mb-6:first-child, .exclusive-template .mb-6:first-child,
                        .ats-template .mb-6:first-child, .basic-template .mb-6:first-child, .traditional-template .mb-6:first-child,
                        .classic-template .mb-6:first-child,
                        .personal-info-section, .header-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* MANUAL CONTROL CLASSES */
                        .force-page-break {
                            page-break-before: always !important;
                            break-before: page !important;
                            margin-top: 8mm !important; /* Növbəti səhifədə yuxarıdan boşluq */
                            padding-top: 0 !important;
                        }
                        
                        .avoid-page-break {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        .allow-page-break {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                        }
                        
                        /* PAGE SPACING SYSTEM - PREVIEW İLƏ EYNI GÖRÜNÜM */
                        
                        /* Content that naturally flows to next page gets spacing */
                        .cv-template > div:first-child {
                            margin-top: 0 !important; /* İlk səhifə yuxarıdan boşluq yoxdur */
                        }
                        
                        /* Natural page breaks - automatic content flow */
                        .page-break-content {
                            margin-top: 0 !important; /* PDF-də otomatik keçid */
                            margin-bottom: 0 !important;
                        }
                        
                        /* Forced page breaks get proper spacing */
                        .force-new-page {
                            page-break-before: always !important;
                            break-before: page !important;
                            margin-top: 0 !important;
                            padding-top: 0 !important; /* Template-in öz padding-i var */
                        }
                        
                        /* Section spacing that works with page breaks */
                        .cv-section {
                            margin-bottom: 4mm !important; /* Consistent section spacing */
                        }
                        
                        .cv-section:last-child {
                            margin-bottom: 0 !important;
                        }
                        
                        /* Header spacing */
                        .cv-template .mb-6:first-child {
                            margin-bottom: 6mm !important; /* Header section spacing */
                        }
                        @media print {
                            /* Ensure clean page breaks with spacing */
                            .cv-template {
                                orphans: 2;
                                widows: 2;
                            }
                            
                            /* Add breathing room for content at page boundaries */
                            .mb-4:last-of-type {
                                margin-bottom: 8mm !important;
                            }
                            
                            .mb-6:last-of-type {
                                margin-bottom: 10mm !important;
                            }
                            
                            /* Prevent awkward breaks in contact sections */
                            .grid-cols-3 > div {
                                page-break-inside: avoid !important;
                                break-inside: avoid !important;
                            }
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
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,  // CSS @page margin-larını istifadə et
            displayHeaderFooter: false,
            // Unicode və font support üçün əlavə ayarlar
            tagged: true,  // PDF/A accessibility və unicode dəstəyi
            outline: false,
            omitBackground: false,  // Background-ları qoruyub saxla
            // Margin-ları CSS-də təyin etdik, burada sıfır qoy
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            },
            scale: 1,
            // Page break ayarları
            pageRanges: '',
            width: '210mm',   // A4 genişlik
            height: '297mm'   // A4 hündürlük
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

    // Default font settings
    const defaultFontSettings = {
        fontFamily: 'Arial, sans-serif',
        headingSize: 18,
        subheadingSize: 16,
        bodySize: 14,
        smallSize: 12
    };
    
    const fonts = { ...defaultFontSettings, ...fontSettings };

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
            @page {
                size: A4;
                margin: 15mm 20mm 15mm 20mm; /* Optimized CV margins: üst/alt 15mm (1.5cm), sol 20mm (2cm), sağ 20mm (2cm) */
            }
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif;
                -webkit-font-feature-settings: "liga", "kern", "clig" !important;
                font-feature-settings: "liga", "kern", "clig" !important;
                text-rendering: optimizeLegibility;
                unicode-bidi: normal;
                direction: ltr;
                font-variant-ligatures: common-ligatures;
                font-synthesis: weight style;
            }
            
            h1, h2, h3, h4, h5, h6, p, span, div, li, td, th {
                font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
                unicode-bidi: normal !important;
                text-rendering: optimizeLegibility !important;
                direction: ltr !important;
                font-variant-ligatures: common-ligatures !important;
            }
            
            .cv-section {
                page-break-inside: avoid;
                margin-bottom: 20px;
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
                width: 100%;
                max-width: 186mm; /* A4 genişlik - minimal margin-lar */
                margin: 0 auto;
                padding: 0;
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
        <div class="cv-preview" style="
            font-family: ${fonts.fontFamily}; 
            font-size: ${fonts.bodySize}px; 
            line-height: 1.4; 
            color: #333; 
            max-width: 186mm; 
            margin: 0 auto; 
            padding: 0;
        ">
            <!-- Header -->
            <div class="cv-section avoid-break" style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="font-size: ${fonts.headingSize}px; font-weight: bold; margin: 0 0 10px 0; color: #333;">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                <div style="font-size: ${fonts.smallSize}px; color: #666;">
                    ${personalInfo.email ? `${personalInfo.email}` : ''}
                    ${personalInfo.phone ? ` | ${personalInfo.phone}` : ''}
                    ${personalInfo.location ? ` | ${personalInfo.location}` : ''}
                </div>
            </div>

            <!-- Summary -->
            ${personalInfo.summary ? `
            <div class="cv-section" style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    ÖZƏT
                </h2>
                <p style="color: #555; line-height: 1.5; margin: 0;">
                    ${stripHtmlTags(personalInfo.summary)}
                </p>
            </div>
            ` : ''}

            <!-- Experience -->
            ${experience.length > 0 ? `
            <div class="cv-section" style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    İŞ TƏCRÜBƏSİ
                </h2>
                ${experience.map((exp: any) => `
                <div class="avoid-break" style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px;">
                        <h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0;">${exp.position}</h3>
                        <span style="font-size: 10px; color: #666;">
                            ${formatDate(exp.startDate)} - ${exp.current ? 'Hazırda' : formatDate(exp.endDate || '')}
                        </span>
                    </div>
                    <p style="font-size: 11px; color: #555; font-style: italic; margin: 0 0 5px 0;">${exp.company}</p>
                    ${exp.description ? `<p style="font-size: 10px; color: #555; line-height: 1.4; margin: 0;">${stripHtmlTags(exp.description)}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Education -->
            ${education.length > 0 ? `
            <div class="cv-section" style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    TƏHSİL
                </h2>
                ${education.map((edu: any) => `
                <div class="avoid-break" style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px;">
                        <h3 style="font-size: 12px; font-weight: bold; color: #333; margin: 0;">${edu.degree}</h3>
                        <span style="font-size: 10px; color: #666;">
                            ${formatDate(edu.startDate)} - ${edu.current ? 'Hazırda' : formatDate(edu.endDate || '')}
                        </span>
                    </div>
                    <p style="font-size: 11px; color: #555; margin: 0;">${edu.institution}</p>
                    ${edu.field ? `<p style="font-size: 10px; color: #666; margin: 0;">${edu.field}</p>` : ''}
                    ${edu.gpa ? `<p style="font-size: 10px; color: #666; margin: 0;">GPA: ${edu.gpa}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Skills -->
            ${skills.length > 0 ? `
            <div class="cv-section avoid-break" style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    BACARIQLAR
                </h2>
                <p style="font-size: 10px; color: #555; line-height: 1.4; margin: 0;">
                    ${skills.map((skill: any) => skill.name).join(', ')}
                </p>
            </div>
            ` : ''}

            <!-- Languages -->
            ${languages.length > 0 ? `
            <div class="cv-section avoid-break" style="margin-bottom: 20px;">
                <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                    DİLLƏR
                </h2>
                <p style="font-size: 10px; color: #555; line-height: 1.4; margin: 0;">
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
