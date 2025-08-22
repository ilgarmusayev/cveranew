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
    const { cvData } = await request.json();
    if (!cvData) {
      return NextResponse.json(
        { success: false, error: 'CV məlumatları tələb olunur' },
        { status: 400 }
      );
    }

    console.log('🤖 Generating AI skills for user:', decoded.userId);
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

    const prompt = `
      Aşağıdaki CV məlumatlarına əsasən müvafiq bacarıqlar təklif edin:

      CV Məlumatları: "${textContent.substring(0, 2000)}"

      Tələblər:
      1. Hard Skills (Texniki bacarıqlar): proqramlaşdırma dilləri, framework-lər, verilənlər bazası, alətlər, texnologiyalar
      2. Soft Skills (Şəxsi bacarıqlar): liderlik, komanda işi, kommunikasiya, problem həll etmə
      3. CV məlumatlarına uyğun olan bacarıqları təklif edin
      4. Hər kateqoriyada maksimum 8 bacarıq
      5. JSON object formatında qaytarın
      
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
        "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
        "softSkills": ["Liderlik", "Komanda işi", "Problem həlli", "Kommunikasiya"]
      }

      YALNIZ JSON cavab verin, əlavə mətn yox:
    `;

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
        const hardSkills = Array.isArray(extractedData.hardSkills) 
          ? extractedData.hardSkills.filter((skill: any) => typeof skill === 'string' && skill.trim()).map((skill: any) => skill.trim()).slice(0, 8)
          : [];

        const softSkills = Array.isArray(extractedData.softSkills) 
          ? extractedData.softSkills.filter((skill: any) => typeof skill === 'string' && skill.trim()).map((skill: any) => skill.trim()).slice(0, 8)
          : [];

        console.log(`✅ Generated ${hardSkills.length} hard skills and ${softSkills.length} soft skills`);

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
          message: `${hardSkills.length + softSkills.length} yeni skill AI tərəfindən yaradıldı (${hardSkills.length} hard, ${softSkills.length} soft)`
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
