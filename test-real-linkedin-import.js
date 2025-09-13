// Test real LinkedIn import with debug logs
async function testRealLinkedInImport() {
  console.log('🧪 Testing Real LinkedIn Import with Debug Logs\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/import/linkedin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkedinUsername: 'musayevcreate',
        userId: 'test-user-123',
        premium: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Import failed:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Import successful!');
    console.log('CV ID:', result.cvId);
    
    // Check if volunteer and certification data was included
    if (result.data) {
      console.log('\n📊 Imported Data Summary:');
      console.log('Volunteer Experience:', result.data.volunteerExperience?.length || 0, 'items');
      console.log('Certifications:', result.data.certifications?.length || 0, 'items');
      
      if (result.data.volunteerExperience?.length > 0) {
        console.log('\n🤝 First volunteer experience:', result.data.volunteerExperience[0]);
      }
      
      if (result.data.certifications?.length > 0) {
        console.log('\n🏆 First certification:', result.data.certifications[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run test
testRealLinkedInImport();
