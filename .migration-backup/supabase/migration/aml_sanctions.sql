
-- Sanctions lists
CREATE TABLE IF NOT EXISTS sanctions_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_name TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT, -- individual, organization
  country TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  identifiers JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sanctions_entity ON sanctions_lists(entity_name);
CREATE INDEX idx_sanctions_country ON sanctions_lists(country);

-- PEP (Politically Exposed Persons) screening
CREATE TABLE IF NOT EXISTS pep_screening (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pep BOOLEAN DEFAULT false,
  pep_category TEXT, -- domestic, foreign, international_org
  screening_date TIMESTAMPTZ DEFAULT NOW(),
  next_review_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pep_user ON pep_screening(user_id);
CREATE INDEX idx_pep_status ON pep_screening(is_pep);

-- Structured transaction monitoring
CREATE TABLE IF NOT EXISTS structured_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  total_amount DECIMAL(20, 8) DEFAULT 0,
  suspicious BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_structured_user ON structured_deposits(user_id);
CREATE INDEX idx_structured_suspicious ON structured_deposits(suspicious);

-- Chain analysis results
CREATE TABLE IF NOT EXISTS chain_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  crypto_symbol TEXT NOT NULL,
  risk_score INTEGER, -- 0-100
  risk_category TEXT, -- low, medium, high, severe
  exposure_to TEXT[], -- Array of risk types: ['mixer', 'darknet', 'ransomware']
  analysis_provider TEXT, -- 'chainalysis', 'elliptic', etc.
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(address, crypto_symbol)
);

CREATE INDEX idx_chain_analysis_address ON chain_analysis(address);
CREATE INDEX idx_chain_analysis_risk ON chain_analysis(risk_score);

-- Enable RLS
ALTER TABLE sanctions_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pep_screening ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_analysis ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage sanctions"
  ON sanctions_lists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view PEP screening"
  ON pep_screening FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view structured deposits"
  ON structured_deposits FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view chain analysis"
  ON chain_analysis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
