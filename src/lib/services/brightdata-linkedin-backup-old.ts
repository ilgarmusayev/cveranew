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
    title?: string;
    location?: string;
    description?: string;
    description_html?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    employment_type?: string;
  }>;
  education?: Array<{
    school?: string;
    title?: string;
    degree?: string;
    field_of_study?: string;
    field?: string;
    start_year?: string;
    end_year?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  skills?: Array<string | {
    name?: string;
    skill?: string;
    level?: string;
    proficiency?: string;
  }>;
  languages?: Array<string | {
    name?: string;
    language?: string;
    proficiency?: string;
    level?: string;
  }>;
  certifications?: Array<{
    name?: string;
    title?: string;
    certification?: string;
    issuer?: string;
    organization?: string;
    authority?: string;
    date?: string;
    issue_date?: string;
    issueDate?: string;
    expiry_date?: string;
    expiryDate?: string;
    credential_id?: string;
    credentialId?: string;
    url?: string;
    credential_url?: string;
  }>;
  honors_and_awards?: Array<{
    name?: string;
    title?: string;
    issuer?: string;
    organization?: string;
    date?: string;
    description?: string;
  }>;
  projects?: Array<{
    name?: string;
    title?: string;
    description?: string;
    url?: string;
    link?: string;
    start_date?: string;
    end_date?: string;
    duration?: string;
    skills?: string;
    technologies?: string;
  }>;
  volunteer_experience?: Array<{
    organization?: string;
    company?: string;
    position?: string;
    role?: string;
    description?: string;
    start_date?: string;
    startDate?: string;
    end_date?: string;
    endDate?: string;
    duration?: string;
    current?: boolean;
    cause?: string;
    area?: string;
    url?: string;
  }>;
}

export class BrightDataLinkedInService {
  private readonly baseUrl = 'https://api.brightdata.com';
  // LinkedIn People dataset ID - real BrightData dataset
  private readonly datasetId = 'gd_l6vu8dlvp22p76msp0'; // LinkedIn People dataset

  /**
   * Trigger LinkedIn profile scraping with multiple BrightData API formats
   */
  async triggerScraping(profileUrl: string, apiKey: string): Promise<string> {
    // BrightData farklı API formatları və endpoint-ləri
    const apiFormats = [
      {
        name: 'Datasets API v3',
        endpoint: 'https://api.brightdata.com/datasets/v3/trigger',
        payload: {
          dataset_id: 'gd_l6vu8dlvp22p76msp0',
          data: [{ url: profileUrl }]
        }
      },
      {
        name: 'DCA Trigger',
        endpoint: 'https://api.brightdata.com/dca/trigger_immediate',
        payload: {
          collector: 'linkedin_people',
          url: profileUrl
        }
      },
      {
        name: 'Zone API',
        endpoint: 'https://brightdata.com/api/zone/linkedin/trigger',
        payload: {
          url: profileUrl,
          zone: 'linkedin'
        }
      },
      {
        name: 'Scraping Robot API',
        endpoint: 'https://api.brightdata.com/scraping_robot/trigger',
        payload: {
          robot_id: 'linkedin_profile',
          inputs: [{ url: profileUrl }]
        }
      },
      {
        name: 'Simple Collector',
        endpoint: 'https://api.brightdata.com/collector/trigger',
        payload: {
          collector_id: 'linkedin',
          targets: [{ url: profileUrl }]
        }
      }
    ];

    for (let i = 0; i < apiFormats.length; i++) {
      const apiFormat = apiFormats[i];
      
      try {
        console.log(`📡 Trying API format ${i + 1}/${apiFormats.length}: ${apiFormat.name}`);
        console.log(`📡 Endpoint: ${apiFormat.endpoint}`);
        console.log(`📋 Payload:`, JSON.stringify(apiFormat.payload, null, 2));

        const response = await fetch(apiFormat.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(apiFormat.payload)
        });

        console.log(`📊 Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ BrightData scraping triggered successfully!');
          console.log(`✅ Working API format: ${apiFormat.name}`);
          console.log('📋 Trigger Response Data:', JSON.stringify(result, null, 2));
          
          // Different response formats for snapshot ID
          const snapshotId = result.snapshot_id || result.job_id || result.collection_id || result.id;
          
          if (!snapshotId) {
            console.error('❌ No snapshot/job ID found in response');
            continue; // Try next API format
          }
          
          console.log('📋 Snapshot/Job ID:', snapshotId);
          return snapshotId;
          
        } else {
          const errorText = await response.text();
          console.error(`❌ API format ${i + 1} failed: ${response.status} - ${errorText}`);
        }
        
      } catch (error) {
        console.error(`❌ API format ${i + 1} (${apiFormat.name}) error:`, error);
      }
    }
    
    throw new Error('All BrightData API formats failed');
  }

  /**
   * Wait for scraping results with polling
   */
  async waitForResults(triggerResponse: any, apiKey: string): Promise<any> {
    const snapshotId = triggerResponse.snapshot_id;
    const snapshotUrl = `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`;
    
    console.log('⏳ Polling BrightData snapshot:', snapshotId);
    console.log('🔗 Snapshot URL:', snapshotUrl);
    console.log('🔑 API Key length:', apiKey?.length || 0);
    console.log('📋 Trigger Response:', JSON.stringify(triggerResponse, null, 2));
    
    const maxAttempts = 30; // 7.5 dakika maksimum gözleme
    const pollInterval = 15000; // 15 saniye interval

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}/${maxAttempts} - Checking snapshot status...`);
        console.log(`📡 Request URL: ${snapshotUrl}`);
        
        const response = await axios.get(snapshotUrl, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 Snapshot Status Response:', response.status);
        console.log('📊 Response Headers:', response.headers);
        console.log('📊 Snapshot Response Keys:', Object.keys(response.data || {}));
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('✅ BrightData snapshot hazırdır!');
          console.log('📋 COMPLETE Snapshot Data Structure:');
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
        } else if (error.response?.status === 401) {
          console.error(`❌ 401 - Authorization problem with API key`);
          throw new Error('BrightData API key authorization failed');
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
   * Transform BrightData profile to our CV format (ScrapingDog compatible)
   */
  transformBrightDataProfile(brightDataProfile: BrightDataScrapingResult): any {
    console.log('🔄 BrightData transformation starting with ScrapingDog-compatible structure...');
    console.log('📋 Raw BrightData Profile Keys:', Object.keys(brightDataProfile || {}));
    console.log('📋 Raw BrightData Profile Sample:', JSON.stringify(brightDataProfile, null, 2).substring(0, 1000) + '...');

    // Personal Information - following ScrapingDog structure exactly
    let firstName = '';
    let lastName = '';
    let fullName = '';

    if (brightDataProfile.first_name && brightDataProfile.last_name) {
      firstName = brightDataProfile.first_name.trim();
      lastName = brightDataProfile.last_name.trim();
      fullName = brightDataProfile.name || `${firstName} ${lastName}`.trim();
    } else if (brightDataProfile.name) {
      fullName = brightDataProfile.name.trim();
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        firstName = fullName;
        lastName = '';
      }
    }

    const personalInfo = {
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
      title: brightDataProfile.position || brightDataProfile.current_company?.title || '',
      field: brightDataProfile.position || brightDataProfile.current_company?.title || '',
      email: '', // BrightData doesn't provide email
      phone: '', // BrightData doesn't provide phone
      location: brightDataProfile.location || brightDataProfile.city || 
                `${brightDataProfile.city || ''}, ${brightDataProfile.country_code || ''}`.replace(', ', '').trim(),
      website: '',
      linkedin: '', // Will be set by the calling function
      summary: brightDataProfile.about || '',
      profilePicture: brightDataProfile.avatar || ''
    };

    // Experience - following ScrapingDog detailed structure
    const experience = (brightDataProfile.experience || []).map((exp: any, index: number) => {
      console.log(`📊 Processing experience ${index + 1}:`, exp);
      
      let duration = '';
      let startDate = '';
      let endDate = '';

      // Parse dates from BrightData format
      if (exp.start_date) {
        startDate = exp.start_date;
      }
      if (exp.end_date && exp.end_date !== 'Present') {
        endDate = exp.end_date;
      }
      if (exp.duration) {
        duration = exp.duration;
      } else if (startDate && endDate) {
        duration = `${startDate} - ${endDate}`;
      } else if (startDate) {
        duration = startDate;
      }

      const mappedExp = {
        id: `exp-brightdata-${Date.now()}-${index}`,
        position: exp.title || exp.position || '',
        company: exp.company || exp.company_name || '',
        startDate: startDate,
        endDate: endDate,
        current: exp.end_date === 'Present' || !exp.end_date,
        description: exp.description || exp.description_html || '',
        location: exp.location || '',
        employmentType: exp.employment_type || '',
        duration: duration
      };
      
      console.log(`✅ Mapped experience ${index + 1}:`, mappedExp);
      return mappedExp;
    });

    // Education - following ScrapingDog structure
    const education = (brightDataProfile.education || []).map((edu: any, index: number) => {
      console.log(`📊 Processing education ${index + 1}:`, edu);
      
      const mappedEdu = {
        id: `edu-brightdata-${Date.now()}-${index}`,
        institution: edu.school || edu.title || edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.field_of_study || edu.field || '',
        startDate: edu.start_year || edu.start_date || '',
        endDate: edu.end_year || edu.end_date || '',
        description: edu.description || '',
        grade: edu.grade || '',
        activities: edu.activities || ''
      };
      
      console.log(`✅ Mapped education ${index + 1}:`, mappedEdu);
      return mappedEdu;
    });

    // Skills - BrightData format
    const skills = (brightDataProfile.skills || []).map((skill: any, index: number) => ({
      id: `skill-brightdata-${Date.now()}-${index}`,
      name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
      level: typeof skill === 'object' ? (skill.level || skill.proficiency || '') : ''
    }));

    // Projects - following ScrapingDog structure  
    const projects = (brightDataProfile.projects || []).map((project: any, index: number) => {
      console.log(`📊 Processing project ${index + 1}:`, project);
      
      const mappedProject = {
        id: `project-brightdata-${Date.now()}-${index}`,
        name: project.name || project.title || `Project ${index + 1}`,
        title: project.title || project.name || '',
        description: project.description || '',
        url: project.url || project.link || '',
        startDate: project.start_date || '',
        endDate: project.end_date || '',
        skills: project.skills || project.technologies || '',
        duration: project.duration || ''
      };
      
      console.log(`✅ Mapped project ${index + 1}:`, mappedProject);
      return mappedProject;
    });

    // Awards - following ScrapingDog structure
    const awards = (brightDataProfile.honors_and_awards || []).map((award: any, index: number) => {
      console.log(`📊 Processing award ${index + 1}:`, award);
      
      const mappedAward = {
        id: `award-brightdata-${Date.now()}-${index}`,
        name: award.name || award.title || `Award ${index + 1}`,
        title: award.name || award.title || '',
        issuer: award.issuer || award.organization || '',
        date: award.date || '',
        description: award.description || '',
        type: 'award'
      };
      
      console.log(`✅ Mapped award ${index + 1}:`, mappedAward);
      return mappedAward;
    });

    // Honors - copy of awards for ScrapingDog compatibility
    const honors = [...awards];

    // Certifications - following ScrapingDog detailed structure
    const certifications = (brightDataProfile.certifications || []).map((cert: any, index: number) => {
      console.log(`📊 Processing certification ${index + 1}:`, cert);
      
      const mappedCert = {
        id: `cert-brightdata-${Date.now()}-${index}`,
        name: cert.name || cert.title || cert.certification || `Certification ${index + 1}`,
        title: cert.title || cert.name || cert.certification || '',
        organization: cert.issuer || cert.organization || cert.authority || '',
        issuer: cert.issuer || cert.organization || cert.authority || '',
        issueDate: cert.date || cert.issue_date || cert.issueDate || '',
        expiryDate: cert.expiry_date || cert.expiryDate || '',
        credentialId: cert.credential_id || cert.credentialId || '',
        url: cert.url || cert.credential_url || '',
        description: cert.description || '',
        skills: cert.skills || '',
        status: cert.status || 'permanent'
      };
      
      console.log(`✅ Mapped certification ${index + 1}:`, mappedCert);
      return mappedCert;
    });

    // Languages - following ScrapingDog structure
    const languages = (brightDataProfile.languages || []).map((lang: any, index: number) => {
      console.log(`📊 Processing language ${index + 1}:`, lang);
      
      const mappedLang = {
        id: `lang-brightdata-${Date.now()}-${index}`,
        language: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
        level: typeof lang === 'object' ? (lang.proficiency || lang.level || 'Orta') : 'Orta'
      };
      
      console.log(`✅ Mapped language ${index + 1}:`, mappedLang);
      return mappedLang;
    });

    // Volunteer Experience - following ScrapingDog detailed structure
    const volunteerExperience = (brightDataProfile.volunteer_experience || []).map((vol: any, index: number) => {
      console.log(`📊 Processing volunteer ${index + 1}:`, vol);
      
      // Parse dates like ScrapingDog
      let startDate = vol.start_date || vol.startDate || '';
      let endDate = vol.end_date || vol.endDate || '';
      let duration = vol.duration || '';
      let current = vol.current || false;
      
      if (startDate && endDate) {
        duration = `${startDate} - ${endDate}`;
      } else if (startDate) {
        duration = startDate;
      }
      
      if (!endDate || endDate === 'Present') {
        current = true;
      }

      const mappedVol = {
        id: `vol-brightdata-${Date.now()}-${index}`,
        // New format fields
        company_name: vol.organization || vol.company || '',
        company_position: vol.position || vol.role || '',
        company_url: vol.url || '',
        company_duration: duration,
        starts_at: startDate,
        ends_at: endDate,
        description: vol.description || '',
        
        // Legacy fields for compatibility
        organization: vol.organization || vol.company || '',
        company: vol.organization || vol.company || '',
        role: vol.position || vol.role || '',
        position: vol.position || vol.role || '',
        cause: vol.cause || vol.area || '',
        field: vol.area || vol.cause || '',
        duration: duration,
        summary: vol.description || '',
        current: current
      };
      
      console.log(`✅ Mapped volunteer ${index + 1}:`, mappedVol);
      return mappedVol;
    });

    const transformedData = {
      personalInfo,
      experience,
      education,
      skills,
      projects,
      awards,
      honors,
      certifications,
      languages,
      volunteerExperience
    };

    console.log('✅ BrightData transformation completed with ScrapingDog compatibility:', {
      personalInfo: personalInfo.fullName,
      experienceCount: experience.length,
      educationCount: education.length,
      skillsCount: skills.length,
      projectsCount: projects.length,
      awardsCount: awards.length,
      honorsCount: honors.length,
      certificationsCount: certifications.length,
      languagesCount: languages.length,
      volunteerExperienceCount: volunteerExperience.length
    });

    return transformedData;
  }

  /**
   * Test API key validity with different BrightData API formats
   */
  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      // BrightData yeni API structure - zone-based API calls
      const testUrls = [
        'https://brightdata.com/api/zone',
        'https://api.brightdata.com/zone',
        'https://brightdata.com/api/collector',
        'https://api.brightdata.com/collector',
        'https://brightdata.com/api/datacenter/zone',
        'https://api.brightdata.com/datacenter/zone'
      ];
      
      for (const testUrl of testUrls) {
        try {
          console.log(`🔑 Testing API key with: ${testUrl}`);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log(`📊 Test response: ${response.status}`);
          
          if (response.status === 200) {
            console.log('✅ API key valid!');
            return true;
          } else if (response.status === 401 || response.status === 403) {
            console.error(`❌ API key invalid (${response.status})`);
            continue; // Try next URL
          }
          
        } catch (error) {
          console.error(`❌ Test URL ${testUrl} failed:`, error);
        }
      }
      
      // If all zone tests fail, try simple ping
      try {
        console.log('🔑 Trying simple BrightData ping...');
        const pingResponse = await fetch('https://brightdata.com', {
          method: 'HEAD'
        });
        
        if (pingResponse.ok) {
          console.log('✅ BrightData reachable, API key may still work for data collection');
          return true; // Allow to proceed - API key might work for data collection
        }
      } catch (error) {
        console.error('❌ BrightData ping failed:', error);
      }
      
      return false;
    } catch (error) {
      console.error('❌ API key test failed:', error);
      return false;
    }
  }

  /**
   * Main method to scrape LinkedIn profile
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<any> {
    try {
      console.log('🚀 BrightData LinkedIn scraping başlayır:', profileUrl);
      
      // Get API key
      const apiKey = await getBrightDataApiKey();
      if (!apiKey) {
        throw new Error('BrightData API key tapılmadı');
      }

      // Test API key first
      console.log('🔑 Step 0: API key test edilir...');
      const isApiKeyValid = await this.testApiKey(apiKey);
      console.log(`🔑 API key test result: ${isApiKeyValid}`);
      
      // Even if API key test fails, we'll try the scraping (some APIs don't allow general testing)
      if (!isApiKeyValid) {
        console.log('⚠️ API key test failed, but continuing with scraping attempt...');
      } else {
        console.log('✅ API key test passed!');
      }

      // Step 1: Trigger scraping
      console.log('📡 Step 1: Scraping trigger edilir...');
      const snapshotId = await this.triggerScraping(profileUrl, apiKey);
      console.log('✅ Scraping triggered, Snapshot ID:', snapshotId);

      // Step 2: Wait for results
      console.log('⏳ Step 2: Results gözlənilir...');
      const results = await this.waitForResults({ snapshot_id: snapshotId }, apiKey);
      console.log('✅ Results alındı!');

      // Step 3: Transform to our format
      console.log('🔄 Step 3: Data transform edilir...');
      const transformedData = this.transformBrightDataProfile(results);
      console.log('✅ Data transform tamamlandı!');

      return {
        success: true,
        data: transformedData,
        provider: 'brightdata',
        rawData: results
      };

    } catch (error) {
      console.error('❌ BrightData scraping error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'brightdata'
      };
    }
  }
}