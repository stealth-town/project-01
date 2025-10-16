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
