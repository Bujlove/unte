import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchByRequirements } from "@/lib/deepseek/search";
import { SearchRequirements } from "@/lib/deepseek/chat";

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

    // TODO: Re-enable search limits after testing
    // const { data: canSearch } = await supabase.rpc("can_user_search", {
    //   p_user_id: user.id,
    // });
    // if (!canSearch) {
    //   return NextResponse.json(
    //     { error: "Search limit reached or subscription expired" },
    //     { status: 403 }
    //   );
    // }

    const { requirements, saveAsTemplate, templateName } = await request.json();

    if (!requirements || !requirements.searchQuery) {
      return NextResponse.json({ error: "Invalid search requirements" }, { status: 400 });
    }

    // Perform semantic search
    const results = await searchByRequirements(requirements as SearchRequirements);

    // Save search to database
    const { data: search } = await supabase
      .from("searches")
      .insert({
        user_id: user.id,
        query: requirements.searchQuery,
        filters: requirements,
        results_count: results.length,
        is_template: saveAsTemplate || false,
        template_name: templateName || null,
      })
      .select()
      .single();

    // Save search results
    if (search && results.length > 0) {
      const searchResults = results.map((result) => ({
        search_id: search.id,
        resume_id: result.id,
        relevance_score: result.relevanceScore / 100,
        match_details: result.matchDetails,
      }));

      await supabase.from("search_results").insert(searchResults);
    }

    // Increment search count
    await supabase.rpc("increment_search_count", {
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      results,
      searchId: search?.id,
      totalResults: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform search" },
      { status: 500 }
    );
  }
}

