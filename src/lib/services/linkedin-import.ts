import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getScrapingDogApiKey, getGeminiApiKey, recordApiUsage, markApiKeyFailed, getBestApiKey } from '@/lib/api-service';


// Get Gemini AI instance using API keys from database
const getGeminiAI = async () => {
  const apiKeyInfo = await getBestApiKey('gemini');
  
  if (!apiKeyInfo) {
    // Fallback to environment variables if no DB keys available
    const fallbackKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3
    ].filter(Boolean) as string[];
    
    if (fallbackKeys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }
    
    console.log('🔄 Using fallback Gemini API key from environment');
    return {
      geminiAI: new GoogleGenerativeAI(fallbackKeys[0]),
      apiKeyId: null
    };
  }
  
  console.log(`� Using Gemini API key from database (ID: ${apiKeyInfo.id})`);
  return {
    geminiAI: new GoogleGenerativeAI(apiKeyInfo.apiKey),
    apiKeyId: apiKeyInfo.id
  };
};

// Plan-based LinkedIn import limits
export const LINKEDIN_LIMITS = {
  Free: 2,
  Medium: 5,
  Premium: -1 // unlimited
} as const;

export interface LinkedInProfile {
  name: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  website?: string;
  profilePicture?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    duration: string;
  }>;
  skills: string[];
  languages: string[];
  projects?: Array<{
    title: string;
    name?: string;
    description?: string;
    duration?: string;
    link?: string;
    url?: string;
    skills?: string;
    technologies?: string;
  }>;
  awards?: Array<{
    name: string;
    title?: string;
    organization?: string;
    duration?: string;
    date?: string;
    summary?: string;
    description?: string;
  }>;
  volunteering?: Array<{
    organization?: string;
    company?: string;
    role?: string;
    position?: string;
    cause?: string;
    field?: string;
    duration?: string;
    description?: string;
    summary?: string;
    current?: boolean;
  }>;
}

export interface LinkedInImportResult {
  success: boolean;
  profile?: LinkedInProfile;
  cvId?: string;
  error?: string;
  remainingImports?: number;
}

export class LinkedInImportService {
  // BrightData API for main profile data (replacing ScrapingDog)
  private readonly BRIGHTDATA_URL = 'https://api.brightdata.com/dca/dataset/get_snapshot';

  // RapidAPI for skills only (as backup/enhancement) - using API management system
  private readonly RAPIDAPI_URL = 'https://linkedin-data-api.p.rapidapi.com';

  /**
   * Get active ScrapingDog API key from database
   */
  private async getActiveScrapingDogApiKey(): Promise<{ apiKey: string; apiKeyId: string }> {
    try {
      const apiKeyInfo = await getBestApiKey('scrapingdog');
      
      if (!apiKeyInfo) {
        console.warn('❌ No active ScrapingDog API key found in database');
        throw new Error('No ScrapingDog API key configured. Please add one in the admin panel at /sistem/api-keys');
      }

      console.log(`✅ Using ScrapingDog API key from database (ID: ${apiKeyInfo.id})`);
      return {
        apiKey: apiKeyInfo.apiKey,
        apiKeyId: apiKeyInfo.id
      };
    } catch (error) {
      console.error('❌ ScrapingDog API key lookup failed:', error);
      throw new Error('Failed to get ScrapingDog API key. Please check admin panel at /sistem/api-keys');
    }
  }

  /**
   * Update API key usage statistics
   */
  private async updateApiKeyUsage(apiKey: string, success: boolean): Promise<void> {
    try {
      await prisma.apiKey.updateMany({
        where: { apiKey: apiKey },
        data: {
          usageCount: { increment: 1 },
          dailyUsage: { increment: 1 },
          lastUsed: new Date(),
          lastResult: success ? 'success' : 'error'
        }
      });
    } catch (error) {
      console.log('Usage update failed:', error);
    }
  }

  /**
   * Check if user can import more LinkedIn profiles based on their tier
   */
  async checkImportLimit(userId: string): Promise<{
    canImport: boolean;
    remainingImports: number;
    userTier: string;
  }> {
    try {
      // Get user and their tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const maxImports = LINKEDIN_LIMITS[user.tier as keyof typeof LINKEDIN_LIMITS] || LINKEDIN_LIMITS.Free;

      // If premium (unlimited), always allow
      if (maxImports === -1) {
        return {
          canImport: true,
          remainingImports: -1,
          userTier: user.tier
        };
      }

      // Count LinkedIn imports for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayImports = await prisma.importSession.count({
        where: {
          userId,
          type: 'linkedin_success',
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      const remainingImports = Math.max(0, maxImports - todayImports);

      return {
        canImport: remainingImports > 0,
        remainingImports,
        userTier: user.tier
      };
    } catch (error) {
      console.error('Error checking import limit:', error);
      return {
        canImport: false,
        remainingImports: 0,
        userTier: 'Free'
      };
    }
  }

  /**
   * Extract LinkedIn username from URL or return as-is if already a username
   */
  private extractLinkedInUsername(input: string): string | null {
    if (!input?.trim()) return null;

    const cleanInput = input.trim();

    // If it's already just a username (no URL), return it
    if (!cleanInput.includes('/') && !cleanInput.includes('linkedin.com')) {
      return cleanInput.replace('@', ''); // Remove @ if present
    }

    // Extract from LinkedIn URL patterns - supports various formats:
    // - https://www.linkedin.com/in/username
    // - https://linkedin.com/in/username  
    // - www.linkedin.com/in/username
    // - linkedin.com/in/username
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_.]+)/i,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/pub\/([a-zA-Z0-9\-_.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = cleanInput.match(pattern);
      if (match?.[1]) {
        return match[1].replace(/\/$/, '').split('?')[0].split('#')[0];
      }
    }

    return null;
  }

  /**
   * Scrape LinkedIn profile using BrightData API (correct format)
   */
  private async scrapeLinkedInProfile(linkedinUsername: string): Promise<LinkedInProfile | null> {
    let apiKeyId: string | null = null;
    
    try {
      console.log(`🔍 Scraping LinkedIn profile with ScrapingDog API: ${linkedinUsername}`);

      const { apiKey, apiKeyId: keyId } = await this.getActiveScrapingDogApiKey();
      apiKeyId = keyId;

      // ScrapingDog LinkedIn profile API endpoint
      const url = 'https://api.scrapingdog.com/linkedin';
      
      // ScrapingDog parameters
      const params = {
        api_key: apiKey,
        type: 'profile',
        linkId: linkedinUsername,
        premium: 'false'
      };

      console.log(`🔍 Calling ScrapingDog API for: ${linkedinUsername}`);

      let response;
      let data;
      
      // Try with premium: false first, then premium: true as fallback
      try {
        response = await axios.get(url, { 
          params: params,
          timeout: 90000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        data = response.data;
        console.log('✅ ScrapingDog API successful with premium: false');
      } catch (error: any) {
        console.log(`❌ Failed with premium: false (${error.message}), trying premium: true...`);
        
        // Try with premium: true as fallback
        const premiumParams = { ...params, premium: 'true' };
        
        response = await axios.get(url, { 
          params: premiumParams,
          timeout: 90000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        data = response.data;
        console.log('✅ ScrapingDog API successful with premium: true');
      }

      if (response.status !== 200) {
        console.error(`❌ ScrapingDog API error: Status ${response.status}`);
        throw new Error(`ScrapingDog API returned status ${response.status}`);
      }

      console.log('🔍 ScrapingDog response type:', typeof data, Array.isArray(data) ? 'array' : 'object');

      // Handle array response
      if (Array.isArray(data) && data.length > 0) {
        data = data[0]; // Take first profile
      }

      // ScrapingDog returns direct profile data
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid ScrapingDog response format');
        throw new Error('Invalid response from ScrapingDog API');
      }

      // Transform to our standard format with better name parsing for ScrapingDog
      let firstName = '';
      let lastName = '';
      let fullName = '';

      // ScrapingDog field mapping
      if (data.firstName && data.lastName) {
        firstName = data.firstName.trim();
        lastName = data.lastName.trim();
        fullName = `${firstName} ${lastName}`.trim();
      }
      // If we have fullName but not separate names, try to split
      else if (data.fullName || data.name) {
        fullName = (data.fullName || data.name).trim();
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else {
          firstName = fullName;
          lastName = '';
        }
      }

      // Basic skills - ScrapingDog provides comprehensive data
      console.log(`✅ ScrapingDog provides comprehensive LinkedIn data`);
      const profileSkills = Array.isArray(data.skills) ? data.skills : [];

      const profile: LinkedInProfile = {
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        headline: data.headline || data.title || '',
        summary: data.summary || data.about || '',
        location: data.location || data.geo || '',
        experience: this.parseExperience(data.experience || data.positions),
        education: this.parseEducation(data.education),
        skills: profileSkills.length > 0 ? profileSkills : ['Communication', 'Problem Solving'], // Use ScrapingDog skills or fallback
        languages: Array.isArray(data.languages) ? data.languages : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        awards: Array.isArray(data.awards) ? data.awards : [],
        volunteering: this.parseVolunteerExperience(data)
      };

      console.log('✅ Final ScrapingDog profile data:', {
        name: profile.name,
        experienceCount: profile.experience.length,
        educationCount: profile.education.length,
        skillsCount: profile.skills.length,
        languagesCount: profile.languages.length,
        apiFormat: 'ScrapingDog LinkedIn API'
      });

      // Record successful API usage
      if (apiKeyId) {
        await recordApiUsage(apiKeyId, true, 'LinkedIn profile scraped successfully');
      }

      return profile;
    } catch (error) {
      console.error('💥 BrightData LinkedIn scraping error:', error);
      
      // Record failed API usage
      if (apiKeyId) {
        await markApiKeyFailed(apiKeyId, error instanceof Error ? error.message : 'Unknown error');
      }
      
      return null;
    }
  }

  /**
   * Parse experience data from ScrapingDog response with enhanced date handling
   */
  private parseExperience(experienceData: any[]): LinkedInProfile['experience'] {
    if (!Array.isArray(experienceData)) return [];

    return experienceData.map(exp => {
      let duration = '';
      let startDate = '';
      let endDate = '';

      // Try to extract dates from various possible fields
      if (exp.duration) {
        duration = exp.duration;
        // Parse duration string into start/end dates
        const parsedDates = this.parseDurationToStartEnd(duration);
        startDate = parsedDates.startDate;
        endDate = parsedDates.endDate;
      } else if (exp.date_range) {
        duration = exp.date_range;
        const parsedDates = this.parseDurationToStartEnd(duration);
        startDate = parsedDates.startDate;
        endDate = parsedDates.endDate;
      } else if (exp.start_date || exp.end_date || exp.starts_at || exp.ends_at) {
        // If we have separate start/end dates, use them directly
        startDate = exp.start_date || exp.starts_at || '';
        endDate = exp.end_date || exp.ends_at || (exp.current ? 'Present' : '');
        duration = startDate && endDate ? `${startDate} - ${endDate}` : '';
      } else if (exp.from_date || exp.to_date) {
        // Alternative field names
        startDate = exp.from_date || '';
        endDate = exp.to_date || (exp.current ? 'Present' : '');
        duration = startDate && endDate ? `${startDate} - ${endDate}` : '';
      }

      // If we still don't have dates but have years/months info, calculate dates
      if (!startDate && !endDate && (exp.years || exp.months)) {
        const calculatedDates = this.calculateDatesFromDuration(exp.years, exp.months);
        startDate = calculatedDates.startDate;
        endDate = calculatedDates.endDate;
        duration = `${startDate} - ${endDate}`;
      }

      return {
        title: exp.title || exp.position || exp.job_title || '',
        company: exp.company || exp.company_name || exp.organization || '',
        duration: duration || '',
        startDate: startDate || '',
        endDate: endDate || '',
        description: exp.description || exp.summary || exp.about || ''
      };
    });
  }

  /**
   * Parse duration string into start and end dates
   */
  private parseDurationToStartEnd(duration: string): { startDate: string; endDate: string } {
    if (!duration || typeof duration !== 'string') {
      return { startDate: '', endDate: '' };
    }

    const cleanDuration = duration.trim().toLowerCase();

    // Handle direct date ranges like "Jan 2020 - Dec 2022"
    if (cleanDuration.includes(' - ')) {
      const parts = cleanDuration.split(' - ');
      const startDate = parts[0]?.trim() || '';
      let endDate = parts[1]?.trim() || '';

      // Check if it's a current position
      if (endDate.includes('present') || endDate.includes('hazırda') || endDate.includes('current')) {
        endDate = 'Present';
      }

      return {
        startDate: this.capitalizeFirstLetter(startDate),
        endDate: endDate === 'Present' ? 'Present' : this.capitalizeFirstLetter(endDate)
      };
    }

    // Handle duration patterns like "2 years 3 months" or "1 year 5 months"
    const yearMatch = cleanDuration.match(/(\d+)\s*(year|years|yıl)/);
    const monthMatch = cleanDuration.match(/(\d+)\s*(month|months|ay)/);

    if (yearMatch || monthMatch) {
      const years = yearMatch ? parseInt(yearMatch[1]) : 0;
      const months = monthMatch ? parseInt(monthMatch[1]) : 0;

      return this.calculateDatesFromDuration(years, months);
    }

    // Handle single year like "2023"
    const singleYearMatch = cleanDuration.match(/^(\d{4})$/);
    if (singleYearMatch) {
      const year = singleYearMatch[1];
      return { startDate: `Jan ${year}`, endDate: `Dec ${year}` };
    }

    // Handle patterns like "Since 2020" or "2020 - Present"
    if (cleanDuration.includes('since') || cleanDuration.includes('present')) {
      const yearMatch = cleanDuration.match(/(\d{4})/);
      if (yearMatch) {
        const startYear = yearMatch[1];
        return { startDate: `Jan ${startYear}`, endDate: 'Present' };
      }
    }

    // If no pattern matches, return the original duration as start date
    return { startDate: this.capitalizeFirstLetter(duration), endDate: '' };
  }

  /**
   * Calculate start and end dates from years and months
   */
  private calculateDatesFromDuration(years: number = 0, months: number = 0): { startDate: string; endDate: string } {
    const currentDate = new Date();
    const totalMonths = (years * 12) + months;

    // Calculate start date by subtracting the duration from current date
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - totalMonths, 1);

    // Format dates
    const startMonth = startDate.toLocaleString('en-US', { month: 'short' });
    const startYear = startDate.getFullYear();
    const endMonth = currentDate.toLocaleString('en-US', { month: 'short' });
    const endYear = currentDate.getFullYear();

    return {
      startDate: `${startMonth} ${startYear}`,
      endDate: `${endMonth} ${endYear}`
    };
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Parse education data from ScrapingDog response
   */
  private parseEducation(educationData: any[]): LinkedInProfile['education'] {
    if (!Array.isArray(educationData)) return [];

    return educationData.map(edu => ({
      school: edu.college_name || edu.school || edu.institution || '',
      degree: edu.college_degree || edu.degree || '',
      field: edu.college_degree_field || edu.field_of_study || edu.field || '',
      duration: edu.college_duration || edu.duration || edu.date_range || ''
    }));
  }

  /**
   * Parse skills from various possible fields in ScrapingDog response
   * Enhanced with additional skills fetching using ScrapingDog API
   */
  private parseSkills(data: any): string[] {
    const skillSources = [
      data.skills,
      data.skillsArray,
      data.skill,
      data.endorsements,
      data.competencies,
      data.skill_list,
      data.skills_list
    ];

    for (const source of skillSources) {
      if (Array.isArray(source) && source.length > 0) {
        return source.filter(skill => typeof skill === 'string' && skill.trim());
      }
    }

    return [];
  }

  /**
   * Fetch additional skills using RapidAPI with correct endpoint
   */
  private async fetchSkillsWithRapidAPI(linkedinUsername: string): Promise<string[]> {
    try {
      console.log(`🔍 Fetching skills from RapidAPI for: ${linkedinUsername}`);

      // First try the primary RapidAPI endpoint
      let response;
      try {
        response = await axios.get('https://fresh-linkedin-profile-data.p.rapidapi.com/get-extra-profile-data', {
          params: {
            linkedin_url: `https://www.linkedin.com/in/${linkedinUsername}`
          },
          headers: {
            'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com',
            'x-rapidapi-key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4'
          },
          timeout: 15000
        });
      } catch (primaryError) {
        console.log('⚠️ Primary RapidAPI failed, trying alternative endpoint...');

        // Try alternative RapidAPI endpoint
        try {
          response = await axios.get('https://linkedin-data-api.p.rapidapi.com/get-profile-data-by-url', {
            params: {
              url: `https://www.linkedin.com/in/${linkedinUsername}`
            },
            headers: {
              'X-RapidAPI-Key': 'e69773e8c2msh50ce2f81e481a35p1888abjsn83f1b967cbe4',
              'X-RapidAPI-Host': 'linkedin-data-api.p.rapidapi.com'
            },
            timeout: 15000
          });
        } catch (secondaryError) {
          console.log('❌ Both RapidAPI endpoints failed');
          throw primaryError; // Throw the original error
        }
      }

      console.log('🔍 RapidAPI Response status:', response.status);
      console.log('🔍 RapidAPI Response data keys:', Object.keys(response.data || {}));

      let extractedSkills: string[] = [];

      // Enhanced skills extraction from RapidAPI response
      if (response.data) {
        const data = response.data;

        // Check multiple possible skill locations
        const skillSources = [
          data.skills,
          data.data?.skills,
          data.profile?.skills,
          data.skillsArray,
          data.data?.skillsArray,
          data.skill,
          data.data?.skill,
          data.competencies,
          data.data?.competencies,
          data.endorsements,
          data.data?.endorsements
        ];

        for (const source of skillSources) {
          if (Array.isArray(source) && source.length > 0) {
            extractedSkills = source
              .map(skill => {
                if (typeof skill === 'string') return skill.trim();
                if (skill && typeof skill === 'object') {
                  return skill.name || skill.skill || skill.title || skill.text || '';
                }
                return '';
              })
              .filter(Boolean);

            console.log(`✅ Found ${extractedSkills.length} skills in RapidAPI response`);
            break;
          }
        }

        // If no structured skills found, try to extract from text fields
        if (extractedSkills.length === 0) {
          console.log('🔍 No structured skills found, trying text extraction...');

          const textSources = [
            data.summary,
            data.data?.summary,
            data.about,
            data.data?.about,
            data.headline,
            data.data?.headline
          ].filter(Boolean);

          for (const text of textSources) {
            if (typeof text === 'string') {
              // Look for common skill patterns in text
              const skillPatterns = [
                /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin)\b/gi,
                /\b(React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel)\b/gi,
                /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle|SQL Server)\b/gi,
                /\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|Git|GitLab)\b/gi,
                /\b(HTML|CSS|SASS|SCSS|Bootstrap|Tailwind|Material UI)\b/gi,
                /\b(Photoshop|Illustrator|Figma|Sketch|After Effects|Premiere)\b/gi,
                /\b(Project Management|Agile|Scrum|Kanban|JIRA|Confluence)\b/gi
              ];

              for (const pattern of skillPatterns) {
                const matches = text.match(pattern);
                if (matches) {
                  extractedSkills.push(...matches);
                }
              }
            }
          }

          // Remove duplicates and clean up
          extractedSkills = [...new Set(extractedSkills)]
            .map(skill => skill.trim())
            .filter(skill => skill.length > 1);
        }
      }

      const validSkills = extractedSkills
        .filter(skill => typeof skill === 'string' && skill.trim())
        .map(skill => skill.trim())
        .slice(0, 15); // Limit to 15 skills

      console.log(`✅ RapidAPI extracted ${validSkills.length} skills:`, validSkills);
      return validSkills;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ RapidAPI skills fetch error:', errorMessage);
      return [];
    }
  }

  /**
   * Generate AI-enhanced professional summary using Gemini
   */
  private async generateProfessionalSummary(profile: LinkedInProfile): Promise<string> {
    try {
      // ❌ Skills olmayan profile-lər üçün AI summary yaradılmamalıdır
      const hasSkills = profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0;
      
      if (!hasSkills) {
        console.log('⚠️ Skills olmayan LinkedIn profile üçün AI summary yaradılmadı, fallback istifadə olunur');
        return profile.summary || `${profile.name} - Professional with expertise in ${profile.headline}`;
      }

      let lastError: Error | null = null;
      let summary = '';

      // Try to generate summary using API service system
      try {
        const { geminiAI, apiKeyId } = await getGeminiAI();
        const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
          Based on the following LinkedIn profile information, create a professional summary for a CV:

          Name: ${profile.name}
          Headline: ${profile.headline}
          Current Summary: ${profile.summary}
          Location: ${profile.location}
          
          Experience:
          ${profile.experience.map(exp => `- ${exp.title} at ${exp.company} (${exp.duration})`).join('\n')}
          
          Education:
          ${profile.education.map(edu => `- ${edu.degree} in ${edu.field} from ${edu.school}`).join('\n')}
          
          Skills: ${profile.skills.join(', ')}

          Create a concise, professional summary (2-3 sentences) that highlights key strengths and experience.
        `;

        const result = await model.generateContent(prompt);
        summary = result.response.text().trim();
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'Professional summary generated');
        }
        
        console.log(`✅ Professional summary generated successfully`);
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Gemini API failed:`, error.message);
        
        // Try to get API key info for error reporting
        try {
          const { apiKeyId } = await getGeminiAI();
          if (apiKeyId) {
            await markApiKeyFailed(apiKeyId, error.message);
          }
        } catch (e) {
          console.error('Error recording API failure:', e);
        }
      }

      return summary || profile.summary;
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return profile.summary || `${profile.headline}. Based in ${profile.location}.`;
    }
  }

  /**
   * Create CV from LinkedIn profile data
   */
  private async createCVFromProfile(userId: string, profile: LinkedInProfile, linkedinUsername: string): Promise<string> {
    // Use original LinkedIn summary instead of generating AI summary automatically
    const originalSummary = profile.summary || profile.headline || '';

    console.log('🎯 Creating CV from profile data:', {
      skillsCount: profile.skills.length,
      skills: profile.skills,
      experienceCount: profile.experience.length,
      educationCount: profile.education.length,
      projectsCount: profile.projects?.length || 0,
      certificationsCount: profile.awards?.length || 0
    });

    // Transform projects from ScrapingDog format
    const transformedProjects = Array.isArray(profile.projects) ? profile.projects.map((proj: any, index: number) => ({
      id: `proj-${index}-${Date.now()}`,
      name: proj.title || proj.name || '',
      description: proj.description || `${proj.title || proj.name} layihəsi`,
      startDate: proj.duration?.split(' - ')[0]?.trim() || proj.startDate || '',
      endDate: proj.duration?.split(' - ')[1]?.trim() || proj.endDate || 'Present',
      skills: proj.skills || proj.technologies || '',
      url: proj.link || proj.url || ''
    })) : [];

    // Transform certifications/awards from ScrapingDog format with proper date handling
    const transformedCertifications = Array.isArray(profile.awards) ? profile.awards.map((cert: any, index: number) => {
      let certDate = '';

      // Try to extract date from various possible fields
      if (cert.date) {
        certDate = cert.date;
      } else if (cert.duration) {
        certDate = cert.duration;
      } else if (cert.year) {
        certDate = cert.year.toString();
      } else if (cert.issued_date) {
        certDate = cert.issued_date;
      } else if (cert.completion_date) {
        certDate = cert.completion_date;
      } else if (cert.awarded_date) {
        certDate = cert.awarded_date;
      }

      // If we have a date range, extract the end date (completion date)
      if (certDate && certDate.includes(' - ')) {
        certDate = certDate.split(' - ')[1]?.trim() || certDate;
      }

      return {
        id: `cert-${index}-${Date.now()}`,
        name: cert.name || cert.title || '',
        issuer: cert.organization || cert.issuer || cert.institution || 'Unknown',
        date: certDate || '',
        description: cert.summary || cert.description || ''
      };
    }) : [];

    // Transform volunteer experience from ScrapingDog format with enhanced date parsing
    const transformedVolunteer = Array.isArray(profile.volunteering) ? profile.volunteering.map((vol: any, index: number) => {
      let startDate = '';
      let endDate = '';
      let current = false;

      // Parse volunteer experience dates similar to work experience
      if (vol.duration && typeof vol.duration === 'string') {
        const parsedDates = this.parseDurationToStartEnd(vol.duration);
        startDate = parsedDates.startDate;
        endDate = parsedDates.endDate;
        current = endDate === 'Present';
      } else if (vol.start_date || vol.end_date) {
        startDate = vol.start_date || vol.starts_at || '';
        endDate = vol.end_date || vol.ends_at || (vol.current ? 'Present' : '');
        current = vol.current || endDate === 'Present';
      } else if (vol.years || vol.months) {
        const calculatedDates = this.calculateDatesFromDuration(vol.years, vol.months);
        startDate = calculatedDates.startDate;
        endDate = calculatedDates.endDate;
      }

      return {
        id: `vol-${index}-${Date.now()}`,
        organization: vol.organization || vol.company || vol.org_name || '',
        role: vol.role || vol.position || vol.title || '',
        cause: vol.cause || vol.field || vol.area || '',
        startDate: startDate,
        endDate: endDate,
        current: current,
        description: vol.description || vol.summary || vol.details || ''
      };
    }) : [];

    const cvData = {
      personalInfo: {
        fullName: profile.name,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: '', // Will be filled by user later
        phone: '', // Will be filled by user later
        website: profile.website || '',
        address: profile.location,
        location: profile.location,
        linkedin: `https://linkedin.com/in/${linkedinUsername}`,
        summary: originalSummary, // Use original summary, not AI-generated
        profileImage: profile.profilePicture || ''
      },
      experience: profile.experience.map((exp: any, index: number) => ({
        id: exp.id || `exp-${index}-${Date.now()}`,
        company: exp.company,
        position: exp.title || exp.position,
        startDate: exp.startDate || exp.duration?.split(' - ')[0] || '',
        endDate: exp.endDate || exp.duration?.split(' - ')[1] || '',
        current: exp.current || false,
        description: exp.description,
        location: exp.location || ''
      })),
      education: profile.education.map((edu: any, index: number) => ({
        id: edu.id || `edu-${index}-${Date.now()}`,
        institution: edu.school || edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate || edu.duration?.split(' - ')[0] || '',
        endDate: edu.endDate || edu.duration?.split(' - ')[1] || '',
        current: edu.current || false,
        gpa: edu.gpa || '',
        description: edu.description || ''
      })),
      skills: profile.skills.map((skill, index) => ({
        id: `skill-${index}-${Date.now()}`,
        name: skill,
        level: 'Intermediate' as const
      })),
      languages: Array.isArray(profile.languages) ? profile.languages.map((lang: any, index: number) => ({
        id: `lang-${index}-${Date.now()}`,
        name: typeof lang === 'string' ? lang : lang.name,
        proficiency: typeof lang === 'string' ? 'Professional' : (lang.proficiency || 'Professional')
      })) : [],
      projects: transformedProjects,
      certifications: transformedCertifications,
      volunteerExperience: transformedVolunteer,
      publications: [],
      honorsAwards: [],
      testScores: [],
      recommendations: [],
      courses: [],
      source: 'linkedin_import',
      importedAt: new Date().toISOString()
    };

    console.log('💾 Saving CV data with skills:', {
      skillsCount: cvData.skills.length,
      skillsData: cvData.skills
    });

    const cv = await prisma.cV.create({
      data: {
        userId,
        title: `${profile.name} - LinkedIn Import`,
        cv_data: cvData,
        templateId: 'professional',
        createdAt: new Date()
      }
    });

    console.log('✅ CV created successfully with ID:', cv.id);
    return cv.id;
  }

  /**
   * Save import session to track usage
   */
  private async saveImportSession(userId: string, linkedinUsername: string, success: boolean, profileData?: any): Promise<void> {
    try {
      await prisma.importSession.create({
        data: {
          userId,
          type: success ? 'linkedin_success' : 'linkedin_failed',
          data: JSON.stringify({
            platform: 'linkedin',
            profileUsername: linkedinUsername,
            success,
            profileData: profileData || {},
            timestamp: new Date().toISOString()
          }),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });
    } catch (error) {
      console.error('Error saving import session:', error);
    }
  }

  /**
   * Import LinkedIn profile and create CV
   */
  async importLinkedInProfile(userId: string, linkedinInput: string): Promise<LinkedInImportResult> {
    try {
      // Check import limits
      const limitCheck = await this.checkImportLimit(userId);
      if (!limitCheck.canImport) {
        return {
          success: false,
          error: `Günlük LinkedIn idxal limitiniz dolmuşdur. Sizin ${limitCheck.userTier} paketiniz gündə ${
            LINKEDIN_LIMITS[limitCheck.userTier as keyof typeof LINKEDIN_LIMITS]
          } idxal imkanı verir.`,
          remainingImports: limitCheck.remainingImports
        };
      }

      // Extract LinkedIn username
      const linkedinUsername = this.extractLinkedInUsername(linkedinInput);
      if (!linkedinUsername) {
        return {
          success: false,
          error: 'Yanlış LinkedIn URL və ya istifadəçi adı formatı',
          remainingImports: limitCheck.remainingImports
        };
      }

      // Scrape LinkedIn profile
      const profile = await this.scrapeLinkedInProfile(linkedinUsername);
      if (!profile) {
        await this.saveImportSession(userId, linkedinUsername, false);
        return {
          success: false,
          error: 'Linkedin idxal edilə bilmədi. Linki yoxlayın.',
          remainingImports: limitCheck.remainingImports
        };
      }

      // Create CV from profile
      const cvId = await this.createCVFromProfile(userId, profile, linkedinUsername);

      // Save successful import session
      await this.saveImportSession(userId, linkedinUsername, true, profile);

      // Get updated remaining imports
      const updatedLimitCheck = await this.checkImportLimit(userId);

      return {
        success: true,
        profile,
        cvId,
        remainingImports: updatedLimitCheck.remainingImports
      };

    } catch (error) {
      console.error('LinkedIn import error:', error);
      return {
        success: false,
        error: 'LinkedIn idxal zamanı gözlənilməz xəta baş verdi',
        remainingImports: 0
      };
    }
  }

  /**
   * Generate AI-powered professional summary for Medium and Premium users
   * This is now a separate method that can be called manually
   */
  async generateAISummary(userId: string, cvId: string): Promise<{ success: boolean; summary?: string; error?: string; quotaExceeded?: boolean }> {
    try {
      // Check user tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true }
      });

      if (!user) {
        return { success: false, error: 'İstifadəçi tapılmadı' };
      }

      // Only allow Medium and Premium users to generate AI summaries
      if (user.tier === 'Free') {
        return {
          success: false,
          error: 'AI xülasə yaratma yalnız Orta və Premium abunəçilər üçün mövcuddur. Bu xüsusiyyətə daxil olmaq üçün paketinizi yüksəldin.'
        };
      }

      // Get CV data
      const cv = await prisma.cV.findUnique({
        where: { id: cvId, userId },
        select: { cv_data: true }
      });

      if (!cv) {
        return { success: false, error: 'CV tapılmadı' };
      }

      const cvData = cv.cv_data as any;
      const personalInfo = cvData.personalInfo || {};
      const experience = cvData.experience || [];
      const education = cvData.education || [];
      const skills = cvData.skills || [];
      const projects = cvData.projects || [];
      const awards = cvData.awards || [];
      const languages = cvData.languages || [];

      // ❌ Skills olmayan CV-lər üçün AI summary yaradılmamalıdır
      const hasSkills = skills && Array.isArray(skills) && skills.length > 0;
      
      if (!hasSkills) {
        console.log('⚠️ Skills olmayan CV üçün AI summary yaradılmadı');
        return {
          success: false,
          error: 'Bacarıq əlavə edin'
        };
      }

      // Detect CV language - with improved detection
      let cvLanguage = cvData.cvLanguage || 'azerbaijani';
      
      // Auto-detect language from content if not set
      if (!cvData.cvLanguage) {
        const personalInfoText = [
          personalInfo.fullName,
          personalInfo.title,
          personalInfo.summary,
          personalInfo.location
        ].filter(Boolean).join(' ').toLowerCase();

        const experienceText = experience.slice(0, 2).map((exp: any) => 
          [exp.position, exp.company, exp.description].filter(Boolean).join(' ')
        ).join(' ').toLowerCase();

        const combinedText = (personalInfoText + ' ' + experienceText).toLowerCase();

        // Simple language detection based on common words
        const englishWords = ['the', 'and', 'for', 'with', 'experience', 'company', 'work', 'project', 'manager', 'developer'];
        const azerbaijaniWords = ['və', 'üçün', 'ilə', 'təcrübə', 'şirkət', 'iş', 'layihə', 'menecer', 'inkişaf'];

        const englishScore = englishWords.filter(word => combinedText.includes(word)).length;
        const azerbaijaniScore = azerbaijaniWords.filter(word => combinedText.includes(word)).length;

        if (englishScore > azerbaijaniScore && englishScore > 2) {
          cvLanguage = 'english';
        } else {
          cvLanguage = 'azerbaijani';
        }

        console.log(`🌐 Auto-detected CV language: ${cvLanguage} (EN: ${englishScore}, AZ: ${azerbaijaniScore})`);
      } else {
        console.log(`🌐 Using CV language from data: ${cvLanguage}`);
      }

      const isEnglish = cvLanguage === 'english';

      console.log(`🌐 Generating AI summary in ${cvLanguage}...`);

      // Create different prompts based on user tier and CV language
      let prompt = '';

      if (user.tier === 'Medium') {
        if (isEnglish) {
          prompt = `Write a professional CV summary strictly based on the information provided. The text must be in third-person style (not first-person). Avoid phrases like "with X years of experience." Instead, emphasize the quality of experience, tangible outcomes, and unique strengths. Do not use clichés such as "responsible" or "results-driven." The summary should feel authentic, highlight practical application of skills and measurable impact, and clearly show the value the candidate can bring to an organization.

CV Data:
Title: ${personalInfo.title || experience[0]?.position || 'Professional'}
Location: ${personalInfo.location || ''}

Experience: ${experience.slice(0, 2).map((exp: any) => `${exp.position} at ${exp.company}`).join(', ')}

Skills: ${skills.slice(0, 6).map((skill: any) => skill.name || skill).join(', ')}

Requirements: Third-person perspective only, no time-based phrases or experience years, focus on achievements and practical impact, highlight unique value proposition, professional and authentic tone, 60-80 words, 4-5 sentences. Generate the summary:`;
        } else {
          prompt = `CV üçün peşəkar xülasə yaz. Yalnız CV-dəki məlumatlara əsaslan. Mətn 3-cü tərəf üslubunda olsun, "mən" formasından istifadə etmə. "X il təcrübəyə malikdir" tipli ifadələr işlətmə. Onun əvəzinə namizədin təcrübəsinin keyfiyyətini, nəticələrini və fərqləndirici tərəflərini vurğula. Klişe ifadələrdən ("məsuliyyətli", "nəticəyönümlü") uzaq dur. Mətn HR mütəxəssislərinin diqqətini çəkəcək, inandırıcı və unikallıq hissi verən üslubda yazılsın.

CV Məlumatları:
Vəzifə: ${personalInfo.title || experience[0]?.position || 'Peşəkar'}
Yer: ${personalInfo.location || ''}

Təcrübə: ${experience.slice(0, 2).map((exp: any) => `${exp.position} - ${exp.company}`).join(', ')}

Bacarıqlar: ${skills.slice(0, 6).map((skill: any) => skill.name || skill).join(', ')}

Tələblər: Yalnız 3-cü tərəf baxımından, vaxt əsaslı ifadələr yox, nailiyyətlər və praktik təsirə fokus, unikal dəyər təklifini vurğula, peşəkar və həqiqi ton, 60-80 söz, 4-5 cümlə. Xülasəni generasiya et:`;
        }
      } else if (user.tier === 'Premium') {
        if (isEnglish) {
          prompt = `
          Write a professional executive CV summary strictly based on the information provided. The text must be in third-person style (not first-person). Avoid phrases like "with X years of experience." Instead, emphasize the quality of experience, tangible outcomes, and unique strengths. Do not use clichés such as "responsible" or "results-driven." The summary should feel authentic, highlight practical application of skills and measurable impact, and clearly show the value the candidate can bring to an organization.

          Executive CV Data:
          Title: ${personalInfo.title || experience[0]?.position || 'Senior Professional'}
          Location: ${personalInfo.location || ''}
          
          Experience: ${experience.slice(0, 2).map((exp: any) => 
            `${exp.position} at ${exp.company}`
          ).join(', ')}

          Skills: ${skills.slice(0, 6).map((skill: any) => skill.name || skill).join(', ')}

          Requirements:
          - Third-person executive perspective only
          - No time-based phrases or experience years
          - Focus on leadership achievements and strategic impact
          - Highlight unique executive value proposition
          - Executive-level professional tone
          - 60-80 words, 4-5 sentences

          Generate the executive summary:`;
        } else {
          prompt = `CV üçün peşəkar icraçı xülasəsi yaz. Yalnız CV-dəki məlumatlara əsaslan. Mətn 3-cü tərəf üslubunda olsun, "mən" formasından istifadə etmə. "X il təcrübəyə malikdir" tipli ifadələr işlətmə. Onun əvəzinə namizədin təcrübəsinin keyfiyyətini, rəhbərlik nailiyyətlərini və strateji təsirini vurğula. İcraçı səviyyəli dil istifadə et və rəqəmlərlə dəstəklənən nəticələri göstər.

İcraçı CV Məlumatları:
Vəzifə: ${personalInfo.title || experience[0]?.position || 'Ali Səviyyəli Peşəkar'}
Yer: ${personalInfo.location || ''}

Təcrübə: ${experience.slice(0, 2).map((exp: any) => `${exp.position} - ${exp.company}`).join(', ')}

Bacarıqlar: ${skills.slice(0, 6).map((skill: any) => skill.name || skill).join(', ')}

Tələblər: 3-cü tərəf icraçı baxımından, vaxt əsaslı ifadələr yox, rəhbərlik nailiyyətləri və strateji təsirə fokus, unikal icraçı dəyər təklifini vurğula, icraçı səviyyəli peşəkar ton, 60-80 söz, 4-5 cümlə. İcraçı xülasəni generasiya et:`;
        }
      }

      try {
        let lastError: Error | null = null;
        let aiSummary = '';

        // Try to generate summary using API service system
        try {
          const { geminiAI, apiKeyId } = await getGeminiAI();
          const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const result = await model.generateContent(prompt);
          aiSummary = result.response.text().trim();
          
          // Record successful API usage
          if (apiKeyId) {
            await recordApiUsage(apiKeyId, true, 'AI summary generated');
          }
          
          console.log(`✅ AI summary generated successfully`);
        } catch (error: any) {
          lastError = error;
          console.log(`❌ Gemini API failed:`, error.message);
          
          // Try to get API key info for error reporting
          try {
            const { apiKeyId } = await getGeminiAI();
            if (apiKeyId) {
              await markApiKeyFailed(apiKeyId, error.message);
            }
          } catch (e) {
            console.error('Error recording API failure:', e);
          }
        }

        if (!aiSummary) {
          console.error('❌ Gemini API failed');
          const isQuotaError = lastError?.message?.includes('429') || lastError?.message?.toLowerCase().includes('quota');
          
          return {
            success: false,
            error: isEnglish 
              ? 'AI API failed. Please try again in a few minutes.' 
              : 'AI API uğursuz oldu. Zəhmət olmasa bir neçə dəqiqə sonra yenidən cəhd edin.',
            quotaExceeded: isQuotaError
          };
        }

        // Clean up the AI response (remove any markdown or extra formatting)
        const cleanedSummary = aiSummary
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .replace(/#{1,6}\s/g, '') // Remove headers
          .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
          .trim();

        // Update CV with AI-generated summary and language
        const updatedCvData = {
          ...cvData,
          cvLanguage: cvLanguage, // Ensure language is set
          personalInfo: {
            ...personalInfo,
            summary: cleanedSummary
          }
        };

        await prisma.cV.update({
          where: { id: cvId },
          data: { cv_data: updatedCvData }
        });

        // Log the AI summary generation for analytics
        await prisma.importSession.create({
          data: {
            userId,
            type: 'ai_summary_generated',
            data: JSON.stringify({
              tier: user.tier,
              cvId,
              language: cvLanguage,
              summaryLength: cleanedSummary.length,
              timestamp: new Date().toISOString()
            }),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          }
        });

        console.log(`✅ AI summary generated successfully (${cvLanguage}): ${cleanedSummary.length} characters`);

        return { success: true, summary: cleanedSummary };
      } catch (apiError: any) {
        console.error('AI API Error:', apiError);
        
        // Handle specific API errors
        if (apiError.message && apiError.message.includes('429')) {
          return { 
            success: false, 
            error: isEnglish ? 
              'AI service is temporarily unavailable due to high demand. Please try again later.' :
              'AI xidməti yüksək tələb səbəbindən müvəqqəti əlçatan deyil. Zəhmət olmasa sonra yenidən cəhd edin.',
            quotaExceeded: true
          };
        } else if (apiError.message && apiError.message.includes('quota')) {
          return { 
            success: false, 
            error: isEnglish ?
              'AI service quota exceeded. Please try again tomorrow or contact support.' :
              'AI xidməti kvotası aşılıb. Sabah yenidən cəhd edin və ya dəstəklə əlaqə saxlayın.'
          };
        } else {
          throw apiError; // Re-throw for general error handling
        }
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return { success: false, error: 'AI xülasəsi yaratmaq mümkün olmadı. Zəhmət olmasa, yenidən cəhd edin.' };
    }
  }

  /**
   * Parse volunteer experience data from ScrapingDog response with enhanced field mapping
   */
  private parseVolunteerExperience(data: any): LinkedInProfile['volunteering'] {
    console.log('❤️ Parsing volunteer experience data:', data);

    // Check multiple possible volunteer field names
    const volunteerSources = [
      data.volunteering,
      data.volunteer_experience,
      data.volunteer,
      data.volunteers,
      data.volunteer_work,
      data.community_service,
      data.social_work
    ];

    let volunteerData: any[] = [];

    // Find volunteer data from available sources
    for (const source of volunteerSources) {
      if (Array.isArray(source) && source.length > 0) {
        volunteerData = source;
        console.log('✅ Found volunteer data in source:', source);
        break;
      }
    }

    // If no dedicated volunteer fields, check experience array for volunteer entries
    if (volunteerData.length === 0 && Array.isArray(data.experience)) {
      console.log('🔍 Searching for volunteer entries in experience array...');

      volunteerData = data.experience.filter((exp: any) => {
        const title = (exp.title || exp.position || '').toLowerCase();
        const company = (exp.company || exp.company_name || '').toLowerCase();
        const description = (exp.description || '').toLowerCase();

        const volunteerKeywords = [
          'volunteer', 'voluntary', 'könüllü', 'community', 'charity', 'non-profit',
          'nonprofit', 'ngo', 'foundation', 'social', 'humanitarian', 'civic',
          'community service', 'volunteer work', 'social work'
        ];

        return volunteerKeywords.some(keyword =>
          title.includes(keyword) ||
          company.includes(keyword) ||
          description.includes(keyword)
        );
      });

      if (volunteerData.length > 0) {
        console.log(`🎯 Found ${volunteerData.length} volunteer entries in experience`);
      }
    }

    if (volunteerData.length === 0) {
      console.log('❌ No volunteer experience data found');
      return [];
    }

    // Parse and transform volunteer data
    return volunteerData.map((vol: any, index: number) => {
      let duration = '';
      let startDate = '';
      let endDate = '';
      let current = false;

      // Parse dates using the same logic as work experience
      if (vol.duration && typeof vol.duration === 'string') {
        duration = vol.duration;
        const parsedDates = this.parseDurationToStartEnd(duration);
        startDate = parsedDates.startDate;
        endDate = parsedDates.endDate;
        current = endDate === 'Present';
      } else if (vol.start_date || vol.end_date) {
        startDate = vol.start_date || vol.starts_at || '';
        endDate = vol.end_date || vol.ends_at || (vol.current ? 'Present' : '');
        current = vol.current || endDate === 'Present';
        duration = startDate && endDate ? `${startDate} - ${endDate}` : '';
      } else if (vol.years || vol.months) {
        const calculatedDates = this.calculateDatesFromDuration(vol.years, vol.months);
        startDate = calculatedDates.startDate;
        endDate = calculatedDates.endDate;
        duration = `${startDate} - ${endDate}`;
      }

      const volunteerEntry = {
        organization: vol.organization || vol.company || vol.company_name || vol.org_name ||
                     vol.institution || vol.foundation || '',
        role: vol.role || vol.position || vol.title || vol.job_title || 'Volunteer',
        cause: vol.cause || vol.field || vol.area || vol.sector || vol.focus_area ||
               vol.mission || vol.purpose || '',
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        current: current,
        description: vol.description || vol.summary || vol.details || vol.about ||
                    vol.responsibilities || ''
      };

      console.log(`🔧 Transformed volunteer entry ${index + 1}:`, volunteerEntry);
      return volunteerEntry;
    }).filter((vol: any) => vol.organization.trim() !== '' || vol.role.trim() !== '');
  }

  /**
   * Extract skills from profile text using AI when direct skills are not available
   */
  private async extractSkillsFromTextWithAI(profile: any): Promise<string[]> {
    try {
      console.log('🤖 Extracting skills from profile text using AI...');

      // Collect all text content from profile
      const textContent = [
        profile.headline || '',
        profile.about || profile.summary || '',
        ...(profile.experience || []).map((exp: any) => exp.summary || exp.description || ''),
        ...(profile.education || []).map((edu: any) => edu.college_degree_field || edu.field || ''),
        ...(profile.projects || []).map((proj: any) => proj.title || '')
      ].join(' ');

      if (!textContent.trim()) {
        console.log('❌ No text content found for AI skills extraction');
        return [];
      }

      try {
        let extractedSkills: string[] = [];

        // Try to extract skills using API service system
        try {
          const { geminiAI, apiKeyId } = await getGeminiAI();
          const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

          const prompt = `
            Analyze this LinkedIn profile text and extract technical skills, programming languages, frameworks, tools, and technologies mentioned. 
            Return ONLY a JSON array of skill names, no explanations:

            Profile Text: "${textContent.substring(0, 2000)}"

            Examples of skills to look for:
            - Programming languages (JavaScript, Python, Java, etc.)
            - Frameworks (React, Next.js, Spring, etc.)
            - Databases (PostgreSQL, MongoDB, etc.)
            - Tools (Docker, Git, etc.)
            - Cloud platforms (AWS, Azure, etc.)
            - Other technical skills

            Return format: ["skill1", "skill2", "skill3"]
            Maximum 15 skills.
          `;

          const result = await model.generateContent(prompt);
          const aiResponse = result.response.text().trim();

          // Parse AI response
          try {
            const skillsResult = JSON.parse(aiResponse);
            if (Array.isArray(skillsResult)) {
              extractedSkills = skillsResult
                .filter(skill => typeof skill === 'string' && skill.trim())
                .map(skill => skill.trim())
                .slice(0, 15);

              // Record successful API usage
              if (apiKeyId) {
                await recordApiUsage(apiKeyId, true, 'Skills extracted successfully');
              }

              console.log(`✅ AI extracted ${extractedSkills.length} skills`);
            }
          } catch (parseError) {
            console.log('❌ Failed to parse AI skills response:', aiResponse);
            
            // Record failed API usage
            if (apiKeyId) {
              await markApiKeyFailed(apiKeyId, 'Failed to parse skills response');
            }
          }
        } catch (error: any) {
          console.log(`❌ Gemini API failed:`, error.message);
          
          // Try to get API key info for error reporting
          try {
            const { apiKeyId } = await getGeminiAI();
            if (apiKeyId) {
              await markApiKeyFailed(apiKeyId, error.message);
            }
          } catch (e) {
            console.error('Error recording API failure:', e);
          }
        }

        return extractedSkills;
      } catch (error) {
        console.error('❌ Error extracting skills with AI:', error);
        return [];
      }

      return [];
    } catch (error) {
      console.error('❌ AI skills extraction failed:', error);
      return [];
    }
  }

  /**
   * Generate AI-powered skill description for Medium and Premium users
   */
  async generateAISkillDescription(userId: string, cvId: string, skillId: string, skillName: string, skillType?: string): Promise<{ success: boolean; description?: string; error?: string }> {
    try {
      // Check user tier
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true }
      });

      if (!user) {
        return { success: false, error: 'İstifadəçi tapılmadı' };
      }

      // Only allow Medium and Premium users to generate AI skill descriptions
      if (user.tier === 'Free') {
        return {
          success: false,
          error: 'AI bacarıq təsviri yaratma yalnız Orta və Premium abunəçilər üçün mövcuddur. Bu xüsusiyyətə daxil olmaq üçün paketinizi yüksəldin.'
        };
      }

      // Get CV data for context
      const cv = await prisma.cV.findUnique({
        where: { id: cvId, userId },
        select: { cv_data: true }
      });

      if (!cv) {
        return { success: false, error: 'CV tapılmadı' };
      }

      const cvData = cv.cv_data as any;
      const personalInfo = cvData.personalInfo || {};
      const experience = cvData.experience || [];
      const skills = cvData.skills || [];

      // Create different prompts based on skill type and user tier
      let prompt = '';

      const skillTypeText = skillType === 'hard' ? 'texniki bacarığı' : skillType === 'soft' ? 'şəxsi bacarığı' : 'bacarığı';
      const experienceContext = experience.slice(0, 3).map((exp: any) => 
        `${exp.position || exp.title} - ${exp.company}: ${exp.description || ''}`
      ).join('\n');

      if (user.tier === 'Medium') {
        prompt = `
          Create a professional description for the skill "${skillName}" (${skillTypeText}) based on this professional context:

          Professional Background:
          - Current Role: ${personalInfo.title || experience[0]?.position || 'Professional'}
          - Industry/Field: ${experience[0]?.company || 'Technology/Business'}
          
          Recent Experience:
          ${experienceContext}

          Related Skills: ${skills.filter((s: any) => s.name !== skillName).slice(0, 5).map((s: any) => s.name).join(', ')}

          Requirements for ${skillType === 'hard' ? 'Technical Skills' : skillType === 'soft' ? 'Soft Skills' : 'General Skills'}:
          1. Write 1-2 sentences (25-40 words)
          2. Be specific and professional
          3. Focus on practical application in work context
          4. Use industry-appropriate terminology
          5. Make it ATS-friendly with relevant keywords
          6. Show value to potential employers
          ${skillType === 'hard' ? '7. Include specific technologies, tools, or methodologies' : ''}
          ${skillType === 'soft' ? '7. Show impact on team performance and collaboration' : ''}

          Generate a concise, professional description that demonstrates expertise and value.
        `;
      } else if (user.tier === 'Premium') {
        prompt = `
          Create an executive-level description for the skill "${skillName}" (${skillTypeText}) based on this professional context:

          Executive Profile:
          - Leadership Role: ${personalInfo.title || experience[0]?.position || 'Senior Professional'}
          - Industry Experience: ${experience[0]?.company || 'Technology/Business Leadership'}
          - Career Level: ${experience.length}+ years of experience

          Leadership Experience:
          ${experienceContext}

          Complementary Skills: ${skills.filter((s: any) => s.name !== skillName).slice(0, 8).map((s: any) => s.name).join(', ')}

          Premium Requirements for ${skillType === 'hard' ? 'Technical Leadership Skills' : skillType === 'soft' ? 'Executive Soft Skills' : 'Leadership Competencies'}:
          1. Write 2-3 sentences (40-70 words)
          2. Emphasize leadership and strategic application
          3. Include measurable impact or scale
          4. Use executive-level language and terminology
          5. Position as competitive advantage
          6. Show business value and ROI potential
          7. Include team/organizational impact
          ${skillType === 'hard' ? '8. Highlight architectural, strategic, or innovation aspects' : ''}
          ${skillType === 'soft' ? '8. Demonstrate influence on company culture and team performance' : ''}
          9. Make it compelling for C-level and senior management roles
          10. Optimize for executive search and senior position ATS

          Create a powerful description that positions this skill as a key differentiator for senior leadership roles.
        `;
      }

      let lastError: Error | null = null;
      let aiDescription = '';

      // Try to generate skill description using API service system
      try {
        const { geminiAI, apiKeyId } = await getGeminiAI();
        const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent(prompt);
        aiDescription = result.response.text().trim();
        
        // Record successful API usage
        if (apiKeyId) {
          await recordApiUsage(apiKeyId, true, 'Skill description generated');
        }
        
        console.log(`✅ AI skill description generated successfully`);
      } catch (error: any) {
        lastError = error;
        console.log(`❌ Gemini API failed:`, error.message);
        
        // Try to get API key info for error reporting
        try {
          const { apiKeyId } = await getGeminiAI();
          if (apiKeyId) {
            await markApiKeyFailed(apiKeyId, error.message);
          }
        } catch (e) {
          console.error('Error recording API failure:', e);
        }
      }

      if (!aiDescription) {
        console.error('❌ Gemini API failed');
        return {
          success: false,
          error: 'AI API uğursuz oldu. Zəhmət olmasa bir neçə dəqiqə sonra yenidən cəhd edin.'
        };
      }

      // Clean up the AI response
      const cleanedDescription = aiDescription
        .replace(/\*\*/g, '') // Remove bold markdown
        .replace(/\*/g, '') // Remove italic markdown
        .replace(/#{1,6}\s/g, '') // Remove headers
        .replace(/^"|"$/g, '') // Remove quotes at start/end
        .replace(/\n\s*\n/g, ' ') // Replace line breaks with spaces
        .trim();

      // Update the specific skill in CV data
      const updatedSkills = skills.map((skill: any) => {
        if (skill.id === skillId) {
          return { ...skill, description: cleanedDescription };
        }
        return skill;
      });

      const updatedCvData = {
        ...cvData,
        skills: updatedSkills
      };

      await prisma.cV.update({
        where: { id: cvId },
        data: { cv_data: updatedCvData }
      });

      // Log the AI skill description generation for analytics
      await prisma.importSession.create({
        data: {
          userId,
          type: 'ai_skill_generated',
          data: JSON.stringify({
            tier: user.tier,
            cvId,
            skillId,
            skillName,
            skillType,
            descriptionLength: cleanedDescription.length,
            timestamp: new Date().toISOString()
          }),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return { success: true, description: cleanedDescription };
    } catch (error) {
      console.error('Error generating AI skill description:', error);
      return { success: false, error: 'AI bacarıq təsviri yaratmaq mümkün olmadı. Zəhmət olmasa, yenidən cəhd edin.' };
    }
  }
}

export const linkedInImportService = new LinkedInImportService();
