import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSearchEmbedding, cosineSimilarity } from "@/lib/jina/embeddings";
import { openai } from "@/lib/openai/client";

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

    // Try DB-side vector search via RPC (pgvector); fallback to in-memory cosine if RPC not available
    let results: any[] = [];
    try {
      const { data: matches, error: matchError } = await supabase.rpc('match_resumes', {
        query_embedding: searchEmbedding as unknown as number[],
        match_count: 20,
      });
      if (matchError) throw matchError;
      let base = (matches || []).map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        current_position: r.last_position,
        current_company: r.last_company,
        skills: r.skills || [],
        experience_years: r.experience_years || 0,
        location: r.location,
        score: Math.round((r.similarity || 0) * 100),
      }));
      // Apply smart filters
      base = base.filter((c: any) => {
        const locOk = requirements.location ? (c.location || '').toLowerCase().includes(String(requirements.location).toLowerCase()) : true;
        const exp = c.experience_years || 0;
        const expOk = requirements.experienceYears ? (
          (requirements.experienceYears.min ? exp >= requirements.experienceYears.min : true) &&
          (requirements.experienceYears.max ? exp <= requirements.experienceYears.max : true)
        ) : true;
        const skillsReq: string[] = Array.isArray(requirements.skills) ? requirements.skills : [];
        const skillsOk = skillsReq.length > 0 ? skillsReq.every(s => (c.skills || []).some((t:string)=>String(t).toLowerCase().includes(String(s).toLowerCase()))) : true;
        return locOk && expOk && skillsOk;
      });
      results = base;
    } catch (e) {
      // Fallback: fetch limited set and compute similarity locally
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
        .limit(100);

      if (error) {
        console.error("Database search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
      }

      results = (resumes || [])
        .map((resume: any) => {
          if (!resume.embedding) return null;
          const resumeEmbedding = resume.embedding as unknown as number[];
          const similarity = cosineSimilarity(searchEmbedding, resumeEmbedding);
          return {
            id: resume.id,
            full_name: resume.full_name,
            current_position: resume.last_position,
            current_company: resume.last_company,
            skills: resume.skills || [],
            experience_years: resume.experience_years || 0,
            location: resume.location,
            score: Math.round(similarity * 100),
          };
        })
        .filter((result: any) => result !== null)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 20);
    }

    // Save search to history
    await supabase.from("searches").insert({
      user_id: user.id,
      query: searchQuery,
      filters: requirements,
      results_count: results.length,
    });

    // Optional rerank with OpenAI if key present
    let finalResults = results;
    if (process.env.OPENAI_API_KEY && results.length > 0) {
      try {
        const top = results.slice(0, 20);
        const prompt = `Требования: ${JSON.stringify(requirements)}\nКандидаты:\n${top.map((c:any)=>`id:${c.id}; name:${c.full_name}; pos:${c.current_position}; skills:${(c.skills||[]).slice(0,10).join(', ')}; exp:${c.experience_years}; loc:${c.location}`).join('\n')}\nВерни ТОЛЬКО JSON массива вида [{"id":"...","score":0..100,"reasons":"..."}]`;
        const resp = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Ты оцениваешь соответствие кандидатов требованиям; отвечай только JSON." },
            { role: "user", content: prompt },
          ],
        });
        const content = resp.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const scoreMap = new Map<string, number>();
        if (Array.isArray(parsed)) {
          parsed.forEach((r:any)=> scoreMap.set(String(r.id), Number(r.score)||0));
        } else if (Array.isArray(parsed.results)) {
          parsed.results.forEach((r:any)=> scoreMap.set(String(r.id), Number(r.score)||0));
        }
        finalResults = top
          .map((r:any)=> ({ ...r, score: Math.max(r.score || 0, Math.round(scoreMap.get(r.id) || 0)) }))
          .sort((a:any,b:any)=> b.score - a.score);
      } catch {}
    }

    return NextResponse.json({ success: true, results: finalResults, count: finalResults.length });
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