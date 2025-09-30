import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getBestApiKey, recordApiUsage, markApiKeyFailed } from '@/lib/api-service';
import { GeminiV1Client } from '@/lib/gemini-v1-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Job Match Analysis API çağırıldı');

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
    const { cvId, jobTitle, jobDescription, language = 'az' } = body;

    if (!cvId || !jobTitle || !jobDescription) {
      return NextResponse.json(
        { error: 'CV ID, iş başlığı və iş təsviri tələb olunur' },
        { status: 400 }
      );
    }

    console.log('📋 Job Match analizi:', { cvId, jobTitle, userId: decoded.userId });

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
      jobTitleLength: jobTitle.length,
      jobDescLength: jobDescription.length,
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

    // Log first 500 characters of CV text for debugging
    console.log('📄 CV mətn nümunəsi (ilk 500 simvol):', cvText.substring(0, 500));

    // Generate AI analysis with language support
    const analysis = await generateJobMatchAnalysis(cvText, jobTitle, jobDescription, language);

    console.log('✅ Job Match analizi tamamlandı:', {
      overallScore: analysis.overallScore,
      matchingPoints: analysis.matchingPoints.length,
      improvementAreas: analysis.improvementAreas.length,
      recommendations: analysis.recommendations.length
    });

    return NextResponse.json({
      success: true,
      analysis: analysis,
      metadata: {
        cvTitle: cv.title,
        jobTitle: jobTitle,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Job Match Analysis API xətası:', error);

    const errorMessage = error instanceof Error ? error.message : 'Naməlum xəta';
    
    return NextResponse.json(
      { 
        error: 'Job Match analizi xətası',
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

  // Skills - Hard və Soft ayrı-ayrılıqda
  if (cvData.skills && cvData.skills.length > 0) {
    // Hard Skills
    const hardSkills = cvData.skills.filter((skill: any) => 
      skill.type === 'hard' || skill.type === 'technical' || 
      (!skill.type && isHardSkill(skill.name || skill))
    );
    
    // Soft Skills  
    const softSkills = cvData.skills.filter((skill: any) => 
      skill.type === 'soft' || skill.type === 'personal' ||
      (!skill.type && isSoftSkill(skill.name || skill))
    );
    
    // General Skills (type göstərilməmişsə)
    const generalSkills = cvData.skills.filter((skill: any) => 
      !skill.type && !isHardSkill(skill.name || skill) && !isSoftSkill(skill.name || skill)
    );

    if (hardSkills.length > 0) {
      sections.push('\\n--- HARD SKILLS (TEXNİKİ BACARIQLAR) ---');
      const hardSkillsText = hardSkills.map((skill: any) => {
        const name = skill.name || skill;
        const level = skill.level ? ` (${skill.level})` : '';
        return `${name}${level}`;
      }).filter(Boolean);
      sections.push(hardSkillsText.join(', '));
    }

    if (softSkills.length > 0) {
      sections.push('\\n--- SOFT SKILLS (ŞƏXSİ BACARIQLAR) ---');
      const softSkillsText = softSkills.map((skill: any) => {
        const name = skill.name || skill;
        const level = skill.level ? ` (${skill.level})` : '';
        return `${name}${level}`;
      }).filter(Boolean);
      sections.push(softSkillsText.join(', '));
    }

    if (generalSkills.length > 0) {
      sections.push('\\n--- DİGƏR BACARIQLAR ---');
      const generalSkillsText = generalSkills.map((skill: any) => {
        const name = skill.name || skill;
        const level = skill.level ? ` (${skill.level})` : '';
        return `${name}${level}`;
      }).filter(Boolean);
      sections.push(generalSkillsText.join(', '));
    }
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

  // Honors
  if (cvData.honors && cvData.honors.length > 0) {
    sections.push('\\n--- FƏXRI ADLAR ---');
    cvData.honors.forEach((honor: any, index: number) => {
      sections.push(`${index + 1}. ${honor.title || honor.name || 'Fəxri ad bilinmir'}`);
      sections.push(`   Verən: ${honor.issuer || honor.organization || 'Verən təşkilat bilinmir'}`);
      sections.push(`   Tarix: ${honor.date || ''}`);
      sections.push(`   Təsvir: ${honor.description || ''}`);
    });
  }

  // Volunteer Experience
  if (cvData.volunteerExperience && cvData.volunteerExperience.length > 0) {
    sections.push('\\n--- KÖNÜLLÜ TƏCRÜBƏSİ ---');
    cvData.volunteerExperience.forEach((vol: any, index: number) => {
      sections.push(`${index + 1}. ${vol.role || vol.position || 'Rol bilinmir'} - ${vol.organization || 'Təşkilat bilinmir'}`);
      sections.push(`   Sahə: ${vol.cause || vol.area || vol.field || ''}`);
      sections.push(`   Müddət: ${vol.startDate || ''} - ${vol.endDate || (vol.current ? 'İndi' : '')}`);
      sections.push(`   Təsvir: ${vol.description || 'Təsvir yoxdur'}`);
      sections.push(`   Müddət: ${vol.duration || ''}`);
    });
  }

  // Additional fields (custom sections)
  if (cvData.customSections && cvData.customSections.length > 0) {
    sections.push('\\n--- ƏLAVƏ BÖLMƏLƏR ---');
    cvData.customSections.forEach((section: any, index: number) => {
      sections.push(`${index + 1}. ${section.title || 'Başlıq bilinmir'}`);
      sections.push(`   Məzmun: ${section.content || 'Məzmun yoxdur'}`);
    });
  }

  return sections.join('\\n');
}

// Helper function to identify hard skills
function isHardSkill(skillName: string): boolean {
  const hardSkillKeywords = [
    // Programming languages
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    // Frameworks & Libraries
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
    // Databases
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite',
    // Tools & Technologies
    'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'linux', 'windows',
    // Design & Software
    'photoshop', 'illustrator', 'figma', 'sketch', 'autocad', 'solidworks',
    // Data & Analytics
    'excel', 'tableau', 'power bi', 'matlab', 'r', 'spss', 'sas',
    // Marketing & Digital
    'google analytics', 'seo', 'sem', 'adwords', 'facebook ads', 'mailchimp',
    // Other technical
    'html', 'css', 'typescript', 'api', 'rest', 'graphql', 'microservices'
  ];
  
  const skillLower = skillName.toLowerCase();
  return hardSkillKeywords.some(keyword => skillLower.includes(keyword));
}

// Helper function to identify soft skills
function isSoftSkill(skillName: string): boolean {
  const softSkillKeywords = [
    // Communication
    'kommunikasiya', 'communication', 'презентация', 'presentation', 'təqdimat',
    // Leadership
    'liderlik', 'leadership', 'лидерство', 'management', 'idarəetmə', 'управление',
    // Teamwork
    'komanda', 'team', 'команда', 'collaboration', 'əməkdaşlıq', 'сотрудничество',
    // Problem solving
    'problem', 'həll', 'решение', 'analysis', 'analiz', 'анализ',
    // Time management
    'vaxt', 'time', 'время', 'planlaşdırma', 'planning', 'планирование',
    // Creativity
    'yaradıcılıq', 'creativity', 'креативность', 'innovation', 'innovasiya',
    // Adaptability
    'adaptasiya', 'flexibility', 'гибкость', 'çeviklik',
    // Critical thinking
    'tənqidi', 'critical', 'критическое', 'düşüncə', 'thinking'
  ];
  
  const skillLower = skillName.toLowerCase();
  return softSkillKeywords.some(keyword => skillLower.includes(keyword));
}

// Generate AI-powered job match analysis with language support
async function generateJobMatchAnalysis(cvText: string, jobTitle: string, jobDescription: string, language: string = 'az') {
  try {
    console.log('🤖 AI Job Match analizi başlayır...');

    // Language-specific prompts
    const prompts = {
      az: `
Sən peşəkar karyera məsləhətçisisən. 
Sənin vəzifən verilmiş CV məlumatlarını və iş elanını analiz edərək:
1. Namizədin iş elanına uyğunluq dərəcəsini qiymətləndirmək (0%-100%). 
2. Əsas uyğunluq məqamlarını (skill, təcrübə, təhsil və s.) qısa maddələrlə göstərmək. 
3. Uyğun olmayan və ya inkişaf etdirilməli sahələri qeyd etmək. 
4. CV-ni həmin vakansiyaya daha uyğunlaşdırmaq üçün konkret tövsiyələr vermək.

---
### İş Elanı:
**Başlıq:** ${jobTitle}

**Təsvir:**
${jobDescription}

### Namizədin CV məlumatları:
${cvText}

---

ANALIZ QAYDASI:
1. İş elanındakı tələbləri (skills, təcrübə, təhsil, sertifikatlar) detallı analiz et
2. CV-dəki BÜTÜN bölmələri həmin tələblərlə müqayisə et:
   - Şəxsi məlumatlar və xülasə
   - İş təcrübəsi (vəzifələr, şirkətlər, təsvirlər)
   - Təhsil (dərəcə, sahə, müəssisə)
   - Bacarıqlar (hard skills, soft skills, səviyyələr)
   - Dillər və səviyyələri
   - Sertifikatlar və kurslar
   - Layihələr və portfel
   - Mükafat və fəxri adlar
   - Könüllü təcrübə
   - Əlavə fəaliyyətlər
3. Uyğunluq faizini hesabla: 
   - Skills uyğunluğu (35%)
   - Təcrübə uyğunluğu (30%) 
   - Təhsil uyğunluğu (15%)
   - Sertifikatlar və kurslar (10%)
   - Digər faktorlar (layihələr, dillər, mükafatlar) (10%)
4. Real və konkret nəticələr ver, CV-dəki konkret məlumatları istinad et

TƏLƏBLƏR:
- CV-dəki BÜTÜN məlumatları diqqətlə oxu və analiz et
- Uyğunluq faizi real və dəqiq olsun
- Hər bölmə üçün 4-6 konkret nöqtə ver
- CV-dəki konkret bacarıq, təcrübə və layihələri qeyd et
- Tövsiyələr praktik və həyata keçirilə bilən olsun
- Azərbaycan dilində cavab ver

MÜHİM: Yalnız JSON formatında cavab ver, heç bir əlavə mətn yazmadan:

{
  "overallScore": 75,
  "matchingPoints": [
    "JavaScript proqramlaşdırma bacarığı var",
    "3 il təcrübə tələbinə uyğundur",
    "..."
  ],
  "improvementAreas": [
    "React framework bilgisi kifayət etmir",
    "UI/UX dizayn təcrübəsi yoxdur",
    "..."
  ],
  "recommendations": [
    "React və Next.js öyrənin və layihələr yaradın",
    "Portfolio websayti yaradın",
    "..."
  ]
}
`,
      en: `
You are a professional career advisor.
Your task is to analyze the given CV and job posting data to:
1. Evaluate the candidate's compatibility with the job posting (0%-100%).
2. Show main matching points (skills, experience, education, etc.) in bullet points.
3. Identify areas that don't match or need development.
4. Provide specific recommendations to better align the CV with this vacancy.

---
### Job Posting:
**Title:** ${jobTitle}

**Description:**
${jobDescription}

### Candidate's CV Information:
${cvText}

---

ANALYSIS METHODOLOGY:
1. Analyze job posting requirements (skills, experience, education, certifications) in detail
2. Compare ALL CV sections with those requirements:
   - Personal information and summary
   - Work experience (positions, companies, descriptions)
   - Education (degree, field, institution)
   - Skills (hard skills, soft skills, levels)
   - Languages and proficiency levels
   - Certifications and courses
   - Projects and portfolio
   - Awards and honors
   - Volunteer experience
   - Additional activities
3. Calculate compatibility percentage:
   - Skills compatibility (35%)
   - Experience compatibility (30%)
   - Education compatibility (15%)
   - Certifications and courses (10%)
   - Other factors (projects, languages, awards) (10%)
4. Provide real and concrete results, reference specific CV information

REQUIREMENTS:
- Carefully read and analyze ALL CV information
- Compatibility percentage should be real and accurate
- Provide 4-6 specific points for each section
- Reference specific skills, experience, and projects from CV
- Recommendations should be practical and achievable
- Respond in English

IMPORTANT: Respond only in JSON format, without any additional text:

{
  "overallScore": 75,
  "matchingPoints": [
    "Has JavaScript programming skills",
    "Meets 3 years experience requirement",
    "..."
  ],
  "improvementAreas": [
    "React framework knowledge insufficient",
    "No UI/UX design experience",
    "..."
  ],
  "recommendations": [
    "Learn React and Next.js and create projects",
    "Create a portfolio website",
    "..."
  ]
}
`,
      ru: `
Вы профессиональный карьерный консультант.
Ваша задача - проанализировать предоставленные данные резюме и вакансии для:
1. Оценки совместимости кандидата с вакансией (0%-100%).
2. Отображения основных совпадений (навыки, опыт, образование и т.д.) в виде пунктов.
3. Выявления несоответствующих или требующих развития областей.
4. Предоставления конкретных рекомендаций для лучшего соответствия резюме данной вакансии.

---
### Вакансия:
**Название:** ${jobTitle}

**Описание:**
${jobDescription}

### Информация из резюме кандидата:
${cvText}

---

МЕТОДОЛОГИЯ АНАЛИЗА:
1. Детально проанализируйте требования вакансии (навыки, опыт, образование, сертификаты)
2. Сравните ВСЕ разделы резюме с этими требованиями:
   - Личная информация и резюме
   - Опыт работы (должности, компании, описания)
   - Образование (степень, область, учреждение)
   - Навыки (технические навыки, личные навыки, уровни)
   - Языки и уровни владения
   - Сертификаты и курсы
   - Проекты и портфолио
   - Награды и почести
   - Волонтерский опыт
   - Дополнительная деятельность
3. Рассчитайте процент совместимости:
   - Совместимость навыков (35%)
   - Совместимость опыта (30%)
   - Совместимость образования (15%)
   - Сертификаты и курсы (10%)
   - Другие факторы (проекты, языки, награды) (10%)
4. Предоставьте реальные и конкретные результаты, ссылайтесь на конкретную информацию из резюме

ТРЕБОВАНИЯ:
- Внимательно прочитайте и проанализируйте ВСЮ информацию из резюме
- Процент совместимости должен быть реальным и точным
- Предоставьте 4-6 конкретных пунктов для каждого раздела
- Ссылайтесь на конкретные навыки, опыт и проекты из резюме
- Рекомендации должны быть практичными и достижимыми
- Отвечайте на русском языке

ВАЖНО: Отвечайте только в формате JSON, без дополнительного текста:

{
  "overallScore": 75,
  "matchingPoints": [
    "Имеет навыки программирования JavaScript",
    "Соответствует требованию 3 года опыта",
    "..."
  ],
  "improvementAreas": [
    "Недостаточные знания React framework",
    "Нет опыта UI/UX дизайна",
    "..."
  ],
  "recommendations": [
    "Изучить React и Next.js и создать проекты",
    "Создать портфолио-сайт",
    "..."
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
      console.log('🔄 Job Match AI analizi Gemini 2.5 Flash ilə...');
      
      // Use Gemini 2.5 Flash model for analysis
      const geminiV1 = new GeminiV1Client(apiKey);
      aiResponse = await geminiV1.generateContent('gemini-2.5-flash', prompt);
      
      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'Job Match analysis generated (gemini-2.5-flash)');
      }
      
      console.log('✅ Job Match AI analizi uğurla tamamlandı');
    } catch (error: any) {
      console.log(`❌ Gemini 2.5 Flash failed:`, error.message);
      
      // Fallback to Gemini 2.0 Flash
      try {
        console.log('🔄 Fallback: Gemini 2.0 Flash ilə...');
        const geminiV1Fallback = new GeminiV1Client(apiKey);
        aiResponse = await geminiV1Fallback.generateContent('gemini-2.0-flash', prompt);
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'Job Match analysis generated (gemini-2.0-flash fallback)');
        }
        
        console.log('✅ Job Match AI analizi fallback ilə tamamlandı');
      } catch (fallbackError: any) {
        console.log(`❌ Bütün Gemini modellər uğursuz:`, fallbackError.message);
        
        // Record API failure
        if (apiKeyId) {
          await markApiKeyFailed(apiKeyId, fallbackError.message);
        }
        
        throw fallbackError;
      }
    }

    try {
      console.log('🔍 Job Match AI Response:', aiResponse);

      // Try multiple JSON extraction methods
      let jsonString = '';
      
      // Method 1: Find JSON between curly braces (more flexible)
      const jsonMatch1 = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch1) {
        jsonString = jsonMatch1[0];
      } else {
        // Method 2: Look for JSON between ```json blocks
        const jsonMatch2 = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch2) {
          jsonString = jsonMatch2[1];
        } else {
          // Method 3: Look for JSON between ``` blocks (without json specifier)
          const jsonMatch3 = aiResponse.match(/```\s*([\s\S]*?)\s*```/);
          if (jsonMatch3) {
            jsonString = jsonMatch3[1].trim();
            // Check if it starts with { and ends with }
            if (jsonString.startsWith('{') && jsonString.endsWith('}')) {
              // Good JSON candidate
            } else {
              jsonString = '';
            }
          }
        }
      }
      
      if (!jsonString) {
        console.log('❌ AI response-da JSON tapılmadı. Response:', aiResponse.substring(0, 500));
        throw new Error('AI response-da JSON tapılmadı');
      }

      console.log('🔍 Extracted JSON:', jsonString.substring(0, 200) + '...');
      
      let analysis;
      try {
        analysis = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.log('❌ JSON parse xətası:', parseError.message);
        console.log('🔍 Parse ediləcək JSON:', jsonString);
        throw new Error('JSON parse edilə bilmədi');
      }
      
      // Validate structure
      if (!analysis.overallScore || !analysis.matchingPoints || !analysis.improvementAreas || !analysis.recommendations) {
        throw new Error('AI response formatı düzgün deyil');
      }
      
      // Ensure score is between 0-100
      analysis.overallScore = Math.max(0, Math.min(100, analysis.overallScore));
      
      console.log(`✅ Job Match analizi parse edildi - Score: ${analysis.overallScore}%`);

      return analysis;
      
    } catch (error: any) {
      console.error('❌ Job Match AI response parse xətası:', error.message);
      
      // Return fallback analysis
      console.log('🔄 Fallback analizi yaradılır...');
      return generateFallbackAnalysis(cvText, jobTitle, jobDescription);
    }

  } catch (error) {
    console.error('❌ Job Match AI analizi ümumi xətası:', error);
    return generateFallbackAnalysis(cvText, jobTitle, jobDescription);
  }
}

// Generate fallback analysis when AI fails
function generateFallbackAnalysis(cvText: string, jobTitle: string, jobDescription: string) {
  console.log('🔄 Fallback Job Match analizi yaradılır...');
  
  const cvLower = cvText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  
  // Basic skill matching
  const commonSkills = ['javascript', 'python', 'react', 'node', 'html', 'css', 'sql', 'git'];
  const matchedSkills = commonSkills.filter(skill => 
    cvLower.includes(skill) && jobLower.includes(skill)
  );
  
  // Calculate basic score
  let score = 50; // Base score
  score += matchedSkills.length * 10; // +10 for each matching skill
  
  if (cvLower.includes('təcrübə') || cvLower.includes('experience')) score += 10;
  if (cvLower.includes('universitet') || cvLower.includes('university')) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    overallScore: score,
    matchingPoints: [
      'Profildə uyğun bacarıqlar mövcuddur',
      'İş təcrübəsi qeyd edilmişdir',
      'Təhsil məlumatları düzgündür'
    ],
    improvementAreas: [
      'Daha spesifik texniki bacarıqlar əlavə edin',
      'İş təcrübəsi təsvirlərini genişləndirin',
      'Sertifikat və kurslar əlavə edin'
    ],
    recommendations: [
      'CV-də iş elanına uyğun açar sözlər istifadə edin',
      'Layihə portfelinizi əlavə edin',
      'Peşəkar şəbəkəni genişləndirin'
    ]
  };
}