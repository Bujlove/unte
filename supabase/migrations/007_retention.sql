-- Purge expired resumes helper

CREATE OR REPLACE FUNCTION public.purge_expired_resumes()
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.resumes r
  WHERE r.expires_at IS NOT NULL AND r.expires_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: schedule via Supabase cron or external scheduler to run daily
-- SELECT public.purge_expired_resumes();


