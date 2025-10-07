-- Towns table (Town Loop)
-- One town per user, tracks progression and slot unlocks

CREATE TABLE towns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Progression
    level INTEGER NOT NULL DEFAULT 1,
    max_slots INTEGER NOT NULL DEFAULT 3,
    
    -- Future: XP, upgrades, etc.
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_towns_user_id ON towns(user_id);