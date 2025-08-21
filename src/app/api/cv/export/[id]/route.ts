import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import puppeteer from 'puppeteer';

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
        const { format, templateId, data } = body;

        console.log('Request body alındı:', { format, templateId, dataKeys: Object.keys(data || {}) });

        if (format !== 'pdf') {
            return NextResponse.json(
                { error: 'Yalnız PDF format dəstəklənir' }, 
                { status: 400 }
            );
        }

        // Browser başlat
        console.log('Puppeteer browser başladılır...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
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
                '--disable-ipc-flooding-protection'
            ],
            // Chrome binary auto-detection
            executablePath: process.env.CHROME_BIN || undefined
        });

        console.log('Browser başladıldı, səhifə yaradılır...');
        const page = await browser.newPage();

        // A4 page ayarları
        await page.setViewport({ width: 794, height: 1123 }); // A4 in pixels at 96 DPI

        // CV render etmək üçün HTML yarat
        console.log('HTML generasiya edilir...');
        const html = generateCVHTML(data, templateId);
        console.log('HTML hazırlandı, uzunluq:', html.length);

        // HTML-i səhifəyə yüklə
        console.log('HTML səhifəyə yüklənir...');
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // PDF yarat
        console.log('PDF yaradılır...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '0.5cm',
                right: '0.5cm',
                bottom: '0.5cm',
                left: '0.5cm'
            }
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
        return NextResponse.json(
            { error: 'PDF export xətası baş verdi' }, 
            { status: 500 }
        );
    }
}

function generateCVHTML(cvData: any, templateId: string): string {
    const { personalInfo, experience = [], education = [], skills = [], languages = [], projects = [], certifications = [], volunteerExperience = [] } = cvData;

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

    if (templateId === 'modern-centered') {
        cvHTML = `
            <div style="font-family: 'Inter', Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #374151; max-width: 794px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; border-radius: 12px;">
                    ${personalInfo.profileImage ? `<img src="${personalInfo.profileImage}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 3px solid white;" />` : ''}
                    <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0;">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; font-size: 10px;">
                        ${personalInfo.email ? `<span>📧 ${personalInfo.email}</span>` : ''}
                        ${personalInfo.phone ? `<span>📞 ${personalInfo.phone}</span>` : ''}
                        ${personalInfo.location ? `<span>📍 ${personalInfo.location}</span>` : ''}
                        ${personalInfo.linkedin ? `<span>💼 ${personalInfo.linkedin}</span>` : ''}
                        ${personalInfo.website ? `<span>🌐 ${personalInfo.website}</span>` : ''}
                    </div>
                </div>

                <!-- Summary -->
                ${personalInfo.summary ? `
                <div style="margin-bottom: 25px;">
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
                <div style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        İş Təcrübəsi
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${experience.map((exp: any) => `
                        <div style="border-left: 3px solid #dbeafe; padding-left: 15px;">
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
                <div style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        Təhsil
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${education.map((edu: any) => `
                        <div style="border-left: 3px solid #dbeafe; padding-left: 15px;">
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
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px;">
                    <!-- Skills -->
                    ${skills.length > 0 ? `
                    <div>
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
                    <div>
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
                <div style="margin-bottom: 25px;">
                    <h2 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
                        Layihələr
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${projects.map((project: any) => `
                        <div style="border-left: 3px solid #dbeafe; padding-left: 15px;">
                            <h3 style="font-size: 12px; font-weight: 600; color: #111827; margin: 0 0 3px 0;">${project.name}</h3>
                            ${project.description ? `<p style="font-size: 9px; color: #6b7280; margin: 0 0 3px 0;">${project.description}</p>` : ''}
                            ${project.skills ? `<p style="font-size: 9px; color: #3b82f6; margin: 0;">Texnologiyalar: ${project.skills}</p>` : ''}
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    } else {
        // Default/Traditional template
        cvHTML = `
            <div style="font-family: 'Times New Roman', serif; font-size: 11px; line-height: 1.4; color: #333; max-width: 794px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                    <h1 style="font-size: 24px; font-weight: bold; margin: 0 0 10px 0; color: #333;">${personalInfo.fullName || personalInfo.name || `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim()}</h1>
                    <div style="font-size: 11px; color: #666;">
                        ${personalInfo.email ? `${personalInfo.email}` : ''}
                        ${personalInfo.phone ? ` | ${personalInfo.phone}` : ''}
                        ${personalInfo.location ? ` | ${personalInfo.location}` : ''}
                    </div>
                </div>

                <!-- Summary -->
                ${personalInfo.summary ? `
                <div style="margin-bottom: 20px;">
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
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                        İŞ TƏCRÜBƏSİ
                    </h2>
                    ${experience.map((exp: any) => `
                    <div style="margin-bottom: 15px;">
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
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                        TƏHSİL
                    </h2>
                    ${education.map((edu: any) => `
                    <div style="margin-bottom: 10px;">
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
