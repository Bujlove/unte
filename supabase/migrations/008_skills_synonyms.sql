-- Skills synonyms/ontology (canonical mapping)
create table if not exists public.skills_synonyms (
  id uuid primary key default gen_random_uuid(),
  canonical text not null,
  variants text[] not null default '{}',
  created_at timestamp with time zone default now()
);

create unique index if not exists idx_skills_synonyms_canonical on public.skills_synonyms(canonical);

-- Seed minimal synonyms (extend later)
insert into public.skills_synonyms (canonical, variants) values
  ('javascript', array['js','java script','ecmascript']),
  ('typescript', array['ts','type script']),
  ('react', array['reactjs','react.js']),
  ('node.js', array['node','nodejs','node js']),
  ('postgresql', array['postgres','psql']),
  ('aws', array['amazon web services'])
on conflict (canonical) do nothing;


