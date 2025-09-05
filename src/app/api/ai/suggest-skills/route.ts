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
  description?: string;
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

// Helper function to extract technical keywords from CV
function extractTechnicalKeywords(cvData: any): string[] {
  const keywords: Set<string> = new Set();
  
  // Extract from experience descriptions
  (cvData.experience || []).forEach((exp: any) => {
    if (exp.description) {
      const techTerms = exp.description.match(/\b(JavaScript|Python|Java|React|Angular|Vue|Node|Django|Flask|SQL|MongoDB|AWS|Azure|Docker|Kubernetes|Git|API|REST|GraphQL|HTML|CSS|TypeScript|PostgreSQL|MySQL|Redis|Jenkins|Terraform|CI\/CD|Agile|Scrum|DevOps|Machine Learning|AI|Data Science|TensorFlow|PyTorch|Pandas|NumPy|Tableau|Power BI|Excel|Photoshop|Figma|Adobe|Unity|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|Flutter|Dart|Blockchain|Solidity|Ethereum|Bitcoin|Cloud|Microservices|Serverless|Lambda|S3|EC2|RDS|ElasticSearch|Kafka|RabbitMQ|NGINX|Apache|Linux|Windows|macOS|Android|iOS|Mobile|Web|Frontend|Backend|Fullstack|Database|Network|Security|Testing|Jest|Cypress|Selenium|Automation|Analytics|Google Analytics|SEO|SEM|Marketing|CRM|Salesforce|HubSpot|Slack|Jira|Confluence|Notion|Trello)\b/gi);
      if (techTerms) {
        techTerms.forEach((term: string) => keywords.add(term.toLowerCase()));
      }
    }
  });
  
  // Extract from projects
  (cvData.projects || []).forEach((proj: any) => {
    if (proj.technologies) {
      // Handle both string and array formats
      const techString = Array.isArray(proj.technologies) 
        ? proj.technologies.join(', ') 
        : typeof proj.technologies === 'string' 
        ? proj.technologies 
        : String(proj.technologies);
        
      techString.split(/[,;]/).forEach((tech: string) => {
        const cleanTech = tech.trim().toLowerCase();
        if (cleanTech.length > 2) keywords.add(cleanTech);
      });
    }
    if (proj.skills) {
      // Also check for 'skills' field in projects
      const skillsString = Array.isArray(proj.skills) 
        ? proj.skills.join(', ') 
        : typeof proj.skills === 'string' 
        ? proj.skills 
        : String(proj.skills);
        
      skillsString.split(/[,;]/).forEach((tech: string) => {
        const cleanTech = tech.trim().toLowerCase();
        if (cleanTech.length > 2) keywords.add(cleanTech);
      });
    }
    if (proj.description) {
      const techTerms = proj.description.match(/\b(JavaScript|Python|Java|React|Angular|Vue|Node|Django|Flask|SQL|MongoDB|AWS|Azure|Docker|Kubernetes|Git|API|REST|GraphQL|HTML|CSS|TypeScript|PostgreSQL|MySQL|Redis|Jenkins|Terraform|CI\/CD|Agile|Scrum|DevOps|Machine Learning|AI|Data Science|TensorFlow|PyTorch|Pandas|NumPy|Tableau|Power BI|Excel|Photoshop|Figma|Adobe|Unity|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|Flutter|Dart|Blockchain|Solidity|Ethereum|Bitcoin|Cloud|Microservices|Serverless|Lambda|S3|EC2|RDS|ElasticSearch|Kafka|RabbitMQ|NGINX|Apache|Linux|Windows|macOS|Android|iOS|Mobile|Web|Frontend|Backend|Fullstack|Database|Network|Security|Testing|Jest|Cypress|Selenium|Automation|Analytics|Google Analytics|SEO|SEM|Marketing|CRM|Salesforce|HubSpot|Slack|Jira|Confluence|Notion|Trello)\b/gi);
      if (techTerms) {
        techTerms.forEach((term: string) => keywords.add(term.toLowerCase()));
      }
    }
  });
  
  // Extract from education field
  (cvData.education || []).forEach((edu: any) => {
    if (edu.field || edu.fieldOfStudy) {
      const field = (edu.field || edu.fieldOfStudy).toLowerCase();
      if (field.includes('computer') || field.includes('software') || field.includes('engineering') || 
          field.includes('data') || field.includes('technology') || field.includes('information')) {
        keywords.add(field);
      }
    }
  });
  
  return Array.from(keywords);
}

// New function to generate CV-based skill suggestions with strict relevance
function generateCVBasedSkillSuggestions(cvData: any, existingSkills: any[], previousSuggestions: any[]): string[] {
  const suggestions: string[] = [];
  const technicalKeywords = extractTechnicalKeywords(cvData);
  const industryContext = determineIndustryContext(cvData.experience || [], cvData.education || []);
  
  // Get all already known skills to avoid repetition
  const existingSkillNames = existingSkills.map(s => s.name?.toLowerCase()).filter(Boolean);
  const previousSkillNames = previousSuggestions.map(s => s.name?.toLowerCase()).filter(Boolean);
  const allKnownSkills = [...existingSkillNames, ...previousSkillNames];
  
  // Define skill mappings based on CV content and industry
  const skillMappings: Record<string, string[]> = {
    'javascript': ['TypeScript', 'Node.js', 'Express.js', 'Next.js', 'Webpack'],
    'react': ['Redux', 'React Native', 'Next.js', 'Material-UI', 'Styled Components'],
    'python': ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy'],
    'java': ['Spring Boot', 'Hibernate', 'Maven', 'Gradle', 'JUnit'],
    'sql': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
    'aws': ['Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD'],
    'data': ['Tableau', 'Power BI', 'Apache Spark', 'Hadoop', 'R'],
    'web': ['Sass', 'Less', 'Bootstrap', 'Tailwind CSS', 'Webpack'],
    'mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin'],
    'design': ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Zeplin'],
    'testing': ['Jest', 'Cypress', 'Selenium', 'Postman', 'JUnit'],
    'backend': ['REST API', 'GraphQL', 'Microservices', 'WebSocket', 'gRPC'],
    'devops': ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'Ansible'],
    'cloud': ['AWS Lambda', 'Azure Functions', 'Google Cloud', 'Serverless', 'CDN']
  };
  
  // Generate suggestions based on CV content
  technicalKeywords.forEach(keyword => {
    const relatedSkills = skillMappings[keyword.toLowerCase()] || [];
    relatedSkills.forEach(skill => {
      if (!allKnownSkills.includes(skill.toLowerCase()) && !suggestions.includes(skill)) {
        suggestions.push(skill);
      }
    });
  });
  
  // Add industry-specific suggestions if CV content supports it
  if (industryContext === 'Software Development') {
    const webDevSkills = ['GraphQL', 'REST API', 'Microservices', 'Docker', 'Kubernetes'];
    webDevSkills.forEach(skill => {
      if (!allKnownSkills.includes(skill.toLowerCase()) && !suggestions.includes(skill)) {
        suggestions.push(skill);
      }
    });
  }
  
  return suggestions.slice(0, 10); // Return top 10 relevant suggestions
}

// Helper function to determine industry context
function determineIndustryContext(experience: any[], education: any[]): string {
  const allText = [
    ...experience.map(exp => `${exp.position} ${exp.company} ${exp.description || ''}`),
    ...education.map(edu => `${edu.field || edu.fieldOfStudy || ''} ${edu.degree || ''}`)
  ].join(' ').toLowerCase();
  
  if (allText.includes('software') || allText.includes('developer') || allText.includes('programmer') || allText.includes('engineer')) {
    return 'Software Development';
  } else if (allText.includes('data') || allText.includes('analyst') || allText.includes('science')) {
    return 'Data Science & Analytics';
  } else if (allText.includes('design') || allText.includes('ui') || allText.includes('ux') || allText.includes('graphic')) {
    return 'Design & Creative';
  } else if (allText.includes('marketing') || allText.includes('sales') || allText.includes('digital')) {
    return 'Digital Marketing';
  } else if (allText.includes('manager') || allText.includes('project') || allText.includes('product')) {
    return 'Project/Product Management';
  } else if (allText.includes('finance') || allText.includes('accounting') || allText.includes('bank')) {
    return 'Finance & Banking';
  } else {
    return 'Technology & Business';
  }
}

const prisma = new PrismaClient();
const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Gemini API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('🔑 Gemini API Key length:', process.env.GEMINI_API_KEY?.length || 0);
    
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

    console.log('🔐 JWT payload:', { userId: payload.userId });
    console.log('🔐 Token verification successful');

    const requestBody = await request.json();
    console.log('📨 Request body:', requestBody);

    // Try to get CV ID from request or find user's latest CV
    let cvId = requestBody.cvId;
    
    if (!cvId) {
      // If no CV ID provided, get user's latest CV
      const latestCV = await prisma.cV.findFirst({
        where: { userId: payload.userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      });
      
      if (latestCV) {
        cvId = latestCV.id;
        console.log('📋 Using latest CV ID:', cvId);
      }
    }

    if (!cvId) {
      return NextResponse.json({ error: 'No CV found. Please create a CV first.' }, { status: 400 });
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

    // Get previous suggestions to ensure variety (increased to last 30 days for more variety)
    const previousSuggestions = await getPreviousSuggestions(payload.userId, cvId);
    const randomSeed = Date.now() + Math.random() * 1000; // Enhanced randomization
    
    // Extract technical keywords from CV to guide suggestions
    const technicalKeywords = extractTechnicalKeywords(cvData);
    const jobRoles = experience.map(exp => exp.position || exp.title).filter(Boolean);
    const industryContext = determineIndustryContext(experience, education);
    
    // Generate CV-based skill suggestions
    const cvBasedSuggestions = generateCVBasedSkillSuggestions(cvData, currentSkills, previousSuggestions);
    
    console.log('🔍 DEBUG - Technical Keywords:', technicalKeywords);
    console.log('🔍 DEBUG - CV-Based Suggestions:', cvBasedSuggestions);
    console.log('🔍 DEBUG - Previous Suggestions:', previousSuggestions);
    console.log('🔍 DEBUG - Current Skills:', currentSkills.map((s: any) => s.name));
    
    // If no CV-based suggestions found, return error
    if (cvBasedSuggestions.length === 0) {
      console.log('❌ DEBUG - No CV-based suggestions found');
      return NextResponse.json({
        error: 'CV-də kifayət qədər texniki məlumat tapılmadı. Təcrübə, layihə və ya təhsil məlumatlarında texnologiyalar qeyd edin.',
        suggestions: []
      }, { status: 400 });
    }

    // Advanced AI prompt for professional skill analysis - Updated Structure
    const cvLanguage = cvData.cvLanguage === 'english' ? 'English' : 'Azerbaijani';
    
    const prompt = `
Analyze the following CV and suggest exactly 8 skills: 4 hard skills and 4 soft skills.

CV CONTENT ANALYSIS:
===================

WORK EXPERIENCE:
${experience.map((exp, index) => 
  `${index + 1}. ${exp.position || exp.title} at ${exp.company || 'Unknown Company'}
     Description: ${exp.description || 'No description'}`
).join('\n')}

EDUCATION:
${education.map((edu, index) => 
  `${index + 1}. ${edu.degree || edu.qualification} in ${edu.field || edu.fieldOfStudy}
     School: ${edu.institution || edu.school}`
).join('\n')}

PROJECTS:
${projects.map((proj, index) => 
  `${index + 1}. ${proj.title || proj.name}
     Description: ${proj.description || 'No description'}
     Technologies: ${Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || proj.skills || 'Not specified'}`
).join('\n')}

REQUIREMENTS:
- Suggest exactly 4 hard skills (technical, programming, tools)
- Suggest exactly 4 soft skills (communication, leadership, etc.)
- All skills must be relevant to the CV content
- Output in ${cvLanguage} language
- Do not repeat these existing skills: ${currentSkills.map((s: any) => s.name).join(', ')}
- Do not repeat these previous suggestions: ${previousSuggestions.map(s => s.name).join(', ')}

OUTPUT FORMAT (JSON only):
{
  "skills": [
    {
      "name": "Skill name",
      "category": "Hard",
      "relevanceScore": "9",
      "reason": "Why relevant (in ${cvLanguage})",
      "cvConnection": "CV connection"
    },
    {
      "name": "Skill name",
      "category": "Soft", 
      "relevanceScore": "9",
      "reason": "Why relevant (in ${cvLanguage})",
      "cvConnection": "CV connection"
    }
  ]
}

Randomization: ${randomSeed}
    `;

    console.log('📝 Prompt length:', prompt.length);
    console.log('📝 Prompt preview (first 300 chars):', prompt.substring(0, 300));

    console.log('🤖 Generating Advanced AI skill suggestions for user:', user.name);
    console.log('📊 Profile Analysis:', {
      seniorityLevel,
      industryFocus,
      experienceYears: totalExperienceYears,
      skillCategories: currentSkillCategories
    });

    console.log('🚀 Making Gemini AI request...');
    const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();
    console.log('✅ Gemini AI response received successfully');

    console.log('🔍 AI Response:', aiResponse);

    // Parse AI response
    let suggestedSkills;
    try {
      console.log('🔍 Raw AI Response length:', aiResponse.length);
      console.log('🔍 AI Response preview:', aiResponse.substring(0, 500));
      
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in AI response. Full response:', aiResponse);
        throw new Error('No JSON found in AI response');
      }

      console.log('🔍 Extracted JSON:', jsonMatch[0].substring(0, 200) + '...');
      suggestedSkills = JSON.parse(jsonMatch[0]);

      if (!suggestedSkills.skills || !Array.isArray(suggestedSkills.skills) || suggestedSkills.skills.length !== 8) {
        console.error('❌ Invalid AI response format. Expected 8 skills, got:', suggestedSkills?.skills?.length);
        console.error('❌ Skills received:', suggestedSkills?.skills);
        throw new Error('Invalid AI response format - expected 8 skills');
      }
      
      // Validate that we have 4 hard and 4 soft skills
      const hardSkills = suggestedSkills.skills.filter((s: any) => s.category === 'Hard');
      const softSkills = suggestedSkills.skills.filter((s: any) => s.category === 'Soft');
      
      if (hardSkills.length !== 4 || softSkills.length !== 4) {
        console.error('❌ Invalid skill distribution. Hard:', hardSkills.length, 'Soft:', softSkills.length);
        throw new Error('Invalid skill distribution - need 4 hard and 4 soft skills');
      }
      
      console.log('✅ Successfully parsed AI response with', suggestedSkills.skills.length, 'skills');
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

    console.log('✅ Final suggestions being returned:', suggestedSkills.skills);

    return NextResponse.json({
      success: true,
      suggestions: suggestedSkills.skills,
      profileAnalysis: {
        seniorityLevel,
        industryFocus,
        experienceYears: totalExperienceYears
      },
      debug: {
        cvBasedSuggestionsCount: cvBasedSuggestions.length,
        technicalKeywordsCount: technicalKeywords.length,
        previousSuggestionsCount: previousSuggestions.length
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
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days - increased from 7 days
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Increased from 5 to track more previous suggestions
    });

    const suggestions: any[] = [];
    recentSuggestions.forEach((session: any) => {
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
  const hardSkillSets: Record<string, Record<string, any[]>> = {
    'Executive/C-Level': {
      'Technology/Software': [
        { name: "Digital Transformation Strategy", reason: "C-level texnologiya liderliyi üçün rəqəmsal transformasiya strategiyası vacibdir.", category: "Hard" },
        { name: "AI/ML Strategy & Governance", reason: "AI dövründə strateji qərarlar vermək üçün süni intellekt idarəetməsi kritik bacarıqdır.", category: "Hard" },
        { name: "Quantum Computing Awareness", reason: "Gələcək texnologiyaları üçün kvant hesablama bilgisi rəqabət üstünlüyü verir.", category: "Hard" },
        { name: "Enterprise Architecture", reason: "Böyük sistemlər üçün arxitektura dizaynı vacibdir.", category: "Hard" }
      ]
    },
    'Senior Professional': {
      'Technology/Software': [
        { name: "Cloud Architecture Design", reason: "Senior texnologiya mütəxəssisləri üçün cloud arxitektura dizaynı əsas bacarıqdır.", category: "Hard" },
        { name: "DevOps & CI/CD Pipeline", reason: "Müasir software development üçün DevOps metodları mütləq tələb olunur.", category: "Hard" },
        { name: "Microservices Architecture", reason: "Böyük miqyaslı sistemlər üçün mikroservis arxitekturası kritik bacarıqdır.", category: "Hard" },
        { name: "API Design & Management", reason: "Sistem inteqrasiyası üçün API dizaynı əsas bacarıqdır.", category: "Hard" }
      ]
    }
  };

  const softSkillSets = [
    { name: "Strategic Thinking", reason: "Uzunmüddətli planlaşdırma və strateji qərarlar üçün vacibdir.", category: "Soft" },
    { name: "Team Leadership", reason: "Komanda idarəetməsi və motivasiya üçün kritik bacarıqdır.", category: "Soft" },
    { name: "Problem Solving", reason: "Mürəkkəb problemləri həll etmək üçün analitik yanaşma lazımdır.", category: "Soft" },
    { name: "Communication Skills", reason: "Effektiv ünsiyyət və təqdimat bacarıqları vacibdir.", category: "Soft" },
    { name: "Adaptability", reason: "Dəyişikliklərə uyğunlaşma və çeviklik müasir iş mühitində vacibdir.", category: "Soft" },
    { name: "Critical Thinking", reason: "Analitik düşüncə və qərar vermə prosesləri üçün lazımdır.", category: "Soft" }
  ];

  // Select 4 hard skills
  const random = new Date(randomSeed).getTime() % 1000;
  const availableHardSkills = hardSkillSets[seniority]?.[industry] || hardSkillSets['Senior Professional']['Technology/Software'];
  const shuffledHardSkills = availableHardSkills.sort(() => (random % 2) - 0.5);
  const selectedHardSkills = shuffledHardSkills.slice(0, 4);

  // Select 4 soft skills
  const shuffledSoftSkills = softSkillSets.sort(() => ((random + 100) % 2) - 0.5);
  const selectedSoftSkills = shuffledSoftSkills.slice(0, 4);

  // Combine and return 8 skills
  return [
    ...selectedHardSkills.map(skill => ({
      ...skill,
      relevanceScore: 8,
      cvConnection: 'Based on professional level and industry context'
    })),
    ...selectedSoftSkills.map(skill => ({
      ...skill,
      relevanceScore: 8,
      cvConnection: 'Essential for career development and leadership'
    }))
  ];
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
