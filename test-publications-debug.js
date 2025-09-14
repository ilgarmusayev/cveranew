// Publications Debug Test Script
console.log("🧪 Testing Publications Debug...");

// Test 1: Check if CVEditor creates publications properly
console.log("1️⃣ Creating test publication...");
const testPublication = {
    id: "test-pub-1",
    title: "Test Publication",
    publisher: "Test Publisher",
    date: "2024-12-15",
    url: "https://example.com",
    description: "Test description"
};

console.log("Test publication object:", testPublication);

// Test 2: Check if sectionOrder includes publications
console.log("\n2️⃣ Testing section order...");
const defaultSectionOrder = [
    'personalInfo',
    'summary',
    'experience',
    'education',
    'skills',
    'languages',
    'projects',
    'certifications',
    'volunteer',
    'publications',
    'honorsAwards',
    'courses',
    'testScores',
    'organizations',
    'customSections'
];

console.log("Publications in section order:", defaultSectionOrder.includes('publications'));
console.log("Section order index of publications:", defaultSectionOrder.indexOf('publications'));

// Test 3: Mock CV data with publications
console.log("\n3️⃣ Testing CV data structure...");
const mockCVData = {
    personalInfo: { name: "Test User" },
    publications: [testPublication],
    sectionOrder: defaultSectionOrder
};

console.log("Mock CV has publications:", !!mockCVData.publications);
console.log("Mock CV publications count:", mockCVData.publications.length);
console.log("Mock CV section order includes publications:", mockCVData.sectionOrder.includes('publications'));

console.log("\n✅ Publications debug test completed!");
console.log("Check browser console for actual debug logs when using the application.");
