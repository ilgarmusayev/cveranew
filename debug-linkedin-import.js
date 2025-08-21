const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugLinkedInImport() {
  try {
    console.log('🔍 LinkedIn Import Debug Test');
    console.log('=====================================');

    // Step 1: Test ScrapingDog API
    console.log('\n1️⃣ Testing ScrapingDog API...');

    const api_key = '6882894b855f5678d36484c8';
    const url = 'https://api.scrapingdog.com/linkedin';

    const params = {
      api_key: api_key,
      type: 'profile',
      linkId: 'musayevcreate',
      premium: 'false',
    };

    const response = await axios.get(url, { params: params });

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ ScrapingDog API works');
      console.log('📊 Data type:', Array.isArray(data) ? 'Array' : 'Object');

      // Extract profile data like the API does
      let profile = data;
      if (Array.isArray(data) && data.length > 0) {
        profile = data[0];
        console.log('✅ Extracted from array format');
      }

      console.log('\n📋 Profile Data Structure:');
      console.log('- Full name:', profile.full_name || 'MISSING');
      console.log('- About:', profile.about ? profile.about.substring(0, 50) + '...' : 'MISSING');
      console.log('- Experience items:', profile.experience ? profile.experience.length : 0);
      console.log('- Education items:', profile.education ? profile.education.length : 0);
      console.log('- Projects items:', profile.projects ? profile.projects.length : 0);
      console.log('- Awards items:', profile.awards ? profile.awards.length : 0);

      // Step 2: Simulate CV Data Transformation
      console.log('\n2️⃣ Testing CV Data Transformation...');

      const cvData = {
        personalInfo: {
          fullName: profile.full_name || profile.name || '',
          email: '',
          phone: '',
          address: profile.location || '',
          website: profile.public_profile_url || '',
          linkedin: profile.public_profile_url || '',
          summary: profile.about || profile.headline || profile.summary || ''
        },
        experience: (profile.experience || []).map((exp) => ({
          position: exp.position || exp.title || '',
          company: exp.company_name || exp.company || '',
          startDate: exp.starts_at || exp.start_date || exp.startDate || '',
          endDate: exp.ends_at || exp.end_date || exp.endDate || '',
          description: exp.summary || exp.description || '',
          location: exp.location || ''
        })),
        education: (profile.education || []).map((edu) => ({
          degree: edu.college_degree || edu.degree || '',
          institution: edu.college_name || edu.school || edu.institution || '',
          year: edu.college_duration || edu.duration || edu.year || '',
          description: edu.college_activity || edu.description || '',
          gpa: edu.gpa || ''
        })),
        skills: profile.skills ?
          (Array.isArray(profile.skills) ?
            profile.skills.map((skill) => ({
              name: typeof skill === 'string' ? skill : skill.name || skill.skill || '',
              level: 'Intermediate'
            })) : []
          ) : [],
        projects: (profile.projects || []).map((proj) => ({
          name: proj.title || proj.name || '',
          description: proj.description || proj.summary || '',
          startDate: proj.duration || proj.start_date || proj.startDate || '',
          endDate: proj.end_date || proj.endDate || '',
          skills: proj.skills || '',
          url: proj.link || proj.url || ''
        })),
        honorsAwards: (profile.awards || []).map((award) => ({
          title: award.name || award.title || '',
          issuer: award.organization || award.issuer || award.authority || '',
          date: award.duration || award.date || award.issued_date || '',
          description: award.summary || award.description || ''
        })),
        languages: [],
        certifications: [],
        volunteerExperience: [],
        publications: [],
        testScores: [],
        recommendations: [],
        courses: [],
        cvLanguage: 'azerbaijani'
      };

      console.log('✅ CV Data Transformation Complete');
      console.log('📊 Transformed Data Summary:');
      console.log('- Personal Info:', cvData.personalInfo.fullName ? '✅' : '❌');
      console.log('- Experience count:', cvData.experience.length);
      console.log('- Education count:', cvData.education.length);
      console.log('- Skills count:', cvData.skills.length);
      console.log('- Projects count:', cvData.projects.length);
      console.log('- Awards count:', cvData.honorsAwards.length);

      // Step 3: Test Database Connection
      console.log('\n3️⃣ Testing Database Connection...');

      try {
        const userCount = await prisma.user.count();
        console.log('✅ Database connected, user count:', userCount);

        // Find a test user
        const testUser = await prisma.user.findFirst();
        if (testUser) {
          console.log('✅ Test user found:', testUser.email);

          // Step 4: Test CV Creation
          console.log('\n4️⃣ Testing CV Creation...');

          const testCV = await prisma.cV.create({
            data: {
              userId: testUser.id,
              title: `${profile.full_name} - LinkedIn Import Test`,
              templateId: 'professional',
              cv_data: cvData
            }
          });

          console.log('✅ Test CV created successfully!');
          console.log('📋 CV ID:', testCV.id);
          console.log('📝 CV Title:', testCV.title);

          // Step 5: Test CV Retrieval
          console.log('\n5️⃣ Testing CV Retrieval...');

          const retrievedCV = await prisma.cV.findUnique({
            where: { id: testCV.id }
          });

          if (retrievedCV) {
            console.log('✅ CV retrieved successfully!');
            console.log('📊 Retrieved CV Data:');
            console.log('- Personal Info Name:', retrievedCV.cv_data.personalInfo?.fullName || 'MISSING');
            console.log('- Experience count:', retrievedCV.cv_data.experience?.length || 0);
            console.log('- Education count:', retrievedCV.cv_data.education?.length || 0);
            console.log('- Skills count:', retrievedCV.cv_data.skills?.length || 0);

            console.log('\n🎯 Test CV Link:');
            console.log(`http://localhost:3000/cv/edit/${testCV.id}`);

            // Clean up test CV
            await prisma.cV.delete({ where: { id: testCV.id } });
            console.log('🧹 Test CV cleaned up');

          } else {
            console.log('❌ Failed to retrieve CV');
          }

        } else {
          console.log('❌ No test user found in database');
        }

      } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
      }

    } else {
      console.log('❌ ScrapingDog API failed with status:', response.status);
    }

    console.log('\n=====================================');
    console.log('🔍 Debug Test Complete');

  } catch (error) {
    console.error('💥 Debug test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugLinkedInImport();
