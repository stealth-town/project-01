-- Update users table for MVP Town Loop
-- Add town_level and update usdc_balance default

-- Add town_level column
ALTER TABLE users ADD COLUMN IF NOT EXISTS town_level INTEGER NOT NULL DEFAULT 1;

-- Update usdc_balance default to 100 for new users (existing users keep their balance)
ALTER TABLE users ALTER COLUMN usdc_balance SET DEFAULT 100;

-- Rename balance columns for consistency
ALTER TABLE users RENAME COLUMN energy_balance TO energy;
ALTER TABLE users RENAME COLUMN token_balance TO tokens;
ALTER TABLE users RENAME COLUMN usdc_balance TO usdc;

-- Update existing users with 0 usdc to have 100 (for testing)
UPDATE users SET usdc = 100 WHERE usdc = 0;
