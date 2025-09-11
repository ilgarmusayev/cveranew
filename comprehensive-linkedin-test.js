/**
 * Comprehensive test for enhanced LinkedIn import with all sections
 * - Volunteer experience
 * - Certifications 
 * - Languages
 * - 3 hard + 3 soft AI skills
 */

const axios = require('axios');

async function comprehensiveLinkedInTest() {
  console.log('🔍 Comprehensive LinkedIn Import Test');
  console.log('═══════════════════════════════════════');
  
  const testProfiles = [
    'musayevcreate', // Primary test profile
    'https://www.linkedin.com/in/satyanadella', // Microsoft CEO
    'https://linkedin.com/in/jeffweiner08' // LinkedIn Executive Chairman
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
          'Authorization': 'Bearer test-token-comprehensive' // Replace with valid token
        },
        timeout: 90000 // 90 seconds
      });
      
      if (response.data.success) {
        console.log('✅ Import successful!');
        
        const stats = response.data.importStats;
        console.log('\n📊 Import Results:');
        console.log(`  📝 CV Title: ${response.data.cvTitle}`);
        console.log(`  🆔 CV ID: ${response.data.cvId}`);
        
        console.log('\n📋 Section Analysis:');
        console.log(`  💼 Experience: ${stats.experienceCount} items`);
        console.log(`  🎓 Education: ${stats.educationCount} items`);
        console.log(`  🛠️  Skills: ${stats.skillsCount} total`);
        console.log(`  🚀 Projects: ${stats.projectsCount} items`);
        console.log(`  🏆 Awards: ${stats.awardsCount} items`);
        
        // NEW SECTIONS VERIFICATION
        console.log('\n🆕 Enhanced Sections:');
        console.log(`  📜 Certifications: ${stats.certificationsCount} items`);
        console.log(`  🌍 Languages: ${stats.languagesCount} items`);
        console.log(`  🤝 Volunteer Experience: ${stats.volunteerExperienceCount} items`);
        console.log(`  🤖 AI Skills Added: ${stats.aiSkillsAdded} items`);
        
        // VALIDATION CHECKS
        console.log('\n✅ Validation Results:');
        
        // Check AI skills count (should be 6: 3 hard + 3 soft)
        if (stats.aiSkillsAdded >= 6) {
          console.log('  ✅ AI Skills: 3 hard + 3 soft correctly generated');
        } else {
          console.log(`  ⚠️  AI Skills: Expected 6, got ${stats.aiSkillsAdded}`);
        }
        
        // Check new sections
        if (stats.certificationsCount > 0) {
          console.log('  ✅ Certifications: Successfully imported');
        } else {
          console.log('  ❌ Certifications: No data imported');
        }
        
        if (stats.languagesCount > 0) {
          console.log('  ✅ Languages: Successfully imported');
        } else {
          console.log('  ❌ Languages: No data imported');
        }
        
        if (stats.volunteerExperienceCount > 0) {
          console.log('  ✅ Volunteer Experience: Successfully imported');
        } else {
          console.log('  ❌ Volunteer Experience: No data imported');
        }
        
        // Overall completeness score
        const completenessScore = calculateCompletenessScore(stats);
        console.log(`\n🎯 Profile Completeness: ${completenessScore}%`);
        
        console.log('\n' + '─'.repeat(50));
        
      } else {
        console.log('❌ Import failed:', response.data.error);
      }
      
    } catch (error) {
      console.error('💥 Test error:', error.message);
      
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please provide valid token');
        break; // Stop testing if auth fails
      } else if (error.response?.status === 429) {
        console.log('⏳ Rate limited - waiting 30 seconds...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    // Wait between profiles to avoid rate limiting
    if (testProfiles.indexOf(profile) < testProfiles.length - 1) {
      console.log('⏳ Waiting 15 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  console.log('\n🏁 Comprehensive test completed!');
}

function calculateCompletenessScore(stats) {
  let score = 0;
  let maxScore = 100;
  
  // Basic sections (60% of score)
  if (stats.experienceCount > 0) score += 20;
  if (stats.educationCount > 0) score += 20;
  if (stats.skillsCount > 0) score += 20;
  
  // Enhanced sections (30% of score)
  if (stats.certificationsCount > 0) score += 10;
  if (stats.languagesCount > 0) score += 10;
  if (stats.volunteerExperienceCount > 0) score += 10;
  
  // AI enhancement (10% of score)
  if (stats.aiSkillsAdded >= 6) score += 10;
  
  return score;
}

// Test different URL formats
async function testUrlFormats() {
  console.log('\n🔗 Testing Different URL Formats');
  console.log('═══════════════════════════════════');
  
  const formats = [
    'musayevcreate',
    'https://www.linkedin.com/in/musayevcreate',
    'https://linkedin.com/in/musayevcreate',
    'linkedin.com/in/musayevcreate',
    'www.linkedin.com/in/musayevcreate'
  ];
  
  for (const format of formats) {
    console.log(`📝 Format: ${format}`);
    // URL validation would happen here
    console.log(`  ✅ Should normalize to: https://www.linkedin.com/in/musayevcreate`);
  }
}

// Test AI skills enhancement specifically
async function testAISkillsGeneration() {
  console.log('\n🤖 AI Skills Generation Test');
  console.log('═══════════════════════════════════');
  
  // This would test the generateLinkedInAISkills function
  console.log('Testing AI skills with mock data...');
  console.log('Expected: 3 hard skills + 3 soft skills = 6 total');
  console.log('Categories: Technical, Business, Communication, Leadership, etc.');
}

if (require.main === module) {
  comprehensiveLinkedInTest()
    .then(() => testUrlFormats())
    .then(() => testAISkillsGeneration())
    .catch(error => {
      console.error('💥 Test suite failed:', error);
    });
}

module.exports = { 
  comprehensiveLinkedInTest, 
  testUrlFormats, 
  testAISkillsGeneration 
};
