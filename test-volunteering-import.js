// Test volunteering data import
const testVolunteeringData = {
  volunteering: [
    {
      company_url: 'https://uk.linkedin.com/company/formula-one-management-ltd?trk=public_profile_volunteering-position_profile-section-card_image-click',
      company_position: 'Spectator team',
      company_name: 'Formula 1',
      company_duration: '',
      starts_at: 'Sep 2024',
      ends_at: 'Sep 2024'
    },
    {
      company_url: 'https://linkedin.com/company/red-cross',
      company_position: 'Volunteer Coordinator',
      company_name: 'Red Cross',
      company_duration: '6 months',
      starts_at: 'Jan 2024',
      ends_at: ''  // Current volunteer work
    }
  ]
};

console.log('🤝 Test Volunteering Data:');
console.log(JSON.stringify(testVolunteeringData, null, 2));

// Test the transformation logic
const transformedVolunteering = testVolunteeringData.volunteering.map((vol, index) => {
  // Parse dates from starts_at and ends_at
  let startDate = '';
  let endDate = '';
  let duration = '';

  if (vol.starts_at) {
    startDate = vol.starts_at.trim();
  }

  if (vol.ends_at) {
    endDate = vol.ends_at.trim();
  } else if (vol.company_duration === '' || !vol.company_duration) {
    // If no end date and duration is empty, assume current
    endDate = 'Present';
  }

  // Create duration string
  if (startDate && endDate) {
    duration = `${startDate} - ${endDate}`;
  } else if (startDate) {
    duration = startDate;
  }

  return {
    id: `vol-${index}-${Date.now()}`,
    organization: vol.company_name || '',
    position: vol.company_position || '',
    startDate: startDate,
    endDate: endDate,
    current: endDate === 'Present' || endDate === '',
    description: vol.description || '',
    duration: duration,
    url: vol.company_url || ''
  };
});

console.log('\n✅ Transformed Volunteering for CV:');
console.log(JSON.stringify(transformedVolunteering, null, 2));
