import type { CharacterId, DungeonRunId, UserId } from "@stealth-town/shared/types";
import { UserRepo } from "../../repos/UserRepo.js";
import { CharacterRepo } from "../../repos/CharacterRepo.js";
import { DungeonRunsRepo, type DungeonRun } from "../../repos/DungeonRunsRepo.js";

export class DungeonService {
    private userRepo: UserRepo;
    private characterRepo: CharacterRepo;
    private dungeonRunsRepo: DungeonRunsRepo;

    constructor() {
        this.userRepo = new UserRepo();
        this.characterRepo = new CharacterRepo();
        this.dungeonRunsRepo = new DungeonRunsRepo();
    }

    /**
     * Get all unclaimed dungeon runs for a character
     */
    async getUnclaimedRuns(characterId: CharacterId): Promise<DungeonRun[]> {
        // Verify character exists
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }

        return await this.dungeonRunsRepo.findUnclaimedByCharacterId(characterId);
    }

    /**
     * Claim rewards for a specific dungeon run
     */
    async claimReward(
        dungeonRunId: DungeonRunId,
        userId: UserId
    ): Promise<{ tokens: number; run: DungeonRun }> {
        // Get the dungeon run
        const run = await this.dungeonRunsRepo.findById(dungeonRunId);
        if (!run) {
            throw new Error("Dungeon run not found");
        }

        // Validate ownership
        if (run.user_id !== userId) {
            throw new Error("Dungeon run does not belong to user");
        }

        // Validate run is finished
        if (!run.finished_at) {
            throw new Error("Dungeon run is not yet finished");
        }

        // Validate run is not already claimed
        if (run.claimed_at) {
            throw new Error("Dungeon run rewards already claimed");
        }

        // Validate reward amount exists
        if (run.reward_amount === null || run.reward_amount === undefined) {
            throw new Error("No reward amount calculated for this run");
        }

        // Mark as claimed
        const updatedRun = await this.dungeonRunsRepo.claim(dungeonRunId);

        // Add tokens to user balance
        await this.userRepo.addCurrency(userId, "tokens", run.reward_amount);

        return {
            tokens: run.reward_amount,
            run: updatedRun,
        };
    }

    /**
     * Claim rewards for all unclaimed dungeon runs for a character
     */
    async claimAllRewards(
        characterId: CharacterId,
        userId: UserId
    ): Promise<{ totalTokens: number; claimedCount: number; runs: DungeonRun[] }> {
        // Verify character belongs to user
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }
        if (character.user_id !== userId) {
            throw new Error("Character does not belong to user");
        }

        // Get all unclaimed runs
        const unclaimedRuns = await this.dungeonRunsRepo.findUnclaimedByCharacterId(characterId);

        if (unclaimedRuns.length === 0) {
            return {
                totalTokens: 0,
                claimedCount: 0,
                runs: [],
            };
        }

        // Calculate total tokens
        const totalTokens = unclaimedRuns.reduce(
            (sum, run) => sum + (run.reward_amount || 0),
            0
        );

        // Mark all as claimed
        const dungeonRunIds = unclaimedRuns.map((run) => run.id);
        const claimedRuns = await this.dungeonRunsRepo.claimMultiple(dungeonRunIds);

        // Add tokens to user balance
        await this.userRepo.addCurrency(userId, "tokens", totalTokens);

        return {
            totalTokens,
            claimedCount: claimedRuns.length,
            runs: claimedRuns,
        };
    }

    /**
     * Get dungeon run by ID
     */
    async getDungeonRun(dungeonRunId: DungeonRunId): Promise<DungeonRun> {
        const run = await this.dungeonRunsRepo.findById(dungeonRunId);
        if (!run) {
            throw new Error("Dungeon run not found");
        }
        return run;
    }

    /**
     * Get all dungeon runs for a character
     */
    async getCharacterRuns(characterId: CharacterId): Promise<DungeonRun[]> {
        const character = await this.characterRepo.findById(characterId);
        if (!character) {
            throw new Error("Character not found");
        }

        return await this.dungeonRunsRepo.findByCharacterId(characterId);
    }
}

