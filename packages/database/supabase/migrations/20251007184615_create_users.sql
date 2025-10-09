-- Users table (The Bridge)
-- Central entity that owns everything

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- TODO - Stuff like wallet address etc is missing in here
    
    -- Currency balances (The River)
    energy_balance INTEGER NOT NULL DEFAULT 30,
    
    -- Mock balances for demo (will move to blockchain later)
    -- TODO remove
    token_balance INTEGER NOT NULL DEFAULT 0, 
    
    -- TODO remove
    usdc_balance DECIMAL(18, 6) NOT NULL DEFAULT 0, 
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);