// Test certification parsing with real ScrapingDog API data

// Simulate the parseCertifications function logic
function parseCertifications(certificationsData) {
  console.log('🏆 Raw certifications data:', certificationsData);
  
  if (!Array.isArray(certificationsData)) {
    console.log('❌ Certifications data is not an array:', typeof certificationsData);
    return [];
  }
  
  console.log('🔍 Found', certificationsData.length, 'certifications to parse');

  return certificationsData.map((cert, index) => {
    console.log(`📜 Raw cert ${index + 1}:`, cert);
    
    const parsed = {
      // ScrapingDog API format mapping
      name: cert.certification || cert.name || cert.title || cert.certification_name || cert.certificate_name || '',
      title: cert.certification || cert.title || cert.name || cert.certificate_title || '',
      organization: cert.company_name || cert.organization || cert.issuer || cert.authority || cert.issuing_organization || cert.institution || cert.provider || '',
      issuer: cert.company_name || cert.issuer || cert.organization || cert.authority || cert.issuing_organization || cert.institution || '',
      issueDate: cert.issue_date || cert.issueDate || cert.date || cert.startDate || cert.start_date || cert.completion_date || '',
      expiryDate: cert.expiry_date || cert.expiryDate || cert.expires || cert.endDate || cert.end_date || cert.expiration_date || '',
      credentialId: cert.credential_id || cert.credentialId || cert.id || cert.certificate_id || cert.license_number || '',
      url: cert.credential_url || cert.url || cert.link || cert.verificationUrl || cert.verification_url || cert.certificate_url || ''
    };
    
    console.log(`✅ Parsed cert ${index + 1}:`, parsed);
    return parsed;
  });
}

// Real API response data
const mockApiResponse = {
  fullName: "Test User",
  first_name: "Test",
  last_name: "User",
  headline: "Test Headline",
  about: "Test About",
  location: "Test Location",
  experience: [],
  education: [],
  languages: [],
  certification: [
    {
      "company_image": "https://media.licdn.com/dms/image/v2/D560BAQF41BGxqqSCWQ/company-logo_100_100/company-logo_100_100/0/1719861762923/challengerinc_logo?e=2147483647&v=beta&t=hq-F5JZxrhndurNBKSbwE1Ge9vWbs31rq7zOZQMEf5U",
      "certification": "Challenger Fundamentals - Core Sales Skills",
      "company_url": "https://www.linkedin.com/company/challengerinc?trk=public_profile_profile-section-card_image-click",
      "company_name": "Challenger",
      "issue_date": "Issued Mar 2025",
      "credential_id": "See credential",
      "credential_url": "https://www.credly.com/badges/79a51e1e-6509-4ba4-a3c5-9adb8e1c4364/linked_in_profile?trk=public_profile_see-credential"
    }
  ]
};

async function testCertificationParsing() {
  try {
    console.log('🏆 Testing certification parsing with real API data...');
    
    // Test parsing the certification data
    const parsedCertifications = parseCertifications(mockApiResponse.certification);
    
    console.log('\n=== PARSING RESULTS ===');
    console.log('Certifications count:', parsedCertifications.length);
    
    if (parsedCertifications.length > 0) {
      console.log('\n=== PARSED CERTIFICATIONS ===');
      parsedCertifications.forEach((cert, index) => {
        console.log(`\n📜 Certification ${index + 1}:`);
        console.log('  Name:', cert.name);
        console.log('  Title:', cert.title);
        console.log('  Organization:', cert.organization);
        console.log('  Issuer:', cert.issuer);
        console.log('  Issue Date:', cert.issueDate);
        console.log('  Credential ID:', cert.credentialId);
        console.log('  URL:', cert.url);
      });
      
      console.log('\n=== CV DATA FORMAT ===');
      console.log('This would be converted to CV format:');
      parsedCertifications.forEach((cert, index) => {
        console.log(`Certification ${index + 1}:`, {
          name: cert.name,
          issuer: cert.organization,
          date: cert.issueDate,
          credentialId: cert.credentialId,
          url: cert.url
        });
      });
    } else {
      console.log('❌ No certifications found in parsed data');
    }
    
  } catch (error) {
    console.error('❌ Error testing certification parsing:', error.message);
  }
}

testCertificationParsing();
