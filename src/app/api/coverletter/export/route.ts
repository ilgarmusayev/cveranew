import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { withRateLimit } from '@/lib/rate-limiter';

const isProduction = process.env.NODE_ENV === 'production';

async function handlePOST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { coverLetter, format, jobTitle, companyName } = body;

    if (!coverLetter) {
      return NextResponse.json({ error: 'Cover letter content required' }, { status: 400 });
    }

    if (format === 'pdf') {
      return await generatePDF(coverLetter, jobTitle, companyName);
    } else if (format === 'docx') {
      return await generateDOCX(coverLetter, jobTitle, companyName);
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Cover letter export error:', error);
    return NextResponse.json({ 
      error: error.message || 'Export failed' 
    }, { status: 500 });
  }
}

async function generatePDF(coverLetter: string, jobTitle?: string, companyName?: string): Promise<NextResponse> {
  let browser = null;
  
  try {
    // Initialize browser
    if (isProduction) {
      browser = await puppeteer.launch({
        args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 794, height: 1123 });

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cover Letter</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .cover-letter {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            padding: 0;
          }
          
          .content {
            white-space: pre-wrap;
            word-wrap: break-word;
            text-align: justify;
          }
          
          h1, h2, h3 {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          
          p {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="cover-letter">
          <div class="content">${coverLetter}</div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      },
      scale: 1.0
    });

    await browser.close();

    const fileName = `Cover-Letter-${jobTitle || companyName || 'Default'}.pdf`;
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Browser cleanup error:', e);
      }
    }
    throw error;
  }
}

async function generateDOCX(coverLetter: string, jobTitle?: string, companyName?: string): Promise<NextResponse> {
  try {
    // Validate input
    if (!coverLetter || coverLetter.trim().length === 0) {
      throw new Error('Cover letter content is empty');
    }

    // Split content into paragraphs
    const paragraphs = coverLetter.split('\n').filter(p => p.trim());

    if (paragraphs.length === 0) {
      throw new Error('No valid paragraphs found in cover letter');
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: '20mm',    // 20mm üst kenar
              bottom: '20mm', // 20mm alt kenar  
              left: '20mm',   // 20mm sol kenar
              right: '20mm'   // 20mm sağ kenar
            }
          }
        },
        children: paragraphs.map(paragraph => 
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph,
                font: 'Times New Roman',
                size: 24, // 12pt in half-points
              })
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: {
              after: 200, // Space after paragraph
            }
          })
        )
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Failed to generate DOCX buffer');
    }

    const fileName = `Cover-Letter-${jobTitle || companyName || 'Default'}.docx`;
    
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('DOCX generation error:', error);
    throw new Error(`DOCX creation failed: ${error.message || 'Unknown error'}`);
  }
}

// Rate limited POST export
export const POST = withRateLimit(handlePOST, 'general');