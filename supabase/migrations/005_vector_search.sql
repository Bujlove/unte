-- Vector search RPC for resumes using pgvector
-- Creates a stable SQL function to fetch top-K nearest resumes by embedding

CREATE OR REPLACE FUNCTION public.match_resumes(
  query_embedding vector(1536),
  match_count integer DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  location text,
  last_position text,
  last_company text,
  experience_years integer,
  skills text[],
  embedding vector(1536),
  similarity double precision
) AS $$
  SELECT
    r.id,
    r.full_name,
    r.email,
    r.phone,
    r.location,
    r.last_position,
    r.last_company,
    r.experience_years,
    COALESCE(
      ARRAY(
        SELECT jsonb_array_elements_text(
          CASE
            WHEN r.skills IS NULL THEN '[]'::jsonb
            WHEN pg_typeof(r.skills)::text = 'jsonb' THEN (r.skills)::jsonb
            ELSE to_jsonb(r.skills)
          END
        )
      ),
      ARRAY[]::text[]
    ) AS skills,
    r.embedding,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM public.resumes r
  WHERE r.embedding IS NOT NULL
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- Optional: grant execute to anon/authenticated roles as needed
-- GRANT EXECUTE ON FUNCTION public.match_resumes(vector, integer) TO anon, authenticated;


