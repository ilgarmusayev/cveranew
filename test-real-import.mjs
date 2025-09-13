import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Real LinkedIn import test
async function testRealLinkedInImport() {
  console.log('🧪 Testing Real LinkedIn Import with fixed certification field\n');
  
  try {
    // Get first active API key
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        service: 'scrapingdog',
        active: true
      }
    });
    
    if (!apiKey) {
      throw new Error('No active API key found');
    }
    
    console.log('Using API key:', apiKey.apiKey.substring(0, 8) + '***');
    
    // Make request to our own LinkedIn import API
    const response = await fetch('http://localhost:3000/api/import/linkedin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkedinUsername: 'musayevcreate'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Import failed:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Import result:', result);
    
    // Get the created CV data
    if (result.id) {
      const cv = await prisma.cV.findUnique({
        where: { id: result.id }
      });
      
      if (cv && cv.cv_data) {
        const cvData = JSON.parse(cv.cv_data);
        
        console.log('\n📊 CV Data Analysis:');
        
        if (cvData.volunteerExperience && cvData.volunteerExperience.length > 0) {
          console.log('🎉 Volunteer Experience found:', cvData.volunteerExperience.length, 'items');
          console.log('First volunteer:', cvData.volunteerExperience[0]);
        } else {
          console.log('❌ No volunteer experience in CV data');
        }
        
        if (cvData.certifications && cvData.certifications.length > 0) {
          console.log('🏆 Certifications found:', cvData.certifications.length, 'items');
          console.log('First certification:', cvData.certifications[0]);
        } else {
          console.log('❌ No certifications in CV data');
        }
        
        // Show all available fields
        console.log('\n📋 Available fields in CV data:');
        Object.keys(cvData).forEach(key => {
          if (Array.isArray(cvData[key])) {
            console.log(`  ${key}: Array[${cvData[key].length}]`);
          } else if (typeof cvData[key] === 'object' && cvData[key] !== null) {
            console.log(`  ${key}: Object`);
          } else {
            console.log(`  ${key}: ${typeof cvData[key]}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if Next.js server is running first
async function checkServerAndRun() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    await testRealLinkedInImport();
  } catch (error) {
    console.log('❌ Next.js server not running on localhost:3000');
    console.log('Please start the server with: npm run dev');
  }
}

checkServerAndRun();
