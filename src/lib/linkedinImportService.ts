import { APIKeyManager } from '@/lib/apiKeyManager';

export class LinkedInImportService {

  // LinkedIn profil məlumatlarını BrightData vasitəsilə əldə et
  static async importFromLinkedIn(linkedinUsername: string): Promise<any> {
    try {
      console.log(`🔄 LinkedIn import başladı: ${linkedinUsername}`);
      console.log(`⏳ Məlumatlar toplanır...`);

      // BrightData sorğusu MÜTLƏQ get - heç bir fallback yoxdur
      const brightDataResult = await this.importWithBrightData(linkedinUsername);

      if (!brightDataResult) {
        throw new Error('BrightData-dan məlumat alınmadı');
      }

      if (!this.validateLinkedInData(brightDataResult)) {
        throw new Error('BrightData məlumatları etibarsızdır');
      }

      console.log(`✅ BrightData ilə uğurlu import: ${linkedinUsername}`);
      console.log(`📄 CV formatına çevrilir...`);

      // Datalar alındıqdan sonra format et
      const formattedData = this.formatLinkedInData(brightDataResult, 'brightdata');

      console.log(`✅ CV məlumatları hazır: ${formattedData.personalInfo.fullName}`);

      return formattedData;

    } catch (error) {
      console.error(`❌ LinkedIn import xətası: ${linkedinUsername}`, error);
      // Xəta halında ScrapingDog və ya başqa API-yə keçmə - YALNIZ BrightData
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`LinkedIn import uğursuz oldu: ${errorMessage}`);
    }
  }

  // BrightData ile LinkedIn scraping
  private static async importWithBrightData(linkedinUsername: string): Promise<any> {
    try {
      const axios = require('axios');

      // BrightData API konfigurasiyası
      const api_key = process.env.BRIGHTDATA_API_KEY || 'da77d05e80aa038856c04cb0e96d34a267be39e89a46c03ed15e68b38353eaae';
      const dataset_id = 'gd_l1viktl72bvl7bjuj0';
      const baseUrl = 'https://api.brightdata.com/datasets/v3';

      // LinkedIn URL hazırla
      const linkedinUrl = `https://www.linkedin.com/in/${linkedinUsername}`;

      console.log(`🔍 BrightData scraping başladı: ${linkedinUrl}`);

      // BrightData dataset API call
      const requestData = [{
        url: linkedinUrl
      }];

      const response = await axios.post(
        `${baseUrl}/trigger?dataset_id=${dataset_id}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.status === 200) {
        const snapshotId = response.data.snapshot_id;
        console.log(`✅ Scraping başladı. Snapshot ID: ${snapshotId}`);

        // Məlumatları gözlə
        return await this.waitForBrightDataResults(snapshotId, api_key, baseUrl);
      } else {
        throw new Error(`BrightData API error: ${response.status}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ BrightData scraping xətası:', errorMessage);
      throw error;
    }
  }

  // BrightData nəticələrini gözlə
  private static async waitForBrightDataResults(snapshotId: string, apiKey: string, baseUrl: string): Promise<any> {
    const axios = require('axios');
    let attempts = 0;
    const maxAttempts = 20;
    const pollInterval = 8000; // 8 seconds

    console.log(`⏳ BrightData məlumatları gözlənilir...`);

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Cəhd ${attempts + 1}/${maxAttempts}...`);

        const response = await axios.get(
          `${baseUrl}/snapshot/${snapshotId}?format=json`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            },
            timeout: 15000
          }
        );

        if (response.status === 200 && response.data && response.data.length > 0) {
          console.log('✅ LinkedIn məlumatları alındı!');
          return response.data[0];
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

      } catch (error) {
        // Type guard to check if error has response property (axios error)
        const axiosError = error as any;
        if (axiosError.response?.status === 404 || axiosError.response?.status === 202) {
          console.log('⏳ Scraping davam edir...');
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        }

        if (attempts === maxAttempts - 1) {
          throw new Error(`BrightData polling failed after ${maxAttempts} attempts`);
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('BrightData scraping timeout');
  }

  // LinkedIn data-nın etibarlı olduğunu yoxla
  private static validateLinkedInData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // Minimum tələb olunan sahələr
    const hasBasicInfo = data.name || data.full_name || data.headline || data.position;
    return !!hasBasicInfo;
  }

  // LinkedIn data-nı CV formatına çevir
  private static formatLinkedInData(rawData: any, source: string): any {
    try {
      // BrightData formatı
      if (source === 'brightdata') {
        return {
          personalInfo: {
            fullName: rawData.name || rawData.full_name || '',
            title: rawData.headline || rawData.title || rawData.position || '',
            email: rawData.email || '',
            phone: rawData.phone || '',
            location: rawData.location || rawData.geo_location || rawData.city || '',
            linkedin: rawData.url || rawData.input_url || '',
            summary: rawData.summary || rawData.about || ''
          },
          experience: this.formatExperience(rawData.experience || []),
          education: this.formatEducation(rawData.educations_details || rawData.education || []),
          skills: this.formatSkills(rawData.skills || []),
          languages: this.formatLanguages(rawData.languages || []),
          certifications: [
            ...this.formatCertifications(rawData.certifications || []),
            ...this.formatCertifications(rawData.honors_and_awards || [])
          ],
          volunteerExperience: this.formatVolunteerExperience(rawData.volunteering || rawData.volunteer_experience || []),
          projects: this.formatProjects(rawData.projects || []),
          importSource: 'brightdata',
          importDate: new Date().toISOString()
        };
      }

      return rawData;
    } catch (error) {
      console.error(`❌ Data formatlanmasında xəta:`, error);
      return rawData;
    }
  }

  // İş təcrübəsini format et
  private static formatExperience(experiences: any[]): any[] {
    if (!Array.isArray(experiences)) return [];

    return experiences.map(exp => ({
      id: this.generateId(),
      position: exp.title || exp.position || exp.job_title || '',
      company: exp.company || exp.company_name || exp.organization || '',
      location: exp.location || '',
      startDate: this.formatDate(exp.start_date || exp.startDate || exp.from),
      endDate: this.formatDate(exp.end_date || exp.endDate || exp.to),
      current: exp.current || exp.is_current || false,
      description: exp.description || exp.summary || ''
    })).filter(exp => exp.position || exp.company);
  }

  // Təhsili format et
  private static formatEducation(education: any[]): any[] {
    if (!Array.isArray(education)) return [];

    return education.map(edu => ({
      id: this.generateId(),
      degree: edu.degree || edu.qualification || '',
      institution: edu.school || edu.institution || edu.university || '',
      field: edu.field || edu.field_of_study || '',
      startDate: this.formatDate(edu.start_date || edu.startDate || edu.from),
      endDate: this.formatDate(edu.end_date || edu.endDate || edu.to),
      current: edu.current || false,
      gpa: edu.gpa || ''
    })).filter(edu => edu.degree || edu.institution);
  }

  // Bacarıqları format et
  private static formatSkills(skills: any[]): any[] {
    if (!Array.isArray(skills)) return [];

    return skills.map(skill => ({
      id: this.generateId(),
      name: typeof skill === 'string' ? skill : (skill.name || skill.skill || ''),
      level: skill.level || skill.proficiency || ''
    })).filter(skill => skill.name);
  }

  // Dilləri format et
  private static formatLanguages(languages: any[]): any[] {
    if (!Array.isArray(languages)) return [];

    return languages.map(lang => ({
      id: this.generateId(),
      language: typeof lang === 'string' ? lang : (lang.name || lang.language || ''),
      proficiency: lang.proficiency || lang.level || ''
    })).filter(lang => lang.language);
  }

  // Sertifikatları format et
  private static formatCertifications(certifications: any[]): any[] {
    if (!Array.isArray(certifications)) return [];

    return certifications.map(cert => ({
      id: this.generateId(),
      name: cert.name || cert.title || '',
      issuer: cert.issuer || cert.organization || cert.authority || '',
      date: this.formatDate(cert.date || cert.issue_date || cert.issued_date),
      url: cert.url || cert.credential_url || ''
    })).filter(cert => cert.name);
  }

  // Könüllü təcrübəni format et
  private static formatVolunteerExperience(volunteer: any[]): any[] {
    if (!Array.isArray(volunteer)) return [];

    return volunteer.map(vol => ({
      id: this.generateId(),
      role: vol.role || vol.position || vol.title || '',
      organization: vol.organization || vol.company || '',
      cause: vol.cause || vol.field || '',
      startDate: this.formatDate(vol.start_date || vol.startDate),
      endDate: this.formatDate(vol.end_date || vol.endDate),
      current: vol.current || false,
      description: vol.description || vol.summary || ''
    })).filter(vol => vol.role || vol.organization);
  }

  // Layihələri format et
  private static formatProjects(projects: any[]): any[] {
    if (!Array.isArray(projects)) return [];

    return projects.map(project => ({
      id: this.generateId(),
      name: project.name || project.title || '',
      description: project.description || project.summary || '',
      url: project.url || project.link || '',
      startDate: this.formatDate(project.start_date || project.startDate),
      endDate: this.formatDate(project.end_date || project.endDate),
      technologies: project.technologies || project.skills || []
    })).filter(project => project.name);
  }

  // Tarixi format et
  private static formatDate(dateInput: any): string {
    if (!dateInput) return '';

    try {
      // Əgər artıq string formatındadırsa
      if (typeof dateInput === 'string') {
        return dateInput;
      }

      // Əgər object formatındadırsa (ScrapingDog formatı)
      if (typeof dateInput === 'object' && dateInput.year) {
        const month = dateInput.month ? String(dateInput.month).padStart(2, '0') : '01';
        return `${dateInput.year}-${month}`;
      }

      // Əgər timestamp formatındadırsa
      if (typeof dateInput === 'number') {
        return new Date(dateInput).toISOString().split('T')[0];
      }

      return String(dateInput);
    } catch (error) {
      console.error('Tarix formatlanmasında xəta:', error);
      return '';
    }
  }

  // BrightData + RapidAPI hibrid approach - SEQUENTIAL (ardıcıl)
  static async importWithHybridApproach(linkedinUsername: string): Promise<any> {
    try {
      console.log(`🚀 Sequential hibrid import başladı: ${linkedinUsername}`);
      console.log(`📍 ADDIM 1: BrightData-dan əsas məlumatlar alınır...`);

      const linkedinUrl = `https://www.linkedin.com/in/${linkedinUsername}`;

      // ADDIM 1: İlk olaraq BrightData sorğusu - MÜTLƏQ gözlə
      let brightDataData = null;
      try {
        brightDataData = await this.importWithBrightData(linkedinUsername);

        if (!brightDataData) {
          throw new Error('BrightData-dan məlumat alınmadı');
        }

        if (!this.validateLinkedInData(brightDataData)) {
          throw new Error('BrightData məlumatları etibarsızdır');
        }

        console.log('✅ ADDIM 1 tamamlandı: BrightData məlumatları alındı');
        console.log(`📊 BrightData məlumatları: Ad: ${brightDataData.name || brightDataData.full_name}, Experience: ${brightDataData.experience?.length || 0}, Education: ${brightDataData.educations_details?.length || 0}`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ ADDIM 1 uğursuz: BrightData xətası:', errorMessage);
        throw new Error(`BrightData məlumatları alınmadı - bu mütləqdir: ${errorMessage}`);
      }

      // BrightData məlumatlarını format et
      console.log(`📍 ADDIM 2: BrightData məlumatları CV formatına çevrilir...`);
      const formattedBrightData = this.formatLinkedInData(brightDataData, 'brightdata');
      console.log('✅ ADDIM 2 tamamlandı: BrightData məlumatları formatlandı');

      // ADDIM 3: İndi RapidAPI-dən skills al (optional)
      console.log(`📍 ADDIM 3: RapidAPI-dən əlavə skills alınır...`);
      let rapidApiSkills: any[] = [];
      try {
        // RapidAPI integration is not implemented yet
        console.log('⚠️ RapidAPI integration not available - skipping skills enhancement');
        rapidApiSkills = [];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ ADDIM 3 xətası (optional): RapidAPI skills xətası:', errorMessage);
        // RapidAPI xətası varsa davam et, mütləq deyil
        rapidApiSkills = [];
      }

      // ADDIM 4: Məlumatları birləşdir
      console.log(`📍 ADDIM 4: Məlumatlar birləşdirilir...`);
      const finalData = this.combineSequentialData(formattedBrightData, rapidApiSkills);

      console.log(`✅ SEQUENTIAL hibrid import tamamlandı!`);
      console.log(`📊 Final məlumat statistikası:`, {
        name: finalData.personalInfo.fullName,
        experience: finalData.experience?.length || 0,
        education: finalData.education?.length || 0,
        skills: finalData.skills?.length || 0,
        projects: finalData.projects?.length || 0,
        certifications: finalData.certifications?.length || 0,
        dataSource: finalData.importSource
      });

      return finalData;

    } catch (error) {
      console.error(`❌ Sequential hibrid import xətası: ${linkedinUsername}`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Sequential LinkedIn import uğursuz oldu: ${errorMessage}`);
    }
  }

  // BrightData və RapidAPI məlumatlarını birləşdir (sequential)
  private static combineSequentialData(brightDataFormatted: any, rapidApiSkills: any[]): any {
    // BrightData əsas məlumat (artıq formatlanıb)
    const brightDataSkills = brightDataFormatted.skills || [];

    // Skills-i birləşdir: BrightData + RapidAPI
    const combinedSkills = [
      ...brightDataSkills.map((skill: any) => ({
        name: skill.name,
        level: skill.level,
        source: 'brightdata'
      })),
      ...rapidApiSkills.map((skill: any) => ({
        name: skill.name,
        level: skill.level,
        source: 'rapidapi'
      }))
    ];

    // Dublikatları sil
    const uniqueSkills = combinedSkills.filter((skill: any, index: number, self: any[]) =>
      index === self.findIndex((s: any) => s.name.toLowerCase() === skill.name.toLowerCase())
    );

    console.log(`📊 Skills birləşdirildi: BrightData: ${brightDataSkills.length}, RapidAPI: ${rapidApiSkills.length}, Ümumi: ${uniqueSkills.length}`);

    return {
      ...brightDataFormatted,
      skills: uniqueSkills,
      importSource: 'brightdata+rapidapi-sequential',
      dataSourceDetails: {
        brightdata: true,
        rapidapi_skills: rapidApiSkills.length > 0,
        sequence: 'brightdata-first-then-rapidapi'
      }
    };
  }

  // ID generatoru
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
