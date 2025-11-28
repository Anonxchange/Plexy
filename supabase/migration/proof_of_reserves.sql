
-- Merkle tree snapshots
CREATE TABLE IF NOT EXISTS reserve_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date TIMESTAMPTZ NOT NULL,
  merkle_root TEXT NOT NULL,
  total_users INTEGER NOT NULL,
  attestation_url TEXT,
  auditor_name TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_date ON reserve_snapshots(snapshot_date);

-- User balances in merkle tree
CREATE TABLE IF NOT EXISTS reserve_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES reserve_snapshots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_symbol TEXT NOT NULL,
  balance_hash TEXT NOT NULL,
  merkle_proof JSONB NOT NULL,
  leaf_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(snapshot_id, user_id, crypto_symbol)
);

CREATE INDEX idx_reserve_proofs_snapshot ON reserve_proofs(snapshot_id);
CREATE INDEX idx_reserve_proofs_user ON reserve_proofs(user_id);

-- Platform reserves (cold + hot)
CREATE TABLE IF NOT EXISTS total_reserves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_id UUID NOT NULL REFERENCES reserve_snapshots(id) ON DELETE CASCADE,
  crypto_symbol TEXT NOT NULL,
  hot_wallet_balance DECIMAL(20, 8) NOT NULL,
  cold_wallet_balance DECIMAL(20, 8) NOT NULL,
  total_balance DECIMAL(20, 8) NOT NULL,
  total_user_balances DECIMAL(20, 8) NOT NULL,
  reserve_ratio DECIMAL(5, 2) NOT NULL, -- Should be >= 100%
  proof_address TEXT,
  proof_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_total_reserves_snapshot ON total_reserves(snapshot_id);

-- Enable RLS
ALTER TABLE reserve_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserve_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE total_reserves ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view published snapshots"
  ON reserve_snapshots FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Users can view their own proofs"
  ON reserve_proofs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM reserve_snapshots
      WHERE reserve_snapshots.id = reserve_proofs.snapshot_id
      AND reserve_snapshots.is_published = true
    )
  );

CREATE POLICY "Anyone can view published reserves"
  ON total_reserves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reserve_snapshots
      WHERE reserve_snapshots.id = total_reserves.snapshot_id
      AND reserve_snapshots.is_published = true
    )
  );

-- Admins can manage
CREATE POLICY "Admins can manage snapshots"
  ON reserve_snapshots FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
