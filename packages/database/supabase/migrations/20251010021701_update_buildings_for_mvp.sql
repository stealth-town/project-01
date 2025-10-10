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
