export interface ParsedLinkedInData {
  personalInfo: {
    name: string;
    email: string;  
    phone: string;
    linkedin: string;
    summary: string;
    website: string;
    headline: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    jobType: string;
    skills: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    activities: string;
    grade: string;
  }>;
  skills: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    skills: string;
    url: string;
  }>;
}

export function parseLinkedInData(rawData: any, url: string): ParsedLinkedInData {
  return {
    personalInfo: {
      name: rawData.name || '',
      email: '', // LinkedIn-dən email gəlmir
      phone: '',
      linkedin: url,
      summary: rawData.about || '',
      website: '',
      headline: rawData.headline || ''
    },
    experience: rawData.experience?.map((exp: any) => ({
      company: exp.company || '',
      position: exp.position || '',
      startDate: exp.date_range ? exp.date_range.split(' - ')[0] || '' : '',
      endDate: exp.date_range ? (exp.date_range.split(' - ')[1] !== 'Present' ? exp.date_range.split(' - ')[1] || '' : '') : '',
      current: exp.date_range ? exp.date_range.includes('Present') : false,
      description: exp.description || '',
      jobType: '',
      skills: ''
    })) || [],
    education: rawData.education?.map((edu: any) => ({
      institution: edu.school || '',
      degree: edu.degree || '',
      field: edu.field_of_study || '',
      startDate: edu.date_range ? edu.date_range.split(' - ')[0] || '' : '',
      endDate: edu.date_range ? (edu.date_range.split(' - ')[1] !== 'Present' ? edu.date_range.split(' - ')[1] || '' : '') : '',
      current: edu.date_range ? edu.date_range.includes('Present') : false,
      description: '',
      activities: '',
      grade: ''
    })) || [],
    skills: Array.isArray(rawData.skills) && rawData.skills.length > 0 ? 
        rawData.skills.map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name || skill,
          level: 'Intermediate' as const
        })) : [],
      languages: Array.isArray(rawData.languages) && rawData.languages.length > 0 ?
        rawData.languages.map((lang: any) => ({
          name: typeof lang === 'string' ? lang : lang.name || '',
          proficiency: typeof lang === 'string' ? 'Professional' : lang.proficiency || 'Professional'
        })) : [],
      certifications: [
        // Regular certifications
        ...(Array.isArray(rawData.certifications) ? rawData.certifications.map((cert: any) => ({
          name: cert.name || cert.title || '',
          issuer: cert.issuer || cert.organization || cert.authority || '',
          date: cert.date || cert.duration || '',
          description: cert.description || ''
        })) : []),
        // Awards as certifications (ScrapingDog specific)
        ...(Array.isArray(rawData.awards) ? rawData.awards.map((award: any) => ({
          name: award.name || award.title || '',
          issuer: award.issuer || award.organization || award.authority || '',
          date: award.date || award.duration || '',
          description: award.summary || award.description || ''
        })) : [])
      ],
      projects: Array.isArray(rawData.projects) && rawData.projects.length > 0 ?
        rawData.projects.map((proj: any) => ({
          name: proj.name || proj.title || '',
          description: proj.description || proj.summary || '',
          startDate: proj.startDate || proj.start_date || proj.starts_at || '',
          endDate: proj.endDate || proj.end_date || proj.ends_at || '',
          skills: proj.skills || '',
          url: proj.url || proj.link || ''
        })) : []
  };
}
