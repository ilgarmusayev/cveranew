const axios = require('axios');

const api_key = '6882894b855f5678d36484c8';
const url = 'https://api.scrapingdog.com/linkedin';

const params = {
  api_key: api_key,
  type: 'profile',
  linkId: 'musayevcreate',
  premium: 'false',
};

axios
  .get(url, { params: params })
  .then(function (response) {
    if (response.status === 200) {
      const data = response.data;

      console.log('🔍 Full ScrapingDog Response Analysis:');
      console.log('='.repeat(50));

      // Check all available fields
      console.log('\n📋 Available top-level fields:');
      console.log(Object.keys(data));

      // Specifically look for volunteer-related fields
      const volunteerFields = Object.keys(data).filter(key =>
        key.toLowerCase().includes('volunteer') ||
        key.toLowerCase().includes('voluntar') ||
        key.toLowerCase().includes('charity') ||
        key.toLowerCase().includes('community') ||
        key.toLowerCase().includes('non') ||
        key.toLowerCase().includes('ngo')
      );

      console.log('\n❤️ Volunteer-related fields found:');
      console.log(volunteerFields);

      // Check each volunteer field
      volunteerFields.forEach(field => {
        console.log(`\n📍 ${field}:`, data[field]);
      });

      // Check if volunteer data is nested under other fields
      console.log('\n🔍 Checking for nested volunteer data...');

      if (data.volunteering) {
        console.log('\n✅ Found volunteering field:');
        console.log('Type:', typeof data.volunteering);
        console.log('Is Array:', Array.isArray(data.volunteering));
        console.log('Length:', data.volunteering ? data.volunteering.length : 0);
        console.log('Content:', JSON.stringify(data.volunteering, null, 2));
      }

      if (data.volunteer_experience) {
        console.log('\n✅ Found volunteer_experience field:');
        console.log('Type:', typeof data.volunteer_experience);
        console.log('Is Array:', Array.isArray(data.volunteer_experience));
        console.log('Content:', JSON.stringify(data.volunteer_experience, null, 2));
      }

      if (data.volunteer) {
        console.log('\n✅ Found volunteer field:');
        console.log('Type:', typeof data.volunteer);
        console.log('Is Array:', Array.isArray(data.volunteer));
        console.log('Content:', JSON.stringify(data.volunteer, null, 2));
      }

      // Check experience field for volunteer entries
      if (data.experience && Array.isArray(data.experience)) {
        console.log('\n🔍 Checking experience array for volunteer entries...');
        const volunteerExperience = data.experience.filter(exp => {
          const title = (exp.title || exp.position || '').toLowerCase();
          const company = (exp.company || exp.company_name || '').toLowerCase();
          const description = (exp.description || '').toLowerCase();

          return title.includes('volunteer') ||
                 company.includes('volunteer') ||
                 description.includes('volunteer') ||
                 title.includes('könüllü') ||
                 company.includes('könüllü');
        });

        if (volunteerExperience.length > 0) {
          console.log(`Found ${volunteerExperience.length} volunteer entries in experience:`);
          volunteerExperience.forEach((vol, index) => {
            console.log(`\nVolunteer Entry ${index + 1}:`);
            console.log('Title:', vol.title || vol.position);
            console.log('Company:', vol.company || vol.company_name);
            console.log('Duration:', vol.duration);
            console.log('Description:', vol.description);
          });
        } else {
          console.log('No volunteer entries found in experience array');
        }
      }

      // Full data dump for analysis
      console.log('\n📊 Full Response (for debugging):');
      console.log(JSON.stringify(data, null, 2));

    } else {
      console.log('Request failed with status code: ' + response.status);
    }
  })
  .catch(function (error) {
    console.error('Error making the request: ' + error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  });
