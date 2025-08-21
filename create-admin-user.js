const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Starting admin user creation process...');

  try {
    // Default admin credentials
    const adminEmail = 'admin@cvera.com';
    const adminPassword = 'Admin123!';

    console.log('Checking if admin already exists...');

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail);
      console.log('You can login with:');
      console.log('Email: admin@cvera.com');
      console.log('Password: Admin123!');
      return;
    }

    console.log('Creating new admin user...');

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'CVERA Administrator',
        role: 'SUPER_ADMIN',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('ID:', admin.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);

    // If admin table doesn't exist, create it
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('📝 Admin table does not exist. Creating admin table...');

      try {
        await prisma.$executeRaw`
          CREATE TABLE IF NOT EXISTS "Admin" (
            "id" TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
            "email" TEXT NOT NULL UNIQUE,
            "password" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "role" TEXT NOT NULL DEFAULT 'ADMIN',
            "active" BOOLEAN NOT NULL DEFAULT true,
            "lastLogin" DATETIME,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `;

        console.log('✅ Admin table created successfully');

        // Try creating admin user again
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const admin = await prisma.admin.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: 'CVERA Administrator',
            role: 'SUPER_ADMIN',
            active: true
          }
        });

        console.log('✅ Admin user created successfully after table creation!');
        console.log('Email:', adminEmail);
        console.log('Password:', adminPassword);
        console.log('ID:', admin.id);

      } catch (tableError) {
        console.error('❌ Error creating admin table:', tableError.message);
      }
    }
  } finally {
    console.log('Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Process completed');
  }
}

console.log('🚀 CVERA Admin User Creation Script');
console.log('==================================');
createAdminUser().catch(console.error);
