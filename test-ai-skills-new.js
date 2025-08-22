// Test new AI skills generation API
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiAI = new GoogleGenerativeAI('AIzaSyCPw5lA9c4huYqnZ_8gCYMAqUexGVTJGJ4');

async function testAISkillsGeneration() {
  console.log('🚀 Testing AI Skills Generation (Hard & Soft)...');
  
  const model = geminiAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Mock CV data for testing
  const textContent = `
    Frontend Developer with 3 years experience at Tech Company.
    Developed React applications and improved user experience.
    Computer Science degree from University.
    Worked with JavaScript, TypeScript, and Node.js.
    Led a team of 5 developers on multiple projects.
  `;
  
  const prompt = `
    Aşağıdaki CV məlumatlarına əsasən müvafiq bacarıqlar təklif edin:

    CV Məlumatları: "${textContent}"

    Tələblər:
    1. Hard Skills (Texniki bacarıqlar): proqramlaşdırma dilləri, framework-lər, verilənlər bazası, alətlər, texnologiyalar
    2. Soft Skills (Şəxsi bacarıqlar): liderlik, komanda işi, kommunikasiya, problem həll etmə
    3. CV məlumatlarına uyğun olan bacarıqları təklif edin
    4. Hər kateqoriyada maksimum 8 bacarıq
    5. JSON object formatında qaytarın
    
    Hard Skills Nümunələri:
    - Proqramlaşdırma: JavaScript, Python, Java, C#, TypeScript
    - Framework-lər: React, Vue.js, Angular, Next.js, Laravel
    - Verilənlər bazası: MySQL, PostgreSQL, MongoDB, Redis
    - Alətlər: Git, Docker, AWS, Azure, Jenkins
    - Dizayn: Photoshop, Figma, Adobe Illustrator
    
    Soft Skills Nümunələri:
    - Liderlik, Komanda işi, Kommunikasiya, Problem həlli
    - Kreativlik, Adaptasiya, Vaxt idarəetməsi, Analitik düşüncə
    - Müştəri xidməti, Prezentasiya, Layihə idarəetməsi

    Cavab formatı: 
    {
      "hardSkills": ["JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
      "softSkills": ["Liderlik", "Komanda işi", "Problem həlli", "Kommunikasiya"]
    }

    YALNIZ JSON cavab verin, əlavə mətn yox:
  `;

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();

    console.log('🤖 Raw AI Response:');
    console.log(aiResponse);
    console.log('='.repeat(60));

    // Clean the response to extract JSON
    let cleanResponse = aiResponse;
    if (cleanResponse.includes('```')) {
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```/g, '');
    }

    const extractedData = JSON.parse(cleanResponse);

    console.log('✅ Parsed AI Skills:');
    console.log('Hard Skills:', extractedData.hardSkills);
    console.log('Soft Skills:', extractedData.softSkills);
    console.log('='.repeat(60));
    
    console.log(`Total: ${(extractedData.hardSkills || []).length} hard skills, ${(extractedData.softSkills || []).length} soft skills`);
    
    return extractedData;
  } catch (error) {
    console.error('❌ AI Skills Generation Failed:', error);
    return null;
  }
}

testAISkillsGeneration();
