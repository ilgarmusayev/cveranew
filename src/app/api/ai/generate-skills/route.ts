import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = await verifyJWT(token);
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check user tier
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { tier: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    // Only allow Medium, Pro and Premium users to generate AI skills
    if (user.tier === 'Free') {
      return NextResponse.json({
        success: false,
        error: 'AI skills yaratma yalnız Premium, Pro və Medium abunəçilər üçün mövcuddur. Abunəliyi yüksəldin.'
      }, { status: 403 });
    }

    // Get CV data from request - with randomness parameters
    const { 
      cvData, 
      targetLanguage,
      existingSkills = [],
      previousSuggestions = [],
      requestCount = 0,
      forceUnique = true,  // Həmişə unikal olsun
      diversityFactor = Math.random() * 0.5 + 0.5  // 0.5-1.0 arası yüksək çeşitlilik
    } = await request.json();
    
    console.log('🎲 Randomness parameters:', {
      existingSkills: existingSkills.length,
      previousSuggestions: previousSuggestions.length,
      requestCount,
      forceUnique,
      diversityFactor
    });
    if (!cvData) {
      return NextResponse.json(
        { success: false, error: 'CV məlumatları tələb olunur' },
        { status: 400 }
      );
    }

    const language = targetLanguage || cvData?.cvLanguage || 'azerbaijani';
    console.log('🤖 Generating AI skills for user:', decoded.userId, 'in language:', language);
    console.log('📋 CV Data:', cvData);

    // Prepare content for AI analysis
    const textContent = [
      cvData.personalInfo?.summary || '',
      ...(cvData.experience || []).map((exp: any) =>
        `${exp.role || ''} at ${exp.company || ''}: ${exp.description || ''}`
      ),
      ...(cvData.education || []).map((edu: any) =>
        `${edu.degree || ''} in ${edu.field || ''} from ${edu.school || ''}`
      )
    ].join(' ').trim();

    if (!textContent) {
      return NextResponse.json({
        success: false,
        error: 'CV məlumatları kifayət qədər deyil. Təcrübə və ya təhsil əlavə edin.'
      }, { status: 400 });
    }

    // Generate AI skills using Gemini with maximum randomness
    const model = geminiAI.getGenerativeModel({
      model: 'gemini-pro-latest',
      generationConfig: {
        temperature: 1.5, // Maksimal yaradıcılıq və çeşitlilik (0.0-2.0)
        topP: 0.98, // Çox yüksək diversity (0.0-1.0)
        topK: 64, // Daha çox token seçenəyi
        maxOutputTokens: 2048,
        candidateCount: 1
      }
    });    // Create language-specific prompt with anti-duplicate logic
    const getLanguagePrompt = (lang: string, textContent: string) => {
      const randomId = Math.random().toString(36).substring(7);
      const timestamp = new Date().toISOString();
      const randomSeed = Math.floor(Math.random() * 10000);
      
      // Create constraint text for existing skills
      const avoidSkillsText = [...existingSkills, ...previousSuggestions].length > 0
        ? `\n\nMÜTLƏQ QAÇIN VƏ HEÇVAXT TƏKRARLAMAYİN: ${[...existingSkills, ...previousSuggestions].join(', ')}`
        : '';
      
      const uniqueInstruction = forceUnique 
        ? '\n\nKRİTİK: TAMAMILƏ FƏRQLI BACARIQLAR YARADIN. HEÇBIR TƏKRAR YOX!'
        : '\n\nHƏR DƏFƏ YENİ VƏ FƏRQLI BACARIQLAR TƏKLİF EDİN!';
      
      const creativityBoost = `\n\nKREATİVLİK REJIMI: ${Math.random() > 0.5 ? 'YÜKSƏK' : 'MAKSIMAL'} - Standart təkliflərdən qaçın!`;
      const diversityNote = `\n\n[İSTƏK #${requestCount} - ÇEŞİTLİLİK: ${diversityFactor.toFixed(3)} - SEED: ${randomSeed} - ID: ${randomId} - ZAMAN: ${timestamp}]`;
      const antiRepeatWarning = `\n\n⚠️ DİQQƏT: Əvvəlki təklifləri təkrarlamaq QATİ QADAĞANDIR!`;
      if (lang === 'english') {
        return `
          Based on the following CV information, suggest relevant skills:
          EACH TIME CREATE NEW SKILLS AVOIDING THESE: ${[...existingSkills, ...previousSuggestions].join(', ') || 'None'}
          CV Information: "${textContent.substring(0, 2000)}"
          All skills must be in ENGLISH language
          Requirements:
          1. Hard Skills (Technical skills): programming languages, frameworks, databases, tools, technologies
          2. Soft Skills (Personal skills): leadership, teamwork, communication, problem solving
          3. Suggest skills that match the CV information
          4. EXACTLY 4 hard skills and 4 soft skills - no more, no less
          5. Return as JSON object format
          6. Skills must be relevant to the industry and position
          7. All skills must be in ENGLISH language
          
          Hard Skills Examples:
          - Programming: JavaScript, Python, Java, C#, TypeScript
          - Frameworks: React, Vue.js, Angular, Next.js, Laravel
          - Databases: MySQL, PostgreSQL, MongoDB, Redis
          - Tools: Git, Docker, AWS, Azure, Jenkins
          - Design: Photoshop, Figma, Adobe Illustrator
          
          Soft Skills Examples:
          - Leadership, Teamwork, Communication, Problem Solving
          - Creativity, Adaptability, Time Management, Analytical Thinking
          - Customer Service, Presentation, Project Management

          Response format: 
          {
            "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
            "softSkills": ["Leadership", "Teamwork", "Problem Solving", "Communication"]
          }

          IMPORTANT: 
          - Return EXACTLY 4 hard skills and 4 soft skills
          - All skills must be in ENGLISH language
          - ONLY provide JSON response, no additional text
          ${avoidSkillsText}
          ${uniqueInstruction}
          ${diversityNote}
        `;
      } else if (lang === 'russian' || lang === 'ru') {
        return `
          На основе следующей информации резюме предложите соответствующие навыки:
          КАЖДЫЙ РАЗ СОЗДАВАЙТЕ НОВЫЕ НАВЫКИ, ИЗБЕГАЯ ЭТИХ: ${[...existingSkills, ...previousSuggestions].join(', ') || 'Нет'}
          Информация резюме: "${textContent.substring(0, 2000)}"
          Все навыки должны быть на РУССКОМ языке
          Требования:
          1. Жёсткие навыки (Технические): языки программирования, фреймворки, базы данных, инструменты, технологии
          2. Мягкие навыки (Личные качества): лидерство, командная работа, коммуникация, решение проблем
          3. Предлагайте навыки, которые соответствуют информации резюме
          4. ТОЧНО 4 технических навыка и 4 личных качества - не больше, не меньше
          5. Верните в формате JSON объекта
          6. Навыки должны соответствовать отрасли и должности
          7. Все навыки должны быть на РУССКОМ языке
          
          Примеры технических навыков:
          - Программирование: JavaScript, Python, Java, C#, TypeScript
          - Фреймворки: React, Vue.js, Angular, Next.js, Laravel
          - Базы данных: MySQL, PostgreSQL, MongoDB, Redis
          - Инструменты: Git, Docker, AWS, Azure, Jenkins
          - Дизайн: Photoshop, Figma, Adobe Illustrator
          
          Примеры личных качеств:
          - Лидерство, Командная работа, Коммуникация, Решение проблем
          - Креативность, Адаптивность, Управление временем, Аналитическое мышление
          - Обслуживание клиентов, Презентация, Управление проектами

          Формат ответа: 
          {
            "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
            "softSkills": ["Лидерство", "Командная работа", "Решение проблем", "Коммуникация"]
          }

          ВАЖНО: 
          - Верните ТОЧНО 4 технических навыка и 4 личных качества
          - Все навыки должны быть на РУССКОМ языке
          - ТОЛЬКО JSON ответ, никакого дополнительного текста
          ${avoidSkillsText}
          ${uniqueInstruction}
          ${diversityNote}
        `;
      } return `
          Aşağıdaki CV məlumatlarına əsasən YENİ VƏ FƏRQLI bacarıqlar təklif edin:
          
          ⚠️ QATI QADAĞA: Bu bacarıqları HEÇVAXT təkrarlamayın: ${[...existingSkills, ...previousSuggestions].join(', ') || 'Heç biri'}
          
          CV Məlumatları: "${textContent.substring(0, 2000)}"

          📋 XÜSUSI TƏLƏBLƏR:
          1. Hard Skills (Texniki): Proqramlaşdırma, framework, DB, alətlər, texnologiya
          2. Soft Skills (Şəxsi): Liderlik, komanda, kommunikasiya, həll etmə bacarığı  
          3. CV-yə uyğun VƏ TAMAMILƏ FƏRQLI bacarıqlar
          4. MƏCBURI: 4 texniki + 4 şəxsi = CƏMİ 8 bacarıq
          5. JSON formatında cavab
          6. İş sahəsinə uyğun olmalı
          7. 100% AZƏRBAYCAN dilində
          
          💡 Texniki Bacarıq İdeyaları (fərqli seç):
          - Kodlaşdırma: React, Vue, Angular, Python, Java, .NET, PHP
          - Verilənlər: PostgreSQL, MongoDB, Redis, ElasticSearch
          - DevOps: Docker, Kubernetes, AWS, Azure, CI/CD
          - Alətlər: Figma, Sketch, Jira, Trello, Git, Postman
          
          🎯 Şəxsi Bacarıq İdeyaları (yaradıcı seç):
          - İdarəetmə: Strateji planlaşdırma, Resurs optimizasiyası
          - Sosial: Müzakirə aparma, İctimaiyyətlə əlaqə
          - Analitik: Məlumat təhlili, Trend proqnozlaşdırma
          - İnnovasiya: Yaradıcı həllər, Prosess optimallaşdırma

          🎲 JSON Nümunəsi: 
          {
            "hardSkills": ["TypeScript", "GraphQL", "MongoDB", "AWS Lambda"],
            "softSkills": ["Strateji planlaşdırma", "Müzakirə aparma", "Məlumat təhlili", "Yaradıcı həllər"]
          }

          ‼️ VACIB QEYDLƏR:
          - Məhz 4+4=8 bacarıq (az/çox QƏBUL EDİLMİR)
          - Azərbaycan dilində yazılmalı
          - JSON formatı məcburi
          - Təkrarlar QƏBUL EDİLMİR
          ${avoidSkillsText}
          ${uniqueInstruction}
          ${creativityBoost}
          ${diversityNote}
          ${antiRepeatWarning}

          🔥 SON XƏBƏRDARLIQ: Bu istəkdə TAMAMILƏ YENİ bacarıqlar tələb olunur!
        `;
      
    };

    const prompt = getLanguagePrompt(language, textContent);
    
    console.log('🔄 Starting AI skills generation with enhanced randomness...');
    console.log('🎯 Language:', language);
    console.log('📝 Text content length:', textContent.length);
    console.log('📋 Existing skills to avoid:', existingSkills.length);
    console.log('🚫 Previous suggestions to avoid:', previousSuggestions.length);
    console.log('🎲 Diversity factor:', diversityFactor);
    console.log('� Request count:', requestCount);
    console.log('✨ Force unique:', forceUnique);
    
    try {
      console.log('🚀 Calling Gemini API with enhanced creativity...');
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text().trim();

      console.log('🤖 AI Response:', aiResponse);

      // Parse AI response
      try {
      // Clean the response to extract JSON
      let cleanResponse = aiResponse;
      if (cleanResponse.includes('```')) {
        cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```/g, '');
      }

      const extractedData = JSON.parse(cleanResponse);

      // Check if response is in the new format with hardSkills and softSkills
      if (extractedData.hardSkills && extractedData.softSkills) {
        let hardSkills = Array.isArray(extractedData.hardSkills) 
          ? extractedData.hardSkills.filter((skill: any) => typeof skill === 'string' && skill.trim()).map((skill: any) => skill.trim())
          : [];

        let softSkills = Array.isArray(extractedData.softSkills) 
          ? extractedData.softSkills.filter((skill: any) => typeof skill === 'string' && skill.trim()).map((skill: any) => skill.trim())
          : [];

        // Ensure exactly 4 hard skills and 4 soft skills
        if (hardSkills.length !== 4) {
          hardSkills = hardSkills.slice(0, 4);
          // If less than 4, add generic skills based on language
          const fallbackHardSkills = targetLanguage?.includes('en') 
            ? ['Microsoft Office', 'Data Analysis', 'Project Management', 'Technical Writing']
            : targetLanguage?.includes('tr')
            ? ['Microsoft Office', 'Veri Analizi', 'Proje Yönetimi', 'Teknik Yazım']
            : ['Microsoft Office', 'Məlumat analizi', 'Layihə idarəetməsi', 'Texniki yazı'];
            
          while (hardSkills.length < 4) {
            const fallback = fallbackHardSkills[hardSkills.length];
            if (!hardSkills.includes(fallback)) {
              hardSkills.push(fallback);
            }
          }
        }

        if (softSkills.length !== 4) {
          softSkills = softSkills.slice(0, 4);
          // If less than 4, add generic skills based on language
          const fallbackSoftSkills = targetLanguage?.includes('en')
            ? ['Communication', 'Teamwork', 'Problem Solving', 'Adaptability']
            : targetLanguage?.includes('tr')
            ? ['İletişim', 'Takım Çalışması', 'Problem Çözme', 'Uyum']
            : ['Kommunikasiya', 'Komanda işi', 'Problem həlli', 'Adaptasiya'];
            
          while (softSkills.length < 4) {
            const fallback = fallbackSoftSkills[softSkills.length];
            if (!softSkills.includes(fallback)) {
              softSkills.push(fallback);
            }
          }
        }

        console.log(`✅ Generated exactly ${hardSkills.length} hard skills and ${softSkills.length} soft skills`);

        // Log the AI skills generation for analytics
        await prisma.importSession.create({
          data: {
            userId: decoded.userId,
            type: 'ai_skills_generated',
            data: JSON.stringify({
              tier: user.tier,
              hardSkillsCount: hardSkills.length,
              softSkillsCount: softSkills.length,
              hardSkills: hardSkills,
              softSkills: softSkills,
              timestamp: new Date().toISOString()
            }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        });

        return NextResponse.json({
          success: true,
          hardSkills: hardSkills,
          softSkills: softSkills,
          message: targetLanguage?.includes('en') 
            ? `4 technical skills and 4 soft skills generated by AI`
            : targetLanguage?.includes('tr')
            ? `AI tarafından 4 teknik beceri ve 4 kişisel beceri üretildi`
            : `AI tərəfindən 4 texniki bacarıq və 4 şəxsi bacarıq yaradıldı`
        });
      } 
      // Fallback for old array format
      else if (Array.isArray(extractedData)) {
        const validSkills = extractedData
          .filter(skill => typeof skill === 'string' && skill.trim())
          .map(skill => skill.trim())
          .slice(0, 10);

        console.log(`✅ Generated ${validSkills.length} AI skills (legacy format):`, validSkills);

        return NextResponse.json({
          success: true,
          skills: validSkills,
          message: `${validSkills.length} yeni skill AI tərəfindən yaradıldı`
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI skills response:', aiResponse);
      return NextResponse.json({
        success: false,
        error: 'AI cavabını emal etmək mümkün olmadı. Yenidən cəhd edin.'
      }, { status: 500 });
    }
  } catch (geminiError) {
    console.error('❌ Gemini API error:', geminiError);
    return NextResponse.json({
      success: false,
      error: 'AI xidməti ilə əlaqə yaratmaq mümkün olmadı. Yenidən cəhd edin.'
    }, { status: 500 });
  }

  } catch (error) {
    console.error('❌ AI Skills generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'AI skills yaratmaq mümkün olmadı. Yenidən cəhd edin.'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
