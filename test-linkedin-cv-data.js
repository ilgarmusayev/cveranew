// LinkedIn Import Test - Debug CV Data Structure
const axios = require('axios');

async function testLinkedInImportDataStructure() {
    try {
        console.log('🔍 LinkedIn Import CV data structure test başladı...');
        
        const baseUrl = 'http://localhost:3000';
        
        // Test LinkedIn import
        const linkedinUrl = 'https://www.linkedin.com/in/musayevcreate';
        
        console.log(`📞 LinkedIn import API çağırılır: ${linkedinUrl}`);
        
        const response = await axios.post(`${baseUrl}/api/import/linkedin`, {
            linkedinUrl: linkedinUrl
        }, {
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjA2NGMzZC1iZmU3LTQ1ZjMtYTVjYS1hMzUzZWNlZGEyMDUiLCJlbWFpbCI6Im11c2F5ZXZjcmVhdGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Nzc3MzE1LCJleHAiOjE3MzcwMzY1MTV9.zYu0Hnhm33OhOGZGr1nDMPi6sZaQJHbE79eHAHB_mL8',
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ LinkedIn import uğurludur!');
            console.log('📋 Import Summary:', response.data.summary);
            console.log('🆔 CV ID:', response.data.cvId);
            
            // İndi yaradılan CV-nin məlumatlarını çəkək
            console.log('\n🔍 CV məlumatları çəkilir...');
            
            const cvResponse = await axios.get(`${baseUrl}/api/cv/${response.data.cvId}`, {
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlNjA2NGMzZC1iZmU3LTQ1ZjMtYTVjYS1hMzUzZWNlZGEyMDUiLCJlbWFpbCI6Im11c2F5ZXZjcmVhdGVAZ21haWwuY29tIiwiaWF0IjoxNzM2Nzc3MzE1LCJleHAiOjE3MzcwMzY1MTV9.zYu0Hnhm33OhOGZGr1nDMPi6sZaQJHbE79eHAHB_mL8',
                    'Content-Type': 'application/json'
                }
            });
            
            if (cvResponse.status === 200) {
                console.log('✅ CV məlumatları alındı!');
                const cvData = cvResponse.data.cv_data;
                
                console.log('\n📊 CV Data Structure Analysis:');
                console.log('==================================');
                
                // Personal Info
                console.log('\n👤 Personal Info:');
                console.log(JSON.stringify(cvData.personalInfo, null, 2));
                
                // Experience
                console.log('\n💼 Experience Count:', cvData.experience?.length || 0);
                if (cvData.experience && cvData.experience.length > 0) {
                    console.log('Experience Details:');
                    cvData.experience.forEach((exp, index) => {
                        console.log(`  ${index + 1}. ${exp.position} at ${exp.company}`);
                        console.log(`     Duration: ${exp.startDate} - ${exp.endDate || 'Present'}`);
                        console.log(`     Description: ${exp.description?.substring(0, 100)}...`);
                    });
                } else {
                    console.log('❌ Experience məlumatları yoxdur!');
                }
                
                // Education
                console.log('\n🎓 Education Count:', cvData.education?.length || 0);
                if (cvData.education && cvData.education.length > 0) {
                    cvData.education.forEach((edu, index) => {
                        console.log(`  ${index + 1}. ${edu.degree} at ${edu.institution}`);
                    });
                } else {
                    console.log('❌ Education məlumatları yoxdur!');
                }
                
                // Skills
                console.log('\n🎯 Skills Count:', cvData.skills?.length || 0);
                if (cvData.skills && cvData.skills.length > 0) {
                    console.log('Skills:', cvData.skills.map(s => s.name || s).join(', '));
                } else {
                    console.log('❌ Skills məlumatları yoxdur!');
                }
                
                // Projects
                console.log('\n🚀 Projects Count:', cvData.projects?.length || 0);
                if (cvData.projects && cvData.projects.length > 0) {
                    cvData.projects.forEach((proj, index) => {
                        console.log(`  ${index + 1}. ${proj.name}`);
                    });
                } else {
                    console.log('❌ Projects məlumatları yoxdur!');
                }
                
                // Certifications
                console.log('\n📜 Certifications Count:', cvData.certifications?.length || 0);
                if (cvData.certifications && cvData.certifications.length > 0) {
                    cvData.certifications.forEach((cert, index) => {
                        console.log(`  ${index + 1}. ${cert.name} by ${cert.issuer}`);
                    });
                } else {
                    console.log('❌ Certifications məlumatları yoxdur!');
                }
                
                // Volunteer Experience
                console.log('\n🤝 Volunteer Experience Count:', cvData.volunteerExperience?.length || 0);
                if (cvData.volunteerExperience && cvData.volunteerExperience.length > 0) {
                    cvData.volunteerExperience.forEach((vol, index) => {
                        console.log(`  ${index + 1}. ${vol.role} at ${vol.organization}`);
                    });
                } else {
                    console.log('❌ Volunteer Experience məlumatları yoxdur!');
                }
                
                // Summary
                console.log('\n📝 Summary:');
                if (cvData.personalInfo?.summary) {
                    console.log(cvData.personalInfo.summary.substring(0, 200) + '...');
                } else {
                    console.log('❌ Summary məlumatları yoxdur!');
                }
                
                console.log('\n🔍 Data Types Validation:');
                console.log('- Experience is Array:', Array.isArray(cvData.experience));
                console.log('- Certifications is Array:', Array.isArray(cvData.certifications));
                console.log('- VolunteerExperience is Array:', Array.isArray(cvData.volunteerExperience));
                console.log('- PersonalInfo is Object:', typeof cvData.personalInfo === 'object');
                
            } else {
                console.log('❌ CV məlumatları alınmadı:', cvResponse.status);
            }
            
        } else {
            console.log('❌ LinkedIn import uğursuz:', response.data);
        }
        
    } catch (error) {
        console.error('💥 Test xətası:', error.response?.data || error.message);
    }
}

testLinkedInImportDataStructure();
