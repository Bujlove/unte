-- Safe functions with IF NOT EXISTS checks
-- This migration can be run multiple times safely

-- Function to check if user can search
CREATE OR REPLACE FUNCTION can_user_search(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_profile profiles%ROWTYPE;
    current_time TIMESTAMPTZ := NOW();
BEGIN
    -- Get user profile
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = p_user_id;
    
    -- If no profile, user can't search
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if subscription is active
    IF user_profile.subscription_status != 'active' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if subscription has expired
    IF user_profile.subscription_end_date IS NOT NULL 
       AND user_profile.subscription_end_date < current_time THEN
        RETURN FALSE;
    END IF;
    
    -- Reset search count if it's a new day
    IF user_profile.last_search_reset::date < current_time::date THEN
        UPDATE profiles
        SET searches_used = 0, last_search_reset = current_time
        WHERE id = p_user_id;
        
        user_profile.searches_used := 0;
    END IF;
    
    -- Check if user has searches left
    RETURN user_profile.searches_used < user_profile.search_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for duplicate resumes
DROP FUNCTION IF EXISTS check_duplicate_resume(TEXT, TEXT);
CREATE OR REPLACE FUNCTION check_duplicate_resume(
    check_email TEXT DEFAULT NULL,
    check_phone TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    upload_token TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.upload_token, r.created_at
    FROM resumes r
    WHERE (check_email IS NOT NULL AND r.email = check_email)
       OR (check_phone IS NOT NULL AND r.phone = check_phone)
    ORDER BY r.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment search count
CREATE OR REPLACE FUNCTION increment_search_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET searches_used = searches_used + 1
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired resumes
CREATE OR REPLACE FUNCTION cleanup_expired_resumes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM resumes
    WHERE expires_at < NOW() AND status = 'active';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    INSERT INTO audit_logs (action, resource_type, details)
    VALUES ('cleanup_expired_resumes', 'resumes', 
            json_build_object('deleted_count', deleted_count));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
    total_searches INTEGER,
    searches_remaining INTEGER,
    saved_candidates INTEGER,
    subscription_type TEXT,
    subscription_status TEXT
) AS $$
DECLARE
    user_profile profiles%ROWTYPE;
    searches_count INTEGER;
    saved_count INTEGER;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Count searches
    SELECT COUNT(*) INTO searches_count
    FROM searches
    WHERE user_id = p_user_id;
    
    -- Count saved candidates
    SELECT COUNT(*) INTO saved_count
    FROM saved_candidates
    WHERE user_id = p_user_id;
    
    RETURN QUERY
    SELECT 
        searches_count,
        GREATEST(0, user_profile.search_limit - user_profile.searches_used),
        saved_count,
        user_profile.subscription_type,
        user_profile.subscription_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search resumes with vector similarity
CREATE OR REPLACE FUNCTION search_resumes_vector(
    query_embedding VECTOR(1536),
    similarity_threshold FLOAT DEFAULT 0.3,
    max_results INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    last_position TEXT,
    last_company TEXT,
    experience_years INTEGER,
    skills TEXT[],
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.full_name,
        r.email,
        r.phone,
        r.location,
        r.last_position,
        r.last_company,
        r.experience_years,
        r.skills,
        1 - (r.embedding <=> query_embedding) AS similarity_score
    FROM resumes r
    WHERE r.status = 'active'
      AND r.embedding IS NOT NULL
      AND 1 - (r.embedding <=> query_embedding) > similarity_threshold
    ORDER BY r.embedding <=> query_embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID DEFAULT NULL,
    p_action TEXT,
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        details, ip_address, user_agent
    ) VALUES (
        p_user_id, p_action, p_resource_type, p_resource_id,
        p_details, p_ip_address, p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user subscription
CREATE OR REPLACE FUNCTION update_user_subscription(
    p_user_id UUID,
    p_subscription_type TEXT,
    p_subscription_status TEXT DEFAULT 'active',
    p_subscription_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET 
        subscription_type = p_subscription_type,
        subscription_status = p_subscription_status,
        subscription_end_date = p_subscription_end_date,
        search_limit = CASE 
            WHEN p_subscription_type = 'free' THEN 10
            WHEN p_subscription_type = 'pro' THEN 100
            WHEN p_subscription_type = 'enterprise' THEN 1000
            ELSE search_limit
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Log subscription update
    PERFORM create_audit_log(
        p_user_id,
        'subscription_updated',
        'profiles',
        p_user_id,
        json_build_object(
            'subscription_type', p_subscription_type,
            'subscription_status', p_subscription_status,
            'subscription_end_date', p_subscription_end_date
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
