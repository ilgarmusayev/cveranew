import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';
import { GeminiV1Client } from '@/lib/gemini-v1-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 CV Checker API çağırıldı');

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { cvId, language = 'az' } = body;

    if (!cvId) {
      return NextResponse.json(
        { error: 'CV ID tələb olunur' },
        { status: 400 }
      );
    }

    console.log('📋 CV Checker analizi:', { cvId, userId: decoded.userId, language });

    // Get CV data from database
    const cv = await prisma.cV.findFirst({
      where: {
        id: cvId,
        userId: decoded.userId
      }
    });

    if (!cv) {
      return NextResponse.json(
        { error: 'CV tapılmadı və ya sizə aid deyil' },
        { status: 404 }
      );
    }

    const cvData = cv.cv_data as any;

    // Extract CV text for analysis
    const cvText = extractCVText(cvData);

    console.log('🔍 CV məlumatları çıxarıldı:', { 
      cvTitle: cv.title,
      textLength: cvText.length,
      cvDataStructure: {
        hasPersonalInfo: !!cvData.personalInfo,
        experienceCount: cvData.experience?.length || 0,
        educationCount: cvData.education?.length || 0,
        skillsCount: cvData.skills?.length || 0,
        languagesCount: cvData.languages?.length || 0,
        certificationsCount: cvData.certifications?.length || 0,
        projectsCount: cvData.projects?.length || 0,
        awardsCount: cvData.awards?.length || 0,
        honorsCount: cvData.honors?.length || 0,
        volunteerCount: cvData.volunteerExperience?.length || 0
      }
    });

    // Generate AI analysis
    const analysis = await generateCVCheckAnalysis(cvText, language);

    console.log('✅ CV Checker analizi tamamlandı:', {
      overallScore: analysis.overallScore,
      strongPoints: analysis.strongPoints.length,
      missingElements: analysis.missingElements.length,
      improvements: analysis.improvements.length,
      professionalTips: analysis.professionalTips.length
    });

    return NextResponse.json({
      success: true,
      analysis: analysis,
      metadata: {
        cvTitle: cv.title,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ CV Checker API xətası:', error);

    const errorMessage = error instanceof Error ? error.message : 'Naməlum xəta';
    
    return NextResponse.json(
      { 
        error: 'CV yoxlanılarkən xəta baş verdi',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Extract readable text from CV data
function extractCVText(cvData: any): string {
  const sections = [];

  // Personal Info
  if (cvData.personalInfo) {
    const personal = cvData.personalInfo;
    sections.push(`--- ŞƏXSİ MƏLUMATLAR ---`);
    sections.push(`Ad: ${personal.fullName || ''}`);
    sections.push(`Başlıq/Vəzifə: ${personal.title || personal.field || ''}`);
    sections.push(`Email: ${personal.email || ''}`);
    sections.push(`Telefon: ${personal.phone || ''}`);
    sections.push(`Yer: ${personal.location || ''}`);
    sections.push(`LinkedIn: ${personal.linkedin || ''}`);
    sections.push(`Website: ${personal.website || ''}`);
    sections.push(`Xülasə: ${personal.summary || ''}`);
  }

  // Experience
  if (cvData.experience && cvData.experience.length > 0) {
    sections.push('\\n--- İŞ TƏCRÜBƏSİ ---');
    cvData.experience.forEach((exp: any, index: number) => {
      sections.push(`${index + 1}. ${exp.position || 'Vəzifə bilinmir'} - ${exp.company || 'Şirkət bilinmir'}`);
      sections.push(`   Müddət: ${exp.startDate || ''} - ${exp.endDate || (exp.current ? 'İndi' : '')}`);
      sections.push(`   Yer: ${exp.location || ''}`);
      sections.push(`   Təsvir: ${exp.description || 'Təsvir yoxdur'}`);
    });
  }

  // Education
  if (cvData.education && cvData.education.length > 0) {
    sections.push('\\n--- TƏHSİL ---');
    cvData.education.forEach((edu: any, index: number) => {
      sections.push(`${index + 1}. ${edu.degree || 'Dərəcə bilinmir'} - ${edu.institution || 'Müəssisə bilinmir'}`);
      sections.push(`   Sahə: ${edu.fieldOfStudy || edu.field || 'Sahə bilinmir'}`);
      sections.push(`   Müddət: ${edu.startDate || ''} - ${edu.endDate || ''}`);
      sections.push(`   Təsvir: ${edu.description || ''}`);
    });
  }

  // Skills
  if (cvData.skills && cvData.skills.length > 0) {
    sections.push('\\n--- BACARIQLAR ---');
    const skillsText = cvData.skills.map((skill: any) => {
      const name = skill.name || skill;
      const level = skill.level ? ` (${skill.level})` : '';
      return `${name}${level}`;
    }).filter(Boolean);
    sections.push(skillsText.join(', '));
  }

  // Languages
  if (cvData.languages && cvData.languages.length > 0) {
    sections.push('\\n--- DİLLƏR ---');
    const languages = cvData.languages.map((lang: any) => 
      `${lang.language || lang} (${lang.level || 'Səviyyə bilinmir'})`
    );
    sections.push(languages.join(', '));
  }

  // Certifications
  if (cvData.certifications && cvData.certifications.length > 0) {
    sections.push('\\n--- SERTİFİKATLAR ---');
    cvData.certifications.forEach((cert: any, index: number) => {
      sections.push(`${index + 1}. ${cert.name || 'Sertifikat adı bilinmir'} - ${cert.issuer || 'Verən təşkilat bilinmir'}`);
      sections.push(`   Tarix: ${cert.issueDate || ''}`);
      sections.push(`   Kredensial ID: ${cert.credentialId || ''}`);
      sections.push(`   URL: ${cert.url || ''}`);
    });
  }

  // Projects
  if (cvData.projects && cvData.projects.length > 0) {
    sections.push('\\n--- LAYİHƏLƏR ---');
    cvData.projects.forEach((proj: any, index: number) => {
      sections.push(`${index + 1}. ${proj.name || 'Layihə adı bilinmir'}`);
      sections.push(`   Təsvir: ${proj.description || 'Təsvir yoxdur'}`);
      sections.push(`   Texnologiyalar: ${Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || ''}`);
      sections.push(`   URL: ${proj.url || ''}`);
      sections.push(`   Müddət: ${proj.startDate || ''} - ${proj.endDate || (proj.current ? 'İndi' : '')}`);
    });
  }

  // Awards
  if (cvData.awards && cvData.awards.length > 0) {
    sections.push('\\n--- MÜKAFATLAR ---');
    cvData.awards.forEach((award: any, index: number) => {
      sections.push(`${index + 1}. ${award.title || award.name || 'Mükafat adı bilinmir'}`);
      sections.push(`   Verən: ${award.issuer || award.organization || 'Verən təşkilat bilinmir'}`);
      sections.push(`   Tarix: ${award.date || ''}`);
      sections.push(`   Təsvir: ${award.description || ''}`);
    });
  }

  return sections.join('\\n');
}

// Generate AI-powered CV check analysis with language support
async function generateCVCheckAnalysis(cvText: string, language: string = 'az') {
  try {
    console.log('🤖 AI CV Checker analizi başlayır...');

    // Language-specific prompts
    const prompts = {
      az: `
Sən peşəkar İnsan Resursları mütəxəssisi və karyera məsləhətçisisən.
Sənin vəzifən verilmiş CV məlumatlarını detallı analiz edərək:
1. CV-nin ümumi peşəkarlıq səviyyəsini qiymətləndirmək (0-100 bal)
2. CV-nin güçlü tərəflərini müəyyən etmək
3. Çatışmayan və ya eksik elementləri göstərmək
4. İnkişaf edilməli sahələri qeyd etmək
5. Peşəkar məsləhətlər vermək

---
### Analiz ediləcək CV:
${cvText}

---

ANALIZ QAYDASI:
1. Aşağıdaki meyarlar üzrə qiymətləndirmə apar:
   - Şəxsi məlumatların tamlığı və düzgünlüğü (10%)
   - İş təcrübəsinin keyfiyyəti və relevantlığı (25%)
   - Təhsil məlumatlarının düzgünlüğü (15%)
   - Bacarıqların müasirliği və relevantlığı (20%)
   - CV-nin ümumi strukturu və formatı (10%)
   - Əlavə dəyər yaradan elementlər (sertifikatlar, layihələr, mükafatlar) (10%)
   - Dil bacarıqları və beynəlxalq kommunikasiya (10%)

2. Peşəkar standartlara uyğunluğu yoxla:
   - Kontakt məlumatlarının tamlığı
   - Professional xülaşə/summary mövcudluğu
   - İş təcrübəsində nailiyyətlərin ölçülə bilən nəticələrlə göstərilməsi
   - Bacarıqların müasir bazara uyğunluğu
   - CV-nin oxunaqlılığı və strukturu

3. Çatışmayan elementləri müəyyən et:
   - Professional summary/xülasə
   - Ölçülə bilən nailiyyətlər
   - Müasir texniki bacarıqlar
   - Sosial mediaya linkllər (LinkedIn)
   - Portfolio/layihə linkləri
   - Sertifikatlar və kurslar
   - Könüllü fəaliyyətlər

TƏLƏBLƏR:
- CV-dəki BÜTÜN məlumatları diqqətlə analiz et
- Bal real və ədalətli olsun
- Hər kateqoriyada 3-5 konkret nöqtə ver
- Məsləhətlər praktik və həyata keçirilə bilən olsun
- Azərbaycan dilində cavab ver

MÜHİM: Yalnız JSON formatında cavab ver, heç bir əlavə mətn yazmadan:

{
  "overallScore": 75,
  "strongPoints": [
    "Güçlü texniki bacarıqlar var",
    "Müxtəlif sahələrdə təcrübə",
    "Dil bilgisi yaxşıdır"
  ],
  "missingElements": [
    "Professional xülasə yoxdur",
    "LinkedIn profili qeyd edilməyib",
    "Portfolio linkləri yoxdur"
  ],
  "improvements": [
    "İş təcrübəsində nailiyyətləri rəqəmlərlə göstərin",
    "Müasir texniki bacarıqlar əlavə edin",
    "CV strukturunu təkmilləşdirin"
  ],
  "professionalTips": [
    "Hər iş təcrübəsində minimum 2-3 ölçülə bilən nailiyyət qeyd edin",
    "GitHub və ya portfolio websayti linkləri əlavə edin",
    "ATS-friendly format istifadə edin"
  ]
}
`,
      en: `
You are a professional Human Resources specialist and career advisor.
Your task is to analyze the given CV data in detail:
1. Evaluate the overall professionalism level of the CV (0-100 points)
2. Identify the strong points of the CV
3. Show missing or incomplete elements
4. Note areas that need improvement
5. Provide professional advice

---
### CV to Analyze:
${cvText}

---

ANALYSIS METHODOLOGY:
1. Evaluate based on the following criteria:
   - Completeness and accuracy of personal information (10%)
   - Quality and relevance of work experience (25%)
   - Accuracy of education information (15%)
   - Modernity and relevance of skills (20%)
   - Overall structure and format of CV (10%)
   - Value-adding elements (certifications, projects, awards) (10%)
   - Language skills and international communication (10%)

2. Check compliance with professional standards:
   - Completeness of contact information
   - Presence of professional summary
   - Showing achievements in work experience with measurable results
   - Alignment of skills with modern market
   - Readability and structure of CV

3. Identify missing elements:
   - Professional summary
   - Measurable achievements
   - Modern technical skills
   - Social media links (LinkedIn)
   - Portfolio/project links
   - Certifications and courses
   - Volunteer activities

REQUIREMENTS:
- Carefully analyze ALL information in the CV
- Score should be real and fair
- Provide 3-5 specific points in each category
- Advice should be practical and achievable
- Respond in English

IMPORTANT: Respond only in JSON format, without any additional text:

{
  "overallScore": 75,
  "strongPoints": [
    "Strong technical skills present",
    "Experience in various fields",
    "Good language knowledge"
  ],
  "missingElements": [
    "No professional summary",
    "LinkedIn profile not mentioned",
    "No portfolio links"
  ],
  "improvements": [
    "Show achievements in work experience with numbers",
    "Add modern technical skills",
    "Improve CV structure"
  ],
  "professionalTips": [
    "Include minimum 2-3 measurable achievements for each work experience",
    "Add GitHub or portfolio website links",
    "Use ATS-friendly format"
  ]
}
`,
      ru: `
Вы профессиональный HR-специалист и карьерный консультант.
Ваша задача - детально проанализировать предоставленные данные резюме:
1. Оценить общий уровень профессионализма резюме (0-100 баллов)
2. Определить сильные стороны резюме
3. Показать отсутствующие или неполные элементы
4. Отметить области, требующие улучшения
5. Предоставить профессиональные советы

---
### Резюме для анализа:
${cvText}

---

МЕТОДОЛОГИЯ АНАЛИЗА:
1. Оценка по следующим критериям:
   - Полнота и правильность личной информации (10%)
   - Качество и релевантность опыта работы (25%)
   - Правильность информации об образовании (15%)
   - Современность и релевантность навыков (20%)
   - Общая структура и формат резюме (10%)
   - Элементы, добавляющие ценность (сертификаты, проекты, награды) (10%)
   - Языковые навыки и международная коммуникация (10%)

2. Проверка соответствия профессиональным стандартам:
   - Полнота контактной информации
   - Наличие профессионального резюме
   - Показ достижений в опыте работы с измеримыми результатами
   - Соответствие навыков современному рынку
   - Читаемость и структура резюме

3. Определение отсутствующих элементов:
   - Профессиональное резюме
   - Измеримые достижения
   - Современные технические навыки
   - Ссылки на социальные сети (LinkedIn)
   - Ссылки на портфолио/проекты
   - Сертификаты и курсы
   - Волонтерская деятельность

ТРЕБОВАНИЯ:
- Внимательно проанализируйте ВСЮ информацию в резюме
- Оценка должна быть реальной и справедливой
- Предоставьте 3-5 конкретных пунктов в каждой категории
- Советы должны быть практичными и достижимыми
- Отвечайте на русском языке

ВАЖНО: Отвечайте только в формате JSON, без дополнительного текста:

{
  "overallScore": 75,
  "strongPoints": [
    "Присутствуют сильные технические навыки",
    "Опыт в различных областях",
    "Хорошее знание языков"
  ],
  "missingElements": [
    "Нет профессионального резюме",
    "Не указан профиль LinkedIn",
    "Нет ссылок на портфолио"
  ],
  "improvements": [
    "Покажите достижения в опыте работы с цифрами",
    "Добавьте современные технические навыки",
    "Улучшите структуру резюме"
  ],
  "professionalTips": [
    "Включите минимум 2-3 измеримых достижения для каждого опыта работы",
    "Добавьте ссылки на GitHub или портфолио",
    "Используйте ATS-friendly формат"
  ]
}
`
    };

    const prompt = prompts[language as keyof typeof prompts] || prompts.az;

    // Get API key for Gemini
    const apiKeyInfo = await getBestApiKey('gemini');
    const apiKey = apiKeyInfo?.apiKey;
    const apiKeyId = apiKeyInfo?.id;
    
    if (!apiKey) {
      throw new Error('Valid API key tapılmadı');
    }
    
    let aiResponse = '';
    
    try {
      console.log('🔄 CV Checker AI analizi Gemini 2.5 Flash ilə...');
      
      // Use Gemini 2.5 Flash model for analysis
      const geminiV1 = new GeminiV1Client(apiKey);
      aiResponse = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'CV Checker analysis generated (gemini-2.5-flash)');
      }
      
      console.log('✅ CV Checker AI analizi uğurla tamamlandı');
    } catch (error: any) {
      console.log(`❌ Gemini 2.5 Flash failed:`, error.message);
      
      // Fallback to Gemini 2.0 Flash
      try {
        console.log('🔄 Fallback: Gemini 2.0 Flash ilə...');
        const geminiV1Fallback = new GeminiV1Client(apiKey);
        aiResponse = await geminiV1Fallback.generateContent('gemini-2.0-flash', prompt);
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'CV Checker analysis generated (gemini-2.0-flash fallback)');
        }
        
        console.log('✅ CV Checker AI analizi (fallback) uğurla tamamlandı');
      } catch (fallbackError: any) {
        console.log(`❌ Gemini 2.0 Flash fallback failed:`, fallbackError.message);
        
        // Mark API key as failed if multiple attempts failed
        if (apiKeyId) {
          await markApiKeyFailed(apiKeyId, `Gemini API failed: ${fallbackError.message}`);
        }
        
        throw new Error(`Gemini API failed: ${fallbackError.message}`);
      }
    }

    // Clean and parse JSON response
    const cleanResponse = aiResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^\s*[\w\s]*?{/, '{')
      .replace(/}\s*[\w\s]*?$/, '}')
      .trim();

    console.log('🧹 Cleaned AI response:', cleanResponse.substring(0, 200) + '...');

    try {
      const result = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!result.overallScore || !Array.isArray(result.strongPoints) || 
          !Array.isArray(result.missingElements) || !Array.isArray(result.improvements) ||
          !Array.isArray(result.professionalTips)) {
        throw new Error('AI response eksik və ya yanlış struktura sahib');
      }

      return result;
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('🔍 Parse ediləcək JSON:', cleanResponse);
      throw new Error('AI cavabı JSON formatında deyil');
    }

  } catch (error) {
    console.error('❌ CV Checker AI analizi xətası:', error);
    throw error;
  }
}