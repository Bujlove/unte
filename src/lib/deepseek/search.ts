import { generateSearchEmbedding } from "./embeddings";
import { createAdminClient } from "@/lib/supabase/server";
import { ResumeSearchResult, ResumeSearchFilters } from "@/types/resume";
import { SearchRequirements } from "./chat";

/**
 * Semantic search for candidates using vector embeddings
 */
export async function searchCandidates(
  query: string,
  filters?: ResumeSearchFilters,
  limit: number = 20
): Promise<ResumeSearchResult[]> {
  const supabase = await createAdminClient();

  // Generate embedding for search query
  const queryEmbedding = await generateSearchEmbedding(query);

  // Convert to pgvector format
  const embeddingVector = `[${queryEmbedding.join(",")}]`;

  // Build the query with filters
  let dbQuery = supabase.rpc("search_resumes_by_embedding", {
    query_embedding: embeddingVector,
    match_threshold: 0.5,
    match_count: limit * 2, // Get more results for filtering
  });

  // Get results
  const { data: searchResults, error } = await dbQuery;

  if (error) {
    console.error("Search error:", error);
    throw new Error("Failed to search candidates");
  }

  if (!searchResults || searchResults.length === 0) {
    return [];
  }

  // Apply additional filters
  let filteredResults = searchResults;

  if (filters?.skills && filters.skills.length > 0) {
    filteredResults = filteredResults.filter((resume: any) => {
      const resumeSkills = resume.skills || [];
      return filters.skills!.some((skill: string) =>
        resumeSkills.some((rs: string) => rs.toLowerCase().includes(skill.toLowerCase()))
      );
    });
  }

  if (filters?.experienceYears) {
    filteredResults = filteredResults.filter((resume: any) => {
      const exp = resume.experience_years || 0;
      if (filters.experienceYears!.min && exp < filters.experienceYears!.min) {
        return false;
      }
      if (filters.experienceYears!.max && exp > filters.experienceYears!.max) {
        return false;
      }
      return true;
    });
  }

  if (filters?.location) {
    filteredResults = filteredResults.filter((resume: any) => {
      return resume.location?.toLowerCase().includes(filters.location!.toLowerCase());
    });
  }

  // Convert to ResumeSearchResult format
  const results: ResumeSearchResult[] = filteredResults.slice(0, limit).map((resume: any) => ({
    id: resume.id,
    fullName: resume.full_name || "Не указано",
    lastPosition: resume.last_position || "Не указано",
    lastCompany: resume.last_company || "Не указано",
    skills: resume.skills || [],
    experienceYears: resume.experience_years || 0,
    location: resume.location || "Не указано",
    relevanceScore: Math.round((resume.similarity || 0) * 100),
    matchDetails: {
      matchingSkills: filters?.skills
        ? resume.skills?.filter((s: string) =>
            filters.skills!.some((fs: string) => s.toLowerCase().includes(fs.toLowerCase()))
          ) || []
        : [],
      experienceMatch: filters?.experienceYears
        ? (resume.experience_years || 0) >= (filters.experienceYears.min || 0)
        : true,
      locationMatch: filters?.location
        ? resume.location?.toLowerCase().includes(filters.location.toLowerCase()) || false
        : true,
      summary: `Соответствие: ${Math.round((resume.similarity || 0) * 100)}%`,
    },
  }));

  return results;
}

/**
 * Search candidates using requirements from chat
 */
export async function searchByRequirements(
  requirements: SearchRequirements,
  limit: number = 20
): Promise<ResumeSearchResult[]> {
  const filters: ResumeSearchFilters = {
    skills: requirements.skills,
    experienceYears: requirements.experienceYears,
    location: requirements.location,
    educationLevel: requirements.educationLevel,
  };

  return searchCandidates(requirements.searchQuery, filters, limit);
}

/**
 * Get candidate details by ID
 */
export async function getCandidateById(candidateId: string) {
  const supabase = await createAdminClient();

  const { data: resume, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", candidateId)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("Error fetching candidate:", error);
    throw new Error("Failed to fetch candidate");
  }

  return resume;
}

/**
 * Calculate match score between requirements and candidate
 */
export function calculateMatchScore(
  candidate: any,
  requirements: SearchRequirements
): number {
  let score = 0;
  let maxScore = 0;

  // Skills match (40 points)
  maxScore += 40;
  if (requirements.skills.length > 0) {
    const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
    const matchingSkills = requirements.skills.filter((skill: string) =>
      candidateSkills.some((cs: string) => cs.includes(skill.toLowerCase()))
    );
    score += (matchingSkills.length / requirements.skills.length) * 40;
  }

  // Experience match (30 points)
  maxScore += 30;
  if (requirements.experienceYears) {
    const candidateExp = candidate.experience_years || 0;
    const minExp = requirements.experienceYears.min || 0;
    const maxExp = requirements.experienceYears.max || 100;

    if (candidateExp >= minExp && candidateExp <= maxExp) {
      score += 30;
    } else if (candidateExp >= minExp) {
      score += 20;
    } else {
      score += 10;
    }
  }

  // Location match (15 points)
  maxScore += 15;
  if (requirements.location) {
    if (
      candidate.location?.toLowerCase().includes(requirements.location.toLowerCase())
    ) {
      score += 15;
    }
  } else {
    score += 15; // If location not required, give full points
  }

  // Education match (15 points)
  maxScore += 15;
  if (requirements.educationLevel) {
    if (
      candidate.education_level?.toLowerCase().includes(requirements.educationLevel.toLowerCase())
    ) {
      score += 15;
    }
  } else {
    score += 15; // If education not required, give full points
  }

  return Math.round((score / maxScore) * 100);
}

/**
 * Get similar candidates based on a candidate ID
 */
export async function getSimilarCandidates(
  candidateId: string,
  limit: number = 5
): Promise<ResumeSearchResult[]> {
  const supabase = await createAdminClient();

  // Get the candidate's embedding
  const { data: candidate } = await supabase
    .from("resumes")
    .select("embedding, last_position")
    .eq("id", candidateId)
    .single();

  if (!candidate || !candidate.embedding) {
    return [];
  }

  // Search for similar candidates
  return searchCandidates(
    candidate.last_position || "Similar candidate",
    undefined,
    limit
  );
}

