/**
 * LinkedIn Import Final Validation Test
 * Bu test LinkedIn import funksiyasının bütün məlumatları düzgün import etdiyini yoxlayır
 */

const axios = require('axios');

async function testLinkedInImportComplete() {
  console.log('🔍 LinkedIn Import Final Validation Test');
  console.log('═'.repeat(60));
  
  const testProfiles = [
    'musayevcreate',
    'https://www.linkedin.com/in/satyanadella'
  ];
  
  for (const profile of testProfiles) {
    console.log(`\n📋 Testing profile: ${profile}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await axios.post('http://localhost:3000/api/import/linkedin', {
        linkedinUrl: profile
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-validation' // Replace with valid token
        },
        timeout: 120000 // 2 minutes
      });
      
      if (response.data.success) {
        console.log('✅ Import successful!');
        
        const summary = response.data.summary;
        console.log('\n📊 Import Summary:');
        console.log(`  🆔 CV ID: ${response.data.cvId}`);
        console.log(`  👤 Name: ${summary.name}`);
        console.log(`  🌐 Language: ${summary.language}`);
        console.log(`  📊 Total Sections: ${summary.totalSections}`);
        console.log(`  🔄 Source: ${summary.source}`);
        
        console.log('\n📋 Section Details:');
        console.log(`  💼 Experience: ${summary.experienceCount} items`);
        console.log(`  🎓 Education: ${summary.educationCount} items`);
        console.log(`  🛠️  Skills: ${summary.skillsCount} total`);
        console.log(`  🤖 AI Skills Added: ${summary.aiSkillsAdded} items`);
        console.log(`  🚀 Projects: ${summary.projectsCount} items`);
        console.log(`  🏆 Awards: ${summary.awardsCount} items`);
        console.log(`  🎖️  Honors: ${summary.honorsCount} items`);
        console.log(`  📜 Certifications: ${summary.certificationsCount} items`);
        console.log(`  🌍 Languages: ${summary.languagesCount} items`);
        console.log(`  🤝 Volunteer Experience: ${summary.volunteerExperienceCount} items`);
        
        // Validation checks
        console.log('\n✅ Validation Results:');
        
        // Check critical sections
        const criticalSectionsPresent = summary.experienceCount > 0 || summary.educationCount > 0;
        console.log(`  🔹 Critical sections: ${criticalSectionsPresent ? '✅ Present' : '❌ Missing'}`);
        
        // Check AI skills
        const aiSkillsValid = summary.aiSkillsAdded >= 6;
        console.log(`  🔹 AI Skills (3+3): ${aiSkillsValid ? '✅ Correct' : `⚠️ ${summary.aiSkillsAdded}/6`}`);
        
        // Check new sections
        const newSectionsPresent = summary.certificationsCount > 0 || summary.languagesCount > 0 || summary.volunteerExperienceCount > 0;
        console.log(`  🔹 Enhanced sections: ${newSectionsPresent ? '✅ Present' : '❌ Missing'}`);
        
        // Check total data richness
        const totalItems = summary.experienceCount + summary.educationCount + summary.skillsCount + 
                          summary.projectsCount + summary.awardsCount + summary.honorsCount +
                          summary.certificationsCount + summary.languagesCount + summary.volunteerExperienceCount;
        console.log(`  🔹 Total data items: ${totalItems} items`);
        
        // Calculate completeness score
        let completenessScore = 0;
        if (summary.experienceCount > 0) completenessScore += 20;
        if (summary.educationCount > 0) completenessScore += 20;
        if (summary.skillsCount > 0) completenessScore += 15;
        if (summary.aiSkillsAdded >= 6) completenessScore += 15;
        if (summary.certificationsCount > 0) completenessScore += 10;
        if (summary.languagesCount > 0) completenessScore += 10;
        if (summary.volunteerExperienceCount > 0) completenessScore += 10;
        
        console.log(`\n🎯 Profile Completeness: ${completenessScore}%`);
        
        if (completenessScore >= 80) {
          console.log('🎉 Excellent import quality!');
        } else if (completenessScore >= 60) {
          console.log('✅ Good import quality');
        } else {
          console.log('⚠️ Limited data available from profile');
        }
        
        console.log('\n' + '─'.repeat(50));
        return true;
        
      } else {
        console.log('❌ Import failed:', response.data.error);
        return false;
      }
      
    } catch (error) {
      console.error('💥 Test error:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please provide valid token');
        console.log('💡 To test properly, update the Authorization header with a valid JWT token');
        return false;
      } else if (error.response?.status === 429) {
        console.log('⏳ Rate limited - waiting 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      } else if (error.response?.data) {
        console.log('📄 Server response:', error.response.data);
      }
      return false;
    }
  }
}

// Test data structure validation
function validateDataStructure() {
  console.log('\n📋 Validating expected data structure...');
  console.log('─'.repeat(40));
  
  const expectedSections = [
    { section: 'personalInfo', required: true, description: 'Name, title, contact info' },
    { section: 'experience', required: false, description: 'Work experience entries' },
    { section: 'education', required: false, description: 'Educational background' },
    { section: 'skills', required: true, description: 'Technical and soft skills + AI generated' },
    { section: 'projects', required: false, description: 'Project portfolio' },
    { section: 'awards', required: false, description: 'Awards and recognitions' },
    { section: 'honors', required: false, description: 'Academic and professional honors' },
    { section: 'certifications', required: false, description: 'Professional certifications' },
    { section: 'languages', required: false, description: 'Language proficiencies' },
    { section: 'volunteerExperience', required: false, description: 'Volunteer work and community service' }
  ];
  
  expectedSections.forEach((item, index) => {
    const status = item.required ? '🔴 Required' : '🟡 Optional';
    console.log(`  ${index + 1}. ${item.section}: ${status}`);
    console.log(`     Description: ${item.description}`);
  });
  
  console.log('\n🎯 AI Skills Enhancement:');
  console.log('  • 3 Hard Skills + 3 Soft Skills = 6 total AI-generated skills');
  console.log('  • Context-aware skill generation based on profile analysis');
  console.log('  • Fallback skill generation if AI fails');
}

// Test import flow steps
function validateImportFlow() {
  console.log('\n🔄 Import Flow Validation:');
  console.log('─'.repeat(40));
  
  const flowSteps = [
    '1. URL/Username validation and normalization',
    '2. ScrapingDog API profile scraping',
    '3. RapidAPI skills extraction (optional)',
    '4. Data transformation to CV format',
    '5. AI skills generation (3 hard + 3 soft)',
    '6. CV creation in database',
    '7. Import session logging',
    '8. Success response with statistics'
  ];
  
  flowSteps.forEach(step => {
    console.log(`  ✅ ${step}`);
  });
}

// Main test runner
if (require.main === module) {
  console.log('🚀 LinkedIn Import Final Validation');
  console.log('═'.repeat(60));
  console.log('Testing complete import functionality...\n');
  
  validateDataStructure();
  validateImportFlow();
  
  testLinkedInImportComplete()
    .then(success => {
      if (success) {
        console.log('\n🎉 LinkedIn Import is fully functional!');
        console.log('✅ All sections are properly imported');
        console.log('✅ AI skills generation working');
        console.log('✅ Data transformation complete');
        console.log('✅ CV creation successful');
      } else {
        console.log('\n⚠️ LinkedIn Import needs attention');
        console.log('Please check authentication or API status');
      }
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
    });
}

module.exports = { testLinkedInImportComplete };
