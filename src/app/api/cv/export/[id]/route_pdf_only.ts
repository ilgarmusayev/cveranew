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
                        
                        body {
                            margin: 0;
                            padding: 0;  /* PDF margin-lar Puppeteer tərəfindən idarə olunur */
                            background: white;
                            font-family: ${fontSettings?.fontFamily || 'Arial, sans-serif'};
                            
                            /* CSS Variables */
                            --cv-font-family: ${fontSettings?.fontFamily || 'Arial, sans-serif'};
                            --cv-heading-size: ${fontSettings?.headingSize || 18}px;
                            --cv-subheading-size: ${fontSettings?.subheadingSize || 16}px;
                            --cv-body-size: ${fontSettings?.bodySize || 14}px;
                            --cv-small-size: ${fontSettings?.smallSize || 12}px;
                        }
                        
                        /* A4 page break və margin ayarları */
                        @page {
                            size: A4;
                            margin: 20mm;  /* Bütün tərəflərdə 20mm margin */
                        }
                        
                        /* Page break ayarları */
                        .page-break {
                            page-break-before: always;
                        }
                        
                        .avoid-break {
                            page-break-inside: avoid;
                        }
                        
                        /* CV section-lar üçün page break ayarları */
                        .cv-section {
                            page-break-inside: avoid;
                            margin-bottom: 20px;
                        }
                        
                        .cv-section h2, .cv-section h3 {
                            page-break-after: avoid;
                        }
                        
                        /* Ensure CV container fits within minimal A4 margins */
                        .cv-preview {
                            width: 100% !important;
                            max-width: 186mm !important; /* A4 width (210mm) - minimal margins (24mm total) */
                            height: auto !important;
                            margin: 0 auto !important;
                            padding: 0 !important;
                            transform: none !important;
                            scale: 1 !important;
                            border: none !important;
                            box-shadow: none !important;
                            border-radius: 0 !important;
                            page-break-inside: auto; /* Allow content to break across pages */
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
