-- Skills synonyms/ontology (canonical mapping)
create table if not exists public.skills_synonyms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  canonical text not null,
  weight numeric default 1.0,
  created_at timestamp with time zone default now()
);

-- Seed minimal synonyms (extend later)
insert into public.skills_synonyms (term, canonical, weight) values
  ('js', 'javascript', 1.0),
  ('typescript', 'typescript', 1.0),
  ('react.js', 'react', 1.0),
  ('reactjs', 'react', 1.0),
  ('node', 'node.js', 1.0),
  ('postgres', 'postgresql', 1.0),
  ('pgsql', 'postgresql', 1.0),
  ('docker', 'docker', 1.0),
  ('k8s', 'kubernetes', 1.0),
  ('aws', 'aws', 1.0)
on conflict (term) do nothing;


