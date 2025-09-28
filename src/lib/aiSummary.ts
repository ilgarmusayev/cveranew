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
export async function generateProfessionalSummary(cvData: CVDataForSummary, language?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Create a comprehensive prompt based on CV data and language
    const prompt = createSummaryPrompt(cvData, language);
    
    console.log('🤖 Gemini AI ilə professional summary yaradılır...', `Language: ${language || 'azerbaijani'}`);
    console.log('📝 Prompt:', prompt.substring(0, 200) + '...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log('✅ Professional summary yaradıldı:', summary.substring(0, 100) + '...');
    
    return summary.trim();
  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    
    // Fallback: Generate basic summary from data
    return generateFallbackSummary(cvData, language);
  }
}

/**
 * Create detailed prompt for Gemini AI
 */
function createSummaryPrompt(cvData: CVDataForSummary, language?: string): string {
  const { personalInfo, experience, education, skills, projects } = cvData;
  
  // Determine target language
  const targetLang = language?.toLowerCase() || 'azerbaijani';
  const isRussian = targetLang.includes('ru') || targetLang === 'russian';
  const isEnglish = targetLang.includes('en') || targetLang === 'english';
  
  let prompt = '';
  
  if (isRussian) {
    prompt = `На основе следующих данных резюме напишите профессиональное и привлекательное резюме карьеры (professional summary). Резюме должно быть на русском языке и максимум 3-4 предложения. Используйте формальный и профессиональный тон.

Личная информация:
- Имя: ${personalInfo.fullName}`;
  } else if (isEnglish) {
    prompt = `Based on the following CV data, write a professional and engaging career summary. The summary should be in English and maximum 3-4 sentences. Use formal and professional tone.

Personal Information:
- Name: ${personalInfo.fullName}`;
  } else {
    prompt = `Aşağıdaki CV məlumatlarına əsasən professional və cəlbedici bir career summary (professional summary) yazın. Summary Azərbaycan dilində olmalıdır və maksimum 3-4 cümlə olmalıdır. Formal və professional ton istifadə edin.

Şəxsi məlumatlar:
- Ad: ${personalInfo.fullName}`;
  }

  if (personalInfo.linkedin) prompt += `\n- LinkedIn: ${personalInfo.linkedin}`;
  if (personalInfo.github) prompt += `\n- GitHub: ${personalInfo.github}`;
  if (personalInfo.website) prompt += `\n- Website: ${personalInfo.website}`;

  if (experience && experience.length > 0) {
    if (isRussian) {
      prompt += `\n\nОпыт работы:`;
    } else if (isEnglish) {
      prompt += `\n\nWork Experience:`;
    } else {
      prompt += `\n\nİş təcrübəsi:`;
    }
    
    experience.slice(0, 3).forEach((exp, index) => {
      prompt += `\n${index + 1}. ${exp.position} - ${exp.company}`;
      if (exp.description) {
        const descLabel = isRussian ? 'Описание:' : isEnglish ? 'Description:' : 'Təsvir:';
        prompt += `\n   ${descLabel} ${exp.description.substring(0, 200)}`;
      }
    });
  }

  if (education && education.length > 0) {
    if (isRussian) {
      prompt += `\n\nОбразование:`;
    } else if (isEnglish) {
      prompt += `\n\nEducation:`;
    } else {
      prompt += `\n\nTəhsil:`;
    }
    
    education.forEach((edu, index) => {
      prompt += `\n${index + 1}. ${edu.degree} - ${edu.institution}`;
    });
  }

  if (skills && skills.length > 0) {
    const skillsLabel = isRussian ? 'Навыки:' : isEnglish ? 'Skills:' : 'Bacarıqlar:';
    prompt += `\n\n${skillsLabel} ${skills.map(s => s.name).join(', ')}`;
  }

  if (projects && projects.length > 0) {
    const projectsLabel = isRussian ? 'Проекты:' : isEnglish ? 'Projects:' : 'Layihələr:';
    prompt += `\n\n${projectsLabel}`;
    projects.slice(0, 2).forEach((project, index) => {
      prompt += `\n${index + 1}. ${project.name}`;
      if (project.description) {
        prompt += ` - ${project.description.substring(0, 100)}`;
      }
      if (project.technologies && project.technologies.length > 0) {
        const techLabel = isRussian ? 'Технологии:' : isEnglish ? 'Technologies:' : 'Texnologiyalar:';
        prompt += ` (${techLabel} ${project.technologies.join(', ')})`;
      }
    });
  }

  // Add language-specific instructions
  if (isRussian) {
    prompt += `\n\nПожалуйста, напишите профессиональное и привлекательное резюме карьеры на основе этой информации. Резюме должно соответствовать следующим критериям:
1. Быть на русском языке
2. Максимум 3-4 предложения
3. Подчеркнуть основные навыки и опыт человека
4. Быть полезным при поиске работы
5. Использовать профессиональный и формальный тон
6. Творчески объединить информацию

Верните только текст резюме, больше ничего не добавляйте.`;
  } else if (isEnglish) {
    prompt += `\n\nPlease write a professional and engaging career summary based on this information. The summary should meet the following criteria:
1. Be in English
2. Maximum 3-4 sentences
3. Highlight the person's key skills and experience
4. Be useful for job searching
5. Use professional and formal tone
6. Creatively combine the information

Return only the summary text, don't add anything else.`;
  } else {
    prompt += `\n\nXahiş edirəm bu məlumatlara əsasən professional və cəlbedici career summary yazın. Summary aşağıdaki kriteriyalara uyğun olmalıdır:
1. Azərbaycan dilində olsun
2. Maksimum 3-4 cümlə olsun
3. Şəxsin əsas bacarıqlarını və təcrübəsini vurğulasın
4. İş axtarışında faydalı olsun
5. Professional və formal ton istifadə edin
6. Məlumatları yaratıcı şəkildə birləşdirin

Yalnız summary mətnini qaytarın, başqa heç nə əlavə etməyin.`;
  }

  return prompt;
}

/**
 * Generate fallback summary when AI fails
 */
function generateFallbackSummary(cvData: CVDataForSummary, language?: string): string {
  const { personalInfo, experience, education, skills } = cvData;
  
  // Determine target language
  const targetLang = language?.toLowerCase() || 'azerbaijani';
  const isRussian = targetLang.includes('ru') || targetLang === 'russian';
  const isEnglish = targetLang.includes('en') || targetLang === 'english';
  
  let summary = `${personalInfo.fullName} - `;
  
  // Add experience info
  if (experience && experience.length > 0) {
    const latestJob = experience[0];
    if (isRussian) {
      summary += `опытный специалист в области ${latestJob.position}. `;
      if (experience.length > 1) {
        summary += `Имеет опыт работы в ${experience.length} различных компаниях. `;
      }
    } else if (isEnglish) {
      summary += `experienced professional in ${latestJob.position}. `;
      if (experience.length > 1) {
        summary += `Has work experience in ${experience.length} different companies. `;
      }
    } else {
      summary += `${latestJob.position} sahəsində təcrübəli mütəxəssis. `;
      if (experience.length > 1) {
        summary += `${experience.length} müxtəlif şirkətdə iş təcrübəsi var. `;
      }
    }
  }
  
  // Add education
  if (education && education.length > 0) {
    const latestEdu = education[0];
    if (isRussian) {
      summary += `Получил образование в ${latestEdu.institution}. `;
    } else if (isEnglish) {
      summary += `Educated at ${latestEdu.institution}. `;
    } else {
      summary += `${latestEdu.institution}-də təhsil alıb. `;
    }
  }
  
  // Add skills
  if (skills && skills.length > 0) {
    const topSkills = skills.slice(0, 3).map(s => s.name).join(', ');
    if (isRussian) {
      summary += `Обладает навыками в области ${topSkills}. `;
    } else if (isEnglish) {
      summary += `Skilled in ${topSkills}. `;
    } else {
      summary += `${topSkills} sahələrində bacarıqlıdır. `;
    }
  }
  
  // Add closing statement
  if (isRussian) {
    summary += `Готов к новым возможностям и предстоящим вызовам.`;
  } else if (isEnglish) {
    summary += `Ready for new opportunities and upcoming challenges.`;
  } else {
    summary += `Yeni imkanlar və qarşıdakı çağırışlar üçün hazırdır.`;
  }
  
  return summary;
}

/**
 * Validate if user has Premium access for AI features
 */
export function canUseAIFeatures(userTier: string): boolean {
  const tier = userTier.toLowerCase();
  return tier === 'premium' || tier === 'medium' || tier === 'pro' || tier === 'populyar';
}

/**
 * Get AI feature availability message for user
 */
export function getAIFeatureMessage(userTier: string): string {
  if (canUseAIFeatures(userTier)) {
    return 'AI-powered professional summary mövcuddur!';
  }
  
  return 'AI professional summary Premium, Pro və Medium istifadəçilər üçün mövcuddur. Planınızı yüksəldin!';
}
