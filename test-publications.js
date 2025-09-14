// Test publications data structure
const testPublications = [
  {
    id: 'pub_1',
    title: 'Azərbaycan dilində maşın öyrənməsi',
    publisher: 'Elm və Texnologiya Jurnalı',
    authors: 'Müsayev Elnur, Həsənova Ayşə',
    date: '2024-03-15',
    description: 'Bu məqalədə Azərbaycan dilində maşın öyrənməsi metodları tədqiq edilir.',
    url: 'https://example.com/publication1'
  },
  {
    id: 'pub_2', 
    title: 'Modern CV Yaratma Sistemləri',
    publisher: 'İnformasiya Texnologiyaları Dərgisi',
    authors: 'Müsayev Elnur',
    date: '2024-01-20',
    description: 'CV yaratma prosesində istifadə olunan müasir texnologiyalar haqqında.',
    url: 'https://example.com/publication2'
  }
];

console.log('Test Publications:', JSON.stringify(testPublications, null, 2));

// Test the formatting
testPublications.forEach(pub => {
  console.log(`\n📚 ${pub.title}`);
  console.log(`   Publisher: ${pub.publisher}`);  
  console.log(`   Authors: ${pub.authors}`);
  console.log(`   Date: ${pub.date}`);
  console.log(`   Description: ${pub.description}`);
  if (pub.url) {
    console.log(`   URL: ${pub.url}`);
  }
});
