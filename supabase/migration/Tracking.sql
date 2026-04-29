-- Table to track expected deposits for user identification
CREATE TABLE IF NOT EXISTS public.deposit_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    crypto_symbol TEXT NOT NULL,
    expected_amount NUMERIC NOT NULL,
    memo TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.deposit_instructions ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposit instructions
CREATE POLICY "Users can view own deposit instructions"
ON public.deposit_instructions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own deposit instructions
CREATE POLICY "Users can create own deposit instructions"
ON public.deposit_instructions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table to store master wallet configuration
CREATE TABLE IF NOT EXISTS public.master_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crypto_symbol TEXT NOT NULL UNIQUE,
    network TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.master_wallets ENABLE ROW LEVEL SECURITY;

-- Anyone can view active master wallets (needed for deposit addresses)
CREATE POLICY "Anyone can view active master wallets"
ON public.master_wallets
FOR SELECT
USING (is_active = true);

-- Table to track processed blockchain transactions (prevent double-processing)
CREATE TABLE IF NOT EXISTS public.processed_txs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL UNIQUE,
    crypto_symbol TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.processed_txs ENABLE ROW LEVEL SECURITY;

-- Insert USDT TRC20 master wallet configuration (example)
INSERT INTO public.master_wallets (crypto_symbol, network, wallet_address)
VALUES ('USDT', 'TRC20', 'YOUR_MASTER_WALLET_ADDRESS_HERE')
ON CONFLICT (crypto_symbol) DO NOTHING;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deposit_instructions_user_status 
ON public.deposit_instructions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_deposit_instructions_expires 
ON public.deposit_instructions(expires_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_processed_txs_hash 
ON public.processed_txs(tx_hash);

-- Function to expire old deposit instructions
CREATE OR REPLACE FUNCTION expire_old_deposit_instructions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.deposit_instructions
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$;