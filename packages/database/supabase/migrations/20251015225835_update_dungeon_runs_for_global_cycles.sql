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
