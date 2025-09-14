// LinkedIn Volunteer məlumatlarını test etmək üçün
const testVolunteerData = {
  volunteering: [
    {
      role: "Məntorluq Proqram Koordinatoru", 
      organization: "Gənc Liderlər Təşkilatı",
      cause: "Təhsil və Gənclik İnkişafı",
      start_date: "2022-01-01",
      end_date: "2023-12-31", 
      current: false,
      description: "Gənc peşəkarlar üçün mentorluq proqramının koordinasiyası və həyata keçirilməsi. 50+ gəncin karyera inkişafında dəstək verilməsi."
    },
    {
      role: "Könüllü Təlimçi",
      organization: "Rəqəmsal Savadlılıq Mərkəzi", 
      cause: "Texnologiya və Rəqəmsal Təhsil",
      start_date: "2023-06-01",
      current: true,
      description: "Yaşlı insanlar üçün kompüter və internet istifadəsi dərslərinin keçirilməsi. Həftədə 2 dərs, 20+ iştirakçı."
    }
  ]
};

console.log("Test Volunteer Data:");
console.log(JSON.stringify(testVolunteerData, null, 2));

// LinkedIn Import Service simulasiyası
function formatVolunteerExperience(volunteer) {
  if (!Array.isArray(volunteer)) return [];

  return volunteer.map(vol => ({
    id: generateId(),
    role: vol.role || vol.position || vol.title || '',
    organization: vol.organization || vol.company || '',
    cause: vol.cause || vol.field || '',
    startDate: formatDate(vol.start_date || vol.startDate),
    endDate: formatDate(vol.end_date || vol.endDate),
    current: vol.current || false,
    description: vol.description || vol.summary || ''
  })).filter(vol => vol.role || vol.organization);
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

console.log("\nFormatted Volunteer Experience:");
const formattedVolunteers = formatVolunteerExperience(testVolunteerData.volunteering);
console.log(JSON.stringify(formattedVolunteers, null, 2));
