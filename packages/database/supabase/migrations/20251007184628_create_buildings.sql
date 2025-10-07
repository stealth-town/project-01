-- Buildings table (Town Loop)
-- Represents trade slots/positions owned by town

CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    town_id UUID NOT NULL REFERENCES towns(id) ON DELETE CASCADE,
    
    -- Building slot management
    slot_number INTEGER NOT NULL,
    is_unlocked BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Each town can have multiple buildings but unique slot numbers
    UNIQUE (town_id, slot_number)
);

CREATE INDEX idx_buildings_town_id ON buildings(town_id);
CREATE INDEX idx_buildings_unlocked ON buildings(town_id, is_unlocked);