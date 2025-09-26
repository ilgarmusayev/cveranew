export interface PersonalInfo {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  location?: string;
  address?: string;
  field?: string; // Field of expertise/specialization
  summary?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  profileImage?: string; // Premium feature - profile image URL
  profilePicture?: string; // Alternative field name for profile image
  additionalLinks?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  type?: 'hard' | 'soft';
  level?: string;
  category?: string;
  description?: string;
}

export interface Language {
  id: string;
  language: string;
  level: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
  github?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  description?: string;
  url?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
  cause?: string;
}

export interface Publication {
  id: string;
  title: string;
  description?: string;
  url?: string;
  date?: string;
  publisher?: string;
  authors?: string[];
}

export interface HonorAward {
  id: string;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export interface TestScore {
  id: string;
  testName: string;
  score: string;
  date?: string;
  description?: string;
  maxScore?: string;
}

export interface Organization {
  id: string;
  name: string;
  role?: string;
  position?: string; // Alternative field name for role
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  url?: string;
  website?: string; // Alternative field name for url
}

export interface Recommendation {
  id: string;
  recommenderName: string;
  recommenderTitle?: string;
  recommenderCompany?: string;
  text: string;
  date?: string;
}

export interface Course {
  id: string;
  name: string;
  institution: string;
  description?: string;
  completionDate?: string;
  certificate?: boolean;
  url?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  description?: string;
  items: CustomSectionItem[];
  type?: 'simple' | 'detailed' | 'timeline';
  isVisible?: boolean;
  priority?: number;
  order?: number;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  url?: string;
  location?: string;
  skills?: string[];
  technologies?: string[];
  tags?: string[];
  metadata?: Record<string, any>;
  priority?: number;
  isVisible?: boolean;
}

export interface TranslationMetadata {
  translatedAt: string;
  fromLanguage?: 'azerbaijani' | 'english';
  toLanguage: 'azerbaijani' | 'english';
  translationLock?: boolean;
}

export interface CVData {
  personalInfo: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  languages?: Language[];
  projects?: Project[];
  certifications?: Certification[];
  volunteerExperience?: VolunteerExperience[];
  publications?: Publication[];
  honorsAwards?: HonorAward[];
  testScores?: TestScore[];
  recommendations?: Recommendation[];
  courses?: Course[];
  organizations?: Organization[];
  customSections?: CustomSection[];
  cvLanguage?: 'azerbaijani' | 'english' | 'russian'; // CV display language
  translationMetadata?: TranslationMetadata;
  sectionOrder?: any[];
  sectionNames?: Record<string, string>;
}

export interface CV {
  id: string;
  title: string;
  data: CVData;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
