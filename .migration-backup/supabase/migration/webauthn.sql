
-- WebAuthn credentials table for hardware security keys
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  device_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- Enable RLS
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own credentials"
  ON webauthn_credentials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON webauthn_credentials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON webauthn_credentials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
