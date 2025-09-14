// Real LinkedIn Data Structure Test
// Bu script LinkedIn import zamanı real data structure-u göstərəcək

console.log("🔍 LinkedIn Import Debug Test Script");

// Mock real LinkedIn API response structure (ScrapingDog format)
const mockLinkedInResponse = {
  name: "Test User",
  firstName: "Test",
  lastName: "User", 
  headline: "Software Developer",
  summary: "Experienced developer...",
  location: "Baku, Azerbaijan",
  
  // Experience array - bəzi volunteer experience burada ola bilər
  experience: [
    {
      title: "Software Developer",
      company: "Tech Company",
      duration: "Jan 2022 - Present",
      description: "Building software..."
    },
    {
      title: "Volunteer Teacher",
      company: "Community Center", 
      duration: "Sep 2021 - Dec 2021",
      description: "Teaching programming to children"
    }
  ],

  // Possible volunteer fields
  volunteering: [
    {
      organization: "Red Cross",
      role: "Volunteer Coordinator",
      cause: "Disaster Relief",
      duration: "2020 - 2022",
      description: "Coordinated volunteer activities"
    }
  ],

  // Possible certification fields
  awards: [
    {
      name: "AWS Certified Developer",
      organization: "Amazon Web Services",
      date: "2023",
      description: "Cloud development certification"
    }
  ],

  certifications: [
    {
      title: "Python Programming Certificate", 
      issuer: "Coursera",
      issued_date: "2022-06-15",
      description: "Advanced Python programming"
    }
  ],

  // Alternative structures we might see
  certificates: [],
  licenses: [],
  volunteer_experience: [],
  volunteer: [],
  community_service: [],
  activities: []
};

console.log("\n📊 Testing certification detection:");
const certificationSources = [
  mockLinkedInResponse.awards,
  mockLinkedInResponse.certifications, 
  mockLinkedInResponse.certificates,
  mockLinkedInResponse.licenses
];

certificationSources.forEach((source, index) => {
  const sourceNames = ['awards', 'certifications', 'certificates', 'licenses'];
  console.log(`${sourceNames[index]}:`, {
    exists: !!source,
    isArray: Array.isArray(source),
    length: Array.isArray(source) ? source.length : 'N/A',
    data: source
  });
});

console.log("\n❤️ Testing volunteer detection:");
const volunteerSources = [
  mockLinkedInResponse.volunteering,
  mockLinkedInResponse.volunteer_experience,
  mockLinkedInResponse.volunteer,
  mockLinkedInResponse.community_service,
  mockLinkedInResponse.activities
];

volunteerSources.forEach((source, index) => {
  const sourceNames = ['volunteering', 'volunteer_experience', 'volunteer', 'community_service', 'activities'];
  console.log(`${sourceNames[index]}:`, {
    exists: !!source,
    isArray: Array.isArray(source), 
    length: Array.isArray(source) ? source.length : 'N/A',
    data: source
  });
});

console.log("\n🔍 Testing volunteer detection in experience array:");
const volunteerInExperience = mockLinkedInResponse.experience.filter((exp) => {
  const title = (exp.title || '').toLowerCase();
  const company = (exp.company || '').toLowerCase();
  const description = (exp.description || '').toLowerCase();

  const volunteerKeywords = [
    'volunteer', 'voluntary', 'könüllü', 'community', 'charity', 'non-profit',
    'nonprofit', 'ngo', 'foundation', 'social', 'humanitarian'
  ];

  return volunteerKeywords.some(keyword =>
    title.includes(keyword) ||
    company.includes(keyword) ||
    description.includes(keyword)
  );
});

console.log("Volunteer entries found in experience:", volunteerInExperience);

console.log("\n✅ Test completed! Check the output above to understand data structure.");
