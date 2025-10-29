-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to check and expire resumes
CREATE OR REPLACE FUNCTION expire_old_resumes()
RETURNS void AS $$
BEGIN
  UPDATE resumes
  SET status = 'archived'
  WHERE expires_at < NOW() AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION search_resumes_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  full_name text,
  last_position text,
  last_company text,
  skills text[],
  experience_years int,
  location text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    resumes.id,
    resumes.full_name,
    resumes.last_position,
    resumes.last_company,
    resumes.skills,
    resumes.experience_years,
    resumes.location,
    1 - (resumes.embedding <=> query_embedding) AS similarity
  FROM resumes
  WHERE 
    resumes.status = 'active'
    AND resumes.embedding IS NOT NULL
    AND 1 - (resumes.embedding <=> query_embedding) > match_threshold
  ORDER BY resumes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check duplicate resumes by email or phone
CREATE OR REPLACE FUNCTION check_duplicate_resume(
  check_email text DEFAULT NULL,
  check_phone text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  upload_token text
) AS $$
BEGIN
  RETURN QUERY
  SELECT resumes.id, resumes.upload_token
  FROM resumes
  WHERE 
    (check_email IS NOT NULL AND resumes.email = check_email)
    OR (check_phone IS NOT NULL AND resumes.phone = check_phone)
    AND resumes.status IN ('processing', 'active')
  ORDER BY resumes.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log audit actions
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user search count
CREATE OR REPLACE FUNCTION increment_search_count(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET searches_count = searches_count + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can perform search (within limits)
CREATE OR REPLACE FUNCTION can_user_search(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if subscription is active
  IF v_profile.subscription_status != 'active' THEN
    RETURN false;
  END IF;
  
  -- Check trial expiration
  IF v_profile.subscription_type = 'trial' AND v_profile.trial_ends_at < NOW() THEN
    RETURN false;
  END IF;
  
  -- Check subscription expiration
  IF v_profile.subscription_type IN ('start', 'pro') 
     AND v_profile.subscription_end IS NOT NULL 
     AND v_profile.subscription_end < NOW() THEN
    RETURN false;
  END IF;
  
  -- Check search limit (unlimited for pro)
  IF v_profile.subscription_type != 'pro' 
     AND v_profile.searches_count >= v_profile.searches_limit THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get user subscription info
CREATE OR REPLACE FUNCTION get_subscription_info(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  v_result := jsonb_build_object(
    'subscription_type', v_profile.subscription_type,
    'subscription_status', v_profile.subscription_status,
    'searches_count', v_profile.searches_count,
    'searches_limit', v_profile.searches_limit,
    'searches_remaining', 
      CASE 
        WHEN v_profile.subscription_type = 'pro' THEN -1
        ELSE v_profile.searches_limit - v_profile.searches_count
      END,
    'trial_ends_at', v_profile.trial_ends_at,
    'subscription_end', v_profile.subscription_end,
    'can_search', can_user_search(p_user_id)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire old resumes (requires pg_cron extension)
-- This would need to be set up separately in Supabase dashboard
-- SELECT cron.schedule('expire-old-resumes', '0 0 * * *', 'SELECT expire_old_resumes();');

