import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Header, Footer } from 'docx';

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

        if (!format || (format !== 'pdf' && format !== 'docx')) {
            return NextResponse.json(
                { error: 'Yalnız PDF və DOCX format dəstəklənir' }, 
                { status: 400 }
            );
        }

        // Browser başlat
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
            browser = await puppeteer.launch({
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
        } catch (browserError) {
            console.error('Browser launch error:', browserError);
            
            // Fallback strategy for local development
            if (isLocal) {
                console.log('Trying multiple fallback strategies...');
                
                // Strategy 1: Try with minimal args
                try {
                    console.log('Fallback 1: Minimal args without executablePath');
                    browser = await puppeteer.launch({
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    console.log('Browser started with minimal args');
                } catch (fallback1Error) {
                    console.log('Fallback 1 failed, trying strategy 2...');
                    
                    // Strategy 2: Try @sparticuz/chromium even in local
                    try {
                        console.log('Fallback 2: Using @sparticuz/chromium in local');
                        const chromiumPath = await chromium.executablePath();
                        browser = await puppeteer.launch({
                            headless: true,
                            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                            executablePath: chromiumPath
                        });
                        console.log('Browser started with @sparticuz/chromium in local');
                    } catch (fallback2Error) {
                        console.log('Fallback 2 failed, trying strategy 3...');
                        
                        // Strategy 3: Try puppeteer bundled chromium
                        try {
                            console.log('Fallback 3: Using bundled Chromium');
                            browser = await puppeteer.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                            });
                            console.log('Browser started with bundled Chromium');
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

        // Format-based processing
        if (format === 'docx') {
            return await generateDOCX(data, templateId, fontSettings, cvId);
        } else {
            return await generatePDF(browser, data, templateId, fontSettings, htmlContent, cssContent, cvId);
        }

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

async function generateDOCX(cvData: any, templateId: string, fontSettings: any, cvId: string) {
    console.log('=== DOCX Export başladı ===');
    
    try {
        const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [] } = cvData;
        
        // Default font settings for DOCX
        const defaultFontSettings = {
            fontFamily: 'Arial',
            headingSize: 16,
            subheadingSize: 14,
            bodySize: 11,
            smallSize: 10
        };
        
        const fonts = { ...defaultFontSettings, ...fontSettings };
        
        // Create DOCX document
        const doc = new Document({
            styles: {
                paragraphStyles: [
                    {
                        id: "heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        next: "Normal",
                        run: {
                            size: fonts.headingSize * 2, // DOCX uses half-points
                            bold: true,
                            color: "2563EB",
                        },
                        paragraph: {
                            spacing: { after: 240 },
                        },
                    },
                    {
                        id: "heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        run: {
                            size: fonts.subheadingSize * 2,
                            bold: true,
                            color: "1F2937",
                        },
                        paragraph: {
                            spacing: { after: 120 },
                            border: {
                                bottom: {
                                    color: "auto",
                                    space: 1,
                                    style: BorderStyle.SINGLE,
                                    size: 6,
                                },
                            },
                        },
                    },
                ],
            },
            sections: [
                {
                    properties: {},
                    children: [
                        // Header - Name and Contact Info
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim(),
                                    bold: true,
                                    size: fonts.headingSize * 2,
                                    color: "2563EB",
                                }),
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 200 },
                        }),
                        
                        // Contact Information
                        ...(personalInfo.email || personalInfo.phone || personalInfo.location ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: [
                                            personalInfo.email,
                                            personalInfo.phone,
                                            personalInfo.location,
                                            personalInfo.linkedin,
                                            personalInfo.website
                                        ].filter(Boolean).join(' | '),
                                        size: fonts.smallSize * 2,
                                        color: "6B7280",
                                    }),
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 240 },
                            }),
                        ] : []),
                        
                        // Summary Section
                        ...(personalInfo.summary ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "ÖZƏT",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: personalInfo.summary.replace(/<[^>]*>/g, ''),
                                        size: fonts.bodySize * 2,
                                        color: "374151",
                                    }),
                                ],
                                spacing: { after: 240 },
                            }),
                        ] : []),
                        
                        // Experience Section
                        ...(experience.length > 0 ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "İŞ TƏCRÜBƏSİ",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            ...experience.flatMap((exp: any) => [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: exp.position,
                                            bold: true,
                                            size: fonts.bodySize * 2,
                                            color: "111827",
                                        }),
                                        new TextRun({
                                            text: ` - ${exp.company}`,
                                            size: fonts.bodySize * 2,
                                            color: "2563EB",
                                        }),
                                    ],
                                    spacing: { after: 60 },
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `${formatDateForDOCX(exp.startDate)} - ${exp.current ? 'Hazırda' : formatDateForDOCX(exp.endDate || '')}`,
                                            size: fonts.smallSize * 2,
                                            color: "6B7280",
                                            italics: true,
                                        }),
                                    ],
                                    spacing: { after: 60 },
                                }),
                                ...(exp.description ? [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: exp.description.replace(/<[^>]*>/g, ''),
                                                size: fonts.smallSize * 2,
                                                color: "4B5563",
                                            }),
                                        ],
                                        spacing: { after: 160 },
                                    }),
                                ] : []),
                            ]),
                        ] : []),
                        
                        // Education Section
                        ...(education.length > 0 ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "TƏHSİL",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            ...education.flatMap((edu: any) => [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: edu.degree,
                                            bold: true,
                                            size: fonts.bodySize * 2,
                                            color: "111827",
                                        }),
                                    ],
                                    spacing: { after: 60 },
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: edu.institution,
                                            size: fonts.bodySize * 2,
                                            color: "2563EB",
                                        }),
                                    ],
                                    spacing: { after: 60 },
                                }),
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `${formatDateForDOCX(edu.startDate)} - ${edu.current ? 'Hazırda' : formatDateForDOCX(edu.endDate || '')}`,
                                            size: fonts.smallSize * 2,
                                            color: "6B7280",
                                            italics: true,
                                        }),
                                    ],
                                    spacing: { after: 160 },
                                }),
                            ]),
                        ] : []),
                        
                        // Skills Section
                        ...(skills.length > 0 ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "BACARIQLAR",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: skills.map((skill: any) => skill.name).join(', '),
                                        size: fonts.bodySize * 2,
                                        color: "374151",
                                    }),
                                ],
                                spacing: { after: 160 },
                            }),
                        ] : []),
                        
                        // Languages Section
                        ...(languages.length > 0 ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "DİLLƏR",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: languages.map((lang: any) => `${lang.language} (${lang.level})`).join(', '),
                                        size: fonts.bodySize * 2,
                                        color: "374151",
                                    }),
                                ],
                                spacing: { after: 160 },
                            }),
                        ] : []),
                        
                        // Projects Section
                        ...(projects.length > 0 ? [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "LAYİHƏLƏR",
                                        bold: true,
                                        size: fonts.subheadingSize * 2,
                                        color: "1F2937",
                                    }),
                                ],
                                spacing: { after: 120 },
                            }),
                            ...projects.flatMap((project: any) => [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: project.name,
                                            bold: true,
                                            size: fonts.bodySize * 2,
                                            color: "111827",
                                        }),
                                    ],
                                    spacing: { after: 60 },
                                }),
                                ...(project.description ? [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: project.description,
                                                size: fonts.smallSize * 2,
                                                color: "4B5563",
                                            }),
                                        ],
                                        spacing: { after: 60 },
                                    }),
                                ] : []),
                                ...(project.skills ? [
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `Texnologiyalar: ${project.skills}`,
                                                size: fonts.smallSize * 2,
                                                color: "2563EB",
                                            }),
                                        ],
                                        spacing: { after: 160 },
                                    }),
                                ] : []),
                            ]),
                        ] : []),
                    ],
                },
            ],
        });
        
        // Generate DOCX buffer
        const buffer = await Packer.toBuffer(doc);
        
        console.log('DOCX yaradıldı, ölçü:', buffer.length, 'bytes');
        
        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="CV-${cvId}.docx"`,
                'Cache-Control': 'no-cache'
            }
        });
        
    } catch (error) {
        console.error('DOCX export xətası:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `DOCX export xətası: ${errorMsg}` }, 
            { status: 500 }
        );
    }
}

function formatDateForDOCX(dateStr: string): string {
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
                bottom: '15mm',   // 15mm alt boşluq - as requested
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

    if (templateId === 'modern-centered') {
        cvHTML = `
            <!DOCTYPE html>
            <html lang="az">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
                </style>
                ${pdfStyles}
            </head>
            <body>
            <div class="cv-preview" style="
                font-family: ${fonts.fontFamily}; 
                font-size: ${fonts.bodySize}px; 
                line-height: 1.4; 
                color: #374151; 
                max-width: 186mm; 
                margin: 0 auto; 
                padding: 0;
                --cv-font-family: ${fonts.fontFamily};
                --cv-heading-size: ${fonts.headingSize}px;
                --cv-subheading-size: ${fonts.subheadingSize}px;
                --cv-body-size: ${fonts.bodySize}px;
                --cv-small-size: ${fonts.smallSize}px;
            ">
                <style>
                    .cv-preview h1 { font-size: var(--cv-heading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview h2 { font-size: var(--cv-subheading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview h3 { font-size: var(--cv-subheading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview p, .cv-preview span, .cv-preview div { font-size: var(--cv-body-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview .small-text { font-size: var(--cv-small-size) !important; font-family: var(--cv-font-family) !important; }
                </style>
                <!-- Header -->
                <div class="cv-section avoid-break" style="text-align: center; margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border-radius: 12px;">
                    ${personalInfo.profileImage ? `<img src="${personalInfo.profileImage}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 3px solid white;" />` : ''}
                    <h1 style="font-size: ${fonts.headingSize}px; font-weight: bold; margin: 0 0 10px 0;">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; font-size: ${fonts.smallSize}px;">
                        ${personalInfo.email ? `<span>📧 ${personalInfo.email}</span>` : ''}
                        ${personalInfo.phone ? `<span>📞 ${personalInfo.phone}</span>` : ''}
                        ${personalInfo.location ? `<span>📍 ${personalInfo.location}</span>` : ''}
                        ${personalInfo.linkedin ? `<span>💼 ${personalInfo.linkedin}</span>` : ''}
                        ${personalInfo.website ? `<span>🌐 ${personalInfo.website}</span>` : ''}
                    </div>
                </div>

                <!-- Summary -->
                ${personalInfo.summary ? `
                <div class="cv-section" style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        Özət
                    </h2>
                    <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                        ${stripHtmlTags(personalInfo.summary)}
                    </p>
                </div>
                ` : ''}

                <!-- Experience -->
                ${experience.length > 0 ? `
                <div class="cv-section" style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        İş Təcrübəsi
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${experience.map((exp: any) => `
                        <div class="avoid-break" style="border-left: 3px solid #dbeafe; padding-left: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                                <div>
                                    <h3 style="font-size: 12px; font-weight: 600; color: #111827; margin: 0;">${exp.position}</h3>
                                    <p style="font-size: 10px; color: #3b82f6; font-weight: 500; margin: 2px 0;">${exp.company}</p>
                                </div>
                                <span style="font-size: 9px; color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 12px;">
                                    ${formatDate(exp.startDate)} - ${exp.current ? 'Hazırda' : formatDate(exp.endDate || '')}
                                </span>
                            </div>
                            ${exp.description ? `<p style="font-size: 9px; color: #6b7280; line-height: 1.5; margin: 0;">${stripHtmlTags(exp.description)}</p>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Education -->
                ${education.length > 0 ? `
                <div class="cv-section" style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        Təhsil
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${education.map((edu: any) => `
                        <div class="avoid-break" style="border-left: 3px solid #dbeafe; padding-left: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px;">
                                <h3 style="font-size: 12px; font-weight: 600; color: #111827; margin: 0;">${edu.degree}</h3>
                                <span style="font-size: 9px; color: #6b7280;">
                                    ${formatDate(edu.startDate)} - ${edu.current ? 'Hazırda' : formatDate(edu.endDate || '')}
                                </span>
                            </div>
                            <p style="font-size: 10px; color: #3b82f6; font-weight: 500; margin: 0;">${edu.institution}</p>
                            ${edu.field ? `<p style="font-size: 9px; color: #6b7280; margin: 0;">${edu.field}</p>` : ''}
                            ${edu.gpa ? `<p style="font-size: 9px; color: #6b7280; margin: 0;">GPA: ${edu.gpa}</p>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Skills & Languages Grid -->
                <div class="cv-section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
                    <!-- Skills -->
                    ${skills.length > 0 ? `
                    <div class="avoid-break">
                        <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                            Bacarıqlar
                        </h2>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${skills.map((skill: any) => `
                            <span style="background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 12px; font-size: 9px; font-weight: 500;">
                                ${skill.name}
                            </span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Languages -->
                    ${languages.length > 0 ? `
                    <div class="avoid-break">
                        <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                            Dillər
                        </h2>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${languages.map((lang: any) => `
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 10px; color: #111827; font-weight: 500;">${lang.language}</span>
                                <span style="font-size: 9px; color: #6b7280; background: #f3f4f6; padding: 2px 6px; border-radius: 8px;">${lang.level}</span>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Projects -->
                ${projects.length > 0 ? `
                <div class="cv-section" style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        Layihələr
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${projects.map((project: any) => `
                        <div class="avoid-break" style="border-left: 3px solid #dbeafe; padding-left: 15px;">
                            <h3 style="font-size: 12px; font-weight: 600; color: #111827; margin: 0 0 3px 0;">${project.name}</h3>
                            ${project.description ? `<p style="font-size: 9px; color: #6b7280; margin: 0 0 3px 0;">${project.description}</p>` : ''}
                            ${project.skills ? `<p style="font-size: 9px; color: #3b82f6; margin: 0;">Texnologiyalar: ${project.skills}</p>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            </body>
            </html>
        `;
    } else {
        // Default/Traditional template
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
                --cv-font-family: ${fonts.fontFamily};
                --cv-heading-size: ${fonts.headingSize}px;
                --cv-subheading-size: ${fonts.subheadingSize}px;
                --cv-body-size: ${fonts.bodySize}px;
                --cv-small-size: ${fonts.smallSize}px;
            ">
                <style>
                    .cv-preview h1 { font-size: var(--cv-heading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview h2 { font-size: var(--cv-subheading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview h3 { font-size: var(--cv-subheading-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview p, .cv-preview span, .cv-preview div { font-size: var(--cv-body-size) !important; font-family: var(--cv-font-family) !important; }
                    .cv-preview .small-text { font-size: var(--cv-small-size) !important; font-family: var(--cv-font-family) !important; }
                </style>
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
                ` : ''}

                <!-- Skills -->
                ${skills.length > 0 ? `
                <div style="margin-bottom: 20px;">
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
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                        DİLLƏR
                    </h2>
                    <p style="font-size: 10px; color: #555; line-height: 1.4; margin: 0;">
                        ${languages.map((lang: any) => `${lang.language} (${lang.level})`).join(', ')}
                    </p>
                </div>
                ` : ''}
            </div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>CV Export</title>
            <style>
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; }
                @page { size: A4; margin: 0; }
            </style>
        </head>
        <body>
            ${cvHTML}
        </body>
        </html>
    `;
}
