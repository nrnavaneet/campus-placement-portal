-- Performance Optimization Script for Campus Placement Portal
-- Run this AFTER running setup-database-production.sql
-- This script adds additional optimizations without duplicating existing structures
-- 
-- SAFETY GUARANTEE: This script contains NO destructive operations
-- - No DROP statements (except in comments)
-- - No DELETE statements  
-- - No TRUNCATE statements
-- - Only uses CREATE IF NOT EXISTS and safe operations
-- - Will not delete or modify existing data

-- =============================================================================
-- ADVANCED PERFORMANCE INDEXES (Not in setup-database-production.sql)
-- =============================================================================

-- Composite indexes for complex admin queries
CREATE INDEX IF NOT EXISTS idx_grievances_status_created 
ON grievance_reports(status, created_at DESC) 
WHERE status IN ('submitted', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_student_placement_composite 
ON student_details(branch, (placement_status->>'accepted_offers')::int) 
WHERE (placement_status->>'accepted_offers')::int > 0;

CREATE INDEX IF NOT EXISTS idx_jobs_active_deadline 
ON jobs(status, application_deadline) 
WHERE status = 'active' AND application_deadline IS NOT NULL;

-- GIN index for full-text search on job descriptions
CREATE INDEX IF NOT EXISTS idx_jobs_description_gin 
ON jobs USING gin(to_tsvector('english', description));

-- Partial index for pending applications
CREATE INDEX IF NOT EXISTS idx_applications_pending 
ON application_status(applied_at DESC) 
WHERE current_stage IN ('applied', 'under_review');

-- =============================================================================
-- MATERIALIZED VIEWS FOR FAST DASHBOARD QUERIES
-- =============================================================================

-- Dashboard statistics materialized view (refreshed periodically)
-- Note: Only creates if it doesn't exist, never drops existing data
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats_fast AS
SELECT 
  (SELECT COUNT(*) FROM student_details) as total_students,
  (SELECT COUNT(*) FROM jobs WHERE status = 'active') as active_jobs,
  (SELECT COUNT(*) FROM application_status) as total_applications,
  (SELECT COUNT(*) FROM grievance_reports WHERE status = 'submitted') as pending_grievances,
  (SELECT COUNT(*) FROM student_details WHERE (placement_status->>'accepted_offers')::int > 0) as placed_students,
  (SELECT 
    COALESCE(ROUND(AVG((placement_status->>'max_ctc')::numeric) / 100000, 1), 0) 
    FROM student_details 
    WHERE (placement_status->>'max_ctc')::numeric > 0
  ) as average_package,
  CURRENT_TIMESTAMP as last_updated;

-- Create unique index for materialized view
CREATE UNIQUE INDEX idx_dashboard_stats_unique ON dashboard_stats_fast(last_updated);

-- Grant permissions
GRANT SELECT ON dashboard_stats_fast TO authenticated;
GRANT SELECT ON dashboard_stats_fast TO anon;

-- =============================================================================
-- PERFORMANCE FUNCTIONS
-- =============================================================================

-- Function to refresh dashboard stats efficiently
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TIMESTAMP AS $$
DECLARE
    refresh_time TIMESTAMP;
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_fast;
    SELECT last_updated INTO refresh_time FROM dashboard_stats_fast LIMIT 1;
    RETURN refresh_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get branch-wise placement statistics
CREATE OR REPLACE FUNCTION get_branch_placement_stats()
RETURNS TABLE(
    branch_name TEXT,
    total_students BIGINT,
    placed_students BIGINT,
    placement_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sd.branch::TEXT as branch_name,
        COUNT(*) as total_students,
        COUNT(*) FILTER (WHERE (sd.placement_status->>'accepted_offers')::int > 0) as placed_students,
        ROUND(
            COUNT(*) FILTER (WHERE (sd.placement_status->>'accepted_offers')::int > 0)::numeric / 
            COUNT(*)::numeric * 100, 2
        ) as placement_rate
    FROM student_details sd
    GROUP BY sd.branch
    ORDER BY placement_rate DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_branch_placement_stats() TO authenticated;

-- =============================================================================
-- AUTOMATED OPTIMIZATIONS
-- =============================================================================

-- Update table statistics for better query planning
ANALYZE student_details;
ANALYZE jobs;
ANALYZE application_status;
ANALYZE grievance_reports;

-- =============================================================================
-- ADDITIONAL PERFORMANCE CONFIGURATIONS
-- =============================================================================

-- Create a function to optimize table statistics
CREATE OR REPLACE FUNCTION optimize_table_stats()
RETURNS TEXT AS $$
BEGIN
    -- Update statistics on all tables
    ANALYZE student_details;
    ANALYZE jobs;
    ANALYZE application_status;
    ANALYZE grievance_reports;
    ANALYZE student_settings;
    
    -- Refresh materialized view
    PERFORM refresh_dashboard_stats();
    
    RETURN 'Statistics updated and materialized views refreshed at ' || CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION optimize_table_stats() TO authenticated;

-- =============================================================================
-- QUERY PERFORMANCE MONITORING
-- =============================================================================

-- Create a view to monitor slow queries (if pg_stat_statements is available)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC
LIMIT 20;

-- Grant permissions
GRANT SELECT ON slow_queries TO authenticated;

-- =============================================================================
-- NOTES FOR DATABASE ADMINISTRATORS
-- =============================================================================

/*
PERFORMANCE RECOMMENDATIONS:

1. Run this script AFTER setup-database-production.sql
2. Monitor query performance using the slow_queries view
3. Refresh dashboard stats periodically using: SELECT refresh_dashboard_stats();
4. Consider setting up automated statistics refresh in production
5. Monitor index usage with pg_stat_user_indexes
6. Adjust work_mem and shared_buffers based on your server capacity

SCHEDULED MAINTENANCE:
- Run optimize_table_stats() daily during low-usage hours
- Monitor materialized view freshness
- Check index fragmentation monthly

SCALING CONSIDERATIONS:
- Consider partitioning large tables by date if data grows significantly
- Implement connection pooling for high-concurrency scenarios  
- Use read replicas for reporting queries in production

*/