
-- Enable rate limiting on sensitive endpoints using Supabase's built-in features
-- This uses PostgreSQL's pg_cron extension for cleanup

-- Create rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user_id
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_tracking(identifier, endpoint, window_start);

-- Enable RLS
ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Rate limit check function
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO v_count
  FROM rate_limit_tracking
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- If under limit, increment counter
  IF v_count < p_max_requests THEN
    INSERT INTO rate_limit_tracking (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Cleanup old rate limit records (run daily)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE window_start < NOW() - INTERVAL '1 day';
END;
$$;

-- Note: To enable automatic cleanup, you need to install pg_cron extension
-- Then run: SELECT cron.schedule('cleanup-rate-limits', '0 2 * * *', 'SELECT cleanup_rate_limits()');
