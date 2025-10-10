-- Update trades table for MVP Town Loop
-- Add energy_spent, completion_time, tokens_reward
-- Rename/update existing fields

-- Add new columns
ALTER TABLE trades ADD COLUMN IF NOT EXISTS energy_spent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS completion_time TIMESTAMPTZ;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Rename tokens_earned to tokens_reward for consistency
ALTER TABLE trades RENAME COLUMN tokens_earned TO tokens_reward;

-- Rename liquidation_threshold to liquidation_price
ALTER TABLE trades RENAME COLUMN liquidation_threshold TO liquidation_price;

-- For MVP, we'll just use the existing 'pending' as 'building' and rename the column
-- The enum values will be mapped in the application layer for now

-- Rename 'state' to 'status' for consistency
ALTER TABLE trades RENAME COLUMN state TO status;

-- Set default to 'pending' (which we'll treat as 'building' in the app)
ALTER TABLE trades ALTER COLUMN status SET DEFAULT 'pending'::trade_state;

-- Add index for completion_time for worker queries
CREATE INDEX IF NOT EXISTS idx_trades_completion_time ON trades(completion_time) WHERE status = 'active';

-- Update existing index
DROP INDEX IF EXISTS idx_trades_state;
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
