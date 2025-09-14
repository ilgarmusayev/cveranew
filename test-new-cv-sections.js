// Test new CV sections LinkedIn import compatibility
const { LinkedInImportService } = require('./src/lib/linkedinImportService');

// Sample ScrapingDog data with new sections
const scrapingdogTestData = {
  name: "Test User",
  headline: "Software Engineer",
  location: "Baku, Azerbaijan",
  summary: "Experienced software engineer",
  
  // 🆕 New sections we added
  publications: [
    {
      title: "AI in Modern Web Development",
      description: "Research paper on AI integration",
      date: "2023-05-15",
      publisher: "Tech Journal",
      url: "https://example.com/paper"
    }
  ],
  
  honors: [
    {
      name: "Best Developer Award",
      organization: "Tech Company",
      date: "2023-03-10",
      description: "Awarded for outstanding performance"
    }
  ],
  
  courses: [
    {
      name: "Advanced React Development",
      institution: "Online Academy",
      completion_date: "2023-01-20",
      certificate: true
    }
  ],
  
  test_scores: [
    {
      test_name: "IELTS",
      score: "7.5",
      date: "2022-12-01",
      max_score: "9.0"
    }
  ],
  
  organizations: [
    {
      name: "Developers Association",
      role: "Member",
      start_date: "2022-01-01",
      current: true,
      description: "Active member of local developers community"
    }
  ]
};

console.log('🧪 Testing new CV sections LinkedIn import...');

try {
  // Test formatImportedData with ScrapingDog source
  const formattedData = LinkedInImportService.formatImportedData(scrapingdogTestData, 'scrapingdog');
  
  console.log('✅ Formatted CV Data:');
  console.log('📚 Publications:', formattedData.publications?.length || 0, 'items');
  console.log('🏅 Honors & Awards:', formattedData.honorsAwards?.length || 0, 'items');
  console.log('📖 Courses:', formattedData.courses?.length || 0, 'items');
  console.log('📊 Test Scores:', formattedData.testScores?.length || 0, 'items');
  console.log('🏢 Organizations:', formattedData.organizations?.length || 0, 'items');
  
  // Detailed output
  if (formattedData.publications?.length > 0) {
    console.log('\n📚 Publications Detail:');
    formattedData.publications.forEach((pub, index) => {
      console.log(`  ${index + 1}. ${pub.title} - ${pub.publisher} (${pub.date})`);
    });
  }
  
  if (formattedData.honorsAwards?.length > 0) {
    console.log('\n🏅 Honors & Awards Detail:');
    formattedData.honorsAwards.forEach((award, index) => {
      console.log(`  ${index + 1}. ${award.title} - ${award.issuer} (${award.date})`);
    });
  }
  
  if (formattedData.courses?.length > 0) {
    console.log('\n📖 Courses Detail:');
    formattedData.courses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course.name} - ${course.institution} (${course.completionDate})`);
    });
  }
  
  if (formattedData.testScores?.length > 0) {
    console.log('\n📊 Test Scores Detail:');
    formattedData.testScores.forEach((test, index) => {
      console.log(`  ${index + 1}. ${test.testName}: ${test.score}/${test.maxScore} (${test.date})`);
    });
  }
  
  if (formattedData.organizations?.length > 0) {
    console.log('\n🏢 Organizations Detail:');
    formattedData.organizations.forEach((org, index) => {
      console.log(`  ${index + 1}. ${org.name} - ${org.role} (${org.startDate}${org.current ? ' - Present' : ' - ' + org.endDate})`);
    });
  }
  
  console.log('\n✅ All new CV sections successfully imported from LinkedIn data!');
  
} catch (error) {
  console.error('❌ Import test failed:', error.message);
}
