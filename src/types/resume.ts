/**
 * Resume types for the AI parsing and storage
 */

export interface ParsedResume {
  personal: PersonalInfo;
  professional: ProfessionalInfo;
  experience: Experience[] | null;
  education: Education[] | null;
  languages: Language[] | null;
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
    soft: string[] | null;
    tools: string[] | null;
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
  certifications: string[] | null;
  publications: string[] | null;
  projects: string[] | null;
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

export interface TextSearchResult {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  current_position: string;
  current_company: string;
  experience_years: number;
  skills: string[];
  summary: string;
  score: number;
}

