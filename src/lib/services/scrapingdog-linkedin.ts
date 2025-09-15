import { prisma } from '@/lib/prisma';
import axios from 'axios';

export interface ScrapingDogLinkedInProfile {
  name: string;
  firstName: string;
  lastName: string;
  headline: string;
  summary: string;
  location: string;
  website?: string;
  email?: string;
  phone?: string;
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
  honors?: Array<{
    name: string;
    title?: string;
    organization?: string;
    duration?: string;
    date?: string;
    summary?: string;
    description?: string;
  }>;
  certifications?: Array<{
    name: string;
    title?: string;
    organization?: string;
    issuer?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }>;
  volunteering?: Array<{
    company_name?: string;
    company_position?: string;
    company_url?: string;
    company_duration?: string;
    starts_at?: string;
    ends_at?: string;
    description?: string;
    // Legacy fields for compatibility
    organization?: string;
    company?: string;
    role?: string;
    position?: string;
    cause?: string;
    field?: string;
    duration?: string;
    summary?: string;
    current?: boolean;
  }>;
  publications?: Array<{
    title?: string;
    name?: string;
    description?: string;
    summary?: string;
    date?: string;
    published_date?: string;
    publisher?: string;
    journal?: string;
    url?: string;
    link?: string;
    authors?: string[];
  }>;
  courses?: Array<{
    name?: string;
    title?: string;
    institution?: string;
    school?: string;
    provider?: string;
    description?: string;
    summary?: string;
    completion_date?: string;
    end_date?: string;
    certificate?: boolean;
    has_certificate?: boolean;
    url?: string;
    certificate_url?: string;
  }>;
  test_scores?: Array<{
    test_name?: string;
    name?: string;
    score?: string;
    date?: string;
    test_date?: string;
    description?: string;
    max_score?: string;
    total_score?: string;
  }>;
  organizations?: Array<{
    name?: string;
    organization?: string;
    role?: string;
    position?: string;
    title?: string;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    current?: boolean;
    is_current?: boolean;
    description?: string;
    summary?: string;
    url?: string;
    website?: string;
  }>;
  memberships?: Array<{
    name?: string;
    organization?: string;
    role?: string;
    position?: string;
    title?: string;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    current?: boolean;
    is_current?: boolean;
    description?: string;
    summary?: string;
    url?: string;
    website?: string;
  }>;
}

export class ScrapingDogLinkedInService {
  private readonly SCRAPINGDOG_URL = 'https://api.scrapingdog.com/linkedin';
  private currentKeyIndex = 0; // Track current key rotation index
  private lastRotationTime = 0; // Track last rotation time to avoid rapid switching

  /**
   * Get active ScrapingDog API keys from database (all active keys for rotation)
   */
  private async getActiveScrapingDogApiKeys(): Promise<string[]> {
    try {
      const activeApiKeys = await prisma.apiKey.findMany({
        where: {
          service: 'scrapingdog',
          active: true
        },
        orderBy: {
          priority: 'asc' // Lower number = higher priority
        }
      });

      if (!activeApiKeys || activeApiKeys.length === 0) {
        console.warn('❌ No active ScrapingDog API keys found in database, using fallback keys');
        // Fallback to multiple working keys
        return [
          '68a99929b4148b34852a88be', // Your main working key
          '6882894b855f5678d36484c8'  // Secondary key from instructions
        ];
      }

      const keys = activeApiKeys.map(key => key.apiKey);
      console.log(`✅ Found ${keys.length} active ScrapingDog API keys for rotation`);
      return keys;
    } catch (error) {
      console.error('❌ API keys lookup failed:', error);
      // Fallback to multiple working keys
      return [
        '68a99929b4148b34852a88be',
        '6882894b855f5678d36484c8'
      ];
    }
  }

  /**
   * Get next API key using round-robin rotation
   */
  private async getNextScrapingDogApiKey(): Promise<string> {
    const apiKeys = await this.getActiveScrapingDogApiKeys();
    
    if (apiKeys.length === 1) {
      console.log('✅ Using single API key:', apiKeys[0].substring(0, 8) + '***');
      return apiKeys[0];
    }

    // Round-robin rotation
    const selectedKey = apiKeys[this.currentKeyIndex];
    console.log(`🔄 Using API key ${this.currentKeyIndex + 1}/${apiKeys.length}:`, selectedKey.substring(0, 8) + '***');
    
    // Move to next key for next request
    this.currentKeyIndex = (this.currentKeyIndex + 1) % apiKeys.length;
    
    return selectedKey;
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
   * Add delay between requests to prevent rate limiting
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry API request with different keys if rate limited
   */
  private async makeRequestWithRetry(linkedinUsername: string, maxRetries: number = 3): Promise<any> {
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 Making request to ScrapingDog API (attempt ${attempt}/${maxRetries})...`);
        
        const apiKey = await this.getNextScrapingDogApiKey();
        
        const params = {
          api_key: apiKey,
          type: 'profile',
          linkId: linkedinUsername,
          premium: 'true', // Enable premium mode for full data
        };

        // Add small delay between requests to prevent rate limiting
        if (attempt > 1) {
          const delayMs = attempt * 1000; // 1s, 2s, 3s delay
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await this.delay(delayMs);
        }

        const response = await axios.get(this.SCRAPINGDOG_URL, {
          params: params,
          timeout: 30000
        });

        if (response.status !== 200) {
          throw new Error(`ScrapingDog API responded with status ${response.status}`);
        }

        await this.updateApiKeyUsage(apiKey, true);
        return response.data;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        // Update usage as failed for this API key
        try {
          const apiKey = await this.getNextScrapingDogApiKey();
          await this.updateApiKeyUsage(apiKey, false);
        } catch (updateError) {
          console.error('Failed to update API usage:', updateError);
        }
        
        // If it's the last attempt or not a rate limit error, break
        if (attempt === maxRetries || !this.isRateLimitError(error)) {
          break;
        }
        
        console.log(`🔄 Retrying with next API key...`);
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is related to rate limiting
   */
  private isRateLimitError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStatus = error.response?.status;
    
    // Common rate limit indicators
    return errorStatus === 429 || 
           errorMessage.includes('rate limit') ||
           errorMessage.includes('too many requests') ||
           errorMessage.includes('quota exceeded');
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

      // Use retry mechanism with multiple API keys
      const data = await this.makeRequestWithRetry(linkedinUsername);
      console.log('🔍 ScrapingDog response received');

      if (!data) {
        console.error('❌ No data received from ScrapingDog');
        throw new Error('No data received from ScrapingDog API');
      }

      console.log('🔍 ScrapingDog response keys:', Object.keys(data));
      console.log('🔍 ScrapingDog full response sample:', JSON.stringify(data, null, 2).substring(0, 1000) + '...');

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
    } catch (error: any) {
      console.error('💥 ScrapingDog LinkedIn scraping error:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('❌ HTTP Error Details:');
        console.error('   Status:', error.response.status);
        console.error('   Status Text:', error.response.statusText);
        console.error('   Data:', error.response.data);
        console.error('   Headers:', error.response.headers);
      }
      
      if (error.request) {
        console.error('❌ Request Error:', error.request);
      }
      
      if (error.code) {
        console.error('❌ Error Code:', error.code);
      }

      throw error; // Re-throw error to see what's really happening
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
      certifications: this.parseCertifications(
        profileData.certifications || 
        profileData.certificates || 
        profileData.certification ||
        profileData.certs ||
        profileData.credentials ||
        profileData.licenses ||
        profileData.achievements ||
        profileData.course_certificates ||
        profileData.professional_certificates ||
        []
      ),
      volunteering: this.parseVolunteering(
        profileData.volunteering || 
        profileData.volunteer || 
        profileData.volunteer_experience || 
        profileData.volunteerExperience ||
        profileData.volunteer_work ||
        []
      ),
      organizations: this.parseOrganizations(profileData.organizations || [])
    };

    // Merge course certificates into main certifications array if courses exist
    if (profileData.courses && Array.isArray(profileData.courses)) {
      const courseCertifications = this.extractCertificationsFromCourses(profileData.courses);
      if (courseCertifications && courseCertifications.length > 0) {
        profile.certifications = [...(profile.certifications || []), ...courseCertifications];
      }
    }

    console.log('🎯 Final transformed profile:');
    console.log('Certifications count:', profile.certifications?.length || 0);
    console.log('Volunteering count:', profile.volunteering?.length || 0);

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
   * Parse certifications from ScrapingDog response
   */
  private parseCertifications(certificationsData: any[]): ScrapingDogLinkedInProfile['certifications'] {
    console.log('🏆 Raw certifications data:', certificationsData);
    
    if (!Array.isArray(certificationsData)) {
      console.log('❌ Certifications data is not an array:', typeof certificationsData);
      return [];
    }
    
    console.log('🔍 Found', certificationsData.length, 'certifications to parse');

    return certificationsData.map((cert, index) => {
      console.log(`📜 Raw cert ${index + 1}:`, cert);
      
      const parsed = {
        // ScrapingDog API format mapping
        name: cert.certification || cert.name || cert.title || cert.certification_name || cert.certificate_name || '',
        title: cert.certification || cert.title || cert.name || cert.certificate_title || '',
        organization: cert.company_name || cert.organization || cert.issuer || cert.authority || cert.issuing_organization || cert.institution || cert.provider || '',
        issuer: cert.company_name || cert.issuer || cert.organization || cert.authority || cert.issuing_organization || cert.institution || '',
        issueDate: cert.issue_date || cert.issueDate || cert.date || cert.startDate || cert.start_date || cert.completion_date || '',
        expiryDate: cert.expiry_date || cert.expiryDate || cert.expires || cert.endDate || cert.end_date || cert.expiration_date || '',
        credentialId: cert.credential_id || cert.credentialId || cert.id || cert.certificate_id || cert.license_number || '',
        url: cert.credential_url || cert.url || cert.link || cert.verificationUrl || cert.verification_url || cert.certificate_url || ''
      };
      
      console.log(`✅ Parsed cert ${index + 1}:`, parsed);
      return parsed;
    });
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
   * Parse volunteering from ScrapingDog response with new API format support
   */
  private parseVolunteering(volunteeringData: any[]): ScrapingDogLinkedInProfile['volunteering'] {
    console.log('🤝 Raw volunteering data:', volunteeringData);
    
    if (!Array.isArray(volunteeringData)) {
      console.log('❌ Volunteering data is not an array:', typeof volunteeringData);
      return [];
    }

    console.log('🔍 Found', volunteeringData.length, 'volunteer items to parse');

    return volunteeringData.map((vol, index) => {
      console.log(`📊 Raw volunteer ${index + 1}:`, vol);
      
      // Parse dates from new API format
      let startDate = '';
      let endDate = '';
      let duration = '';
      let current = false;

      if (vol.starts_at) {
        startDate = vol.starts_at.trim();
      }

      if (vol.ends_at) {
        endDate = vol.ends_at.trim();
      } else if (vol.company_duration === '' || !vol.company_duration) {
        // If no end date and duration is empty, assume current
        endDate = 'Present';
        current = true;
      }

      // Create duration string
      if (startDate && endDate) {
        duration = `${startDate} - ${endDate}`;
      } else if (startDate) {
        duration = startDate;
      } else {
        // Fallback to legacy duration field
        duration = vol.duration || vol.dateRange || vol.period || '';
      }

      const parsed = {
        // New API format fields (priority)
        company_name: vol.company_name || vol.organization || vol.company || vol.org || vol.institution || '',
        company_position: vol.company_position || vol.role || vol.position || vol.title || vol.job_title || '',
        company_url: vol.company_url || '',
        company_duration: vol.company_duration || duration,
        starts_at: vol.starts_at || startDate,
        ends_at: vol.ends_at || endDate,
        description: vol.description || vol.summary || vol.details || '',
        
        // Legacy fields for backward compatibility
        organization: vol.company_name || vol.organization || vol.company || vol.org || vol.institution || '',
        company: vol.company_name || vol.company || vol.organization || vol.org || vol.institution || '',
        role: vol.company_position || vol.role || vol.position || vol.title || vol.job_title || '',
        position: vol.company_position || vol.position || vol.role || vol.title || vol.job_title || '',
        cause: vol.cause || vol.field || vol.category || vol.type || '',
        field: vol.field || vol.cause || vol.category || vol.type || '',
        duration: duration,
        summary: vol.description || vol.summary || vol.details || '',
        current: current || vol.current || vol.is_current || false
      };
      
      console.log(`✅ Parsed volunteer ${index + 1}:`, parsed);
      return parsed;
    });
  }

  /**
   * Extract certifications from courses data (courses that have certificates)
   */
  private extractCertificationsFromCourses(coursesData: any[]): Array<{
    name: string;
    title?: string;
    organization?: string;
    issuer?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    url?: string;
  }> {
    console.log('🎓 Extracting certifications from courses data:', coursesData);
    
    if (!Array.isArray(coursesData)) {
      return [];
    }

    const certifications: Array<{
      name: string;
      title?: string;
      organization?: string;
      issuer?: string;
      issueDate?: string;
      expiryDate?: string;
      credentialId?: string;
      url?: string;
    }> = [];
    
    coursesData.forEach((course, index) => {
      // Only extract courses that have certificates
      if (course.certificate || course.has_certificate || course.certificate_url || course.certification) {
        console.log(`🏆 Found course with certificate ${index + 1}:`, course);
        
        const certification = {
          name: course.name || course.title || course.course_name || '',
          title: course.title || course.name || '',
          organization: course.institution || course.school || course.provider || course.organization || '',
          issuer: course.provider || course.institution || course.school || course.organization || '',
          issueDate: course.completion_date || course.end_date || course.date || course.issue_date || '',
          expiryDate: course.expiry_date || course.expiration_date || '',
          credentialId: course.certificate_id || course.credential_id || '',
          url: course.certificate_url || course.credential_url || course.url || ''
        };
        
        // Only add if it has meaningful data
        if (certification.name || certification.organization) {
          certifications.push(certification);
          console.log(`✅ Added course certification:`, certification);
        }
      }
    });
    
    console.log(`🎓 Extracted ${certifications.length} certifications from courses`);
    return certifications;
  }

  /**
   * Parse organizations from ScrapingDog response
   */
  private parseOrganizations(organizationsData: any[]): ScrapingDogLinkedInProfile['organizations'] {
    console.log('🏢 Raw organizations data:', organizationsData);
    
    if (!Array.isArray(organizationsData)) {
      console.log('❌ Organizations data is not an array:', typeof organizationsData);
      return [];
    }

    console.log('🔍 Found', organizationsData.length, 'organizations to parse');

    return organizationsData.map((org, index) => {
      console.log(`🏢 Raw organization ${index + 1}:`, org);
      
      const parsed = {
        name: org.name || org.organization || '',
        organization: org.name || org.organization || '',
        role: org.position || org.role || org.title || '',
        position: org.position || org.role || org.title || '',
        title: org.position || org.role || org.title || '',
        start_date: org.start_date || org.startDate || '',
        startDate: org.start_date || org.startDate || '',
        end_date: org.end_date || org.endDate || '',
        endDate: org.end_date || org.endDate || '',
        current: org.current || org.is_current || false,
        is_current: org.current || org.is_current || false,
        description: org.description || org.summary || '',
        summary: org.description || org.summary || '',
        url: org.url || org.website || '',
        website: org.url || org.website || ''
      };
      
      console.log(`✅ Parsed organization ${index + 1}:`, parsed);
      return parsed;
    });
  }
}
