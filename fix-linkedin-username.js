const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndUpdateLinkedInUser() {
  try {
    // Find user by email (replace with your email)
    const userEmail = 'musayevcreate@gmail.com'; // Your email here
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        loginMethod: true,
        linkedinId: true,
        linkedinUsername: true
      }
    });

    if (user) {
      console.log('Current user data:', user);
      
      // If linkedinUsername is missing, add it
      if (user.loginMethod === 'linkedin' && !user.linkedinUsername) {
        console.log('Adding LinkedIn username...');
        
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            linkedinUsername: 'musayevcreate' // Your LinkedIn username
          }
        });
        
        console.log('Updated user:', updatedUser);
      } else {
        console.log('User already has LinkedIn username or not logged in via LinkedIn');
      }
    } else {
      console.log('User not found with email:', userEmail);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateLinkedInUser();
