import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user in the User table (not Admin table)
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cvera.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cvera.com',
      password: hashedPassword,
      role: 'superadmin',
      tier: 'Premium',
    },
  });

  console.log('Created admin user:', admin);

  // Note: API key functionality removed - using HTML scraping approach for LinkedIn
  console.log('✅ LinkedIn scraping configured for HTML-based profile extraction');
  console.log('ℹ️  No API keys needed - direct browser automation approach');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
