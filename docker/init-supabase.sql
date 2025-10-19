-- Assets table for the assets we allow to be traded

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    decimals INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_name ON assets(name);
CREATE INDEX idx_assets_symbol ON assets(symbol);

-- Default assets for now (only one) - ETH
INSERT INTO assets (name, symbol, decimals) VALUES ('Ethereum', 'ETH', 18);-- Empty migration
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
);-- Characters table (Upgrade Loop)
-- One character per user, tracks damage rating

CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Cached damage rating (recalculated on equipment changes)
    damage_rating INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);-- Items table (Upgrade Loop)
-- Inventory and equipment for characters

CREATE TYPE item_type AS ENUM ('weapon', 'armor', 'accessory', 'helmet', 'boots', 'gloves');

CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    
    item_type item_type NOT NULL,
    damage_contribution INTEGER NOT NULL,
    
    -- Equipment state
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    equipped_slot INTEGER CHECK (equipped_slot BETWEEN 1 AND 6), -- TODO - 
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one item per slot
    UNIQUE (character_id, equipped_slot)
);

CREATE INDEX idx_items_character_id ON items(character_id);
CREATE INDEX idx_items_equipped ON items(character_id, is_equipped);-- Towns table (Town Loop)
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

CREATE INDEX idx_towns_user_id ON towns(user_id);-- Buildings table (Town Loop)
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
CREATE INDEX idx_buildings_unlocked ON buildings(town_id, is_unlocked);-- Trades table (Town Loop)
-- Represents individual trade executions/positions

CREATE TYPE risk_mode AS ENUM (
    'turtle',
    'walk',
    'cheetah'
);

CREATE TYPE trade_state AS ENUM (
    'pending',
    'active',
    'completed',
    'liquidated',
    'processing',
    'stale' -- For logging purposes
);

CREATE TYPE trade_claimed AS ENUM (
    'unclaimed',
    'claimed',
    'non_applicable'
);


CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    risk_mode risk_mode NOT NULL,
    claimed trade_claimed NOT NULL DEFAULT 'unclaimed',
    state trade_state NOT NULL DEFAULT 'pending',
    
    -- Trade execution details
    entry_price DECIMAL(18, 6),
    liquidation_threshold DECIMAL(18, 6),
    
    -- Outcome tracking
    tokens_earned INTEGER DEFAULT 0,

    -- Asset details
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_building_id ON trades(building_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_state ON trades(state);
CREATE INDEX idx_trades_active ON trades(state, started_at) WHERE state = 'active';-- Dungeon Runs table (Combat Loop)
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
    WHERE finished_at IS NOT NULL AND claimed_at IS NULL;-- Triggers for automatic updated_at timestamps

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_towns_updated_at 
    BEFORE UPDATE ON towns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at 
    BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dungeon_runs_updated_at 
    BEFORE UPDATE ON dungeon_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-- Update users table for MVP Town Loop
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
-- Update buildings table for MVP Town Loop
-- Change from town_id to user_id, add status enum

-- Create building status enum
CREATE TYPE building_status AS ENUM (
    'idle',
    'active',
    'completed',
    'liquidated'
);

-- Drop the old foreign key constraint to town_id
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_town_id_fkey;

-- Add user_id column
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS user_id UUID;

-- Copy town's user_id to building's user_id (migrate existing data)
UPDATE buildings b
SET user_id = t.user_id
FROM towns t
WHERE b.town_id = t.id;

-- Make user_id NOT NULL after data migration
ALTER TABLE buildings ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to users
ALTER TABLE buildings ADD CONSTRAINT buildings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add status column
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS status building_status NOT NULL DEFAULT 'idle';

-- Drop town_id column (no longer needed for MVP)
ALTER TABLE buildings DROP COLUMN IF EXISTS town_id;

-- Drop is_unlocked column (not needed for MVP)
ALTER TABLE buildings DROP COLUMN IF EXISTS is_unlocked;

-- Update unique constraint (user_id + slot_number)
ALTER TABLE buildings DROP CONSTRAINT IF EXISTS buildings_town_id_slot_number_key;
ALTER TABLE buildings ADD CONSTRAINT buildings_user_slot_unique UNIQUE (user_id, slot_number);

-- Update index
DROP INDEX IF EXISTS idx_buildings_town_id;
DROP INDEX IF EXISTS idx_buildings_unlocked;
CREATE INDEX IF NOT EXISTS idx_buildings_user_id ON buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings(status);
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
-- Create energy_purchases table for tracking energy purchases

CREATE TYPE energy_package AS ENUM (
    'small',   -- 1 energy / 1 USDC
    'medium',  -- 11 energy / 10 USDC
    'large'    -- 60 energy / 50 USDC
);

CREATE TABLE energy_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    package_type energy_package NOT NULL,
    energy_amount INTEGER NOT NULL,
    usdc_cost DECIMAL(18, 6) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_energy_purchases_user_id ON energy_purchases(user_id);
CREATE INDEX idx_energy_purchases_created_at ON energy_purchases(created_at DESC);
-- Create building_purchases table for tracking building purchases

CREATE TABLE building_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

    usdc_cost DECIMAL(18, 6) NOT NULL DEFAULT 100,
    slot_number INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_building_purchases_user_id ON building_purchases(user_id);
CREATE INDEX idx_building_purchases_building_id ON building_purchases(building_id);
CREATE INDEX idx_building_purchases_created_at ON building_purchases(created_at DESC);
-- Character Dungeons Table
-- Tracks each character's participation in a specific dungeon run
-- One row per character per dungeon run

CREATE TABLE character_dungeons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    dungeon_run_id UUID NOT NULL REFERENCES dungeon_runs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Snapshot of character stats when entering dungeon (locked for duration)
    starting_damage_rating INTEGER NOT NULL DEFAULT 0,

    -- Accumulated damage and rewards during this run
    total_damage_dealt INTEGER NOT NULL DEFAULT 0,
    tokens_earned INTEGER NOT NULL DEFAULT 0,

    -- Status tracking
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one character per dungeon run
    UNIQUE (character_id, dungeon_run_id)
);

CREATE INDEX idx_character_dungeons_character_id ON character_dungeons(character_id);
CREATE INDEX idx_character_dungeons_dungeon_run_id ON character_dungeons(dungeon_run_id);
CREATE INDEX idx_character_dungeons_user_id ON character_dungeons(user_id);
CREATE INDEX idx_character_dungeons_unclaimed ON character_dungeons(character_id, claimed_at) WHERE claimed_at IS NULL;
CREATE INDEX idx_character_dungeons_active ON character_dungeons(character_id, finished_at) WHERE finished_at IS NULL;


-- Dungeon Events Table
-- Stores individual combat hits/events during a dungeon run
-- One row per hit (every 5 seconds)

CREATE TABLE dungeon_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_dungeon_id UUID NOT NULL REFERENCES character_dungeons(id) ON DELETE CASCADE,

    -- Hit details
    damage_dealt INTEGER NOT NULL,

    -- Timestamp of when this hit occurred
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dungeon_events_character_dungeon_id ON dungeon_events(character_dungeon_id);
CREATE INDEX idx_dungeon_events_created_at ON dungeon_events(created_at DESC);

-- Enable real-time for dungeon_events so frontend can subscribe to new hits
-- ALTER PUBLICATION supabase_realtime ADD TABLE dungeon_events;
-- Update dungeon_runs table for global cycle system
-- Dungeon runs are now global events that multiple characters participate in
-- Character-specific data is tracked in character_dungeons table

-- Drop the foreign key constraints and make user_id/character_id nullable
ALTER TABLE dungeon_runs DROP CONSTRAINT IF EXISTS dungeon_runs_character_id_fkey;
ALTER TABLE dungeon_runs DROP CONSTRAINT IF EXISTS dungeon_runs_user_id_fkey;

-- Make user_id and character_id nullable since dungeon runs are now global
ALTER TABLE dungeon_runs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE dungeon_runs ALTER COLUMN character_id DROP NOT NULL;

-- Remove starting_damage_rating since it's character-specific (stored in character_dungeons)
ALTER TABLE dungeon_runs DROP COLUMN IF EXISTS starting_damage_rating;

-- Remove reward columns since rewards are character-specific (stored in character_dungeons)
ALTER TABLE dungeon_runs DROP COLUMN IF EXISTS reward_amount;
ALTER TABLE dungeon_runs DROP COLUMN IF EXISTS claimed_at;

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_dungeon_runs_character_id;
DROP INDEX IF EXISTS idx_dungeon_runs_user_id;
DROP INDEX IF EXISTS idx_dungeon_runs_claimable;

-- Add index for active/finished runs
CREATE INDEX idx_dungeon_runs_finished ON dungeon_runs(finished_at);
-- Drop table and enum if they already exist (optional safety)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_category_enum') THEN
        DROP TYPE item_category_enum;
    END IF;
END$$;

DROP TABLE IF EXISTS concrete_items;

-- Create enum type for item categories
CREATE TYPE item_category_enum AS ENUM (
    'helmet',
    'weapon1',
    'weapon2',
    'boots',
    'trinket',
    'armor'
);

-- Create concrete_items table using enum for category
CREATE TABLE concrete_items (
    id SERIAL PRIMARY KEY,
    category item_category_enum NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    dmg INT NOT NULL
);

-- Insert Helmets
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('helmet', 'Rusted Iron Helm', 2),
('helmet', 'Raider’s Hood', 4),
('helmet', 'Guardian Visor', 6),
('helmet', 'Dragonbone Helm', 8),
('helmet', 'Celestial Crown', 10);

-- Insert Weapon1
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('weapon1', 'Broken Shortsword', 10),
('weapon1', 'Steel Saber', 12),
('weapon1', 'Runed Greatblade', 14),
('weapon1', 'Emberfang Katana', 16),
('weapon1', 'Oblivion Edge', 18);

-- Insert Weapon2
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('weapon2', 'Wooden Dagger', 8),
('weapon2', 'Twin Iron Fangs', 10),
('weapon2', 'Venom Kris', 12),
('weapon2', 'Nightstalker Blades', 14),
('weapon2', 'Specter’s Scythe', 16);

-- Insert Boots
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('boots', 'Muddy Boots', 4),
('boots', 'Swiftstep Sandals', 6),
('boots', 'Tracker’s Greaves', 8),
('boots', 'Shadowrunner Boots', 10),
('boots', 'Phoenix Striders', 12);

-- Insert Trinkets
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('trinket', 'Cracked Pendant', 6),
('trinket', 'Emberstone Charm', 8),
('trinket', 'Blood Opal Ring', 10),
('trinket', 'Soul Prism', 12),
('trinket', 'Chrono Relic', 14);

-- Insert Armors
INSERT INTO concrete_items (category, item_name, dmg) VALUES
('armor', 'Worn Leather Vest', 6),
('armor', 'Chainmail Hauberk', 8),
('armor', 'Obsidian Plate', 10),
('armor', 'Warlord’s Aegis', 12),
('armor', 'Divine Bulwark', 14);


ALTER TABLE items ADD COLUMN concrete_item_id INT REFERENCES concrete_items(id);
CREATE TYPE item_rarity_enum AS ENUM (
    'common',
    'rare',
    'epic',
    'legendary'
);
ALTER TABLE items ADD COLUMN rarity item_rarity_enum NOT NULL DEFAULT 'common';
ALTER TABLE items DROP COLUMN item_type;

-- Add slot type validation to enforce item category matches equipment slot
-- Slot mappings:
-- 1: helmet
-- 2: weapon1
-- 3: weapon2
-- 4: boots
-- 5: trinket
-- 6: armor

-- Create a function to validate item can be equipped in slot
CREATE OR REPLACE FUNCTION validate_item_slot()
RETURNS TRIGGER AS $$
DECLARE
    item_category item_category_enum;
    expected_category item_category_enum;
BEGIN
    -- Only validate when item is being equipped
    IF NEW.is_equipped = true AND NEW.equipped_slot IS NOT NULL THEN
        -- Get the item's category from concrete_items
        SELECT ci.category INTO item_category
        FROM concrete_items ci
        WHERE ci.id = NEW.concrete_item_id;

        -- Determine expected category for the slot
        expected_category := CASE NEW.equipped_slot
            WHEN 1 THEN 'helmet'::item_category_enum
            WHEN 2 THEN 'weapon1'::item_category_enum
            WHEN 3 THEN 'weapon2'::item_category_enum
            WHEN 4 THEN 'boots'::item_category_enum
            WHEN 5 THEN 'trinket'::item_category_enum
            WHEN 6 THEN 'armor'::item_category_enum
            ELSE NULL
        END;

        -- Validate category matches slot
        IF item_category != expected_category THEN
            RAISE EXCEPTION 'Item category % cannot be equipped in slot % (expected %)',
                item_category, NEW.equipped_slot, expected_category;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate slot type before insert/update
DROP TRIGGER IF EXISTS validate_item_slot_trigger ON items;
CREATE TRIGGER validate_item_slot_trigger
    BEFORE INSERT OR UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION validate_item_slot();

-- Add comment for documentation
COMMENT ON FUNCTION validate_item_slot() IS 'Validates that items can only be equipped in slots matching their category type';
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
