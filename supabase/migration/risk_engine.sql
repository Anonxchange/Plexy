
-- Risk assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  crypto_symbol TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  blocked BOOLEAN DEFAULT false,
  requires_review BOOLEAN DEFAULT false,
  to_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_risk_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_blocked ON risk_assessments(blocked);
CREATE INDEX idx_risk_assessments_created_at ON risk_assessments(created_at);

-- Flagged addresses table
CREATE TABLE IF NOT EXISTS flagged_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  crypto_symbol TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  flagged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address, crypto_symbol)
);

CREATE INDEX idx_flagged_addresses_address ON flagged_addresses(address);
CREATE INDEX idx_flagged_addresses_crypto ON flagged_addresses(crypto_symbol);

-- Enable RLS
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_addresses ENABLE ROW LEVEL SECURITY;

-- Policies for risk_assessments (admin only)
CREATE POLICY "Admins can view all risk assessments"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Policies for flagged_addresses (admin only)
CREATE POLICY "Admins can manage flagged addresses"
  ON flagged_addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
