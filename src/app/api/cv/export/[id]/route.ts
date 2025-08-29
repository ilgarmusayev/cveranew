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
                '--lang=az'
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
            // Front-end-dən gələn HTML content istifadə et
            html = `
                <!DOCTYPE html>
                <html lang="az">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>CV Export</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
                        
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
                            unicode-bidi: normal !important;
                            direction: ltr !important;
                        }
                        
                        /* Azərbaycan dili üçün genişləndirilmiş font support */
                        body, html {
                            font-family: 'Roboto', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif !important;
                            -webkit-font-feature-settings: "liga", "kern", "clig" !important;
                            font-feature-settings: "liga", "kern", "clig" !important;
                            text-rendering: optimizeLegibility;
                            unicode-bidi: normal;
                        }
                        
                        /* Specific support for Azerbaijani characters */
                        h1, h2, h3, h4, h5, h6, p, span, div, li {
                            font-family: 'Roboto', 'DejaVu Sans', Arial, sans-serif !important;
                            unicode-bidi: normal;
                            text-rendering: optimizeLegibility;
                        }
                        
                        /* Font weights və digər text stilləri */
                        .font-bold, .font-semibold {
                            font-weight: bold !important;
                        }
                        
                        .font-medium {
                            font-weight: 500 !important;
                        }
                        
                        .font-normal {
                            font-weight: normal !important;
                        }
                        
                        .font-light {
                            font-weight: 300 !important;
                        }
                        
                        .font-thin {
                            font-weight: 100 !important;
                        }
                        
                        .font-extralight {
                            font-weight: 200 !important;
                        }
                        
                        .font-extrabold {
                            font-weight: 800 !important;
                        }
                        
                        .font-black {
                            font-weight: 900 !important;
                        }
                        
                        /* Numeric font weights */
                        .font-100 { font-weight: 100 !important; }
                        .font-200 { font-weight: 200 !important; }
                        .font-300 { font-weight: 300 !important; }
                        .font-400 { font-weight: 400 !important; }
                        .font-500 { font-weight: 500 !important; }
                        .font-600 { font-weight: 600 !important; }
                        .font-700 { font-weight: 700 !important; }
                        .font-800 { font-weight: 800 !important; }
                        .font-900 { font-weight: 900 !important; }
                        
                        /* Font styles */
                        .italic {
                            font-style: italic !important;
                        }
                        
                        .not-italic {
                            font-style: normal !important;
                        }
                        
                        /* Text decorations */
                        .underline {
                            text-decoration: underline !important;
                        }
                        
                        .no-underline {
                            text-decoration: none !important;
                        }
                        
                        .line-through {
                            text-decoration: line-through !important;
                        }
                        
                        /* Text transform */
                        .uppercase {
                            text-transform: uppercase !important;
                        }
                        
                        .lowercase {
                            text-transform: lowercase !important;
                        }
                        
                        .capitalize {
                            text-transform: capitalize !important;
                        }
                        
                        .normal-case {
                            text-transform: none !important;
                        }
                        
                        /* Text sizes və font weights */
                        .text-lg {
                            font-size: 18px !important;
                        }
                        
                        .text-base {
                            font-size: 16px !important;
                        }
                        
                        .text-sm {
                            font-size: 14px !important;
                        }
                        
                        .text-xs {
                            font-size: 12px !important;
                        }
                        
                        .text-xl {
                            font-size: 20px !important;
                        }
                        
                        .text-2xl {
                            font-size: 24px !important;
                        }
                        
                        .text-3xl {
                            font-size: 30px !important;
                        }
                        
                        /* Heading styles with proper weights */
                        h1 {
                            font-weight: bold !important;
                            font-size: 24px !important;
                        }
                        
                        h2 {
                            font-weight: bold !important;
                            font-size: 20px !important;
                        }
                        
                        h3 {
                            font-weight: 600 !important;
                            font-size: 18px !important;
                        }
                        
                        h4 {
                            font-weight: 600 !important;
                            font-size: 16px !important;
                        }
                        
                        /* Strong və bold taglar */
                        strong, b {
                            font-weight: bold !important;
                        }
                        
                        body {
                            margin: 0;
                            padding: 0;
                            background: white;
                            font-family: ${fontSettings?.fontFamily || 'Arial, sans-serif'};
                            
                            /* CSS Variables */
                            --cv-font-family: ${fontSettings?.fontFamily || 'Arial, sans-serif'};
                            --cv-heading-size: ${fontSettings?.headingSize || 18}px;
                            --cv-subheading-size: ${fontSettings?.subheadingSize || 16}px;
                            --cv-body-size: ${fontSettings?.bodySize || 14}px;
                            --cv-small-size: ${fontSettings?.smallSize || 12}px;
                        }
                        
                        /* A4 page ayarları - kenar boşluqsuz, yalnız səhifə arası boşluq */
                        @page {
                            size: A4;
                            margin: 0;  /* Heç bir kenar boşluq - preview kimi tam kenardan */
                        }
                        
                        /* Səhifə arası ayırma ayarları - yalnız səhifə sonunda boşluq */
                        .page-break {
                            page-break-before: always;
                            padding-top: 10mm; /* Yeni səhifənin yuxarısında boşluq */
                        }
                        
                        .avoid-break {
                            page-break-inside: avoid;
                        }
                        
                        /* CV section-lar üçün səhifə arası ayırma */
                        .cv-section {
                            page-break-inside: avoid;
                            margin-bottom: 15px; /* Section-lar arası normal boşluq */
                        }
                        
                        .cv-section h2, .cv-section h3 {
                            page-break-after: avoid;
                        }
                        
                        /* Səhifə sonunda əlavə boşluq */
                        .cv-section:last-child {
                            padding-bottom: 10mm;
                        }
                        
                        /* CV container - tam kenardan, heç bir margin və padding yoxdur */
                        .cv-preview {
                            width: 210mm !important;  /* Tam A4 eni */
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            /* Template öz padding-ini saxlayacaq, amma container-in padding-i yoxdur */
                            transform: none !important;
                            scale: 1 !important;
                            border: none !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                            page-break-inside: auto; /* Səhifə arası keçişə icazə ver */
                        }
                        
                        /* Template container - tam kenardan görünüm */
                        .cv-template {
                            width: 100% !important;
                            margin: 0 !important;
                            /* Template öz padding-ini saxlayacaq */
                            transform: none !important;
                            scale: 1 !important;
                        }
                        
                        /* Remove all interactive elements and hover effects for PDF */
                        .hover\\:bg-gray-50:hover,
                        .hover\\:bg-blue-50:hover,
                        .hover\\:bg-gray-100:hover,
                        .hover\\:bg-blue-100:hover,
                        .hover\\:shadow-md:hover,
                        .hover\\:shadow-lg:hover,
                        .hover\\:border:hover {
                            background-color: transparent !important;
                            box-shadow: none !important;
                            border: none !important;
                            transform: none !important;
                        }
                        
                        .drag-handle,
                        .section-drag-indicator,
                        .cursor-move,
                        .cursor-pointer,
                        .group,
                        .relative.group {
                            cursor: default !important;
                            transform: none !important;
                            background-color: transparent !important;
                            box-shadow: none !important;
                        }
                        
                        /* Hide any buttons or interactive elements */
                        button,
                        .edit-button,
                        .delete-button,
                        .add-button {
                            display: none !important;
                        }
                        
                        /* Text colors */
                        .text-gray-700 {
                            color: #374151 !important;
                        }
                        
                        .text-gray-800 {
                            color: #1f2937 !important;
                        }
                        
                        .text-gray-900 {
                            color: #111827 !important;
                        }
                        
                        .text-blue-600 {
                            color: #2563eb !important;
                        }
                        
                        .text-blue-700 {
                            color: #1d4ed8 !important;
                        }
                        
                        .text-black {
                            color: #000000 !important;
                        }
                        
                        .text-white {
                            color: #ffffff !important;
                        }
                        
                        /* Template spesifik font weights */
                        .aurora-heading {
                            font-weight: bold !important;
                        }
                        
                        .vertex-heading {
                            font-weight: 700 !important;
                        }
                        
                        .horizon-heading {
                            font-weight: 600 !important;
                        }
                        
                        .lumen-heading {
                            font-weight: 600 !important;
                        }
                        
                        .modern-heading {
                            font-weight: bold !important;
                        }
                        
                        .ats-heading {
                            font-weight: bold !important;
                        }
                        
                        .exclusive-heading {
                            font-weight: 700 !important;
                        }
                        
                        /* Section title weights */
                        .section-title {
                            font-weight: bold !important;
                        }
                        
                        .job-title {
                            font-weight: 600 !important;
                        }
                        
                        .company-name {
                            font-weight: 500 !important;
                        }
                        
                        /* Name və contact font weights */
                        .cv-name {
                            font-weight: bold !important;
                            font-size: 24px !important;
                        }
                        
                        .cv-title {
                            font-weight: 500 !important;
                            font-size: 16px !important;
                        }
                        
                        .cv-contact {
                            font-weight: normal !important;
                        }
                        
                        /* Skill və education weights */
                        .skill-name {
                            font-weight: 500 !important;
                        }
                        
                        .education-degree {
                            font-weight: 600 !important;
                        }
                        
                        .education-school {
                            font-weight: 500 !important;
                        }
                        
                        /* Exclusive Template Sadələşdirilmiş CSS */
                        .exclusive-template {
                            padding: 10mm 15mm !important; /* Yuxarı padding azaldıldı */
                            background: white !important;
                            min-height: 297mm !important;
                            font-family: var(--cv-font-family, "Inter", sans-serif) !important;
                        }
                        
                        /* İlk səhifənin yuxarı boşluğunu azalt */
                        .exclusive-template > div:first-child {
                            margin-top: 0 !important;
                            padding-top: 0 !important;
                        }
                        
                        .exclusive-template .border-b-2 {
                            border-bottom-width: 2px !important;
                        }
                        
                        .exclusive-template .border-2 {
                            border-width: 2px !important;
                        }
                        
                        .exclusive-template .border {
                            border-width: 1px !important;
                        }
                        
                        .exclusive-template .border-blue-600 {
                            border-color: #2563eb !important;
                        }
                        
                        .exclusive-template .border-gray-200 {
                            border-color: #e5e7eb !important;
                        }
                        
                        .exclusive-template .border-blue-200 {
                            border-color: #dbeafe !important;
                        }
                        
                        .exclusive-template .border-green-200 {
                            border-color: #bbf7d0 !important;
                        }
                        
                        .exclusive-template .border-gray-300 {
                            border-color: #d1d5db !important;
                        }
                        
                        .exclusive-template .bg-blue-100 {
                            background-color: #ffffff !important; /* Ağ background */
                        }
                        
                        .exclusive-template .bg-green-100 {
                            background-color: #ffffff !important; /* Ağ background */
                        }
                        
                        .exclusive-template .bg-gray-100 {
                            background-color: #ffffff !important; /* Ağ background */
                        }
                        
                        .exclusive-template .text-blue-800 {
                            color: #1f2937 !important; /* Qara text */
                        }
                        
                        .exclusive-template .text-green-800 {
                            color: #1f2937 !important; /* Qara text */
                        }
                        
                        .exclusive-template .px-2 {
                            padding-left: 0.5rem !important;
                            padding-right: 0.5rem !important;
                        }
                        
                        .exclusive-template .py-1 {
                            padding-top: 0.25rem !important;
                            padding-bottom: 0.25rem !important;
                        }
                        
                        .exclusive-template .p-4 {
                            padding: 1rem !important;
                        }
                        
                        .exclusive-template .p-6 {
                            padding: 1.5rem !important;
                        }
                        
                        .exclusive-template .pb-2 {
                            padding-bottom: 0.5rem !important;
                        }
                        
                        /* Tam sadə layout CSS */
                        .exclusive-template .flex {
                            display: flex !important;
                        }
                        
                        .exclusive-template .flex-row {
                            flex-direction: row !important;
                        }
                        
                        .exclusive-template .flex-1 {
                            flex: 1 1 0% !important;
                        }
                        
                        .exclusive-template .flex-shrink-0 {
                            flex-shrink: 0 !important;
                        }
                        
                        .exclusive-template .items-start {
                            align-items: flex-start !important;
                        }
                        
                        .exclusive-template .justify-between {
                            justify-content: space-between !important;
                        }
                        
                        .exclusive-template .text-left {
                            text-align: left !important;
                        }
                        
                        .exclusive-template .text-right {
                            text-align: right !important;
                        }
                        
                        .exclusive-template .grid {
                            display: grid !important;
                        }
                        
                        .exclusive-template .grid-cols-3 {
                            grid-template-columns: repeat(3, 1fr) !important;
                        }
                        
                        .exclusive-template .grid-cols-2 {
                            grid-template-columns: repeat(2, 1fr) !important;
                        }
                        
                        .exclusive-template .gap-2 {
                            gap: 0.5rem !important;
                        }
                        
                        .exclusive-template .gap-4 {
                            gap: 1rem !important;
                        }
                        
                        .exclusive-template .gap-6 {
                            gap: 1.5rem !important;
                        }
                        
                        .exclusive-template .space-y-3 > * + * {
                            margin-top: 0.5rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .space-y-4 > * + * {
                            margin-top: 0.75rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .space-y-6 > * + * {
                            margin-top: 1rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .flex-wrap {
                            flex-wrap: wrap !important;
                        }
                        
                        /* Margins */
                        .exclusive-template .mb-2 {
                            margin-bottom: 0.5rem !important;
                        }
                        
                        .exclusive-template .mb-4 {
                            margin-bottom: 0.75rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .mb-6 {
                            margin-bottom: 1rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .mt-1 {
                            margin-top: 0.25rem !important;
                        }
                        
                        .exclusive-template .mt-6 {
                            margin-top: 1.5rem !important;
                        }
                        
                        .exclusive-template .mb-8 {
                            margin-bottom: 1rem !important; /* Azaldıldı */
                        }
                        
                        .exclusive-template .pt-4 {
                            padding-top: 1rem !important;
                        }
                        
                        .exclusive-template .border-t {
                            border-top-width: 1px !important;
                        }
                        
                        /* Image styling */
                        .exclusive-template img {
                            max-width: 100% !important;
                            height: auto !important;
                        }
                        
                        .exclusive-template .w-32 {
                            width: 8rem !important;
                        }
                        
                        .exclusive-template .h-32 {
                            height: 8rem !important;
                        }
                        
                        .exclusive-template .rounded-full {
                            border-radius: 50% !important;
                        }
                        
                        .exclusive-template .object-cover {
                            object-fit: cover !important;
                        }
                        
                        /* Text utilities */
                        .exclusive-template .uppercase {
                            text-transform: uppercase !important;
                        }
                        
                        .exclusive-template .break-all {
                            word-break: break-all !important;
                        }
                        
                        .exclusive-template .italic {
                            font-style: italic !important;
                        }
                        
                        .exclusive-template .underline {
                            text-decoration: underline !important;
                        }
                        
                        .exclusive-template .leading-relaxed {
                            line-height: 1.625 !important;
                        }
                        
                        /* Links */
                        .exclusive-template a {
                            color: inherit !important;
                        }
                        
                        .exclusive-template a:hover {
                            color: #2563eb !important;
                        }
                        ${cssContent}
                    </style>
                </head>
                <body>
                    ${htmlContent}
                </body>
                </html>
            `;
        } else {
            // Fallback: köhnə method
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
            // Force UTF-8 encoding
            if (document.characterSet !== 'UTF-8') {
                const meta = document.querySelector('meta[charset]') || document.createElement('meta');
                meta.setAttribute('charset', 'UTF-8');
                if (!document.head.contains(meta)) {
                    document.head.appendChild(meta);
                }
            }
        });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            // Unicode və font support üçün əlavə ayarlar
            tagged: true,  // PDF/A accessibility və unicode dəstəyi
            outline: false,
            margin: {
                top: '8mm',       // 8mm üst boşluq - çox minimal
                right: '6mm',     // 6mm sağ boşluq - çox minimal  
                bottom: '8mm',    // 8mm alt boşluq - çox minimal
                left: '6mm'       // 6mm sol boşluq - çox minimal
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
                margin: 15mm 12mm; /* Minimal CV margins: üst/alt 15mm, sol/sağ 12mm */
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
