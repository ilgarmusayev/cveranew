// Test full LinkedIn import including organizations parsing

const axios = require('axios');

// Test real LinkedIn import with organizations
async function testLinkedInImportWithOrganizations() {
  try {
    console.log('🏢 Testing LinkedIn import with organizations...');
    
    const apiKey = '68a99929b4148b34852a88be';
    const testUsername = 'musayevcreate'; // Your LinkedIn username
    
    const params = {
      api_key: apiKey,
      type: 'profile',
      linkId: testUsername,
      premium: 'true'
    };

    console.log('📡 Making request to ScrapingDog API...');
    const response = await axios.get('https://api.scrapingdog.com/linkedin', {
      params: params,
      timeout: 30000
    });

    if (response.status !== 200) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = response.data;
    console.log('✅ API Response received');
    
    // Check if data is array or object
    let profileData = data;
    if (Array.isArray(data) && data.length > 0) {
      profileData = data[0];
      console.log('📊 Using first element from array response');
    }
    
    console.log('\n=== PROFILE DATA STRUCTURE ===');
    console.log('Profile keys:', Object.keys(profileData));
    
    // Test organizations parsing
    if (profileData.organizations) {
      console.log('\n=== ORGANIZATIONS FOUND ===');
      console.log('Organizations data:', profileData.organizations);
      
      console.log('\n=== ORGANIZATIONS PARSING TEST ===');
      profileData.organizations.forEach((org, index) => {
        console.log(`\nOrganization ${index + 1}:`);
        console.log('  Raw data:', org);
        console.log('  Parsed data:', {
          name: org.name || org.organization || '',
          position: org.position || org.role || org.title || '',
          startDate: org.start_date || org.startDate || '',
          endDate: org.end_date || org.endDate || '',
          current: org.current || org.is_current || false,
          description: org.description || org.summary || '',
          website: org.url || org.website || ''
        });
      });
    } else {
      console.log('❌ No organizations field found in API response');
    }
    
    // Test certifications parsing
    if (profileData.certification) {
      console.log('\n=== CERTIFICATIONS FOUND ===');
      console.log('Certifications data:', profileData.certification);
      
      console.log('\n=== CERTIFICATIONS PARSING TEST ===');
      profileData.certification.forEach((cert, index) => {
        console.log(`\nCertification ${index + 1}:`);
        console.log('  Raw data:', cert);
        console.log('  Parsed data:', {
          name: cert.certification || cert.name || cert.title || '',
          organization: cert.company_name || cert.organization || cert.issuer || '',
          issueDate: cert.issue_date || cert.issueDate || cert.date || '',
          credentialId: cert.credential_id || cert.credentialId || cert.id || '',
          url: cert.credential_url || cert.url || cert.link || ''
        });
      });
    } else {
      console.log('❌ No certification field found in API response');
    }
    
    console.log('\n=== FULL CV DATA SIMULATION ===');
    const mockCVData = {
      // Basic profile info
      personalInfo: {
        firstName: profileData.first_name || '',
        lastName: profileData.last_name || '',
        email: '',
        phone: '',
        location: profileData.location || '',
        website: '',
        linkedin: `https://linkedin.com/in/${testUsername}`,
        professionalSummary: profileData.about || ''
      },
      
      // Organizations transformation
      organizations: Array.isArray(profileData.organizations) ? profileData.organizations.map((org, index) => ({
        id: `org-${index}-${Date.now()}`,
        name: org.name || org.organization || '',
        position: org.position || org.role || org.title || '',
        startDate: org.start_date || org.startDate || '',
        endDate: org.end_date || org.endDate || '',
        current: org.current || org.is_current || false,
        description: org.description || org.summary || '',
        website: org.url || org.website || ''
      })) : [],
      
      // Certifications transformation
      certifications: Array.isArray(profileData.certification) ? profileData.certification.map((cert, index) => ({
        id: `cert-${index}-${Date.now()}`,
        name: cert.certification || cert.name || cert.title || '',
        issuer: cert.company_name || cert.organization || cert.issuer || '',
        date: cert.issue_date || cert.issueDate || cert.date || '',
        credentialId: cert.credential_id || cert.credentialId || cert.id || '',
        url: cert.credential_url || cert.url || cert.link || ''
      })) : []
    };
    
    console.log('\nFinal Organizations count:', mockCVData.organizations.length);
    console.log('Final Certifications count:', mockCVData.certifications.length);
    
    if (mockCVData.organizations.length > 0) {
      console.log('\n📋 CV Organizations:');
      mockCVData.organizations.forEach((org, index) => {
        console.log(`${index + 1}. ${org.name} - ${org.position}`);
      });
    }
    
    if (mockCVData.certifications.length > 0) {
      console.log('\n🏆 CV Certifications:');
      mockCVData.certifications.forEach((cert, index) => {
        console.log(`${index + 1}. ${cert.name} by ${cert.issuer}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing LinkedIn import:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testLinkedInImportWithOrganizations();
