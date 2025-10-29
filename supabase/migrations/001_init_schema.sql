-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Teams table (prepared for future use)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  company_size TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'recruiter' CHECK (role IN ('recruiter', 'admin')),
  subscription_type TEXT DEFAULT 'trial' CHECK (subscription_type IN ('trial', 'start', 'pro')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  searches_count INTEGER DEFAULT 0,
  searches_limit INTEGER DEFAULT 10,
  team_id UUID REFERENCES teams(id),
  email_verified BOOLEAN DEFAULT FALSE,
  email_notifications JSONB DEFAULT '{"new_candidates": true, "weekly_digest": true}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resumes table with vector embeddings
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- File metadata
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Contact information
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  
  -- Parsed data
  parsed_data JSONB, -- Full parsed structure
  skills TEXT[], -- Array of skills for quick search
  experience_years INTEGER,
  last_position TEXT,
  last_company TEXT,
  education_level TEXT,
  languages JSONB,
  salary_expectation JSONB,
  
  -- Vector embeddings for semantic search
  embedding vector(1536), -- Main embedding
  summary_embedding vector(1536), -- Summary embedding
  
  -- Status and metadata
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'active', 'archived')),
  quality_score FLOAT CHECK (quality_score >= 0 AND quality_score <= 100),
  upload_token TEXT UNIQUE,
  consent_given BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '180 days'),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Searches table
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  is_template BOOLEAN DEFAULT FALSE,
  template_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search results table
CREATE TABLE search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  relevance_score FLOAT,
  match_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved candidates table
CREATE TABLE saved_candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  notes TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interview', 'rejected', 'hired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resume_id)
);

-- Payments table (prepared for YooKassa integration)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'RUB',
  status TEXT,
  payment_method TEXT,
  external_id TEXT, -- YooKassa payment ID
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_type, subscription_status);

CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_email ON resumes(email);
CREATE INDEX idx_resumes_phone ON resumes(phone);
CREATE INDEX idx_resumes_skills ON resumes USING GIN (skills);
CREATE INDEX idx_resumes_experience ON resumes(experience_years);
CREATE INDEX idx_resumes_expires_at ON resumes(expires_at);

-- Vector search indexes (using ivfflat for cosine similarity)
-- Note: These need to be created after data is inserted
-- CREATE INDEX idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_resumes_summary_embedding ON resumes USING ivfflat (summary_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_searches_user ON searches(user_id);
CREATE INDEX idx_searches_created ON searches(created_at DESC);

CREATE INDEX idx_search_results_search ON search_results(search_id);
CREATE INDEX idx_search_results_resume ON search_results(resume_id);
CREATE INDEX idx_search_results_score ON search_results(relevance_score DESC);

CREATE INDEX idx_saved_candidates_user ON saved_candidates(user_id);
CREATE INDEX idx_saved_candidates_resume ON saved_candidates(resume_id);
CREATE INDEX idx_saved_candidates_status ON saved_candidates(status);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_external_id ON payments(external_id);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Add foreign key for team owner after profiles table is created
ALTER TABLE teams ADD CONSTRAINT fk_teams_owner FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Comments for documentation
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE resumes IS 'Parsed resumes with vector embeddings for semantic search';
COMMENT ON TABLE searches IS 'User search queries and templates';
COMMENT ON TABLE saved_candidates IS 'Recruiters saved candidates';
COMMENT ON TABLE audit_logs IS 'System audit trail for important actions';

