import type { CharacterId, UserId, DungeonRunId } from "@stealth-town/shared/types";
export interface DungeonRunData {
    id?: DungeonRunId;
    character_id: CharacterId;
    user_id: UserId;
    duration_seconds: number;
    starting_damage_rating: number;
    started_at?: string;
    finished_at?: string | null;
    claimed_at?: string | null;
    reward_amount?: number | null;
}
export interface DungeonRun {
    id: string;
    character_id: CharacterId;
    user_id: UserId;
    duration_seconds: number;
    starting_damage_rating: number;
    started_at: string;
    finished_at: string | null;
    claimed_at: string | null;
    reward_amount: number | null;
    created_at: string;
    updated_at: string;
}
export declare class DungeonRunsRepo {
    /**
     * Find dungeon run by ID
     */
    findById(dungeonRunId: DungeonRunId): Promise<DungeonRun>;
    /**
     * Find all dungeon runs for a character
     */
    findByCharacterId(characterId: CharacterId): Promise<DungeonRun[]>;
    /**
     * Find all dungeon runs for a user
     */
    findByUserId(userId: UserId): Promise<DungeonRun[]>;
    /**
     * Find the currently active dungeon run for a character
     * (one that has started but not finished)
     */
    findActiveByCharacterId(characterId: CharacterId): Promise<DungeonRun | null>;
    /**
     * Find all active dungeon runs
     */
    findAllActive(): Promise<DungeonRun[]>;
    /**
     * Find finished but unclaimed dungeon runs for a character
     */
    findUnclaimedByCharacterId(characterId: CharacterId): Promise<DungeonRun[]>;
    /**
     * Find all dungeon runs that should be finished but haven't been marked as finished
     * (started_at + duration_seconds < now and finished_at is null)
     */
    findExpiredRuns(): Promise<DungeonRun[]>;
    /**
     * Create a new dungeon run
     */
    create(dungeonRunData: DungeonRunData): Promise<DungeonRun>;
    /**
     * Update a dungeon run
     */
    update(dungeonRunId: DungeonRunId, updates: Partial<DungeonRunData>): Promise<DungeonRun>;
    /**
     * Mark a dungeon run as finished and set the reward amount
     */
    finish(dungeonRunId: DungeonRunId, rewardAmount: number): Promise<DungeonRun>;
    /**
     * Mark a dungeon run as claimed
     */
    claim(dungeonRunId: DungeonRunId): Promise<DungeonRun>;
    /**
     * Mark multiple dungeon runs as claimed
     */
    claimMultiple(dungeonRunIds: DungeonRunId[]): Promise<DungeonRun[]>;
    /**
     * Delete a dungeon run
     */
    delete(dungeonRunId: DungeonRunId): Promise<DungeonRun>;
    /**
     * Get all dungeon runs (for admin purposes)
     */
    findAll(limit?: number): Promise<DungeonRun[]>;
    /**
     * Count total dungeon runs for a user
     */
    countByUserId(userId: UserId): Promise<number>;
    /**
     * Count completed dungeon runs for a character
     */
    countCompletedByCharacterId(characterId: CharacterId): Promise<number>;
}
//# sourceMappingURL=DungeonRunsRepo.d.ts.map