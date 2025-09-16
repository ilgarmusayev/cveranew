import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface CVDataForSummary {
  personalInfo: {
    fullName: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  experience?: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    startDate: string;
    endDate?: string;
  }>;
  skills?: Array<{
    name: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
  }>;
}

/**
 * Generate professional summary using Gemini AI based on CV data
 */
export async function generateProfessionalSummary(cvData: CVDataForSummary): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create a comprehensive prompt based on CV data
    const prompt = createSummaryPrompt(cvData);
    
    console.log('🤖 Gemini AI ilə professional summary yaradılır...');
    console.log('📝 Prompt:', prompt.substring(0, 200) + '...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log('✅ Professional summary yaradıldı:', summary.substring(0, 100) + '...');
    
    return summary.trim();
  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    
    // Fallback: Generate basic summary from data
    return generateFallbackSummary(cvData);
  }
}

/**
 * Create detailed prompt for Gemini AI
 */
function createSummaryPrompt(cvData: CVDataForSummary): string {
  const { personalInfo, experience, education, skills, projects } = cvData;
  
  let prompt = `Aşağıdaki CV məlumatlarına əsasən professional və cəlbedici bir career summary (professional summary) yazın. Summary Azərbaycan dilində olmalıdır və maksimum 3-4 cümlə olmalıdır. Formal və professional ton istifadə edin.

Şəxsi məlumatlar:
- Ad: ${personalInfo.fullName}`;

  if (personalInfo.linkedin) prompt += `\n- LinkedIn: ${personalInfo.linkedin}`;
  if (personalInfo.github) prompt += `\n- GitHub: ${personalInfo.github}`;
  if (personalInfo.website) prompt += `\n- Website: ${personalInfo.website}`;

  if (experience && experience.length > 0) {
    prompt += `\n\nİş təcrübəsi:`;
    experience.slice(0, 3).forEach((exp, index) => {
      prompt += `\n${index + 1}. ${exp.position} - ${exp.company}`;
      if (exp.description) {
        prompt += `\n   Təsvir: ${exp.description.substring(0, 200)}`;
      }
    });
  }

  if (education && education.length > 0) {
    prompt += `\n\nTəhsil:`;
    education.forEach((edu, index) => {
      prompt += `\n${index + 1}. ${edu.degree} - ${edu.institution}`;
    });
  }

  if (skills && skills.length > 0) {
    prompt += `\n\nBacarıqlar: ${skills.map(s => s.name).join(', ')}`;
  }

  if (projects && projects.length > 0) {
    prompt += `\n\nLayihələr:`;
    projects.slice(0, 2).forEach((project, index) => {
      prompt += `\n${index + 1}. ${project.name}`;
      if (project.description) {
        prompt += ` - ${project.description.substring(0, 100)}`;
      }
      if (project.technologies && project.technologies.length > 0) {
        prompt += ` (Texnologiyalar: ${project.technologies.join(', ')})`;
      }
    });
  }

  prompt += `\n\nXahiş edirəm bu məlumatlara əsasən professional və cəlbedici career summary yazın. Summary aşağıdaki kriteriyalara uyğun olmalıdır:
1. Azərbaycan dilində olsun
2. Maksimum 3-4 cümlə olsun
3. Şəxsin əsas bacarıqlarını və təcrübəsini vurğulasın
4. İş axtarışında faydalı olsun
5. Professional və formal ton istifadə edin
6. Məlumatları yaratıcı şəkildə birləşdirin

Yalnız summary mətnini qaytarın, başqa heç nə əlavə etməyin.`;

  return prompt;
}

/**
 * Generate fallback summary when AI fails
 */
function generateFallbackSummary(cvData: CVDataForSummary): string {
  const { personalInfo, experience, education, skills } = cvData;
  
  let summary = `${personalInfo.fullName} - `;
  
  // Add experience info
  if (experience && experience.length > 0) {
    const latestJob = experience[0];
    summary += `${latestJob.position} sahəsində təcrübəli mütəxəssis. `;
    
    if (experience.length > 1) {
      summary += `${experience.length} müxtəlif şirkətdə iş təcrübəsi var. `;
    }
  }
  
  // Add education
  if (education && education.length > 0) {
    const latestEdu = education[0];
    summary += `${latestEdu.institution}-də təhsil alıb. `;
  }
  
  // Add skills
  if (skills && skills.length > 0) {
    const topSkills = skills.slice(0, 3).map(s => s.name).join(', ');
    summary += `${topSkills} sahələrində bacarıqlıdır. `;
  }
  
  summary += `Yeni imkanlar və qarşıdakı çağırışlar üçün hazırdır.`;
  
  return summary;
}

/**
 * Validate if user has AI access for AI features (any paid tier)
 */
export function canUseAIFeatures(userTier: string): boolean {
  const tier = userTier.toLowerCase();
  return tier !== 'free' && tier !== 'pulsuz';
}

/**
 * Get AI feature availability message for user
 */
export function getAIFeatureMessage(userTier: string): string {
  if (canUseAIFeatures(userTier)) {
    return 'AI-powered professional summary mövcuddur!';
  }
  
  return 'AI professional summary ödənişli planlar üçün mövcuddur. Planınızı yüksəldin!';
}
