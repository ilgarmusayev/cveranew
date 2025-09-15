// Test organizations parsing with real ScrapingDog API data

// Simulate the parseOrganizations function logic
function parseOrganizations(organizationsData) {
  console.log('🏢 Raw organizations data:', organizationsData);
  
  if (!Array.isArray(organizationsData)) {
    console.log('❌ Organizations data is not an array:', typeof organizationsData);
    return [];
  }

  console.log('🔍 Found', organizationsData.length, 'organizations to parse');

  return organizationsData.map((org, index) => {
    console.log(`🏢 Raw organization ${index + 1}:`, org);
    
    const parsed = {
      name: org.name || org.organization || '',
      organization: org.name || org.organization || '',
      role: org.position || org.role || org.title || '',
      position: org.position || org.role || org.title || '',
      title: org.position || org.role || org.title || '',
      start_date: org.start_date || org.startDate || '',
      startDate: org.start_date || org.startDate || '',
      end_date: org.end_date || org.endDate || '',
      endDate: org.end_date || org.endDate || '',
      current: org.current || org.is_current || false,
      is_current: org.current || org.is_current || false,
      description: org.description || org.summary || '',
      summary: org.description || org.summary || '',
      url: org.url || org.website || '',
      website: org.url || org.website || ''
    };
    
    console.log(`✅ Parsed organization ${index + 1}:`, parsed);
    return parsed;
  });
}

// Real API response data
const mockOrganizationsData = [
  {
    "name": "ECISOA",
    "position": "President"
  }
];

async function testOrganizationsParsing() {
  try {
    console.log('🏢 Testing organizations parsing with real API data...');
    
    // Test parsing the organizations data
    const parsedOrganizations = parseOrganizations(mockOrganizationsData);
    
    console.log('\n=== PARSING RESULTS ===');
    console.log('Organizations count:', parsedOrganizations.length);
    
    if (parsedOrganizations.length > 0) {
      console.log('\n=== PARSED ORGANIZATIONS ===');
      parsedOrganizations.forEach((org, index) => {
        console.log(`\n🏢 Organization ${index + 1}:`);
        console.log('  Name:', org.name);
        console.log('  Position:', org.position);
        console.log('  Role:', org.role);
        console.log('  Title:', org.title);
        console.log('  Start Date:', org.startDate);
        console.log('  End Date:', org.endDate);
        console.log('  Current:', org.current);
        console.log('  Description:', org.description);
        console.log('  URL:', org.url);
      });
      
      console.log('\n=== CV DATA FORMAT ===');
      console.log('This would be converted to CV format:');
      parsedOrganizations.forEach((org, index) => {
        console.log(`Organization ${index + 1}:`, {
          name: org.name,
          position: org.position,
          startDate: org.startDate,
          endDate: org.endDate || 'Present',
          description: org.description,
          current: org.current
        });
      });
    } else {
      console.log('❌ No organizations found in parsed data');
    }
    
  } catch (error) {
    console.error('❌ Error testing organizations parsing:', error.message);
  }
}

testOrganizationsParsing();
