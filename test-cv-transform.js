// Test LinkedIn data transformation
const testData = [
  {
    "fullName": "Ilgar Musayev",
    "first_name": "Ilgar",
    "last_name": "Musayev",
    "public_identifier": "musayevcreate",
    "public_profile_url": "https://www.linkedin.com/in/musayevcreate",
    "headline": "Co-Founder @ Veezet   Founder @ CVERA  SDET(Java) Mentor @ CAPS Academy",
    "location": "Azerbaijan",
    "about": "As a Mentor at CAPS Academy — the first SDET training institution in Azerbaijan — I support the development of future software professionals...",
    "experience": [
      {
        "position": "Founder",
        "company_name": "CVERA",
        "location": "Azerbaijan",
        "summary": "Building next-generation CV platform",
        "starts_at": "Jul 2025",
        "ends_at": "Present",
        "duration": "1 month"
      }
    ],
    "education": [
      {
        "college_name": "Azerbaijan State University of Oil and Industry",
        "college_degree": "Bachelor's degree",
        "college_degree_field": "Electrical and Electronics Engineering",
        "college_duration": "2022 - 2026"
      }
    ],
    "projects": [
      {
        "title": "CVera",
        "duration": "Jul 2025"
      },
      {
        "title": "Veezet",
        "duration": "Jun 2022"
      }
    ],
    "awards": [
      {
        "name": "Matrix Academy Honours Degree Diploma (Java)",
        "organization": "Matrix Academy",
        "duration": "2024"
      }
    ],
    "certification": [],
    "skills": [],
    "languages": []
  }
];

// Simulate the transform function
function transformLinkedInData(linkedInData) {
  let profileData = linkedInData;
  if (Array.isArray(linkedInData) && linkedInData.length > 0) {
    profileData = linkedInData[0];
  }

  const transformedData = {
    personalInfo: {
      fullName: profileData.fullName || profileData.full_name || profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      website: profileData.public_profile_url || profileData.website || '',
      linkedin: profileData.public_profile_url || profileData.linkedin || '',
      summary: profileData.about || profileData.headline || profileData.summary || ''
    },
    experience: Array.isArray(profileData.experience) ? profileData.experience.map((exp, index) => ({
      id: `exp-${Date.now()}-${index}`,
      position: exp.position || exp.title || '',
      company: exp.company_name || exp.company || '',
      startDate: exp.starts_at || exp.start_date || exp.startDate || '',
      endDate: exp.ends_at || exp.end_date || exp.endDate || '',
      description: exp.summary || exp.description || '',
      location: exp.location || ''
    })) : [],
    education: Array.isArray(profileData.education) ? profileData.education.map((edu, index) => ({
      id: `edu-${Date.now()}-${index}`,
      degree: edu.college_degree || edu.degree || '',
      institution: edu.college_name || edu.school || edu.institution || '',
      year: edu.college_duration || edu.duration || edu.year || '',
      description: edu.college_activity || edu.description || edu.college_degree_field || '',
      gpa: edu.gpa || ''
    })) : [],
    projects: Array.isArray(profileData.projects) ? profileData.projects.map((proj, index) => ({
      id: `proj-${Date.now()}-${index}`,
      name: proj.title || proj.name || '',
      description: proj.description || proj.summary || `${proj.title || proj.name || ''} layihəsi`,
      startDate: proj.duration || proj.start_date || proj.startDate || '',
      endDate: proj.end_date || proj.endDate || '',
      skills: proj.skills || proj.technologies || '',
      url: proj.link || proj.url || ''
    })) : [],
    certifications: Array.isArray(profileData.certification) ? profileData.certification.map((cert, index) => ({
      id: `cert-${Date.now()}-${index}`,
      name: cert.name || cert.title || cert.certification || '',
      issuer: cert.authority || cert.issuer || cert.organization || '',
      date: cert.start_date || cert.date || cert.issued_date || cert.duration || '',
      description: cert.description || cert.summary || ''
    })) : [],
    honorsAwards: Array.isArray(profileData.awards) ? profileData.awards.map((award, index) => ({
      id: `award-${Date.now()}-${index}`,
      title: award.name || award.title || '',
      issuer: award.organization || award.issuer || award.authority || '',
      date: award.duration || award.date || award.issued_date || '',
      description: award.summary || award.description || ''
    })) : []
  };

  return transformedData;
}

// Test the transformation
console.log('🧪 Testing LinkedIn data transformation...');
const result = transformLinkedInData(testData);

console.log('\n✅ Transform Results:');
console.log('Personal Info:', result.personalInfo);
console.log('Experience Count:', result.experience.length);
console.log('Education Count:', result.education.length);
console.log('Projects Count:', result.projects.length);
console.log('Awards Count:', result.honorsAwards.length);
console.log('Certifications Count:', result.certifications.length);

console.log('\n📋 Experience Details:');
if (result.experience.length > 0) {
  console.log('First Experience:', result.experience[0]);
}

console.log('\n🎓 Education Details:');
if (result.education.length > 0) {
  console.log('First Education:', result.education[0]);
}

console.log('\n🚀 Projects Details:');
if (result.projects.length > 0) {
  console.log('First Project:', result.projects[0]);
}

console.log('\n🏆 Awards Details:');
if (result.honorsAwards.length > 0) {
  console.log('First Award:', result.honorsAwards[0]);
}
