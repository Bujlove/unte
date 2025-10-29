import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSearchEmbedding, cosineSimilarity } from "@/lib/deepseek/embeddings";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requirements } = await request.json();

    if (!requirements) {
      return NextResponse.json({ error: "Requirements are required" }, { status: 400 });
    }

    // Create search query from requirements
    const searchQuery = createSearchQuery(requirements);
    
    // Generate embedding for search
    const searchEmbedding = await generateSearchEmbedding(searchQuery);

    // Search resumes using vector similarity
    const { data: resumes, error } = await supabase
      .from("resumes")
      .select(`
        id,
        full_name,
        email,
        phone,
        location,
        last_position,
        last_company,
        experience_years,
        skills,
        parsed_data,
        embedding
      `)
      .not("embedding", "is", null)
      .limit(50);

    if (error) {
      console.error("Database search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Calculate similarity scores
    const results = (resumes || [])
      .map(resume => {
        if (!resume.embedding) return null;
        
        // Parse embedding vector
        const resumeEmbedding = JSON.parse(resume.embedding);
        const similarity = cosineSimilarity(searchEmbedding, resumeEmbedding);
        
        return {
          id: resume.id,
          fullName: resume.full_name,
          lastPosition: resume.last_position,
          lastCompany: resume.last_company,
          skills: resume.skills || [],
          experienceYears: resume.experience_years || 0,
          location: resume.location,
          relevanceScore: Math.round(similarity * 100),
          matchDetails: {
            matchingSkills: findMatchingSkills(resume.skills || [], requirements.skills || []),
            experienceMatch: checkExperienceMatch(resume.experience_years, requirements.experienceYears),
            locationMatch: checkLocationMatch(resume.location, requirements.location),
            summary: resume.parsed_data?.professional?.summary || ""
          }
        };
      })
      .filter(result => result !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    // Save search to history
    await supabase.from("searches").insert({
      user_id: user.id,
      query: searchQuery,
      filters: requirements,
      results_count: results.length,
    });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Semantic search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}

function createSearchQuery(requirements: any): string {
  const parts = [];
  
  if (requirements.position) {
    parts.push(`Должность: ${requirements.position}`);
  }
  
  if (requirements.skills && requirements.skills.length > 0) {
    parts.push(`Навыки: ${requirements.skills.join(", ")}`);
  }
  
  if (requirements.experienceYears) {
    const { min, max } = requirements.experienceYears;
    if (min && max) {
      parts.push(`Опыт работы: от ${min} до ${max} лет`);
    } else if (min) {
      parts.push(`Опыт работы: от ${min} лет`);
    } else if (max) {
      parts.push(`Опыт работы: до ${max} лет`);
    }
  }
  
  if (requirements.location) {
    parts.push(`Локация: ${requirements.location}`);
  }
  
  if (requirements.educationLevel) {
    parts.push(`Образование: ${requirements.educationLevel}`);
  }
  
  return parts.join(". ");
}

function findMatchingSkills(resumeSkills: string[], requiredSkills: string[]): string[] {
  return requiredSkills.filter(skill =>
    resumeSkills.some(resumeSkill =>
      resumeSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
}

function checkExperienceMatch(experienceYears: number, requirements: any): boolean {
  if (!requirements) return true;
  
  const { min, max } = requirements;
  if (min && experienceYears < min) return false;
  if (max && experienceYears > max) return false;
  
  return true;
}

function checkLocationMatch(location: string, requiredLocation: string): boolean {
  if (!requiredLocation) return true;
  return location?.toLowerCase().includes(requiredLocation.toLowerCase()) || false;
}