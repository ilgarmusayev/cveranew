/**
 * Test Simplified Volunteer Parsing Logic
 */

// Mock the simplified parseVolunteerExperience function
function testSimplifiedVolunteerParsing() {
  console.log('🧪 Testing Simplified Volunteer Parsing Logic...\n');

  // Real afetkhalilli volunteer data
  const mockProfileData = {
    volunteering: [
      {
        company_name: 'Formula 1',
        company_position: 'Spectator team',
        starts_at: 'Sep 2024',
        ends_at: 'Sep 2024',
        company_duration: '',
        company_url: 'https://uk.linkedin.com/company/formula-one-management-ltd'
      },
      {
        company_name: 'Bakı Baş Gömrük İdarəsi',
        company_position: 'Könüllü Gömrükçü',
        starts_at: 'Oct 2024',
        ends_at: 'Jan 2025',
        company_duration: ''
      },
      {
        company_name: 'Azerbaijan Design Award',
        company_position: 'Gönüllü',
        starts_at: '',
        ends_at: '',
        company_duration: '',
        company_url: 'https://az.linkedin.com/company/azerbaijandesignaward'
      }
    ]
  };

  console.log('📊 Mock Profile Data:');
  console.log(`- Volunteering entries: ${mockProfileData.volunteering.length}`);

  // Simulate simplified parsing
  function parseVolunteerExperience(data) {
    console.log('❤️ Parsing volunteer experience data - SIMPLIFIED:');
    
    const volunteerData = data.volunteering || [];
    
    if (volunteerData.length === 0) {
      console.log('❌ No volunteer experience data found');
      return [];
    }

    console.log(`✅ Found ${volunteerData.length} volunteer entries`);

    return volunteerData.map((vol, index) => {
      console.log(`🔧 Processing volunteer entry ${index + 1}:`, vol);
      
      let startDate = vol.starts_at || '';
      let endDate = vol.ends_at || '';
      let current = !vol.ends_at || vol.ends_at === '';

      // Return DIRECT CV format
      const volunteerEntry = {
        id: `vol-${index}-${Date.now()}`,
        organization: vol.company_name || '',
        role: vol.company_position || '',
        cause: vol.cause || vol.field || '',
        startDate: startDate,
        endDate: endDate || (current ? 'Present' : ''),
        current: current,
        description: vol.description || '',
        url: vol.company_url || ''
      };

      console.log(`✅ Direct CV format entry ${index + 1}:`, volunteerEntry);
      return volunteerEntry;
    }).filter(vol => {
      const hasOrganization = vol.organization && vol.organization.trim() !== '';
      const hasRole = vol.role && vol.role.trim() !== '';
      
      const isValid = hasOrganization || hasRole;
      console.log(`🎯 Filtering: valid=${isValid}, org="${vol.organization}", role="${vol.role}"`);
      return isValid;
    });
  }

  // Test the parsing
  const result = parseVolunteerExperience(mockProfileData);
  
  console.log('\n📋 Final CV Volunteer Experience:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully parsed ${result.length} volunteer experiences`);
  
  result.forEach((vol, index) => {
    console.log(`\n${index + 1}. ${vol.organization}`);
    console.log(`   Role: ${vol.role}`);
    console.log(`   Duration: ${vol.startDate} - ${vol.endDate}`);
    console.log(`   Current: ${vol.current ? 'Yes' : 'No'}`);
    if (vol.url) {
      console.log(`   URL: ${vol.url}`);
    }
  });

  console.log('\n🎯 This simplified approach should work in the real service!');
  return result;
}

testSimplifiedVolunteerParsing();
