// Test RapidAPI skills transformation in CVEditor format
const rapidApiResponse = {
  "data": {
    "awards": [
      "1. Matrix Academy Honours Degree Diploma (Java)",
      "4. Easy Solutions Technologies (Net & Sys Administrator)",
      "5. Easy Solutions Technologies (Network Voice Engineer)",
      "2. Pasha Hackathon 3.0 (Finalist)",
      "3. Develop with aiesec"
    ],
    "certifications": [],
    "languages": [],
    "patents": [],
    "publications": [],
    "skills": [
      "Next.js",
      "PostgreSQL",
      "Spring Framework"
    ]
  },
  "message": "ok"
};

// Simulate CVEditor transform function
function transformRapidAPISkills(profileData) {
  console.log('🎯 Testing RapidAPI Skills Transformation...');
  console.log('📊 Input data:', profileData);

  let transformedSkills = [];

  // Check RapidAPI format first (data.skills)
  if (profileData.data && Array.isArray(profileData.data.skills) && profileData.data.skills.length > 0) {
    console.log('🔍 Found RapidAPI skills format:', profileData.data.skills);
    transformedSkills = profileData.data.skills.map((skill, index) => {
      const skillObj = {
        id: `skill-${index}-${Date.now()}`,
        name: typeof skill === 'string' ? skill : skill.name || skill.skill || '',
        level: 'Intermediate'
      };
      console.log(`🔧 Transforming RapidAPI skill ${index}:`, skillObj);
      return skillObj;
    });
  }
  // Check direct skills array (ScrapingDog or other formats)
  else if (Array.isArray(profileData.skills) && profileData.skills.length > 0) {
    console.log('🔍 Found direct skills format:', profileData.skills);
    transformedSkills = profileData.skills.map((skill, index) => ({
      id: `skill-${index}-${Date.now()}`,
      name: typeof skill === 'string' ? skill : skill.name || skill.skill || '',
      level: 'Intermediate'
    }));
  }

  console.log('✅ Final transformed skills:', transformedSkills);

  // Also transform awards from RapidAPI
  let transformedAwards = [];
  if (profileData.data && Array.isArray(profileData.data.awards)) {
    transformedAwards = profileData.data.awards.map((award, index) => ({
      id: `award-${index}-${Date.now()}`,
      title: typeof award === 'string' ? award : award.name || award.title || '',
      issuer: '',
      date: '',
      description: ''
    }));
  }

  console.log('🏆 Transformed awards:', transformedAwards);

  return {
    skills: transformedSkills,
    awards: transformedAwards,
    summary: {
      skillsCount: transformedSkills.length,
      awardsCount: transformedAwards.length,
      source: 'RapidAPI'
    }
  };
}

// Test the transformation
console.log('🧪 Testing RapidAPI Skills Transformation...\n');
const result = transformRapidAPISkills(rapidApiResponse);

console.log('\n📊 Transform Summary:');
console.log('✅ Skills successfully transformed:', result.summary.skillsCount > 0);
console.log('✅ Awards successfully transformed:', result.summary.awardsCount > 0);
console.log('📝 Source:', result.summary.source);

console.log('\n🎯 Skills for CV:');
result.skills.forEach((skill, index) => {
  console.log(`${index + 1}. ${skill.name} (${skill.level})`);
});

console.log('\n🏆 Awards for CV:');
result.awards.forEach((award, index) => {
  console.log(`${index + 1}. ${award.title}`);
});
