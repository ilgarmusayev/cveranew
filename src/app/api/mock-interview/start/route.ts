import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWorkingGeminiApiKey } from '@/lib/geminiApiKeyService';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

// Position adları
const POSITION_NAMES: Record<string, string> = {
    frontend: 'Frontend Developer',
    backend: 'Backend Developer',
    fullstack: 'Full Stack Developer',
    mobile: 'Mobile Developer',
    devops: 'DevOps Engineer',
    data: 'Data Scientist',
    hr: 'HR Manager',
    sales: 'Sales Specialist',
    marketing: 'Marketing Manager',
    product: 'Product Manager',
};

// Səviyyə adları
const LEVEL_NAMES: Record<string, string> = {
    junior: 'Junior',
    mid: 'Middle',
    senior: 'Senior',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { position, level, mode, cvId } = body;

        if (!position || !level || !cvId) {
            return NextResponse.json(
                { success: false, error: 'Position, level və CV ID tələb olunur' },
                { status: 400 }
            );
        }

        // Auth yoxla
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Giriş tələb olunur' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = await verifyJWT(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, error: 'Etibarsız token' },
                { status: 401 }
            );
        }

        // CV məlumatlarını al
        const cv = await prisma.cV.findUnique({
            where: { 
                id: cvId,
                userId: decoded.userId // Təhlükəsizlik üçün
            },
        });

        if (!cv) {
            return NextResponse.json(
                { success: false, error: 'CV tapılmadı' },
                { status: 404 }
            );
        }

        // CV data-nı parse et
        const cvData = cv.cv_data as any;
        const personalInfo = cvData.personalInfo || {};
        const experience = cvData.experience || [];
        const education = cvData.education || [];
        const skills = cvData.skills || [];
        const summary = personalInfo.summary || '';

        // Gemini API key-ni SQL-dən götür
        const apiKey = await getWorkingGeminiApiKey();
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Aktiv Gemini API key tapılmadı' },
                { status: 500 }
            );
        }

        // Gemini AI initialize et
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        // Prompt hazırla
        const positionName = POSITION_NAMES[position] || position;
        const levelName = LEVEL_NAMES[level] || level;

        // CV məlumatlarını formatlayaq
        const candidateName = personalInfo.fullName || personalInfo.firstName || 'Namizəd';
        const candidateTitle = personalInfo.title || '';
        
        // Təcrübələri formatlayaq
        const experienceSummary = experience.slice(0, 3).map((exp: any) => 
            `${exp.position || ''} at ${exp.company || ''} (${exp.startDate || ''} - ${exp.endDate || 'İndiki'})`
        ).join('; ');

        // Təhsili formatlayaq
        const educationSummary = education.slice(0, 2).map((edu: any) => 
            `${edu.degree || ''} in ${edu.field || ''} at ${edu.school || ''}`
        ).join('; ');

        // Bacarıqları formatlayaq
        const skillsList = skills.slice(0, 10).map((skill: any) => skill.name || skill).join(', ');

        const prompt = `You are an expert AI interviewer conducting a mock interview for a ${levelName} ${positionName} position.

CANDIDATE CV INFORMATION:
- Name: ${candidateName}
- Current Title: ${candidateTitle}
- Professional Summary: ${summary}
- Work Experience: ${experienceSummary || 'No experience listed'}
- Education: ${educationSummary || 'No education listed'}
- Skills: ${skillsList || 'No skills listed'}

IMPORTANT: Generate 5 PERSONALIZED interview questions in Azerbaijani language based on the candidate's actual CV information above.

Questions should:
1. Be appropriate for a ${levelName} level candidate
2. Be relevant to ${positionName} role
3. Reference SPECIFIC details from their CV (their experience, skills, education)
4. Be progressive in difficulty (starting easier, getting harder)
5. Mix technical questions (based on their skills) and behavioral questions (based on their experience)
6. Be natural and conversational in tone
7. Be UNIQUE to this candidate - not generic questions

For example:
- If they worked at Company X, ask about their experience there
- If they have Skill Y, ask them to explain or demonstrate it
- If they studied Z, ask how it relates to this position

Return ONLY a JSON array of 5 questions, nothing else. Format:
["Sual 1", "Sual 2", "Sual 3", "Sual 4", "Sual 5"]

Make each question specific to THIS candidate's background and experience.`;

        console.log('🎯 Generating personalized interview questions for:', candidateName, positionName, levelName);
        console.log('📄 CV Summary:', { 
            experience: experienceSummary.substring(0, 100),
            skills: skillsList.substring(0, 100) 
        });

        // Gemini-dən sualları al
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('📝 Raw Gemini response:', text);

        // JSON parse et
        let questions: string[];
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            questions = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('Raw text:', text);
            
            // Fallback: manuel olaraq sualları çıxart
            const matches = text.match(/"([^"]+)"/g);
            if (matches && matches.length >= 5) {
                questions = matches.slice(0, 5).map(q => q.replace(/"/g, ''));
            } else {
                throw new Error('Suallar generate edilə bilmədi');
            }
        }

        // Validasiya
        if (!Array.isArray(questions) || questions.length !== 5) {
            throw new Error('5 sual generate edilməlidir');
        }

        console.log('✅ Generated questions:', questions);

        return NextResponse.json({
            success: true,
            questions,
            position: positionName,
            level: levelName,
        });

    } catch (error) {
        console.error('❌ Mock interview start error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Xəta baş verdi' 
            },
            { status: 500 }
        );
    }
}
