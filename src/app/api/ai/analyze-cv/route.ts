import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWorkingGeminiApiKey, markApiKeyAsInactive } from '@/lib/geminiApiKeyService';

export async function POST(request: NextRequest) {
    try {
        const { cvText, language = 'az', personalInfo, experience, education, skills, languages, projects } = await request.json();

        if (!cvText) {
            return NextResponse.json(
                { error: 'CV text is required' },
                { status: 400 }
            );
        }

        // Get API key from database
        const apiKey = await getWorkingGeminiApiKey();
        
        if (!apiKey) {
            return NextResponse.json(
                { error: 'No active Gemini API key available' },
                { status: 503 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            },
        });

        const languagePrompts = {
            az: {
                systemPrompt: `Siz senior CV konsultantı və HR ekspertisiniz. 15+ il təcrübəyə malik CV təkmilləşdirmə mütəxəssisisiniz. Məqsədiniz real iş bazarında rəqabətədavamlı, konkret və orijinal CV yaratmaqdır.

KRİTİK QAYDA: CV-də heç vaxt 1-ci şəxs zamirlər (mən, mənim, məni) istifadə etməyin! Həmişə 3-cü şəxs və ya neytral format istifadə edin.`,
                analysisPrompt: `Bu CV-ni təhlil edib peşəkar təkliflər verin. KLİŞE İFADƏLƏRDƏN QAÇIN!

ƏN VACİB: Bütün təkliflər 3-cü şəxs formatında olmalıdır. "Mən etdim" deyil, "Etdi" və ya neytral format.

QADAĞAN EDİLƏN KLİŞE İFADƏLƏR:
❌ "Komanda ilə işləməyi bacaran"
❌ "Məsuliyyətli və etibarlı"
❌ "Stress altında işləməyi bacaran"
❌ "Problem həll etmək bacarığı"
❌ "Dinamik və enerjili"
❌ "Detallara diqqət"
❌ "Müştəri xidmətləri orientasiyalı"
❌ "İnnovativ düşüncə"

YAXŞI TƏKLIF NÜMUNƏLƏRİ:
✅ "React.js və Node.js istifadə edərək 3 müxtəlif e-commerce platforması inkişaf etdirdi"
✅ "200+ müştərili satış portfelini idarə edərək aylıq 45% gəlir artımı təmin etdi"
✅ "SQL və Python istifadə edərək məlumat analizi sistemi yaradaraq şirkətin qərar qəbuletmə prosesini 30% sürətləndirdi"
✅ "5 nəfərlik beynəlxalq komandaya rəhbərlik edərək layihə müddətini 20% qısaltdı"
✅ "Angular və TypeScript texnologiyalarında ekspert səviyyəli bilik"
✅ "Agile metodologiyasını tətbiq edərək komanda məhsuldarlığını 40% artırdı"

MÜHİM QAYDALAR:
🚫 Heç vaxt 1-ci şəxs (mən, mənim, məni) istifadə etməyin
✅ Həmişə 3-cü şəxs (etdi, etmişdir) və ya neytral format (təcrübə, bacarıq) istifadə edin
🚫 "İştirak etdim" deyil → ✅ "İştirak etdi" və ya "Layihədə iştirak"
🚫 "Mənim təcrübəm" deyil → ✅ "5 illik təcrübə" və ya "təcrübəyə malik"

{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "personalInfo|experience|education|skills|languages|projects|certifications|volunteerExperience|publications|honorsAwards|courses|testScores|organizations|customSections|summary",
      "title": "Təklif başlığı",
      "description": "Ətraflı izahat",
      "field": "field_name",
      "currentValue": "mövcud dəyər",
      "newValue": "təklif olunan dəyər",
      "sectionIndex": 0,
      "priority": "high|medium|low",
      "category": "content|grammar|formatting|structure"
    }
  ],
  "overallAnalysis": {
    "strengths": ["güclü tərəflər"],
    "weaknesses": ["zəif tərəflər"],
    "score": 85,
    "recommendations": ["ümumi tövsiyələr"]
  }
}

YENI ELEMENT ƏLAVƏ ETMƏK ÜÇÜN FORMAT:
Yeni bacarıq əlavə etmək üçün (type MÜTLƏQ "hard" və ya "soft" olmalıdır):
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "React.js",
    "type": "hard",
    "level": "Expert",
    "category": "Frontend Development"
  }
}

Yeni soft skill əlavə etmək üçün:
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "Liderlik və komanda idarəetməsi",
    "type": "soft",
    "level": "Advanced",
    "category": "Management"
  }
}

Yeni layihə əlavə etmək üçün:
{
  "type": "projects",
  "field": "add",
  "newValue": {
    "name": "E-commerce Platforması",
    "description": "React və Node.js ilə 10k+ istifadəçi üçün tam funksional platforma hazırlandı",
    "technologies": "React, Node.js, MongoDB",
    "url": ""
  }
}

Yeni təcrübə əlavə etmək üçün:
{
  "type": "experience",
  "field": "add",
  "newValue": {
    "position": "Senior Developer",
    "company": "Tech Corp",
    "startDate": "2023-01",
    "endDate": "2024-01",
    "description": "3 layihəyə rəhbərlik edərək komanda məhsuldarlığını 40% artırdı"
  }
}

TÖVSIYƏ PRINSIPLƏRİ:
1. RƏQƏMLƏRLƏ DƏSTƏKLƏ: "35% artım", "150 layihə", "5 nəfərlik komanda"
2. KONKRET TEXNOLOGİYALAR: React, Python, Adobe Creative Suite
3. NƏTICƏ GÖSTƏR: "Satışları artırdım" ❌ → "Satışları 6 ayda 25% artıraraq aylıq $50k əlavə gəlir təmin etdim" ✅
4. FƏRDİ YAŞANTINI ƏKS ETDİR: Hər CV unikal olmalıdır
5. İŞ BAZARI TƏLƏBLƏRİNƏ UYĞUN: ATS-friendly açar sözlər

- PersonalInfo field-ləri: firstName, lastName, email, phone, location, summary
- Experience field-ləri: position, company, startDate, endDate, description
- Education field-ləri: degree, institution, startDate, endDate, description
- Skills field-ləri: name, level
- Languages field-ləri: language, level
- Projects field-ləri: name, description, technologies, url
- Certifications field-ləri: name, institution, date, description
- VolunteerExperience field-ləri: position, organization, startDate, endDate, description
- Publications field-ləri: title, publisher, date, description
- Honors/Awards field-ləri: title, issuer, date, description
- Courses field-ləri: name, institution, date, description
- TestScores field-ləri: name, score, date
- Organizations field-ləri: name, position, startDate, endDate, description
- CustomSections field-ləri: title, content

MƏLUMAT STRUKTURU:
Personal Info: ${JSON.stringify(personalInfo)}
Experience: ${JSON.stringify(experience)}
Education: ${JSON.stringify(education)}
Skills: ${JSON.stringify(skills)}
Languages: ${JSON.stringify(languages)}
Projects: ${JSON.stringify(projects)}`
            },
            en: {
                systemPrompt: `You are a senior CV consultant and HR expert with 15+ years of experience in resume optimization. Your goal is to create competitive, specific, and original resumes for the real job market.

CRITICAL RULE: Never use first person pronouns (I, my, me) in CV! Always use third person or neutral format.`,
                analysisPrompt: `Analyze this CV and provide professional suggestions. AVOID CLICHÉS!

MOST IMPORTANT: All suggestions must be in third person format. Not "I did" but "Did" or neutral format.

FORBIDDEN CLICHÉ PHRASES:
❌ "Team player"
❌ "Detail-oriented"
❌ "Hard-working and reliable" 
❌ "Problem-solving skills"
❌ "Dynamic and energetic"
❌ "Strong work ethic"
❌ "Customer service oriented"
❌ "Innovative thinking"
❌ "Self-motivated"
❌ "Results-driven"

GOOD SUGGESTION EXAMPLES:
✅ "Developed 3 e-commerce platforms using React.js and Node.js, serving 10k+ daily users"
✅ "Managed portfolio of 200+ clients, achieving 45% monthly revenue growth"
✅ "Built data analysis system using SQL and Python, accelerating company decision-making by 30%"
✅ "Led international team of 5 developers, reducing project timeline by 20%"
✅ "Expert-level proficiency in Angular and TypeScript frameworks"
✅ "Implemented Agile methodology, improving team productivity by 40%"

IMPORTANT RULES:
🚫 Never use first person (I, my, me)
✅ Always use third person (developed, achieved) or neutral format (experience in, proficiency with)
🚫 "I participated" → ✅ "Participated in" or "Project participation"
🚫 "My experience" → ✅ "5 years of experience" or "experienced in"

{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "personalInfo|experience|education|skills|languages|projects|certifications|volunteerExperience|publications|honorsAwards|courses|testScores|organizations|customSections|summary",
      "title": "Suggestion title",
      "description": "Detailed explanation",
      "field": "field_name",
      "currentValue": "current value",
      "newValue": "suggested value",
      "sectionIndex": 0,
      "priority": "high|medium|low",
      "category": "content|grammar|formatting|structure"
    }
  ],
  "overallAnalysis": {
    "strengths": ["strengths"],
    "weaknesses": ["weaknesses"],
    "score": 85,
    "recommendations": ["general recommendations"]
  }
}

FORMAT FOR ADDING NEW ITEMS:
To add new skill (type MUST be "hard" or "soft"):
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "React.js",
    "type": "hard",
    "level": "Expert",
    "category": "Frontend Development"
  }
}

To add new soft skill:
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "Leadership and Team Management",
    "type": "soft",
    "level": "Advanced",
    "category": "Management"
  }
}

To add new project:
{
  "type": "projects",
  "field": "add",
  "newValue": {
    "name": "E-commerce Platform",
    "description": "Built fully functional platform for 10k+ users using React and Node.js",
    "technologies": "React, Node.js, MongoDB",
    "url": ""
  }
}

To add new experience:
{
  "type": "experience",
  "field": "add",
  "newValue": {
    "position": "Senior Developer",
    "company": "Tech Corp",
    "startDate": "2023-01",
    "endDate": "2024-01",
    "description": "Led 3 projects, increasing team productivity by 40%"
  }
}

RECOMMENDATION PRINCIPLES:
1. QUANTIFY WITH NUMBERS: "35% increase", "150 projects", "5-person team"
2. SPECIFY TECHNOLOGIES: React, Python, Adobe Creative Suite, Salesforce
3. SHOW RESULTS: "Increased sales" ❌ → "Increased sales by 25% in 6 months, generating $50k additional monthly revenue" ✅
4. REFLECT INDIVIDUAL EXPERIENCE: Each CV should be unique
5. MATCH JOB MARKET NEEDS: Include ATS-friendly keywords

- PersonalInfo fields: firstName, lastName, email, phone, location, summary
- Experience fields: position, company, startDate, endDate, description
- Education fields: degree, institution, startDate, endDate, description
- Skills fields: name, level
- Languages fields: language, level
- Projects fields: name, description, technologies, url
- Certifications fields: name, institution, date, description
- VolunteerExperience fields: position, organization, startDate, endDate, description
- Publications fields: title, publisher, date, description
- Honors/Awards fields: title, issuer, date, description
- Courses fields: name, institution, date, description
- TestScores fields: name, score, date
- Organizations fields: name, position, startDate, endDate, description
- CustomSections fields: title, content

DATA STRUCTURE:
Personal Info: ${JSON.stringify(personalInfo)}
Experience: ${JSON.stringify(experience)}
Education: ${JSON.stringify(education)}
Skills: ${JSON.stringify(skills)}
Languages: ${JSON.stringify(languages)}
Projects: ${JSON.stringify(projects)}`
            },
            ru: {
                systemPrompt: `Вы старший консультант по резюме и HR-эксперт с опытом работы 15+ лет в оптимизации резюме. Ваша цель - создавать конкурентоспособные, конкретные и оригинальные резюме для реального рынка труда.

КРИТИЧЕСКОЕ ПРАВИЛО: Никогда не используйте местоимения первого лица (я, мой, мне) в резюме! Всегда используйте третье лицо или нейтральный формат.`,
                analysisPrompt: `Проанализируйте это резюме и предоставьте профессиональные предложения. ИЗБЕГАЙТЕ КЛИШЕ!

САМОЕ ВАЖНОЕ: Все предложения должны быть в третьем лице. Не "Я делал", а "Делал" или нейтральный формат.

ЗАПРЕЩЕННЫЕ КЛИШЕ:
❌ "Командный игрок"
❌ "Внимательный к деталям"
❌ "Трудолюбивый и надежный"
❌ "Навыки решения проблем"
❌ "Динамичный и энергичный"
❌ "Высокая работоспособность"
❌ "Ориентированный на клиента"
❌ "Инновационное мышление"
❌ "Самомотивированный"
❌ "Нацеленный на результат"

ХОРОШИЕ ПРИМЕРЫ ПРЕДЛОЖЕНИЙ:
✅ "Разработал 3 e-commerce платформы на React.js и Node.js, обслуживающие 10k+ пользователей ежедневно"
✅ "Управлял портфелем из 200+ клиентов, достигнув 45% роста ежемесячной выручки"
✅ "Создал систему анализа данных на SQL и Python, ускорив принятие решений в компании на 30%"
✅ "Руководил международной командой из 5 разработчиков, сократив сроки проекта на 20%"
✅ "Экспертный уровень владения Angular и TypeScript фреймворками"
✅ "Внедрил методологию Agile, повысив продуктивность команды на 40%"

ВАЖНЫЕ ПРАВИЛА:
🚫 Никогда не используйте первое лицо (я, мой, мне)
✅ Всегда используйте третье лицо (разработал, достиг) или нейтральный формат (опыт в, владение)
🚫 "Я участвовал" → ✅ "Участвовал в" или "Участие в проекте"
🚫 "Мой опыт" → ✅ "5 лет опыта" или "опыт работы с"

{
  "suggestions": [
    {
      "id": "unique_id",
      "type": "personalInfo|experience|education|skills|languages|projects|certifications|volunteerExperience|publications|honorsAwards|courses|testScores|organizations|customSections|summary",
      "title": "Заголовок предложения",
      "description": "Подробное объяснение",
      "field": "field_name",
      "currentValue": "текущее значение",
      "newValue": "предлагаемое значение",
      "sectionIndex": 0,
      "priority": "high|medium|low",
      "category": "content|grammar|formatting|structure"
    }
  ],
  "overallAnalysis": {
    "strengths": ["сильные стороны"],
    "weaknesses": ["слабые стороны"],
    "score": 85,
    "recommendations": ["общие рекомендации"]
  }
}

ФОРМАТ ДЛЯ ДОБАВЛЕНИЯ НОВЫХ ЭЛЕМЕНТОВ:
Для добавления нового навыка (type ОБЯЗАТЕЛЬНО должен быть "hard" или "soft"):
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "React.js",
    "type": "hard",
    "level": "Expert",
    "category": "Frontend Development"
  }
}

Для добавления гибкого навыка (soft skill):
{
  "type": "skills",
  "field": "add",
  "newValue": {
    "name": "Лидерство и управление командой",
    "type": "soft",
    "level": "Advanced",
    "category": "Management"
  }
}

Для добавления нового проекта:
{
  "type": "projects",
  "field": "add",
  "newValue": {
    "name": "E-commerce Платформа",
    "description": "Создал полнофункциональную платформу для 10k+ пользователей на React и Node.js",
    "technologies": "React, Node.js, MongoDB",
    "url": ""
  }
}

Для добавления нового опыта:
{
  "type": "experience",
  "field": "add",
  "newValue": {
    "position": "Senior Developer",
    "company": "Tech Corp",
    "startDate": "2023-01",
    "endDate": "2024-01",
    "description": "Руководил 3 проектами, повысив производительность команды на 40%"
  }
}

ПРИНЦИПЫ РЕКОМЕНДАЦИЙ:
1. ПОДКРЕПЛЯЙТЕ ЦИФРАМИ: "увеличение на 35%", "150 проектов", "команда из 5 человек"
2. УКАЗЫВАЙТЕ КОНКРЕТНЫЕ ТЕХНОЛОГИИ: React, Python, Adobe Creative Suite, Salesforce
3. ПОКАЗЫВАЙТЕ РЕЗУЛЬТАТЫ: "Увеличил продажи" ❌ → "Увеличил продажи на 25% за 6 месяцев, обеспечив дополнительную ежемесячную выручку $50k" ✅
4. ОТРАЖАЙТЕ ИНДИВИДУАЛЬНЫЙ ОПЫТ: Каждое резюме должно быть уникальным
5. СООТВЕТСТВУЙТЕ ТРЕБОВАНИЯМ РЫНКА ТРУДА: Включайте ATS-совместимые ключевые слова

- Поля PersonalInfo: firstName, lastName, email, phone, location, summary
- Поля Experience: position, company, startDate, endDate, description
- Поля Education: degree, institution, startDate, endDate, description
- Поля Skills: name, level
- Поля Languages: language, level
- Поля Projects: name, description, technologies, url
- Поля Certifications: name, institution, date, description
- Поля VolunteerExperience: position, organization, startDate, endDate, description
- Поля Publications: title, publisher, date, description
- Поля Honors/Awards: title, issuer, date, description
- Поля Courses: name, institution, date, description
- Поля TestScores: name, score, date
- Поля Organizations: name, position, startDate, endDate, description
- Поля CustomSections: title, content

СТРУКТУРА ДАННЫХ:
Personal Info: ${JSON.stringify(personalInfo)}
Experience: ${JSON.stringify(experience)}
Education: ${JSON.stringify(education)}
Skills: ${JSON.stringify(skills)}
Languages: ${JSON.stringify(languages)}
Projects: ${JSON.stringify(projects)}`
            }
        };

        const currentLanguage = languagePrompts[language as keyof typeof languagePrompts] || languagePrompts.az;

        const prompt = `${currentLanguage.systemPrompt}

${currentLanguage.analysisPrompt}

CV Məlumatları:
${cvText}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse JSON from AI response
        let analysisResult;
        try {
            // Remove any markdown formatting and extract JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysisResult = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback: create basic suggestions based on the response text
            analysisResult = {
                suggestions: [
                    {
                        id: 'general_suggestion',
                        type: 'summary',
                        title: language === 'az' ? 'Ümumi təkmilləşdirmə' : 'General Improvement',
                        description: text.substring(0, 200) + '...',
                        field: 'summary',
                        currentValue: '',
                        newValue: '',
                        priority: 'medium',
                        category: 'content'
                    }
                ],
                overallAnalysis: {
                    strengths: [],
                    weaknesses: [],
                    score: 70,
                    recommendations: [text.substring(0, 100) + '...']
                }
            };
        }

        // Add unique IDs to suggestions if missing
        if (analysisResult.suggestions) {
            analysisResult.suggestions = analysisResult.suggestions.map((suggestion: any, index: number) => ({
                ...suggestion,
                id: suggestion.id || `suggestion_${Date.now()}_${index}`
            }));
        }

        return NextResponse.json(analysisResult);

    } catch (error) {
        console.error('AI CV Analysis Error:', error);
        
        // If it's an API key related error, mark the key as inactive
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('api key') || 
                errorMessage.includes('authentication') || 
                errorMessage.includes('unauthorized') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('billing')) {
                
                const apiKey = await getWorkingGeminiApiKey();
                if (apiKey) {
                    await markApiKeyAsInactive(apiKey, error.message);
                }
            }
        }
        
        return NextResponse.json(
            { error: 'Analysis failed' },
            { status: 500 }
        );
    }
}