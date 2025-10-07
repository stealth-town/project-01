-- Dungeon Runs table (Combat Loop)
-- Tracks combat sessions and reward claims

CREATE TABLE dungeon_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Combat tracking
    starting_damage_rating INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    
    -- Reward tracking 
    reward_amount DECIMAL(18, 6),

    -- TODO - in here we should track different types of rewards, is it tokens, usdc whatever
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ, -- When dungeon completes and rewards become claimable
    claimed_at TIMESTAMPTZ,  -- When user actually claims rewards
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dungeon_runs_character_id ON dungeon_runs(character_id);
CREATE INDEX idx_dungeon_runs_user_id ON dungeon_runs(user_id);
CREATE INDEX idx_dungeon_runs_claimable ON dungeon_runs(finished_at, claimed_at) 
    WHERE finished_at IS NOT NULL AND claimed_at IS NULL;