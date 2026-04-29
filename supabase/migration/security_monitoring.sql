
-- Security alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON security_alerts(user_id);
CREATE INDEX idx_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_alerts_read ON security_alerts(is_read);

-- Geographic anomaly detection
CREATE TABLE IF NOT EXISTS login_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  is_anomaly BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_locations_user ON login_locations(user_id);
CREATE INDEX idx_login_locations_anomaly ON login_locations(is_anomaly);

-- Large withdrawal tracking
CREATE TABLE IF NOT EXISTS large_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES wallet_transactions(id),
  amount DECIMAL(20, 8) NOT NULL,
  crypto_symbol TEXT NOT NULL,
  requires_approval BOOLEAN DEFAULT true,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_large_withdrawals_user ON large_withdrawals(user_id);
CREATE INDEX idx_large_withdrawals_approval ON large_withdrawals(requires_approval);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE large_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own alerts"
  ON security_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their alerts"
  ON security_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their login locations"
  ON login_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view large withdrawals"
  ON large_withdrawals FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
    OR user_id = auth.uid()
  );
