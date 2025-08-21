const fetch = require('node-fetch');

async function testTemplateAPI() {
  try {
    console.log('🌐 Template API-ni test edirəm...\n');

    // Test without authentication first
    console.log('1. Authentication olmadan test:');
    const response1 = await fetch('http://localhost:3001/api/templates');
    console.log(`   Status: ${response1.status}`);

    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`   ✅ Cavab alındı: ${data1.templates?.length || 0} template`);

      // Check if traditional template is in the response
      const traditionalTemplate = data1.templates?.find(t =>
        t.name === 'Ənənəvi CV' || t.name.includes('Ənənəvi')
      );

      if (traditionalTemplate) {
        console.log(`   ✅ "Ənənəvi CV" API cavabında var:`);
        console.log(`      - Ad: ${traditionalTemplate.name}`);
        console.log(`      - Preview URL: ${traditionalTemplate.previewUrl}`);
        console.log(`      - Has Access: ${traditionalTemplate.hasAccess}`);
      } else {
        console.log(`   ❌ "Ənənəvi CV" API cavabında yoxdur`);
        console.log(`   📋 Mövcud template-lər:`, data1.templates?.map(t => t.name));
      }
    } else {
      const errorText = await response1.text();
      console.log(`   ❌ Xəta: ${errorText}`);
    }

    console.log('\n2. Browser URL test:');
    console.log('   🌐 Açın: http://localhost:3001/api/templates');
    console.log('   🌐 Template səhifəsi: http://localhost:3001/templates');

  } catch (error) {
    console.error('❌ API test xətası:', error.message);
  }
}

testTemplateAPI();
