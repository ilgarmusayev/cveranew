// Test Gemini AI directly with LinkedIn Import Service
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiAI = new GoogleGenerativeAI('AIzaSyCPw5lA9c4huYqnZ_8gCYMAqUexGVTJGJ4');

async function testAISummaryGeneration() {
  console.log('🚀 Testing AI Summary Generation...');
  
  const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Mock CV data for testing
  const mockCVData = {
    personalInfo: {
      fullName: 'Müsayev Developer',
      title: 'Software Engineer',
      location: 'Baku, Azerbaijan'
    },
    experience: [
      {
        position: 'Frontend Developer',
        company: 'Tech Company',
        startDate: '2022',
        endDate: 'Present',
        description: 'Developed React applications and improved user experience'
      },
      {
        position: 'Junior Developer',
        company: 'Startup Company',
        startDate: '2021',
        endDate: '2022',
        description: 'Worked with JavaScript and Node.js'
      }
    ],
    education: [
      {
        degree: 'Computer Science',
        institution: 'University Name',
        field: 'Software Engineering'
      }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python']
  };

  const prompt = `
    Create a professional summary for this candidate optimized for ATS (Applicant Tracking System) compatibility:

    Personal Information:
    - Name: ${mockCVData.personalInfo.fullName}
    - Current Title/Role: ${mockCVData.personalInfo.title}
    - Location: ${mockCVData.personalInfo.location}

    Professional Experience:
    ${mockCVData.experience.map((exp) => 
      `- ${exp.position} at ${exp.company} (${exp.startDate} - ${exp.endDate})
       Key responsibilities: ${exp.description}`
    ).join('\n')}

    Education:
    ${mockCVData.education.map((edu) => 
      `- ${edu.degree} in ${edu.field} from ${edu.institution}`
    ).join('\n')}

    Core Skills: ${mockCVData.skills.join(', ')}

    Requirements:
    1. Write 3-4 sentences (80-120 words)
    2. Start with years of experience or professional title
    3. Include 3-4 key technical skills naturally
    4. Mention industry or domain expertise
    5. Include one key achievement or strength
    6. Use action verbs and professional language
    7. Optimize for ATS by using industry keywords
    8. Make it engaging but professional
    9. Focus on value proposition to employers

    Write a compelling professional summary that would make this candidate stand out to recruiters and pass ATS screening.
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiSummary = result.response.text().trim();

    console.log('✅ AI Summary Generated Successfully!');
    console.log('='.repeat(60));
    console.log(aiSummary);
    console.log('='.repeat(60));
    console.log(`Length: ${aiSummary.length} characters`);
    
    return aiSummary;
  } catch (error) {
    console.error('❌ AI Summary Generation Failed:', error);
    return null;
  }
}

async function testAISkillDescription() {
  console.log('\n🚀 Testing AI Skill Description Generation...');
  
  const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const skillName = 'React';
  const skillType = 'hard';
  
  const prompt = `
    Create a professional description for the skill "${skillName}" (texniki bacarığı) based on this professional context:

    Professional Background:
    - Current Role: Frontend Developer
    - Industry/Field: Technology/Software Development
    
    Recent Experience:
    Frontend Developer - Tech Company: Developed React applications and improved user experience

    Related Skills: JavaScript, TypeScript, Node.js, Redux, CSS

    Requirements for Technical Skills:
    1. Write 1-2 sentences (25-40 words)
    2. Be specific and professional
    3. Focus on practical application in work context
    4. Use industry-appropriate terminology
    5. Make it ATS-friendly with relevant keywords
    6. Show value to potential employers
    7. Include specific technologies, tools, or methodologies

    Generate a concise, professional description that demonstrates expertise and value.
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiDescription = result.response.text().trim();

    console.log('✅ AI Skill Description Generated Successfully!');
    console.log('='.repeat(60));
    console.log(`Skill: ${skillName}`);
    console.log(`Description: ${aiDescription}`);
    console.log('='.repeat(60));
    console.log(`Length: ${aiDescription.length} characters`);
    
    return aiDescription;
  } catch (error) {
    console.error('❌ AI Skill Description Generation Failed:', error);
    return null;
  }
}

// Run tests
async function runTests() {
  await testAISummaryGeneration();
  await testAISkillDescription();
}

runTests();
