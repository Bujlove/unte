import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { query, filters = {} } = await request.json();
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    
    // Build search query - get all active resumes first
    let searchQuery = supabase
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
        education_level,
        skills,
        languages,
        quality_score,
        parsed_data,
        created_at
      `)
      .eq("status", "active");

    // Add filters
    if (filters.experience_min) {
      searchQuery = searchQuery.gte("experience_years", filters.experience_min);
    }
    
    if (filters.experience_max) {
      searchQuery = searchQuery.lte("experience_years", filters.experience_max);
    }
    
    if (filters.location) {
      searchQuery = searchQuery.ilike("location", `%${filters.location}%`);
    }
    
    if (filters.skills && filters.skills.length > 0) {
      searchQuery = searchQuery.overlaps("skills", filters.skills);
    }

    // Add ordering
    searchQuery = searchQuery.order("quality_score", { ascending: false });
    searchQuery = searchQuery.order("created_at", { ascending: false });

    // Execute query
    const { data: resumes, error } = await searchQuery.limit(50);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    // Calculate relevance scores
    const results = resumes?.map(resume => {
      let relevanceScore = 0;
      const queryLower = query.toLowerCase();
      
      // Check name match
      if (resume.full_name?.toLowerCase().includes(queryLower)) {
        relevanceScore += 30;
      }
      
      // Check position match
      if (resume.last_position?.toLowerCase().includes(queryLower)) {
        relevanceScore += 25;
      }
      
      // Check company match
      if (resume.last_company?.toLowerCase().includes(queryLower)) {
        relevanceScore += 20;
      }
      
      // Check skills match
      if (resume.skills) {
        const matchingSkills = resume.skills.filter((skill: string) => 
          skill.toLowerCase().includes(queryLower)
        );
        relevanceScore += matchingSkills.length * 10; // Increased weight for skills
      }
      
      // Add quality score
      relevanceScore += (resume.quality_score || 0) * 0.2;
      
      return {
        ...resume,
        relevanceScore: Math.round(relevanceScore)
      };
    }).filter(resume => resume.relevanceScore > 0) || []; // Only include results with some relevance

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      success: true,
      query,
      results: results.slice(0, 20), // Limit to top 20 results
      total: results.length
    });

  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
