// Test LinkedIn import specifically for experience count and data structure

const axios = require('axios');

async function testLinkedInExperienceMapping() {
    try {
        console.log('🔍 LinkedIn Experience Mapping Test başladı...');
        
        // Test a specific LinkedIn profile (you can change this)
        const linkedinUrl = 'https://www.linkedin.com/in/musayevcreate';
        
        // API call
        const response = await axios.post('http://localhost:3000/api/import/linkedin', {
            linkedinUrl: linkedinUrl
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjA2NGMzZC1iZmU3LTQ1ZjMtYTVjYS1hMzUzZWNlZGEyMDUiLCJlbWFpbCI6Im11c2F5ZXZjcmVhdGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Nzc3MzE1LCJleHAiOjE3MzcwMzY1MTV9.zYu0Hnhm33OhOGZGr1nDMPi6sZaQJHbE79eHAHB_mL8',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ LinkedIn import successful!');
            console.log('📊 Import summary:', response.data.summary);
            
            // Get CV data to check what was actually imported
            const cvId = response.data.cvId;
            
            const cvResponse = await axios.get(`http://localhost:3000/api/cv/${cvId}`, {
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjA2NGMzZC1iZmU3LTQ1ZjMtYTVjYS1hMzUzZWNlZGEyMDUiLCJlbWFpbCI6Im11c2F5ZXZjcmVhdGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Nzc3MzE1LCJleHAiOjE3MzcwMzY1MTV9.zYu0Hnhm33OhOGZGr1nDMPi6sZaQJHbE79eHAHB_mL8'
                }
            });
            
            if (cvResponse.status === 200) {
                const cvData = cvResponse.data.cv_data;
                
                console.log('\n=== EXPERIENCE ANALYSIS ===');
                console.log('Experience Count:', cvData.experience?.length || 0);
                
                if (cvData.experience && cvData.experience.length > 0) {
                    cvData.experience.forEach((exp, index) => {
                        console.log(`\nExperience ${index + 1}:`);
                        console.log(`  Position: ${exp.position}`);
                        console.log(`  Company: ${exp.company}`);
                        console.log(`  Duration: ${exp.startDate} - ${exp.endDate || 'Present'}`);
                        console.log(`  Current: ${exp.current}`);
                        console.log(`  Description length: ${exp.description?.length || 0} chars`);
                        console.log(`  ID: ${exp.id}`);
                    });
                } else {
                    console.log('❌ No experience data found!');
                }
                
                console.log('\n=== CERTIFICATIONS ANALYSIS ===');
                console.log('Certifications Count:', cvData.certifications?.length || 0);
                
                if (cvData.certifications && cvData.certifications.length > 0) {
                    cvData.certifications.forEach((cert, index) => {
                        console.log(`\nCertification ${index + 1}:`);
                        console.log(`  Name: ${cert.name}`);
                        console.log(`  Issuer: ${cert.issuer}`);
                        console.log(`  Issue Date: ${cert.issueDate}`);
                        console.log(`  ID: ${cert.id}`);
                    });
                } else {
                    console.log('❌ No certifications data found!');
                }
                
                console.log('\n=== VOLUNTEER EXPERIENCE ANALYSIS ===');
                console.log('Volunteer Experience Count:', cvData.volunteerExperience?.length || 0);
                
                if (cvData.volunteerExperience && cvData.volunteerExperience.length > 0) {
                    cvData.volunteerExperience.forEach((vol, index) => {
                        console.log(`\nVolunteer ${index + 1}:`);
                        console.log(`  Role: ${vol.role}`);
                        console.log(`  Organization: ${vol.organization}`);
                        console.log(`  Cause: ${vol.cause}`);
                        console.log(`  ID: ${vol.id}`);
                    });
                } else {
                    console.log('❌ No volunteer experience data found!');
                }
                
                console.log('\n=== SUMMARY ===');
                console.log('Personal Info Field:', cvData.personalInfo?.field || 'Missing!');
                console.log('Summary length:', cvData.personalInfo?.summary?.length || 0);
                
            }
        } else {
            console.log('❌ LinkedIn import failed:', response.data);
        }
        
    } catch (error) {
        console.error('💥 Test error:', error.response?.data || error.message);
    }
}

testLinkedInExperienceMapping();
