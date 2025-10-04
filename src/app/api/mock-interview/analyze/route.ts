import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getWorkingGeminiApiKey } from '@/lib/geminiApiKeyService';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

interface Question {
    id: number;
    question: string;
    answer: string;
}

interface AnalysisResult {
    overallScore: number;
    categoryScores: {
        technical: number;
        communication: number;
        confidence: number;
        problemSolving: number;
        relevance: number;
    };
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    generalFeedback: string;
}

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
        const { position, level, questions, cvId } = body as {
            position: string;
            level: string;
            cvId: string;
            questions: Question[];
        };

        if (!position || !level || !questions || questions.length === 0 || !cvId) {
            return NextResponse.json(
                { success: false, error: 'Məlumatlar natamam göndərilib' },
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
                userId: decoded.userId
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
        const skills = cvData.skills || [];
        const candidateName = personalInfo.fullName || personalInfo.firstName || 'Namizəd';
        
        // Təcrübələri formatlayaq
        const experienceSummary = experience.slice(0, 3).map((exp: any) => 
            `${exp.position || ''} at ${exp.company || ''}`
        ).join('; ');

        // Bacarıqları formatlayaq
        const skillsList = skills.slice(0, 10).map((skill: any) => skill.name || skill).join(', ');

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

        const positionName = POSITION_NAMES[position] || position;
        const levelName = LEVEL_NAMES[level] || level;

        // Q&A-ları formatlayaq
        const qaText = questions
            .map((q, idx) => `Sual ${idx + 1}: ${q.question}\nCavab ${idx + 1}: ${q.answer}`)
            .join('\n\n');

        // Analiz promptu - CV məlumatları ilə
        const prompt = `You are an expert HR interviewer analyzing a mock interview for a ${levelName} ${positionName} position.

CANDIDATE BACKGROUND:
- Name: ${candidateName}
- Experience: ${experienceSummary || 'No experience listed'}
- Skills: ${skillsList || 'No skills listed'}

Interview Questions & Answers:
${qaText}

Analyze the candidate's performance considering their actual CV background. 
Provide a detailed evaluation in Azerbaijani language.

IMPORTANT: 
- Compare their answers with their CV experience and skills
- Check if they accurately represented their background
- Evaluate if their knowledge matches their claimed expertise
- Note any inconsistencies between CV and interview answers

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks):
{
  "overallScore": <number 0-100>,
  "categoryScores": {
    "technical": <number 0-10>,
    "communication": <number 0-10>,
    "confidence": <number 0-10>,
    "problemSolving": <number 0-10>,
    "relevance": <number 0-10>
  },
  "strengths": [<array of 3-5 strength points in Azerbaijani, reference their CV where relevant>],
  "weaknesses": [<array of 3-5 weakness points in Azerbaijani, note gaps between CV and answers>],
  "recommendations": [<array of 3-5 improvement recommendations in Azerbaijani, based on their background>],
  "generalFeedback": "<detailed paragraph in Azerbaijani about overall performance, mention how well they represented their CV experience>"
}

Evaluation criteria:
Evaluation criteria:
- Technical: Domain knowledge and technical competence (matches their CV skills?)
- Communication: Clarity, structure, and articulation
- Confidence: Self-assurance and conviction in answers
- Problem Solving: Analytical thinking and approach to challenges
- Relevance: How well answers match the question, role, AND their CV background

Be honest, constructive, and specific. Consider the ${levelName} level expectations and their actual CV experience.
Write everything in natural, professional Azerbaijani language.`;

        console.log('🔍 Analyzing interview for:', candidateName, positionName, levelName);
        console.log('📊 Questions analyzed:', questions.length);

        // Gemini-dən analiz al
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('📝 Raw analysis response:', text);

        // JSON parse et
        let analysisResult: AnalysisResult;
        try {
            // Remove markdown code blocks if present
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            analysisResult = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('Raw text:', text);
            throw new Error('Analiz nəticəsi format xətası');
        }

        // Validasiya
        if (!analysisResult.overallScore || 
            !analysisResult.categoryScores || 
            !analysisResult.strengths || 
            !analysisResult.weaknesses || 
            !analysisResult.recommendations || 
            !analysisResult.generalFeedback) {
            throw new Error('Analiz nəticəsi natamam');
        }

        // Score-ları 0-100 və 0-10 aralığında saxla
        analysisResult.overallScore = Math.min(100, Math.max(0, analysisResult.overallScore));
        Object.keys(analysisResult.categoryScores).forEach(key => {
            const categoryKey = key as keyof typeof analysisResult.categoryScores;
            analysisResult.categoryScores[categoryKey] = Math.min(10, Math.max(0, analysisResult.categoryScores[categoryKey]));
        });

        console.log('✅ Analysis completed:', {
            overallScore: analysisResult.overallScore,
            categoryScores: analysisResult.categoryScores,
            strengthsCount: analysisResult.strengths.length,
            weaknessesCount: analysisResult.weaknesses.length,
            recommendationsCount: analysisResult.recommendations.length,
        });

        return NextResponse.json({
            success: true,
            result: analysisResult,
        });

    } catch (error) {
        console.error('❌ Mock interview analysis error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Analiz zamanı xəta baş verdi' 
            },
            { status: 500 }
        );
    }
}
