const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullLinkedInImport() {
  try {
    console.log('🔍 Testing Full LinkedIn Import Flow...');
    
    // Step 1: Check user existence (we'll use a test user)
    console.log('\n📊 Step 1: Finding a test user...');
    
    const testUser = await prisma.user.findFirst({
      where: {
        email: { contains: '@' }
      }
    });
    
    if (!testUser) {
      console.error('❌ No test user found in database');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.email} (ID: ${testUser.id})`);
    
    // Step 2: Test LinkedIn Import Service directly
    console.log('\n🔍 Step 2: Testing LinkedIn Import Service...');
    
    const { linkedInImportService } = require('./src/lib/services/linkedin-import.ts');
    
    const testLinkedInUrl = 'musayevcreate'; // Your LinkedIn username
    
    console.log(`📞 Calling importLinkedInProfile for: ${testLinkedInUrl}`);
    
    const result = await linkedInImportService.importLinkedInProfile(testUser.id, testLinkedInUrl);
    
    console.log('📊 Import result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ LinkedIn Import is working correctly!');
      console.log(`✅ Created CV ID: ${result.cvId}`);
    } else {
      console.log('❌ LinkedIn Import failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testFullLinkedInImport();
