import type { CharacterId, UserId } from "@stealth-town/shared/types";
export interface CharacterDungeonData {
    id?: string;
    character_id: CharacterId;
    dungeon_run_id: string;
    user_id: UserId;
    starting_damage_rating: number;
    total_damage_dealt?: number;
    tokens_earned?: number;
    joined_at?: string;
    finished_at?: string | null;
    claimed_at?: string | null;
}
export declare class CharacterDungeonRepo {
    /**
     * Create a new character dungeon entry
     */
    create(data: CharacterDungeonData): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Find character dungeon by ID
     */
    findById(id: string): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Find active character dungeon for a character
     */
    findActiveByCharacterId(characterId: CharacterId): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    } | null>;
    /**
     * Find all character dungeons for a specific dungeon run
     */
    findByDungeonRunId(dungeonRunId: string): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }[]>;
    /**
     * Find all active character dungeons (across all characters in a dungeon run)
     */
    findAllActive(): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }[]>;
    /**
     * Find unclaimed character dungeons for a character
     */
    findUnclaimedByCharacterId(characterId: CharacterId): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }[]>;
    /**
     * Update character dungeon
     */
    update(id: string, updates: Partial<CharacterDungeonData>): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Increment damage dealt and tokens earned
     */
    incrementDamage(id: string, damageAmount: number): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Mark character dungeon as finished
     */
    finish(id: string): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Mark character dungeon as claimed
     */
    claim(id: string): Promise<{
        character_id: string;
        claimed_at: string | null;
        created_at: string;
        dungeon_run_id: string;
        finished_at: string | null;
        id: string;
        joined_at: string;
        starting_damage_rating: number;
        tokens_earned: number;
        total_damage_dealt: number;
        updated_at: string;
        user_id: string;
    }>;
    /**
     * Get total stats for a character (all-time)
     */
    getCharacterStats(characterId: CharacterId): Promise<{
        totalDamage: number;
        totalTokens: number;
        totalRuns: number;
    }>;
}
//# sourceMappingURL=CharacterDungeonRepo.d.ts.map