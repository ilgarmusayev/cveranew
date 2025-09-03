import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

    // Only allow Medium and Premium users to generate AI skills
    if (user.tier === 'Free') {
      return NextResponse.json({
        success: false,
        error: 'AI skills yaratma yalnız premium abunəçilər üçün mövcuddur. Abunəliyi yüksəldin.'
      }, { status: 403 });
    }

    // Get CV data from request
    const { cvData, targetLanguage } = await request.json();
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

    // Generate AI skills using Gemini
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create language-specific prompt
    const getLanguagePrompt = (lang: string, textContent: string) => {
      if (lang === 'english') {
        return `
          Based on the following CV information, suggest relevant skills:

          CV Information: "${textContent.substring(0, 2000)}"

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
        `;
      } else if (lang === 'turkish' || lang === 'tr') {
        return `
          Aşağıdaki CV bilgilerine dayanarak ilgili yetenekler önerin:

          CV Bilgileri: "${textContent.substring(0, 2000)}"

          Gereksinimler:
          1. Hard Skills (Teknik yetenekler): programlama dilleri, framework'ler, veritabanları, araçlar, teknolojiler
          2. Soft Skills (Kişisel yetenekler): liderlik, takım çalışması, iletişim, problem çözme
          3. CV bilgilerine uygun yetenekleri önerin
          4. TAM OLARAK 4 adet hard skill ve 4 adet soft skill - ne eksik ne fazla
          5. JSON object formatında döndürün
          6. Yetenekler sektör ve pozisyona uygun olmalıdır
          7. Tüm yetenekler TÜRKÇE dilinde olmalıdır
          
          Hard Skills Örnekleri:
          - Programlama: JavaScript, Python, Java, C#, TypeScript
          - Framework'ler: React, Vue.js, Angular, Next.js, Laravel
          - Veritabanları: MySQL, PostgreSQL, MongoDB, Redis
          - Araçlar: Git, Docker, AWS, Azure, Jenkins
          - Tasarım: Photoshop, Figma, Adobe Illustrator
          
          Soft Skills Örnekleri:
          - Liderlik, Takım Çalışması, İletişim, Problem Çözme
          - Yaratıcılık, Uyum Sağlama, Zaman Yönetimi, Analitik Düşünce
          - Müşteri Hizmetleri, Sunum, Proje Yönetimi

          Yanıt formatı: 
          {
            "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
            "softSkills": ["Liderlik", "Takım Çalışması", "Problem Çözme", "İletişim"]
          }

          ÖNEMLİ: 
          - TAM OLARAK 4 hard skill ve 4 soft skill döndürün
          - Tüm yetenekler TÜRKÇE dilinde olmalıdır
          - SADECE JSON yanıtı verin, ek metin eklemeyin
        `;
      } else {
        return `
          Aşağıdaki CV məlumatlarına əsasən müvafiq bacarıqlar təklif edin:

          CV Məlumatları: "${textContent.substring(0, 2000)}"

          Tələblər:
          1. Hard Skills (Texniki bacarıqlar): proqramlaşdırma dilləri, framework-lər, verilənlər bazası, alətlər, texnologiyalar
          2. Soft Skills (Şəxsi bacarıqlar): liderlik, komanda işi, kommunikasiya, problem həll etmə
          3. CV məlumatlarına uyğun olan bacarıqları təklif edin
          4. DƏQIQ 4 ədəd hard skills və 4 ədəd soft skills - az ya da çox olmasın
          5. JSON object formatında qaytarın
          6. Bacarıqlar sənaye və vəzifəyə uyğun olmalıdır
          7. Bütün bacarıqlar AZƏRBAYCAN dilində olmalıdır
          
          Hard Skills Nümunələri:
          - Proqramlaşdırma: JavaScript, Python, Java, C#, TypeScript
          - Framework-lər: React, Vue.js, Angular, Next.js, Laravel
          - Verilənlər bazası: MySQL, PostgreSQL, MongoDB, Redis
          - Alətlər: Git, Docker, AWS, Azure, Jenkins
          - Dizayn: Photoshop, Figma, Adobe Illustrator
          
          Soft Skills Nümunələri:
          - Liderlik, Komanda işi, Kommunikasiya, Problem həlli
          - Kreativlik, Adaptasiya, Vaxt idarəetməsi, Analitik düşüncə
          - Müştəri xidməti, Prezentasiya, Layihə idarəetməsi

          Cavab formatı: 
          {
            "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL"],
            "softSkills": ["Liderlik", "Komanda işi", "Problem həlli", "Kommunikasiya"]
          }

          ÖNEMLİ: 
          - DƏQIQ 4 hard skills və 4 soft skills qaytarın
          - Bütün bacarıqlar AZƏRBAYCAN dilində olmalıdır
          - YALNIZ JSON cavabı verin, əlavə mətn əlavə etməyin

          VACIB: DƏQIQ 4 ədəd hard skills və 4 ədəd soft skills qaytarın.
          YALNIZ JSON cavab verin, əlavə mətn yox:
        `;
      }
    };

    const prompt = getLanguagePrompt(language, textContent);

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
