import type { CharacterId, UserId } from "@stealth-town/shared/types";
export declare class DungeonService {
    private userRepo;
    private characterRepo;
    private dungeonRunsRepo;
    private characterDungeonRepo;
    private dungeonEventRepo;
    constructor();
    /**
     * Get active character dungeon for a character
     */
    getActiveCharacterDungeon(characterId: CharacterId): Promise<{
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
     * Get active dungeon with character dungeon data
     */
    getActiveDungeonStatus(characterId: CharacterId): Promise<{
        characterDungeon: {
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
        };
        dungeonRun: import("../../repos/DungeonRunsRepo.js").DungeonRun;
    } | null>;
    /**
     * Get unclaimed character dungeons for a character
     */
    getUnclaimedDungeons(characterId: CharacterId): Promise<{
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
     * Get all-time stats for a character
     */
    getCharacterStats(characterId: CharacterId): Promise<{
        totalDamage: number;
        totalTokens: number;
        totalRuns: number;
    }>;
    /**
     * Get dungeon events (combat log) for a character dungeon
     */
    getDungeonEvents(characterDungeonId: string, limit?: number): Promise<{
        character_dungeon_id: string;
        created_at: string;
        damage_dealt: number;
        id: string;
    }[]>;
    /**
     * Claim rewards for a character dungeon
     */
    claimDungeonReward(characterDungeonId: string, userId: UserId): Promise<{
        tokens: number;
        characterDungeon: {
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
        };
    }>;
    /**
     * Claim all unclaimed rewards for a character
     */
    claimAllRewards(characterId: CharacterId, userId: UserId): Promise<{
        totalTokens: number;
        claimedCount: number;
        dungeons: {
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
        }[];
    }>;
    /**
     * Create a character dungeon entry for a character in a dungeon run
     * Called by dungeon worker when enrolling characters
     */
    enrollCharacterInDungeon(characterId: CharacterId, dungeonRunId: string): Promise<{
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
     * Record a hit for a character dungeon
     * Called by dungeon worker every 5 seconds
     */
    recordHit(characterDungeonId: string, damage: number): Promise<{
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
     * Finish a character dungeon
     * Called by dungeon worker when dungeon ends
     */
    finishCharacterDungeon(characterDungeonId: string): Promise<{
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
     * Get all active character dungeons
     * Used by dungeon worker to process hits
     */
    getAllActiveCharacterDungeons(): Promise<{
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
    createDungeonRunIfNeeded(characterId: CharacterId): Promise<void>;
}
//# sourceMappingURL=DungeonService.d.ts.map