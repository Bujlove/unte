/**
 * Resume types for the AI parsing and storage
 */

export interface ParsedResume {
  personal: PersonalInfo;
  professional: ProfessionalInfo;
  experience: Experience[];
  education: Education[];
  languages: Language[];
  additional: AdditionalInfo;
}

export interface PersonalInfo {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  birthDate?: string;
  photo?: string;
}

export interface ProfessionalInfo {
  title: string;
  summary: string;
  totalExperience: number;
  skills: {
    hard: string[];
    soft: string[];
    tools: string[];
  };
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  achievements: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface AdditionalInfo {
  certifications: string[];
  publications: string[];
  projects: string[];
}

export interface SalaryExpectation {
  min?: number;
  max?: number;
  currency: string;
  type?: "monthly" | "yearly" | "hourly";
}

export interface ResumeUploadResponse {
  success: boolean;
  resumeId?: string;
  uploadToken?: string;
  message?: string;
  error?: string;
}

export interface ResumeSearchFilters {
  skills?: string[];
  experienceYears?: {
    min?: number;
    max?: number;
  };
  location?: string;
  educationLevel?: string;
  salaryRange?: {
    min?: number;
    max?: number;
  };
}

export interface ResumeSearchResult {
  id: string;
  fullName: string;
  lastPosition: string;
  lastCompany: string;
  skills: string[];
  experienceYears: number;
  location: string;
  relevanceScore: number;
  matchDetails: {
    matchingSkills: string[];
    experienceMatch: boolean;
    locationMatch: boolean;
    summary: string;
  };
}

