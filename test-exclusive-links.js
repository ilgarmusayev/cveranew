// Exclusive template-də organizations linkləri test et
const testData = {
    organizations: [
        {
            id: 1,
            name: "Microsoft",
            url: "https://microsoft.com",
            role: "Developer",
            startDate: "2023-01-01",
            current: true,
            description: "Active member"
        },
        {
            id: 2,
            name: "Google",
            website: "https://google.com",
            position: "Contributor",
            startDate: "2022-01-01",
            endDate: "2023-01-01",
            description: "Former contributor"
        },
        {
            id: 3,
            name: "Apple",
            // No URL/website
            role: "Member",
            startDate: "2021-01-01",
            current: false,
            description: "Previous involvement"
        }
    ]
};

console.log("🧪 Testing Organizations Links:");
console.log("Test data:", JSON.stringify(testData, null, 2));

// Test link generation logic
testData.organizations.forEach((org, index) => {
    console.log(`\n--- Organization ${index + 1}: ${org.name} ---`);
    
    const hasUrl = org.url || org.website;
    const linkUrl = org.url || org.website;
    const rolePosition = org.role || org.position;
    
    console.log(`Has URL/Website: ${!!hasUrl}`);
    console.log(`Link URL: ${linkUrl || 'No link'}`);
    console.log(`Role/Position: ${rolePosition || 'No role'}`);
    
    if (hasUrl) {
        console.log(`✅ Should be clickable: ${org.name} -> ${linkUrl}`);
    } else {
        console.log(`❌ No link: ${org.name} (will show as plain text)`);
    }
});

console.log("\n📝 In ExclusiveTemplate:");
console.log("Link generation logic:");
console.log(`
{(org.url || org.website) ? (
    <a href={org.url || org.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 text-sm hover:text-blue-600 hover:underline">
        {org.name}
    </a>
) : (
    <h3 className="font-semibold text-gray-900 text-sm">{org.name}</h3>
)}
`);
