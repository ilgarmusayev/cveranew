import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

// Type definitions for CV data structures
interface Experience {
  id?: string;
  company?: string;
  position?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  id?: string;
  institution?: string;
  school?: string;
  degree?: string;
  qualification?: string;
  field?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  gpa?: string;
}

interface Project {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  technologies?: string;
  skills?: string;
  startDate?: string;
  endDate?: string;
}

interface Certification {
  id?: string;
  name?: string;
  issuer?: string;
  date?: string;
  description?: string;
}

interface VolunteerExperience {
  id?: string;
  role?: string;
  organization?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
}

const prisma = new PrismaClient();
const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    // Get JWT token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('token')?.value ||
                  request.cookies.get('auth-token')?.value ||
                  request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the JWT token
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { cvId } = await request.json();

    if (!cvId) {
      return NextResponse.json({ error: 'CV ID is required' }, { status: 400 });
    }

    // Check user tier - AI skills suggestions are for Premium and Medium users
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tier: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can use AI features
    const canUseAI = user.tier === 'Premium' || user.tier === 'Medium';
    if (!canUseAI) {
      return NextResponse.json({
        error: 'AI skill suggestions are available for Premium and Medium subscribers only'
      }, { status: 403 });
    }

    // Get CV data
    const cv = await prisma.cV.findUnique({
      where: { id: cvId, userId: payload.userId },
      select: { cv_data: true }
    });

    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 });
    }

    const cvData = cv.cv_data as any;

    // Extract relevant data for AI analysis
    const personalInfo = cvData.personalInfo || {};
    const experience: Experience[] = cvData.experience || [];
    const education: Education[] = cvData.education || [];
    const currentSkills = cvData.skills || [];
    const projects: Project[] = cvData.projects || [];
    const certifications: Certification[] = cvData.certifications || [];
    const volunteerExperience: VolunteerExperience[] = cvData.volunteerExperience || [];

    // Calculate professional profile metrics for better analysis
    const totalExperienceYears = calculateExperienceYears(experience);
    const seniorityLevel = determineSeniorityLevel(totalExperienceYears, experience);
    const industryFocus = determineIndustryFocus(experience, education, projects);
    const currentSkillCategories = categorizeSkills(currentSkills);

    // Get previous suggestions to ensure variety
    const previousSuggestions = await getPreviousSuggestions(payload.userId, cvId);
    const randomSeed = Date.now(); // For generating different suggestions each time

    // Advanced AI prompt for professional skill analysis
    const prompt = `
      PROFESSIONAL SKILL ANALYSIS & RECOMMENDATION SYSTEM
      =====================================================
      
      Analyze this professional profile and provide 3 strategic skill recommendations that will significantly enhance their career trajectory:

      PROFESSIONAL PROFILE ANALYSIS:
      -----------------------------
      Name: ${personalInfo.fullName || 'Professional'}
      Career Level: ${seniorityLevel} (${totalExperienceYears} years experience)
      Industry Focus: ${industryFocus}
      Professional Summary: ${personalInfo.summary || 'Not provided'}
      
      WORK EXPERIENCE ANALYSIS:
      ------------------------
      Total Experience: ${totalExperienceYears} years
      Number of Positions: ${experience.length}
      ${experience.map((exp, index) => 
        `${index + 1}. ${exp.position || exp.title} at ${exp.company} (${exp.startDate || ''} - ${exp.endDate || 'Present'})
           Duration: ${calculatePositionDuration(exp)}
           Key Responsibilities: ${exp.description || 'No description provided'}
           Industry Context: ${determineCompanyIndustry(exp.company || '', exp.description || '')}`
      ).join('\n')}
      
      EDUCATION & QUALIFICATIONS:
      --------------------------
      ${education.map((edu, index) => 
        `${index + 1}. ${edu.degree || edu.qualification} in ${edu.field || edu.fieldOfStudy}
           Institution: ${edu.institution || edu.school}
           Duration: ${edu.startDate || ''} - ${edu.endDate || ''}
           Academic Focus: ${analyzeEducationRelevance(edu)}`
      ).join('\n')}
      
      CURRENT SKILL PORTFOLIO:
      -----------------------
      Technical Skills: ${currentSkillCategories.technical.join(', ') || 'None specified'}
      Soft Skills: ${currentSkillCategories.soft.join(', ') || 'None specified'}
      Domain Skills: ${currentSkillCategories.domain.join(', ') || 'None specified'}
      Total Skills Count: ${currentSkills.length}
      
      PROJECT PORTFOLIO:
      -----------------
      ${projects.slice(0, 5).map((project, index) => 
        `${index + 1}. ${project.title || project.name}: ${project.description || 'No description'}
           Technologies: ${project.technologies || project.skills || 'Not specified'}
           Timeline: ${project.startDate || ''} - ${project.endDate || ''}`
      ).join('\n')}
      
      CERTIFICATIONS & ACHIEVEMENTS:
      -----------------------------
      ${certifications.map((cert, index) => 
        `${index + 1}. ${cert.name} - ${cert.issuer} (${cert.date})
           Context: ${cert.description || 'Professional certification'}`
      ).join('\n')}
      
      VOLUNTEER & LEADERSHIP:
      ----------------------
      ${volunteerExperience.map((vol, index) => 
        `${index + 1}. ${vol.role} at ${vol.organization}
           Cause: ${vol.cause || 'Community service'}
           Duration: ${vol.startDate || ''} - ${vol.endDate || ''}`
      ).join('\n')}
      
      MARKET CONTEXT & TRENDS:
      -----------------------
      Current Year: 2025
      Industry Trends: AI/ML, Digital Transformation, Remote Work, Sustainability
      Emerging Technologies: Quantum Computing, Edge Computing, 5G, IoT, Blockchain
      Leadership Focus: Emotional Intelligence, Change Management, Digital Leadership
      
      PREVIOUS SUGGESTIONS (to avoid repetition):
      ------------------------------------------
      ${previousSuggestions.map(s => `- ${s.name}: ${s.reason}`).join('\n')}
      
      RANDOMIZATION SEED: ${randomSeed}
      
      PROFESSIONAL SKILL RECOMMENDATION REQUIREMENTS:
      ==============================================
      
      ${user.tier === 'Premium' ? `
      PREMIUM ANALYSIS (Executive/Senior Level):
      1. Focus on STRATEGIC and LEADERSHIP skills that align with C-level responsibilities
      2. Include EMERGING TECHNOLOGY skills that are shaping the future of their industry
      3. Emphasize CROSS-FUNCTIONAL skills that bridge departments and drive organizational growth
      4. Consider DIGITAL TRANSFORMATION and INNOVATION capabilities
      5. Include STAKEHOLDER MANAGEMENT and BUSINESS DEVELOPMENT skills
      6. Focus on skills that position them for executive roles and board positions
      ` : `
      MEDIUM ANALYSIS (Professional Level):
      1. Focus on CAREER ADVANCEMENT skills that lead to senior roles
      2. Include IN-DEMAND technical skills that increase market value
      3. Emphasize SPECIALIZATION skills that make them subject matter experts
      4. Consider COLLABORATION and PROJECT MANAGEMENT capabilities
      5. Include INDUSTRY-SPECIFIC skills that are currently trending
      6. Focus on skills that differentiate them from peers
      `}
      
      ANALYSIS CRITERIA:
      1. **Career Progression Logic**: Suggest skills that logically advance their career trajectory
      2. **Industry Relevance**: Must be highly relevant to their industry and role progression
      3. **Market Demand**: Skills should be in high demand in current job market (2025)
      4. **Skill Gap Analysis**: Identify missing skills that would complete their professional profile
      5. **Future-Proofing**: Include skills that will remain relevant for next 5-10 years
      6. **Differentiation**: Skills that set them apart from competitors in their field
      7. **Measurable Impact**: Skills that can demonstrably improve their professional value
      
      RESPONSE FORMAT:
      ===============
      Return EXACTLY 3 skills in this JSON format (no additional text or formatting):
      
      {
        "skills": [
          {
            "name": "Skill Name (be specific, use industry standard terminology)",
            "category": "Technical|Soft|Domain|Leadership|Strategic",
            "relevanceScore": "1-10 (how relevant to their profile)",
            "marketDemand": "High|Very High|Critical",
            "careerImpact": "Advancement|Specialization|Leadership|Innovation",
            "reason": "Professional explanation in Azerbaijani (2-3 sentences) explaining: 1) Why this specific skill is strategic for their career, 2) How it builds on their existing experience, 3) What specific opportunities it opens up. Use professional terminology and be specific about career benefits.",
            "implementation": "Practical 1-sentence advice on how to develop this skill",
            "timeToMaster": "3-6 months|6-12 months|1-2 years",
            "industryTrend": "Emerging|Growing|Essential|Future-Critical"
          }
        ]
      }
      
      IMPORTANT CONSTRAINTS:
      - Do NOT suggest skills already in their current skill list: ${currentSkills.map((s: any) => s.name).join(', ')}
      - Each suggestion must be strategically different from previous suggestions
      - Use randomization seed ${randomSeed} to ensure variety in each response
      - Skills must be appropriate for their seniority level (${seniorityLevel})
      - Focus on ${industryFocus} industry context
      - Consider their ${totalExperienceYears} years of experience
      - Prioritize skills that bridge their experience gaps
      - Include at least one emerging technology skill if relevant to their field
      - Make recommendations that would impress hiring managers in their industry
    `;

    console.log('🤖 Generating Advanced AI skill suggestions for user:', user.name);
    console.log('📊 Profile Analysis:', {
      seniorityLevel,
      industryFocus,
      experienceYears: totalExperienceYears,
      skillCategories: currentSkillCategories
    });

    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();

    console.log('🔍 AI Response:', aiResponse);

    // Parse AI response
    let suggestedSkills;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      suggestedSkills = JSON.parse(jsonMatch[0]);

      if (!suggestedSkills.skills || !Array.isArray(suggestedSkills.skills) || suggestedSkills.skills.length !== 3) {
        throw new Error('Invalid AI response format');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);

      // Advanced fallback suggestions based on profile analysis
      const fallbackSkills = generateFallbackSuggestions(user.tier, seniorityLevel, industryFocus, currentSkills, randomSeed);
      suggestedSkills = { skills: fallbackSkills };
    }

    // Save suggestion for future reference and analytics
    await saveSuggestionSession(payload.userId, cvId, suggestedSkills.skills, {
      seniorityLevel,
      industryFocus,
      experienceYears: totalExperienceYears,
      randomSeed
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestedSkills.skills,
      profileAnalysis: {
        seniorityLevel,
        industryFocus,
        experienceYears: totalExperienceYears
      }
    });

  } catch (error) {
    console.error('❌ AI skills suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate skill suggestions' },
      { status: 500 }
    );
  }
}

// Helper functions for professional analysis
function calculateExperienceYears(experience: any[]): number {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;
  const currentDate = new Date();

  experience.forEach(exp => {
    const startDate = parseDate(exp.startDate);
    const endDate = exp.current || !exp.endDate ? currentDate : parseDate(exp.endDate);

    if (startDate && endDate) {
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth());
      totalMonths += Math.max(0, months);
    }
  });

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

function parseDate(dateString: string): Date | null {
  if (!dateString) return null;

  // Try different date formats
  const formats = [
    /(\w+)\s+(\d{4})/,  // "Jan 2023"
    /(\d{1,2})\/(\d{4})/, // "01/2023"
    /(\d{4})-(\d{1,2})/, // "2023-01"
    /(\d{4})/            // "2023"
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[3]) { // Year only
        return new Date(parseInt(match[1]), 0, 1);
      } else if (format === formats[0]) { // Month Year
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                           'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.findIndex(m =>
          match[1].toLowerCase().startsWith(m));
        return new Date(parseInt(match[2]), monthIndex >= 0 ? monthIndex : 0, 1);
      }
    }
  }

  return null;
}

function determineSeniorityLevel(years: number, experience: any[]): string {
  if (years >= 15) return 'Executive/C-Level';
  if (years >= 10) return 'Senior Professional';
  if (years >= 5) return 'Mid-Level Professional';
  if (years >= 2) return 'Professional';
  return 'Junior Professional';
}

function determineIndustryFocus(experience: any[], education: any[], projects: any[]): string {
  const keywords = {
    'Technology/Software': ['software', 'developer', 'engineer', 'tech', 'programming', 'coding', 'it', 'digital'],
    'Finance/Banking': ['finance', 'bank', 'investment', 'accounting', 'financial', 'analyst'],
    'Healthcare/Medical': ['health', 'medical', 'hospital', 'clinic', 'pharmaceutical', 'biotech'],
    'Marketing/Sales': ['marketing', 'sales', 'advertising', 'brand', 'social media', 'seo'],
    'Education/Academic': ['education', 'teacher', 'professor', 'university', 'school', 'training'],
    'Consulting/Advisory': ['consultant', 'advisory', 'strategy', 'business', 'management'],
    'Manufacturing/Engineering': ['manufacturing', 'production', 'mechanical', 'civil', 'industrial'],
    'Media/Creative': ['media', 'design', 'creative', 'content', 'graphic', 'video'],
  };

  const allText = [
    ...experience.map(exp => `${exp.position} ${exp.company} ${exp.description}`),
    ...education.map(edu => `${edu.degree} ${edu.field} ${edu.institution}`),
    ...projects.map(proj => `${proj.name} ${proj.description}`)
  ].join(' ').toLowerCase();

  for (const [industry, keywordList] of Object.entries(keywords)) {
    const matches = keywordList.filter(keyword => allText.includes(keyword));
    if (matches.length >= 2) return industry;
  }

  return 'General Business';
}

function categorizeSkills(skills: any[]): { technical: string[], soft: string[], domain: string[] } {
  const technical: string[] = [];
  const soft: string[] = [];
  const domain: string[] = [];

  const technicalKeywords = ['programming', 'software', 'database', 'cloud', 'ai', 'machine learning', 'python', 'java', 'javascript'];
  const softKeywords = ['leadership', 'communication', 'management', 'teamwork', 'problem solving'];

  skills.forEach(skill => {
    const skillName = (skill.name || skill).toLowerCase();

    if (technicalKeywords.some(keyword => skillName.includes(keyword))) {
      technical.push(skill.name || skill);
    } else if (softKeywords.some(keyword => skillName.includes(keyword))) {
      soft.push(skill.name || skill);
    } else {
      domain.push(skill.name || skill);
    }
  });

  return { technical, soft, domain };
}

async function getPreviousSuggestions(userId: string, cvId: string): Promise<any[]> {
  try {
    const recentSuggestions = await prisma.importSession.findMany({
      where: {
        userId,
        type: 'ai_skills_suggested',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    const suggestions: any[] = [];
    recentSuggestions.forEach(session => {
      try {
        const sessionData = JSON.parse(session.data);
        if (sessionData.suggestedSkills) {
          suggestions.push(...sessionData.suggestedSkills);
        }
      } catch (e) {
        console.error('Error parsing previous suggestion:', e);
      }
    });

    return suggestions;
  } catch (error) {
    console.error('Error getting previous suggestions:', error);
    return [];
  }
}

function generateFallbackSuggestions(tier: string, seniority: string, industry: string, currentSkills: any[], randomSeed: number): any[] {
  const skillSets: Record<string, Record<string, any[]>> = {
    'Executive/C-Level': {
      'Technology/Software': [
        { name: "Digital Transformation Strategy", reason: "C-level texnologiya liderliyi üçün rəqəmsal transformasiya strategiyası vacibdir. Şirkəti gələcəkə hazırlayır." },
        { name: "AI/ML Strategy & Governance", reason: "AI dövründə strateji qərarlar vermək üçün süni intellekt idarəetməsi kritik bacarıqdır." },
        { name: "Quantum Computing Awareness", reason: "Gələcək texnologiyaları üçün kvant hesablama bilgisi rəqabət üstünlüyü verir." }
      ],
      'Finance/Banking': [
        { name: "FinTech Innovation Leadership", reason: "Maliyyə sektorunda innovasiya liderliyi bank rəhbərliyi üçün həlledici faktordur." },
        { name: "Regulatory Compliance Strategy", reason: "Maliyyə tənzimləmələrində strateji yanaşma senior rəhbərlik üçün vacibdir." },
        { name: "Digital Banking Transformation", reason: "Rəqəmsal bankçılıq transformasiyası maliyyə liderliyi üçün kritik bacarıqdır." }
      ]
    },
    'Senior Professional': {
      'Technology/Software': [
        { name: "Cloud Architecture Design", reason: "Senior texnologiya mütəxəssisləri üçün cloud arxitektura dizaynı əsas bacarıqdır." },
        { name: "DevOps & CI/CD Pipeline", reason: "Müasir software development üçün DevOps metodları mütləq tələb olunur." },
        { name: "Microservices Architecture", reason: "Böyük miqyaslı sistemlər üçün mikroservis arxitekturası kritik bacarıqdır." }
      ]
    }
  };

  // Use random seed to select different suggestions each time
  const random = new Date(randomSeed).getTime() % 1000;
  const availableSkills = skillSets[seniority]?.[industry] || skillSets['Senior Professional']['Technology/Software'];

  // Shuffle and select 3 different skills based on seed
  const shuffled = availableSkills.sort(() => (random % 2) - 0.5);
  return shuffled.slice(0, 3).map(skill => ({
    ...skill,
    category: 'Strategic',
    relevanceScore: 9,
    marketDemand: 'Very High',
    careerImpact: 'Leadership'
  }));
}

async function saveSuggestionSession(userId: string, cvId: string, suggestions: any[], analysis: any): Promise<void> {
  try {
    await prisma.importSession.create({
      data: {
        userId,
        type: 'ai_skills_suggested',
        data: JSON.stringify({
          cvId,
          suggestedSkills: suggestions,
          profileAnalysis: analysis,
          timestamp: new Date().toISOString()
        }),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });
  } catch (error) {
    console.error('Error saving suggestion session:', error);
  }
}

// Additional helper functions...
function calculatePositionDuration(experience: any): string {
  const startDate = parseDate(experience.startDate);
  const endDate = experience.current ? new Date() : parseDate(experience.endDate);

  if (!startDate) return 'Duration not specified';
  if (!endDate) return `Since ${experience.startDate}`;

  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                (endDate.getMonth() - startDate.getMonth());

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${months} months`;
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}

function determineCompanyIndustry(company: string, description: string): string {
  const text = `${company} ${description}`.toLowerCase();

  if (text.includes('bank') || text.includes('financial')) return 'Banking/Finance';
  if (text.includes('tech') || text.includes('software')) return 'Technology';
  if (text.includes('health') || text.includes('medical')) return 'Healthcare';
  if (text.includes('education') || text.includes('university')) return 'Education';

  return 'General Business';
}

function analyzeEducationRelevance(education: any): string {
  const field = (education.field || '').toLowerCase();

  if (field.includes('computer') || field.includes('software')) return 'Technology-focused';
  if (field.includes('business') || field.includes('management')) return 'Business-oriented';
  if (field.includes('engineer')) return 'Engineering discipline';
  if (field.includes('finance') || field.includes('economic')) return 'Finance-related';

  return 'General academic background';
}
