-- Add normalized_skills columns
alter table public.resumes add column if not exists normalized_skills text[] default null;
alter table public.resume_summaries add column if not exists normalized_skills text[] default null;


