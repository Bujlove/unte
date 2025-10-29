-- Safe RLS policies with IF NOT EXISTS checks
-- This migration can be run multiple times safely

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Anyone can read resumes" ON resumes;
DROP POLICY IF EXISTS "Anyone can insert resumes" ON resumes;
DROP POLICY IF EXISTS "Anyone can update resumes" ON resumes;
DROP POLICY IF EXISTS "Anyone can delete resumes" ON resumes;

DROP POLICY IF EXISTS "Users can view own searches" ON searches;
DROP POLICY IF EXISTS "Users can insert own searches" ON searches;
DROP POLICY IF EXISTS "Users can update own searches" ON searches;
DROP POLICY IF EXISTS "Users can delete own searches" ON searches;

DROP POLICY IF EXISTS "Users can view own search results" ON search_results;
DROP POLICY IF EXISTS "Users can insert own search results" ON search_results;
DROP POLICY IF EXISTS "Users can update own search results" ON search_results;
DROP POLICY IF EXISTS "Users can delete own search results" ON search_results;

DROP POLICY IF EXISTS "Users can view own saved candidates" ON saved_candidates;
DROP POLICY IF EXISTS "Users can insert own saved candidates" ON saved_candidates;
DROP POLICY IF EXISTS "Users can update own saved candidates" ON saved_candidates;
DROP POLICY IF EXISTS "Users can delete own saved candidates" ON saved_candidates;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Team members can view team" ON teams;
DROP POLICY IF EXISTS "Team owners can manage team" ON teams;

DROP POLICY IF EXISTS "Anyone can read resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can insert resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can update resume summaries" ON resume_summaries;
DROP POLICY IF EXISTS "Anyone can delete resume summaries" ON resume_summaries;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Resumes policies (anonymous access)
CREATE POLICY "Anyone can read resumes" ON resumes
    FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can insert resumes" ON resumes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update resumes" ON resumes
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete resumes" ON resumes
    FOR DELETE USING (true);

-- Searches policies
CREATE POLICY "Users can view own searches" ON searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches" ON searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own searches" ON searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own searches" ON searches
    FOR DELETE USING (auth.uid() = user_id);

-- Search results policies
CREATE POLICY "Users can view own search results" ON search_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM searches 
            WHERE searches.id = search_results.search_id 
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own search results" ON search_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM searches 
            WHERE searches.id = search_results.search_id 
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own search results" ON search_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM searches 
            WHERE searches.id = search_results.search_id 
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own search results" ON search_results
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM searches 
            WHERE searches.id = search_results.search_id 
            AND searches.user_id = auth.uid()
        )
    );

-- Saved candidates policies
CREATE POLICY "Users can view own saved candidates" ON saved_candidates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved candidates" ON saved_candidates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved candidates" ON saved_candidates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved candidates" ON saved_candidates
    FOR DELETE USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Teams policies
CREATE POLICY "Team members can view team" ON teams
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can manage team" ON teams
    FOR ALL USING (auth.uid() = owner_id);

-- Resume summaries policies (anonymous access)
CREATE POLICY "Anyone can read resume summaries" ON resume_summaries
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert resume summaries" ON resume_summaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update resume summaries" ON resume_summaries
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete resume summaries" ON resume_summaries
    FOR DELETE USING (true);
