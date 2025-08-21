const axios = require('axios');

/**
 * BrightData LinkedIn Scraper - Optimized for ONLY CV essentials
 * Yalnız bu bölümləri gətirir: Şəxsi Məlumatlar, İş Təcrübəsi, Təhsil, Dillər, Layihələr, Sertifikatlar, Könüllü Təcrübə
 */
class BrightDataLinkedInScraper {
  constructor(apiKey, datasetId = 'gd_l1viktl72bvl7bjuj0') {
    this.apiKey = apiKey;
    this.datasetId = datasetId;
    this.baseUrl = 'https://api.brightdata.com/datasets/v3';
  }

  /**
   * ScrapingDog formatında LinkedIn profil məlumatları - YALNIZ CV bölümləri
   * @param {string} linkedinUrl - LinkedIn profil URL və ya username
   * @param {Object} options - Scraping seçimləri
   */
  async scrapeProfile(linkedinUrl, options = {}) {
    const {
      premium = 'false'
    } = options;

    try {
      console.log('🚀 BrightData LinkedIn scraping başladı...');

      const url = this.formatLinkedInUrl(linkedinUrl);
      console.log(`🔍 Profil URL: ${url}`);

      // BrightData dataset API call
      const requestData = [{
        url: url,
        ...(premium === 'true' && { premium: true })
      }];

      const response = await axios.post(
        `${this.baseUrl}/trigger?dataset_id=${this.datasetId}`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.status === 200) {
        const snapshotId = response.data.snapshot_id;
        console.log(`✅ Scraping başladı. Snapshot ID: ${snapshotId}`);

        // Wait for results
        return await this.waitForResults(snapshotId);
      } else {
        throw new Error(`BrightData API error: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ BrightData scraping xətası:', error.message);
      throw error;
    }
  }

  /**
   * ScrapingDog məlumatları gözlə və işlə - daha uzun timeout
   */
  async waitForResults(snapshotId, maxAttempts = 20) {
    let attempts = 0;
    const pollInterval = 8000; // 8 seconds - daha uzun interval

    console.log(`⏳ BrightData scraping tamamlanması gözlənilir... (maksimum ${maxAttempts * pollInterval / 1000} saniyə)`);

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Cəhd ${attempts + 1}/${maxAttempts} - ${attempts * pollInterval / 1000}s keçdi...`);

        const response = await axios.get(
          `${this.baseUrl}/snapshot/${snapshotId}?format=json`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 15000 // 15 second request timeout
          }
        );

        if (response.status === 200 && response.data && response.data.length > 0) {
          console.log('✅ LinkedIn məlumatları alındı!');
          return this.processForCV(response.data[0]);
        }

        // LinkedIn scraping adi halda 30-60 saniyə çəkir
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 202) {
          // Hələ də işlənir
          console.log('⏳ Scraping davam edir...');
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          // Network timeout - cəhd et
          console.log('⚠️  Network timeout, yenidən cəhd edilir...');
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          attempts++;
          continue;
        } else {
          console.error(`❌ Polling xətası: ${error.message}`);
          if (attempts === maxAttempts - 1) {
            throw new Error(`Polling failed after ${maxAttempts} attempts: ${error.message}`);
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
    }

    throw new Error(`Scraping timeout - ${maxAttempts * pollInterval / 1000} saniyə sonra nəticə alınmadı`);
  }

  /**
   * CV üçün YALNIZ lazım olan məlumatları işlə
   * Şəxsi Məlumatlar, İş Təcrübəsi, Təhsil, Dillər, Layihələr, Sertifikatlar, Könüllü Təcrübə
   */
  processForCV(rawData) {
    if (!rawData) {
      throw new Error('No data received from BrightData');
    }

    // ScrapingDog formatında CV məlumatları
    const cvData = {
      // 1. Şəxsi Məlumatlar
      personal_info: {
        name: this.cleanText(rawData.name || rawData.full_name),
        headline: this.cleanText(rawData.headline || rawData.title || rawData.position),
        location: this.cleanText(rawData.location || rawData.geo_location || rawData.city),
        profile_image: rawData.profile_image_url || rawData.profile_pic_url || rawData.avatar,
        summary: this.cleanText(rawData.summary || rawData.about)
      },

      // 2. İş Təcrübəsi
      experience: this.processExperience(rawData.experience || rawData.experiences || []),

      // 3. Təhsil - educations_details sahəsindən gəlir
      education: this.processEducation(rawData.educations_details || []),

      // 4. Dillər
      languages: this.processLanguages(rawData.languages || []),

      // 5. Layihələr
      projects: this.processProjects(rawData.projects || rawData.accomplishments?.projects || []),

      // 6. Sertifikatlar - həm certifications həm də honors_and_awards birləşdirilir
      certifications: [
        ...this.processCertifications(rawData.certifications || []),
        ...this.processCertifications(rawData.honors_and_awards || [])
      ],

      // 7. Könüllü Təcrübə
      volunteering: this.processVolunteering(rawData.volunteering || rawData.volunteer_experience || [])
    };

    // Validation: Bütün əsas məlumatlar alınıbmı yoxla
    const hasBasicInfo = cvData.personal_info.name;

    // Əgər əsas məlumatlar yoxdursa, xəta ver
    if (!hasBasicInfo) {
      throw new Error('Əsas profil məlumatları alınmadı - ad tapılmadı');
    }

    console.log(`✅ CV məlumatları hazır: Ad: ${cvData.personal_info.name}, İş təcrübəsi: ${cvData.experience.length}, Təhsil: ${cvData.education.length}, Layihələr: ${cvData.projects.length}, Sertifikatlar: ${cvData.certifications.length}`);

    return cvData;
  }

  /**
   * Format LinkedIn URL
   */
  formatLinkedInUrl(input) {
    if (input.startsWith('http')) {
      return input;
    }
    const cleanUsername = input.replace('@', '').replace('linkedin.com/in/', '');
    return `https://www.linkedin.com/in/${cleanUsername}/`;
  }

  /**
   * Mətni təmizlə
   */
  cleanText(text) {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ').replace(/\n+/g, ' ');
  }

  /**
   * İş təcrübəsini işlə
   */
  processExperience(experiences) {
    if (!experiences || !Array.isArray(experiences)) return [];

    return experiences.map(exp => ({
      title: this.cleanText(exp.title || exp.position),
      company: this.cleanText(exp.company || exp.company_name),
      duration: this.cleanText(exp.duration || exp.dates),
      description: this.cleanText(exp.description),
      location: this.cleanText(exp.location),
      is_current: exp.duration?.toLowerCase().includes('present') || false
    })).filter(exp => exp.title && exp.company);
  }

  /**
   * Təhsili işlə - daha geniş axtarış
   */
  processEducation(education) {
    if (!education || !Array.isArray(education)) return [];

    return education.map(edu => ({
      school: this.cleanText(edu.school || edu.institution || edu.university),
      degree: this.cleanText(edu.degree || edu.qualification),
      field_of_study: this.cleanText(edu.field || edu.field_of_study || edu.major),
      duration: this.cleanText(edu.duration || edu.dates || edu.period),
      description: this.cleanText(edu.description || edu.activities),
      grade: this.cleanText(edu.grade || edu.gpa)
    })).filter(edu => edu.school);
  }

  /**
   * Dilləri işlə
   */
  processLanguages(languages) {
    if (!languages || !Array.isArray(languages)) return [];

    return languages.map(lang => ({
      language: this.cleanText(lang.name || lang.language || lang),
      proficiency: this.cleanText(lang.proficiency || lang.level)
    })).filter(lang => lang.language);
  }

  /**
   * Layihələri işlə
   */
  processProjects(projects) {
    if (!projects || !Array.isArray(projects)) return [];

    return projects.map(proj => ({
      title: this.cleanText(proj.title || proj.name),
      description: this.cleanText(proj.description),
      duration: this.cleanText(proj.duration || proj.dates),
      url: this.cleanText(proj.url || proj.link)
    })).filter(proj => proj.title);
  }

  /**
   * Sertifikatları işlə - honors, awards, certifications daxil olmaqla
   */
  processCertifications(certifications) {
    if (!certifications || !Array.isArray(certifications)) return [];

    return certifications.map(cert => ({
      name: this.cleanText(cert.name || cert.title || cert.award),
      issuer: this.cleanText(cert.issuer || cert.organization || cert.institution),
      issue_date: this.cleanText(cert.issue_date || cert.date || cert.received_date),
      expiry_date: this.cleanText(cert.expiry_date || cert.expires),
      credential_id: this.cleanText(cert.credential_id || cert.id),
      url: this.cleanText(cert.url || cert.link),
      type: this.cleanText(cert.type || 'certification') // certification, honor, award
    })).filter(cert => cert.name);
  }

  /**
   * Könüllü təcrübəni işlə
   */
  processVolunteering(volunteering) {
    if (!volunteering || !Array.isArray(volunteering)) return [];

    return volunteering.map(vol => ({
      organization: this.cleanText(vol.organization || vol.company),
      role: this.cleanText(vol.role || vol.title),
      cause: this.cleanText(vol.cause),
      duration: this.cleanText(vol.duration || vol.dates),
      description: this.cleanText(vol.description)
    })).filter(vol => vol.organization);
  }
}

module.exports = BrightDataLinkedInScraper;
