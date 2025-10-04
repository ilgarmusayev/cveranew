import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWorkingGeminiApiKey } from '@/lib/geminiApiKeyService';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

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

const LEVEL_NAMES: Record<string, string> = {
    junior: 'Junior',
    mid: 'Middle',
    senior: 'Senior',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { position, level, cvId, questionIndex, previousQA } = body;

        if (!position || !level || !cvId || questionIndex === undefined) {
            return NextResponse.json(
                { success: false, error: 'Məlumatlar natamam' },
                { status: 400 }
            );
        }

        // Auth
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

        // CV məlumatları
        const cv = await prisma.cV.findUnique({
            where: { 
                id: cvId,
                userId: decoded.userId
            },
        });

        if (!cv) {
            return NextResponse.json(
                { success: false, error: 'CV tapılmadı' },
                { status: 404 }
            );
        }

        const cvData = cv.cv_data as any;
        const personalInfo = cvData.personalInfo || {};
        const experience = cvData.experience || [];
        const skills = cvData.skills || [];
        const candidateName = personalInfo.fullName || personalInfo.firstName || 'Namizəd';
        
        const experienceSummary = experience.slice(0, 3).map((exp: any) => 
            `${exp.position || ''} at ${exp.company || ''}`
        ).join('; ');

        const skillsList = skills.slice(0, 10).map((skill: any) => skill.name || skill).join(', ');

        // Gemini API
        const apiKey = await getWorkingGeminiApiKey();
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Gemini API key tapılmadı' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const positionName = POSITION_NAMES[position] || position;
        const levelName = LEVEL_NAMES[level] || level;

        // Əvvəlki sual-cavabları formatlayaq
        const conversationHistory = previousQA && previousQA.length > 0
            ? previousQA.map((qa: any, idx: number) => 
                `Sual ${idx + 1}: ${qa.question}\nCavab ${idx + 1}: ${qa.answer}`
              ).join('\n\n')
            : 'İlk sualdır.';

        // Prompt
        const prompt = `You are an expert AI interviewer conducting a voice interview for a ${levelName} ${positionName} position.

CANDIDATE CV INFORMATION:
- Name: ${candidateName}
- Experience: ${experienceSummary || 'No experience'}
- Skills: ${skillsList || 'No skills'}

CONVERSATION SO FAR:
${conversationHistory}

Generate the NEXT question (Question ${questionIndex + 1} of 5) in Azerbaijani language.

IMPORTANT:
1. This is question ${questionIndex + 1} of 5
2. Base the question on their CV information
3. Consider previous questions and answers to avoid repetition
4. Make it conversational and natural for VOICE interview
5. Keep it concise and clear (1-2 sentences max)
6. Progress in difficulty: Question 1 is easiest, Question 5 is hardest

${questionIndex === 0 ? 'Start with a warm greeting and easy introductory question.' : ''}
${questionIndex === 4 ? 'This is the final question - make it challenging and comprehensive.' : ''}

Return ONLY the question text in Azerbaijani, nothing else. No JSON, no formatting.`;

        console.log(`🎙️ Voice Question ${questionIndex + 1} for:`, candidateName);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const question = response.text().trim();

        console.log('✅ Generated voice question:', question.substring(0, 100));

        return NextResponse.json({
            success: true,
            question,
            questionIndex,
        });

    } catch (error) {
        console.error('❌ Voice question error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Xəta baş verdi' 
            },
            { status: 500 }
        );
    }
}
