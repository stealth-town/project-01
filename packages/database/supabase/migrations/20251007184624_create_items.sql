-- Items table (Upgrade Loop)
-- Inventory and equipment for characters

CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'accessory', 'helmet', 'boots', 'gloves');

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    item_type item_type NOT NULL,
    damage_contribution INTEGER NOT NULL,
    
    -- Equipment state
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_slot INTEGER CHECK (equipped_slot BETWEEN 1 AND 6),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one item per slot
    UNIQUE (character_id, equipped_slot)
);

CREATE INDEX idx_items_character_id ON items(character_id);
CREATE INDEX idx_items_equipped ON items(character_id, is_equipped);