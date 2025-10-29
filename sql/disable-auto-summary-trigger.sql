-- Temporarily disable automatic resume summary creation triggers
-- This allows manual control over when summaries are created

DROP TRIGGER IF EXISTS trg_create_resume_summary ON resumes;
DROP TRIGGER IF EXISTS trg_update_resume_summary ON resumes;

-- You can re-enable them later if needed with:
-- CREATE TRIGGER trg_create_resume_summary
--     AFTER INSERT ON resumes
--     FOR EACH ROW EXECUTE FUNCTION create_resume_summary_from_parsed_data();
--
-- CREATE TRIGGER trg_update_resume_summary
--     AFTER UPDATE ON resumes
--     FOR EACH ROW EXECUTE FUNCTION update_resume_summary_from_parsed_data();
