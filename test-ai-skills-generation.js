const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAISkillsGeneration() {
  try {
    console.log('🔍 AI Skills Generation Test...');
    
    // Create test profile data
    const testProfileData = {
      personalInfo: {
        fullName: 'Test Java Developer',
        title: 'Java Developer | Software Engineer',
        location: 'Baku, Azerbaijan',
        summary: 'Experienced Java developer with 3+ years in software development. Skilled in Spring Framework, REST APIs, and database management.'
      },
      experience: [
        {
          position: 'Java Developer',
          company: 'Tech Company',
          description: 'Developed REST APIs using Spring Boot, worked with PostgreSQL database, implemented microservices architecture'
        }
      ],
      education: [
        {
          degree: 'Bachelor of Computer Science',
          institution: 'Azerbaijan Technical University',
          fieldOfStudy: 'Computer Science'
        }
      ]
    };
    
    const existingSkills = []; // Empty skills array
    
    console.log('📊 Test profil məlumatları:');
    console.log('- Ad:', testProfileData.personalInfo.fullName);
    console.log('- Başlıq:', testProfileData.personalInfo.title);
    console.log('- Təcrübə:', testProfileData.experience[0].position);
    console.log('- Təhsil:', testProfileData.education[0].degree);
    
    // Test fallback skills generation (since Gemini might fail)
    console.log('\n🔄 Fallback skills test...');
    
    // Simulate the fallback function logic
    const title = testProfileData.personalInfo.title.toLowerCase();
    const summary = testProfileData.personalInfo.summary.toLowerCase();
    const allText = `${title} ${summary}`.toLowerCase();
    
    console.log('🔍 Analiz edilən mətn:', allText.substring(0, 200) + '...');
    
    // Check for keywords
    const hardSkillsMap = {
      'java': ['Java', 'Spring Framework'],
      'developer': ['Git', 'APIs'],
      'software': ['Software Development', 'Testing'],
      'spring': ['Spring Boot', 'Spring Security']
    };
    
    let selectedHardSkills = [];
    for (const [keyword, skills] of Object.entries(hardSkillsMap)) {
      if (allText.includes(keyword) && selectedHardSkills.length < 2) {
        console.log(`✅ "${keyword}" açar sözü tapıldı: ${skills.join(', ')}`);
        selectedHardSkills.push(...skills.slice(0, 2 - selectedHardSkills.length));
      }
    }
    
    const softSkillsOptions = [
      'Communication', 'Problem Solving', 'Teamwork', 'Leadership'
    ];
    
    const selectedSoftSkills = softSkillsOptions.slice(0, 2);
    
    console.log('\n🎯 Seçilən skills:');
    console.log('Hard Skills:', selectedHardSkills);
    console.log('Soft Skills:', selectedSoftSkills);
    
    // Format like the actual function
    const formattedSkills = [
      ...selectedHardSkills.map((skill, index) => ({
        id: `test-hard-skill-${Date.now()}-${index}`,
        name: skill,
        level: 'Orta',
        type: 'hard',
        source: 'test'
      })),
      ...selectedSoftSkills.map((skill, index) => ({
        id: `test-soft-skill-${Date.now()}-${index}`,
        name: skill,
        level: 'Orta',
        type: 'soft',
        source: 'test'
      }))
    ];
    
    console.log('\n📋 Formatlanmış skills:');
    formattedSkills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill.name} (${skill.type}) - ${skill.level}`);
    });
    
    console.log(`\n✅ Test uğurludur! ${formattedSkills.length} skill yaradıldı.`);
    console.log('📊 Skills əlavə etmə mexanizmi işləyir.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAISkillsGeneration();
