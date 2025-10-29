-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teams policies (for future use)
CREATE POLICY "Team members can view their team"
  ON teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their team"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid());

-- Resumes policies
-- Public: Anyone can insert resumes (for candidate uploads)
CREATE POLICY "Anyone can upload resumes"
  ON resumes FOR INSERT
  WITH CHECK (true);

-- Authenticated recruiters can view active resumes
CREATE POLICY "Recruiters can view active resumes"
  ON resumes FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

-- Admins can view all resumes
CREATE POLICY "Admins can view all resumes"
  ON resumes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow updates by upload token (for candidates to update their resume)
CREATE POLICY "Resume owners can update via token"
  ON resumes FOR UPDATE
  USING (true); -- Token validation happens in application layer

-- Admins can update resumes
CREATE POLICY "Admins can update resumes"
  ON resumes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Searches policies
CREATE POLICY "Users can view own searches"
  ON searches FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own searches"
  ON searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own searches"
  ON searches FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own searches"
  ON searches FOR DELETE
  USING (user_id = auth.uid());

-- Search results policies
CREATE POLICY "Users can view own search results"
  ON search_results FOR SELECT
  USING (
    search_id IN (
      SELECT id FROM searches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own search results"
  ON search_results FOR INSERT
  WITH CHECK (
    search_id IN (
      SELECT id FROM searches WHERE user_id = auth.uid()
    )
  );

-- Saved candidates policies
CREATE POLICY "Users can view own saved candidates"
  ON saved_candidates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved candidates"
  ON saved_candidates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved candidates"
  ON saved_candidates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved candidates"
  ON saved_candidates FOR DELETE
  USING (user_id = auth.uid());

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can do everything (bypasses RLS)
-- This is used for server-side operations

