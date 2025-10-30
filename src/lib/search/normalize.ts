import { createAdminClient } from "@/lib/supabase/server";

let cache: Map<string, string> | null = null;

async function loadSynonyms(): Promise<Map<string, string>> {
  if (cache) return cache;
  const supabase = await createAdminClient();
  const { data } = await supabase.from("skills_synonyms").select("term, canonical");
  const map = new Map<string, string>();
  (data || []).forEach((row: any) => {
    map.set(String(row.term).toLowerCase().trim(), String(row.canonical).toLowerCase().trim());
  });
  cache = map;
  return map;
}

export async function normalizeSkills(raw: string[] | null | undefined): Promise<string[] | null> {
  if (!raw || raw.length === 0) return null;
  const map = await loadSynonyms();
  const norm = raw
    .map((s) => String(s || "").toLowerCase().trim())
    .filter(Boolean)
    .map((s) => map.get(s) || s);
  const unique = Array.from(new Set(norm));
  return unique.length > 0 ? unique : null;
}


