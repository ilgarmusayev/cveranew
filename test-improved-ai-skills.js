const fetch = require('node-fetch');

// Test improved AI skills suggestion
async function testImprovedAISkills() {
    try {
        // Mock CV ID və user token
        const testCvId = 'test-cv-id';
        const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'; // Mock token

        console.log('🧪 Testing improved AI skills suggestion...');
        
        const response = await fetch('http://localhost:3000/api/ai/suggest-skills', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                cvId: testCvId
            })
        });

        const result = await response.json();
        
        console.log('📊 API Response Status:', response.status);
        console.log('📋 Result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('✅ AI Skills suggestion worked!');
            console.log('🎯 Suggested Skills:');
            result.suggestions.forEach((skill, index) => {
                console.log(`   ${index + 1}. ${skill.name}`);
                console.log(`      Category: ${skill.category}`);
                console.log(`      Reason: ${skill.reason}`);
                console.log(`      CV Connection: ${skill.cvConnection}`);
                console.log('');
            });
        } else {
            console.log('❌ AI Skills suggestion failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run test
testImprovedAISkills();
