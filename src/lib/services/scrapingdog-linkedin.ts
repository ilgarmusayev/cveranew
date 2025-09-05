import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export interface ScrapingDogLinkedInProfile {
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

export class ScrapingDogLinkedInService {
  private readonly SCRAPINGDOG_URL = 'https://api.scrapingdog.com/linkedin';

  /**
   * Get active ScrapingDog API key from database
   */
  private async getActiveScrapingDogApiKey(): Promise<string> {
    try {
      const activeApiKey = await prisma.apiKey.findFirst({
        where: {
          service: 'scrapingdog',
          active: true
        },
        orderBy: {
          priority: 'asc' // Lower number = higher priority
        }
      });

      if (!activeApiKey) {
        console.warn('❌ No active ScrapingDog API key found in database, using fallback');
        // Fallback to your working key if no active key in database
        return '68a99929b4148b34852a88be';
      }

      console.log('✅ Active ScrapingDog API key found:', activeApiKey.apiKey.substring(0, 8) + '***');
      return activeApiKey.apiKey;
    } catch (error) {
      console.error('❌ API key lookup failed:', error);
      // Fallback to your working key
      return '68a99929b4148b34852a88be';
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
   * Scrape LinkedIn profile using ScrapingDog API
   */
  async scrapeLinkedInProfile(linkedinInput: string): Promise<ScrapingDogLinkedInProfile | null> {
    try {
      // Extract username if URL is provided, otherwise use as-is
      const linkedinUsername = this.extractLinkedInUsername(linkedinInput);
      if (!linkedinUsername) {
        throw new Error('Invalid LinkedIn URL or username');
      }

      console.log(`🔍 Scraping LinkedIn profile with ScrapingDog: ${linkedinUsername}`);

      const apiKey = await this.getActiveScrapingDogApiKey();

      const params = {
        api_key: apiKey,
        type: 'profile',
        linkId: linkedinUsername,
        premium: 'false',
      };

      console.log('📡 Making request to ScrapingDog API...');
      const response = await axios.get(this.SCRAPINGDOG_URL, {
        params: params,
        timeout: 30000
      });

      if (response.status !== 200) {
        console.error(`❌ ScrapingDog API error: Status ${response.status}`);
        throw new Error(`ScrapingDog API responded with status ${response.status}`);
      }

      await this.updateApiKeyUsage(apiKey, true);

      const data = response.data;
      console.log('🔍 ScrapingDog response received');

      if (!data) {
        console.error('❌ No data received from ScrapingDog');
        throw new Error('No data received from ScrapingDog API');
      }

      console.log('🔍 ScrapingDog response keys:', Object.keys(data));

      // Transform to our standard format
      const profile = this.transformScrapingDogData(data);

      console.log('✅ ScrapingDog profile transformation completed:', {
        name: profile.name,
        experienceCount: profile.experience.length,
        educationCount: profile.education.length,
        skillsCount: profile.skills.length,
        languagesCount: profile.languages.length
      });

      return profile;
    } catch (error) {
      console.error('💥 ScrapingDog LinkedIn scraping error:', error);
      
      // Update usage as failed
      try {
        const apiKey = await this.getActiveScrapingDogApiKey();
        await this.updateApiKeyUsage(apiKey, false);
      } catch (updateError) {
        console.error('Failed to update API usage:', updateError);
      }

      return null;
    }
  }

  /**
   * Transform ScrapingDog response data to our standard format
   */
  private transformScrapingDogData(data: any): ScrapingDogLinkedInProfile {
    // ScrapingDog returns an array, so get the first element
    let profileData = data;
    if (Array.isArray(data) && data.length > 0) {
      profileData = data[0];
    }

    // Extract name information using ScrapingDog field names
    let firstName = '';
    let lastName = '';
    let fullName = '';

    if (profileData.first_name && profileData.last_name) {
      firstName = profileData.first_name.trim();
      lastName = profileData.last_name.trim();
      fullName = profileData.fullName || `${firstName} ${lastName}`.trim();
    } else if (profileData.fullName) {
      fullName = profileData.fullName.trim();
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = fullName;
        lastName = '';
      }
    }

    const profile: ScrapingDogLinkedInProfile = {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      headline: profileData.headline || '',
      summary: profileData.about || '',
      location: profileData.location || '',
      website: '',
      profilePicture: profileData.profile_photo || '',
      experience: this.parseExperience(profileData.experience || []),
      education: this.parseEducation(profileData.education || []),
      skills: [], // ScrapingDog doesn't provide skills in current response
      languages: this.parseLanguages(profileData.languages || []),
      projects: this.parseProjects(profileData.projects || []),
      awards: this.parseAwards(profileData.awards || []),
      volunteering: this.parseVolunteering(profileData.volunteering || [])
    };

    return profile;
  }

  /**
   * Parse experience data from ScrapingDog response
   */
  private parseExperience(experienceData: any[]): ScrapingDogLinkedInProfile['experience'] {
    if (!Array.isArray(experienceData)) return [];

    return experienceData.map(exp => {
      let duration = '';
      let startDate = '';
      let endDate = '';

      // ScrapingDog uses starts_at and ends_at fields
      if (exp.starts_at) {
        startDate = exp.starts_at;
      }
      if (exp.ends_at) {
        endDate = exp.ends_at;
      }
      if (exp.duration) {
        duration = exp.duration;
      } else if (startDate && endDate) {
        duration = `${startDate} - ${endDate}`;
      }

      return {
        title: exp.position || '',
        company: exp.company_name || '',
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        description: exp.summary || ''
      };
    });
  }

  /**
   * Parse education data from ScrapingDog response
   */
  private parseEducation(educationData: any[]): ScrapingDogLinkedInProfile['education'] {
    if (!Array.isArray(educationData)) return [];

    return educationData.map(edu => ({
      school: edu.college_name || '',
      degree: edu.college_degree || '',
      field: edu.college_degree_field || '',
      duration: edu.college_duration || ''
    }));
  }

  /**
   * Parse projects from ScrapingDog response
   */
  private parseProjects(projectsData: any[]): ScrapingDogLinkedInProfile['projects'] {
    if (!Array.isArray(projectsData)) return [];

    return projectsData.map(project => ({
      title: project.title || '',
      name: project.title || '',
      description: '',
      duration: project.duration || '',
      link: project.link || '',
      url: project.link || '',
      skills: '',
      technologies: ''
    }));
  }

  /**
   * Parse awards from ScrapingDog response
   */
  private parseAwards(awardsData: any[]): ScrapingDogLinkedInProfile['awards'] {
    if (!Array.isArray(awardsData)) return [];

    return awardsData.map(award => ({
      name: award.name || '',
      title: award.name || '',
      organization: award.organization || '',
      duration: award.duration || '',
      date: award.duration || '',
      summary: award.summary || '',
      description: award.summary || ''
    }));
  }

  /**
   * Parse languages from ScrapingDog response
   */
  private parseLanguages(languagesData: any[]): string[] {
    if (!Array.isArray(languagesData)) return [];

    return languagesData
      .map(lang => {
        if (typeof lang === 'string') return lang.trim();
        if (lang?.name) return lang.name.trim();
        if (lang?.language) return lang.language.trim();
        return '';
      })
      .filter(lang => lang.length > 0);
  }

  /**
   * Parse volunteering from ScrapingDog response
   */
  private parseVolunteering(volunteeringData: any[]): ScrapingDogLinkedInProfile['volunteering'] {
    if (!Array.isArray(volunteeringData)) return [];

    return volunteeringData.map(vol => ({
      organization: vol.organization || vol.company || '',
      company: vol.company || vol.organization || '',
      role: vol.role || vol.position || '',
      position: vol.position || vol.role || '',
      cause: vol.cause || vol.field || '',
      field: vol.field || vol.cause || '',
      duration: vol.duration || vol.dateRange || '',
      description: vol.description || vol.summary || '',
      summary: vol.summary || vol.description || '',
      current: vol.current || false
    }));
  }
}
