/**
 * Text-based search functionality (free alternative to embeddings)
 */

import { createAdminClient } from "@/lib/supabase/server";

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

/**
 * Search resumes using text-based matching
 */
export async function searchResumesByText(
  query: string,
  filters?: {
    position?: string;
    skills?: string[];
    experienceYears?: { min?: number; max?: number };
    location?: string;
    educationLevel?: string;
  }
): Promise<TextSearchResult[]> {
  const supabase = await createAdminClient();
  
  // Build search query
  let searchQuery = supabase
    .from("resume_summaries")
    .select(`
      id,
      full_name,
      email,
      phone,
      location,
      current_position,
      current_company,
      experience_years,
      skills,
      summary
    `);

  // Add text search conditions
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  if (searchTerms.length > 0) {
    // Search in multiple fields using OR conditions
    const orConditions = searchTerms.map(term => 
      `or(full_name.ilike.%${term}%,current_position.ilike.%${term}%,summary.ilike.%${term}%,skills.cs.{${term}}%)`
    ).join(',');
    
    searchQuery = searchQuery.or(orConditions);
  }

  // Add filters
  if (filters?.position) {
    searchQuery = searchQuery.ilike('current_position', `%${filters.position}%`);
  }

  if (filters?.skills && filters.skills.length > 0) {
    searchQuery = searchQuery.overlaps('skills', filters.skills);
  }

  if (filters?.experienceYears?.min !== undefined) {
    searchQuery = searchQuery.gte('experience_years', filters.experienceYears.min);
  }

  if (filters?.experienceYears?.max !== undefined) {
    searchQuery = searchQuery.lte('experience_years', filters.experienceYears.max);
  }

  if (filters?.location) {
    searchQuery = searchQuery.ilike('location', `%${filters.location}%`);
  }

  if (filters?.educationLevel) {
    searchQuery = searchQuery.ilike('education_level', `%${filters.educationLevel}%`);
  }

  const { data, error } = await searchQuery.limit(50);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  // Calculate relevance scores
  const results = (data || []).map(resume => ({
    ...resume,
    skills: resume.skills || [],
    score: calculateRelevanceScore(resume, query, filters)
  }));

  // Sort by relevance score
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Calculate relevance score for a resume
 */
function calculateRelevanceScore(
  resume: any,
  query: string,
  filters?: any
): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const searchFields = [
    resume.full_name,
    resume.current_position,
    resume.current_company,
    resume.summary,
    ...(resume.skills || [])
  ].filter(field => field).map(field => field.toLowerCase());

  // Exact matches get highest score
  searchFields.forEach(field => {
    if (field.includes(queryLower)) {
      score += 10;
    }
    
    // Partial matches get lower score
    const words = queryLower.split(/\s+/);
    words.forEach(word => {
      if (word.length > 2 && field.includes(word)) {
        score += 2;
      }
    });
  });

  // Boost score for filter matches
  if (filters?.position && resume.current_position?.toLowerCase().includes(filters.position.toLowerCase())) {
    score += 15;
  }

  if (filters?.skills && resume.skills) {
    const matchingSkills = filters.skills.filter((skill: string) => 
      resume.skills.some((resumeSkill: string) => 
        resumeSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    score += matchingSkills.length * 5;
  }

  if (filters?.location && resume.location?.toLowerCase().includes(filters.location.toLowerCase())) {
    score += 8;
  }

  // Experience match
  if (filters?.experienceYears) {
    const { min, max } = filters.experienceYears;
    if (min !== undefined && resume.experience_years >= min) {
      score += 5;
    }
    if (max !== undefined && resume.experience_years <= max) {
      score += 5;
    }
  }

  return Math.max(0, score);
}

/**
 * Get search suggestions based on existing data
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from("resume_summaries")
    .select("current_position, skills")
    .ilike("current_position", `%${query}%`)
    .limit(10);

  if (error || !data) return [];

  const suggestions = new Set<string>();
  
  data.forEach(resume => {
    if (resume.current_position) {
      suggestions.add(resume.current_position);
    }
    if (resume.skills) {
      resume.skills.forEach((skill: string) => {
        if (skill.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(skill);
        }
      });
    }
  });

  return Array.from(suggestions).slice(0, 10);
}
