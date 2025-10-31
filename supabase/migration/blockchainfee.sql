-- Add blockchain network fee tracking
CREATE TABLE IF NOT EXISTS public.blockchain_network_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crypto_symbol TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'mainnet',
  fee_type TEXT NOT NULL CHECK (fee_type IN ('withdrawal', 'deposit', 'transfer')),
  current_fee NUMERIC NOT NULL DEFAULT 0,
  fee_unit TEXT NOT NULL DEFAULT 'crypto', -- 'crypto' or 'gwei' or 'sat'
  priority_level TEXT NOT NULL DEFAULT 'standard', -- 'low', 'standard', 'high'
  estimated_confirmation_time INTEGER, -- in minutes
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blockchain_network_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can view active network fees
CREATE POLICY "Anyone can view active network fees"
  ON public.blockchain_network_fees
  FOR SELECT
  USING (is_active = true);

-- Admins can manage network fees
CREATE POLICY "Admins can manage network fees"
  ON public.blockchain_network_fees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_blockchain_fees_crypto_type ON public.blockchain_network_fees(crypto_symbol, fee_type, is_active);

-- Insert initial blockchain network fees
INSERT INTO public.blockchain_network_fees (crypto_symbol, network, fee_type, current_fee, fee_unit, priority_level, estimated_confirmation_time) VALUES
('BTC', 'mainnet', 'withdrawal', 0.00011, 'BTC', 'standard', 30),
('ETH', 'mainnet', 'withdrawal', 0.002, 'ETH', 'standard', 5),
('USDT', 'TRC20', 'withdrawal', 1, 'USDT', 'standard', 3),
('USDC', 'ERC20', 'withdrawal', 0.002, 'ETH', 'standard', 5);

-- Update existing BTC fee configuration to use the new lower fee
UPDATE public.fee_configurations 
SET fixed_fee_amount = 0.00011,
    updated_at = NOW()
WHERE crypto_symbol = 'BTC' 
  AND transaction_type = 'withdrawal'
  AND fee_type = 'fixed';

-- If no BTC withdrawal fee exists, create it
INSERT INTO public.fee_configurations (
  transaction_type, 
  crypto_symbol, 
  fee_type, 
  fixed_fee_amount, 
  min_fee, 
  notes
)
SELECT 
  'withdrawal', 
  'BTC', 
  'fixed', 
  0.00011, 
  0.00011, 
  'BTC blockchain network fee'
WHERE NOT EXISTS (
  SELECT 1 FROM public.fee_configurations 
  WHERE crypto_symbol = 'BTC' 
    AND transaction_type = 'withdrawal'
);

-- Update trigger for blockchain_network_fees
CREATE OR REPLACE FUNCTION public.update_blockchain_fee_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_blockchain_fee_timestamp
  BEFORE UPDATE ON public.blockchain_network_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blockchain_fee_timestamp();