const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixLinkedInUsername() {
  try {
    console.log('🔧 LinkedIn username məsələsini düzəldiram...');

    // Find user with LinkedIn ID but no username
    const userWithoutUsername = await prisma.user.findFirst({
      where: {
        linkedinId: 'nS-KkMhUru',
        linkedinUsername: null
      }
    });

    if (userWithoutUsername) {
      console.log(`👤 İstifadəçi tapıldı: ${userWithoutUsername.email}`);

      // Update with correct LinkedIn username
      await prisma.user.update({
        where: { id: userWithoutUsername.id },
        data: {
          linkedinUsername: 'musayevcreate'  // Based on the provided linkId
        }
      });

      console.log('✅ LinkedIn username yeniləndi: musayevcreate');
    } else {
      console.log('ℹ️ LinkedIn username-i olmayan istifadəçi tapılmadı');
    }

    // Verify the fix
    const updatedUser = await prisma.user.findFirst({
      where: {
        linkedinId: 'nS-KkMhUru'
      },
      select: {
        email: true,
        linkedinUsername: true,
        linkedinId: true
      }
    });

    console.log('📋 Yenilənmiş istifadəçi məlumatları:');
    console.log(updatedUser);

  } catch (error) {
    console.error('❌ Xəta baş verdi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixLinkedInUsername();
