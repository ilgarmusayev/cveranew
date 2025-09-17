import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { PDFDocument } from 'pdf-lib';

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
        
        // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN FONT SETTINGS OVERRIDE
        // Əgər fontSettings-də başqa font tətbiq olunursa, onu ləğv edib Noto Sans Azerbaijani istifadə et
        let optimizedFontSettings = { ...fontSettings };
        
        if (fontSettings?.fontFamily && fontSettings.fontFamily !== 'Noto Sans Azerbaijani') {
            console.log('⚠️ FontSettings-də başqa font tapıldı:', fontSettings.fontFamily);
            console.log('🔧 Azərbaycan hərfləri üçün Noto Sans Azerbaijani ilə əvəzləyir...');
            
            optimizedFontSettings = {
                ...fontSettings,
                fontFamily: 'Noto Sans Azerbaijani, Noto Sans Display, Noto Sans, Inter, system-ui, sans-serif'
            };
            
            console.log('✅ Font override tamamlandı - Yeni font:', optimizedFontSettings.fontFamily);
        }
        
        // FONT SETTINGS DEBUG - TAM STRUCTURE
        console.log('=== FONT SETTINGS FULL DEBUG ===');
        console.log('Original fontSettings:', JSON.stringify(fontSettings, null, 2));
        console.log('Optimized fontSettings:', JSON.stringify(optimizedFontSettings, null, 2));
        if (optimizedFontSettings) {
            console.log('optimizedFontSettings properties:');
            Object.keys(optimizedFontSettings).forEach(key => {
                console.log(`  ${key}:`, optimizedFontSettings[key]);
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
        
        // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN XÜSUSI ENCODING VƏ FONT SETUP
        console.log('🔧 Setting up Azerbaijani character support...');
        await setupAzerbaijaniSupport(browser);
        
        return await generatePDF(browser, data, templateId, optimizedFontSettings, htmlContent, cssContent, cvId);

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

/**
 * 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN XÜSUSI DƏSTƏK FUNKSIYASI
 * Azerbaijani characters (Ə, Ğ, İ, Ö, Ü, Ç, Ş) üçün browser və font dəstəyini tənzimləyir
 */
async function setupAzerbaijaniSupport(browser: any) {
    console.log('🔧 Azerbaijani character support setup başladı...');
    
    try {
        // Browser context-də Azərbaycan dili və encoding dəstəyini aktivləşdir
        const pages = await browser.pages();
        
        // Hər aktiv page üçün Azərbaycan dəstəyini aktivləşdir
        for (const page of pages) {
            await setupPageAzerbaijaniSupport(page);
        }
        
        console.log('✅ Azerbaijani character support setup tamamlandı');
        
    } catch (error) {
        console.error('❌ Azerbaijani character support setup error:', error);
        console.log('🔄 Continuing with basic Unicode support...');
    }
}

/**
 * 🔧 PAGE SƏVİYYƏSİNDƏ AZƏRBAYCAN HƏRFLƏRİ DƏSTƏYI
 */
async function setupPageAzerbaijaniSupport(page: any) {
    try {
        // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN HTTP HEADERS
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'az-AZ,az;q=0.9,tr-TR;q=0.8,tr;q=0.7,en-US;q=0.6,en;q=0.5',
            'Accept-Charset': 'utf-8,iso-8859-1;q=0.7,*;q=0.3',
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Language': 'az-AZ'
        });
        
        // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN DOCUMENT SETUP
        await page.evaluateOnNewDocument(() => {
            // Force UTF-8 encoding
            if (document.characterSet !== 'UTF-8') {
                const meta = document.createElement('meta');
                meta.setAttribute('charset', 'UTF-8');
                meta.setAttribute('http-equiv', 'Content-Type');
                meta.setAttribute('content', 'text/html; charset=UTF-8');
                document.head?.appendChild(meta);
            }
            
            // Language və locale setup
            document.documentElement.setAttribute('lang', 'az-AZ');
            document.documentElement.setAttribute('xml:lang', 'az-AZ');
            
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN FONT RENDERING OPTIMIZATION
            const style = document.createElement('style');
            style.id = 'azerbaijani-font-support';
            style.textContent = `
                /* 🔧 NOTO SANS AZERBAIJANI - SPECIFIC FONT FOR AZERBAIJANI CHARACTERS */
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Azerbaijani:wght@400;700&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@400;700&display=swap');
                
                /* 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN OPTIMIZED FONT SUPPORT */
                * {
                    font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Inter', 'Roboto', 
                                 'Open Sans', 'Source Sans Pro', 'Noto Sans', 'DejaVu Sans', 
                                 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', 
                                 'Lucida Grande', 'Helvetica Neue', Arial, sans-serif !important;
                    font-synthesis: weight style !important;
                    font-variant-ligatures: common-ligatures !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                    text-rendering: optimizeLegibility !important;
                    -webkit-font-feature-settings: "liga", "kern", "calt" !important;
                    font-feature-settings: "liga", "kern", "calt" !important;
                    -moz-font-feature-settings: "liga", "kern", "calt" !important;
                }
                
                /* 🔧 AZERBAIJANI SPECIFIC CHARACTERS - PRIORITY FONT STACK */
                body, h1, h2, h3, h4, h5, h6, p, span, div, li, a, td, th, input, textarea, select, button,
                [lang="az"], [lang="az-AZ"] {
                    font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Inter', 'Roboto', 
                                 'Open Sans', 'Source Sans Pro', 'Noto Sans', 'DejaVu Sans', 
                                 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', 
                                 'Lucida Grande', 'Helvetica Neue', Arial, sans-serif !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                    text-rendering: optimizeLegibility !important;
                }
                
                /* 🔧 SPESIFIK AZƏRBAYCAN HƏRFLƏRİ SUPPORT */
                *:contains("Ə"), *:contains("ə"), *:contains("Ğ"), *:contains("ğ"),
                *:contains("İ"), *:contains("ı"), *:contains("Ö"), *:contains("ö"),
                *:contains("Ü"), *:contains("ü"), *:contains("Ç"), *:contains("ç"),
                *:contains("Ş"), *:contains("ş") {
                    font-family: 'Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 'Noto Sans', 
                                 'DejaVu Sans', 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', 
                                 'Lucida Grande', 'Helvetica Neue', Arial, sans-serif !important;
                    unicode-bidi: normal !important;
                    direction: ltr !important;
                    text-rendering: optimizeLegibility !important;
                    font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1 !important;
                }
                
                /* 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN ANTI-ALIASING */
                * {
                    -webkit-font-smoothing: antialiased !important;
                    -moz-osx-font-smoothing: grayscale !important;
                    text-rendering: optimizeLegibility !important;
                }
            `;
            document.head?.appendChild(style);
            
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ TEST VƏ LOG
            console.log('🔧 Azerbaijani character support initialized');
            console.log('🔧 Test characters: Ə ə Ğ ğ İ ı Ö ö Ü ü Ç ç Ş ş');
            
            // Font loading event listener
            document.addEventListener('DOMContentLoaded', () => {
                console.log('🔧 DOM loaded, Azerbaijani font support active');
                
                // Test Azerbaijani characters rendering
                const testElement = document.createElement('div');
                testElement.textContent = 'Test Azərbaycan hərfləri: Ə ə Ğ ğ İ ı Ö ö Ü ü Ç ç Ş ş';
                testElement.style.position = 'absolute';
                testElement.style.top = '-9999px';
                testElement.style.fontFamily = 'Inter, Roboto, Arial, sans-serif';
                document.body?.appendChild(testElement);
                
                // Log font metrics for debugging
                const computedStyle = window.getComputedStyle(testElement);
                console.log('🔧 Azerbaijani test element font:', computedStyle.fontFamily);
                console.log('🔧 Azerbaijani test element computed font size:', computedStyle.fontSize);
                
                // Remove test element
                document.body?.removeChild(testElement);
            });
        });
        
        console.log('✅ Page Azerbaijani support setup completed');
        
    } catch (error) {
        console.error('❌ Page Azerbaijani support setup error:', error);
    }
}

async function initializeBrowser() {
    console.log('Puppeteer browser başladılır...');
    
    // Environment detection - Enhanced for production
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = !!process.env.VERCEL;
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY || process.env.LAMBDA_RUNTIME);
    const isLocal = !isServerless && !isProduction;
    
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
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN NUCLEAR UNICODE VƏ FONT DƏSTƏYI
            '--font-render-hinting=none',
            '--enable-font-antialiasing',
            '--force-color-profile=srgb',
            '--lang=az-AZ',
            '--accept-lang=az-AZ,az,tr-TR,tr,en-US,en',
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN ENCODING VƏ CHARACTER SET
            '--default-encoding=utf-8',
            '--locale=az-AZ',
            '--icu-data-dir=/usr/share/icu',
            '--enable-features=FontAccess',
            '--force-device-scale-factor=1',
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN FONT RENDERING
            '--enable-webgl',
            '--enable-accelerated-2d-canvas',
            '--font-cache-shared-handle',
            '--enable-font-antialiasing',
            '--subpixel-font-scaling',
            '--enable-lcd-text',
            // 🔧 PDF EXPORT ÜÇÜN CHARACTER ENCODING
            '--print-to-pdf-no-header',
            // 🚀 PRODUCTION MEMORY VƏ PERFORMANCE OPTIMIZATION
            ...(isProduction || isServerless ? [
                '--memory-pressure-off',
                '--max-old-space-size=4096',
                '--disable-web-security',
                '--allow-running-insecure-content',
                '--disable-features=VizDisplayCompositor',
                '--single-process'
            ] : []),
            '--run-all-compositor-stages-before-draw',
            '--disable-background-mode'
        ];    if (isLocal) {
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
        // Production serverless - @sparticuz/chromium priority, puppeteer fallback
        try {
            console.log('🔧 TRYING @sparticuz/chromium FIRST (recommended for Vercel)');
            // Try @sparticuz/chromium first for serverless
            try {
                executablePath = await chromium.executablePath();
                browserArgs = [...browserArgs, ...chromium.args];
                console.log('✅ Serverless Chromium path obtained:', executablePath);
            } catch (chromiumError) {
                console.log('⚠️ @sparticuz/chromium failed, falling back to puppeteer executablePath');
                executablePath = puppeteer.executablePath();
                console.log('✅ Puppeteer executable path obtained:', executablePath);
            }
        } catch (error) {
            console.error('❌ Both Chromium and Puppeteer paths failed:', error);
            throw new Error('Could not obtain executable path for serverless environment');
        }
    }

    console.log('Browser configuration:', {
        isProduction,
        isVercel,
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
    
    // 🚀 PRODUCTION ENVIRONMENT DETECTION - Use once throughout function
    const isProduction = process.env.NODE_ENV === 'production';
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
    
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
                        /* AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN GÜCLÜ FONT IMPORT VƏ UNICODE DƏSTƏYI */
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Azerbaijani:wght@400;700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Display:wght@400;700&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&subset=latin,latin-ext&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&subset=latin,latin-ext&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&subset=latin,latin-ext&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&subset=latin,latin-ext&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&subset=latin,latin-ext&display=swap');
                        
                        /* 🔧 AZƏRBAYCAN HƏRFLƏRİ (Ə, Ğ, İ, Ö, Ü, Ç, Ş) ÜÇÜN NUCLEAR UNICODE DƏSTƏYI */
                        * {
                            font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', 'Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 'DejaVu Sans', 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', Arial, sans-serif !important;
                            text-rendering: optimizeLegibility !important;
                            -webkit-font-smoothing: antialiased !important;
                            -moz-osx-font-smoothing: grayscale !important;
                            unicode-bidi: normal !important;
                            direction: ltr !important;
                            /* 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN XÜSUSI FONT FEATURES */
                            font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1 !important;
                            font-variant-ligatures: common-ligatures !important;
                            /* 🔧 UNICODE NORMALIZASIYA VƏ CHARACTER ENCODING */
                            font-synthesis: weight style !important;
                            font-optical-sizing: auto !important;
                        }
                        
                        /* 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN GÜCLÜ FONT FALLBACK STACK */
                        html, body {
                            font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', 'Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 'DejaVu Sans', 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', 'Lucida Grande', Arial, sans-serif !important;
                        }
                        
                        /* 🔧 AZƏRBAYCAN DİLİ ÜÇÜN XÜSUSİ OPTIMIZASIYA */
                        body, p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em {
                            font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1 !important;
                            font-variant-ligatures: common-ligatures !important;
                            text-rendering: optimizeLegibility !important;
                            /* 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN CHARACTER ENCODING */
                            unicode-bidi: normal !important;
                            direction: ltr !important;
                            font-synthesis: weight style !important;
                        }
                        
                        /* 🔧 SPESIFIK AZƏRBAYCAN HƏRFLƏRİ SUPPORT (Ə, Ğ, İ, Ö, Ü, Ç, Ş) */
                        [lang="az"], [lang="az-AZ"], 
                        *:contains("Ə"), *:contains("ə"), 
                        *:contains("Ğ"), *:contains("ğ"),
                        *:contains("İ"), *:contains("ı"),
                        *:contains("Ö"), *:contains("ö"),
                        *:contains("Ü"), *:contains("ü"),
                        *:contains("Ç"), *:contains("ç"),
                        *:contains("Ş"), *:contains("ş") {
                            font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', 'Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 'DejaVu Sans', 'Liberation Sans', 'Segoe UI', 'Arial Unicode MS', 'Lucida Grande', Arial, sans-serif !important;
                            unicode-bidi: normal !important;
                            direction: ltr !important;
                            text-rendering: optimizeLegibility !important;
                            font-feature-settings: "kern" 1, "liga" 1, "clig" 1, "calt" 1 !important;
                        }
                        
                        ${cssContent}
                        
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
                        
                        /* BASIC TEMPLATE @PAGE AYARLARI - SAĞ VƏ SOL BOŞLUQLAR AZALDILDI */
                        ${templateId === 'basic' ? `
                        @page {
                            size: A4;
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sol boşluq azaldıldı: 15mm -> 0mm */
                            margin-right: 0mm !important;   /* Sağ boşluq azaldıldı: 15mm -> 8mm */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 15mm !important;
                            margin-left: 0mm !important;    /* İlk səhifədə sol boşluq azaldıldı */
                            margin-right: 0mm !important;   /* İlk səhifədə sağ boşluq azaldıldı */
                        }
                        
                        @page :left {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sol səhifələrdə sol boşluq azaldıldı */
                            margin-right: 0mm !important;   /* Sol səhifələrdə sağ boşluq azaldıldı */
                        }
                        
                        @page :right {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sağ səhifələrdə sol boşluq azaldıldı */
                            margin-right: 0mm !important;   /* Sağ səhifələrdə sağ boşluq azaldıldı */
                        }
                        ` : ''}
                        
                        /* EXCLUSIVE TEMPLATE @PAGE AYARLARI - BASIC TEMPLATE KİMİ TAM 1-1 */
                        ${templateId === 'exclusive' || templateId?.toLowerCase() === 'exclusive' || templateId?.toLowerCase().includes('exclusive') ? `
                        @page {
                            size: A4;
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 10mm !important;
                            margin-right: 10mm !important;
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 10mm !important;
                            max-height: 257mm !important; /* Exclusive: ilk səhifədə minimum hündürlük 287mm */
                            min-width: 190mm !important;
                        }
                        
                        @page :left {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                        }
                        
                        @page :right {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                        }
                        ` : ''}

                        ${templateId === 'atlas' || templateId?.toLowerCase() === 'atlas' || templateId?.toLowerCase().includes('atlas') ? `
                        @page {
                            size: A4;
                        
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                        padding-top: 10mm !important;
                            max-height: 257mm !important; 
                            min-width: 190mm !important;
                        }
                       
                        ` : ''}
                        
                        
                        /* AURORA TEMPLATE @PAGE AYARLARI - BASIC TEMPLATE KİMİ */
                        ${templateId === 'aurora' || templateId?.toLowerCase() === 'aurora' || templateId?.toLowerCase().includes('aurora') ? `
                        @page {
                            size: A4;
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 10mm !important;
                            margin-right: 10mm !important;
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 6mm !important;
                            margin-left: 10mm !important;
                            margin-right: 10mm !important;
                            
                        }
                        
                        @page :left {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 10mm !important;
                            margin-right: 10mm !important;
                        }
                        
                        @page :right {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 10mm !important;
                            margin-right: 10mm !important;
                        }
                        ` : ''}
                        
                        /* PRIME TEMPLATE @PAGE AYARLARI - OPTİMAL KƏNAR MƏSAFƏLƏR */
                        ${templateId === 'prime' || templateId?.toLowerCase() === 'prime' || templateId?.toLowerCase().includes('prime') ? `
                        @page {
                            size: A4;
                            margin-top: 8mm !important;     /* Prime template yuxarı məsafə minimum */
                            margin-bottom: 8mm !important;  /* Prime template aşağı məsafə minimum */
                            margin-left: 8mm !important;    /* Prime template sol məsafə minimum */
                            margin-right: 8mm !important;   /* Prime template sağ məsafə minimum */
                            min-width: 194mm !important;    /* 210mm - 16mm (8mm + 8mm) optimal genişlik */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 8mm !important;     /* İlk səhifə yuxarıdan minimum */
                            margin-left: 8mm !important;    /* İlk səhifə soldan minimum */
                            margin-right: 8mm !important;   /* İlk səhifə sağdan minimum */
                            margin-bottom: 8mm !important;  /* İlk səhifə aşağıdan minimum */
                        }
                        
                        @page :left {
                            margin-top: 8mm !important;
                            margin-bottom: 8mm !important;
                            margin-left: 8mm !important;
                            margin-right: 8mm !important;
                        }
                        
                        @page :right {
                            margin-top: 8mm !important;
                            margin-bottom: 8mm !important;
                            margin-left: 8mm !important;
                            margin-right: 8mm !important;
                        }
                        ` : ''}
                        
                        /* LUMEN TEMPLATE @PAGE AYARLARI - SOL VƏ SAĞ BOŞLUQ YOX */
                        ${templateId === 'lumen' || templateId?.toLowerCase() === 'lumen' || templateId?.toLowerCase().includes('lumen') ? `
                        @page {
                            size: A4;
                            margin-top: 10mm !important;    
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sol boşluq silindi */
                            margin-right: 0mm !important;   /* Sağ boşluq silindi */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 0mm !important; 
                            margin-left: 0mm !important;    /* İlk səhifədə sol boşluq yox */
                            margin-right: 0mm !important;   /* İlk səhifədə sağ boşluq yox */
                            max-height: 257mm;
                        }
                        
                        @page :left {
                            margin-top: 10mm !important;    
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sol səhifələrdə sol boşluq yox */
                            margin-right: 0mm !important;   /* Sol səhifələrdə sağ boşluq yox */
                        }
                        
                        @page :right {
                            margin-top: 10mm !important;    
                            margin-bottom: 10mm !important;
                            margin-left: 0mm !important;    /* Sağ səhifələrdə sol boşluq yox */
                            margin-right: 0mm !important;   /* Sağ səhifələrdə sağ boşluq yox */
                        }
                        ` : ''}
                        
                        /* CLARITY TEMPLATE @PAGE AYARLARI - SAĞ VƏ SOL BOŞLUQLAR AZALDILDI */
                        ${templateId === 'clarity' || templateId?.toLowerCase() === 'clarity' || templateId?.toLowerCase().includes('clarity') ? `
                        @page {
                            size: A4;
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 8mm !important;    /* Sol boşluq azaldıldı: 15mm -> 8mm */
                            margin-right: 8mm !important;   /* Sağ boşluq azaldıldı: 15mm -> 8mm */
                            padding: 0 !important;
                            border: none !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        @page :first {
                            margin-top: 10mm !important;
                            margin-left: 8mm !important;    /* İlk səhifədə sol boşluq azaldıldı */
                            margin-right: 8mm !important;   /* İlk səhifədə sağ boşluq azaldıldı */
                        }
                        
                        @page :left {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 8mm !important;    /* Sol səhifələrdə sol boşluq azaldıldı */
                            margin-right: 8mm !important;   /* Sol səhifələrdə sağ boşluq azaldıldı */
                        }
                        
                        @page :right {
                            margin-top: 10mm !important;
                            margin-bottom: 10mm !important;
                            margin-left: 8mm !important;    /* Sağ səhifələrdə sol boşluq azaldıldı */
                            margin-right: 8mm !important;   /* Sağ səhifələrdə sağ boşluq azaldıldı */
                        }
                        ` : ''}
                        
                        /* BASIC TEMPLATE - PAGE BREAK OPTİMİZASYONU */
                        .basic-template .cv-section,
                        .cv-template.basic-template .cv-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 8mm !important; /* Sectionlar arası boşluq azaldıldı */
                        }
                        
                        /* BASIC TEMPLATE - Səhifə keçid problemi olan elementlər üçün */
                        .basic-template .cv-section:last-child,
                        .cv-template.basic-template .cv-section:last-child {
                            margin-bottom: 12mm !important; /* Son section üçün əlavə boşluq azaldıldı */
                        }
                        
                        /* BASIC TEMPLATE - BODY VƏ HTML SƏHİFƏ SPACING */
                        .basic-template body,
                        .cv-template.basic-template body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* BASIC TEMPLATE - CV container-də səhifə padding əlavə et */
                        .basic-template .cv-container, 
                        .basic-template .cv-content,
                        .cv-template.basic-template .cv-container,
                        .cv-template.basic-template .cv-content {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* BASIC TEMPLATE - Səhifə keçidində məzmun kəsilməsin */
                        .basic-template h1, .basic-template h2, .basic-template h3, 
                        .basic-template h4, .basic-template h5, .basic-template h6,
                        .cv-template.basic-template h1, .cv-template.basic-template h2, 
                        .cv-template.basic-template h3, .cv-template.basic-template h4, 
                        .cv-template.basic-template h5, .cv-template.basic-template h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* BASIC TEMPLATE - Sectionlar səhifədə kəsilməsin */
                        .basic-template .cv-section,
                        .cv-template.basic-template .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* CLARITY TEMPLATE - PAGE BREAK OPTİMİZASYONU - BASIC TEMPLATE KİMİ */
                        .clarity-template .cv-section,
                        .cv-template.clarity-template .cv-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 8mm !important; /* Basic template kimi sectionlar arası boşluq azaldıldı */
                        }
                        
                        /* CLARITY TEMPLATE - Səhifə keçid problemi olan elementlər üçün */
                        .clarity-template .cv-section:last-child,
                        .cv-template.clarity-template .cv-section:last-child {
                            margin-bottom: 12mm !important; /* Basic template kimi son section üçün əlavə boşluq azaldıldı */
                        }
                        
                        /* CLARITY TEMPLATE - BODY VƏ HTML SƏHİFƏ SPACING - BASIC KİMİ */
                        .clarity-template body,
                        .cv-template.clarity-template body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* CLARITY TEMPLATE - CV container-də səhifə padding əlavə et - BASIC KİMİ */
                        .clarity-template .cv-container, 
                        .clarity-template .cv-content,
                        .cv-template.clarity-template .cv-container,
                        .cv-template.clarity-template .cv-content {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            box-sizing: border-box !important;
                            max-width: none !important;     /* Max-width məhdudiyyətini sil - BASIC KİMİ */
                            width: 100% !important;         /* Tam genişlik @page margin-ləri içində */
                            margin: 0 !important;           /* Heç bir əlavə margin yoxdur */
                        }
                        
                        /* CLARITY TEMPLATE - Səhifə keçidində məzmun kəsilməsin */
                        .clarity-template h1, .clarity-template h2, .clarity-template h3, 
                        .clarity-template h4, .clarity-template h5, .clarity-template h6,
                        .cv-template.clarity-template h1, .cv-template.clarity-template h2, 
                        .cv-template.clarity-template h3, .cv-template.clarity-template h4, 
                        .cv-template.clarity-template h5, .cv-template.clarity-template h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* CLARITY TEMPLATE - Sectionlar səhifədə kəsilməsin */
                        .clarity-template .cv-section,
                        .cv-template.clarity-template .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* LUMEN TEMPLATE - BASIC TEMPLATE KİMİ BÜTÜN AYARLAR + YUXARI MARGIN 0 */
                        /* LUMEN TEMPLATE - PAGE BREAK OPTİMİZASYONU */
                        .lumen-template .cv-section,
                        .cv-template.lumen-template .cv-section,
                        .lumen .cv-section,
                        .cv-template.lumen .cv-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 8mm !important; /* Basic template kimi sectionlar arası boşluq */
                            /* 🔧 LUMEN: SECTION HÜNDÜRLÜyÜ MƏHDUDLAŞDIR */
                            max-height: 60mm !important;   /* Hər section maksimum 60mm */
                            overflow: hidden !important;   /* Artıq məzmunu gizlət */
                        }
                        
                        /* LUMEN TEMPLATE - Səhifə keçid problemi olan elementlər üçün */
                        .lumen-template .cv-section:last-child,
                        .cv-template.lumen-template .cv-section:last-child,
                        .lumen .cv-section:last-child,
                        .cv-template.lumen .cv-section:last-child {
                            margin-bottom: 12mm !important; /* Basic template kimi son section üçün əlavə boşluq */
                        }
                        
                        /* LUMEN TEMPLATE - BODY VƏ HTML SƏHİFƏ SPACING - BASIC KİMİ */
                        .lumen-template body,
                        .cv-template.lumen-template body,
                        .lumen body,
                        .cv-template.lumen body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* LUMEN TEMPLATE - CV container-də səhifə padding əlavə et - BASIC KİMİ */
                        .lumen-template .cv-container, 
                        .lumen-template .cv-content,
                        .cv-template.lumen-template .cv-container,
                        .cv-template.lumen-template .cv-content,
                        .lumen .cv-container,
                        .lumen .cv-content,
                        .cv-template.lumen .cv-container,
                        .cv-template.lumen .cv-content {
                            padding-top: 0 !important;     /* Basic template kimi */
                            padding-bottom: 0 !important;
                            box-sizing: border-box !important;
                            max-width: none !important;     /* Max-width məhdudiyyətini sil - BASIC KİMİ */
                            width: 100% !important;         /* Tam genişlik @page margin-ləri içində */
                            margin: 0 !important;           /* Heç bir əlavə margin yoxdur */
                        }
                        
                        /* LUMEN TEMPLATE - Səhifə keçidində məzmun kəsilməsin */
                        .lumen-template h1, .lumen-template h2, .lumen-template h3, 
                        .lumen-template h4, .lumen-template h5, .lumen-template h6,
                        .cv-template.lumen-template h1, .cv-template.lumen-template h2, 
                        .cv-template.lumen-template h3, .cv-template.lumen-template h4, 
                        .cv-template.lumen-template h5, .cv-template.lumen-template h6,
                        .lumen h1, .lumen h2, .lumen h3, 
                        .lumen h4, .lumen h5, .lumen h6,
                        .cv-template.lumen h1, .cv-template.lumen h2, 
                        .cv-template.lumen h3, .cv-template.lumen h4, 
                        .cv-template.lumen h5, .cv-template.lumen h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* LUMEN TEMPLATE - Sectionlar səhifədə kəsilməsin */
                        .lumen-template .cv-section,
                        .cv-template.lumen-template .cv-section,
                        .lumen .cv-section,
                        .cv-template.lumen .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* LUMEN TEMPLATE - CONTAINER SİSTEMİ KONTROLU - BASIC/EXCLUSIVE KİMİ */
                        .lumen-template,
                        .cv-template.lumen-template,
                        .lumen,
                        .cv-template.lumen {
                            box-sizing: border-box !important;
                            max-width: none !important;     /* Tam genişlik @page margin-ləri içində */
                            width: 100% !important;         
                            margin: 0 !important;           /* Heç bir margin yoxdur */
                            padding: 0 !important;          /* Heç bir padding yoxdur */
                            /* 🔧 LUMEN: ƏLAVƏ SƏHİFƏ YARANMASININ QARŞISINI AL */
                            max-height: 257mm !important;   /* A4 ölçüsündə maksimum hündürlük */
                            overflow: hidden !important;    /* Artıq məzmunu gizlət */
                            page-break-after: avoid !important;   /* Yeni səhifə yaradılmasın */
                            page-break-inside: avoid !important;  /* İçəridə bölünməsin */
                        }
                        
                        /* LUMEN TEMPLATE - TAILWIND CONTAINER CLASS-LARINI OVERRIDE ET */
                        .lumen-template .container,
                        .lumen-template .max-w-sm,
                        .lumen-template .max-w-md,
                        .lumen-template .max-w-lg,
                        .lumen-template .max-w-xl,
                        .lumen-template .max-w-2xl,
                        .lumen-template .max-w-3xl,
                        .lumen-template .max-w-4xl,
                        .lumen-template .max-w-5xl,
                        .lumen-template .max-w-6xl,
                        .lumen-template .max-w-7xl,
                        .lumen-template .max-w-full,
                        .lumen-template .w-full,
                        .cv-template.lumen-template .container,
                        .cv-template.lumen-template .max-w-sm,
                        .cv-template.lumen-template .max-w-md,
                        .cv-template.lumen-template .max-w-lg,
                        .cv-template.lumen-template .max-w-xl,
                        .cv-template.lumen-template .max-w-2xl,
                        .cv-template.lumen-template .max-w-3xl,
                        .cv-template.lumen-template .max-w-4xl,
                        .cv-template.lumen-template .max-w-5xl,
                        .cv-template.lumen-template .max-w-6xl,
                        .cv-template.lumen-template .max-w-7xl,
                        .cv-template.lumen-template .max-w-full,
                        .cv-template.lumen-template .w-full,
                        .lumen .container,
                        .lumen .max-w-sm,
                        .lumen .max-w-md,
                        .lumen .max-w-lg,
                        .lumen .max-w-xl,
                        .lumen .max-w-2xl,
                        .lumen .max-w-3xl,
                        .lumen .max-w-4xl,
                        .lumen .max-w-5xl,
                        .lumen .max-w-6xl,
                        .lumen .max-w-7xl,
                        .lumen .max-w-full,
                        .lumen .w-full,
                        .cv-template.lumen .container,
                        .cv-template.lumen .max-w-sm,
                        .cv-template.lumen .max-w-md,
                        .cv-template.lumen .max-w-lg,
                        .cv-template.lumen .max-w-xl,
                        .cv-template.lumen .max-w-2xl,
                        .cv-template.lumen .max-w-3xl,
                        .cv-template.lumen .max-w-4xl,
                        .cv-template.lumen .max-w-5xl,
                        .cv-template.lumen .max-w-6xl,
                        .cv-template.lumen .max-w-7xl,
                        .cv-template.lumen .max-w-full,
                        .cv-template.lumen .w-full {
                            max-width: none !important;     /* Tam genişlik istifadə et */
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                            box-sizing: border-box !important;
                        }
                        

  /* EXCLUSIVE TEMPLATE - BASIC TEMPLATE KİMİ MARGIN SİSTEMİ */
                        /* EXCLUSIVE TEMPLATE - PAGE BREAK OPTİMİZASYONU */
                        .exclusive-template .cv-section,
                        .cv-template.exclusive-template .cv-section,
                        .exclusive .cv-section,
                        .cv-template.exclusive .cv-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 8mm !important; /* Sectionlar arası boşluq azaldıldı */
                        }

                        /* EXCLUSIVE TEMPLATE - Səhifə keçid problemi olan elementlər üçün */
                        .exclusive-template .cv-section:last-child,
                        .cv-template.exclusive-template .cv-section:last-child,
                        .exclusive .cv-section:last-child,
                        .cv-template.exclusive .cv-section:last-child {
                            margin-bottom: 12mm !important; /* Son section üçün əlavə boşluq azaldıldı */
                        }
                        
                        /* EXCLUSIVE TEMPLATE - BODY VƏ HTML SƏHİFƏ SPACING */
                        .exclusive-template body,
                        .cv-template.exclusive-template body,
                        .exclusive body,
                        .cv-template.exclusive body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - CV container-də səhifə padding əlavə et */
                        .exclusive-template .cv-container, 
                        .exclusive-template .cv-content,
                        .cv-template.exclusive-template .cv-container,
                        .cv-template.exclusive-template .cv-content,
                        .exclusive .cv-container,
                        .exclusive .cv-content,
                        .cv-template.exclusive .cv-container,
                        .cv-template.exclusive .cv-content {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            box-sizing: border-box !important;
                            max-width: none !important;     /* Max-width məhdudiyyətini sil */
                            width: 100% !important;         /* Tam genişlik @page margin-ləri içində */
                            margin: 0 !important;           /* Heç bir əlavə margin yoxdur */
                        }
                        
                        /* EXCLUSIVE TEMPLATE - Səhifə keçidində məzmun kəsilməsin */
                        .exclusive-template h1, .exclusive-template h2, .exclusive-template h3, 
                        .exclusive-template h4, .exclusive-template h5, .exclusive-template h6,
                        .cv-template.exclusive-template h1, .cv-template.exclusive-template h2, 
                        .cv-template.exclusive-template h3, .cv-template.exclusive-template h4, 
                        .cv-template.exclusive-template h5, .cv-template.exclusive-template h6,
                        .exclusive h1, .exclusive h2, .exclusive h3, 
                        .exclusive h4, .exclusive h5, .exclusive h6,
                        .cv-template.exclusive h1, .cv-template.exclusive h2, 
                        .cv-template.exclusive h3, .cv-template.exclusive h4, 
                        .cv-template.exclusive h5, .cv-template.exclusive h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - Sectionlar səhifədə kəsilməsin */
                        .exclusive-template .cv-section,
                        .cv-template.exclusive-template .cv-section,
                        .exclusive .cv-section,
                        .cv-template.exclusive .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - KƏNAR ÇIXMAMASI ÜÇÜN CONTAINER SİSTEMİ */
                        .exclusive-template,
                        .cv-template.exclusive-template,
                        .exclusive,
                        .cv-template.exclusive {
                            box-sizing: border-box !important;
                            max-width: 190mm !important;    /* 210mm - 30mm (15mm sol + 15mm sağ margin) */
                            width: 100% !important;         /* @page margin-ləri içində tam genişlik */
                            margin: 0 !important;           /* Heç bir margin yoxdur - @page margin-ləri kifayət edir */
                            padding: 0 !important;          /* Heç bir padding yoxdur */
                        }
                        
                        /* EXCLUSIVE TEMPLATE - BÜTÜN İÇ ELEMENTLER ÜÇÜN GENİŞLİK KONTROLU */
                        .exclusive-template *[class*="max-w"],
                        .exclusive-template *[class*="mx-auto"],
                        .cv-template.exclusive-template *[class*="max-w"],
                        .cv-template.exclusive-template *[class*="mx-auto"],
                        .exclusive *[class*="max-w"],
                        .exclusive *[class*="mx-auto"],
                        .cv-template.exclusive *[class*="max-w"],
                        .cv-template.exclusive *[class*="mx-auto"] {
                            max-width: 190mm !important;    /* 210mm - 30mm margin */
                            margin-left: 0 !important;      /* Auto margin-ləri sil */
                            margin-right: 0 !important;     /* Auto margin-ləri sil */
                            width: 100% !important;         /* @page margin-ləri içində tam genişlik */
                            box-sizing: border-box !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - BÜTÜN CONTAINER VƏ WRAPPER ELEMENTLER */
                        .exclusive-template div,
                        .exclusive-template section,
                        .exclusive-template main,
                        .exclusive-template article,
                        .cv-template.exclusive-template div,
                        .cv-template.exclusive-template section,
                        .cv-template.exclusive-template main,
                        .cv-template.exclusive-template article,
                        .exclusive div,
                        .exclusive section,
                        .exclusive main,
                        .exclusive article,
                        .cv-template.exclusive div,
                        .cv-template.exclusive section,
                        .cv-template.exclusive main,
                        .cv-template.exclusive article {
                            max-width: 190mm !important;    /* 210mm - 30mm margin */
                            box-sizing: border-box !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - TAILWIND CONTAINER CLASS-LARINI OVERRIDE ET */
                        .exclusive-template .container,
                        .exclusive-template .max-w-sm,
                        .exclusive-template .max-w-md,
                        .exclusive-template .max-w-lg,
                        .exclusive-template .max-w-xl,
                        .exclusive-template .max-w-2xl,
                        .exclusive-template .max-w-3xl,
                        .exclusive-template .max-w-4xl,
                        .exclusive-template .max-w-5xl,
                        .exclusive-template .max-w-6xl,
                        .exclusive-template .max-w-7xl,
                        .exclusive-template .max-w-full,
                        .exclusive-template .w-full,
                        .cv-template.exclusive-template .container,
                        .cv-template.exclusive-template .max-w-sm,
                        .cv-template.exclusive-template .max-w-md,
                        .cv-template.exclusive-template .max-w-lg,
                        .cv-template.exclusive-template .max-w-xl,
                        .cv-template.exclusive-template .max-w-2xl,
                        .cv-template.exclusive-template .max-w-3xl,
                        .cv-template.exclusive-template .max-w-4xl,
                        .cv-template.exclusive-template .max-w-5xl,
                        .cv-template.exclusive-template .max-w-6xl,
                        .cv-template.exclusive-template .max-w-7xl,
                        .cv-template.exclusive-template .max-w-full,
                        .cv-template.exclusive-template .w-full,
                        .exclusive .container,
                        .exclusive .max-w-sm,
                        .exclusive .max-w-md,
                        .exclusive .max-w-lg,
                        .exclusive .max-w-xl,
                        .exclusive .max-w-2xl,
                        .exclusive .max-w-3xl,
                        .exclusive .max-w-4xl,
                        .exclusive .max-w-5xl,
                        .exclusive .max-w-6xl,
                        .exclusive .max-w-7xl,
                        .exclusive .max-w-full,
                        .exclusive .w-full,
                        .cv-template.exclusive .container,
                        .cv-template.exclusive .max-w-sm,
                        .cv-template.exclusive .max-w-md,
                        .cv-template.exclusive .max-w-lg,
                        .cv-template.exclusive .max-w-xl,
                        .cv-template.exclusive .max-w-2xl,
                        .cv-template.exclusive .max-w-3xl,
                        .cv-template.exclusive .max-w-4xl,
                        .cv-template.exclusive .max-w-5xl,
                        .cv-template.exclusive .max-w-6xl,
                        .cv-template.exclusive .max-w-7xl,
                        .cv-template.exclusive .max-w-full,
                        .cv-template.exclusive .w-full {
                            max-width: 180mm !important;    /* 210mm - 30mm margin */
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - CV SECTIONS TAM GENİŞLİK */
                        .exclusive-template .cv-section,
                        .cv-template.exclusive-template .cv-section,
                        .exclusive .cv-section,
                        .cv-template.exclusive .cv-section {
                            width: 100% !important;
                            max-width: 190mm !important;    /* 210mm - 30mm margin */
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - BODY VƏ HTML TAM GENİŞLİK */
                        .exclusive-template body,
                        .exclusive-template html,
                        .cv-template.exclusive-template body,
                        .cv-template.exclusive-template html,
                        .exclusive body,
                        .exclusive html,
                        .cv-template.exclusive body,
                        .cv-template.exclusive html {
                            width: 100% !important;
                            max-width: 190mm !important;    /* 210mm - 30mm margin */
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - AYIRICI XƏTLƏRİN GÖY RƏNGİ */
                        /* Section başlıqlarından sonra olan xətlər */
                        .exclusive-template hr,
                        .cv-template.exclusive-template hr,
                        .exclusive hr,
                        .cv-template.exclusive hr {
                            border-color: #3b82f6 !important;    /* Göy rəng */
                            background-color: #3b82f6 !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Section title altındakı border-bottom xətləri - YALNIZ SECTİON BAŞLIQLARINDAN SONRA */
                        /* h1, h2, h3 özünün border-bottom rəngi */
                        .exclusive-template h1[class*="border-b"],
                        .exclusive-template h2[class*="border-b"],
                        .exclusive-template h3[class*="border-b"],
                        .cv-template.exclusive-template h1[class*="border-b"],
                        .cv-template.exclusive-template h2[class*="border-b"],
                        .cv-template.exclusive-template h3[class*="border-b"],
                        .exclusive h1[class*="border-b"],
                        .exclusive h2[class*="border-b"],
                        .exclusive h3[class*="border-b"],
                        .cv-template.exclusive h1[class*="border-b"],
                        .cv-template.exclusive h2[class*="border-b"],
                        .cv-template.exclusive h3[class*="border-b"] {
                            border-bottom-color: #3b82f6 !important;  /* Göy rəng */
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Section başlıqlarından DƏRHAL sonra gələn border elementləri */
                        .exclusive-template h1 + .border-b,
                        .exclusive-template h2 + .border-b,
                        .exclusive-template h3 + .border-b,
                        .exclusive-template h1 + [class*="border-b"],
                        .exclusive-template h2 + [class*="border-b"],
                        .exclusive-template h3 + [class*="border-b"],
                        .cv-template.exclusive-template h1 + .border-b,
                        .cv-template.exclusive-template h2 + .border-b,
                        .cv-template.exclusive-template h3 + .border-b,
                        .cv-template.exclusive-template h1 + [class*="border-b"],
                        .cv-template.exclusive-template h2 + [class*="border-b"],
                        .cv-template.exclusive-template h3 + [class*="border-b"] {
                            border-bottom-color: #3b82f6 !important;  /* Göy rəng */
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Section başlıqları üçün xüsusi border */
                        .exclusive-template h1,
                        .exclusive-template h2,
                        .exclusive-template h3,
                        .cv-template.exclusive-template h1,
                        .cv-template.exclusive-template h2,
                        .cv-template.exclusive-template h3,
                        .exclusive h1,
                        .exclusive h2,
                        .exclusive h3,
                        .cv-template.exclusive h1,
                        .cv-template.exclusive h2,
                        .cv-template.exclusive h3 {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* Tailwind border class-ları üçün göy rəng */
                        .exclusive-template .border-gray-200,
                        .exclusive-template .border-gray-300,
                        .exclusive-template .border-slate-200,
                        .exclusive-template .border-neutral-200,
                        .cv-template.exclusive-template .border-gray-200,
                        .cv-template.exclusive-template .border-gray-300,
                        .cv-template.exclusive-template .border-slate-200,
                        .cv-template.exclusive-template .border-neutral-200,
                        .exclusive .border-gray-200,
                        .exclusive .border-gray-300,
                        .exclusive .border-slate-200,
                        .exclusive .border-neutral-200,
                        .cv-template.exclusive .border-gray-200,
                        .cv-template.exclusive .border-gray-300,
                        .cv-template.exclusive .border-slate-200,
                        .cv-template.exclusive .border-neutral-200 {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* AURORA TEMPLATE - BASIC VƏ EXCLUSIVE TEMPLATE KİMİ MARGIN SİSTEMİ */
                        /* AURORA TEMPLATE - PAGE BREAK OPTİMİZASYONU - SPACING AZALDILDI */
                        .aurora-template .cv-section,
                        .cv-template.aurora-template .cv-section,
                        .aurora .cv-section,
                        .cv-template.aurora .cv-section {
                            page-break-inside: avoid;
                            break-inside: avoid;
                            margin-bottom: 4mm !important; /* Sectionlar arası boşluq çox azaldıldı - preview ilə uyğunlaşdırıldı */
                        }
                        
                        /* AURORA TEMPLATE - Səhifə keçid problemi olan elementlər üçün - SPACING AZALDILDI */
                        .aurora-template .cv-section:last-child,
                        .cv-template.aurora-template .cv-section:last-child,
                        .aurora .cv-section:last-child,
                        .cv-template.aurora .cv-section:last-child {
                            margin-bottom: 6mm !important; /* Son section üçün əlavə boşluq çox azaldıldı */
                        }
                        
                        /* AURORA TEMPLATE - SECTION AÇIQLAMALARINDAN SONRAKI SPACING AZALDILDI */
                        .aurora-template .cv-section > div,
                        .aurora-template .cv-section > p,
                        .aurora-template .cv-section .experience-item,
                        .aurora-template .cv-section .education-item,
                        .aurora-template .cv-section .project-item,
                        .cv-template.aurora-template .cv-section > div,
                        .cv-template.aurora-template .cv-section > p,
                        .cv-template.aurora-template .cv-section .experience-item,
                        .cv-template.aurora-template .cv-section .education-item,
                        .cv-template.aurora-template .cv-section .project-item,
                        .aurora .cv-section > div,
                        .aurora .cv-section > p,
                        .aurora .cv-section .experience-item,
                        .aurora .cv-section .education-item,
                        .aurora .cv-section .project-item,
                        .cv-template.aurora .cv-section > div,
                        .cv-template.aurora .cv-section > p,
                        .cv-template.aurora .cv-section .experience-item,
                        .cv-template.aurora .cv-section .education-item,
                        .cv-template.aurora .cv-section .project-item {
                        }
                        
                        /* AURORA TEMPLATE - SECTION BAŞLIQLARI SONRASI SPACING AZALDILDI */
                        .aurora-template .cv-section h2,
                        .aurora-template .cv-section h3,
                        .cv-template.aurora-template .cv-section h2,
                        .cv-template.aurora-template .cv-section h3,
                        .aurora .cv-section h2,
                        .aurora .cv-section h3,
                        .cv-template.aurora .cv-section h2,
                        .cv-template.aurora .cv-section h3 {
                            margin-bottom: 1.5mm !important; /* Section başlıqlarından sonra kiçik boşluq */
                        }
                        
                        /* AURORA TEMPLATE - ITEM DESCRIPTIONS SONRASI SPACING AZALDILDI */
                        .aurora-template .cv-section .experience-item p,
                        .aurora-template .cv-section .education-item p,
                        .aurora-template .cv-section .project-item p,
                        .cv-template.aurora-template .cv-section .experience-item p,
                        .cv-template.aurora-template .cv-section .education-item p,
                        .cv-template.aurora-template .cv-section .project-item p,
                        .aurora .cv-section .experience-item p,
                        .aurora .cv-section .education-item p,
                        .aurora .cv-section .project-item p,
                        .cv-template.aurora .cv-section .experience-item p,
                        .cv-template.aurora .cv-section .education-item p,
                        .cv-template.aurora .cv-section .project-item p {
                            margin-bottom: 1mm !important; /* Açıqlamalardan sonra minimum boşluq */
                        }
                        
                        /* AURORA TEMPLATE - GAP VƏ FLEXBOX SPACING AZALDILDI */
                        .aurora-template div[style*="gap"],
                        .aurora-template div[style*="gap: 20px"],
                        .aurora-template div[style*="gap: var(--cv-section-spacing)"],
                        .cv-template.aurora-template div[style*="gap"],
                        .cv-template.aurora-template div[style*="gap: 20px"],
                        .cv-template.aurora-template div[style*="gap: var(--cv-section-spacing)"],
                        .aurora div[style*="gap"],
                        .aurora div[style*="gap: 20px"],
                        .aurora div[style*="gap: var(--cv-section-spacing)"],
                        .cv-template.aurora div[style*="gap"],
                        .cv-template.aurora div[style*="gap: 20px"],
                        .cv-template.aurora div[style*="gap: var(--cv-section-spacing)"] {
                            gap: 4mm !important; /* Flexbox gap-i azaldıldı */
                        }
                        
                        /* AURORA TEMPLATE - TAILWIND MARGIN CLASSES OVERRIDE */
                        .aurora-template .mb-6,
                        .aurora-template .mb-8,
                        .aurora-template .mb-4,
                        .aurora-template .my-6,
                        .aurora-template .my-8,
                        .cv-template.aurora-template .mb-6,
                        .cv-template.aurora-template .mb-8,
                        .cv-template.aurora-template .mb-4,
                        .cv-template.aurora-template .my-6,
                        .cv-template.aurora-template .my-8,
                        .aurora .mb-6,
                        .aurora .mb-8,
                        .aurora .mb-4,
                        .aurora .my-6,
                        .aurora .my-8,
                        .cv-template.aurora .mb-6,
                        .cv-template.aurora .mb-8,
                        .cv-template.aurora .mb-4,
                        .cv-template.aurora .my-6,
                        .cv-template.aurora .my-8 {
                            margin-bottom: 3mm !important; /* Tailwind margin class-ları azaldıldı */
                        }
                        
                        /* AURORA TEMPLATE - PB PADDING CLASSES OVERRIDE */
                        .aurora-template .pb-6,
                        .aurora-template .pb-8,
                        .aurora-template .pb-4,
                        .aurora-template .py-6,
                        .aurora-template .py-8,
                        .cv-template.aurora-template .pb-6,
                        .cv-template.aurora-template .pb-8,
                        .cv-template.aurora-template .pb-4,
                        .cv-template.aurora-template .py-6,
                        .cv-template.aurora-template .py-8,
                        .aurora .pb-6,
                        .aurora .pb-8,
                        .aurora .pb-4,
                        .aurora .py-6,
                        .aurora .py-8,
                        .cv-template.aurora .pb-6,
                        .cv-template.aurora .pb-8,
                        .cv-template.aurora .pb-4,
                        .cv-template.aurora .py-6,
                        .cv-template.aurora .py-8 {
                            padding-bottom: 2mm !important; /* Tailwind padding class-ları azaldıldı */
                        }
                        
                        /* AURORA TEMPLATE - BODY VƏ HTML SƏHİFƏ SPACING */
                        .aurora-template body,
                        .cv-template.aurora-template body,
                        .aurora body,
                        .cv-template.aurora body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        /* AURORA TEMPLATE - CV container-də səhifə padding əlavə et */
                        .aurora-template .cv-container, 
                        .aurora-template .cv-content,
                        .cv-template.aurora-template .cv-container,
                        .cv-template.aurora-template .cv-content,
                        .aurora .cv-container,
                        .aurora .cv-content,
                        .cv-template.aurora .cv-container,
                        .cv-template.aurora .cv-content {
                            padding-top: 0 !important;
                            padding-bottom: 0 !important;
                            box-sizing: border-box !important;
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            width: 100% !important;         /* Tam genişlik @page margin-ləri içində */
                            margin: 0 !important;           /* Heç bir əlavə margin yoxdur */
                        }
                        
                        /* AURORA TEMPLATE - Səhifə keçidində məzmun kəsilməsin */
                        .aurora-template h1, .aurora-template h2, .aurora-template h3, 
                        .aurora-template h4, .aurora-template h5, .aurora-template h6,
                        .cv-template.aurora-template h1, .cv-template.aurora-template h2, 
                        .cv-template.aurora-template h3, .cv-template.aurora-template h4, 
                        .cv-template.aurora-template h5, .cv-template.aurora-template h6,
                        .aurora h1, .aurora h2, .aurora h3, 
                        .aurora h4, .aurora h5, .aurora h6,
                        .cv-template.aurora h1, .cv-template.aurora h2, 
                        .cv-template.aurora h3, .cv-template.aurora h4, 
                        .cv-template.aurora h5, .cv-template.aurora h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* AURORA TEMPLATE - Sectionlar səhifədə kəsilməsin */
                        .aurora-template .cv-section,
                        .cv-template.aurora-template .cv-section,
                        .aurora .cv-section,
                        .cv-template.aurora .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* AURORA TEMPLATE - KƏNAR ÇIXMAMASI ÜÇÜN CONTAINER SİSTEMİ */
                        .aurora-template,
                        .cv-template.aurora-template,
                        .aurora,
                        .cv-template.aurora {
                            box-sizing: border-box !important;
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            width: 100% !important;         /* @page margin-ləri içində tam genişlik */
                            margin: 0 !important;           /* Heç bir margin yoxdur - @page margin-ləri kifayət edir */
                            padding: 0 !important;          /* Heç bir padding yoxdur */
                        }
                        
                        /* AURORA TEMPLATE - BÜTÜN İÇ ELEMENTLER ÜÇÜN GENİŞLİK KONTROLU */
                        .aurora-template *[class*="max-w"],
                        .aurora-template *[class*="mx-auto"],
                        .cv-template.aurora-template *[class*="max-w"],
                        .cv-template.aurora-template *[class*="mx-auto"],
                        .aurora *[class*="max-w"],
                        .aurora *[class*="mx-auto"],
                        .cv-template.aurora *[class*="max-w"],
                        .cv-template.aurora *[class*="mx-auto"] {
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            margin-left: 0 !important;      /* Auto margin-ləri sil */
                            margin-right: 0 !important;     /* Auto margin-ləri sil */
                            width: 100% !important;         /* @page margin-ləri içində tam genişlik */
                            box-sizing: border-box !important;
                        }
                        
                        /* AURORA TEMPLATE - BÜTÜN CONTAINER VƏ WRAPPER ELEMENTLER */
                        .aurora-template div,
                        .aurora-template section,
                        .aurora-template main,
                        .aurora-template article,
                        .cv-template.aurora-template div,
                        .cv-template.aurora-template section,
                        .cv-template.aurora-template main,
                        .cv-template.aurora-template article,
                        .aurora div,
                        .aurora section,
                        .aurora main,
                        .aurora article,
                        .cv-template.aurora div,
                        .cv-template.aurora section,
                        .cv-template.aurora main,
                        .cv-template.aurora article {
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            box-sizing: border-box !important;
                        }
                        
                        /* AURORA TEMPLATE - TAILWIND CONTAINER CLASS-LARINI OVERRIDE ET */
                        .aurora-template .container,
                        .aurora-template .max-w-sm,
                        .aurora-template .max-w-md,
                        .aurora-template .max-w-lg,
                        .aurora-template .max-w-xl,
                        .aurora-template .max-w-2xl,
                        .aurora-template .max-w-3xl,
                        .aurora-template .max-w-4xl,
                        .aurora-template .max-w-5xl,
                        .aurora-template .max-w-6xl,
                        .aurora-template .max-w-7xl,
                        .aurora-template .max-w-full,
                        .aurora-template .w-full,
                        .cv-template.aurora-template .container,
                        .cv-template.aurora-template .max-w-sm,
                        .cv-template.aurora-template .max-w-md,
                        .cv-template.aurora-template .max-w-lg,
                        .cv-template.aurora-template .max-w-xl,
                        .cv-template.aurora-template .max-w-2xl,
                        .cv-template.aurora-template .max-w-3xl,
                        .cv-template.aurora-template .max-w-4xl,
                        .cv-template.aurora-template .max-w-5xl,
                        .cv-template.aurora-template .max-w-6xl,
                        .cv-template.aurora-template .max-w-7xl,
                        .cv-template.aurora-template .max-w-full,
                        .cv-template.aurora-template .w-full,
                        .aurora .container,
                        .aurora .max-w-sm,
                        .aurora .max-w-md,
                        .aurora .max-w-lg,
                        .aurora .max-w-xl,
                        .aurora .max-w-2xl,
                        .aurora .max-w-3xl,
                        .aurora .max-w-4xl,
                        .aurora .max-w-5xl,
                        .aurora .max-w-6xl,
                        .aurora .max-w-7xl,
                        .aurora .max-w-full,
                        .aurora .w-full,
                        .cv-template.aurora .container,
                        .cv-template.aurora .max-w-sm,
                        .cv-template.aurora .max-w-md,
                        .cv-template.aurora .max-w-lg,
                        .cv-template.aurora .max-w-xl,
                        .cv-template.aurora .max-w-2xl,
                        .cv-template.aurora .max-w-3xl,
                        .cv-template.aurora .max-w-4xl,
                        .cv-template.aurora .max-w-5xl,
                        .cv-template.aurora .max-w-6xl,
                        .cv-template.aurora .max-w-7xl,
                        .cv-template.aurora .max-w-full,
                        .cv-template.aurora .w-full {
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            width: 100% !important;
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* AURORA TEMPLATE - CV SECTIONS TAM GENİŞLİK */
                        .aurora-template .cv-section,
                        .cv-template.aurora-template .cv-section,
                        .aurora .cv-section,
                        .cv-template.aurora .cv-section {
                            width: 100% !important;
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* AURORA TEMPLATE - BODY VƏ HTML TAM GENİŞLİK */
                        .aurora-template body,
                        .aurora-template html,
                        .cv-template.aurora-template body,
                        .cv-template.aurora-template html,
                        .aurora body,
                        .aurora html,
                        .cv-template.aurora body,
                        .cv-template.aurora html {
                            width: 100% !important;
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* PRIME TEMPLATE CSS - MİNİMUM MESAFƏLİ TƏRTİBAT */
                        .prime-template {
                            @page {
                                size: A4;
                                margin: 8mm 10mm 8mm 10mm !important; /* Minimum PDF margins */
                                padding: 0 !important;
                            }
                        }
                        
                        /* PRIME TEMPLATE - SECTION ARASINDAKİ MESAFƏ CVPreview ilə eyniləndi */
                        .prime-template .cv-section,
                        .cv-template.prime-template .cv-section,
                        .prime .cv-section,
                        .cv-template.prime .cv-section {
                            margin-top: 0 !important;
                            margin-bottom: 0 !important; /* CVPreview kimi section arası məsafə sıfır */
                            padding-top: 0 !important;
                            padding-bottom: 0 !important; /* CVPreview kimi padding sıfır */
                        }
                        
                        /* PRIME TEMPLATE - DRAG-DROP BORDER-LƏRİN CVPreview MESAFƏSİ */
                        .prime-template .border-b-2,
                        .prime-template .border-b,
                        .cv-template.prime-template .border-b-2,
                        .cv-template.prime-template .border-b,
                        .prime .border-b-2,
                        .prime .border-b,
                        .cv-template.prime .border-b-2,
                        .cv-template.prime .border-b {
                            margin-bottom: 0 !important; /* CVPreview kimi border altında sıfır */
                            padding-bottom: 0 !important;
                        }
                        
                        /* PRIME TEMPLATE - YAŞIL XƏTLƏR SAXLANİLDİ (geri qaytarıldı) */
                        .prime-template .border-green-600,
                        .cv-template.prime-template .border-green-600,
                        .prime .border-green-600,
                        .cv-template.prime .border-green-600 {
                            border-bottom: 2px solid #16a34a !important; /* Yaşıl border-lər geri qaytarıldı */
                        }
                        
                        /* PRIME TEMPLATE - YAŞIL XƏTT DIV-LƏRİ GÖSTƏR (geri qaytarıldı) */
                        .prime-template .bg-green-600,
                        .cv-template.prime-template .bg-green-600,
                        .prime .bg-green-600,
                        .cv-template.prime .bg-green-600 {
                            background-color: #16a34a !important; /* Yaşıl background geri qaytarıldı */
                            display: block !important; /* Yaşıl xətt divləri göstərilir */
                        }
                        
                        /* PRIME TEMPLATE - SECTION HEADER-LƏRİNDƏ CVPreview MESAFƏSİ */
                        .prime-template .cv-section h2,
                        .prime-template .cv-section h3,
                        .cv-template.prime-template .cv-section h2,
                        .cv-template.prime-template .cv-section h3,
                        .prime .cv-section h2,
                        .prime .cv-section h3,
                        .cv-template.prime .cv-section h2,
                        .cv-template.prime .cv-section h3 {
                            margin-bottom: 0 !important; /* CVPreview kimi header altında sıfır məsafə */
                            padding-bottom: 4px !important; /* CVPreview kimi 4px padding */
                        }
                        
                        /* PRIME TEMPLATE - TAILWIND MARGIN CLASS-LARINI CVPreview UYĞUN */
                        .prime-template .mb-4,
                        .prime-template .mb-6,
                        .prime-template .mb-8,
                        .cv-template.prime-template .mb-4,
                        .cv-template.prime-template .mb-6,
                        .cv-template.prime-template .mb-8,
                        .prime .mb-4,
                        .prime .mb-6,
                        .prime .mb-8,
                        .cv-template.prime .mb-4,
                        .cv-template.prime .mb-6,
                        .cv-template.prime .mb-8 {
                            margin-bottom: 0 !important; /* CVPreview kimi böyük margin-lar sıfır */
                        }
                        
                        .prime-template .mb-2,
                        .prime-template .mb-1,
                        .cv-template.prime-template .mb-2,
                        .cv-template.prime-template .mb-1,
                        .prime .mb-2,
                        .prime .mb-1,
                        .cv-template.prime .mb-2,
                        .cv-template.prime .mb-1 {
                            margin-bottom: 0 !important; /* CVPreview kimi kiçik margin-lar da sıfır */
                        }
                        
                        /* PRIME TEMPLATE - İNLİNE STYLE OVERRIDE */
                        .prime-template div[style*="margin-bottom"],
                        .cv-template.prime-template div[style*="margin-bottom"],
                        .prime div[style*="margin-bottom"],
                        .cv-template.prime div[style*="margin-bottom"] {
                            margin-bottom: 0 !important; /* İnline margin-bottom override */
                        }
                        
                        /* PRIME TEMPLATE - PERSONAL İNFO SECTİON CVPreview UYĞUN */
                        .prime-template .personal-info-section,
                        .cv-template.prime-template .personal-info-section,
                        .prime .personal-info-section,
                        .cv-template.prime .personal-info-section {
                            margin-bottom: 0 !important; /* CVPreview kimi personal info sonrası sıfır */
                            padding-bottom: 0 !important;
                        }
                        
                        /* PRIME TEMPLATE - FIELD-DƏN SONRA YAŞIL XƏTT QORUNDU */
                        .prime-template .border-t-2.border-green-600,
                        .cv-template.prime-template .border-t-2.border-green-600,
                        .prime .border-t-2.border-green-600,
                        .cv-template.prime .border-t-2.border-green-600 {
                            border-top: 2px solid #16a34a !important; /* Field-dən sonra yaşıl xətt saxlanıldı */
                            padding-top: 12px !important; /* Contact info üçün minimal padding */
                        }
                        
                        /* PRIME TEMPLATE - PERSONAL INFO VƏ SONRAKİ SECTION ARASINDAKİ MESAFƏ */
                        .prime-template .cv-section.avoid-break.mb-6,
                        .cv-template.prime-template .cv-section.avoid-break.mb-6,
                        .prime .cv-section.avoid-break.mb-6,
                        .cv-template.prime .cv-section.avoid-break.mb-6 {
                            margin-bottom: 4px !important; /* Personal info sonrası minimal məsafə */
                        }
                        
                        /* PRIME TEMPLATE - CONTACT INFO CONTAINER SON MESAFƏSİ */
                        .prime-template .pt-3.mb-3,
                        .cv-template.prime-template .pt-3.mb-3,
                        .prime .pt-3.mb-3,
                        .cv-template.prime .pt-3.mb-3 {
                            margin-bottom: 4px !important; /* Contact info container sonrası minimal məsafə */
                        }
                        
                        /* PRIME TEMPLATE - PERSONAL INFO HEADER DIV SON MESAFƏSİ */
                        .prime-template .cv-section.avoid-break,
                        .cv-template.prime-template .cv-section.avoid-break,
                        .prime .cv-section.avoid-break,
                        .cv-template.prime .cv-section.avoid-break {
                            padding-bottom: 0 !important; /* Personal info section-dan sonra padding yox */
                        }
                        
                        /* PRIME TEMPLATE - SECTION-LAR ARASINDAKİ GLOBAL GAP AZALDIN */
                        .prime-template div[style*="gap: 16px"],
                        .cv-template.prime-template div[style*="gap: 16px"],
                        .prime div[style*="gap: 16px"],
                        .cv-template.prime div[style*="gap: 16px"] {
                            gap: 4px !important; /* Section-lar arası gap 16px-dən 4px-ə azaldıldı */
                        }
                        
                        /* PRIME TEMPLATE - CONTACT INFO CONTAINER MESAFƏSİ */
                        .prime-template .pt-3.mb-3,
                        .cv-template.prime-template .pt-3.mb-3,
                        .prime .pt-3.mb-3,
                        .cv-template.prime .pt-3.mb-3 {
                            padding-top: 8px !important; /* Contact info üst padding azaldıldı */
                            margin-bottom: 4px !important; /* Contact info alt margin minimum */
                        }
                        
                        /* PRIME TEMPLATE - HEADER PERSONAL INFO MESAFƏLƏRİ */
                        .prime-template .mb-4,
                        .prime-template .mb-2,
                        .cv-template.prime-template .mb-4,
                        .cv-template.prime-template .mb-2,
                        .prime .mb-4,
                        .prime .mb-2,
                        .cv-template.prime .mb-4,
                        .cv-template.prime .mb-2 {
                            margin-bottom: 4px !important; /* Header elementləri arasında minimal məsafə */
                        }
                        
                        /* PRIME TEMPLATE - CONTENT SPACING CVPreview PATTERN */
                        .prime-template .space-y-2 > * + *,
                        .cv-template.prime-template .space-y-2 > * + *,
                        .prime .space-y-2 > * + *,
                        .cv-template.prime .space-y-2 > * + * {
                            margin-top: 8px !important; /* CVPreview space-y-2 pattern */
                        }
                        
                        /* PRIME TEMPLATE - SECTION CONTENT TOP MARGIN */
                        .prime-template .cv-section > div:last-child,
                        .cv-template.prime-template .cv-section > div:last-child,
                        .prime .cv-section > div:last-child,
                        .cv-template.prime .cv-section > div:last-child {
                            margin-top: 4px !important; /* CVPreview kimi content başlanğıcı 4px */
                        }
                        
                        /* PRIME TEMPLATE - ITEM BORDERS VƏ PADDING */
                        .prime-template .border-b,
                        .prime-template .pb-1,
                        .cv-template.prime-template .border-b,
                        .cv-template.prime-template .pb-1,
                        .prime .border-b,
                        .prime .pb-1,
                        .cv-template.prime .border-b,
                        .cv-template.prime .pb-1 {
                            padding-bottom: 4px !important; /* CVPreview pb-1 pattern */
                        }
                        
                        /* PRIME TEMPLATE - MB-1 OVERRIDE */
                        .prime-template .mb-1,
                        .cv-template.prime-template .mb-1,
                        .prime .mb-1,
                        .cv-template.prime .mb-1 {
                            margin-bottom: 4px !important; /* CVPreview mb-1 pattern */
                        }
                        
                        /* PRIME TEMPLATE - MT-0 VƏ MT-1 SPACING */
                        .prime-template .mt-0,
                        .cv-template.prime-template .mt-0,
                        .prime .mt-0,
                        .cv-template.prime .mt-0 {
                            margin-top: 0 !important;
                        }
                        
                        .prime-template .mt-1,
                        .cv-template.prime-template .mt-1,
                        .prime .mt-1,
                        .cv-template.prime .mt-1 {
                            margin-top: 4px !important; /* CVPreview mt-1 pattern */
                        }
                        
                        /* PRIME TEMPLATE - CV CONTAINER GENİŞLİK */
                        .prime-template .cv-container,
                        .prime-template .cv-content,
                        .cv-template.prime-template .cv-container,
                        .cv-template.prime-template .cv-content,
                        .prime .cv-container,
                        .prime .cv-content,
                        .cv-template.prime .cv-container,
                        .cv-template.prime .cv-content {
                            max-width: 190mm !important;    /* 210mm - 20mm margin */
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box !important;
                        }
                        
                        /* PRIME TEMPLATE - SƏHIFƏ BREAK-LƏRİ */
                        .prime-template h1, .prime-template h2, .prime-template h3,
                        .cv-template.prime-template h1, .cv-template.prime-template h2, .cv-template.prime-template h3,
                        .prime h1, .prime h2, .prime h3,
                        .cv-template.prime h1, .cv-template.prime h2, .cv-template.prime h3 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* PRIME TEMPLATE - SECTION PAGE BREAK */
                        .prime-template .cv-section,
                        .cv-template.prime-template .cv-section,
                        .prime .cv-section,
                        .cv-template.prime .cv-section {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* SƏHİFƏ AYIRMA VƏ BOŞLUQ SİSTEMİ */
                        .page-spacer {
                            height: 20mm !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            page-break-after: always !important;
                            break-after: page !important;
                        }
                        
                        .page-top-spacer {
                            height: 15mm !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        
                        .page-bottom-spacer {
                            height: 15mm !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
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
                        
                        /* 📄 SMART NATURAL PAGINATION CSS */
                        @page {
                            size: A4;
                       
                            orphans: 2;
                            widows: 2;
                        }
                        
                    
                        /* Allow natural content flow for pagination */
                        * {
                            box-sizing: border-box !important;
                        }
                        
                        /* Keep sections together when possible, but allow splitting if needed */
                        .cv-section, .experience-item, .education-item, .skill-group {
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* Headings should stay with their content */
                        h1, h2, h3, h4, h5, h6 {
                            page-break-after: avoid !important;
                            break-after: avoid !important;
                        }
                        
                        /* Template containers - allow natural height */
                        .basic-template, .traditional-template, .modern-template, 
                        .exclusive-template, .aurora-template,
                        .clarity-template, .horizon-template, .lumen-template,
                        .vertex-template, .essence-template {
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
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
                        
                        /* CSS Variables - FONT MANAGER İLƏ SINXRON - AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN OPTIMALLAŞDIRILMIŞ */
                        :root, html, body {
                            --cv-font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', ${fontSettings?.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'};
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
                        
                        /* PROFESSIONAL PAGE BREAK SİSTEMİ - AUTOMATIC MULTI-PAGE SUPPORT */
                        
                        /* A4 page setup - bütün səhifələr üçün eyni margin */
                        @page {
                            size: A4;
                            margin: 0 !important; /* TAMAMİLƏ SIFIR */
                        }
                        
                        /* CV Container - TƏBİİ CONTENT HEIGHT - ZORLA HEIGHT YOX */
                        .cv-template {
                            height: auto !important;
                            min-height: 0 !important; /* ZORLA HEIGHT YOX */
                            max-height: none !important;
                            page-break-inside: auto !important; /* İçerik çox olsa növbəti səhifəyə keçsin */
                            break-inside: auto !important;
                        }
                        
                        /* LUMEN TEMPLATE - UNIVERSAL OVERRIDE - NUCLEAR OPTION */
                        .cv-template.lumen-template,
                        .lumen-template.cv-template,
                        .lumen-template,
                        .lumen,
                        .cv-template.lumen,
                        body .cv-template.lumen-template,
                        body .lumen-template.cv-template,
                        body .lumen-template,
                        body .lumen,
                        body .cv-template.lumen,
                        html body .cv-template.lumen-template,
                        html body .lumen-template.cv-template,
                        html body .lumen-template,
                        html body .lumen,
                        html body .cv-template.lumen {
                            min-height: 0 !important; /* UNIVERSAL QAYDANı OVERRIDE ET */
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - REAL CONTENT HEIGHT, NO FORCED MIN-HEIGHT */
                        .cv-template.exclusive-template,
                        .exclusive-template,
                        .exclusive-template.cv-template,
                        body .exclusive-template,
                        body .cv-template.exclusive-template {
                            min-height: 0 !important; /* Tamamilə təbii hündürlük */
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        
                        /* EXCLUSIVE TEMPLATE - CONTAINER VƏ CONTENT TƏBİİ ÖLÇÜ */
                        .exclusive-template .cv-container,
                        .exclusive-template .cv-content,
                        .cv-template.exclusive-template .cv-container,
                        .cv-template.exclusive-template .cv-content {
                            min-height: 0 !important;
                            height: auto !important;
                            padding-bottom: 0 !important; /* Əlavə boşluq yoxdur */
                        }
                        
                        /* AURORA TEMPLATE - REAL CONTENT HEIGHT, NO FORCED MIN-HEIGHT */
                        .cv-template.aurora-template,
                        .aurora-template,
                        .aurora-template.cv-template,
                        body .aurora-template,
                        body .cv-template.aurora-template {
                            min-height: 0 !important; /* Tamamilə təbii hündürlük */
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        
                        /* AURORA TEMPLATE - CONTAINER VƏ CONTENT TƏBİİ ÖLÇÜ */
                        .aurora-template .cv-container,
                        .aurora-template .cv-content,
                        .cv-template.aurora-template .cv-container,
                        .cv-template.aurora-template .cv-content {
                            min-height: 0 !important;
                            height: auto !important;
                            padding-bottom: 0 !important; /* Əlavə boşluq yoxdur */
                        }
                        
                        /* LUMEN TEMPLATE - REAL CONTENT HEIGHT, NO FORCED MIN-HEIGHT */
                        .cv-template.lumen-template,
                        .lumen-template,
                        .lumen-template.cv-template,
                        body .lumen-template,
                        body .cv-template.lumen-template,
                        .lumen,
                        .cv-template.lumen,
                        body .lumen,
                        body .cv-template.lumen {
                            min-height: 0 !important; /* Tamamilə təbii hündürlük */
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        
                        /* PRIME TEMPLATE - REAL CONTENT HEIGHT, NO FORCED MIN-HEIGHT */
                        .cv-template.prime-template,
                        .prime-template,
                        .prime-template.cv-template,
                        body .prime-template,
                        body .cv-template.prime-template,
                        .prime,
                        .cv-template.prime,
                        body .prime,
                        body .cv-template.prime {
                            min-height: 0 !important; /* Tamamilə təbii hündürlük */
                            height: auto !important;
                            max-height: none !important;
                            overflow: visible !important;
                            /* 🔧 PRIME TEMPLATE - GENİŞLİK MƏHDUDLAŞDIR */
                            max-width: 195mm !important;    /* Maksimum genişlik 180mm */
                            width: 100% !important;         /* Tam genişlik amma limit ilə */
                            margin: 0 auto !important;      /* Mərkəzləşdir */
                            box-sizing: border-box !important;
                        }
                        
                        /* PRIME TEMPLATE - CONTAINER VƏ CONTENT TƏBİİ ÖLÇÜ */
                        .prime-template .cv-container,
                        .prime-template .cv-content,
                        .cv-template.prime-template .cv-container,
                        .cv-template.prime-template .cv-content {
                            min-height: 0 !important;
                            height: auto !important;
                            padding-bottom: 0 !important; /* Əlavə boşluq yoxdur */
                            /* 🔧 PRIME TEMPLATE - CONTAINER PADDING ƏLAVƏ ET */
                            padding-top: 8mm !important;    /* Yuxarıdan 8mm padding */
                            padding-left: 5mm !important;   /* Soldan 5mm padding */
                            padding-right: 5mm !important;  /* Sağdan 5mm padding */
                            margin: 0 !important;
                            box-sizing: border-box !important;
                            /* 🔧 PRIME TEMPLATE - CONTENT GENİŞLİYİ MƏHDUDLAŞDIR */
                            max-width: 195mm !important;    /* Maksimum genişlik 190mm */
                            width: 100% !important;         /* Tam genişlik işlət amma limit qoy */
                        }
                        
                        /* 🔧 PRIME TEMPLATE - SECTION SPACING */
                        .prime-template .cv-section,
                        .cv-template.prime-template .cv-section {
                            margin-bottom: 6mm !important;  /* Section-lar arası 6mm boşluq */
                            padding: 3mm 0 !important;      /* Section içi padding */
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }
                        
                        /* LUMEN TEMPLATE - CONTAINER VƏ CONTENT TƏBİİ ÖLÇÜ */
                        .lumen-template .cv-container,
                        .lumen-template .cv-content,
                        .cv-template.lumen-template .cv-container,
                        .cv-template.lumen-template .cv-content,
                        .lumen .cv-container,
                        .lumen .cv-content,
                        .cv-template.lumen .cv-container,
                        .cv-template.lumen .cv-content {
                            min-height: 0 !important;
                            height: auto !important;
                            padding-bottom: 0 !important; /* Əlavə boşluq yoxdur */
                        }
                        .cv-template.lumen .cv-container,
                        .cv-template.lumen .cv-content,
                        body .lumen-template .cv-container,
                        body .lumen-template .cv-content,
                        body .cv-template.lumen-template .cv-container,
                        body .cv-template.lumen-template .cv-content,
                        body .lumen .cv-container,
                        body .lumen .cv-content,
                        body .cv-template.lumen .cv-container,
                        body .cv-template.lumen .cv-content {
                            min-height: 0 !important;
                            height: auto !important;
                            padding-bottom: 0 !important; /* Əlavə boşluq yoxdur */
                            max-height: none !important;
                            overflow: visible !important;
                        }
                        
                        /* LUMEN TEMPLATE - BÜTÜN DIV VƏ SECTION ELEMENTLER */
                        .lumen-template div,
                        .lumen-template section,
                        .lumen-template main,
                        .lumen-template article,
                        .cv-template.lumen-template div,
                        .cv-template.lumen-template section,
                        .cv-template.lumen-template main,
                        .cv-template.lumen-template article,
                        .lumen div,
                        .lumen section,
                        .lumen main,
                        .lumen article,
                        .cv-template.lumen div,
                        .cv-template.lumen section,
                        .cv-template.lumen main,
                        .cv-template.lumen article {
                            min-height: 0 !important;
                            height: auto !important;
                            max-height: none !important;
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
                            /* 🔧 BACKGROUND ARXA PLANA PADDING/MARGIN TƏSİR ETMƏSİN */
                            margin: 0 !important;            /* Panel arxa planında margin yoxdur */
                            padding: 0 !important;           /* Panel arxa planında padding yoxdur */
                            box-sizing: border-box !important;
                        }
                        
                        /* Atlas sol panel içindəki BÜTÜN elementlər ağ rəng + İÇƏRİK PADDING */
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
                            /* 🔧 İÇƏRİK ELEMENTLƏRƏ PADDING ƏLAVƏ ET */
                            margin: 2mm 0 !important;        /* Yuxarı/aşağı kiçik margin */
                            padding: 1mm 3mm !important;     /* İçərik üçün padding */
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
                            background-color: #1e3a8a !important; /* Goy arxa plan */
                            background: #1e3a8a !important;
                            color: white !important;
                            /* 🔧 ARXA PLAN PADDING/MARGIN SİL */
                            margin: 0 !important;               /* Panel arxa planında margin yoxdur */
                            padding: 0 !important;              /* Panel arxa planında padding yoxdur */
                            box-sizing: border-box !important;
                            position: relative !important;
                            z-index: 999999 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        /* 🔧 ATLAS SOL PANEL İÇƏRİSİNDƏKİ CONTENT WRAPPER - BURADA PADDING VAR */
                        .atlas-template .w-2\/5 > div,
                        .atlas-template .w-5\/12 > div,
                        .atlas-left-panel > div,
                        .atlas-template .atlas-left-panel > div {
                            /* İÇƏRİK WRAPPER-ə PADDING ƏLAVƏ ET */
                            padding: 8mm !important;            /* İçərik üçün padding */
                            margin: 0 !important;
                            box-sizing: border-box !important;
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
        
        // 🚀 PRODUCTION-READY PAGE CONTENT LOADING - Enhanced timeout və error handling
        await page.setContent(html, { 
            waitUntil: 'networkidle0',
            // 🚀 PRODUCTION TIMEOUT - 4x uzun Azərbaycan hərfləri və font loading üçün
            timeout: isProduction || isServerless ? 120000 : 30000  // Production: 2 dəqiqə, Development: 30 saniyə
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
        
        // LUMEN TEMPLATE üçün runtime CSS injection - BLANK PAGE KILLER
        if (templateId === 'lumen' || templateId?.toLowerCase().includes('lumen')) {
            console.log('=== LUMEN TEMPLATE - SINGLE PAGE ENFORCER CSS INJECTION ===');
            
            await page.addStyleTag({
                content: `
                    /* LUMEN TEMPLATE - SINGLE PAGE ENFORCER */
                    
                    @page {
                        margin: 10mm !important; /* Lumen margin ayarı */
                    }
                    
                    .lumen-template,
                    .cv-template.lumen-template,
                    .lumen-template.cv-template,
                    .lumen,
                    .cv-template.lumen,
                    body .lumen-template,
                    body .cv-template.lumen-template,
                    html body .lumen-template,
                    html body .cv-template.lumen-template {
                        /* 🔧 SINGLE PAGE ENFORCER */
                        max-height: 257mm !important;      /* A4 ölçüsündə sıkı limit */
                        min-height: 0 !important;          /* ZORLA HEIGHT KILLER */
                        height: auto !important;           /* Təbii hündürlük */
                        overflow: hidden !important;       /* Artıq məzmunu GİZLƏT */
                        margin: 0 !important;
                        padding: 0 !important;
                        page-break-inside: avoid !important;   /* İçəridə bölünməsin */
                        page-break-after: avoid !important;    /* Sonra səhifə yaranmasın */
                        page-break-before: avoid !important;   /* Əvvəl səhifə yaranmasın */
                        break-inside: avoid !important;
                        break-after: avoid !important;
                        break-before: avoid !important;
                    }
                    
                    /* LUMEN CONTAINER RESET - SINGLE PAGE */
                    .lumen-template .cv-container,
                    .lumen-template .cv-content,
                    .lumen-template .cv-section,
                    .cv-template.lumen-template .cv-container,
                    .cv-template.lumen-template .cv-content,
                    .cv-template.lumen-template .cv-section {
                        min-height: 0 !important;
                        height: auto !important;
                        max-height: 50mm !important;       /* Hər section maksimum 50mm */
                        overflow: hidden !important;       /* Section artıq məzmunu gizlət */
                        padding-bottom: 3mm !important;    /* Kiçik boşluq */
                        margin-bottom: 3mm !important;     /* Kiçik boşluq */
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                    }
                    
                    /* LUMEN TEXT ELEMENTS - COMPACT */
                    .lumen-template p,
                    .lumen-template h1,
                    .lumen-template h2,
                    .lumen-template h3,
                    .lumen-template h4,
                    .lumen-template h5,
                    .lumen-template h6,
                    .lumen-template li,
                    .lumen-template div {
                        line-height: 1.3 !important;       /* Sıx line height */
                        margin: 1mm 0 !important;          /* Kiçik margin */
                        padding: 0 !important;             /* Padding sıfır */
                    }
                `
            });
            
            console.log('✅ LUMEN TEMPLATE SINGLE PAGE ENFORCER CSS INJECTION COMPLETED');
        }
        
        // PRIME TEMPLATE üçün runtime CSS injection - MARGINS + PADDING
        if (templateId === 'prime' || templateId?.toLowerCase().includes('prime')) {
            console.log('=== PRIME TEMPLATE - MARGINS + PADDING CSS INJECTION ===');
            
            await page.addStyleTag({
                content: `
                    /* PRIME TEMPLATE - OPTIMAL MARGINS + PADDING */
                    
                    @page {
                        margin: 12mm 15mm !important;  /* Top/Bottom: 12mm, Left/Right: 15mm */
                    }
                    
                    .prime-template,
                    .cv-template.prime-template,
                    .prime-template.cv-template,
                    .prime,
                    .cv-template.prime,
                    body .prime-template,
                    body .cv-template.prime-template,
                    html body .prime-template,
                    html body .cv-template.prime-template {
                        /* 🔧 PRIME TEMPLATE - CONTAINER PADDING */
                        padding-top: 8mm !important;       /* Yuxarıdan 8mm padding */
                        padding-bottom: 8mm !important;    /* Aşağıdan 8mm padding */
                        padding-left: 5mm !important;      /* Soldan 5mm padding */
                        padding-right: 5mm !important;     /* Sağdan 5mm padding */
                        min-height: 0 !important;          /* ZORLA HEIGHT KILLER */
                        height: auto !important;
                        max-height: 257mm !important;      /* A4 ölçüsündə limit */
                        overflow: hidden !important;       /* Artıq məzmunu gizlət */
                        margin: 0 !important;
                        border: none !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                    }
                        max-height: none !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        page-break-inside: auto !important;
                        break-inside: auto !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* PRIME CONTAINER RESET */
                    .prime-template .cv-container,
                    .prime-template .cv-content,
                    .prime-template div,
                    .prime-template section,
                    .cv-template.prime-template .cv-container,
                    .cv-template.prime-template .cv-content,
                    .cv-template.prime-template div,
                    .cv-template.prime-template section {
                        min-height: 0 !important;
                        height: auto !important;
                        padding-bottom: 0 !important;
                        margin-bottom: 0 !important;
                        box-sizing: border-box !important;
                    }
                `
            });
            
            console.log('✅ PRIME TEMPLATE BLANK PAGE KILLER CSS INJECTION COMPLETED');
        }
        
        // ESSENCE TEMPLATE üçün runtime CSS injection - YALNIZ PDF SƏHIFƏ MARGIN SİLMƏ
        if (templateId === 'essence' || templateId?.toLowerCase().includes('essence')) {
            console.log('=== ESSENCE TEMPLATE - PDF SƏHIFƏ MARGIN SİLMƏ CSS INJECTION ===');
            
            await page.addStyleTag({
                content: `
                    /* ESSENCE TEMPLATE - YALNIZ PDF SƏHIFƏ MARGIN SİFIR, CONTENT DƏYİŞMİR */
                    
                    /* PDF səhifə margin tamamilə sıfır */
                    @page {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    /* Essence template container sıfır margin/padding - yalnız səhifə səviyyəsi */
                    .essence-template,
                    .cv-template.essence-template {
                        margin: 0 !important;
                        padding: 0 !important;
                        /* Content daxili spacing dəyişmir */
                    }
                `
            });
            
            console.log('✅ ESSENCE TEMPLATE PDF SƏHIFƏ MARGIN SİLMƏ CSS INJECTION COMPLETED');
        }
        
        // Azərbaycan hərfləri və encoding dəstəyi üçün əlavə ayarlar
        await page.setExtraHTTPHeaders({
            'Accept-Charset': 'utf-8',
            'Accept-Language': 'az-AZ,az,tr-TR,tr,en-US,en'
        });

        // Sadə font əlavəsi - sistem fontları ilə
        await page.addStyleTag({
            content: `
                /* Azərbaycan hərfləri üçün sistem fontları */
                * {
                    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                                'Liberation Sans', 'DejaVu Sans', 'Arial Unicode MS', 
                                Arial, sans-serif !important;
                    text-rendering: optimizeLegibility !important;
                }
            `
        });

        // PDF yarat - sadə və sürətli
        console.log('PDF yaradılır...');
        
        // Multi-page PDF support üçün CSS əlavə et
        await page.addStyleTag({
            content: `
                /* PDF Export Font Variables - fontSettings-dən gələn dəyərlər - AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN OVERRIDE */
                :root {
                    --cv-font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', ${fontSettings.fontFamily};
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
                
                /* 🚫 NUCLEAR BLANK PAGE PREVENTION - FORCE SINGLE PAGE */
                @page {
                    size: A4;
                            }
                
                /* 🚫 AGGRESSIVE: Disable all page breaks */
                * {
                    page-break-after: avoid !important;
                    page-break-before: avoid !important;
                    page-break-inside: avoid !important;
                    break-after: avoid !important;
                    break-before: avoid !important;
                    break-inside: avoid !important;
                    orphans: 4 !important;
                    widows: 4 !important;
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
                
                /* PDF Multi-page fundamental rules for A4 - 🚫 NUCLEAR SINGLE PAGE MODE */
                html {
                    height: auto !important;
                    max-height: 297mm !important; /* Force A4 max height */
                    overflow: hidden !important; /* Hide overflow to prevent new pages */
                    font-size: var(--cv-body-size, 12pt) !important;
                    margin: 0 !important; /* HTML margin sıfır */
                    padding: 0 !important; /* HTML padding sıfır */
                }
                
                body {
                    height: auto !important;
                    max-height: 280mm !important; /* Slightly less than A4 for content area */
                    min-height: auto !important;
                    overflow: hidden !important; /* 🚫 CRITICAL: Hide overflow */
                    margin: 0 !important; /* Body margin mütləq sıfır */
                    padding: 0 !important; /* Body padding mütləq sıfır */
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    line-height: var(--cv-line-height, 1.4) !important;
                    /* 🚫 DISABLE ALL PAGE BREAKS */
                    page-break-after: avoid !important;
                    page-break-before: avoid !important;
                    page-break-inside: avoid !important;
                }
                
                /* PDF-də bütün container-lərin kənar boşluqlarını tamamilə sil + 🚫 NUCLEAR MODE */
                .cv-preview,
                .basic-template,
                .exclusive-template,
                .modern-template,
                .atlas-template,
                .aurora-template,
                .vertex-template,
                .horizon-template,
                .clarity-template,
                .lumen-template,
                [class*="template"],
                .template-container,
                .cv-container {
                    margin: 0 !important; /* MÜTLƏQ margin sıfır */
                    padding: 0 !important; /* MÜTLƏQ padding sıfır */
                    border: none !important;
                    box-shadow: none !important;
                    /* 🚫 NUCLEAR: Force height limits */
                    max-height: 257mm !important; /* Slightly less than A4 for margins */
                    overflow: hidden !important; /* Hide overflow completely */
                    page-break-after: avoid !important;
                    page-break-before: avoid !important;
                    page-break-inside: avoid !important;
                }
                
                /* 🔧 ATLAS TEMPLATE - TOP PADDING ƏLAVƏ ET */
                .atlas-template,
                .cv-template.atlas-template,
                .atlas-template.cv-template,
                .atlas {
                    padding-top: 15mm !important; /* Atlas template üçün yuxarıdan boşluq */
                    margin: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    max-height: 257mm !important;
                    overflow: hidden !important;
                }
                
                /* ATLAS TEMPLATE - CONTAINER VƏ CONTENT AREAS */
                .atlas-template .cv-container,
                .atlas-template .cv-content,
                .cv-template.atlas-template .cv-container,
                .cv-template.atlas-template .cv-content {
                    padding-top: 0 !important; /* Container-də əlavə top padding yoxdur */
                    margin-top: 0 !important;
                }
                
                /* LUMEN TEMPLATE - SPECIAL EXCEPTION - NO HEIGHT LIMITS */
                .lumen-template,
                .cv-template.lumen-template,
                .lumen-template.cv-template,
                .lumen,
                .cv-template.lumen {
                    margin: 0 !important;
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    /* � LUMEN: HEIGHT LIMITS ƏLAVƏ EDİLDİ - Basic kimi */
                    max-height: 257mm !important; /* Lumen: A4 ölçüsündə height limit */
                    min-height: 0 !important;     /* Lumen: zorla height yox */
                    height: auto !important;      /* Lumen: təbii height */
                    overflow: hidden !important;  /* Lumen: əlavə content gizlət */
                    page-break-after: avoid !important;   /* Lumen: səhifə kəsilməsin */
                    page-break-before: avoid !important;
                    page-break-inside: avoid !important;  /* Lumen: section içi kəsilməsin */
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
                
                /* ESSENCE TEMPLATE - YALNIZ PDF SƏHIFƏ MARGIN SİLMƏ, CONTENT-Ə TƏSİR YOX */
                .essence-template,
                .cv-template.essence-template,
                .essence-template.cv-template {
                    /* YALNIZ PDF EXPORT ÜÇÜN KƏNAR SƏHİFƏ BOŞLUQLARI */
                    box-sizing: border-box !important;
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
        
        // Sadə və təbii PDF axını
        if (templateExists) {
            await page.evaluate(() => {
                console.log('=== TƏBİİ PDF AXIN - SADƏ YANAŞMA ===');
                
                // Template-i tap
                const template = document.querySelector('.basic-template') as HTMLElement ||
                                document.querySelector('[class*="template"]') as HTMLElement ||
                                document.body as HTMLElement;
                
                if (template) {
                    // Təbii axın üçün sadə hazırlıq - HEIGHT UNIVERSAL CSS QAYDALARINDA TƏYIN EDİLİR
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

        // � SMART NATURAL PAGINATION SYSTEM
        console.log('� Real pagination system activated - no restrictions!');
        
        // Step 1: Natural content flow check
        const needsSecondPage = await page.evaluate(() => {
            // A4 hündürlük (297mm = 1123px at 96 DPI)
            const A4_HEIGHT_PX = 1123;
            const SAFE_MARGIN = 50; // Safety margin for content
            const USABLE_HEIGHT = A4_HEIGHT_PX - SAFE_MARGIN;
            
            // Body content yoxlanışı
            const body = document.body;
            const actualHeight = body.scrollHeight;
            console.log('📏 Body content height:', actualHeight, 'px vs A4 usable:', USABLE_HEIGHT, 'px');
            
            // Natural content decision
            if (actualHeight > USABLE_HEIGHT) {
                console.log('📄 Content exceeds 1 page - allowing natural flow to 2nd page');
                return true; // Allow natural pagination
            } else {
                console.log('✅ Content fits in 1 page - keeping single page');
                return false; // Single page is sufficient
            }
        });
        
        // Step 2: FORCE NATURAL PAGINATION + Manual Page Spacing
        await page.evaluate(() => {
            // Add CSS to force natural pagination with manual spacing
            const style = document.createElement('style');
            style.textContent = `
                /* Force natural pagination */
                * {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                    page-break-before: auto !important;
                    break-before: auto !important;
                    page-break-after: auto !important;
                    break-after: auto !important;
                }
                
                body {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                    height: auto !important;
                    max-height: none !important;
                    overflow: visible !important;
                }
                
                /* Manual spacing for page breaks */
                .page-break-spacer {
                    height: 15mm !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    page-break-before: always !important;
                    break-before: page !important;
                }
                
                /* Force content to flow naturally */
                .cv-section, .experience-item, .education-item {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                }
            `;
            document.head.appendChild(style);
            
            // Add manual spacers between major sections
            const sections = document.querySelectorAll('.cv-section');
            let addedSpacers = 0;
            
            sections.forEach((section, index) => {
                if (index > 0 && index % 2 === 0) { // Every 2nd section, add spacer for page break
                    const spacer = document.createElement('div');
                    spacer.className = 'page-break-spacer';
                    spacer.innerHTML = '&nbsp;'; // Non-breaking space
                    section.parentNode?.insertBefore(spacer, section);
                    addedSpacers++;
                }
            });
            
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el instanceof HTMLElement) {
                    // Clean up excessive margins
                    const currentMarginBottom = parseInt(getComputedStyle(el).marginBottom) || 0;
                    if (currentMarginBottom > 20) {
                        el.style.setProperty('margin-bottom', '15px', 'important');
                    }
                    
                    // Force natural page breaks
                    el.style.setProperty('page-break-inside', 'auto', 'important');
                    el.style.setProperty('break-inside', 'auto', 'important');
                    el.style.setProperty('height', 'auto', 'important');
                    el.style.setProperty('max-height', 'none', 'important');
                }
            });
            
            console.log(`🔥 FORCED natural pagination with ${addedSpacers} manual spacers`);
        });

        // 🚀 BASIC TEMPLATE FINAL MARGIN OVERRIDE - Həqiqətən azaldat kənar boşluqları
        if (templateId === 'basic') {
            console.log('=== BASIC TEMPLATE FINAL MARGIN OVERRIDE ===');
            await page.addStyleTag({
                content: `
                    /* BASIC TEMPLATE - SON DƏFƏLİK MARGİN OVERRIDE */
                    @page {
                        size: A4 !important;
                        margin: 5mm 5mm 5mm 5mm !important; /* Çox kiçik margin-lar: 5mm hər tərəfdən */
                        padding: 0 !important;
                        border: none !important;
                    }
                    
                    /* Basic template container-lər üçün maksimal genişlik */
                    .basic-template,
                    .cv-preview,
                    .cv-container,
                    .container,
                    .max-w-4xl,
                    body > div:first-child {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 15px !important; /* Yalnız içərik üçün minimal padding */
                        box-sizing: border-box !important;
                    }
                    
                    /* Body və HTML üçün sıfır margin */
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                `
            });
            
            // JavaScript ilə də force et
            await page.evaluate(() => {
                console.log('🎯 BASIC TEMPLATE - JavaScript ilə margin zorlanır');
                
                // Body və HTML-i sıfırla
                document.documentElement.style.setProperty('margin', '0', 'important');
                document.documentElement.style.setProperty('padding', '0', 'important');
                document.body.style.setProperty('margin', '0', 'important');
                document.body.style.setProperty('padding', '0', 'important');
                
                // Bütün container-ləri tap və düzəlt
                const containers = document.querySelectorAll('.basic-template, .cv-preview, .cv-container, .container, .max-w-4xl, body > div:first-child');
                containers.forEach(container => {
                    if (container instanceof HTMLElement) {
                        container.style.setProperty('width', '100%', 'important');
                        container.style.setProperty('max-width', 'none', 'important');
                        container.style.setProperty('margin', '0', 'important');
                        container.style.setProperty('padding', '0 15px', 'important'); // Yalnız sol-sağ minimal padding
                        container.style.setProperty('box-sizing', 'border-box', 'important');
                    }
                });
                
                console.log('✅ Basic template margins JavaScript ilə zorlandı');
            });
            
            console.log('✅ BASIC TEMPLATE FINAL MARGIN OVERRIDE TAMAMLANDI');
        }

        // 🚀 PRODUCTION-READY PDF GENERATİON - Enhanced timeout və error handling
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,  // ✅ Background colors göstərilsin
            preferCSSPageSize: true,  // ✅ CSS @page ayarlarından istifadə et
            displayHeaderFooter: false,
            pageRanges: undefined, // REAL PAGINATION: Always allow multiple pages
            // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN UNICODE VƏ FONT SUPPORT
            tagged: true,  // PDF/A accessibility və unicode dəstəyi
            outline: false,
            omitBackground: false,  // ✅ Background colors qoru
            // Additional settings for clean pagination
            generateDocumentOutline: false,
            generateTaggedPDF: false,  // Disable tagging to prevent extra pages
            // 🚀 PRODUCTION TIMEOUT OPTIMIZATION
            timeout: isProduction || isServerless ? 120000 : 60000,  // Production: 2 dəqiqə, Development: 1 dəqiqə
            // ✅ Basic template üçün çox kiçik margin, digərləri üçün CSS @page-dən götür
            margin: templateId === 'basic' ? {
                top: '5mm',
                right: '0mm', 
                bottom: '5mm',
                left: '0mm'
            } : undefined,  // Digər template-lər CSS @page-dən margin götürsün
            scale: 1.0
        });

        console.log('PDF yaradıldı, browser bağlanır...');
        
        // 🔧 AZƏRBAYCAN HƏRFLƏRİ ÜÇÜN PDF CONTENT TEST
        console.log('🔧 Testing PDF content for Azerbaijani character support...');
        await page.evaluate(() => {
            // Final test before PDF generation
            const bodyText = document.body.textContent || '';
            const azerbaijaniChars = /[ƏəĞğİıÖöÜüÇçŞş]/g;
            const foundChars = bodyText.match(azerbaijaniChars);
            
            if (foundChars && foundChars.length > 0) {
                console.log('✅ Found', foundChars.length, 'Azerbaijani characters in PDF content');
                console.log('🔧 Azerbaijani characters found:', [...new Set(foundChars)].join(' '));
            } else {
                console.log('⚠️ No Azerbaijani characters found in PDF content');
            }
            
            return {
                hasAzerbaijaniChars: foundChars && foundChars.length > 0,
                charCount: foundChars ? foundChars.length : 0,
                uniqueChars: foundChars ? [...new Set(foundChars)] : []
            };
        });
        
        await browser.close();

        // ✅ REMOVE BLANK PAGES FROM PDF USING PDF-LIB
        console.log('🔍 Checking for blank pages to remove...');
        const cleanedPdfBuffer = await removeBlankPages(pdfBuffer, templateId);
        console.log('✅ Blank page removal completed');

        // PDF faylını geri qaytar
        console.log('PDF response qaytarılır, ölçü:', cleanedPdfBuffer.length, 'bytes');
        return new NextResponse(Buffer.from(cleanedPdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="CV-${cvId}.pdf"`,
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error('PDF export xətası:', error);
        
        // 🚀 PRODUCTION ERROR HANDLING - Enhanced error classification
        // Browser cleanup if it was opened
        if (browser) {
            try {
                await browser.close();
                console.log('Browser cleaned up after error');
            } catch (cleanupError) {
                console.error('Browser cleanup error:', cleanupError);
            }
        }
        
        // 🔧 ENHANCED ERROR CLASSIFICATION FOR PRODUCTION
        let errorMessage = 'PDF export xətası';
        let httpStatus = 500;
        
        if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            // Timeout xətaları
            if (errorMsg.includes('timeout') || errorMsg.includes('navigation timeout')) {
                errorMessage = isProduction 
                    ? 'PDF yaradılması çox uzun çəkdi. Xahiş edirik yenidən cəhd edin.'
                    : `PDF timeout xətası: ${error.message}`;
                httpStatus = 408; // Request Timeout
            }
            // Memory xətaları
            else if (errorMsg.includes('memory') || errorMsg.includes('out of memory')) {
                errorMessage = isProduction 
                    ? 'Yaddaş yetərli deyil. CV-nin ölçüsünü azaldın və yenidən cəhd edin.'
                    : `Memory xətası: ${error.message}`;
                httpStatus = 507; // Insufficient Storage
            }
            // Network xətaları
            else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
                errorMessage = isProduction 
                    ? 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın və yenidən cəhd edin.'
                    : `Network xətası: ${error.message}`;
                httpStatus = 503; // Service Unavailable
            }
            // Umumi xəta
            else {
                errorMessage = isProduction 
                    ? 'PDF yaradılması zamanı xəta baş verdi. Xahiş edirik yenidən cəhd edin.'
                    : `PDF export xətası: ${error.message}`;
            }
        }
        
        console.error(`🚨 Production Error [${httpStatus}]:`, errorMessage);
        
        return NextResponse.json(
            { 
                error: errorMessage,
                timestamp: new Date().toISOString(),
                ...(isProduction ? {} : { details: error instanceof Error ? error.message : 'Unknown error' })
            }, 
            { status: httpStatus }
        );
    }
}

/**
 * 🚀 BLANK PAGE REMOVAL FUNCTION
 * Automatically detects and removes completely blank pages from PDF
 * Uses pdf-lib to analyze text content and filter out empty pages
 */
async function removeBlankPages(pdfBuffer: Uint8Array, templateId: string): Promise<Uint8Array> {
    try {
        console.log('📄 Loading PDF document for blank page analysis...');
        
        // Load the original PDF
        const originalPdf = await PDFDocument.load(pdfBuffer);
        const totalPages = originalPdf.getPageCount();
        console.log(`📊 Original PDF has ${totalPages} pages`);
        
        if (totalPages <= 1) {
            console.log('📄 Single page PDF - no blank page removal needed');
            return pdfBuffer;
        }
        
        // Create a new PDF document for clean pages
        const cleanPdf = await PDFDocument.create();
        
        // Copy non-blank pages
        let keptPages = 0;
        let removedPages = 0;
        
        for (let i = 0; i < totalPages; i++) {
            console.log(`🔍 Analyzing page ${i + 1}/${totalPages}...`);
            
            // Extract text content from the page
            const pageHasContent = await checkPageHasContent(originalPdf, i, templateId);
            
            if (pageHasContent) {
                // Copy this page to the clean PDF
                const [copiedPage] = await cleanPdf.copyPages(originalPdf, [i]);
                cleanPdf.addPage(copiedPage);
                keptPages++;
                console.log(`✅ Page ${i + 1} has content - keeping`);
            } else {
                removedPages++;
                console.log(`🗑️ Page ${i + 1} is blank - removing`);
            }
        }
        
        console.log(`📊 Blank page removal summary:`);
        console.log(`   - Original pages: ${totalPages}`);
        console.log(`   - Kept pages: ${keptPages}`);
        console.log(`   - Removed blank pages: ${removedPages}`);
        
        // Return the cleaned PDF
        const cleanedPdfBytes = await cleanPdf.save();
        console.log(`✅ Cleaned PDF size: ${cleanedPdfBytes.length} bytes`);
        
        return cleanedPdfBytes;
        
    } catch (error) {
        console.error('❌ Error removing blank pages:', error);
        console.log('🔄 Falling back to original PDF...');
        return pdfBuffer;
    }
}

/**
 * 🔍 CHECK IF PAGE HAS TEXT CONTENT
 * Analyzes a PDF page to determine if it contains any text content
 * Returns true if page has text, false if completely blank
 */
async function checkPageHasContent(pdfDoc: PDFDocument, pageIndex: number, templateId: string): Promise<boolean> {
    try {
        const page = pdfDoc.getPage(pageIndex);
        
        // Get page content stream
        const contentStream = page.node.Contents();
        if (!contentStream) {
            console.log(`   Page ${pageIndex + 1}: No content stream - considering blank`);
            return false;
        }
        
        let contentBytes: Uint8Array | undefined;
        
        // Handle different content stream types
        if (Array.isArray(contentStream)) {
            // Multiple content streams - analyze ALL streams, not just first
            let allContentBytes: Uint8Array = new Uint8Array(0);
            
            for (let i = 0; i < contentStream.length; i++) {
                const stream = contentStream[i];
                if (stream && 'getContents' in stream) {
                    const streamBytes = stream.getContents();
                    if (streamBytes && streamBytes.length > 0) {
                        // Concatenate all stream content
                        const combined = new Uint8Array(allContentBytes.length + streamBytes.length);
                        combined.set(allContentBytes);
                        combined.set(streamBytes, allContentBytes.length);
                        allContentBytes = combined;
                    }
                }
            }
            contentBytes = allContentBytes;
            console.log(`   Page ${pageIndex + 1}: Found ${contentStream.length} content streams, combined length: ${contentBytes.length}`);
        } else {
            // Single content stream
            if ('getContents' in contentStream) {
                contentBytes = contentStream.getContents();
                console.log(`   Page ${pageIndex + 1}: Single content stream, length: ${contentBytes?.length || 0}`);
            }
        }
            
        if (!contentBytes || contentBytes.length === 0) {
            console.log(`   Page ${pageIndex + 1}: No content bytes - considering blank`);
            return false;
        }
        
        // Convert content to string and look for text operators
        const contentString = new TextDecoder('latin1').decode(contentBytes);
        
        // Look for common text-drawing operators in PDF content streams
        const textOperators = [
            'Tj',    // Show text
            'TJ',    // Show text with individual glyph positioning  
            "'",     // Move to next line and show text
            '"',     // Set word and character spacing, move to next line and show text
            'Td',    // Move text position
            'TD',    // Move text position and set leading
            'Tm',    // Set text matrix
            'BT',    // Begin text
            'ET',    // End text
            'Tf',    // Set font
        ];
        
        const hasTextOperators = textOperators.some(op => 
            contentString.includes(op)
        );
        
        // Enhanced text content detection for all templates
        const hasTextContent = /\([^)]+\)|<[^>]+>/.test(contentString);
        
        // Look for template-specific content patterns
        const templatePatterns = {
            traditional: [/traditional/i, /classic/i, /formal/i, /standard/i],
            modern: [/modern/i, /contemporary/i, /sleek/i, /minimalist/i],
            horizon: [/horizon/i, /landscape/i, /wide/i, /panoramic/i],
            prime: [/prime/i, /premium/i, /professional/i, /executive/i],
            vertex: [/vertex/i, /angular/i, /geometric/i, /sharp/i],
            lumen: [/lumen/i, /light/i, /bright/i, /luminous/i],
            clarity: [/clarity/i, /clear/i, /transparent/i, /clean/i],
            exclusive: [/exclusive/i, /luxury/i, /elite/i, /sophisticated/i],
            aurora: [/aurora/i, /colorful/i, /vibrant/i, /dynamic/i],
            essence: [/essence/i, /core/i, /fundamental/i, /essential/i],
            basic: [/basic/i, /simple/i, /plain/i, /straightforward/i]
        };
        
        const currentTemplatePatterns = templatePatterns[templateId as keyof typeof templatePatterns] || templatePatterns.basic;
        const hasTemplateSpecificContent = currentTemplatePatterns.some(pattern => pattern.test(contentString));
        
        // Enhanced template content detection
        const hasTemplateContent = /(?:cv|template|section|header|footer|name|email|phone|address|experience|education|skills|projects)/i.test(contentString) || hasTemplateSpecificContent;
        
        // Look for common PDF text elements (bu operatorlar həmişə var olur, real məzmun deyil)
        const hasPdfText = /(?:q|Q|re|cm|gs|Do|BI|ID|EI|W|w|J|j|M|d|ri|i|gs|g|G|rg|RG|k|K|cs|CS|sc|SC|scn|SCN)/g.test(contentString);
        
        // Additional check for visible content length - daha həssas
        const hasSubstantialContent = contentString.trim().length > 200; // 50-dən 200-ə yüksəltdik
        
        // More aggressive content detection for complex templates
        const hasGraphicsOrImages = /(?:Do|BI|ID|EI|Im|Fm)/g.test(contentString);
        
        // 🔧 ENHANCED BLANK PAGE DETECTION - Real məzmun axtarışı
        const hasRealTextContent = /\([^)]{3,}\)|<[^>]{3,}>/.test(contentString); // Minimum 3 character real text
        const hasVisibleText = /[a-zA-Z0-9]{3,}/.test(contentString); // Minimum 3 alphanumeric characters
        
        // Daha həssas email və telefon detection
        const hasEmailOrPhone = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[\+]?[\d\s\-\(\)]{8,}/.test(contentString); // Real email format və 8+ digit telefon
        
        // Real content indicators - email/phone daha sıkı şərtlər
        const realContentIndicators = hasRealTextContent || hasVisibleText || hasEmailOrPhone || hasTemplateContent || hasGraphicsOrImages;
        
        // PDF structure olmadan real məzmun olmalıdır - VƏ ŞƏRTİ daha sıkı
        const hasContent = realContentIndicators && hasTextOperators && hasSubstantialContent;
        
        console.log(`   Page ${pageIndex + 1} [${templateId}]: Text ops: ${hasTextOperators}, Real text: ${hasRealTextContent}, Visible: ${hasVisibleText}, Email/Phone: ${hasEmailOrPhone}, Template: ${hasTemplateContent}, Graphics: ${hasGraphicsOrImages}, Substantial: ${hasSubstantialContent} → ${hasContent ? 'HAS CONTENT' : 'BLANK'}`);
        
        // Debug: Show content string length and sample for analysis
        console.log(`   Page ${pageIndex + 1} ANALYSIS:`);
        console.log(`   - Content length: ${contentString.length}`);
        console.log(`   - Text operators: ${hasTextOperators}`);
        console.log(`   - Real text content: ${hasRealTextContent}`);
        console.log(`   - Visible text: ${hasVisibleText}`);
        console.log(`   - Email/Phone (strict): ${hasEmailOrPhone}`);
        console.log(`   - Template content: ${hasTemplateContent}`);
        console.log(`   - Substantial content (>200 chars): ${hasSubstantialContent}`);
        console.log(`   - Graphics: ${hasGraphicsOrImages}`);
        
        if (!hasContent) {
            console.log(`   Page ${pageIndex + 1} BLANK PAGE DETECTED - REMOVING`);
            console.log(`   - Content sample (first 200 chars): "${contentString.substring(0, 200)}"`);
        } else {
            console.log(`   Page ${pageIndex + 1} HAS CONTENT - keeping page`);
        }
        return hasContent;
        
    } catch (error) {
        console.error(`❌ Error checking page ${pageIndex + 1} content:`, error);
        // If we can't analyze the page, assume it has content (safer approach)
        console.log(`   Page ${pageIndex + 1}: Analysis failed - assuming has content`);
        return true;
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
                margin: ${templateId === 'basic' ? '5mm 5mm 5mm 5mm' : '15mm 12mm'} !important; /* Basic template: çox azalmış margin-lar */
                padding: 0 !important;
                border: none !important;
                background: white !important; /* Ağ arxa plan */
            }
            
            /* Azərbaycan hərfləri üçün PRIORITY font desteği */
            body, * {
                font-family: 'Noto Sans Azerbaijani', 'Noto Sans Display', 'Noto Sans', 'Inter', 'Roboto', 'Open Sans', 'Source Sans Pro', 
                            'Segoe UI', 'Arial Unicode MS', 'Arial', 'Helvetica', 'DejaVu Sans', 
                            'Liberation Sans', sans-serif !important;
                text-rendering: optimizeLegibility !important;
                -webkit-font-feature-settings: "kern" 1, "liga" 1, "calt" 1 !important;
                font-feature-settings: "kern" 1, "liga" 1, "calt" 1 !important;
                -webkit-text-size-adjust: 100% !important;
                font-variant-ligatures: common-ligatures !important;
                unicode-bidi: normal !important;
                direction: ltr !important;
            }
            
            /* Unicode və Azərbaycan xarakterləri üçün xüsusi support */
            .cv-content {
                font-synthesis: weight style !important;
                font-display: swap !important;
                unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, 
                               U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, 
                               U+2212, U+2215, U+FEFF, U+FFFD, U+018F, U+0259, U+011E, U+011F, 
                               U+0130, U+0131, U+015E, U+015F, U+00C7, U+00E7 !important;
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
            
            /* BASIC TEMPLATE SPECIFIC OPTIMIZATIONS FOR REDUCED MARGINS */
            ${templateId === 'basic' ? `
            /* Basic template body içərik üçün minimal padding - margin çox kiçik olduğuna görə */
            body {
                padding: 0 10px !important; /* Sol və sağ 10px padding content üçün */
                margin: 0 !important;
            }
            
            .basic-template,
            .cv-preview {
                /* Use maximum available width with reduced margins */
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important; /* Body padding kifayət edir */
                box-sizing: border-box !important;
            }
            
            /* Optimize content spacing for reduced margins */
            .basic-template .cv-section,
            .cv-preview .cv-section {
                margin-bottom: calc(var(--cv-spacing-lg) * 0.8) !important; /* Daha az section spacing */
            }
            
            /* Optimize header spacing for better layout with reduced margins */
            .basic-template h1,
            .basic-template h2,
            .basic-template h3 {
                margin-bottom: calc(var(--cv-spacing-sm) * 0.8) !important;
            }
            ` : ''}
            
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