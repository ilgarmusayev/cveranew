const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
require('dotenv').config();

async function diagnoseDatabaseConnection() {
  console.log('🔍 Database Connection Diagnostics Starting...\n');

  // 1. Check environment variables
  console.log('1. Environment Variables Check:');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  if (process.env.DATABASE_URL) {
    // Mask password for security
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log('DATABASE_URL (masked):', maskedUrl);
  }
  console.log('');

  // 2. Parse DATABASE_URL
  console.log('2. Database URL Analysis:');
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('Protocol:', url.protocol);
    console.log('Host:', url.hostname);
    console.log('Port:', url.port);
    console.log('Database:', url.pathname.slice(1));
    console.log('Username:', url.username);
    console.log('SSL Mode:', url.searchParams.get('sslmode'));
    console.log('');
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message);
    console.log('');
  }

  // 3. Network connectivity test
  console.log('3. Network Connectivity Test:');
  try {
    console.log('Testing connection to cvera.postgres.database.azure.com:5432...');
    execSync('timeout 10 nc -z cvera.postgres.database.azure.com 5432', { stdio: 'pipe' });
    console.log('✅ Network connection successful');
  } catch (error) {
    console.log('❌ Network connection failed');
    console.log('Trying alternative connectivity test...');
    try {
      execSync('timeout 10 telnet cvera.postgres.database.azure.com 5432', { stdio: 'pipe' });
      console.log('✅ Alternative connection successful');
    } catch (telnetError) {
      console.log('❌ Alternative connection also failed');
    }
  }
  console.log('');

  // 4. DNS resolution test
  console.log('4. DNS Resolution Test:');
  try {
    const result = execSync('nslookup cvera.postgres.database.azure.com', { encoding: 'utf8' });
    console.log('✅ DNS resolution successful');
    console.log('DNS Result:', result.split('\n').slice(0, 4).join('\n'));
  } catch (error) {
    console.log('❌ DNS resolution failed:', error.message);
  }
  console.log('');

  // 5. Prisma connection test
  console.log('5. Prisma Connection Test:');
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Attempting Prisma connection...');
    await prisma.$connect();
    console.log('✅ Prisma connection successful');

    // Test a simple query
    console.log('Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);

  } catch (error) {
    console.log('❌ Prisma connection failed');
    console.log('Error details:');
    console.log('  Code:', error.code);
    console.log('  Message:', error.message);
    console.log('  Meta:', error.meta);

    // Specific error handling
    if (error.code === 'P1001') {
      console.log('\n🔧 P1001 Error - Database server unreachable');
      console.log('Possible causes:');
      console.log('- Azure PostgreSQL server is paused/stopped');
      console.log('- Firewall rules blocking your IP');
      console.log('- Network connectivity issues');
      console.log('- SSL configuration problems');
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log('');

  // 6. Azure CLI check (if available)
  console.log('6. Azure CLI Check:');
  try {
    const azVersion = execSync('az --version', { encoding: 'utf8' });
    console.log('✅ Azure CLI available');

    // Try to check PostgreSQL server status
    try {
      console.log('Checking PostgreSQL server status...');
      const serverStatus = execSync(
        'az postgres server show --resource-group CVERAResourceGroup --name cvera --query "userVisibleState" -o tsv',
        { encoding: 'utf8' }
      );
      console.log('Server Status:', serverStatus.trim());
    } catch (statusError) {
      console.log('❌ Could not check server status:', statusError.message);
    }
  } catch (error) {
    console.log('❌ Azure CLI not available or not logged in');
  }
  console.log('');

  // 7. Suggested fixes
  console.log('7. Suggested Fixes:');
  console.log('1. Check Azure PostgreSQL server status in Azure Portal');
  console.log('2. Verify firewall rules allow your current IP address');
  console.log('3. Ensure SSL is properly configured');
  console.log('4. Try connecting with different SSL modes');
  console.log('5. Check if server is paused (Azure will pause unused servers)');
  console.log('6. Verify your Azure subscription is active');
}

// Run diagnostics
diagnoseDatabaseConnection()
  .then(() => {
    console.log('\n✅ Diagnostics completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostics failed:', error);
    process.exit(1);
  });
