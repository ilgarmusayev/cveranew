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
   * Get active ScrapingDog API keys from database (only working keys)
   */
  private async getActiveScrapingDogApiKeys(): Promise<string[]> {
    try {
      const activeApiKeys = await prisma.apiKey.findMany({
        where: {
          service: 'scrapingdog',
          active: true,
          OR: [
            { lastResult: 'success' },
            { lastResult: null },
            { lastResult: { not: 'RATE_LIMITED' } }
          ]
        },
        orderBy: [
          { priority: 'asc' },
          { usageCount: 'asc' } // Prefer less used keys
        ]
      });

      if (!activeApiKeys || activeApiKeys.length === 0) {
        console.warn('❌ No active ScrapingDog API keys found in database, using fallback keys');
        // Fallback to multiple working keys from recent test
        return [
          '68c5bd9c7c82e46d2c42c3e0', // 0 usage
          '68cfae3c5e84d9f5c8b3c9a1', // 0 usage
          '68cfaf1c5f95eaf6d9c4dab2', // 0 usage
          '68d26258d1a6fbe7eaf5ebc3', // 0 usage
          '68d262705e84d9f5c8b3c9a1'  // 0 usage
        ];
      }

      const keys = activeApiKeys.map(key => key.apiKey);
      console.log(`✅ Found ${keys.length} active ScrapingDog API keys for rotation`);
      return keys;
    } catch (error) {
      console.error('❌ API keys lookup failed:', error);
      // Fallback to working keys
      return [
        '68c5bd9c7c82e46d2c42c3e0',
        '68cfae3c5e84d9f5c8b3c9a1'
      ];
    }
  }

  /**
   * Get next API key using smart selection (prefer fresh keys)
   */
  private async getNextScrapingDogApiKey(): Promise<string> {
    try {
      // Get fresh working keys from database with account status
      const workingKeys = await prisma.apiKey.findMany({
        where: {
          service: 'scrapingdog',
          active: true,
          lastResult: 'success'
        },
        orderBy: [
          { usageCount: 'asc' }, // Prefer less used keys
          { priority: 'asc' }
        ],
        take: 10 // Get top 10 working keys
      });

      if (workingKeys.length === 0) {
        console.warn('⚠️ No working keys found, using fallback');
        return '68c5bd9c7c82e46d2c42c3e0'; // Known working key
      }

      // Select least used key
      const selectedKey = workingKeys[0];
      console.log(`🔄 Using API key (Usage: ${selectedKey.usageCount}):`, selectedKey.apiKey.substring(0, 8) + '***');
      
      return selectedKey.apiKey;
      
    } catch (error) {
      console.error('❌ Smart key selection failed:', error);
      return '68c5bd9c7c82e46d2c42c3e0'; // Fallback
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
   * Add delay between requests to prevent rate limiting
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry API request with ALL available keys if rate limited
   * Tries every key in database before giving up
   */
  private async makeRequestWithRetry(linkedinUsername: string): Promise<any> {
    console.log(`📡 Starting LinkedIn profile scraping for: ${linkedinUsername}`);
    
    // Get ALL active API keys from database
    const allApiKeys = await this.getActiveScrapingDogApiKeys();
    
    if (!allApiKeys || allApiKeys.length === 0) {
      throw new Error('ScrapingDog API key-lər tapılmadı. Zəhmət olmasa admin ilə əlaqə saxlayın.');
    }
    
    console.log(`� Found ${allApiKeys.length} API keys to try`);
    
    let lastError: any = null;
    let attemptCount = 0;
    
    // Try EVERY API key until one works
    for (const apiKey of allApiKeys) {
      attemptCount++;
      
      try {
        console.log(`📡 Attempt ${attemptCount}/${allApiKeys.length} with API key: ${apiKey.substring(0, 8)}***`);
        
        const params = {
          api_key: apiKey,
          type: 'profile',
          linkId: linkedinUsername,
          premium: 'false', // Use free mode to conserve quota
        };

        // Add delay between requests (avoid rapid-fire)
        if (attemptCount > 1) {
          const delayMs = 1000; // 1 second delay between keys
          console.log(`⏳ Waiting ${delayMs}ms before next key...`);
          await this.delay(delayMs);
        }

        const response = await axios.get(this.SCRAPINGDOG_URL, {
          params: params,
          timeout: 25000
        });

        if (response.status !== 200) {
          throw new Error(`ScrapingDog API responded with status ${response.status}`);
        }

        // ✅ SUCCESS - update key usage and return data
        await this.updateApiKeyUsage(apiKey, true);
        console.log(`✅ ScrapingDog request successful with key ${attemptCount}/${allApiKeys.length}: ${apiKey.substring(0, 8)}***`);
        return response.data;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attemptCount}/${allApiKeys.length} failed:`, error.message);
        
        // Handle different error types
        if (this.isRateLimitError(error)) {
          console.log(`🚫 Rate limit detected for key: ${apiKey.substring(0, 8)}***`);
          await this.markApiKeyRateLimited(apiKey);
          console.log(`🔄 Trying next API key...`);
        } else if (error.response?.status === 404) {
          // Profile not found - don't try other keys
          console.error(`❌ LinkedIn profile not found (404) - stopping all attempts`);
          throw new Error('LinkedIn profili tapılmadı. Zəhmət olmasa düzgün istifadəçi URL və ya username daxil edin.');
        } else {
          await this.updateApiKeyUsage(apiKey, false);
          console.log(`⚠️ API error with key ${apiKey.substring(0, 8)}*** - trying next key...`);
        }
      }
    }
    
    // All keys failed
    console.error(`� All ${allApiKeys.length} API keys failed`);
    
    // Determine best error message
    if (this.isRateLimitError(lastError)) {
      throw new Error('Bütün ScrapingDog API key-lər limit-ə çatıb. Zəhmət olmasa bir az sonra yenidən cəhd edin.');
    }
    
    throw lastError || new Error('ScrapingDog API xətası - bütün key-lər uğursuz oldu');
  }

  /**
   * Check if error is related to rate limiting or LinkedIn limit
   */
  private isRateLimitError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStatus = error.response?.status;
    const responseData = error.response?.data?.message?.toLowerCase() || '';
    
    // Common rate limit indicators
    return errorStatus === 429 || 
           errorStatus === 403 && responseData.includes('free pack') ||
           errorStatus === 403 && responseData.includes('linkedin') ||
           errorMessage.includes('rate limit') ||
           errorMessage.includes('too many requests') ||
           errorMessage.includes('quota exceeded');
  }

  /**
   * Mark API key as rate limited
   */
  private async markApiKeyRateLimited(apiKey: string): Promise<void> {
    try {
      await prisma.apiKey.updateMany({
        where: { apiKey: apiKey },
        data: {
          lastResult: 'RATE_LIMITED',
          lastUsed: new Date()
        }
      });
      console.log(`🚫 Marked API key as rate limited: ${apiKey.substring(0, 8)}***`);
    } catch (error) {
      console.log('Failed to mark key as rate limited:', error);
    }
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

      // Validate profile data - check if it's a valid LinkedIn profile
      const isValidProfile = this.validateLinkedInProfile(data);
      if (!isValidProfile) {
        console.error('❌ Invalid LinkedIn profile data - profile not found or user does not exist');
        throw new Error('LinkedIn profili tapılmadı. Zəhmət olmasa düzgün istifadəçi URL və ya username daxil edin.');
      }

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
   * Validate if the LinkedIn profile data is valid and contains essential information
   */
  private validateLinkedInProfile(data: any): boolean {
    // Handle array response
    let profileData = data;
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log('❌ Validation failed: Empty array response');
        return false;
      }
      profileData = data[0];
    }

    // Check if data is an object
    if (!profileData || typeof profileData !== 'object') {
      console.log('❌ Validation failed: Data is not an object');
      return false;
    }

    // Check for essential fields that indicate a valid profile
    // At minimum, we need name or fullName to consider it valid
    const hasName = !!(
      profileData.fullName || 
      profileData.full_name ||
      (profileData.first_name && profileData.last_name) ||
      (profileData.firstName && profileData.lastName)
    );

    if (!hasName) {
      console.log('❌ Validation failed: No name information found');
      console.log('Available keys:', Object.keys(profileData));
      return false;
    }

    // Additional check: if the response has an error field or status indicating failure
    if (profileData.error || profileData.status === 'error' || profileData.success === false) {
      console.log('❌ Validation failed: Error in response data');
      console.log('Error details:', profileData.error || profileData.message);
      return false;
    }

    // Check if it's an empty or stub profile (all key fields are empty)
    const hasAnyContent = !!(
      profileData.headline ||
      profileData.about ||
      profileData.summary ||
      (profileData.experience && profileData.experience.length > 0) ||
      (profileData.education && profileData.education.length > 0)
    );

    if (!hasAnyContent) {
      console.log('⚠️ Warning: Profile has name but no other content (possibly invalid or private profile)');
      // We'll still allow this but log a warning
    }

    console.log('✅ Profile validation passed');
    return true;
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
