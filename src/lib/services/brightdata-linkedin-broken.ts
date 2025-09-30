import { getBrightDataApiKey } from '@/lib/api-service';
import axios from 'axios';

// BrightData response types based on real JSON structure
interface BrightDataScrapingResult {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country_code?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  country_code?: string;
  position?: string;
  about?: string;
  location?: string;
  avatar?: string;
  current_company?: {
    company_id?: string;
    location?: string;
    name?: string;
    title?: string;
  };
  experience?: Array<{
    company?: string;
    company_id?: string;
    company_logo_url?: string;
    description?: string;
    description_html?: string;
    end_date?: string;
    start_date?: string;
    title?: string;
    location?: string;
    url?: string;
  }>;
  education?: Array<{
    degree?: string;
    description?: string;
    description_html?: string;
    end_year?: string;
    field?: string;
    institute_logo_url?: string;
    start_year?: string;
    title?: string;
    url?: string;
  }>;
  skills?: Array<string>;
  projects?: Array<{
    name?: string;
    title?: string;
    description?: string;
    url?: string;
  }>;
  certifications?: Array<{
    name?: string;
    title?: string;
    issuer?: string;
    date?: string;
    url?: string;
  }>;
  languages?: Array<string | { name?: string; language?: string }>;
  honors_and_awards?: Array<{
    name?: string;
    title?: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
  volunteer_experience?: Array<{
    organization?: string;
    position?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  url?: string;
  linkedin_id?: string;
  linkedin_num_id?: string;
  followers?: number;
  connections?: number;
  recommendations_count?: number;
}

export class BrightDataLinkedInService {
  private baseUrl = 'https://api.brightdata.com/datasets/v3';
  private datasetId = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn dataset ID
  private statusUrl = 'https://api.brightdata.com/datasets/v3'; // v3 API for polling

  /**
   * Get next available BrightData API key
   */
  private async getNextBrightDataApiKey(): Promise<string> {
    const apiKey = await getBrightDataApiKey();
    if (!apiKey) {
      throw new Error('No active BrightData API key available');
    }
    return apiKey;
  }

  /**
   * Trigger dataset scraping for LinkedIn profile
   */
  private async triggerScraping(linkedinUrl: string, apiKey: string): Promise<string> {
    const requestData = [{ url: linkedinUrl }];
    
    const response = await fetch(`${this.baseUrl}/trigger?dataset_id=${this.datasetId}&include_errors=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ BrightData trigger error: ${response.status} - ${errorText}`);
      throw new Error(`BrightData API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ BrightData scraping triggered successfully!');
    console.log('📋 Trigger Response Data:', JSON.stringify(result, null, 2));
    console.log('📋 Snapshot ID:', result?.snapshot_id);
    
    if (!result.snapshot_id) {
      throw new Error('No snapshot_id returned from BrightData');
    }

    return result.snapshot_id;
  }

  /**
   * Wait for scraping results with polling
   */
  async waitForResults(triggerResponse: any, apiKey: string): Promise<any> {
    const snapshotId = triggerResponse.snapshot_id;
    
    // Try different possible URL formats for BrightData snapshot
    const possibleUrls = [
      `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
      `https://api.brightdata.com/dataset/v3/snapshot/${snapshotId}?format=json`,
      `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}`,
      `https://api.brightdata.com/dataset/v3/snapshot/${snapshotId}`
    ];
    
    console.log('⏳ Polling BrightData snapshot:', snapshotId);
    console.log('🔗 Possible snapshot URLs:', possibleUrls);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('📋 Trigger Response:', JSON.stringify(triggerResponse, null, 2));
    
    const maxAttempts = 60; // 15 dakika maksimum gözleme
    const pollInterval = 15000; // 15 saniye interval

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`� Attempt ${attempt}/${maxAttempts} - Checking snapshot status...`);
        
        const response = await axios.get(snapshotUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Snapshot Status Response:', response.status);
        console.log('📊 Snapshot Response Keys:', Object.keys(response.data || {}));
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('✅ BrightData snapshot hazırdır!');
          console.log('� COMPLETE Snapshot Data Structure:');
          console.log('- Array length:', response.data.length);
          console.log('- First item keys:', Object.keys(response.data[0] || {}));
          console.log('- FULL First Item Sample:');
          console.log(JSON.stringify(response.data[0], null, 2));
          
          // İlk profil məlumatını qaytarırıq
          return response.data[0];
        }

        console.log(`⏳ Snapshot hələ hazır deyil, ${pollInterval/1000}s sonra yenidən yoxlayırıq...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error: any) {
        console.error(`❌ Snapshot yoxlama xətası (attempt ${attempt}):`, error);
        console.error(`❌ Error status:`, error.response?.status);
        console.error(`❌ Error response:`, error.response?.data);
        console.error(`❌ Error headers:`, error.response?.headers);
        
        // 404 error-u snapshot hələ hazır olmadığını göstərə bilər
        if (error.response?.status === 404) {
          console.log(`⚠️ 404 - Snapshot ${snapshotId} hələ hazır deyil, gözləyirik...`);
        } else {
          console.error(`❌ Unexpected error status: ${error.response?.status}`);
        }
        
        if (attempt === maxAttempts) {
          throw new Error(`BrightData snapshot ${maxAttempts} dəfə yoxlanıldı, hazır olmadı`);
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('BrightData snapshot maksimum vaxt bitdi');
  }

  /**
   * Transform BrightData profile to our CV format
   */
  private transformBrightDataProfile(profile: BrightDataScrapingResult): any {
    console.log('🔄 transformBrightDataProfile started');
    console.log('📊 Input profile keys:', Object.keys(profile || {}));
    console.log('📊 Input profile sample:', JSON.stringify(profile, null, 2).substring(0, 800) + '...');
    
    const result = {
      // Personal Information - Real BrightData JSON structure
      firstName: profile.first_name || profile.name?.split(' ')[0] || '',
      lastName: profile.last_name || profile.name?.split(' ').slice(1).join(' ') || '',
      email: '', // Email not provided in BrightData response
      phone: '', // Phone not provided in BrightData response
      location: profile.location || profile.city || '',
      website: '', // Website not provided in this format
      profilePicture: profile.avatar || '',

      // Professional Summary
      professionalSummary: profile.about || profile.position || '',

      // Work Experience - Real BrightData structure
      workExperience: (profile.experience || []).map((exp: any) => ({
        jobTitle: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.start_date || '',
        endDate: exp.end_date || 'Present',
        description: exp.description || exp.description_html || '',
        isCurrentJob: exp.end_date === 'Present'
      })),

      // Education - Real BrightData structure
      education: (profile.education || []).map((edu: any) => ({
        institution: edu.title || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.field || '',
        startDate: edu.start_year || '',
        endDate: edu.end_year || '',
        gpa: '',
        description: edu.description || ''
      })),

      // Skills - BrightData doesn't provide skills in this format, return empty
      skills: [],

      // Projects - Real BrightData structure
      projects: (profile.projects || []).map((project: any) => ({
        name: project.name || project.title || '',
        description: project.description || '',
        technologies: [],
        url: project.url || '',
        startDate: '',
        endDate: ''
      })),

      // Certifications - Real BrightData structure
      certifications: (profile.certifications || []).map((cert: any) => ({
        name: cert.name || cert.title || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
        url: cert.url || ''
      })),

      // Languages - Real BrightData structure
      languages: (profile.languages || []).map((lang: any) => ({
        name: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
        level: 'Fluent'
      })),

      // Awards - Real BrightData structure
      awards: (profile.honors_and_awards || []).map((award: any) => ({
        name: award.name || award.title || '',
        issuer: award.issuer || '',
        date: award.date || '',
        description: award.description || ''
      })),

      // Volunteer Experience - Real BrightData structure
      volunteerExperience: (profile.volunteer_experience || []).map((vol: any) => ({
        organization: vol.organization || '',
        position: vol.position || '',
        startDate: vol.start_date || '',
        endDate: vol.end_date || '',
        description: vol.description || ''
      }))
    };
    
    console.log('✅ transformBrightDataProfile completed');
    console.log('📊 Output result keys:', Object.keys(result));
    console.log('📊 Experience count:', result.workExperience?.length || 0);
    console.log('📊 Education count:', result.education?.length || 0);
    
    return result;
  }

  /**
   * Scrape LinkedIn profile using BrightData
   */
  async scrapeLinkedInProfile(linkedinUrl: string): Promise<any> {
    console.log(`🔍 BrightData LinkedIn scraping started for: ${linkedinUrl}`);
    
    try {
      // Get API key
      const apiKey = await this.getNextBrightDataApiKey();
      
      // Trigger scraping
      const snapshotId = await this.triggerScraping(linkedinUrl, apiKey);
      
      // Wait for results
      const results = await this.waitForResults(snapshotId, apiKey);
      
      if (!results || results.length === 0) {
        throw new Error('No data returned from BrightData');
      }

      // Transform the first result
      const transformedData = this.transformBrightDataProfile(results[0]);
      
      console.log('✅ BrightData LinkedIn scraping completed successfully');
      return transformedData;
      
    } catch (error) {
      console.error('❌ BrightData LinkedIn scraping failed:', error);
      throw new Error(`BrightData scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}