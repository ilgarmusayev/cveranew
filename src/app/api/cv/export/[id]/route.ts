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
        '--disable-component-extensions-with-background-pages',
        // Azərbaycan hərfləri üçün UTF-8 dəstəyi
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--force-color-profile=srgb',
        '--lang=az-AZ',
        '--accept-lang=az-AZ,az,en-US,en'
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
        // Force desktop viewport to ensure desktop layout in all templates
        await page.setViewport({ 
            width: 1280,  // Desktop width to prevent mobile layout
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
            const isBasicTemplate = templateId === 'basic';
            const isExclusiveTemplate = templateId === 'exclusive';
            console.log('=== TEMPLATE DETECTION ===');
            console.log('Template ID:', templateId);
            console.log('Is Basic Template:', isBasicTemplate);
            console.log('Is Exclusive Template:', isExclusiveTemplate);
            
            if (isBasicTemplate) {
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
                        /* AZERBAYCAN HARFLARI ÜÇÜN FONT IMPORT */
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700&display=swap');
                        
                        /* AZERBAYCAN HARFLARI UNICODE DESTEGI */
                        * {
                            font-family: 'Inter', 'Open Sans', 'Roboto', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
                            text-rendering: optimizeLegibility !important;
                            -webkit-font-smoothing: antialiased !important;
                            -moz-osx-font-smoothing: grayscale !important;
                            unicode-bidi: embed !important;
                        }
                        
                        /* AZERBAYCAN HARFLARI ÖZEL DESTEGI */
                        body, p, span, div, h1, h2, h3, h4, h5, h6, li, td, th {
                            font-feature-settings: "kern" 1, "liga" 1, "clig" 1 !important;
                            font-variant-ligatures: common-ligatures !important;
                            text-rendering: optimizeLegibility !important;
                        }
                        
                        ${cssContent}
                        
                        /* BASIC TEMPLATE COLOR FIXES - FORCE BLUE BORDERS AND CONSISTENT COLORS */
                        .basic-template h2,
                        .basic-template h3,
                        .basic-template .section-header,
                        .basic-template [style*="color: #2563eb"],
                        .basic-template [style*="borderBottom"],
                        .basic-template [style*="border-bottom"] {
                            color: #2563eb !important;
                            border-bottom-color: #2563eb !important;
                            border-color: #2563eb !important;
                        }
                        
                        /* TEMPLATE-SPECIFIC MARGIN ADJUSTMENTS */
                        ${isBasicTemplate ? `
                        @page {
                            size: A4;
                            margin: 0 8mm !important;  /* Basic template: 8mm side margins */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .basic-template {
                            padding-left: 8mm !important;
                            padding-right: 8mm !important;
                            max-width: 100% !important;
                            box-sizing: border-box !important;
                        }
                        ` : isExclusiveTemplate ? `
                        @page {
                            size: A4;
                            margin: 0 !important;  /* No page margins */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            height: auto !important;
                            overflow: visible !important; /* Allow natural content flow */
                        }
                        
                        .exclusive-template {
                            padding: 15mm !important;  /* Same as preview */
                            margin: 0 !important;
                            width: 210mm !important;
                            max-width: 210mm !important;
                            box-sizing: border-box !important;
                            height: auto !important;
                            max-height: none !important; /* Allow content to flow naturally */
                            min-height: auto !important;  /* No min-height */
                            overflow: visible !important;  /* Allow content to flow to next page if needed */
                            page-break-after: auto !important; /* Allow page breaks if content is long */
                            page-break-inside: auto !important; /* Allow content to break across pages */
                        }
                        
                        /* AGGRESSIVE: Force template to only take space it needs */
                        .exclusive-template {
                            contain: size layout !important; /* Contain size to prevent expansion */
                            display: block !important;
                            position: relative !important;
                        }
                        
                        /* Remove all bottom margins and paddings that could create extra pages */
                        .exclusive-template > *,
                        .exclusive-template * {
                            page-break-after: auto !important;
                        }
                        
                        /* Super aggressive: limit document height */
                        body:has(.exclusive-template) {
                            max-height: fit-content !important;
                            overflow: hidden !important;
                        }
                        
                        /* Force last elements to have no trailing space */
                        .exclusive-template > div:last-child,
                        .exclusive-template > section:last-child,
                        .exclusive-template *:last-child {
                            margin-bottom: 0 !important;
                            padding-bottom: 0 !important;
                            border-bottom: none !important;
                            page-break-after: avoid !important;
                        }
                        
                        /* Prevent empty pages by controlling spacing and margins */
                        .exclusive-template > *:last-child {
                            margin-bottom: 0 !important;
                            padding-bottom: 0 !important;
                        }
                        
                        /* Remove any pseudo-elements that might create empty space */
                        .exclusive-template::after,
                        .exclusive-template *::after {
                            content: none !important;
                            display: none !important;
                        }
                        
                        /* Smart page break control - allow breaks between sections */
                        .exclusive-template .section,
                        .exclusive-template .custom-section {
                            page-break-inside: avoid !important; /* Keep sections together */
                            page-break-after: auto !important; /* Allow breaks between sections */
                        }
                        
                        /* Prevent orphaned headers */
                        .exclusive-template h1,
                        .exclusive-template h2,
                        .exclusive-template h3 {
                            page-break-after: avoid !important;
                            orphans: 3 !important;
                            widows: 3 !important;
                        }
                        ` : `
                        @page {
                            size: A4;
                            margin: 0 10mm !important;  /* Other templates: 10mm side margins */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        `}
                        
                        /* BASIC TEMPLATE BORDER FIXES - LEFT BORDERS */
                        .basic-template .border-l-2,
                        .basic-template .border-blue-200,
                        .basic-template [style*="borderLeft"],
                        .basic-template [style*="border-left"] {
                            border-left-color: #2563eb !important;
                            border-left-width: 2px !important;
                            border-left-style: solid !important;
                        }
                        
                        /* BASIC TEMPLATE TEXT COLORS - COMPANY NAMES, INSTITUTIONS */
                        .basic-template [style*="color: var(--cv-primary-color"],
                        .basic-template .text-blue-600 {
                            color: #2563eb !important;
                        }
                        
                        /* BASIC TEMPLATE GRID FIXES - PROPER CONTACT LAYOUT */
                        .basic-template .grid.grid-cols-1.sm\\:grid-cols-2,
                        .basic-template .grid-cols-1,
                        .basic-template .sm\\:grid-cols-2 {
                            display: grid !important;
                            grid-template-columns: 1fr 1fr !important;
                            gap: 1rem !important;
                            align-items: start !important;
                        }
                        
                        /* BASIC TEMPLATE CONTACT INFO LAYOUT - HORIZONTAL GRID */
                        .basic-template .contact-info-grid {
                            display: grid !important;
                            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
                            gap: 8px 16px !important;
                            color: #6b7280 !important;
                        }
                        
                        .basic-template .contact-info-grid .flex.items-center.gap-2 {
                            display: flex !important;
                            align-items: center !important;
                            gap: 0.5rem !important;
                            margin-bottom: 0 !important;
                        }
                        
                        .basic-template .contact-info-grid .font-medium.min-w-\\[50px\\].flex-shrink-0,
                        .basic-template .contact-info-grid .font-medium {
                            font-weight: 500 !important;
                            min-width: 60px !important;
                            flex-shrink: 0 !important;
                        }
                        
                        /* CSS VARIABLES FOR CONSISTENT COLORS */
                        :root {
                            --cv-primary-color: #2563eb !important;
                        }
                        
                        /* BASIC TEMPLATE COLOR ENFORCEMENT */
                        .basic-template h1,
                        .basic-template h2[style*="color: var(--cv-primary-color"],
                        .basic-template [style*="border-bottom: 1px solid var(--cv-primary-color"],
                        .basic-template [style*="borderBottom: '2px solid var(--cv-primary-color"],
                        .basic-template [style*="borderLeft: '2px solid var(--cv-primary-color"] {
                            color: #2563eb !important;
                            border-color: #2563eb !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE COLOR FIXES - FORCE BLUE BORDERS */
                        .exclusive-template .border-b-2,
                        .exclusive-template h2,
                        .exclusive-template [style*="border-bottom"],
                        .exclusive-template [style*="borderBottom"] {
                            border-bottom-color: #2563eb !important;
                            border-color: #2563eb !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE HEADER BACKGROUND - CVPreview eyni */
                        .exclusive-template .bg-gradient-to-r.from-blue-50.to-indigo-50,
                        .exclusive-template [class*="bg-gradient"] {
                            background: linear-gradient(to right, #eff6ff, #e0e7ff) !important;
                            background-color: #eff6ff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        
                        /* CONTACT INFO BOXES - CVPreview eyni ağ background */
                        .exclusive-template .bg-white.p-3.rounded-md.shadow-sm,
                        .exclusive-template .bg-white {
                            background: white !important;
                            background-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                        }
                        
                        /* BORDER COLORS - CVPreview eyni */
                        .exclusive-template .border-blue-200,
                        .exclusive-template .border-t.border-blue-200 {
                            border-color: #bfdbfe !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE SECTION HEADERS */
                        .exclusive-template .text-sm.font-bold.text-gray-800.border-b-2.border-blue-600,
                        .exclusive-template h2.text-sm.font-bold.text-gray-800 {
                            border-bottom: 2px solid #2563eb !important;
                            border-color: #2563eb !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - TAM CVPreview KİMİ DİNAMİK SPACING */
                        
                        /* Template container - CVPreview eyni ayarlar */
                        .exclusive-template {
                            font-family: var(--cv-font-family) !important;
                            padding: 15mm !important;
                            background: white !important;
                            min-height: 297mm !important;
                        }
                        
                        /* Header section - CVPreview eyni gradient və struktur */
                        .exclusive-template > div:first-child {
                            margin-top: 0 !important;
                            margin-bottom: 0 !important;
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                        }
                        
                        .exclusive-template .bg-gradient-to-r {
                            background: linear-gradient(to right, #eff6ff, #e0e7ff) !important;
                            border: 1px solid #bfdbfe !important;
                            border-radius: 8px !important;
                            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .exclusive-template .p-6 {
                            padding: 1.5rem !important; /* 24px */
                        }
                        
                        .exclusive-template .flex.flex-row.gap-6 {
                            display: flex !important;
                            flex-direction: row !important;
                            gap: 1.5rem !important;
                            align-items: center !important;
                        }
                        
                        /* Name styling - CVPreview eyni */
                        .exclusive-template h1.text-2xl {
                            font-size: 1.5rem !important; /* 24px */
                            font-weight: 700 !important;
                            margin-bottom: 0.75rem !important; /* 12px */
                            letter-spacing: 0.025em !important;
                            color: #111827 !important;
                        }
                        
                        .exclusive-template .text-lg.text-blue-600 {
                            font-size: 1.125rem !important; /* 18px */
                            color: #2563eb !important;
                            font-weight: 500 !important;
                            margin-bottom: 0.5rem !important; /* 8px */
                        }
                        
                        /* Contact section - CVPreview eyni spacing */
                        .exclusive-template .mt-6.pt-4.border-t {
                            margin-top: 1.5rem !important; /* 24px */
                            padding-top: 1rem !important; /* 16px */
                            border-top: 1px solid #bfdbfe !important;
                        }
                        
                        .exclusive-template .grid.grid-cols-3.gap-4 {
                            display: grid !important;
                            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                            gap: 1rem !important; /* 16px */
                        }
                        
                        .exclusive-template .bg-white.p-3.rounded-md.shadow-sm {
                            background: white !important;
                            padding: 0.75rem !important; /* 12px */
                            border-radius: 6px !important;
                            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .exclusive-template .text-blue-600.uppercase.font-bold.text-xs.mb-2 {
                            color: #2563eb !important;
                            text-transform: uppercase !important;
                            font-weight: 700 !important;
                            font-size: 0.75rem !important; /* 12px */
                            margin-bottom: 0.5rem !important; /* 8px */
                        }
                        
                        .exclusive-template .text-gray-800.font-medium.text-sm {
                            color: #1f2937 !important;
                            font-weight: 500 !important;
                            font-size: 0.875rem !important; /* 14px */
                        }
                        
                        /* Section spacing - CVPreview var(--cv-section-spacing) dinamik */
                        .exclusive-template [style*="gap: 'var(--cv-section-spacing)'"] {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: var(--cv-section-spacing) !important;
                        }
                        
                        /* Section headers - CVPreview eyni .mb-2 və h2 */
                        .exclusive-template .mb-2 {
                            margin-bottom: 0.5rem !important; /* 8px - CVPreview eyni */
                        }
                        
                        .exclusive-template h2.text-sm.font-bold.text-gray-800.border-b-2.border-blue-600.pb-1,
                        .exclusive-template h2 {
                            font-size: 0.875rem !important; /* 14px */
                            font-weight: 700 !important;
                            color: #1f2937 !important;
                            border-bottom: 2px solid #2563eb !important;
                            padding-bottom: 0.25rem !important; /* 4px - CVPreview eyni pb-1 */
                            margin-bottom: 0 !important; /* h2 özündə margin yox */
                            margin-top: 0 !important;
                        }
                        
                        /* BÜTÜN SECTION CONTENT-LƏR - başlıqdan dərhal sonra */
                        .exclusive-template .mb-2 + div,
                        .exclusive-template .mb-2 + .text-gray-700,
                        .exclusive-template .mb-2 + .space-y-2,
                        .exclusive-template .mb-2 + .space-y-3,
                        .exclusive-template .mb-2 + .grid {
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        /* Skills section flex wrap - CVPreview eyni */
                        .exclusive-template [style*="display: flex"][style*="flexWrap: 'wrap'"] {
                            display: flex !important;
                            flex-wrap: wrap !important;
                            gap: var(--cv-section-spacing) !important;
                            margin-top: 0 !important;
                        }
                        
                        /* Languages grid - CVPreview eyni */
                        .exclusive-template .grid.grid-cols-2.gap-2 {
                            display: grid !important;
                            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                            gap: 0.5rem !important; /* 8px */
                            margin-top: 0 !important;
                        }
                        
                        /* Summary section - CVPreview marginTop: '16px' */
                        .exclusive-template [style*="marginTop: '16px'"] {
                            margin-top: 16px !important;
                        }
                        
                        /* Summary section header və content arasında gap yox */
                        .exclusive-template [style*="marginTop: '16px'"] .mb-2 {
                            margin-bottom: 0.5rem !important; /* 8px başlıq container */
                        }
                        
                        .exclusive-template [style*="marginTop: '16px'"] .mb-2 + div {
                            margin-top: 0 !important; /* Məzmun dərhal başlasın */
                        }
                        
                        /* Content spacing - CVPreview eyni space-y classes */
                        .exclusive-template .space-y-2 > *:not(:first-child) {
                            margin-top: 0.5rem !important; /* 8px */
                        }
                        
                        .exclusive-template .space-y-3 > *:not(:first-child) {
                            margin-top: 0.75rem !important; /* 12px */
                        }
                        
                        /* SECTION İÇİNDƏ MƏZMUN SPACING - CVPreview eyni */
                        /* Başlıqdan sonra məzmun dərhal başlasın */
                        .exclusive-template div[class*="mb-2"] + div:not([class*="mb-"]):not([class*="mt-"]) {
                            margin-top: 0 !important;
                        }
                        
                        /* Summary content - CVPreview eyni leading-relaxed */
                        .exclusive-template .text-gray-700.leading-relaxed.text-sm {
                            color: #374151 !important;
                            line-height: 1.625 !important; /* leading-relaxed */
                            font-size: 0.875rem !important; /* text-sm */
                            margin-left: 0 !important;
                            padding-left: 0 !important;
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        /* Experience description - CVPreview eyni */
                        .exclusive-template .text-gray-700.leading-relaxed.text-xs.mt-1 {
                            color: #374151 !important;
                            line-height: 1.625 !important;
                            font-size: 0.75rem !important; /* text-xs */
                            margin-top: 0.25rem !important; /* mt-1 */
                        }
                        
                        /* Skills tags - CVPreview eyni background və spacing */
                        .exclusive-template .bg-gray-100.text-gray-800.px-2.py-1.text-xs.rounded {
                            background-color: #f3f4f6 !important;
                            color: #1f2937 !important;
                            padding: 0.25rem 0.5rem !important; /* px-2 py-1 */
                            font-size: 0.75rem !important; /* text-xs */
                            border-radius: 0.25rem !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Languages grid items - CVPreview eyni */
                        .exclusive-template .bg-gray-50.p-2.rounded {
                            background-color: #f9fafb !important;
                            padding: 0.5rem !important; /* p-2 */
                            border-radius: 0.25rem !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Təcrübə və təhsil item-ları arasında space-y-2 (8px) */
                        .exclusive-template .space-y-2 > div {
                            margin-bottom: 0 !important;
                        }
                        
                        .exclusive-template .space-y-2 > div + div {
                            margin-top: 0.5rem !important; /* 8px */
                        }
                        
                        /* Section-lar arasında dinamik gap */
                        .exclusive-template [style*="gap: 'var(--cv-section-spacing)'"] > * + * {
                            margin-top: var(--cv-section-spacing) !important;
                        }
                        
                        /* Experience items - CVPreview eyni pb-1 və mb-1 */
                        .exclusive-template .pb-1 {
                            padding-bottom: 0.25rem !important; /* 4px */
                        }
                        
                        .exclusive-template .mb-1 {
                            margin-bottom: 0.25rem !important; /* 4px */
                        }
                        
                        .exclusive-template .mt-0\\.5 {
                            margin-top: 0.125rem !important; /* 2px */
                        }
                        
                        /* Text sizes - CVPreview eyni */
                        .exclusive-template .text-sm {
                            font-size: 0.875rem !important; /* 14px */
                            line-height: 1.25 !important;
                        }
                        
                        .exclusive-template .text-xs {
                            font-size: 0.75rem !important; /* 12px */
                            line-height: 1.333 !important;
                        }
                        
                        .exclusive-template .leading-relaxed {
                            line-height: 1.625 !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - EXACT SAME AS PREVIEW */
                        .exclusive-template,
                        .cv-template.exclusive-template,
                        div.exclusive-template {
                            padding: 15mm !important;  /* Same as preview */
                            margin: 0 !important;
                            width: 210mm !important;
                            box-sizing: border-box !important;
                            height: auto !important;
                            min-height: auto !important;  /* No forced height */
                            max-height: none !important;  /* No height limit */
                            overflow: hidden !important;  /* Hide any overflow that might cause extra page */
                            page-break-after: avoid !important;  /* Prevent page break after template */
                            page-break-inside: avoid !important;  /* Prevent page break inside template */
                            line-height: 1.4 !important; /* Better line spacing */
                            font-family: var(--cv-font-family) !important;
                            background: white !important;
                        }
                        
                        /* DİNAMİK SPACING SİSTEMİ - CVPreview ilə 1:1 uyğun */
                        .exclusive-template {
                            /* CSS variables CVPreview ilə eyni */
                            --cv-section-spacing: ${fontSettings?.sectionSpacing || 24}px !important;
                        }
                        
                        /* Main section container - CVPreview ilə tam eyni */
                        .exclusive-template [style*="display: flex"][style*="flex-direction: column"][style*="gap: 'var(--cv-section-spacing)'"] {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: var(--cv-section-spacing) !important;
                        }
                        
                        /* Fallback üçün section spacing */
                        .exclusive-template > div + div,
                        .exclusive-template .sortable-item + .sortable-item {
                            margin-top: var(--cv-section-spacing) !important;
                        }
                        
                        /* AGGRESSIVE BLANK PAGE PREVENTION FOR EXCLUSIVE TEMPLATE */
                        .exclusive-template *:last-child {
                            margin-bottom: 0 !important;
                            padding-bottom: 0 !important;
                            page-break-after: avoid !important;
                        }
                        
                        /* Remove any pseudo-elements that might create extra space */
                        .exclusive-template::after,
                        .exclusive-template *::after {
                            content: none !important;
                            display: none !important;
                        }
                        
                        /* Smart content flow - prevent empty pages */
                        .exclusive-template {
                            contain: layout !important; /* Contain layout to prevent overflow issues */
                        }
                        
                        /* If content exceeds one page, allow intelligent page breaks */
                        @media print {
                            /* Only create new page if there's actual content */
                            .exclusive-template {
                                orphans: 4 !important; /* Minimum lines at bottom of page */
                                widows: 4 !important;   /* Minimum lines at top of new page */
                            }
                            
                            /* Prevent page break if last element is empty or has minimal content */
                            .exclusive-template > div:last-child:empty,
                            .exclusive-template > section:last-child:empty {
                                display: none !important;
                            }
                        }
                        }
                        
                        /* EXCLUSIVE TEMPLATE - PREVENT EXTRA PAGE */
                        .exclusive-template::after {
                            content: none !important;  /* Remove any pseudo-content */
                        }
                        
                        .exclusive-template > *:last-child {
                            page-break-after: avoid !important;
                            margin-bottom: 0 !important;
                            padding-bottom: 0 !important;
                        }
                        
                        /* FORCE DESKTOP LAYOUT FOR ALL TEMPLATES IN EXPORT */
                        @media (max-width: 1023px) {
                            .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                            .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                            .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                            .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                            .md\\:flex { display: flex !important; }
                            .md\\:justify-between { justify-content: space-between !important; }
                            .lg\\:text-right { text-align: right !important; }
                            .lg\\:max-w-xs { max-width: 20rem !important; }
                            .lg\\:w-64 { width: 16rem !important; }
                            .lg\\:w-80 { width: 20rem !important; }
                            /* Override any mobile-specific styles to force desktop layout */
                        }
                        
                        /* ROUTE.TS ƏLAVƏ CSS - YALNIZ DINAMIK FONT SISTEMI */
                          
                        /* 🚫 PAGE BREAK İNDİKATORLARINI TAMİLƏ GİZLƏT - PDF EXPORT ÜÇÜN */
                        .page-break-indicator,
                        .page-break-preview,
                        .page-number,
                        .page-number-indicator,
                        .cv-section.force-next-page::after,
                        .cv-section.in-danger-zone::before,
                        .cv-section.intersects-page-break::before,
                        .page-break-line,
                        .page-break-label,
                        [class*="page-break"],
                        [data-page-break],
                        .cv-content-with-breaks .page-break-indicator,
                        .cv-preview-with-breaks .page-break-indicator {
                            display: none !important;
                            visibility: hidden !important;
                            opacity: 0 !important;
                            height: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            border: none !important;
                            background: none !important;
                        }
                        
                        /* MƏCBURI OPTİMAL MARGIN - PDF ÜÇÜN */
                        @page {
                            size: A4;

                            margin: 0 10mm !important;  /* Optimal margin-lar: üst 0(yalniz ilk sehifede. novbeti sehifede 12mm) alt 12mm, yan 10mm */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Essence template specific - remove top margin on first page */
                        @page :first {
                            margin-top: 8mm !important; /* Reduced top margin for Essence template first page */
                        }
                        
                        /* Essence template - ensure no extra spacing */
                        .essence-template {
                            margin: 0 !important;
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        /* GLOBAL BACKGROUND COLOR PRESERVATION FOR ALL TEMPLATES */
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Remove PDF viewer default backgrounds */
                        html, body {
                            background: transparent !important;
                            background-color: transparent !important;
                            background-image: none !important;
                        }
                        
                        /* Force all background colors to appear in PDF */
                        div[style*="background-color"],
                        div[style*="backgroundColor"],
                        span[style*="background-color"],
                        span[style*="backgroundColor"],
                        .bg-blue-600, .bg-blue-500, .bg-gray-100, .bg-gray-200,
                        .bg-orange-100, .bg-amber-100, .bg-yellow-100,
                        .bg-green-100, .bg-red-100, .bg-purple-100,
                        [class*="bg-"],
                        .timeline-dot, .badge, .tag, .chip {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            background-image: none !important;
                        }
                        
                        /* Specific fixes for common background colors - FORCE EXACT COLORS */
                        .bg-blue-600 { 
                            background-color: #1e3a8a !important; 
                            background: #1e3a8a !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-blue-500 { 
                            background-color: #3b82f6 !important; 
                            background: #3b82f6 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-gray-100 { 
                            background-color: #f3f4f6 !important; 
                            background: #f3f4f6 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-gray-200 { 
                            background-color: #e5e7eb !important; 
                            background: #e5e7eb !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-orange-100 { 
                            background-color: #fed7aa !important; 
                            background: #fed7aa !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-amber-100 { 
                            background-color: #fef3e2 !important; 
                            background: #fef3e2 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-yellow-100 { 
                            background-color: #fef3c7 !important; 
                            background: #fef3c7 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-green-100 { 
                            background-color: #dcfce7 !important; 
                            background: #dcfce7 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-red-100 { 
                            background-color: #fee2e2 !important; 
                            background: #fee2e2 !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        .bg-purple-100 { 
                            background-color: #f3e8ff !important; 
                            background: #f3e8ff !important;
                            -webkit-print-color-adjust: exact !important;
                        }
                        
                        /* Ensure Clarity template background colors show */
                        .text-xs.px-2.py-1.rounded,
                        .inline-block.px-2.py-1.text-xs.rounded {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Essence Template - Force green header and template backgrounds */
                        .essence-template {
                            background-color: #F5F5F5 !important;
                            background: #F5F5F5 !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Essence template green header - multiple selectors for maximum compatibility */
                        .essence-green-header,
                        .essence-template .essence-green-header,
                        .essence-template .p-6.shadow-sm.border-b.mb-6,
                        .essence-template div[style*="backgroundColor: '#1F4B43'"],
                        .essence-template div[style*="background-color: #1F4B43"],
                        .essence-template div[style*="background: #1F4B43"] {
                            background-color: #1F4B43 !important;
                            background: #1F4B43 !important;
                            background-image: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Essence template green header text - force white color */
                        .essence-green-header *,
                        .essence-green-header h1,
                        .essence-green-header p,
                        .essence-green-header span,
                        .essence-green-header div,
                        .essence-template .essence-green-header *,
                        .essence-template .p-6.shadow-sm.border-b.mb-6 *,
                        .essence-template div[style*="background-color: #1F4B43"] *,
                        .essence-template div[style*="background: #1F4B43"] * {
                            color: #FFFFFF !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Essence template - remove top margin/padding from first page */
                        .essence-template {
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        .essence-template .essence-green-header {
                            margin-top: 0 !important;
                            padding-top: 1.5rem !important; /* Keep internal padding but remove external margin */
                        }
                        
                        /* Force all template-specific background colors */
                        [style*="backgroundColor"]:not([style*="transparent"]):not([style*="#ffffff"]):not([style*="white"]),
                        [style*="background-color"]:not([style*="transparent"]):not([style*="#ffffff"]):not([style*="white"]) {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Basic template için 2-ci səhifədə top margin */
                        @page :first {
                            margin-top: 12mm !important;
                        }
                        
                        @page :left {
                            margin-top: 15mm !important;  /* 2-ci, 4-cü və s. səhifələrdə əlavə margin */
                        }
                        
                        @page :right {
                            margin-top: 15mm !important;  /* 3-cü, 5-ci və s. səhifələrdə əlavə margin */
                        }
                        
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            width: 100% !important;
                            height: auto !important;  /* PDF üçün auto hündürlük */
                            box-sizing: border-box !important;
                            border: none !important;
                            outline: none !important;
                            background: none !important;  /* PDF arxa planını tamamilə sil */
                            background-color: transparent !important;  /* Tam şəffaf arxa plan */
                            background-image: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Template container-ləri - yalnız ağ arxa planları sil, rəngli olanları saxla */
                        .cv-preview, .cv-container {
                            background: transparent !important;
                            background-color: transparent !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Template-lərin özlərində rəngli arxa planlar saxlanılsın */
                        .basic-template, .modern-template, .atlas-template, .exclusive-template, 
                        .aurora-template, .vertex-template, .horizon-template, .lumen-template, 
                        .clarity-template, .essence-template {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Ümumi div/section-ları şəffaf et, amma template-specific olanları yox */
                        div:not([style*="background"]):not([class*="bg-"]):not(.essence-template):not([class*="template"]), 
                        section:not([style*="background"]):not([class*="bg-"]), 
                        article:not([style*="background"]):not([class*="bg-"]), 
                        main:not([style*="background"]):not([class*="bg-"]) {
                            background: transparent !important;
                            background-color: transparent !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE ÜÇÜ OPTİMAL PADDING - NUCLEAR OVERRIDE */
                        .exclusive-template,
                        div.exclusive-template,
                        [class*="exclusive-template"],
                        body .exclusive-template,
                        html .exclusive-template {
                            padding: 0 !important;  /* Template özü padding yoxdur, margin PDF ayarlarından gəlir */
                            box-sizing: border-box !important;
                            width: 100% !important;
                            min-height: auto !important;
                            min-width: auto !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            border: none !important;
                        }
                        
                        /* Exclusive template container-ları da 15mm padding ilə - NUCLEAR */
                        .exclusive-template .cv-content-with-breaks,
                        .exclusive-template .cv-preview,
                        .exclusive-template .cv-container,
                        .cv-preview.exclusive-template,
                        .cv-container.exclusive-template {
                            padding: 0 !important;
                            margin: 0 !important;
                            box-sizing: border-box !important;
                            width: 100% !important;
                            max-width: none !important;
                        }
                        
                        /* AURORA TEMPLATE ÜÇÜ 15MM PADDING - PROFESSIONAL MARGINS */
                        .aurora-template,
                        div.aurora-template,
                        [class*="aurora-template"],
                        body .aurora-template,
                        html .aurora-template {
                            padding: 15mm !important;  /* Professional 15mm margins on all sides */
                            box-sizing: border-box !important;
                            width: 100% !important;
                            min-height: auto !important;
                            min-width: auto !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            border: none !important;
                        }
                        
                        /* Aurora template container-ları da 15mm padding ilə */
                        .aurora-template .cv-content-with-breaks,
                        .aurora-template .cv-preview,
                        .aurora-template .cv-container,
                        .cv-preview.aurora-template,
                        .cv-container.aurora-template {
                            padding: 15mm !important;
                            margin: 0 !important;
                            box-sizing: border-box !important;
                            width: 100% !important;
                            max-width: none !important;
                        }
                        
                        /* Exclusive template content areas - padding parent-dən gəlir */
                        .exclusive-template * {
                            box-sizing: border-box !important;
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
                            --cv-section-spacing: ${fontSettings?.sectionSpacing || 16}px;
                            --cv-section-margin-top: ${fontSettings?.sectionSpacing || 16}px;
                            --cv-section-margin-bottom: ${fontSettings?.sectionSpacing || 16}px;
                            
                            /* Additional Spacing Variables - Font Manager ilə dinamik */
                            --cv-small-spacing: ${Math.max(4, (fontSettings?.sectionSpacing || 16) * 0.25)}px;
                            --cv-item-spacing: ${Math.max(6, (fontSettings?.sectionSpacing || 16) * 0.5)}px;
                            --cv-paragraph-spacing: ${Math.max(8, (fontSettings?.sectionSpacing || 16) * 0.75)}px;
                            
                            /* Dinamik Rənglər */
                            --cv-primary-color: #2563eb;
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
                        .modern-template, .atlas-template, .basic-template, .traditional-template,
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
                        
                        /* CV SECTION SPACING - DİNAMİK FONT MANAGER İLƏ SINXRON */
                        .cv-section,
                        [class*="section"],
                        .experience-section,
                        .education-section,
                        .skills-section,
                        .languages-section,
                        .summary-section,
                        .contact-section {
                            margin-bottom: var(--cv-section-spacing) !important;
                            margin-top: var(--cv-small-spacing) !important;
                        }
                        
                        /* CV Section headings */
                        .cv-section h1,
                        .cv-section h2,
                        .cv-section h3 {
                            margin-bottom: var(--cv-item-spacing) !important;
                            margin-top: 0 !important;
                        }
                        
                        /* CV Items within sections */
                        .experience-item,
                        .education-item,
                        .skill-item,
                        .language-item {
                            margin-bottom: var(--cv-item-spacing) !important;
                        }
                        
                        /* CV Paragraphs */
                        .cv-section p,
                        .cv-section div p {
                            margin-bottom: var(--cv-paragraph-spacing) !important;
                        }
                        
                        /* Remove excessive margins from last elements */
                        .cv-section:last-child,
                        .experience-item:last-child,
                        .education-item:last-child,
                        .skill-item:last-child,
                        .language-item:last-child {
                            margin-bottom: 0 !important;
                        }
                        
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
                        .border-blue-600 { border-color: #1e3a8a !important; }
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
                        .text-blue-600 { color: #1e3a8a !important; }
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
                        
                        /* 🔄 PDF SƏHIFƏ AXINI - TƏBİİ VƏ PROBLEMSIZ */
                        
                        /* PDF üçün tam təbii axın - səhifə bölgüsü problemi yox */
                        * {
                            page-break-inside: auto !important;
                            break-inside: auto !important;
                            page-break-before: auto !important;
                            break-before: auto !important;
                            page-break-after: auto !important;
                            break-after: auto !important;
                        }
                        
                        /* Yalnız şəxsi məlumat bölməsini qoru */
                        .personal-info-section,
                        .header-section,
                        .mb-6:first-child {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* Başlıqları kiçik mətnlə birlikdə saxla */
                        h1, h2, h3 {
                            orphans: 2 !important;
                            widows: 2 !important;
                        }
                        
                        /* TEMPLATE-SPECIFIC DYNAMIC SECTION SPACING */
                        .exclusive-template .cv-section {
                            margin-bottom: var(--cv-section-spacing) !important;
                            padding: 0 !important;
                        }
                        
                        .exclusive-template h1,
                        .exclusive-template h2,
                        .exclusive-template h3 {
                            margin-bottom: var(--cv-item-spacing) !important;
                        }
                        
                        .exclusive-template .experience-item,
                        .exclusive-template .education-item {
                            margin-bottom: var(--cv-item-spacing) !important;
                        }
                        
                        .basic-template .cv-section,
                        .modern-template .cv-section,
                        .atlas-template .cv-section,
                        .aurora-template .cv-section,
                        .vertex-template .cv-section,
                        .horizon-template .cv-section,
                        .lumen-template .cv-section {
                            margin-bottom: var(--cv-section-spacing) !important;
                        }
                        
                        /* ATLAS TEMPLATE SOL PANEL PDF EXPORT ÜÇÜN MÜTLƏq GOY RƏNG */
                        .atlas-left-panel,
                        .atlas-template .atlas-left-panel,
                        div.atlas-left-panel,
                        [class*="atlas-left-panel"] {
                            background-color: #1e3a8a !important; /* Goy rəng */
                            background: #1e3a8a !important;
                            color: white !important;
                            z-index: 999999 !important;
                            position: relative !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Atlas sol panel içindəki BÜTÜN elementlər ağ rəng */
                        .atlas-left-panel *,
                        .atlas-left-panel h1,
                        .atlas-left-panel h2,
                        .atlas-left-panel h3,
                        .atlas-left-panel h4,
                        .atlas-left-panel h5,
                        .atlas-left-panel h6,
                        .atlas-left-panel p,
                        .atlas-left-panel span,
                        .atlas-left-panel div,
                        .atlas-left-panel strong,
                        .atlas-left-panel em,
                        .atlas-left-panel a,
                        .atlas-left-panel li,
                        .atlas-left-panel td,
                        .atlas-left-panel th {
                            color: white !important;
                            border-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Atlas sol panel xətləri də ağ olsun */
                        .atlas-left-panel .border-b,
                        .atlas-left-panel .border-t,
                        .atlas-left-panel .border-l,
                        .atlas-left-panel .border-r,
                        .atlas-left-panel .border,
                        .atlas-left-panel [class*="border"] {
                            border-color: white !important;
                        }
                        
                        /* Atlas template sol panel container */
                        .atlas-template .w-2\/5,
                        .atlas-template .w-5\/12,
                        .cv-template.atlas-template .w-2\/5,
                        .cv-template.atlas-template .w-5\/12,
                        .atlas-template div[class*="w-5/12"],
                        .atlas-template div[class*="w-2/5"] {
                            background-color: #1e3a8a !important;
                            background: #1e3a8a !important;
                            color: white !important;
                            z-index: 999999 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Atlas template sol panel bütün child elementləri */
                        .atlas-template .w-2\/5 *,
                        .cv-template.atlas-template .w-2\/5 * {
                            color: white !important;
                            border-color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
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
        
        // UTF-8 və Azərbaycan hərfləri üçün page encoding ayarları
        await page.setExtraHTTPHeaders({
            'Accept-Charset': 'utf-8',
            'Content-Type': 'text/html; charset=utf-8'
        });
        
        // Azərbaycan hərflərini düzgün render etmək üçün font loading gözlə
        await page.evaluateOnNewDocument(() => {
            document.addEventListener('DOMContentLoaded', () => {
                const docStyle = document.documentElement.style as any;
                docStyle.fontFeatureSettings = '"kern" 1, "liga" 1, "clig" 1';
                docStyle.textRendering = 'optimizeLegibility';
                docStyle.webkitFontSmoothing = 'antialiased';
                docStyle.mozOsxFontSmoothing = 'grayscale';
            });
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
                
                /* PDF Səhifə Ayarları - İstifadəçi Tələbi Üzrə */
                @page {
                    size: A4;
                    margin: 5mm 15mm 15mm 15mm !important; /* Default: top=5mm, sides/bottom=15mm */
                }
                
                @page :first {
                    margin: 5mm 15mm 15mm 15mm !important; /* 1-ci səhifə: top=5mm - azca artırılmış */
                }
                
                /* 2-ci səhifə və sonrakı səhifələr üçün top margin 15mm */
                @page :not(:first) {
                    margin: 15mm 15mm 15mm 15mm !important; /* 2-ci səhifədən başlayaraq: top=15mm avtomatik */
                }
                
                /* Basic Template üçün xüsusi ayarlar */
                .basic-template {
                    margin-top: 0 !important; /* Template-in özü yuxarıda boşluq yaratmasın */
                    padding-top: 0 !important; /* Template-in padding-i də sıfır */
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
                    margin: 0 !important; /* HTML margin sıfır */
                    padding: 0 !important; /* HTML padding sıfır */
                }
                
                body {
                    height: auto !important;
                    min-height: auto !important;
                    overflow: visible !important;
                    margin: 0 !important; /* Body margin mütləq sıfır */
                    padding: 0 !important; /* Body padding mütləq sıfır */
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
                    margin: 0 !important; /* MÜTLƏQ margin sıfır */
                    padding: 0 !important; /* MÜTLƏQ padding sıfır */
                    border: none !important;
                    box-shadow: none !important;
                }
                
                /* Basic Template üçün xüsusi top boşluq sıfırlama */
                .cv-preview:first-child,
                .basic-template:first-child,
                .cv-preview > *:first-child,
                .basic-template > *:first-child {
                    margin-top: 0 !important; /* İlk element yuxarıda boşluq yaratmasın */
                    padding-top: 0 !important;
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
                    max-width: 100% !important;  /* PDF margin-dan istifadə et, content 100% */
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
                .basic-template .text-blue-600 { color: #1e3a8a !important; }
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
        
        // Atlas/Atlas Template PDF Design Fix
        const normalizedTemplateId = templateId?.toLowerCase() || '';
        const isAtlasTemplate = normalizedTemplateId.includes('ats') || 
                                   normalizedTemplateId.includes('atlas') || 
                                   normalizedTemplateId === 'atlas' ||
                                   normalizedTemplateId.includes('clean') ||
                                   normalizedTemplateId.includes('minimal-professional');
        
        console.log('🎨 Template ID Check:', templateId, '-> Normalized:', normalizedTemplateId);
        console.log('🔍 Is Atlas Template:', isAtlasTemplate);
        
        // Check if Basic template
        const isBasicTemplate = normalizedTemplateId.includes('basic') || 
                                   normalizedTemplateId === 'basic' ||
                                   normalizedTemplateId === 'traditional' ||
                                   normalizedTemplateId.includes('traditional') ||
                                   normalizedTemplateId.includes('simple') ||
                                   normalizedTemplateId.includes('professional');
        
        console.log('🔍 Is Basic Template:', isBasicTemplate);
        
        // Check if Exclusive template
        const isExclusiveTemplate = normalizedTemplateId.includes('exclusive') || 
                                       normalizedTemplateId === 'exclusive';
        
        console.log('🔍 Is Exclusive Template:', isExclusiveTemplate);
        
        // Exclusive template: Clean up empty elements that might cause blank pages
        if (isExclusiveTemplate) {
            await page.evaluate(() => {
                console.log('🧹 Cleaning up empty elements for Exclusive template...');
                
                // Remove empty divs, sections, and elements that might create blank pages
                const emptyElements = document.querySelectorAll('.exclusive-template *:empty');
                emptyElements.forEach(el => {
                    const element = el as HTMLElement;
                    // Only remove if it's truly empty (no text content and no important styling)
                    if (!element.textContent?.trim() && 
                        !element.querySelector('img, svg, canvas') &&
                        !element.style.backgroundColor &&
                        !element.style.borderBottom) {
                        element.remove();
                    }
                });
                
                // Remove trailing empty space elements
                const exclusiveTemplate = document.querySelector('.exclusive-template');
                if (exclusiveTemplate) {
                    const lastChild = exclusiveTemplate.lastElementChild;
                    if (lastChild && !lastChild.textContent?.trim()) {
                        // Check if it's just a spacing element
                        const hasImportantContent = lastChild.querySelector('img, svg, canvas, input, button');
                        if (!hasImportantContent) {
                            console.log('🗑️ Removing trailing empty element:', lastChild.tagName);
                            lastChild.remove();
                        }
                    }
                }
                
                // AGGRESSIVE: Remove all elements with only whitespace or empty margin/padding
                const allElements = exclusiveTemplate?.querySelectorAll('*');
                allElements?.forEach(el => {
                    const element = el as HTMLElement;
                    const computedStyle = window.getComputedStyle(element);
                    const hasContent = element.textContent?.trim() || 
                                     element.querySelector('img, svg, canvas, input, button, select, textarea');
                    
                    // Remove elements that are just spacing/margin creators
                    if (!hasContent && 
                        !element.style.backgroundColor && 
                        !element.style.borderBottom &&
                        !element.classList.contains('border-b') &&
                        computedStyle.height === '0px') {
                        element.remove();
                    }
                });
                
                console.log('✅ Exclusive template cleanup completed');
            });
            
            // Force content height calculation and remove anything beyond reasonable limits
            await page.evaluate(() => {
                const exclusiveTemplate = document.querySelector('.exclusive-template');
                if (exclusiveTemplate) {
                    const templateElement = exclusiveTemplate as HTMLElement;
                    
                    // Calculate actual content height
                    const contentHeight = templateElement.scrollHeight;
                    console.log('📏 Exclusive template content height:', contentHeight, 'px');
                    
                    // If content is very short, ensure no extra spacing
                    if (contentHeight < 800) { // Less than A4 page height
                        templateElement.style.setProperty('height', 'auto', 'important');
                        templateElement.style.setProperty('max-height', `${contentHeight + 50}px`, 'important');
                        templateElement.style.setProperty('overflow', 'hidden', 'important');
                        console.log('🔒 Limited template height to prevent blank pages');
                    }
                }
            });
        }
        
        if (isAtlasTemplate) {
            console.log('🎯 Atlas Template detected - applying complete design fix...');
            
            // CSS injection for Atlas template PDF design
            await page.addStyleTag({
                content: `
                    /* ATLAS TEMPLATE COMPLETE PDF DESIGN FIX */
                    @media print {
                        /* PDF SƏHİFƏ MARGİN SIFIR - 15MM MESAFE SIFIR */
                        @page {
                            size: A4;
                            margin: 0 !important;
                            margin-top: 0 !important;
                            margin-bottom: 0 !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            padding: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        /* HTML/BODY - 15MM MESAFE TAMAMEN SIFIR */
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                            height: auto !important;
                            overflow: visible !important;
                            position: relative !important;
                            top: 0 !important;
                            transform: translateY(0) !important;
                        }
                        
                        /* BUTUN ELEMENTLER - 15MM MESAFE SIFIR */
                        * {
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* Template container - 15MM MESAFE MUTLEQ SIFIR */
                        .atlas-template,
                        .atlas,
                        .atlas-template,
                        .cv-template {
                            margin: 0 !important;
                            margin-top: 0 !important;
                            padding: 0 !important;
                            padding-top: 0 !important;
                            position: relative !important;
                            top: 0 !important;
                            transform: translateY(0) !important;
                        }
                        
                        /* SOL PANEL - #1e3a8a tünd göy background - PADDİNG/MARGİN SİLİNDİ */
                        .atlas-left-panel,
                        .w-2\\/5,
                        [class*="w-2/5"],
                        .atlas-template .w-2\\/5,
                        .atlas .w-2\\/5,
                        .atlas-template .w-2\\/5,
                        div[class*="w-2/5"].atlas-left-panel,
                        [class*="bg-blue"] {
                            background-color: #1e3a8a !important;
                            background: #1e3a8a !important;
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Sol panel içindəki bütün elementlər ağ text - SOL PANEL BORDER LEĞVİ (başlıq xəttləri istisna) */
                        .atlas-left-panel *,
                        .w-2\\/5 *,
                        [class*="w-2/5"] *,
                        .atlas-template .w-2\\/5 *,
                        .atlas .w-2\\/5 *,
                        .atlas-template .w-2\\/5 *,
                        div[class*="w-2/5"].atlas-left-panel *,
                        [class*="bg-blue"] * {
                            color: white !important;
                            background-color: transparent !important;
                            background: transparent !important;
                            outline: none !important;
                        }
                        
                        /* Sol paneldə section başlıq xəttləri ağ rəngdə nazik görünsün */
                        .atlas-left-panel h2,
                        .atlas-left-panel h3,
                        .atlas-left-panel .section-title,
                        .atlas-left-panel .cv-section-title,
                        .w-2\\/5 h2,
                        .w-2\\/5 h3,
                        .w-2\\/5 .section-title,
                        .w-2\\/5 .cv-section-title,
                        [class*="w-2/5"] h2,
                        [class*="w-2/5"] h3,
                        [class*="w-2/5"] .section-title,
                        [class*="w-2/5"] .cv-section-title {
                            border-bottom: 1px solid white !important;
                            border-color: white !important;
                        }
                        
                        /* Sol paneldə HR elementləri ağ rəngdə */
                        .atlas-left-panel hr,
                        .w-2\\/5 hr,
                        [class*="w-2/5"] hr {
                            border-color: white !important;
                            background-color: white !important;
                            color: white !important;
                        }
                        
                        /* SAĞ PANEL BORDER QORUMA - SAĞ PANELDƏKİ SECTION-LAR BORDER SAXLAYIR */
                        .w-3\\/5 *,
                        [class*="w-3/5"] * {
                            /* Sağ paneldə border saxlanır */
                        }
                        
                        /* SAĞ PANEL - ağ background və qara text */
                        .w-3\\/5,
                        [class*="w-3/5"],
                        .atlas-template .w-3\\/5,
                        .atlas .w-3\\/5,
                        .atlas-template .w-3\\/5 {
                            background-color: white !important;
                            background: white !important;
                            color: #1f2937 !important;
                        }
                        
                        /* BÜTÜN SAĞ PANEL SECTION-LARI AĞ */
                        body *:not(.atlas-left-panel):not(.w-2\\/5):not([class*="w-2/5"]):not([class*="bg-blue"]):not(.atlas-left-panel *):not(.w-2\\/5 *):not([class*="w-2/5"] *):not([class*="bg-blue"] *) {
                            background-color: white !important;
                            background: white !important;
                            color: #1f2937 !important;
                        }
                        
                        /* Section-lar mütləq ağ */
                        section:not(.atlas-left-panel):not(.atlas-left-panel section),
                        .section:not(.atlas-left-panel):not(.atlas-left-panel .section),
                        .cv-section:not(.atlas-left-panel):not(.atlas-left-panel .cv-section),
                        div[class*="section"]:not(.atlas-left-panel):not(.atlas-left-panel div[class*="section"]),
                        .mb-6:not(.atlas-left-panel):not(.atlas-left-panel .mb-6),
                        .mb-4:not(.atlas-left-panel):not(.atlas-left-panel .mb-4),
                        .mb-8:not(.atlas-left-panel):not(.atlas-left-panel .mb-8) {
                            background-color: white !important;
                            background: white !important;
                            color: #1f2937 !important;
                        }
                        
                        /* Atlas template specific section header styling for PDF */
                        .atlas-left-panel h2,
                        .atlas-template .w-2\\/5 h2,
                        .atlas .w-2\\/5 h2 {
                            border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
                            padding-bottom: 8px !important;
                            margin-bottom: 16px !important;
                        }
                        
                        /* Atlas template proper spacing between sections */
                        .atlas-left-panel .custom-section,
                        .atlas-template .w-2\\/5 .custom-section {
                            margin-bottom: 24px !important;
                            page-break-inside: avoid !important;
                        }
                        
                        /* Atlas left panel proper styling */
                        .atlas-left-panel,
                        .atlas-template .w-2\\/5 {
                            background-color: #1e3a8a !important;
                            padding: 32px 24px !important;
                            min-height: 100vh !important;
                        }
                    }
                `
            });
            
            // JavaScript for aggressive Atlas design enforcement
            await page.evaluate(() => {
                console.log('🎯 Atlas JavaScript design enforcement executing...');
                
                // AGGRESSIV - 15MM MESAFE SIFIR ET
                console.log('🔧 REMOVING 15MM TOP SPACE COMPLETELY...');
                
                // BIRINCI - HTML VE BODY AGGRESSIV SIFIR
                const htmlBody = document.querySelectorAll('html, body');
                htmlBody.forEach((el) => {
                    const element = el as HTMLElement;
                    element.style.setProperty('margin', '0', 'important');
                    element.style.setProperty('padding', '0', 'important');
                    element.style.setProperty('margin-top', '0', 'important');
                    element.style.setProperty('padding-top', '0', 'important');
                    element.style.setProperty('position', 'relative', 'important');
                    element.style.setProperty('top', '0', 'important');
                    element.style.setProperty('transform', 'translateY(0)', 'important');
                });
                
                // IKINCI - BUTUN ELEMENTLERIN TOP MARGIN/PADDING SIFIR
                const allElementsForTop = document.querySelectorAll('*');
                allElementsForTop.forEach((el) => {
                    const element = el as HTMLElement;
                    element.style.setProperty('margin-top', '0', 'important');
                    element.style.setProperty('padding-top', '0', 'important');
                });
                
                const templateContainers = document.querySelectorAll(`
                    .atlas-template,
                    .atlas,
                    .atlas-template,
                    .cv-template,
                    html,
                    body
                `);
                
                templateContainers.forEach((el) => {
                    const element = el as HTMLElement;
                    element.style.setProperty('margin', '0', 'important');
                    element.style.setProperty('margin-top', '0', 'important');
                    element.style.setProperty('padding', '0', 'important');
                    element.style.setProperty('padding-top', '0', 'important');
                    element.style.setProperty('position', 'relative', 'important');
                    element.style.setProperty('top', '0', 'important');
                    element.style.setProperty('transform', 'translateY(0)', 'important');
                });
                
                // İLK - BÜTÜN ELEMENTLƏRI AĞ ET
                const allElements = document.querySelectorAll('*');
                console.log('Setting ALL elements to white first:', allElements.length);
                
                allElements.forEach((el) => {
                    const element = el as HTMLElement;
                    element.style.setProperty('background-color', 'white', 'important');
                    element.style.setProperty('background', 'white', 'important');
                    element.style.setProperty('color', '#1f2937', 'important');
                });
                
                // İKİNCİ - YALNIZ SOL PANEL CONTAINER-I GÖY ET
                const leftPanelContainers = [
                    '.atlas-left-panel',
                    '.w-2\\/5',
                    '[class*="w-2/5"]'
                ];
                
                let totalLeftPanelFixed = 0;
                leftPanelContainers.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    console.log(`Found ${elements.length} left panel containers for: ${selector}`);
                    
                    elements.forEach((el) => {
                        const element = el as HTMLElement;
                        // Yalnız sol panel container-ını göy et
                        element.style.setProperty('background-color', '#1e3a8a', 'important');
                        element.style.setProperty('background', '#1e3a8a', 'important');
                        element.style.setProperty('color', 'white', 'important');
                        element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                        element.style.setProperty('print-color-adjust', 'exact', 'important');
                           element.style.setProperty('height', '100vh', 'important'); 
                               element.style.setProperty('min-height', '100vh', 'important');
                                   element.style.setProperty('align-self', 'stretch', 'important');
        element.style.setProperty('margin', '0', 'important');
    element.style.setProperty('padding-top', '0', 'important');
    element.style.setProperty('padding-bottom', '0', 'important');

                        totalLeftPanelFixed++;
                        
                        // Sol panel içindəki BÜTÜN elementləri ağ text et - BAŞLIQ XƏTTLƏRİ QORU
                        const allChildren = element.querySelectorAll('*');
                        allChildren.forEach((child) => {
                            const childEl = child as HTMLElement;
                            childEl.style.setProperty('color', 'white', 'important');
                            childEl.style.setProperty('background-color', 'transparent', 'important');
                            
                            childEl.style.setProperty('background', 'transparent', 'important');
                            childEl.style.setProperty('outline', 'none', 'important');
                            
                            // Section başlıqları üçün ağ border
                            const isHeading = childEl.tagName === 'H2' || childEl.tagName === 'H3' || 
                                            childEl.classList.contains('section-title') || 
                                            childEl.classList.contains('cv-section-title');
                            
                            const isHR = childEl.tagName === 'HR';
                            
                            if (isHeading) {
                                childEl.style.setProperty('border-bottom', '1px solid white', 'important');
                                childEl.style.setProperty('border-color', 'white', 'important');
                            } else if (isHR) {
                                childEl.style.setProperty('border-color', 'white', 'important');
                                childEl.style.setProperty('background-color', 'white', 'important');
                            } else {
                                // Digər elementlər üçün border yoxdur
                                childEl.style.setProperty('border', 'none', 'important');
                                childEl.style.setProperty('border-color', 'transparent', 'important');
                            }
                        });
                    });
                });
                
                // ÜÇÜNCÜ - SOL PANELDƏKİ SECTION-LARI DA GÖY ET
                console.log('� Making left panel sections blue...');
                
                // Sol panel içindəki section-ları tap
                const leftPanelSections = document.querySelectorAll(`
                    .atlas-left-panel .cv-section,
                    .atlas-left-panel section,
                    .atlas-left-panel .section,
                    .atlas-left-panel div[class*="section"],
                    .atlas-left-panel .mb-6,
                    .atlas-left-panel .mb-4,
                    .atlas-left-panel .mb-8,
                    .w-2\\/5 .cv-section,
                    .w-2\\/5 section,
                    .w-2\\/5 .section,
                    .w-2\\/5 div[class*="section"],
                    .w-2\\/5 .mb-6,
                    .w-2\\/5 .mb-4,
                    .w-2\\/5 .mb-8,
                    [class*="w-2/5"] .cv-section,
                    [class*="w-2/5"] section,
                    [class*="w-2/5"] .section,
                    [class*="w-2/5"] div[class*="section"],
                    [class*="w-2/5"] .mb-6,
                    [class*="w-2/5"] .mb-4,
                    [class*="w-2/5"] .mb-8
                `);
                
                console.log('Found left panel sections:', leftPanelSections.length);
                
                leftPanelSections.forEach((el) => {
                    const element = el as HTMLElement;
                    element.style.setProperty('background-color', '#1e3a8a', 'important');
                    element.style.setProperty('background', '#1e3a8a', 'important');
                    element.style.setProperty('color', 'white', 'important');
                    // Section-ın özünün border-ini ləğv et
                    element.style.setProperty('border', 'none', 'important');
                    element.style.setProperty('border-color', 'transparent', 'important');
                    element.style.setProperty('outline', 'none', 'important');
                    
                    // Section içindəki elementləri də ağ text et və BAŞLIQ XƏTTLƏRİNİ QORU
                    const sectionChildren = element.querySelectorAll('*');
                    sectionChildren.forEach((child) => {
                        const childEl = child as HTMLElement;
                        childEl.style.setProperty('color', 'white', 'important');
                        childEl.style.setProperty('background-color', 'transparent', 'important');
                        childEl.style.setProperty('background', 'transparent', 'important');
                        childEl.style.setProperty('outline', 'none', 'important');
                        
                        // Section başlıqları və HR elementləri üçün ağ border
                        const isHeading = childEl.tagName === 'H2' || childEl.tagName === 'H3' || 
                                        childEl.classList.contains('section-title') || 
                                        childEl.classList.contains('cv-section-title');
                        
                        const isHR = childEl.tagName === 'HR';
                        
                        if (isHeading) {
                            childEl.style.setProperty('border-bottom', '1px solid white', 'important');
                            childEl.style.setProperty('border-color', 'white', 'important');
                        } else if (isHR) {
                            childEl.style.setProperty('border-color', 'white', 'important');
                            childEl.style.setProperty('background-color', 'white', 'important');
                        } else {
                            // Digər elementlər üçün border yoxdur
                            childEl.style.setProperty('border', 'none', 'important');
                            childEl.style.setProperty('border-color', 'transparent', 'important');
                        }
                    });
                });
                
                console.log(`✅ Atlas CORRECT design fix completed:`);
                console.log(`   🔵 Left panel + sections: #1e3a8a göy + ağ text`);
                console.log(`   ⚪ Right panel + sections: Ağ background + qara text`);
                console.log('✅ Sol paneldəki contact, skills, languages: GÖY - BORDER LEĞVİ');
                console.log('✅ Sağ paneldəki experience, education, projects: AĞ');
            });
            
            console.log('✅ Atlas template complete design fix applied successfully');
        }
        
        // Basic Template üçün border rəng və layout düzəlişi
        if (isBasicTemplate) {
            console.log('🎯 Basic Template detected - applying border color and layout fix');
            
            await page.addStyleTag({
                content: `
                    /* Basic template border color fix */
                    .basic-template .border-b-2,
                    .cv-section.border-b-2,
                    div[style*="border-bottom"]:not([style*="border-color"]) {
                        border-color: var(--cv-primary-color) !important;
                        border-bottom-color: var(--cv-primary-color) !important;
                    }
                    
                    /* All section headers use primary color for border */
                    .cv-section h2 {
                        border-bottom-color: var(--cv-primary-color) !important;
                        border-color: var(--cv-primary-color) !important;
                    }
                    
                    /* Contact info layout fix */
                    .contact-info {
                        text-align: center !important;
                        line-height: 1.4 !important;
                        color: var(--cv-secondary-color) !important;
                        font-size: var(--cv-small-size) !important;
                    }
                    
                    /* Basic template header styling */
                    .basic-template .text-center .border-b-2 {
                        border-bottom: 2px solid var(--cv-primary-color) !important;
                    }
                    
                    /* Force primary color on all borders in basic template */
                    .basic-template [style*="border-bottom"],
                    .basic-template .border-b,
                    .basic-template .border-b-2 {
                        border-bottom-color: var(--cv-primary-color) !important;
                    }
                    
                    /* Override any hardcoded border colors */
                    .basic-template * {
                        --tw-border-opacity: 1;
                        border-color: var(--cv-primary-color);
                    }
                `
            });
            
            console.log('✅ Basic template border color and layout fix applied successfully');
        }
        
        // Basic Template üçün border rəng düzəlişi
        if (normalizedTemplateId.includes('basic') || normalizedTemplateId === 'traditional') {
            console.log('🎯 Basic Template detected - applying border color fix');
            
            await page.addStyleTag({
                content: `
                    /* Basic template border color fix */
                    .basic-template .border-b-2,
                    .cv-section.border-b-2,
                    div[style*="border-bottom"]:not([style*="border-color"]) {
                        border-color: var(--cv-primary-color) !important;
                        border-bottom-color: var(--cv-primary-color) !important;
                    }
                    
                    /* Contact info layout fix */
                    .contact-info {
                        text-align: center !important;
                        line-height: 1.4 !important;
                        color: var(--cv-secondary-color) !important;
                        font-size: var(--cv-small-size) !important;
                    }
                `
            });
            
            console.log('✅ Basic template border color fix applied successfully');
        }
        
        // Sadə və təbii PDF axını
        if (templateExists) {
            await page.evaluate(() => {
                console.log('=== TƏBİİ PDF AXIN - SADƏ YANAŞMA ===');
                
                // Template-i tap
                const template = document.querySelector('.basic-template') as HTMLElement ||
                                document.querySelector('[class*="template"]') as HTMLElement ||
                                document.body as HTMLElement;
                
                if (template) {
                    // Təbii axın üçün sadə hazırlıq
                    template.style.height = 'auto';
                    template.style.minHeight = 'auto';
                    template.style.overflow = 'visible';
                    
                    console.log('✅ Template təbii PDF axını üçün hazırlandı');
                    console.log('Template yüksəkliyi:', template.scrollHeight + 'px');
                } else {
                    console.log('❌ Template tapılmadı');
                }
                
                console.log('=== TƏBİİ PDF AXIN HAZIR ===');
            });
        } else {
            console.log('Template yoxdur, təbii axından istifadə edirik');
        }

        // SELECTIVE BACKGROUND COLOR ENFORCEMENT - Preserve colored backgrounds, remove generic white
        await page.evaluate(() => {
            console.log('=== SELECTIVE BACKGROUND COLOR ENFORCEMENT ===');
            
            // First, remove PDF viewer base backgrounds but keep template backgrounds
            document.body.style.setProperty('background', 'transparent', 'important');
            document.body.style.setProperty('background-color', 'transparent', 'important');
            document.documentElement.style.setProperty('background', 'transparent', 'important');
            document.documentElement.style.setProperty('background-color', 'transparent', 'important');
            
            // Remove white backgrounds from generic containers only
            const genericContainers = document.querySelectorAll(
                '.cv-preview, .cv-container'
            );
            
            genericContainers.forEach(el => {
                const element = el as HTMLElement;
                element.style.setProperty('background', 'transparent', 'important');
                element.style.setProperty('background-color', 'transparent', 'important');
                element.style.setProperty('background-image', 'none', 'important');
            });
            
            // Force specific template backgrounds to show
            const essenceTemplate = document.querySelector('.essence-template') as HTMLElement;
            if (essenceTemplate) {
                essenceTemplate.style.setProperty('background-color', '#F5F5F5', 'important');
                essenceTemplate.style.setProperty('background', '#F5F5F5', 'important');
                essenceTemplate.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                essenceTemplate.style.setProperty('color-adjust', 'exact', 'important');
                essenceTemplate.style.setProperty('print-color-adjust', 'exact', 'important');
                
                // Force green header in Essence template using specific class
                const greenHeader = essenceTemplate.querySelector('.essence-green-header') as HTMLElement;
                if (greenHeader) {
                    greenHeader.style.setProperty('background-color', '#1F4B43', 'important');
                    greenHeader.style.setProperty('background', '#1F4B43', 'important');
                    greenHeader.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                    greenHeader.style.setProperty('color-adjust', 'exact', 'important');
                    greenHeader.style.setProperty('print-color-adjust', 'exact', 'important');
                    console.log('✅ Essence template green header background forced via class name');
                } else {
                    // Fallback to previous selector
                    const greenHeaderFallback = essenceTemplate.querySelector('.p-6.shadow-sm.border-b.mb-6') as HTMLElement;
                    if (greenHeaderFallback) {
                        greenHeaderFallback.style.setProperty('background-color', '#1F4B43', 'important');
                        greenHeaderFallback.style.setProperty('background', '#1F4B43', 'important');
                        greenHeaderFallback.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                        greenHeaderFallback.style.setProperty('color-adjust', 'exact', 'important');
                        greenHeaderFallback.style.setProperty('print-color-adjust', 'exact', 'important');
                        console.log('✅ Essence template green header background forced via fallback selector');
                    }
                }
            }
            
            // Force all elements with non-white background colors to have print-color-adjust
            const elementsWithBg = document.querySelectorAll('*');
            let backgroundElementsFixed = 0;
            
            elementsWithBg.forEach(el => {
                const element = el as HTMLElement;
                const style = window.getComputedStyle(element);
                
                // Preserve any colored backgrounds (not white, transparent, or default)
                if (style.backgroundColor && 
                    style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                    style.backgroundColor !== 'transparent' &&
                    style.backgroundColor !== 'rgb(255, 255, 255)' &&
                    style.backgroundColor !== '#ffffff' &&
                    style.backgroundColor !== 'white') {
                    
                    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                    element.style.setProperty('color-adjust', 'exact', 'important');
                    element.style.setProperty('print-color-adjust', 'exact', 'important');
                    // Force background color to stay
                    element.style.setProperty('background-color', style.backgroundColor, 'important');
                    element.style.setProperty('background', style.backgroundColor, 'important');
                    backgroundElementsFixed++;
                }
                
                // Check if element has inline colored background style
                if (element.style.backgroundColor && 
                    element.style.backgroundColor !== 'transparent' &&
                    element.style.backgroundColor !== '#ffffff' &&
                    element.style.backgroundColor !== 'white') {
                    
                    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                    element.style.setProperty('color-adjust', 'exact', 'important');
                    element.style.setProperty('print-color-adjust', 'exact', 'important');
                    backgroundElementsFixed++;
                }
            });
            
            // Force specific background colors for common elements
            const specificBackgrounds = [
                { selector: '.bg-blue-600', color: '#1e3a8a' },
                { selector: '.bg-blue-500', color: '#3b82f6' },
                { selector: '.bg-gray-100', color: '#f3f4f6' },
                { selector: '.bg-gray-200', color: '#e5e7eb' },
                { selector: '.bg-orange-100', color: '#fed7aa' },
                { selector: '.bg-amber-100', color: '#fef3e2' },
                { selector: '.bg-yellow-100', color: '#fef3c7' },
                { selector: '.bg-green-100', color: '#dcfce7' },
                { selector: '.bg-red-100', color: '#fee2e2' },
                { selector: '.bg-purple-100', color: '#f3e8ff' }
            ];
            
            specificBackgrounds.forEach(({ selector, color }) => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const element = el as HTMLElement;
                    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                    element.style.setProperty('color-adjust', 'exact', 'important');
                    element.style.setProperty('print-color-adjust', 'exact', 'important');
                    element.style.setProperty('background-color', color, 'important');
                    element.style.setProperty('background', color, 'important');
                });
            });
            
            // Force all badge-like elements
            const badgeSelectors = [
                '.badge', '.tag', '.chip', 
                '.text-xs.px-2.py-1.rounded',
                '.inline-block.px-2.py-1.text-xs.rounded',
                '[style*="background-color"]',
                '[style*="backgroundColor"]'
            ];
            
            badgeSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const element = el as HTMLElement;
                    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
                    element.style.setProperty('color-adjust', 'exact', 'important');
                    element.style.setProperty('print-color-adjust', 'exact', 'important');
                    
                    // If element has a background color in style, preserve it
                    const currentBg = element.style.backgroundColor;
                    if (currentBg) {
                        element.style.setProperty('background-color', currentBg, 'important');
                        element.style.setProperty('background', currentBg, 'important');
                    }
                });
            });
            
            console.log(`✅ Fixed ${backgroundElementsFixed} elements with background colors for PDF export`);
            console.log('=== AGGRESSIVE BACKGROUND COLOR ENFORCEMENT COMPLETE ===');
        });

        // EXCLUSIVE TEMPLATE: Calculate actual content and prevent blank pages
        let pdfOptions: any = {
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            tagged: true,
            outline: false,
            omitBackground: true,
            generateDocumentOutline: false,
            generateTaggedPDF: true,
            timeout: 60000,
            margin: {
                top: '5mm',
                right: isBasicTemplate ? '8mm' : isExclusiveTemplate ? '0mm' : '15mm',
                bottom: '15mm',
                left: isBasicTemplate ? '8mm' : isExclusiveTemplate ? '0mm' : '15mm'
            },
            scale: 1.0,
            pageRanges: '',
        };

        // For Exclusive template: Check content height and optimize PDF generation
        if (isExclusiveTemplate) {
            console.log('🎯 Exclusive Template - Applying RADICAL blank page prevention...');
            
            // STEP 1: Force remove ALL empty elements and trailing spaces
            await page.evaluate(() => {
                const template = document.querySelector('.exclusive-template') as HTMLElement;
                if (template) {
                    // Remove ALL empty divs, spans, sections
                    const emptyEls = template.querySelectorAll('*:empty');
                    emptyEls.forEach(el => el.remove());
                    
                    // Remove elements with only whitespace
                    const allEls = template.querySelectorAll('*');
                    allEls.forEach(el => {
                        if (el.textContent?.trim() === '' && 
                            !el.querySelector('img, svg, canvas, input, button')) {
                            el.remove();
                        }
                    });
                    
                    // Force template height to EXACT content
                    const actualContentHeight = template.scrollHeight;
                    console.log('📏 Setting template height to:', actualContentHeight + 'px');
                    template.style.setProperty('height', actualContentHeight + 'px', 'important');
                    template.style.setProperty('max-height', actualContentHeight + 'px', 'important');
                    template.style.setProperty('overflow', 'hidden', 'important');
                    
                    // Remove ALL bottom margins and paddings
                    const allChildren = template.querySelectorAll('*');
                    allChildren.forEach(child => {
                        const el = child as HTMLElement;
                        el.style.setProperty('margin-bottom', '0', 'important');
                        el.style.setProperty('padding-bottom', '0', 'important');
                    });
                }
            });
            
            // STEP 2: Force CSS to prevent ANY page breaks AND MATCH PREVIEW SPACING
            await page.addStyleTag({
                content: `
                    /* NUCLEAR OPTION - FORCE SINGLE PAGE */
                    @page {
                        size: A4;
                        margin: 0 !important;
                    }
                    
                    body, html {
                        height: auto !important;
                        max-height: 297mm !important;
                        overflow: hidden !important;
                        page-break-after: avoid !important;
                    }
                    
                    .exclusive-template {
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        break-after: avoid !important;
                        break-inside: avoid !important;
                        height: auto !important;
                        overflow: hidden !important;
                        padding: 15mm !important; /* Same as preview */
                    }
                    
                    .exclusive-template * {
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                        page-break-before: avoid !important;
                        break-after: avoid !important;
                        break-inside: avoid !important;
                        break-before: avoid !important;
                    }
                    
                    /* MATCH PREVIEW SPACING EXACTLY */
                    
                    /* Header spacing - same as preview */
                    .exclusive-template .mb-6 {
                        margin-bottom: 1.5rem !important; /* 24px - main sections spacing */
                    }
                    
                    /* Section headers - same as preview */
                    .exclusive-template .mb-2 {
                        margin-bottom: 0.5rem !important; /* 8px - section header spacing */
                    }
                    
                    .exclusive-template .pb-1 {
                        padding-bottom: 0.25rem !important; /* 4px - header padding */
                    }
                    
                    /* Content spacing - same as preview */
                    .exclusive-template .space-y-2 > * + * {
                        margin-top: 0.5rem !important; /* 8px - items in experience/education */
                    }
                    
                    .exclusive-template .space-y-3 > * + * {
                        margin-top: 0.75rem !important; /* 12px - larger items spacing */
                    }
                    
                    /* Experience/Education item spacing */
                    .exclusive-template .pb-1 {
                        padding-bottom: 0.25rem !important; /* 4px */
                    }
                    
                    .exclusive-template .pb-2 {
                        padding-bottom: 0.5rem !important; /* 8px */
                    }
                    
                    /* Text spacing */
                    .exclusive-template .mb-1 {
                        margin-bottom: 0.25rem !important; /* 4px - small spacing */
                    }
                    
                    .exclusive-template .mt-0\\.5 {
                        margin-top: 0.125rem !important; /* 2px - very small spacing */
                    }
                    
                    .exclusive-template .mt-1 {
                        margin-top: 0.25rem !important; /* 4px - description spacing */
                    }
                    
                    /* Skills and languages */
                    .exclusive-template .gap-2 {
                        gap: 0.5rem !important; /* 8px - grid gap */
                    }
                    
                    .exclusive-template .gap-1 {
                        gap: 0.25rem !important; /* 4px - flex gap */
                    }
                    
                    /* Summary section specific */
                    .exclusive-template [style*="marginTop: 16px"] {
                        margin-top: 1rem !important; /* 16px - summary section top margin */
                    }
                    
                    /* Custom sections spacing */
                    .exclusive-template [style*="gap: 4px"] {
                        gap: 0.25rem !important; /* 4px - custom sections gap */
                    }
                    
                    .exclusive-template [style*="marginBottom: 8px"] {
                        margin-bottom: 0.5rem !important; /* 8px - between custom sections */
                    }
                    
                    /* Hide anything that goes beyond first page */
                    @media print {
                        .exclusive-template {
                            max-height: 267mm !important; /* A4 minus padding */
                            overflow: hidden !important;
                        }
                    }
                `
            });
            
            // STEP 3: Force viewport to exact A4 size
            await page.setViewport({
                width: 794,   // A4 width
                height: 1123, // A4 height
                deviceScaleFactor: 1
            });
            
            pdfOptions.pageRanges = '1'; // FORCE only first page
            pdfOptions.height = '297mm';
            pdfOptions.width = '210mm';
            pdfOptions.margin = { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' };
        }

        const pdfBuffer = await page.pdf(pdfOptions);

        // EXCLUSIVE TEMPLATE POST-PROCESSING: Verify PDF page count
        if (isExclusiveTemplate) {
            console.log('📄 PDF generated for Exclusive template, size:', pdfBuffer.length, 'bytes');
            
            // Check if PDF has multiple pages (basic check by file size)
            if (pdfBuffer.length > 50000) { // If PDF is suspiciously large, might have extra pages
                console.log('⚠️ Warning: PDF might contain extra pages. File size:', pdfBuffer.length);
            }
        }

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
                margin: 15mm 15mm !important; /* Bütün səhifələrdə bərabər margin-lar */
                padding: 0 !important;
                border: none !important;
                background: white !important; /* Ağ arxa plan */
            }
            
            html {
                background: white !important; /* HTML ağ arxa plan */
                margin: 0 !important;
                padding: 0 !important;
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
                background: white !important; /* Body ağ arxa plan */
                background-color: white !important; /* Əlavə ağ arxa plan təminatı */
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
                background: white !important; /* CV Preview ağ arxa plan */
                background-color: white !important; /* Əlavə ağ arxa plan təminatı */
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
            background: white;
            background-color: white;
        ">
            <!-- Header -->
            <div class="cv-section avoid-break text-center mb-8 border-b-2 pb-4" style="border-bottom: 2px solid var(--cv-primary-color) !important; border-color: var(--cv-primary-color) !important;">
                <h1 style="color: var(--cv-primary-color); font-size: var(--cv-heading-size); font-weight: bold; margin: 0; margin-bottom: var(--cv-spacing-sm);">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                <div class="contact-info" style="color: var(--cv-secondary-color); font-size: var(--cv-small-size); text-align: center; line-height: 1.4;">
                    ${[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(' | ')}
                </div>
            </div>

            <!-- Summary -->
            ${personalInfo.summary ? `
            <div class="cv-section mb-6">
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-primary-color) !important; padding-bottom: var(--cv-spacing-xs);">
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
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-primary-color) !important; padding-bottom: var(--cv-spacing-xs);">
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
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-primary-color) !important; padding-bottom: var(--cv-spacing-xs);">
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
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-primary-color) !important; padding-bottom: var(--cv-spacing-xs);">
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
                <h2 style="color: var(--cv-primary-color); font-size: var(--cv-subheading-size); font-weight: bold; margin-bottom: var(--cv-spacing-sm); border-bottom: 1px solid var(--cv-primary-color) !important; padding-bottom: var(--cv-spacing-xs);">
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