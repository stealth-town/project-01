-- Trades table (Town Loop)
-- Represents individual trade executions/positions

CREATE TYPE risk_mode AS ENUM ('turtle', 'walk', 'cheetah');
CREATE TYPE trade_state AS ENUM ('pending', 'active', 'completed', 'liquidated');

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    risk_mode risk_mode NOT NULL,
    state trade_state NOT NULL DEFAULT 'pending',
    
    -- Trade execution details
    entry_price DECIMAL(18, 6),
    liquidation_threshold DECIMAL(18, 6),
    
    -- Outcome tracking
    tokens_earned INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_building_id ON trades(building_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_state ON trades(state);
CREATE INDEX idx_trades_active ON trades(state, started_at) WHERE state = 'active';