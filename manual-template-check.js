// Manual template test - server olmadan
const fs = require('fs');
const path = require('path');

console.log('🔍 Template fayllarını manual yoxlayıram...\n');

// 1. Preview şəklini yoxla
const previewPath = path.join(__dirname, 'public', 'templates', 'traditional-preview.jpg');
if (fs.existsSync(previewPath)) {
  const stats = fs.statSync(previewPath);
  console.log('✅ Preview şəkli tapıldı:');
  console.log(`   📁 Yol: ${previewPath}`);
  console.log(`   📏 Ölçü: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   📅 Yaradılma tarixi: ${stats.birthtime.toLocaleString()}`);
} else {
  console.log('❌ Preview şəkli tapılmadı!');
}

// 2. Template HTML faylını yoxla
const htmlPath = path.join(__dirname, 'traditional-preview-sample.html');
if (fs.existsSync(htmlPath)) {
  console.log('\n✅ Template HTML nümunəsi tapıldı:');
  console.log(`   📁 Yol: ${htmlPath}`);
} else {
  console.log('\n❌ Template HTML nümunəsi tapılmadı!');
}

// 3. Template kod fayllarını yoxla
const codeFiles = [
  'src/lib/fileGeneration.ts',
  'src/app/api/cv/preview/route.ts',
  'src/app/api/templates/route.ts'
];

console.log('\n🔧 Template kod faylları:');
codeFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - TAPILMADI!`);
  }
});

// 4. Direkt browser test URL-ləri
console.log('\n🌐 Test URL-ləri (server işə düşdükdən sonra):');
console.log('   📱 Template səhifəsi: http://localhost:3001/templates');
console.log('   🔗 Template API: http://localhost:3001/api/templates');
console.log('   🖼️ Preview şəkli: http://localhost:3001/templates/traditional-preview.jpg');

console.log('\n📋 Təlimatlar:');
console.log('1. Development server-i işə salın: npm run dev');
console.log('2. Browser-də http://localhost:3001/templates açın');
console.log('3. "Ənənəvi CV" template-ini axtarın');
console.log('4. Əgər görünmürsə, F12 açıb Console-da xətaları yoxlayın');

console.log('\n🎯 Template məlumatları:');
console.log('   - Ad: "Ənənəvi CV"');
console.log('   - ID: "traditional" və ya "8b26fb4c-7ec1-4c0d-bbd9-4b597fb1df45"');
console.log('   - Tier: "Free"');
console.log('   - Preview: "/templates/traditional-preview.jpg"');
