
-- User security settings
CREATE TABLE IF NOT EXISTS user_security_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whitelist_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their security settings"
  ON user_security_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Withdrawal whitelist
CREATE TABLE IF NOT EXISTS withdrawal_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crypto_symbol TEXT NOT NULL,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  activation_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  UNIQUE(user_id, crypto_symbol, address)
);

CREATE INDEX idx_whitelist_user ON withdrawal_whitelist(user_id);
CREATE INDEX idx_whitelist_status ON withdrawal_whitelist(status);
CREATE INDEX idx_whitelist_activation ON withdrawal_whitelist(activation_time);

-- Enable RLS
ALTER TABLE withdrawal_whitelist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own whitelist"
  ON withdrawal_whitelist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to whitelist"
  ON withdrawal_whitelist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from whitelist"
  ON withdrawal_whitelist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to auto-activate after 24 hours
CREATE OR REPLACE FUNCTION activate_whitelist_addresses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE withdrawal_whitelist
  SET 
    status = 'active',
    activated_at = NOW()
  WHERE 
    status = 'pending'
    AND activation_time <= NOW();
END;
$$;
