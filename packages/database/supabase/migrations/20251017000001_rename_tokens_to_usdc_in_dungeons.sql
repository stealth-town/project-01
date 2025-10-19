-- Migration: Rename tokens_earned to usdc_earned in character_dungeons table
-- This changes dungeon rewards from tokens to USDC (0.01 USDC per 1 damage dealt)

-- Rename the column and change its type to match the users.usdc column (DECIMAL(18, 6))
ALTER TABLE character_dungeons
  RENAME COLUMN tokens_earned TO usdc_earned;

-- Change the column type from INTEGER to DECIMAL(18, 6)
ALTER TABLE character_dungeons
  ALTER COLUMN usdc_earned TYPE DECIMAL(18, 6);

-- Update default value to 0.00
ALTER TABLE character_dungeons
  ALTER COLUMN usdc_earned SET DEFAULT 0.00;

-- Add a comment to document the conversion rate
COMMENT ON COLUMN character_dungeons.usdc_earned IS 'USDC earned from dungeon (conversion rate: 0.01 USDC per 1 damage dealt)';
