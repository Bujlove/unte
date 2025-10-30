import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processChatMessage, extractSearchRequirements, formatChatResponse } from "@/lib/deepseek/chat";

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

    const { data: canSearch } = await supabase.rpc("can_user_search", {
      p_user_id: user.id,
    });
    if (!canSearch) {
      return NextResponse.json(
        { error: "Search limit reached or subscription expired" },
        { status: 403 }
      );
    }

    const { messages, extractRequirements } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Process chat message
    const result = await processChatMessage(messages, extractRequirements);

    return NextResponse.json({
      success: true,
      response: formatChatResponse(result.response),
      requirements: result.requirements,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process chat" },
      { status: 500 }
    );
  }
}

