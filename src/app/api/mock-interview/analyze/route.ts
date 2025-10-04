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


const LEVEL_NAMES: Record<string, string> = {
    junior: 'Junior',
    mid: 'Middle',
    senior: 'Senior',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { jobDescription, level, questions, cvId, language = 'az' } = body as {
            jobDescription: string;
            level: string;
            cvId: string;
            questions: Question[];
            language?: string;
        };

        if (!jobDescription || !level || !questions || questions.length === 0 || !cvId) {
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
            `${exp.jobDescription || ''} at ${exp.company || ''}`
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

        // Sual-cavabları formatlayaq
        const qaText = questions.map((q, i) => 
            `Question ${i + 1}: ${q.question}\nAnswer: ${q.answer || 'No answer provided'}`
        ).join('\n\n');

        const levelName = LEVEL_NAMES[level] || level;

        // Dil ayarları
        const languageInstructions: Record<string, string> = {
            az: 'Azerbaijani',
            en: 'English',
            ru: 'Russian',
        };

        const feedbackLanguage = languageInstructions[language] || 'Azerbaijani';

        const prompt = `You are an expert HR interviewer analyzing a mock interview.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV INFORMATION:
- Name: ${candidateName}
- Experience: ${experienceSummary || 'No experience listed'}
- Skills: ${skillsList || 'No skills listed'}
- Level: ${levelName}

Interview Questions & Answers:
${qaText}

Analyze the candidate's performance considering:
1. The job requirements from the job description
2. Their actual CV background
3. How well they match the job requirements

Provide a detailed evaluation in ${feedbackLanguage} language.

IMPORTANT: 
- Compare their answers with the job requirements and their CV
- Check if they accurately represented their background
- Evaluate if their knowledge matches the job requirements
- Note any inconsistencies between CV and interview answers
- ALL text fields (strengths, weaknesses, recommendations, generalFeedback) must be in ${feedbackLanguage}

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
  "strengths": [<array of 3-5 strength points in ${feedbackLanguage}>],
  "weaknesses": [<array of 3-5 weakness points in ${feedbackLanguage}>],
  "recommendations": [<array of 3-5 improvement recommendations in ${feedbackLanguage}>],
  "generalFeedback": "<detailed paragraph in ${feedbackLanguage} about overall performance>"
}

Evaluation criteria:
- Technical: Domain knowledge and technical competence (matches job requirements and CV skills?)
- Communication: Clarity, structure, and articulation
- Confidence: Self-assurance and conviction in answers
- Problem Solving: Analytical thinking and approach to challenges
- Relevance: How well answers match the question, job requirements, AND their CV background

Be honest, constructive, and specific. Consider the ${levelName} level expectations.
Write everything in natural, professional Azerbaijani language.`;

        console.log('🔍 Analyzing interview for:', candidateName, levelName);
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
