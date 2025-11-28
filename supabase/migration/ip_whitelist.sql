
-- IP Whitelist for sensitive operations
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ip_address)
);

CREATE INDEX idx_ip_whitelist_user ON ip_whitelist(user_id);
CREATE INDEX idx_ip_whitelist_status ON ip_whitelist(status);

-- IP Whitelist Settings
CREATE TABLE IF NOT EXISTS ip_whitelist_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  require_for_withdrawals BOOLEAN DEFAULT true,
  require_for_trades BOOLEAN DEFAULT false,
  require_for_api BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device Fingerprinting
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  trusted BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, fingerprint_hash)
);

CREATE INDEX idx_device_fingerprints_user ON device_fingerprints(user_id);
CREATE INDEX idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);

-- Suspicious Activity Log
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address TEXT,
  device_fingerprint TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  action_taken TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suspicious_activities_user ON suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_severity ON suspicious_activities(severity);
CREATE INDEX idx_suspicious_activities_resolved ON suspicious_activities(resolved);

-- Enable RLS
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_whitelist_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their IP whitelist"
  ON ip_whitelist FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their IP whitelist settings"
  ON ip_whitelist_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their device fingerprints"
  ON device_fingerprints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their suspicious activities"
  ON suspicious_activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if IP is whitelisted
CREATE OR REPLACE FUNCTION is_ip_whitelisted(
  p_user_id UUID,
  p_ip_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_whitelisted BOOLEAN;
BEGIN
  -- Check if IP whitelisting is enabled
  SELECT enabled INTO v_enabled
  FROM ip_whitelist_settings
  WHERE user_id = p_user_id;
  
  -- If not enabled, allow all IPs
  IF v_enabled IS NULL OR v_enabled = false THEN
    RETURN TRUE;
  END IF;
  
  -- Check if IP is in whitelist
  SELECT EXISTS (
    SELECT 1 FROM ip_whitelist
    WHERE user_id = p_user_id
    AND ip_address = p_ip_address
    AND status = 'active'
  ) INTO v_whitelisted;
  
  -- Update last used time if whitelisted
  IF v_whitelisted THEN
    UPDATE ip_whitelist
    SET last_used_at = NOW()
    WHERE user_id = p_user_id
    AND ip_address = p_ip_address;
  END IF;
  
  RETURN v_whitelisted;
END;
$$;
