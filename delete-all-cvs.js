const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllCVs() {
  try {
    console.log('🗑️ Bütün CV-ləri silməyə başlayırıq...');

    // Əvvəlcə mövcud CV-ləri sayaq
    const cvCount = await prisma.cV.count();
    console.log(`📊 Mövcud CV sayı: ${cvCount}`);

    if (cvCount === 0) {
      console.log('✅ Heç bir CV tapılmadı, silməyə ehtiyac yoxdur');
      return;
    }

    // Bütün CV-ləri silik
    const deleteResult = await prisma.cV.deleteMany({});
    console.log(`✅ ${deleteResult.count} CV uğurla silindi`);

    // Yenidən yoxlayaq
    const remainingCount = await prisma.cV.count();
    console.log(`📊 Silinmədən sonra qalan CV sayı: ${remainingCount}`);

    console.log('🎉 Bütün CV-lər uğurla silindi!');

  } catch (error) {
    console.error('❌ CV-ləri silməkdə xəta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllCVs();
