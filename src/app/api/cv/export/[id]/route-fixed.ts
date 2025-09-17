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
    console.log('=== PDF Export API başladı (FIXED VERSION) ===');
    
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
        const { data, templateId, fontSettings } = body;

        console.log('Request body alındı:', { 
            templateId, 
            dataKeys: Object.keys(data || {}),
            fontSettings: fontSettings ? 'mövcud' : 'yox'
        });

        // Browser başlat - PRODUCTION SAFE
        browser = await initializeBrowser();
        const page = await browser.newPage();
        
        // Viewport və encoding
        await page.setViewport({ width: 794, height: 1123 }); // A4 viewport
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'az-AZ,az;q=0.9,en;q=0.8'
        });

        // HTML content yaradımı - PRODUCTION SAFE FONTS
        const htmlContent = generateProductionSafeCVHTML(data, templateId, fontSettings);
        
        console.log('HTML content yaradıldı, browser-ə set edilir...');
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // PDF yaradımı
        console.log('PDF yaradılır...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: false,
            displayHeaderFooter: false,
            margin: {
                top: '8mm',
                right: '6mm',
                bottom: '15mm',
                left: '6mm'
            },
            scale: 1,
            width: '210mm',
            height: '297mm'
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
        
        // Browser cleanup
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

// PRODUCTION SAFE BROWSER INITIALIZATION
async function initializeBrowser() {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = process.env.VERCEL === '1';
    
    console.log('Browser initialization:', { isProduction, isVercel });

    if (isProduction || isVercel) {
        // Vercel production - use chromium package
        console.log('Using @sparticuz/chromium for production');
        return await puppeteer.launch({
            headless: true,
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--font-render-hinting=none',
                '--enable-font-antialiasing',
                '--force-device-scale-factor=1',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--lang=az-AZ'
            ],
            executablePath: await chromium.executablePath()
        });
    } else {
        // Local development
        console.log('Using local Chrome for development');
        return await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--font-render-hinting=none',
                '--enable-font-antialiasing',
                '--lang=az-AZ'
            ]
        });
    }
}

// PRODUCTION SAFE HTML GENERATION WITH SYSTEM FONTS ONLY
function generateProductionSafeCVHTML(cvData: any, templateId: string, fontSettings?: any): string {
    const { personalInfo, experience = [], education = [], skills = [], languages = [] } = cvData;

    // PRODUCTION SAFE FONT SYSTEM - NO EXTERNAL DEPENDENCIES
    const safeFont = fontSettings?.fontFamily || 'Arial';
    const headingSize = fontSettings?.headingSize || 18;
    const subheadingSize = fontSettings?.subheadingSize || 16;
    const bodySize = fontSettings?.bodySize || 14;
    const smallSize = fontSettings?.smallSize || 12;

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

    return `
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CV Export</title>
            <style>
                /* PRODUCTION SAFE SYSTEM FONTS - NO EXTERNAL DEPENDENCIES */
                /* Bu system fontlar həm local həm də production environmentlərdə mövcuddur */
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: ${safeFont}, 'Helvetica Neue', Helvetica, 'DejaVu Sans', 'Liberation Sans', Arial, sans-serif;
                    font-size: ${bodySize}px;
                    line-height: 1.5;
                    color: #333;
                    background: white;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }
                
                /* A4 Page Settings */
                @page {
                    size: A4;
                    margin: 8mm 6mm 15mm 6mm;
                }
                
                /* Typography Hierarchy */
                h1 {
                    font-family: ${safeFont}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: ${headingSize}px;
                    font-weight: bold;
                    color: #1a202c;
                    margin-bottom: 8px;
                }
                
                h2 {
                    font-family: ${safeFont}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: ${subheadingSize}px;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 6px;
                    border-bottom: 1px solid #e2e8f0;
                    padding-bottom: 4px;
                }
                
                h3 {
                    font-family: ${safeFont}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: ${bodySize}px;
                    font-weight: bold;
                    color: #2d3748;
                    margin-bottom: 4px;
                }
                
                p {
                    font-family: ${safeFont}, 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: ${bodySize}px;
                    color: #4a5568;
                    margin-bottom: 6px;
                }
                
                .small-text {
                    font-size: ${smallSize}px;
                    color: #718096;
                }
                
                .container {
                    max-width: 100%;
                    margin: 0 auto;
                    padding: 20px;
                }
                
                .section {
                    margin-bottom: 24px;
                    page-break-inside: avoid;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 16px;
                    border-bottom: 2px solid #4a5568;
                }
                
                .contact-info {
                    font-size: ${smallSize}px;
                    color: #718096;
                    margin-top: 8px;
                }
                
                .experience-item,
                .education-item {
                    margin-bottom: 16px;
                    page-break-inside: avoid;
                }
                
                .date-range {
                    font-size: ${smallSize}px;
                    color: #718096;
                    font-style: italic;
                }
                
                .job-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 4px;
                }
                
                .company {
                    font-size: ${smallSize}px;
                    color: #4a5568;
                    font-style: italic;
                    margin-bottom: 6px;
                }
                
                .description {
                    font-size: ${bodySize}px;
                    color: #4a5568;
                    line-height: 1.4;
                }
                
                .skills-list {
                    font-size: ${bodySize}px;
                    color: #4a5568;
                    line-height: 1.6;
                }
                
                /* Page break controls */
                .page-break {
                    page-break-before: always;
                }
                
                .avoid-break {
                    page-break-inside: avoid;
                }
                
                .section h2 {
                    page-break-after: avoid;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- Header Section -->
                <div class="header">
                    <h1>${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                    <div class="contact-info">
                        ${personalInfo.email ? personalInfo.email : ''}
                        ${personalInfo.phone ? ` | ${personalInfo.phone}` : ''}
                        ${personalInfo.location ? ` | ${personalInfo.location}` : ''}
                    </div>
                </div>

                <!-- Summary Section -->
                ${personalInfo.summary ? `
                <div class="section">
                    <h2>ÖZƏT</h2>
                    <p class="description">${stripHtmlTags(personalInfo.summary)}</p>
                </div>
                ` : ''}

                <!-- Experience Section -->
                ${experience.length > 0 ? `
                <div class="section">
                    <h2>İŞ TƏCRÜBƏSİ</h2>
                    ${experience.map((exp: any) => `
                    <div class="experience-item avoid-break">
                        <div class="job-title">
                            <h3>${exp.position}</h3>
                            <span class="date-range">
                                ${formatDate(exp.startDate)} - ${exp.current ? 'Hazırda' : formatDate(exp.endDate || '')}
                            </span>
                        </div>
                        <p class="company">${exp.company}</p>
                        ${exp.description ? `<p class="description">${stripHtmlTags(exp.description)}</p>` : ''}
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Education Section -->
                ${education.length > 0 ? `
                <div class="section">
                    <h2>TƏHSİL</h2>
                    ${education.map((edu: any) => `
                    <div class="education-item avoid-break">
                        <div class="job-title">
                            <h3>${edu.degree}</h3>
                            <span class="date-range">
                                ${formatDate(edu.startDate)} - ${edu.current ? 'Hazırda' : formatDate(edu.endDate || '')}
                            </span>
                        </div>
                        <p class="company">${edu.institution}</p>
                        ${edu.field ? `<p class="small-text">${edu.field}</p>` : ''}
                        ${edu.gpa ? `<p class="small-text">GPA: ${edu.gpa}</p>` : ''}
                    </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Skills Section -->
                ${skills.length > 0 ? `
                <div class="section avoid-break">
                    <h2>BACARIQLAR</h2>
                    <p class="skills-list">
                        ${skills.map((skill: any) => skill.name).join(', ')}
                    </p>
                </div>
                ` : ''}

                <!-- Languages Section -->
                ${languages.length > 0 ? `
                <div class="section avoid-break">
                    <h2>DİLLƏR</h2>
                    <p class="skills-list">
                        ${languages.map((lang: any) => `${lang.language} (${lang.level})`).join(', ')}
                    </p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;
}