-- RPC: check_duplicate_resume and can_user_search

-- Returns possible duplicates by email or phone for resumes
CREATE OR REPLACE FUNCTION public.check_duplicate_resume(
  check_email text,
  check_phone text
)
RETURNS TABLE (
  id uuid,
  upload_token text
) AS $$
  SELECT r.id, r.upload_token
  FROM public.resumes r
  WHERE (check_email IS NOT NULL AND r.email = check_email)
     OR (check_phone IS NOT NULL AND r.phone = check_phone)
  LIMIT 5;
$$ LANGUAGE sql STABLE;

-- Checks if a user can perform a search based on subscription/limits
CREATE OR REPLACE FUNCTION public.can_user_search(
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_searches_count integer;
  v_searches_limit integer;
  v_subscription_status text;
BEGIN
  SELECT searches_count, searches_limit, subscription_status
  INTO v_searches_count, v_searches_limit, v_subscription_status
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_searches_count IS NULL OR v_searches_limit IS NULL THEN
    RETURN false;
  END IF;

  -- Allow if premium/enterprise OR remaining quota available
  IF v_subscription_status IN ('premium', 'enterprise') THEN
    RETURN true;
  END IF;

  RETURN v_searches_count < v_searches_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optional: GRANT EXECUTE as needed
-- GRANT EXECUTE ON FUNCTION public.check_duplicate_resume(text, text) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.can_user_search(uuid) TO authenticated;


